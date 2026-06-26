import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resendLoginOtp, resendPhoneOtp, requestPhoneOtp, verifyPhoneOtp } from '../services/auth.api';
import { useAuth } from '../hooks/useAuth';

import { getViteEnv } from '../utils/viteEnv';

const loginOtpEnabled = getViteEnv('VITE_LOGIN_OTP_ENABLED', 'false') === 'true';
const phoneOtpEnabled = getViteEnv('VITE_PHONE_OTP_ENABLED', 'false') === 'true';

const LoginPage = () => {
  const { login, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });
  const [phoneInput, setPhoneInput] = useState('');
  const [mode, setMode] = useState<'credentials' | 'phoneOtp' | 'loginOtp'>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [stage, setStage] = useState<'credentials' | 'otp'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('sessionExpired') === '1') {
      setStatus('Session expired. Please login again.');
    }
  }, [location.search]);

  useEffect(() => {
    let timer: number | undefined;
    if (resendCooldown > 0) {
      timer = window.setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, emailOrPhone: e.target.value }));
    setError('');
  };

  const buildIdentifier = (input: string) => {
    const normalized = input.trim();
    if (!normalized) return '';
    if (normalized.includes('@')) return normalized.toLowerCase();
    // treat as phone identifier and return digits (server will match variants)
    return normalizePhoneDigits(normalized);
  };

  const normalizePhoneDigits = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('0')) return digits.replace(/^0+/, '855');
    if (digits.startsWith('855')) return digits;
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);

    try {
      if (mode === 'credentials') {
        if (!formData.emailOrPhone.trim()) {
          setError('Email or phone is required');
          return;
        }
        if (!formData.password) {
          setError('Password is required');
          return;
        }

        const payload = {
          identifier: buildIdentifier(formData.emailOrPhone),
          password: formData.password,
          useOtp: false
        };

        const result = await login(payload as any);
        if (result && 'requiresOtp' in result && result.requiresOtp) {
          setStage('otp');
          setIdentifier(payload.identifier);
          setStatus('Enter the verification code sent to your email.');
          setResendCooldown(result.resendCooldownSeconds || 60);
          return;
        }

        navigate('/dashboard');
      } else if (mode === 'loginOtp') {
        if (!formData.emailOrPhone.trim()) {
          setError('Email or phone is required');
          return;
        }
        if (!formData.password) {
          setError('Password is required');
          return;
        }

        const payload = {
          identifier: buildIdentifier(formData.emailOrPhone),
          password: formData.password,
          useOtp: true
        };

        const result = await login(payload as any);
        if (result && 'requiresOtp' in result && result.requiresOtp) {
          setStage('otp');
          setIdentifier(payload.identifier);
          setStatus('Enter the verification code sent to your email or phone.');
          setResendCooldown(result.resendCooldownSeconds || 60);
          return;
        }

        navigate('/dashboard');
      } else {
        // phone OTP request
        if (!phoneInput.trim()) {
          setError('Phone number is required');
          return;
        }
        const digits = normalizePhoneDigits(phoneInput);
        const resp = await requestPhoneOtp({ phoneNumber: digits });
        setStage('otp');
        setIdentifier(digits);
        setStatus('Enter the verification code sent to your phone.');
        setResendCooldown(resp.resendCooldownSeconds || 60);
        return;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);

    try {
      if (!otpCode.trim() || otpCode.trim().length !== 6) {
        setError('Please enter the 6-digit verification code.');
        return;
      }
      if (mode === 'phoneOtp') {
        await verifyPhoneOtp({ phoneNumber: identifier, code: otpCode.trim() });
      } else {
        await verifyLoginOtp({ identifier, code: otpCode.trim() });
      }
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setStatus('');
    setLoading(true);

    try {
      if (mode === 'phoneOtp') {
        const digits = normalizePhoneDigits(phoneInput);
        const response = await resendPhoneOtp({ phoneNumber: digits });
        setStatus('A fresh code was sent to your phone.');
        setResendCooldown(response.resendCooldownSeconds || 60);
      } else {
        const response = await resendLoginOtp({ identifier: buildIdentifier(formData.emailOrPhone) });
        setStatus('A fresh code was sent to your email or phone.');
        setResendCooldown(response.resendCooldownSeconds || 60);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Unable to resend verification code.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-10 shadow-xl ring-1 ring-border">
      <div className="flex justify-center mb-8">
        <img src="/logo.png" alt="Konpuk" className="h-16 w-auto" />
      </div>
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-primary">Welcome back</p>
        <h1 className="text-3xl font-semibold text-text-primary">Log in to your account</h1>
        <p className="text-sm text-muted">Enter your email and password to manage listings, chat, and favorites.</p>
      </div>

      {status && (
        <div className="mt-6 rounded-3xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {status}
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          {error.includes('Email not verified') && (
            <p className="mt-2 text-sm text-red-700">
              <a
                href={`/verify-email?identifier=${encodeURIComponent(buildIdentifier(formData.emailOrPhone))}`}
                className="font-semibold underline"
              >Verify your email</a>
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-2 flex-wrap">
        <button type="button" className={`px-4 py-2 rounded-full ${mode === 'credentials' ? 'bg-primary text-white' : 'bg-white border'}`} onClick={() => setMode('credentials')}>Email or Phone + Password</button>
        {loginOtpEnabled && (
          <button type="button" className={`px-4 py-2 rounded-full ${mode === 'loginOtp' ? 'bg-primary text-white' : 'bg-white border'}`} onClick={() => setMode('loginOtp')}>Password + OTP</button>
        )}
        {phoneOtpEnabled && (
          <button type="button" className={`px-4 py-2 rounded-full ${mode === 'phoneOtp' ? 'bg-primary text-white' : 'bg-white border'}`} onClick={() => setMode('phoneOtp')}>Phone OTP</button>
        )}
      </div>

      {stage === 'credentials' ? (
        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          {mode === 'credentials' ? (
            <>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Email or Phone</span>
                <input
                  type="text"
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  onChange={handleIdentifierChange}
                  placeholder="Email or phone number"
                  className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Password</span>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********" 
                  className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  disabled={loading}
                />
              </label>
            </>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Phone number (Cambodia)</span>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="e.g. 012 345 678"
                className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
              <p className="mt-2 text-sm text-muted">No password is required for phone OTP login.</p>
            </label>
          )}

          <button 
            type="submit" 
            className="w-full rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (mode === 'credentials' ? 'Signing in...' : 'Requesting OTP...') : (mode === 'credentials' ? 'Sign in' : 'Request OTP')}
          </button>
        </form>
      ) : (
        <form className="mt-10 space-y-6" onSubmit={handleOtpSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Verification Code</span>
            <input
              type="text"
              name="otpCode"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={loading}
            />
          </label>

          <button 
            type="submit" 
            className="w-full rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Verifying code...' : 'Verify code'}
          </button>

          <button 
            type="button" 
            onClick={handleResendCode}
            className="w-full rounded-3xl border border-muted bg-white px-5 py-3 text-sm font-semibold text-text-secondary transition hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-muted">
        <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary">
          Forgot password?
        </Link>
        <p>
          New to Konpuk? <Link to="/register" className="font-semibold text-primary hover:text-primary">Create account</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;


