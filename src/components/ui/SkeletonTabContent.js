'use client';
import React from 'react';
import { SkeletonBlock, ShimmerEngine } from '@/components/ui/Skeletons';

export const SkeletonTabContent = ({ temaNoturno = true }) => (
  <div className="w-full h-full flex flex-col gap-6 p-4 md:p-8 pt-2 md:pt-6 animate-in fade-in duration-500">
    <ShimmerEngine />
    
    <SkeletonBlock temaNoturno={temaNoturno} className="w-48 h-8 rounded-lg mb-2" />
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full flex-1">
      <SkeletonBlock temaNoturno={temaNoturno} className="lg:col-span-2 rounded-[32px] h-full min-h-[400px]" delay={100} />
      <SkeletonBlock temaNoturno={temaNoturno} className="rounded-[32px] h-full min-h-[400px]" delay={200} />
    </div>
  </div>
);