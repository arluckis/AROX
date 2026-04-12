'use client';
import React from 'react';

export default function GradeProdutos({
  temaNoturno,
  abaDetalheMobile,
  setMostrarModalPeso,
  filtroTexto,
  categoriaSelecionada,
  itensFiltrados,
  adicionarProdutoNaComanda
}) {

  const renderBotaoProduto = (item, idx) => (
    <button 
      key={item.id || Math.random()} 
      onClick={() => adicionarProdutoNaComanda(item)} 
      className={`p-3.5 rounded-xl flex justify-between items-center gap-3 transition-colors active:scale-[0.98] text-left border animate-in fade-in zoom-in-95 fill-mode-both ${temaNoturno ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10' : 'bg-white border-black/[0.06] shadow-sm hover:border-black/15 hover:shadow'}`}
      style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <span className={`font-semibold text-[13px] tracking-tight truncate ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>
          {item?.nome || 'Produto'}
        </span>
        {item?.codigo && <span className={`text-[11px] font-medium tracking-wide mt-0.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.codigo}</span>}
      </div>
      <span className={`shrink-0 px-2 py-1 rounded-[6px] text-[12px] font-semibold tabular-nums tracking-tight ${temaNoturno ? 'bg-white/5 text-zinc-300' : 'bg-black/[0.03] text-zinc-700'}`}>
        {Number(item?.preco || 0).toFixed(2)}
      </span>
    </button>
  );

  return (
    <div className={`w-full md:w-[65%] lg:w-[70%] flex flex-col h-full min-h-0 border-r ${abaDetalheMobile === 'menu' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 pb-20 scrollbar-hide">
        
        <button onClick={() => setMostrarModalPeso(true)} className={`w-full flex justify-between items-center p-4 md:p-5 mb-6 rounded-xl border transition-colors active:scale-[0.99] group ${temaNoturno ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/20' : 'bg-white border-black/[0.06] shadow-sm hover:border-black/15'}`}>
           <div className="flex flex-col text-left gap-0.5">
             <span className={`font-semibold text-[14px] tracking-tight ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>Adicionar via Balança</span>
             <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Lançamento por peso conectado</span>
           </div>
           <div className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${temaNoturno ? 'bg-white/5 text-zinc-300 group-hover:bg-white/10 group-hover:text-white' : 'bg-black/5 text-zinc-600 group-hover:bg-black/10 group-hover:text-zinc-900'}`}>
             Atalho F1
           </div>
        </button>

        <div>
          <h3 className={`text-[12px] font-semibold tracking-wide mb-3 px-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {filtroTexto ? 'Resultados' : categoriaSelecionada?.nome}
          </h3>
          {itensFiltrados.length === 0 ? (
            <p className={`text-[13px] italic px-1 ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {itensFiltrados.map((item, idx) => renderBotaoProduto(item, idx))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}