'use client';
import React from 'react';
import { SkeletonBlock, ShimmerEngine } from '@/components/ui/Skeletons';

export const SkeletonPainelComanda = ({ temaNoturno = true, abaDetalheMobile = 'menu' }) => {
  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500 rounded-[32px] overflow-hidden border border-transparent">
      <ShimmerEngine />

      <div className={`w-full shrink-0 px-4 py-3 flex gap-3 overflow-hidden border-b ${temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
        {[1, 2, 3, 4, 5, 6].map((i, idx) => (
          <SkeletonBlock key={i} temaNoturno={temaNoturno} className="h-8 w-24 shrink-0 rounded-lg" delay={idx * 50} />
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        <div className={`w-full md:w-[65%] lg:w-[70%] flex flex-col h-full p-4 md:p-6 md:border-r ${abaDetalheMobile === 'menu' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
          <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[76px] mb-6 rounded-[20px]" />
          <SkeletonBlock temaNoturno={temaNoturno} className="h-4 w-32 mb-5 rounded-md" delay={100} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i, idx) => (
              <SkeletonBlock key={i} temaNoturno={temaNoturno} className="h-[72px] rounded-[16px]" delay={150 + (idx * 30)} />
            ))}
          </div>
        </div>

        <div className={`w-full md:w-[35%] lg:w-[30%] flex flex-col h-full p-4 md:p-6 ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'}`}>
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