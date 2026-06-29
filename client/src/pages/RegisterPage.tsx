import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getPasswordStrength, getPasswordStrengthLabel } from '../utils/password';

import { getViteEnv } from '../utils/viteEnv';

const captchaEnabled = getViteEnv('VITE_CAPTCHA_ENABLED', 'false') === 'true';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { firstName, lastName, email, phone, password, confirmPassword } = formData;
      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required');
        setLoading(false);
        return;
      }
      if (!phone.trim()) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Valid email address is required');
        setLoading(false);
        return;
      }
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim() || phone.trim();
      const payload = {
        displayName,
        phoneNumber: phone.trim(),
        password,
        ...(email.trim() ? { email: email.trim() } : {})
      } as { displayName: string; email?: string; password: string; phoneNumber: string };
      if (captchaEnabled) {
        (payload as any).captchaToken = 'placeholder';
      }

      const result = await register(payload);
      if (result && 'requiresEmailVerification' in result && result.requiresEmailVerification) {
        navigate(`/verify-email?identifier=${encodeURIComponent(result.identifier)}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 shadow-2xl ring-1 ring-border">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="SMS-CAM" className="h-16 w-auto" />
        </div>
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-primary">Create your seller account</p>
          <h1 className="text-3xl font-semibold text-text-primary">Register to sell locally</h1>
          <p className="text-sm text-muted">Join thousands of sellers and post products in minutes.</p>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">First Name</span>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Sophea"
                className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Last Name</span>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Rath"
                className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Email address (optional)</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-muted">Optional for rural sellers. Leave blank to register with phone only.</p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Phone Number</span>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010 123 456"
              className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={loading}
            />
          </label>
          {captchaEnabled && (
            <div className="rounded-3xl border border-muted bg-background p-4 text-sm text-text-secondary">
              CAPTCHA placeholder enabled. Implement CAPTCHA integration here when ready.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Password</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
              <p className="mt-2 text-sm text-muted">ប្រើយ៉ាងហោចណាស់ 8 តួ។ ការបន្ថែមលេខ និងសញ្ញាពិសេសនឹងធ្វើឱ្យលេខសម្ងាត់កាន់តែមានសុវត្ថិភាព។</p>
              {getPasswordStrength(formData.password) && (
                <p className="mt-1 text-sm">
                  កម្លាំងលេខសម្ងាត់:{' '}
                  <span className={
                    getPasswordStrength(formData.password) === 'Strong'
                      ? 'text-emerald-600'
                      : getPasswordStrength(formData.password) === 'Medium'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }>{getPasswordStrengthLabel(getPasswordStrength(formData.password))}</span>
                </p>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Confirm Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="mt-2 w-full rounded-3xl border border-muted bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-3xl bg-text-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="font-semibold text-primary hover:text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;


