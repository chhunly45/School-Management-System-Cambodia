import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
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

const persistSession = (nextUser: AuthUser | null, nextToken: string | null, nextRefreshToken: string | null = null) => {
  if (nextUser) {
    localStorage.setItem('user', JSON.stringify(nextUser));
  } else {
    localStorage.removeItem('user');
  }

  if (nextToken) {
    localStorage.setItem('authToken', nextToken);
  } else {
    localStorage.removeItem('authToken');
  }

  if (nextRefreshToken) {
    localStorage.setItem('refreshToken', nextRefreshToken);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

const clearStoredSession = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [authToken, setAuthToken] = useState<string | null>(getStoredToken);
  const [restoreAttempted, setRestoreAttempted] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  const setAuthSession = useCallback((nextUser: AuthUser | null, nextToken: string | null, nextRefreshToken: string | null = null) => {
    setUser(nextUser);
    setAuthToken(nextToken);
    persistSession(nextUser, nextToken, nextRefreshToken);
  }, []);

  const clearAuthSession = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    clearStoredSession();
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setUser(getStoredUser());
      setAuthToken(getStoredToken());
    };

    const handleSessionExpired = () => {
      clearAuthSession();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (restoreAttempted || isRestoringSession) {
      return;
    }

    const persistedUser = getStoredUser();
    const persistedToken = getStoredToken();

    if (persistedUser && persistedToken) {
      setRestoreAttempted(true);
      return;
    }

    const restoreUserFromProfile = async () => {
      setIsRestoringSession(true);
      try {
        const profile = await getProfileApi();
        if (profile) {
          const mergedUser = {
            ...(persistedUser || {}),
            ...profile,
            role: profile.role || persistedUser?.role || (profile as any)?.user?.role
          } as AuthUser;
          setAuthSession(mergedUser, persistedToken || getStoredToken(), localStorage.getItem('refreshToken'));
        } else if (persistedUser && persistedToken) {
          setAuthSession(persistedUser, persistedToken, localStorage.getItem('refreshToken'));
        } else {
          clearAuthSession();
        }
      } catch {
        if (persistedUser && persistedToken) {
          setAuthSession(persistedUser, persistedToken, localStorage.getItem('refreshToken'));
        } else {
          clearAuthSession();
        }
      } finally {
        setRestoreAttempted(true);
        setIsRestoringSession(false);
      }
    };

    restoreUserFromProfile();
  }, [authToken, user, restoreAttempted, isRestoringSession, setAuthSession, clearAuthSession]);

  const login = async (payload: LoginPayload): Promise<AuthResponse | LoginOtpResponse> => {
    const response = await loginApi(payload);
    if (response && !('requiresOtp' in response)) {
      setAuthSession(response.user || null, response.accessToken || response.authToken || (response as any).token || null, (response as any).refreshToken || null);
    }
    return response;
  };

  const verifyLoginOtp = async (payload: { identifier: string; code: string }): Promise<AuthResponse> => {
    const response = await verifyLoginOtpApi(payload);
    if (response) {
      setAuthSession(response.user || null, response.accessToken || response.authToken || (response as any).token || null, (response as any).refreshToken || null);
    }
    return response;
  };

  const register = async (payload: { displayName: string; email?: string; password: string; phoneNumber: string }) => {
    const response = await registerApi(payload);
    if (response && !('requiresEmailVerification' in response)) {
      setAuthSession(response.user || null, response.accessToken || response.authToken || (response as any).token || null, (response as any).refreshToken || null);
    }
    return response;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort cleanup when server logout fails.
    } finally {
      clearAuthSession();
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
