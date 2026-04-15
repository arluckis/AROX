'use client';
import React from 'react';

const BaseShimmer = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes shimmer-fid { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
    .shimmer-box { position: relative; overflow: hidden; }
    .shimmer-box::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); animation: shimmer-fid 2s infinite cubic-bezier(0.4, 0.0, 0.2, 1); }
    .shimmer-l::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); }
    .shimmer-d::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); }
  `}} />
);

export function SkeletonRanking({ temaNoturno }) {
  const bg = temaNoturno ? 'bg-[#18181b] border-white/[0.04]' : 'bg-[#f4f4f5] border-black/[0.02]';
  const sh = temaNoturno ? 'shimmer-d' : 'shimmer-l';
  return (
    <div className={`w-full pt-4 md:pt-6 flex flex-col gap-10`}>
      <BaseShimmer />
      <div className={`w-full max-w-sm mx-auto h-[250px] rounded-[32px] shimmer-box ${sh} ${bg}`}></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
         {[1,2,3,4].map(i => <div key={i} className={`h-[140px] rounded-[24px] shimmer-box ${sh} ${bg}`}></div>)}
      </div>
    </div>
  );
}