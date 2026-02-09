import { useInView } from '../hooks/useInView';
import { Lock, Sword, BookOpen, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { getServerInfo } from '../lib/store';

const specIcons = [Sword, Globe, Lock, BookOpen];

// Default fallback values in case store returns empty
const defaultInfo = {
  gamemode: 'Survival SMP',
  version: 'Java 1.21+',
  access: 'Whitelisted / Private',
  serverType: 'Semi-Vanilla',
  rules: [
    'No griefing, stealing, or destroying builds',
    'No cheating, exploiting, or unfair advantages',
    'Respect all members — toxicity is not tolerated',
    'No hate speech, discrimination, or harassment',
    'Keep the environment and shared spaces clean',
    'Active communication in Discord is expected',
  ],
};

export function Details() {
  const { ref, isInView } = useInView();

  // Read server info directly on every render (no stale state)
  const stored = getServerInfo();

  const gamemode = stored?.gamemode || defaultInfo.gamemode;
  const version = stored?.version || defaultInfo.version;
  const access = stored?.access || defaultInfo.access;
  const serverType = stored?.serverType || defaultInfo.serverType;
  const rules = stored?.rules?.length > 0 ? stored.rules : defaultInfo.rules;

  const specs = [
    { icon: specIcons[0], label: 'Gamemode', value: gamemode },
    { icon: specIcons[1], label: 'Version', value: version },
    { icon: specIcons[2], label: 'Access', value: access },
    { icon: specIcons[3], label: 'Type', value: serverType },
  ];

  return (
    <section id="details" className="relative py-28 sm:py-36">
      {/* Subtle divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        {/* Section Header */}
        <div className={`max-w-2xl transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-emerald-500 text-xs font-semibold tracking-widest uppercase">
            Details
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Server specifications
            <span className="text-neutral-500"> & rules.</span>
          </h2>
          <p className="mt-4 text-neutral-400 text-lg leading-relaxed">
            Everything you need to know before applying. We keep it straightforward.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Specs Card */}
          <div
            className={`p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 transition-all duration-700 ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Globe size={16} className="text-emerald-500" />
              </div>
              Server Info
            </h3>
            <div className="mt-6 space-y-4">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center justify-between py-3 border-b border-neutral-800/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <spec.icon size={16} className="text-neutral-500" />
                    <span className="text-neutral-400 text-sm">{spec.label}</span>
                  </div>
                  <span className="text-white text-sm font-medium font-mono">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules Card */}
          <div
            className={`p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 transition-all duration-700 ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              Rules Overview
            </h3>
            <div className="mt-6 space-y-3">
              {rules.map((rule, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle
                    size={16}
                    className="text-emerald-500/70 mt-0.5 shrink-0"
                  />
                  <span className="text-neutral-400 text-sm leading-relaxed">
                    {rule}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
