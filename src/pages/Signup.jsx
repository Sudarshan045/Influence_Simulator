import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Google icon component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const STRENGTH_RULES = [
  { label: 'Min. 6 characters', test: (p) => p.length >= 6 },
  { label: 'Contains a number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = STRENGTH_RULES.filter((r) => r.test(form.password)).length;
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
  const strengthLabels = ['Weak', 'Moderate', 'Strong'];

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.confirm) errs.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await signup(form.name.trim(), form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4 py-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-1 text-sm">Start forecasting cultural trends today</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Jane Doe"
                  className={`form-input pl-10 ${errors.name ? 'error' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> {errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`form-input pl-10 ${errors.email ? 'error' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> {errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  className={`form-input pl-10 pr-10 ${errors.password ? 'error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> {errors.password}</p>
              )}

              {/* Password strength */}
              {form.password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-700'}`} />
                    ))}
                  </div>
                  <div className="space-y-1">
                    {STRENGTH_RULES.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle size={11} className={rule.test(form.password) ? 'text-emerald-400' : 'text-slate-600'} />
                        <span className={rule.test(form.password) ? 'text-slate-300' : 'text-slate-600'}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => handleChange('confirm', e.target.value)}
                  placeholder="Re-enter password"
                  className={`form-input pl-10 ${errors.confirm ? 'error' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.confirm && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> {errors.confirm}</p>
              )}
            </div>

            {apiError && (
              <div className="p-3 rounded-xl text-sm text-red-300 flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle size={16} className="flex-shrink-0" />
                {apiError}
              </div>
            )}

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center text-xs text-slate-500">
            <div className="flex-1 border-t border-white/10" />
            <span className="px-3">or continue with</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          >
            <GoogleIcon />
            Google
          </button>

          <div className="mt-6 mb-6 divider" />

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
