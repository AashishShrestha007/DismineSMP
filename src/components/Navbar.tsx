import { useState, useEffect } from 'react';
import { Menu, X, Shield, User, LogIn, Crown, UserCog, Users, Hammer } from 'lucide-react';
import { getSession, getRoleLabel, getRoleColor, type UserAccount, type UserRole } from '../lib/store';

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Details', href: '#details' },
  { label: 'Team', href: '#team' },
  { label: 'Community', href: '#community' },
];

interface NavbarProps {
  onAdminClick?: () => void;
  onLoginClick?: () => void;
  onPortalClick?: () => void;
}

function getRoleBadgeIcon(role: UserRole) {
  switch (role) {
    case 'owner': return <Crown size={8} />;
    case 'admin': return <Shield size={8} />;
    case 'manager': return <UserCog size={8} />;
    case 'staff': return <Users size={8} />;
    case 'builder': return <Hammer size={8} />;
    default: return <User size={8} />;
  }
}

export function Navbar({ onAdminClick, onLoginClick, onPortalClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkSession = () => setUser(getSession());
    checkSession();
    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          </div>
          <span className="text-white font-semibold tracking-tight text-lg">
            Dismine
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800/50"
            >
              {link.label}
            </a>
          ))}

          {user ? (
            <>
              <button
                onClick={onPortalClick}
                className="ml-2 flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors rounded-lg hover:bg-neutral-800/50"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.displayName.slice(0, 2)}
                </div>
                <span className="max-w-[80px] truncate">{user.displayName}</span>
                <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getRoleColor(user.role).bg} ${getRoleColor(user.role).text}`}>
                  {getRoleBadgeIcon(user.role)}
                  {getRoleLabel(user.role).toUpperCase()}
                </span>
              </button>
              <a
                href="#apply"
                className="ml-2 px-5 py-2 text-sm font-medium text-neutral-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Apply Now
              </a>
            </>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="ml-2 flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800/50"
              >
                <LogIn size={14} />
                Sign In
              </button>
              <a
                href="#apply"
                className="ml-2 px-5 py-2 text-sm font-medium text-neutral-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Apply Now
              </a>
            </>
          )}

          {onAdminClick && (
            <button
              onClick={onAdminClick}
              className="ml-1 p-2 text-emerald-600 hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-500/10"
              title="Admin Panel"
            >
              <Shield size={14} />
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800/50 animate-fade-in">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-3 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800/50"
              >
                {link.label}
              </a>
            ))}

            {user ? (
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  onPortalClick?.();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white transition-colors rounded-lg hover:bg-neutral-800/50"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.displayName.slice(0, 2)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {user.displayName}
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getRoleColor(user.role).bg} ${getRoleColor(user.role).text}`}>
                      {getRoleBadgeIcon(user.role)}
                      {getRoleLabel(user.role).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500">View Profile & Applications</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  onLoginClick?.();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800/50"
              >
                <User size={16} />
                Sign In / Register
              </button>
            )}

            <a
              href="#apply"
              onClick={() => setIsMobileOpen(false)}
              className="block px-4 py-3 text-center font-medium text-neutral-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors mt-3"
            >
              Apply Now
            </a>

            {onAdminClick && (
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  onAdminClick();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-emerald-600 hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-500/10 mt-2 text-sm"
              >
                <Shield size={14} />
                Admin Panel
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
