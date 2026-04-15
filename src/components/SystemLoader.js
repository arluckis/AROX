'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function SystemLoader({ variant = 'section', text = '', phase = 'sync', exitStage = 'none', temaAnterior = 'dark' }) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLight = temaAnterior === 'light';
  
  const targetProgress = useRef(0);

  // Sistema de simulação de carregamento core (aceleração/desaceleração orgânica)
  useEffect(() => {
    setMounted(true);
    
    // Progressão baseada nas fases do boot sequence
    if (phase === 'ignition') targetProgress.current = 15;
    else if (phase === 'reveal') targetProgress.current = 45;
    else if (phase === 'sync') targetProgress.current = 85;
    else if (phase.includes('bridge') || phase === 'operational') targetProgress.current = 100;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress.current) return prev;
        
        // Easing simples: quanto mais perto do alvo, mais devagar
        const diff = targetProgress.current - prev;
        const step = Math.max(0.5, diff * 0.08); 
        const next = prev + step;
        return next > targetProgress.current ? targetProgress.current : next;
      });
    }, 30);
    
    return () => clearInterval(interval);
  }, [phase]);

  const isExitingContent = exitStage !== 'none';
  const isExitingCard = exitStage === 'card' || exitStage === 'arox';
  const isExitingArox = exitStage === 'arox';

  const AnimatedBars = () => (
    <div className="flex items-center justify-center gap-[6px] h-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={`w-[2px] rounded-full transition-all animate-[pulse_1.2s_ease-in-out_infinite] ${
            isLight 
              ? 'bg-zinc-800 opacity-80' 
              : 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
          }`}
          style={{ height: i % 2 === 0 ? '60%' : '100%', animationDelay: `${i * 0.15}s` }}
        ></div>
      ))}
    </div>
  );

  // --- VARIANTE FULL (Ritual de Boot do Sistema) ---
  if (variant === 'full') {
    const isExitingLoaderGlobal = phase === 'operational' || phase === 'bridgeDark' || phase === 'bridgeLight';
    const isEarly = phase === 'ignition' || phase === 'reveal';

    return (
      <div className={`absolute inset-0 z-50 w-full h-full flex flex-col items-center justify-center perspective-[1200px] transition-all duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isExitingLoaderGlobal ? 'pointer-events-none opacity-0 scale-105 blur-lg' : 
        (!mounted || isEarly) ? 'opacity-0 scale-95 blur-md pointer-events-none' : 'opacity-100 scale-100 blur-0'
      }`}>
        
        <div className={`flex flex-col items-center justify-center p-12 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] min-w-[340px] min-h-[340px] relative overflow-hidden ${
          isExitingCard 
            ? 'bg-transparent border-transparent shadow-none backdrop-blur-none scale-[1.05]' 
            : (isLight 
                ? 'bg-white/70 backdrop-blur-[24px] border border-black/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.07)] rounded-[40px]' 
                : 'bg-[#0A0A0C]/80 backdrop-blur-[24px] border border-white/[0.06] shadow-[0_30px_80px_rgba(0,0,0,0.6)] rounded-[40px]')
        }`}>
          
          <div className={`absolute top-12 flex flex-col items-center justify-center w-full transition-all duration-[400ms] ease-out ${isExitingArox ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
             <span className={`text-[16px] font-black tracking-[0.5em] uppercase mb-1.5 ${isLight ? 'text-zinc-900' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'}`}>
               AROX
             </span>
             <span className={`text-[9px] font-bold tracking-[0.3em] uppercase transition-opacity duration-300 ${isExitingContent ? 'opacity-0' : 'opacity-100'} ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
               Ignition Sequence
             </span>
          </div>

          <div className={`flex flex-col items-center justify-center mt-2 transition-all duration-300 ${isExitingContent ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
            <AnimatedBars />
          </div>

          <div className={`absolute bottom-12 flex flex-col items-center justify-center w-full px-10 transition-all duration-300 ${isExitingContent ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
             <p className={`text-[10px] font-bold tracking-[0.25em] uppercase mb-4 animate-pulse ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
               {text || 'Sincronizando Core...'}
             </p>
             
             {/* Progress Bar Premium (Full) */}
             <div className="w-full flex items-center gap-4">
                <div className={`flex-1 h-[2px] rounded-full overflow-hidden ${isLight ? 'bg-black/[0.04]' : 'bg-white/[0.05]'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-200 ease-out ${
                      isLight 
                        ? 'bg-zinc-900' 
                        : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                    }`} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={`text-[10px] font-mono tracking-widest tabular-nums w-8 text-right ${isLight ? 'text-zinc-600 font-bold' : 'text-zinc-400'}`}>
                  {Math.floor(progress)}%
                </span>
             </div>
          </div>
          
        </div>
      </div>
    );
  }

  // --- VARIANTE SECTION (Pequenos carregamentos internos) ---
  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-1000 ${phase.includes('bridge') ? 'opacity-0 scale-110 blur-xl pointer-events-none' : 'opacity-100'}`}>
      <div className={`flex flex-col items-center p-12 rounded-[40px] transition-all duration-700 w-full max-w-[320px] ${
        isLight 
          ? 'bg-white/80 backdrop-blur-[24px] border border-black/[0.04] shadow-[0_40px_100px_rgba(0,0,0,0.05)]' 
          : 'bg-[#0A0A0C]/80 backdrop-blur-[24px] border border-white/[0.06] shadow-2xl'
      }`}>
        <div className="flex flex-col items-center mb-8">
          <span className={`text-[12px] font-black tracking-[0.6em] uppercase mb-2 ${isLight ? 'text-zinc-900' : 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]'}`}>
            AROX
          </span>
          <div className={`h-[1px] w-4 ${isLight ? 'bg-zinc-900/10' : 'bg-white/20'}`} />
        </div>

        <AnimatedBars />

        <p className={`mt-8 mb-4 text-[9px] font-bold tracking-[0.4em] uppercase animate-pulse ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {text || 'Processando...'}
        </p>

        {/* Progress Bar Premium (Section) */}
        <div className="w-full max-w-[140px] flex flex-col items-center gap-2">
            <div className={`w-full h-[1.5px] rounded-full overflow-hidden ${isLight ? 'bg-black/[0.05]' : 'bg-white/[0.05]'}`}>
              <div 
                className={`h-full rounded-full transition-all duration-200 ease-out ${
                  isLight ? 'bg-zinc-800' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                }`} 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={`text-[9px] font-mono tracking-widest tabular-nums ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
              {Math.floor(progress)}%
            </span>
        </div>

      </div>
    </div>
  );
}