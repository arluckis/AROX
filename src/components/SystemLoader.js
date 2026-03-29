'use client';
import React, { useState, useEffect } from 'react';

export const Skeleton = ({ className }) => <div className={`animate-pulse bg-zinc-800/50 rounded-md ${className}`}></div>;

export default function SystemLoader({ variant = 'section', text = '', phase = 'sync', exitStage = 'none' }) {
  const [mounted, setMounted] = useState(false);
  
  // Utilizado para coordenar a absorção do bluring da tela anterior
  useEffect(() => {
    setMounted(true);
  }, []);

  const isExitingContent = exitStage !== 'none';
  const isExitingCard = exitStage === 'card' || exitStage === 'arox';
  const isExitingArox = exitStage === 'arox';

  const AnimatedBars = ({ isPremium = false }) => (
    <div className={`flex items-center justify-center gap-[6px] ${isPremium ? 'h-5' : 'h-8'}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={`rounded-full transition-all animate-[pulse_1.2s_ease-in-out_infinite] ${isPremium ? 'w-[2px] bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.3)]' : 'w-1.5 bg-gradient-to-t from-zinc-800 to-zinc-400'}`}
          style={{ height: i % 2 === 0 ? '60%' : '100%', animationDelay: `${i * 0.15}s`, opacity: isPremium ? 1 : 0.8 }}
        ></div>
      ))}
    </div>
  );

  if (variant === 'full') {
    const isExitingLoaderGlobal = phase === 'operational' || phase === 'bridgeDark' || phase === 'bridgeLight';
    const isEarly = phase === 'ignition' || phase === 'reveal';

    return (
      <div className={`absolute inset-0 z-50 w-full h-full flex flex-col items-center justify-center perspective-[1200px] transition-all duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isExitingLoaderGlobal ? 'pointer-events-none opacity-0 scale-105 blur-lg' : 
        (!mounted || isEarly) ? 'opacity-0 scale-95 blur-md pointer-events-none' : 'opacity-100 scale-100 blur-0'
      }`}>
        
        <div className={`flex flex-col items-center justify-center p-12 transition-all duration-[500ms] ease-out min-w-[320px] min-h-[320px] relative overflow-hidden ${
          isExitingCard ? 'bg-transparent border-transparent shadow-none backdrop-blur-none scale-[1.05]' : 'bg-white/[0.03] backdrop-blur-[12px] border border-white/[0.08] rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]'
        }`}>
          
          <div className={`absolute top-8 flex flex-col items-center justify-center w-full transition-all duration-[400ms] ease-out ${isExitingArox ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
             <span className="text-[14px] font-bold tracking-[0.5em] text-white uppercase mb-1 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
               AROX
             </span>
             <span className={`text-[9px] font-medium tracking-[0.4em] text-zinc-500 uppercase transition-opacity duration-300 ${isExitingContent ? 'opacity-0' : 'opacity-100'}`}>
               Ignition Sequence
             </span>
          </div>

          <div className={`flex flex-col items-center justify-center mt-6 transition-all duration-300 ${isExitingContent ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
            <AnimatedBars isPremium={true} />
          </div>

          <div className={`absolute bottom-10 flex justify-center w-full transition-all duration-300 ${isExitingContent ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
             <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-400/80 uppercase animate-pulse">
               {text || 'Sincronizando Sistema...'}
             </p>
          </div>
          
        </div>
      </div>
    );
  }

  return null;
}