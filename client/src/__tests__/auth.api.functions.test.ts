import api from '../services/api';
import * as auth from '../services/auth.api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('auth.api functions', () => {
  const origLocalStorage = global.localStorage;
  let mockLocalStorage: any;

  beforeEach(() => {
    const store: Record<string, string> = {};
    mockLocalStorage = {
      getItem: jest.fn((k: string) => store[k] ?? null),
      setItem: jest.fn((k: string, v: string) => { store[k] = v; }),
      removeItem: jest.fn((k: string) => { delete store[k]; }),
    } as any;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      value: mockLocalStorage,
    });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        enumerable: true,
        value: mockLocalStorage,
      });
    }

    (auth.getProfile as any)._cache = undefined;
    (auth.getProfile as any)._cacheAt = 0;
    mockedApi.post.mockReset();
    mockedApi.get.mockReset();
    mockedApi.put && mockedApi.put.mockReset && mockedApi.put.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      value: origLocalStorage,
    });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        enumerable: true,
        value: origLocalStorage,
      });
    }
    jest.resetAllMocks();
  });

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const payload = { displayName: 'New Name', email: 'new@email.com' };
      const userData = { ...payload, id: 'u1' };
      mockedApi.put.mockResolvedValueOnce({ data: { data: userData } } as any);

      const result = await auth.updateProfile(payload);

      expect(result).toEqual(userData);
      expect(mockedApi.put).toHaveBeenCalledWith('/auth/me', payload);
    });

    it('handles profile update error', async () => {
      mockedApi.put.mockRejectedValueOnce(new Error('Update failed'));

      await expect(auth.updateProfile({})).rejects.toThrow('Update failed');
    });
  });

  describe('requestVerification', () => {
    it('requests seller verification successfully', async () => {
      const payload = {
        idCardImage: 'base64_id_card',
        selfieImage: 'base64_selfie'
      };
      const result = { status: 'pending' };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.requestVerification(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/verification-request', payload);
    });

    it('includes optional business document in verification request', async () => {
      const payload = {
        idCardImage: 'id',
        selfieImage: 'selfie',
        businessDocument: 'biz_doc'
      };
      mockedApi.post.mockResolvedValueOnce({ data: { data: { status: 'pending' } } } as any);

      await auth.requestVerification(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/verification-request', expect.objectContaining({ businessDocument: 'biz_doc' }));
    });

    it('includes optional details in verification request', async () => {
      const payload = {
        idCardImage: 'id',
        selfieImage: 'selfie',
        details: 'Additional context'
      };
      mockedApi.post.mockResolvedValueOnce({ data: { data: { status: 'pending' } } } as any);

      await auth.requestVerification(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/verification-request', expect.objectContaining({ details: 'Additional context' }));
    });

    it('propagates verification request error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Verification failed'));

      await expect(auth.requestVerification({
        idCardImage: 'id',
        selfieImage: 'selfie'
      })).rejects.toThrow('Verification failed');
    });
  });

  describe('getVerificationStatus', () => {
    it('retrieves verification status successfully', async () => {
      const status = { verified: true, verifiedAt: '2024-01-01' };
      mockedApi.get.mockResolvedValueOnce({ data: { data: status } } as any);

      const result = await auth.getVerificationStatus();

      expect(result).toEqual(status);
      expect(mockedApi.get).toHaveBeenCalledWith('/verification/status');
    });

    it('returns pending status when not verified', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: { verified: false, status: 'pending' } } } as any);

      const result = await auth.getVerificationStatus();

      expect(result.verified).toBe(false);
      expect(mockedApi.get).toHaveBeenCalledWith('/verification/status');
    });

    it('handles verification status retrieval error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Status check failed'));

      await expect(auth.getVerificationStatus()).rejects.toThrow('Status check failed');
    });
  });

  describe('verifyPhoneOtp', () => {
    it('verifies phone OTP and stores tokens', async () => {
      const payload = { phoneNumber: '+855123456789', code: '123456' };
      const data = { user: { id: 'u1' }, accessToken: 'token', refreshToken: 'refresh' };
      mockedApi.post.mockResolvedValueOnce({ data: { success: true, data } } as any);

      const result = await auth.verifyPhoneOtp(payload);

      expect(result).toEqual(data);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh');
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/phone/verify-otp', payload);
    });

    it('handles phone OTP verification failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Invalid code'));

      await expect(auth.verifyPhoneOtp({
        phoneNumber: '+855123456789',
        code: 'wrong'
      })).rejects.toThrow('Invalid code');
    });
  });

  describe('requestPhoneOtp', () => {
    it('requests phone OTP successfully', async () => {
      const payload = { phoneNumber: '+855123456789' };
      const result = { expiresIn: 600 };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.requestPhoneOtp(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/phone/request-otp', payload);
    });

    it('handles phone OTP request error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Rate limited'));

      await expect(auth.requestPhoneOtp({
        phoneNumber: '+855123456789'
      })).rejects.toThrow('Rate limited');
    });
  });

  describe('resendPhoneOtp', () => {
    it('resends phone OTP successfully', async () => {
      const payload = { phoneNumber: '+855123456789' };
      const result = { expiresIn: 600, resendCooldownSeconds: 30 };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.resendPhoneOtp(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/phone/resend-otp', payload);
    });
  });

  describe('verifyPasswordResetOtp', () => {
    it('verifies password reset OTP successfully', async () => {
      const payload = { identifier: 'user@email.com', code: '123456' };
      const result = { valid: true };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.verifyPasswordResetOtp(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/password-reset/verify', payload);
    });

    it('returns invalid when OTP is wrong', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { data: { valid: false } } } as any);

      const result = await auth.verifyPasswordResetOtp({
        identifier: 'user@email.com',
        code: 'wrong'
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('resets password successfully', async () => {
      const payload = { identifier: 'user@email.com', code: '123456', password: 'newpass' };
      const result = { success: true };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.resetPassword(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/password-reset/confirm', payload);
    });

    it('handles password reset error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Invalid code'));

      await expect(auth.resetPassword({
        identifier: 'user@email.com',
        code: '123456',
        password: 'newpass'
      })).rejects.toThrow('Invalid code');
    });
  });

  describe('requestPasswordReset', () => {
    it('requests password reset successfully', async () => {
      const payload = { identifier: 'user@email.com' };
      const result = { expiresIn: 600, resendCooldownSeconds: 60 };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.requestPasswordReset(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/password-reset/request', payload);
    });
  });

  describe('resendPasswordResetCode', () => {
    it('resends password reset code successfully', async () => {
      const payload = { identifier: 'user@email.com' };
      const result = { expiresIn: 600, resendCooldownSeconds: 60 };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.resendPasswordResetCode(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/password-reset/resend', payload);
    });
  });

  describe('verifyEmailCode', () => {
    it('verifies email code successfully', async () => {
      const payload = { identifier: 'user@email.com', code: '123456' };
      const result = { verified: true };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.verifyEmailCode(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register/verify', payload);
    });

    it('returns unverified when code is wrong', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { data: { verified: false } } } as any);

      const result = await auth.verifyEmailCode({
        identifier: 'user@email.com',
        code: 'wrong'
      });

      expect(result.verified).toBe(false);
    });
  });

  describe('resendEmailVerificationCode', () => {
    it('resends email verification code successfully', async () => {
      const payload = { identifier: 'user@email.com' };
      const result = { requiresEmailVerification: true, expiresIn: 600 };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.resendEmailVerificationCode(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register/verify/resend', payload);
    });
  });

  describe('verifyLoginOtp', () => {
    it('verifies login OTP and stores tokens', async () => {
      const payload = { identifier: 'user@email.com', code: '123456' };
      const data = { user: { id: 'u1' }, accessToken: 'token', refreshToken: 'refresh' };
      mockedApi.post.mockResolvedValueOnce({ data: { success: true, data } } as any);

      const result = await auth.verifyLoginOtp(payload);

      expect(result).toEqual(data);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh');
    });
  });

  describe('resendLoginOtp', () => {
    it('resends login OTP successfully', async () => {
      const payload = { identifier: 'user@email.com' };
      const result = { requiresOtp: true, expiresIn: 600 };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.resendLoginOtp(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login/resend', payload);
    });
  });

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      const payload = { currentPassword: 'old', newPassword: 'new' };
      const result = { success: true };
      mockedApi.post.mockResolvedValueOnce({ data: { data: result } } as any);

      const response = await auth.changePassword(payload);

      expect(response).toEqual(result);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/change-password', payload);
    });

    it('handles password change error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Current password incorrect'));

      await expect(auth.changePassword({
        currentPassword: 'wrong',
        newPassword: 'new'
      })).rejects.toThrow('Current password incorrect');
    });
  });
});
