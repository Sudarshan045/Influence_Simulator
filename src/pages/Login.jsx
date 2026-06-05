import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Zap, LogIn, Mail, Lock, AlertCircle, WifiOff, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE ICON
// ─────────────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const { login, loginAsDemo, loginWithGoogle } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const [form, setForm]             = useState({ email: '', password: '' });
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [apiError, setApiError]     = useState({ message: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.email.trim())
      errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email address';
    if (!form.password)
      errs.password = 'Password is required';
    else if (form.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field])  setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError.message) setApiError({ message: '', type: '' });
  };

  // ── Sign-in handlers ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError({ message: '', type: '' });
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      const isNetwork = err.message?.includes('network') || err.message?.includes('fetch');
      setApiError({
        message: err.message,
        type:    isNetwork ? 'NETWORK' : 'AUTH',
      });
    } finally {
      setLoading(false);
    }
  };

  // One-click: no credentials needed, always works
  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setApiError({ message: '', type: '' });
    try {
      loginAsDemo();
      navigate(from, { replace: true });
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setApiError({ message: '', type: '' });
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setApiError({ message: err.message || 'Google login failed', type: 'AUTH' });
    } finally {
      setLoading(false);
    }
  };

  const isAnyLoading = loading || demoLoading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4">

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }}
        />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background:  'linear-gradient(135deg, #7c3aed, #6d28d9)',
              boxShadow:   '0 0 30px rgba(124,58,237,0.4)',
            }}
          >
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Influence Simulator</h1>
          <p className="text-slate-400 mt-1 text-sm">Cultural Forecasting Engine</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to your account to continue</p>

          {/* ── ONE-CLICK DEMO BUTTON ─────────────────────────────────────── */}
          <button
            id="demo-login-btn"
            onClick={handleDemoLogin}
            disabled={isAnyLoading}
            className="w-full mb-5 py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all duration-300 group relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15))',
              border:     '1px solid rgba(124,58,237,0.4)',
              color:      'white',
              opacity:    isAnyLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isAnyLoading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.25))';
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.7)';
                e.currentTarget.style.boxShadow  = '0 0 20px rgba(124,58,237,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background   = 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15))';
              e.currentTarget.style.borderColor  = 'rgba(124,58,237,0.4)';
              e.currentTarget.style.boxShadow    = 'none';
            }}
          >
            {demoLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                <span className="text-violet-300">Launching demo...</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-lg bg-violet-500/30 flex items-center justify-center group-hover:bg-violet-500/50 transition-colors">
                  <Play size={12} className="text-violet-300 fill-violet-300" />
                </div>
                <span className="text-violet-200">Try Demo — No account needed</span>
                <span
                  className="ml-auto text-[10px] font-bold uppercase tracking-wider text-violet-400 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
                >
                  Free
                </span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">or sign in</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* ── SIGN-IN FORM ─────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`form-input pl-10 ${errors.email ? 'error' : ''}`}
                  disabled={isAnyLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={`form-input pl-10 pr-10 ${errors.password ? 'error' : ''}`}
                  disabled={isAnyLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.password}
                </p>
              )}
            </div>

            {/* API Error */}
            {apiError.message && (
              <div
                className="p-3.5 rounded-xl text-sm flex items-start gap-2.5"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border:     '1px solid rgba(239,68,68,0.25)',
                }}
              >
                {apiError.type === 'NETWORK'
                  ? <WifiOff size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                  : <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                }
                <span className="text-red-300">{apiError.message}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isAnyLoading}
              className="btn-primary w-full py-3 text-base"
              style={{ opacity: isAnyLoading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Google */}
          <div className="my-6 flex items-center text-xs text-slate-500">
            <div className="flex-1 border-t border-white/10" />
            <span className="px-3">or continue with</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isAnyLoading}
            className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border:     '1px solid rgba(255,255,255,0.1)',
              color:      'white',
              opacity:    isAnyLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isAnyLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            <GoogleIcon />
            Sign In With Google
          </button>

          <div className="mt-6 mb-6 divider" />

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
