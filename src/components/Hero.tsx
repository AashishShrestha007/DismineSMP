import { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { getSeasonInfo, getApplicationStatus, getApplicationSchedule, formatScheduleDate, type SeasonInfo, type ApplicationStatusType, type ApplicationSchedule } from '../lib/store';

export function Hero() {
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [appStatus, setAppStatus] = useState<ApplicationStatusType>('open');
  const [schedule, setSchedule] = useState<ApplicationSchedule>({});

  useEffect(() => {
    setSeason(getSeasonInfo());
    setAppStatus(getApplicationStatus());
    setSchedule(getApplicationSchedule());
  }, []);

  const getBadgeConfig = () => {
    const seasonNum = season?.number || 1;
    
    // Determine color based on status
    let color = 'emerald';
    if (appStatus === 'closed') color = 'red';
    else if (appStatus === 'coming_soon') color = 'amber';
    else if (appStatus === 'ending_soon') color = 'orange';

    // Text logic
    let text = '';
    if (season?.heroBadgeText) {
      text = season.heroBadgeText;
    } else {
      switch (appStatus) {
        case 'open': text = `Applications Open — Season ${seasonNum}`; break;
        case 'closed': text = `Applications Closed — Season ${seasonNum}`; break;
        case 'coming_soon': 
          text = `Applications Opening Soon`; 
          if (schedule.openDate) {
             text += ` — ${formatScheduleDate(schedule.openDate)}`;
          } else {
             text += ` — Season ${seasonNum}`;
          }
          break;
        case 'ending_soon': text = `Applications Closing Soon — Season ${seasonNum}`; break;
        default: text = `Applications Open — Season ${seasonNum}`;
      }
    }

    return { text, color };
  };

  const { text: badgeText, color } = getBadgeConfig();

  const getBadgeClasses = (c: string) => {
    switch (c) {
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'red': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'amber': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'orange': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      default: return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
  };

  const getDotClass = (c: string) => {
    switch (c) {
      case 'emerald': return 'bg-emerald-400 animate-pulse';
      case 'red': return 'bg-red-400';
      case 'amber': return 'bg-amber-400 animate-pulse';
      case 'orange': return 'bg-orange-400 animate-pulse';
      default: return 'bg-emerald-400';
    }
  };

  const isApplyEnabled = appStatus === 'open' || appStatus === 'ending_soon';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08)_0%,_transparent_70%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-950 to-transparent" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium tracking-wide uppercase mb-8 animate-fade-in-up ${getBadgeClasses(color)}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${getDotClass(color)}`} />
          {badgeText}
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05] animate-fade-in-up animation-delay-100">
          Dismine
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
            SMP
          </span>
        </h1>

        {/* Tagline */}
        <p className="mt-6 text-lg sm:text-xl text-neutral-400 max-w-xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          A private Minecraft SMP built on trust & creativity.
          <span className="text-neutral-500 block mt-1">
            Curated community. Application only.
          </span>
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
          {isApplyEnabled ? (
            <a
              href="#apply"
              className="group flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-neutral-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/20 animate-pulse-glow"
            >
              Apply to Join
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-neutral-500 bg-neutral-800 rounded-xl cursor-not-allowed opacity-75"
            >
              {appStatus === 'coming_soon' ? 'Coming Soon' : 'Applications Closed'}
            </button>
          )}
          
          <a
            href="#about"
            className="flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-neutral-300 bg-neutral-800/50 border border-neutral-700/50 rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-all"
          >
            Learn More
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 flex items-center justify-center gap-8 sm:gap-12 animate-fade-in-up animation-delay-400">
          {[
            { value: 'Private', label: 'Whitelisted' },
            { value: 'Survival', label: 'Gamemode' },
            { value: '1.21+', label: 'Version' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-white font-semibold text-sm sm:text-base">{stat.value}</div>
              <div className="text-neutral-500 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-600 hover:text-neutral-400 transition-colors animate-bounce"
      >
        <ChevronDown size={20} />
      </a>
    </section>
  );
}
