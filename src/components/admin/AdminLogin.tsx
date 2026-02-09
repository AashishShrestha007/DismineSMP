import { useState, type FormEvent } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { loginUser, ensureOwnerAccount, canAccessAdmin } from '../../lib/store';

interface Props {
  onLogin: () => void;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Ensure owner account exists
    ensureOwnerAccount();

    setTimeout(() => {
      const result = loginUser(email, password);
      if (result.success && result.user) {
        if (canAccessAdmin(result.user.role)) {
          onLogin();
        } else {
          setError('Access denied. You do not have admin privileges.');
        }
      } else {
        setError(result.error || 'Invalid credentials.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.04)_0%,_transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to site
        </button>

        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <div className="h-3.5 w-3.5 rounded-sm bg-emerald-500" />
          </div>
          <div>
            <span className="text-white font-semibold tracking-tight text-lg block leading-tight">Dismine</span>
            <span className="text-neutral-500 text-xs">Admin Panel</span>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-neutral-800 border border-neutral-700/50 flex items-center justify-center">
              <Shield size={16} className="text-neutral-400" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Staff Login</h1>
              <p className="text-neutral-500 text-xs">Sign in with your staff account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-neutral-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="admin-email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
                placeholder="you@example.com"
                autoFocus
                className="w-full px-4 py-3 text-sm text-white bg-neutral-950/80 border border-neutral-800 rounded-xl placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 text-sm text-white bg-neutral-950/80 border border-neutral-800 rounded-xl placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-neutral-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-5 p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/20">
            <p className="text-[11px] text-neutral-500 mb-2 font-medium">
              <Lock size={10} className="inline mr-1" />
              Staff access only — requires Manager, Admin, or Owner role
            </p>
            <div className="space-y-1 text-[10px] text-neutral-600">
              <div className="flex justify-between">
                <span>Owner default email:</span>
                <span className="text-neutral-400 font-mono">owner@dismine.com</span>
              </div>
              <div className="flex justify-between">
                <span>Owner default password:</span>
                <span className="text-neutral-400 font-mono">dismine2025</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-700">
          Protected area · Only staff members with assigned roles can access the admin panel
        </p>
      </div>
    </div>
  );
}
