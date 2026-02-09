import { useState, useEffect, type FormEvent } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
  User,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { 
  registerUser, 
  loginUser, 
  getDiscordConfig,
  getGoogleConfig,
  canAccessAdmin
} from '../../lib/store';

interface Props {
  onAuth: () => void;
  onBack: () => void;
}

type Mode = 'login' | 'register';

import { getSettings } from '../../lib/store';

export function AuthPage({ onAuth, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const settings = getSettings();

  useEffect(() => {
    const handleSocialCallback = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) return;

      const fragment = new URLSearchParams(hash.slice(1));
      const accessToken = fragment.get('access_token');
      const state = fragment.get('state');
      
      if (!accessToken) return;

      // Clear hash immediately
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      // Discord Callback
      if (state === 'discord') {
        setDiscordLoading(true);
        try {
          const response = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            const result = registerUser({
               email: data.email,
               displayName: data.global_name || data.username,
               discordId: data.id,
               discordUsername: data.discriminator === '0' ? data.username : `${data.username}#${data.discriminator}`,
               discordAvatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : undefined,
               authMethod: 'discord'
            });
            
            if (result.success) {
              onAuth();
            } else {
              setError(result.error || 'Discord login failed.');
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Discord UserInfo Error:', errorData);
            setError('Discord authorization failed. Please ensure your Redirect URI matches exactly.');
          }
        } catch (err) {
          console.error('Discord Fetch Error:', err);
          setError('Failed to connect to Discord.');
        } finally {
          setDiscordLoading(false);
        }
      }

      // Google Callback
      if (state === 'google') {
        setGoogleLoading(true);
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (response.ok) {
            const data = await response.json();
            const result = registerUser({
              email: data.email,
              googleId: data.sub,
              displayName: data.name || data.given_name || data.email.split('@')[0],
              authMethod: 'google',
            });

            if (result.success) {
              onAuth();
            } else {
              setError(result.error || 'Google login failed.');
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Google UserInfo Error:', errorData);
            setError('Google authorization failed. Please ensure your Client ID is correct.');
          }
        } catch (err) {
          console.error('Google Fetch Error:', err);
          setError('Failed to connect to Google.');
        } finally {
          setGoogleLoading(false);
        }
      }
    };
    
    handleSocialCallback();
  }, [onAuth]);

  const handleEmailAuth = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (mode === 'register') {
        if (!settings.registrationEnabled) {
          setError(settings.maintenanceMessage || 'Registrations are currently closed.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        const result = registerUser({
          email,
          password,
          displayName: displayName || email.split('@')[0],
          authMethod: 'email',
        });
        if (result.success) {
          onAuth();
        } else {
          setError(result.error || 'Registration failed.');
        }
      } else {
        const result = loginUser(email, password);
        if (result.success && result.user) {
          const isStaff = canAccessAdmin(result.user.role);
          if (!settings.loginEnabled && !isStaff) {
            setError(settings.maintenanceMessage || 'Login is currently disabled for maintenance.');
            setIsLoading(false);
            return;
          }
          onAuth();
        } else {
          setError(result.error || 'Login failed.');
        }
      }
      setIsLoading(false);
    }, 800);
  };

  const handleDiscordAuth = () => {
    setError('');
    const config = getDiscordConfig();
    if (config.isEnabled && config.clientId) {
       setDiscordLoading(true);
       const baseUrl = window.location.origin + window.location.pathname;
       const redirectUri = config.redirectUri || baseUrl;
       const scope = 'identify email';
       const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&state=discord`;
       window.location.href = authUrl;
       return;
    }

    setError('Discord login is currently not configured by the administrator.');
    setDiscordLoading(false);
  };

  const handleGoogleAuth = () => {
    setError('');
    const config = getGoogleConfig();
    if (config.isEnabled && config.clientId) {
      setGoogleLoading(true);
      const baseUrl = window.location.origin + window.location.pathname;
      const redirectUri = config.redirectUri || baseUrl;
      const scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&state=google`;
      window.location.href = authUrl;
      return;
    }

    setError('Google login is currently not configured by the administrator.');
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.05)_0%,_transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to site
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <div className="h-3.5 w-3.5 rounded-sm bg-emerald-500" />
          </div>
          <div>
            <span className="text-white font-semibold tracking-tight text-lg block leading-tight">
              Dismine SMP
            </span>
            <span className="text-neutral-500 text-xs">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Discord OAuth Button */}
            <button
              onClick={handleDiscordAuth}
              disabled={discordLoading || googleLoading || isLoading}
              className="flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold text-white bg-[#5865F2] rounded-xl hover:bg-[#4752C4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {discordLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                  </svg>
                  Discord
                </>
              )}
            </button>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={googleLoading || discordLoading || isLoading}
              className="flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold text-white bg-neutral-800 rounded-xl hover:bg-neutral-750 border border-neutral-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-neutral-900/60 text-neutral-500">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="block text-sm font-medium text-neutral-300 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    id="auth-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full pl-11 pr-4 py-3 text-sm text-white bg-neutral-950/80 border border-neutral-800 rounded-xl placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-neutral-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  id="auth-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 text-sm text-white bg-neutral-950/80 border border-neutral-800 rounded-xl placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                  className="w-full pl-11 pr-11 py-3 text-sm text-white bg-neutral-950/80 border border-neutral-800 rounded-xl placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
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
              disabled={isLoading || discordLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-neutral-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? (
                    'Sign In'
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Create Account
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <p className="mt-6 text-center text-sm text-neutral-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                {settings.registrationEnabled ? (
                  <button
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                ) : (
                  <span className="text-red-400/80">Registrations are closed.</span>
                )}
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-700">
          By signing up, you agree to our community guidelines.
        </p>
      </div>
    </div>
  );
}
