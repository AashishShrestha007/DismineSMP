import { AlertTriangle, RefreshCw } from 'lucide-react';

export function Maintenance() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.05)_0%,_transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        <div className="h-24 w-24 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/10">
          <AlertTriangle size={48} className="text-red-500 animate-pulse" />
        </div>

        <h1 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">Under Maintenance</h1>
        
        <p className="text-neutral-400 text-lg mb-10 leading-relaxed font-medium">
          Dismine SMP is currently undergoing essential updates. Please check back later or join our Discord for status updates.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full sm:w-auto px-8 py-4 bg-white text-neutral-950 font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            <RefreshCw size={16} /> Retry Access
          </button>
          <a 
            href="https://discord.gg/dismine" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white font-black rounded-2xl border border-neutral-800 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            Join Discord
          </a>
        </div>

        <p className="mt-12 text-neutral-600 text-[10px] font-black uppercase tracking-[0.3em]">
          Protocols Offline · Dismine SMP Foundation
        </p>
      </div>
    </div>
  );
}
