import { useState, useEffect } from 'react';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { getSeasonInfo, type SeasonInfo } from '../lib/store';

const themeColors: Record<string, { gradient: string; accent: string; glow: string; badge: string }> = {
  emerald: {
    gradient: 'from-emerald-950 via-emerald-900/50 to-neutral-950',
    accent: 'text-emerald-400',
    glow: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  blue: {
    gradient: 'from-blue-950 via-blue-900/50 to-neutral-950',
    accent: 'text-blue-400',
    glow: 'bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  purple: {
    gradient: 'from-purple-950 via-purple-900/50 to-neutral-950',
    accent: 'text-purple-400',
    glow: 'bg-purple-500/10',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  amber: {
    gradient: 'from-amber-950 via-amber-900/50 to-neutral-950',
    accent: 'text-amber-400',
    glow: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  red: {
    gradient: 'from-red-950 via-red-900/50 to-neutral-950',
    accent: 'text-red-400',
    glow: 'bg-red-500/10',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  rose: {
    gradient: 'from-rose-950 via-rose-900/50 to-neutral-950',
    accent: 'text-rose-400',
    glow: 'bg-rose-500/10',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
};

export function SeasonBanner() {
  const [season, setSeason] = useState<SeasonInfo>(getSeasonInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setSeason(getSeasonInfo());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const theme = themeColors[season.theme] || themeColors.emerald;
  const hasBanner = season.bannerImage && season.bannerImage.trim().length > 0;

  const formattedDate = new Date(season.startDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      {hasBanner ? (
        <>
          <img
            src={season.bannerImage}
            alt={`Season ${season.number} Banner`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: season.bannerOverlay / 100 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50" />
        </>
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
          {/* Decorative orbs */}
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${theme.glow} rounded-full blur-3xl`} />
          <div className={`absolute bottom-1/4 right-1/4 w-48 h-48 ${theme.glow} rounded-full blur-3xl`} />
        </>
      )}

      {/* Top/bottom fade */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-neutral-950 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-950 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-20 sm:py-28 text-center">
        {/* Season badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider mb-6 ${theme.badge}`}>
          <Sparkles size={12} />
          Season {season.number}
          {season.isActive ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              Active
            </span>
          ) : (
            <span className="opacity-60">Ended</span>
          )}
        </div>

        {/* Season name */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">
          {season.name}
        </h2>

        {/* Description */}
        {season.description && (
          <p className="text-neutral-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-6 drop-shadow-md">
            {season.description}
          </p>
        )}

        {/* Date */}
        <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm mb-8">
          <Calendar size={14} />
          <span>Started {formattedDate}</span>
        </div>

        {/* CTA */}
        {season.isActive && (
          <a
            href="#apply"
            className={`inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-neutral-950 bg-white rounded-xl hover:bg-neutral-100 transition-all hover:shadow-lg group`}
          >
            Apply to Join Season {season.number}
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        )}
      </div>
    </section>
  );
}
