import { useState, useEffect } from 'react';
import { useInView } from '../hooks/useInView';
import { getSocialLinks, type SocialLink } from '../lib/store';
import {
  MessageSquare, Youtube, Instagram, Video, Twitter, Twitch, Linkedin,
  Github, Facebook, Globe, Mail, Gamepad2, Music
} from 'lucide-react';

export function Community() {
  const { ref, isInView } = useInView();
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    setLinks(getSocialLinks().filter((l) => l.enabled));
  }, []);

  const iconMap: any = {
    discord: MessageSquare,
    youtube: Youtube,
    instagram: Instagram,
    tiktok: Video,
    twitter: Twitter,
    twitch: Twitch,
    linkedin: Linkedin,
    github: Github,
    facebook: Facebook,
    globe: Globe,
    mail: Mail,
    gamepad: Gamepad2,
    music: Music
  };

  const colorMap: any = {
    indigo: { gradient: 'from-indigo-500 to-indigo-600', border: 'hover:border-indigo-500/30' },
    red: { gradient: 'from-red-500 to-red-600', border: 'hover:border-red-500/30' },
    pink: { gradient: 'from-pink-500 to-purple-600', border: 'hover:border-pink-500/30' },
    purple: { gradient: 'from-purple-500 to-purple-600', border: 'hover:border-purple-500/30' },
    blue: { gradient: 'from-blue-500 to-blue-600', border: 'hover:border-blue-500/30' },
    emerald: { gradient: 'from-emerald-500 to-emerald-600', border: 'hover:border-emerald-500/30' },
    orange: { gradient: 'from-orange-500 to-orange-600', border: 'hover:border-orange-500/30' },
    neutral: { gradient: 'from-neutral-500 to-neutral-600', border: 'hover:border-neutral-500/30' },
  };

  return (
    <section id="community" className="relative py-28 sm:py-36">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />

      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className={`text-center max-w-2xl mx-auto transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-emerald-500 text-xs font-semibold tracking-widest uppercase">
            Community
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Stay connected.
          </h2>
          <p className="mt-4 text-neutral-400 text-lg leading-relaxed">
            Join our community channels to stay up to date, connect with members, and be part of the conversation.
          </p>
        </div>

        {links.length > 0 ? (
          <div className={`mt-16 grid grid-cols-1 sm:grid-cols-2 ${links.length >= 4 ? 'lg:grid-cols-4' : links.length === 3 ? 'lg:grid-cols-3' : ''} gap-4`}>
            {links.map((social, index) => {
              const Icon = iconMap[social.icon] || Globe;
              const styles = colorMap[social.color] || colorMap.neutral;
              
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 ${styles.border} hover:bg-neutral-900/80 transition-all duration-500 text-center ${
                    isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${styles.gradient} text-white mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-white font-semibold">{social.name}</h3>
                  <p className="text-neutral-500 text-sm mt-1">{social.description}</p>
                </a>
              );
            })}
          </div>
        ) : (
          <div className={`mt-16 text-center transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-neutral-600 text-sm">Social links coming soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}
