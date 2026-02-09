interface FooterProps {
  onAdminClick?: () => void;
}

export function Footer({ onAdminClick }: FooterProps) {
  return (
    <footer className="relative border-t border-neutral-800/50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">
              Dismine SMP
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {['About', 'Details', 'Apply', 'Community'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Copyright & Admin */}
          <div className="flex items-center gap-4">
            <p className="text-xs text-neutral-600">
              © {new Date().getFullYear()} Dismine SMP
            </p>
            {onAdminClick && (
              <button
                onClick={onAdminClick}
                className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
