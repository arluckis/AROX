import { useEffect } from 'react';

export function useAtalhosTeclado({
  modalAberto,
  produtosSeguros,
  comandaAtiva,
  setMostrarModalPeso,
  setMostrarModalPagamento,
  encerrarMesa,
  setIdSelecionado,
  alternarTipoComanda,
  inputBuscaRef
}) {
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea';
      
      if (modalAberto) return;

      const isSpecialKey = ['F1', 'F2', 'F3', 'F4', 'F6', 'Escape', 'Enter'].includes(e.key);
      if (!isSpecialKey && isInput) return;

      if (e.key === 'Escape') { 
        e.preventDefault(); 
        if (isInput && activeEl !== inputBuscaRef.current) {
          const isMobile = window.innerWidth <= 768;
          if (!isMobile) inputBuscaRef.current?.focus();
          else activeEl?.blur();
        } else {
          activeEl?.blur();
          if (setIdSelecionado) setIdSelecionado(null); 
        }
        return;
      }

      if (e.key === 'Enter' && isInput && activeEl === inputBuscaRef.current) return; 

      if (e.key === 'F1') { e.preventDefault(); activeEl?.blur(); setMostrarModalPeso(true); }
      if (e.key === 'F2') { 
        e.preventDefault(); 
        if (produtosSeguros.filter(p => !p.pago).length > 0) { activeEl?.blur(); setMostrarModalPagamento(true); }
      }
      if (e.key === 'F3') { 
        e.preventDefault(); 
        if (produtosSeguros.length > 0 && !produtosSeguros.some(p => !p.pago)) { activeEl?.blur(); encerrarMesa(); }
      }
      if (e.key === 'F4') { 
        e.preventDefault();
        const inputCliente = document.querySelector('.input-cliente');
        if (inputCliente) { inputCliente.focus(); } 
      }
      if (e.key === 'F6') { e.preventDefault(); activeEl?.blur(); if(alternarTipoComanda) alternarTipoComanda(comandaAtiva?.id, comandaAtiva?.tipo); }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [modalAberto, produtosSeguros, comandaAtiva, setMostrarModalPeso, setMostrarModalPagamento, encerrarMesa, setIdSelecionado, alternarTipoComanda, inputBuscaRef]);
}