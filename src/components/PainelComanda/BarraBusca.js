'use client';
import React from 'react';

export default function BarraBusca({
  temaNoturno,
  inputBuscaRef,
  filtroTexto,
  setFiltroTexto,
  handleBuscaKeyDown
}) {
  return (
    <div className={`w-full shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:px-5 border-b z-10 ${temaNoturno ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
      
      <div className="w-full md:w-[320px] lg:w-[400px] relative">
        <input 
            ref={inputBuscaRef} 
            type="text" 
            placeholder="Pesquisar item ou código..." 
            value={filtroTexto} 
            onChange={(e) => setFiltroTexto(e.target.value)} 
            onKeyDown={handleBuscaKeyDown}
            className={`input-busca-produto w-full py-2 pl-9 pr-3 rounded-[8px] outline-none font-medium text-[13px] transition-colors border ${temaNoturno ? 'bg-white/[0.04] border-transparent text-white focus:bg-white/[0.06] focus:border-white/20 placeholder-zinc-500' : 'bg-black/[0.03] border-transparent text-zinc-900 focus:bg-white focus:border-black/15 shadow-sm placeholder-zinc-500'}`}
        />
        <svg className={`w-4 h-4 absolute left-3 top-[10px] ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <div className={`hidden lg:flex items-center gap-4 text-[11px] font-medium tracking-wide ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
        <div className="flex items-center gap-1.5"><kbd className={`px-1.5 py-0.5 rounded-[4px] border ${temaNoturno ? 'bg-white/[0.04] border-white/10 text-zinc-400' : 'bg-black/[0.03] border-black/10 text-zinc-600'}`}>ESC</kbd> Voltar</div>
        <div className={`w-[1px] h-3 ${temaNoturno ? 'bg-white/10' : 'bg-black/10'}`}></div>
        <div className="flex items-center gap-1.5"><kbd className={`px-1.5 py-0.5 rounded-[4px] border ${temaNoturno ? 'bg-white/[0.04] border-white/10 text-zinc-400' : 'bg-black/[0.03] border-black/10 text-zinc-600'}`}>F1</kbd> Balança</div>
        <div className="flex items-center gap-1.5"><kbd className={`px-1.5 py-0.5 rounded-[4px] border ${temaNoturno ? 'bg-white/[0.04] border-white/10 text-zinc-400' : 'bg-black/[0.03] border-black/10 text-zinc-600'}`}>F2</kbd> Pagar</div>
        <div className="flex items-center gap-1.5"><kbd className={`px-1.5 py-0.5 rounded-[4px] border ${temaNoturno ? 'bg-white/[0.04] border-white/10 text-zinc-400' : 'bg-black/[0.03] border-black/10 text-zinc-600'}`}>F3</kbd> Encerrar</div>
        <div className={`w-[1px] h-3 ${temaNoturno ? 'bg-white/10' : 'bg-black/10'}`}></div>
        <div className="flex items-center gap-1.5"><kbd className={`px-1.5 py-0.5 rounded-[4px] border ${temaNoturno ? 'bg-white/[0.04] border-white/10 text-zinc-400' : 'bg-black/[0.03] border-black/10 text-zinc-600'}`}>F4</kbd> Cliente</div>
      </div>
    </div>
  );
}