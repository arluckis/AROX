'use client';
import React, { useState } from 'react';

// Hook que lê o tema do usuário em tempo real para os fantasmas
export const useTema = () => {
  const [temaNoturno] = useState(() => {
    if (typeof window !== 'undefined') {
      const tema = localStorage.getItem('arox_tema_noturno');
      if (tema !== null) return JSON.parse(tema);
    }
    return true; // Default Dark
  });
  return temaNoturno;
};

// --- 1. O MOTOR DE SHIMMER (Injetado apenas uma vez) ---
// CORREÇÃO: Agora com 'export' para poder ser importado no Admin Dashboard
export const ShimmerEngine = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes arox-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-shimmer {
      animation: arox-shimmer 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
    }
  `}} />
);

// --- 2. BLOCO ATÔMICO (A base de tudo) ---
export const SkeletonBlock = ({ temaNoturno = true, className = '', delay = 0, style = {} }) => {
  // Cores ultra-sutis (Ghost UI) sensíveis ao tema real
  const baseColor = temaNoturno 
    ? 'bg-white/[0.02] border-white/[0.02]' 
    : 'bg-black/[0.03] border-black/[0.02]';
    
  const shimmerGradient = temaNoturno 
    ? 'from-transparent via-white/[0.04] to-transparent' 
    : 'from-transparent via-black/[0.04] to-transparent';

  return (
    <div 
      className={`relative overflow-hidden border ${baseColor} ${className}`} 
      style={{ ...style, animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r ${shimmerGradient}`} />
    </div>
  );
};


// --- 3. ESQUELETOS INDIVIDUAIS COM POSICIONAMENTO REAL POR ABA ---

export const SkeletonTabComandas = () => {
  const temaNoturno = useTema();
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-0 pt-2 animate-in fade-in duration-500">
      <ShimmerEngine />
      <div className="flex justify-between items-center mb-8 border-b pb-6 border-transparent">
         <div className="flex flex-col gap-2">
            <SkeletonBlock temaNoturno={temaNoturno} className="w-32 h-6 rounded-md" />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-48 h-4 rounded-md" />
         </div>
         <SkeletonBlock temaNoturno={temaNoturno} className="w-32 h-10 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-5 w-full">
         {[1,2,3,4,5,6].map(i => <SkeletonBlock key={i} temaNoturno={temaNoturno} className="w-full sm:w-[280px] h-[152px] rounded-2xl" delay={i*50}/>)}
      </div>
    </div>
  );
};

export const SkeletonTabFechadas = () => {
  const temaNoturno = useTema();
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-0 pt-2 animate-in fade-in duration-500">
      <ShimmerEngine />
      <div className="flex justify-between items-center mb-8 border-b pb-6 border-transparent">
         <div className="flex flex-col gap-2">
            <SkeletonBlock temaNoturno={temaNoturno} className="w-24 h-6 rounded-md" />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-40 h-4 rounded-md" />
         </div>
         <SkeletonBlock temaNoturno={temaNoturno} className="w-48 h-10 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-5 w-full">
         {[1,2,3,4].map(i => <SkeletonBlock key={i} temaNoturno={temaNoturno} className="w-full sm:w-[280px] h-[152px] rounded-2xl" delay={i*50}/>)}
      </div>
    </div>
  );
};

export const SkeletonTabFaturamento = () => {
  const temaNoturno = useTema();
  return (
    <div className="w-full h-full flex flex-col mt-4 p-4 md:p-0 animate-in fade-in duration-500">
      <ShimmerEngine />
      <div className="flex justify-between items-center mb-6">
         <SkeletonBlock temaNoturno={temaNoturno} className="w-64 h-10 rounded-xl" />
         <SkeletonBlock temaNoturno={temaNoturno} className="w-48 h-10 rounded-xl" />
      </div>
      <div className="flex flex-col gap-5 w-full">
         <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-16 rounded-[24px]" />
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[120px] rounded-[24px]" />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[120px] rounded-[24px]" delay={50} />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[120px] rounded-[24px]" delay={100} />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 grid-flow-dense">
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[200px] rounded-[24px]" delay={150} />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[200px] rounded-[24px] col-span-1 md:col-span-2 xl:col-span-2 2xl:col-span-3" delay={200} />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[180px] rounded-[24px]" delay={250} />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[200px] rounded-[24px]" delay={300} />
         </div>
      </div>
    </div>
  );
};

export const SkeletonTabFechamentoCaixa = () => {
  const temaNoturno = useTema();
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-0 animate-in fade-in duration-500">
      <ShimmerEngine />
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-transparent">
         <div className="flex gap-6">
            <SkeletonBlock temaNoturno={temaNoturno} className="w-24 h-6 rounded-md" />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-32 h-6 rounded-md" />
         </div>
         <div className="flex gap-3">
            <SkeletonBlock temaNoturno={temaNoturno} className="w-32 h-10 rounded-xl" />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-40 h-10 rounded-xl" />
         </div>
      </div>
      <div className="flex flex-col gap-6 mt-6">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full min-h-[300px] rounded-[32px]" delay={50} />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full min-h-[300px] rounded-[32px]" delay={100} />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-full min-h-[300px] rounded-[32px]" delay={150} />
         </div>
         <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-14 rounded-[20px]" delay={200} />
      </div>
    </div>
  );
};

export const SkeletonTabFidelidade = () => {
  const temaNoturno = useTema();
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 animate-in fade-in duration-500">
      <ShimmerEngine />
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-transparent">
         <div className="flex gap-6">
            <SkeletonBlock temaNoturno={temaNoturno} className="w-20 h-6 rounded-md" />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-20 h-6 rounded-md" />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-20 h-6 rounded-md" />
            <SkeletonBlock temaNoturno={temaNoturno} className="w-32 h-6 rounded-md" />
         </div>
         <SkeletonBlock temaNoturno={temaNoturno} className="w-32 h-10 rounded-xl" />
      </div>
      <div className="flex gap-3 mb-6">
         <SkeletonBlock temaNoturno={temaNoturno} className="w-full sm:w-80 h-10 rounded-xl" />
         <SkeletonBlock temaNoturno={temaNoturno} className="w-full sm:w-64 h-10 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3">
         {[1,2,3,4,5].map(i => <SkeletonBlock key={i} temaNoturno={temaNoturno} className="w-full h-[80px] rounded-[20px]" delay={i*50}/>)}
      </div>
    </div>
  );
};

// --- ESQUELETO DO PAINEL DE COMANDAS ---
export const SkeletonPainelComanda = () => {
  const temaNoturno = useTema();
  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500 rounded-[32px] overflow-hidden border border-transparent">
      <ShimmerEngine />

      <div className={`w-full shrink-0 px-4 py-3 flex gap-3 overflow-hidden border-b ${temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
        {[1, 2, 3, 4, 5, 6].map((i, idx) => (
          <SkeletonBlock key={i} temaNoturno={temaNoturno} className="h-8 w-24 shrink-0 rounded-lg" delay={idx * 50} />
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        <div className={`w-full md:w-[65%] lg:w-[70%] flex flex-col h-full p-4 md:p-6 md:border-r ${temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
          <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[76px] mb-6 rounded-[20px]" />
          <SkeletonBlock temaNoturno={temaNoturno} className="h-4 w-32 mb-5 rounded-md" delay={100} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i, idx) => (
              <SkeletonBlock key={i} temaNoturno={temaNoturno} className="h-[72px] rounded-[16px]" delay={150 + (idx * 30)} />
            ))}
          </div>
        </div>

        <div className={`hidden md:flex w-full md:w-[35%] lg:w-[30%] flex-col h-full p-4 md:p-6`}>
          <SkeletonBlock temaNoturno={temaNoturno} className="h-5 w-40 mb-8 rounded-md" delay={200} />
          
          <div className="flex-1 space-y-6">
            {[1, 2, 3].map((i, idx) => (
              <div key={i} className="flex justify-between items-start">
                 <div className="flex flex-col gap-2 w-full pr-6">
                   <SkeletonBlock temaNoturno={temaNoturno} className="h-3 w-full rounded" delay={250 + (idx * 50)} />
                   <SkeletonBlock temaNoturno={temaNoturno} className="h-6 w-20 rounded-md" delay={300 + (idx * 50)} />
                 </div>
                 <SkeletonBlock temaNoturno={temaNoturno} className="h-4 w-10 rounded shrink-0" delay={250 + (idx * 50)} />
              </div>
            ))}
          </div>
          
          <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[140px] rounded-[24px] mt-auto" delay={400} />
        </div>
      </div>
    </div>
  );
};