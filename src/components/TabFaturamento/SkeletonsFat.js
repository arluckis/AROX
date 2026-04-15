'use client';
import React from 'react';

const PremiumShimmerStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes premium-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
    .shimmer-wrapper { position: relative; overflow: hidden; }
    .shimmer-wrapper::after {
      content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%);
      animation: premium-shimmer 2s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    .shimmer-light::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); }
    .shimmer-dark::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); }
  `}} />
);

const SkeletonBlock = ({ isDark, className, delay = 0 }) => {
  const bgClass = isDark ? 'bg-[#18181b] border border-white/[0.04]' : 'bg-[#f4f4f5] border border-black/[0.02]';
  return <div className={`shimmer-wrapper ${isDark ? 'shimmer-dark' : 'shimmer-light'} ${bgClass} rounded-xl ${className}`} style={{ animationDelay: `${delay}ms` }} />;
};

export function SkeletonWidgetFat({ temaNoturno, altura = "min-h-[220px]" }) {
  return (
    <div className={`w-full ${altura} p-6 rounded-[24px] border flex flex-col ${temaNoturno ? 'bg-[#0A0A0A]/80 border-white/[0.04]' : 'bg-white/80 border-black/[0.04]'}`}>
      <PremiumShimmerStyles />
      <SkeletonBlock isDark={temaNoturno} className="h-4 w-1/3 mb-6 rounded-md" />
      <div className="flex-1 flex items-end gap-3 w-full">
         {[1,2,3,4,5,6].map((i, idx) => (
           <SkeletonBlock key={i} isDark={temaNoturno} className="w-full rounded-t-sm" delay={idx * 100} style={{ height: `${20 + (Math.random() * 80)}%` }} />
         ))}
      </div>
    </div>
  );
}

export function SkeletonCardBase({ temaNoturno }) {
  return (
    <div className={`p-6 rounded-[24px] shadow-sm min-h-[120px] w-full border ${temaNoturno ? 'bg-[#0A0A0A]/80 border-white/[0.04]' : 'bg-white/80 border-black/[0.04]'}`}>
      <PremiumShimmerStyles />
      <SkeletonBlock isDark={temaNoturno} className="h-3 w-1/2 mb-4 rounded-md" />
      <SkeletonBlock isDark={temaNoturno} className="h-8 w-3/4 rounded-md" delay={100} />
    </div>
  );
}