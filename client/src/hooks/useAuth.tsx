import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  register as registerApi,
  login as loginApi,
  verifyLoginOtp as verifyLoginOtpApi,
  logout as logoutApi,
  getProfile as getProfileApi,
  AuthResponse,
  LoginOtpResponse,
  LoginPayload,
  EmailVerificationResponse
} from '../services/auth.api';

export interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
  phoneVerified?: boolean;
  sellerVerificationStatus?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: AuthUser | null;
  authToken: string | null;
  isAuthenticated: boolean;
  register: (payload: { displayName: string; email?: string; password: string; phoneNumber: string }) => Promise<AuthResponse | EmailVerificationResponse>;
  login: (payload: LoginPayload) => Promise<AuthResponse | LoginOtpResponse>;
  verifyLoginOtp: (payload: { identifier: string; code: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUser = (): AuthUser | null => {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const getStoredToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [authToken, setAuthToken] = useState<string | null>(getStoredToken);
  const [restoreAttempted, setRestoreAttempted] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setUser(getStoredUser());
      setAuthToken(getStoredToken());
    };

    const handleSessionExpired = () => {
      setUser(null);
      setAuthToken(null);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (restoreAttempted) {
      return;
    }

    if (user && authToken) {
      setRestoreAttempted(true);
      return;
    }

    const restoreUserFromProfile = async () => {
      setRestoreAttempted(true);
      try {
        const profile = await getProfileApi();
        if (profile) {
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch {
        if (!authToken) {
          setUser(null);
          localStorage.removeItem('user');
        }
      }
    };

    restoreUserFromProfile();
  }, [user, authToken, restoreAttempted]);

  const login = async (payload: LoginPayload): Promise<AuthResponse | LoginOtpResponse> => {
    const response = await loginApi(payload);
    if (response && !('requiresOtp' in response)) {
      setUser(response.user);
      setAuthToken(response.accessToken || response.authToken || (response as any).token || null);
    }
    return response;
  };

  const verifyLoginOtp = async (payload: { identifier: string; code: string }): Promise<AuthResponse> => {
    const response = await verifyLoginOtpApi(payload);
    if (response) {
      setUser(response.user);
      setAuthToken(response.accessToken || response.authToken || (response as any).token || null);
    }
    return response;
  };

  const register = async (payload: { displayName: string; email?: string; password: string; phoneNumber: string }) => {
    const response = await registerApi(payload);
    if (response && !('requiresEmailVerification' in response)) {
      setUser(response.user);
      setAuthToken(response.accessToken || response.authToken || (response as any).token || null);
    }
    return response;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort cleanup when server logout fails.
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setAuthToken(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      authToken,
      isAuthenticated: Boolean(user && authToken),
      register,
      login,
      verifyLoginOtp,
      logout,
      setUser
    }),
    [user, authToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
