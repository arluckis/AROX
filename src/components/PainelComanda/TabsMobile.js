'use client';
import React from 'react';

export default function TabsMobile({
  temaNoturno,
  abaDetalheMobile,
  setAbaDetalheMobile,
  qtdProdutos
}) {
  return (
    <div className={`md:hidden flex p-1 mx-4 mt-4 rounded-lg shrink-0 border ${temaNoturno ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]'}`}>
      <button 
        onClick={() => setAbaDetalheMobile('menu')} 
        className={`flex-1 py-2 text-[12px] font-medium rounded-md transition-all ${abaDetalheMobile === 'menu' ? (temaNoturno ? 'bg-[#222] text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm border border-black/5') : 'text-zinc-500'}`}
      >
        Cardápio
      </button>
      <button 
        onClick={() => setAbaDetalheMobile('resumo')} 
        className={`flex-1 py-2 text-[12px] font-medium rounded-md transition-all flex items-center justify-center gap-2 ${abaDetalheMobile === 'resumo' ? (temaNoturno ? 'bg-[#222] text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm border border-black/5') : 'text-zinc-500'}`}
      >
        Comanda <span className={`px-1.5 py-0.5 rounded text-[10px] ${abaDetalheMobile === 'resumo' ? (temaNoturno ? 'bg-white/10' : 'bg-black/5') : 'bg-transparent border border-current opacity-50'}`}>{qtdProdutos}</span>
      </button>
    </div>
  );
}