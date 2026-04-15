'use client';
import React from 'react';

const ShimmerCaixa = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes shimmer-caixa { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
    .shimmer-box { position: relative; overflow: hidden; }
    .shimmer-box::after {
      content: ''; position: absolute; inset: 0; transform: translateX(-100%);
      animation: shimmer-caixa 2s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    .shimmer-l::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); }
    .shimmer-d::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); }
  `}} />
);

export function SkeletonCardCaixa({ temaNoturno, altura = "min-h-[300px]" }) {
  const bg = temaNoturno ? 'bg-[#18181b] border-white/[0.04]' : 'bg-[#f4f4f5] border-black/[0.02]';
  const sh = temaNoturno ? 'shimmer-d' : 'shimmer-l';
  return (
    <div className={`p-6 md:p-8 rounded-[32px] border w-full flex flex-col gap-6 ${altura} ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <ShimmerCaixa />
      <div className={`h-6 w-1/2 rounded-md shimmer-box ${sh} ${bg}`}></div>
      <div className="flex-1 flex flex-col gap-4 justify-end">
        <div className={`h-12 w-full rounded-xl shimmer-box ${sh} ${bg}`}></div>
        <div className={`h-12 w-full rounded-xl shimmer-box ${sh} ${bg}`}></div>
      </div>
    </div>
  );
}