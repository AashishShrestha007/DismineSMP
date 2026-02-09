import { Shield, Heart, Sparkles, Users } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const values = [
  {
    icon: Heart,
    title: 'Community First',
    description:
      'We prioritize genuine connections. Every member is handpicked to ensure a welcoming, respectful environment for everyone.',
  },
  {
    icon: Shield,
    title: 'Fair Play',
    description:
      'No cheating, no griefing, no exceptions. We maintain a level playing field where everyone can thrive on their own merit.',
  },
  {
    icon: Sparkles,
    title: 'Creative Freedom',
    description:
      'Build what inspires you. From sprawling cities to hidden bases — your imagination is the only limit here.',
  },
  {
    icon: Users,
    title: 'Long-Term Survival',
    description:
      'This isn\'t a temporary server. We\'re building something lasting — a world that grows with its community over time.',
  },
];

export function About() {
  const { ref, isInView } = useInView();

  return (
    <section id="about" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        {/* Section Header */}
        <div className={`max-w-2xl transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-emerald-500 text-xs font-semibold tracking-widest uppercase">
            About
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            More than a server.
            <span className="text-neutral-500"> A community.</span>
          </h2>
          <p className="mt-4 text-neutral-400 text-lg leading-relaxed">
            Dismine SMP is an application-only Minecraft survival server designed for
            players who value quality over quantity. We believe the best experiences come
            from a carefully curated group of like-minded individuals.
          </p>
        </div>

        {/* Values Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {values.map((value, index) => (
            <div
              key={value.title}
              className={`group p-6 sm:p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-500/20 hover:bg-neutral-900/80 transition-all duration-500 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 transition-colors">
                <value.icon size={18} className="text-emerald-500" />
              </div>
              <h3 className="text-white font-semibold text-lg">{value.title}</h3>
              <p className="mt-2 text-neutral-400 text-sm leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
