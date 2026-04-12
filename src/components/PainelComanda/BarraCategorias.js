'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function BarraCategorias({
  temaNoturno,
  categoriasSeguras,
  categoriaSelecionada,
  setFiltroCategoriaCardapio,
  setFiltroTexto
}) {
    
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  const categoriasContainerRef = useRef(null);
  const [precisaBotaoMais, setPrecisaBotaoMais] = useState(false);

  // Lógica de overflow isolada aqui dentro!
  useEffect(() => {
    const checkOverflow = () => {
      if (categoriasContainerRef.current) {
        const hasOverflow = categoriasContainerRef.current.scrollWidth > categoriasContainerRef.current.clientWidth;
        setPrecisaBotaoMais(hasOverflow);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [categoriasSeguras]);

  return (
    <div className={`w-full shrink-0 border-b px-4 py-2 relative z-0 ${temaNoturno ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
      <div className="flex items-center w-full relative">
        <div ref={categoriasContainerRef} className={`flex gap-2 overflow-hidden transition-all duration-300 w-full scrollbar-hide py-1 ${categoriasExpandidas ? 'flex-wrap max-h-[300px]' : 'flex-nowrap max-h-12'} ${precisaBotaoMais && !categoriasExpandidas ? 'pr-20' : ''}`}>
          {categoriasSeguras.map(c => c ? (
            <button 
              key={c.id} 
              onClick={() => { setFiltroCategoriaCardapio(c.id); setFiltroTexto(''); setCategoriasExpandidas(false); }} 
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap outline-none ${
                categoriaSelecionada?.id === c.id 
                  ? (temaNoturno ? 'bg-white text-black' : 'bg-zinc-900 text-white') 
                  : (temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.04]')
              }`}
            >
              {c.nome}
            </button>
          ) : null)}
        </div>
        
        {precisaBotaoMais && !categoriasExpandidas && (
          <div className={`absolute right-0 inset-y-0 z-10 flex items-center pl-10 pr-1 pointer-events-none ${temaNoturno ? 'bg-gradient-to-l from-[#0A0A0A] via-[#0A0A0A] to-transparent' : 'bg-gradient-to-l from-[#FAFAFA] via-[#FAFAFA] to-transparent'}`}>
            <button 
              onClick={() => setCategoriasExpandidas(true)} 
              className={`pointer-events-auto flex items-center gap-1 px-3 py-1.5 rounded-md font-medium text-[12px] transition-colors border shadow-sm ${temaNoturno ? 'bg-[#111] border-white/10 text-zinc-300 hover:bg-white/[0.06]' : 'bg-white border-black/10 text-zinc-700 hover:bg-zinc-50'}`}
            >
              Mais <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}