import { useInView } from '../hooks/useInView';
import { Crown, Shield, Users, Hammer, UserCog } from 'lucide-react';

const team = [
  {
    name: 'Dismine',
    role: 'Owner & Founder',
    icon: Crown,
    color: 'amber',
    description:
      'Visionary behind the SMP. Handles server management, community direction, and ensures the server stays true to its values.',
  },
  {
    name: 'Admins',
    role: 'Server Administration',
    icon: Shield,
    color: 'red',
    description:
      'Senior team members who manage the server, handle disputes, review applications, and oversee the staff team.',
  },
  {
    name: 'Managers',
    role: 'Community Management',
    icon: UserCog,
    color: 'purple',
    description:
      'Responsible for reviewing applications, managing community events, and ensuring a smooth experience for all players.',
  },
  {
    name: 'Staff Team',
    role: 'Moderators',
    icon: Users,
    color: 'blue',
    description:
      'Dedicated moderators who keep the community safe, fair, and welcoming. Available to help with any issues or questions.',
  },
  {
    name: 'Builders',
    role: 'World Design & Builds',
    icon: Hammer,
    color: 'emerald',
    description:
      'Talented builders who create spawn areas, community builds, and help shape the world of Dismine SMP.',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-500',
    iconBg: 'bg-red-500/10',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
};

export function Team() {
  const { ref, isInView } = useInView();

  return (
    <section id="team" className="relative py-28 sm:py-36">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className={`max-w-2xl transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-emerald-500 text-xs font-semibold tracking-widest uppercase">
            Team
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Who's behind
            <span className="text-neutral-500"> Dismine SMP.</span>
          </h2>
          <p className="mt-4 text-neutral-400 text-lg leading-relaxed">
            A small but dedicated team committed to building the best possible experience.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member, index) => {
            const colors = colorMap[member.color];
            return (
              <div
                key={member.name}
                className={`group p-6 sm:p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-neutral-700/70 transition-all duration-500 ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div
                  className={`h-12 w-12 rounded-xl ${colors.iconBg} border ${colors.border} flex items-center justify-center mb-5`}
                >
                  <member.icon size={20} className={colors.text} />
                </div>
                <h3 className="text-white font-semibold text-lg">{member.name}</h3>
                <span className={`text-xs font-medium ${colors.text} mt-1 inline-block`}>
                  {member.role}
                </span>
                <p className="mt-3 text-neutral-400 text-sm leading-relaxed">
                  {member.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
