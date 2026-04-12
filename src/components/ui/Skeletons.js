'use client';
import React, { useState } from 'react';

// Hook Inteligente para detetar o tema no exato milissegundo do carregamento
const useTemaSincronizado = () => {
  const [isDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('arox_tema_noturno');
      return salvo !== 'false'; // Se for null ou 'true', assume escuro (seu padrão)
    }
    return true;
  });
  return isDark;
};

// A MÁGICA DE ALTO PADRÃO: CSS injetado de forma isolada
const PremiumShimmerStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes premium-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    .shimmer-wrapper {
      position: relative;
      overflow: hidden;
    }
    .shimmer-wrapper::after {
      content: '';
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      transform: translateX(-100%);
      animation: premium-shimmer 2s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    .shimmer-light::after {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
    }
    .shimmer-dark::after {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    }
  `}} />
);

// Componente Base com lógica de Tema Inteligente
const SkeletonBlock = ({ isDark, className, delay = 0 }) => {
  const bgClass = isDark ? 'bg-[#18181b] border border-white/[0.04]' : 'bg-[#f4f4f5] border border-black/[0.02]';
  const shimmerClass = isDark ? 'shimmer-dark' : 'shimmer-light';
  
  return (
    <div 
      className={`shimmer-wrapper ${shimmerClass} ${bgClass} rounded-xl ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
};

// 1. Esqueleto para a Barra de Categorias
export function SkeletonCategorias() {
  const isDark = useTemaSincronizado();
  const borderSkeleton = isDark ? 'border-white/[0.06]' : 'border-black/[0.06]';

  return (
    <div className={`w-full shrink-0 border-b px-4 py-3 flex gap-3 overflow-hidden ${borderSkeleton}`}>
      <PremiumShimmerStyles />
      {[1, 2, 3, 4, 5, 6].map((i, index) => (
        <SkeletonBlock key={i} isDark={isDark} className="h-8 w-24 shrink-0 rounded-md" delay={index * 100} />
      ))}
    </div>
  );
}

// 2. Esqueleto para a Grade de Produtos (Lado Esquerdo)
export function SkeletonGradeProdutos({ abaDetalheMobile }) {
  const isDark = useTemaSincronizado();
  const borderSkeleton = isDark ? 'border-white/[0.06]' : 'border-black/[0.06]';

  return (
    <div className={`w-full md:w-[65%] lg:w-[70%] flex flex-col h-full min-h-0 border-r p-4 md:p-6 ${abaDetalheMobile === 'menu' ? 'flex' : 'hidden md:flex'} ${borderSkeleton}`}>
      <PremiumShimmerStyles />
      
      <SkeletonBlock isDark={isDark} className="w-full h-[76px] mb-6" />
      <SkeletonBlock isDark={isDark} className="h-4 w-32 mb-4 rounded-md" delay={150} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i, index) => (
          <SkeletonBlock key={i} isDark={isDark} className="h-[68px]" delay={200 + (index * 50)} />
        ))}
      </div>
    </div>
  );
}

// 3. Esqueleto para o Carrinho (Lado Direito)
export function SkeletonCarrinho({ abaDetalheMobile }) {
  const isDark = useTemaSincronizado();

  return (
    <div className={`w-full md:w-[35%] lg:w-[30%] flex flex-col h-full min-h-0 p-4 md:p-5 ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'} ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
      <PremiumShimmerStyles />
      
      <div className="flex-1 space-y-6 mt-4">
        {[1, 2, 3].map((i, index) => (
          <div key={i} className="flex justify-between items-start">
             <div className="flex flex-col gap-2 w-full pr-4">
               <SkeletonBlock isDark={isDark} className="h-4 w-3/4 rounded" delay={index * 100} />
               <SkeletonBlock isDark={isDark} className="h-8 w-24 rounded-md" delay={(index * 100) + 50} />
             </div>
             <SkeletonBlock isDark={isDark} className="h-4 w-12 rounded shrink-0" delay={index * 100} />
          </div>
        ))}
      </div>
      
      <SkeletonBlock isDark={isDark} className="w-full h-[120px] rounded-[16px] mt-auto shadow-2xl" delay={400} />
    </div>
  );
}