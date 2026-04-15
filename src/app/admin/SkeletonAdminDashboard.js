'use client';
import React from 'react';
import { SkeletonBlock, ShimmerEngine } from '@/components/ui/Skeletons';

export const SkeletonAdminDashboard = ({ temaNoturno }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <ShimmerEngine />
      
      <header className="mb-8 border-b pb-6 border-black/5 dark:border-white/5">
        <SkeletonBlock temaNoturno={temaNoturno} className="h-10 w-64 rounded-lg mb-2" />
        <SkeletonBlock temaNoturno={temaNoturno} className="h-4 w-96 rounded-md" />
      </header>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        {[1, 2, 3, 4].map((i, idx) => (
          <div key={i} className={`p-6 rounded-[20px] border shadow-sm ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5'}`}>
            <SkeletonBlock temaNoturno={temaNoturno} className="h-3 w-24 mb-4 rounded" delay={idx * 50} />
            <SkeletonBlock temaNoturno={temaNoturno} className="h-8 w-32 rounded-lg" delay={idx * 50} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className={`lg:col-span-2 p-6 md:p-8 rounded-[24px] border ${temaNoturno ? 'bg-[#111111]/80 border-white/[0.04]' : 'bg-white border-black/[0.04]'}`}>
           <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[200px] rounded-xl" delay={150} />
        </div>

        <div className={`p-6 rounded-[24px] border flex flex-col ${temaNoturno ? 'bg-[#111111]/80 border-white/[0.04]' : 'bg-white border-black/[0.04]'}`}>
           <SkeletonBlock temaNoturno={temaNoturno} className="h-4 w-32 mb-6 rounded" delay={200} />
           <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((i) => (
               <SkeletonBlock key={i} temaNoturno={temaNoturno} className="h-10 w-full rounded-lg" delay={200 + (i * 30)} />
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};