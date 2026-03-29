'use client';
import { useMemo, useState, useEffect, useRef } from 'react';
import SystemLoader from './SystemLoader';

export default function PainelComanda({
  temaNoturno,
  comandaAtiva,
  abaDetalheMobile,
  setAbaDetalheMobile,
  filtroCategoriaCardapio,
  setFiltroCategoriaCardapio,
  menuCategorias,
  adicionarProdutoNaComanda,
  excluirGrupoProdutos,
  setMostrarModalPeso,
  tagsGlobais,
  toggleTag,
  editarProduto,
  excluirProduto,
  setMostrarModalPagamento,
  encerrarMesa,
  setIdSelecionado,
  alterarNomeComanda,
  adicionarClienteComanda,
  alternarTipoComanda,
  modalAberto
}) {
  const [mostrarTags, setMostrarTags] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [quantidadesEditaveis, setQuantidadesEditaveis] = useState({});
  const inputBuscaRef = useRef(null);

  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  const categoriasContainerRef = useRef(null);
  const [precisaBotaoMais, setPrecisaBotaoMais] = useState(false);

  const categoriasSeguras = Array.isArray(menuCategorias) ? menuCategorias : [];
  const produtosSeguros = Array.isArray(comandaAtiva?.produtos) ? comandaAtiva.produtos : [];
  const tagsSeguras = Array.isArray(comandaAtiva?.tags) ? comandaAtiva.tags : [];
  const tagsDoSistema = Array.isArray(tagsGlobais) ? tagsGlobais : [];

  const categoriaSelecionada = categoriasSeguras.find(c => c.id === filtroCategoriaCardapio) || categoriasSeguras[0];

  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (inputBuscaRef.current && !modalAberto && !isMobile) {
      inputBuscaRef.current.focus();
    }
  }, [comandaAtiva?.id, modalAberto]);

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
      if (e.key === 'F6') { e.preventDefault(); activeEl?.blur(); if(alternarTipoComanda) alternarTipoComanda(comandaAtiva.id, comandaAtiva.tipo); }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [modalAberto, produtosSeguros, comandaAtiva, setMostrarModalPeso, setMostrarModalPagamento, encerrarMesa, setIdSelecionado, adicionarClienteComanda, alternarTipoComanda]);

  const itensFiltrados = useMemo(() => {
    if (!filtroTexto) return categoriaSelecionada?.itens || [];
    const busca = filtroTexto.toLowerCase();
    const termoBuscaReal = busca.includes('*') ? busca.split('*')[1].trim() : busca;
    if (!termoBuscaReal) return categoriaSelecionada?.itens || [];

    return categoriasSeguras.flatMap(c => c.itens || []).filter(p => 
      p.nome.toLowerCase().includes(termoBuscaReal) || 
      (p.codigo && String(p.codigo).toLowerCase().includes(termoBuscaReal))
    );
  }, [categoriasSeguras, categoriaSelecionada, filtroTexto]);

  const handleBuscaKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!filtroTexto.trim()) return;

      let qtd = 1;
      let busca = filtroTexto.trim().toLowerCase();
      
      if (busca.includes('*')) {
        const parts = busca.split('*');
        qtd = parseInt(parts[0]) || 1;
        busca = parts[1].trim();
      }

      if (!busca) return;

      let produtoEncontrado = null;
      let idCategoriaDoProduto = null;

      for (const cat of categoriasSeguras) {
        if (cat.itens) {
          produtoEncontrado = cat.itens.find(p => String(p.id) === busca || (p.codigo && String(p.codigo).toLowerCase() === busca));
          if (produtoEncontrado) { idCategoriaDoProduto = cat.id; break; }
        }
      }

      if (!produtoEncontrado && itensFiltrados.length > 0) {
        produtoEncontrado = itensFiltrados[0];
        const catEncontrada = categoriasSeguras.find(c => c.itens?.some(i => i.id === produtoEncontrado.id));
        if (catEncontrada) idCategoriaDoProduto = catEncontrada.id;
      }

      if (produtoEncontrado) {
        adicionarProdutoNaComanda(produtoEncontrado, qtd);
        setFiltroTexto('');
        if (idCategoriaDoProduto && idCategoriaDoProduto !== filtroCategoriaCardapio) {
          setFiltroCategoriaCardapio(idCategoriaDoProduto);
        }
      }
    }
  };

  const handleConfirmarQuantidadeDigitada = (grupo, novaQtdeStr, indexGrupo) => {
    setQuantidadesEditaveis({...quantidadesEditaveis, [indexGrupo]: undefined});
    const novaQtde = parseInt(novaQtdeStr);
    if (isNaN(novaQtde) || novaQtde < 0) return;
    if (novaQtde === grupo.quantidade) return;

    if (novaQtde === 0) {
      if(excluirGrupoProdutos) excluirGrupoProdutos(grupo.nome, grupo.precoUnitario);
      return;
    }

    if (novaQtde > grupo.quantidade) {
      const diferenca = novaQtde - grupo.quantidade;
      const produtoFake = { nome: grupo.nome, preco: grupo.precoUnitario, custo: grupo.custo };
      adicionarProdutoNaComanda(produtoFake, diferenca);
      return;
    }

    if (novaQtde < grupo.quantidade) {
      const diferencaNegativa = novaQtde - grupo.quantidade;
      const produtoFake = { nome: grupo.nome, preco: grupo.precoUnitario };
      adicionarProdutoNaComanda(produtoFake, diferencaNegativa);
      return;
    }
  };

  const produtosAgrupados = useMemo(() => {
    const grupos = [];
    produtosSeguros.forEach(p => {
      if (!p.id) return;
      const index = grupos.findIndex(g => g.nome === p.nome && g.precoUnitario === Number(p.preco) && g.observacao === p.observacao && g.pago === p.pago);
      if (index >= 0) { grupos[index].quantidade += 1; grupos[index].ids.push(p.id); grupos[index].precoTotal += Number(p.preco); } 
      else { grupos.push({ nome: p.nome, precoUnitario: Number(p.preco), precoTotal: Number(p.preco), observacao: p.observacao, pago: p.pago, quantidade: 1, ids: [p.id], custo: p.custo || 0 }); }
    });
    return grupos;
  }, [produtosSeguros]);

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

  if (!comandaAtiva) return (
    <div className={`flex flex-col flex-1 items-center justify-center w-full h-[calc(100vh-64px)] ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
      <SystemLoader variant="section" text="Aguardando inicialização..." />
    </div>
  );

  return (
    <div className={`flex flex-col w-full flex-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
      
      {/* BARRA SUPERIOR E DE BUSCA */}
      <div className={`w-full shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:px-5 border-b z-10 ${temaNoturno ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
        
        <div className="w-full md:w-[320px] lg:w-[400px] relative">
          <input 
              ref={inputBuscaRef} type="text" 
              placeholder="Pesquisar item ou código..." 
              value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} onKeyDown={handleBuscaKeyDown}
              className={`input-busca-produto w-full py-2 pl-9 pr-3 rounded-[8px] outline-none font-medium text-[13px] transition-colors border ${temaNoturno ? 'bg-white/[0.04] border-transparent text-white focus:bg-white/[0.06] focus:border-white/20 placeholder-zinc-500' : 'bg-black/[0.03] border-transparent text-zinc-900 focus:bg-white focus:border-black/15 shadow-sm placeholder-zinc-500'}`}
          />
          <svg className={`w-4 h-4 absolute left-3 top-[10px] ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>

        {/* ATALHOS */}
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

      {/* CATEGORIAS */}
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
      
      {/* CORPO PRINCIPAL */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-transparent">
        
        {/* MOBILE TABS */}
        <div className={`md:hidden flex p-1 mx-4 mt-4 rounded-lg shrink-0 border ${temaNoturno ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]'}`}>
          <button onClick={() => setAbaDetalheMobile('menu')} className={`flex-1 py-2 text-[12px] font-medium rounded-md transition-all ${abaDetalheMobile === 'menu' ? (temaNoturno ? 'bg-[#222] text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm border border-black/5') : 'text-zinc-500'}`}>Cardápio</button>
          <button onClick={() => setAbaDetalheMobile('resumo')} className={`flex-1 py-2 text-[12px] font-medium rounded-md transition-all flex items-center justify-center gap-2 ${abaDetalheMobile === 'resumo' ? (temaNoturno ? 'bg-[#222] text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm border border-black/5') : 'text-zinc-500'}`}>
            Comanda <span className={`px-1.5 py-0.5 rounded text-[10px] ${abaDetalheMobile === 'resumo' ? (temaNoturno ? 'bg-white/10' : 'bg-black/5') : 'bg-transparent border border-current opacity-50'}`}>{produtosSeguros.filter(p=>p.id).length}</span>
          </button>
        </div>
        
        {/* ÁREA DE CARDÁPIO */}
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
          
        {/* ÁREA DE RESUMO (CARRINHO) COM O CARD DEFINITIVAMENTE CORRIGIDO */}
        <div className={`w-full md:w-[35%] lg:w-[30%] flex flex-col h-full min-h-0 relative ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
          
          <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-5 py-4 scrollbar-hide">
            {produtosAgrupados.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-full opacity-40`}>
                 <span className="text-[13px] font-medium">A comanda está vazia.</span>
              </div>
            ) : (
              produtosAgrupados.map((grupo, idx) => (
                <div key={idx} className={`flex flex-col py-3.5 border-b transition-colors ${grupo.pago ? 'opacity-40' : ''} ${temaNoturno ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col min-w-0 pr-3">
                      <span className={`font-semibold text-[13px] tracking-tight leading-snug ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>
                         {grupo.nome} {grupo.pago && <span className={`text-[9px] px-1.5 py-0.5 rounded-[4px] ml-1.5 uppercase tracking-widest font-bold ${temaNoturno ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>Pago</span>}
                      </span>
                      {grupo.observacao && <span className={`text-[11px] font-medium tracking-tight mt-0.5 ${temaNoturno ? 'text-amber-500/80' : 'text-amber-600'}`}>Obs: {grupo.observacao}</span>}
                    </div>
                    <span className={`font-semibold text-[13px] tabular-nums tracking-tight shrink-0 ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>R$ {grupo.precoTotal.toFixed(2)}</span>
                  </div>
                  
                  {!grupo.pago && (
                    <div className="flex justify-between items-center mt-1">
                      <div className={`flex items-center rounded-md overflow-hidden border ${temaNoturno ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-white'}`}>
                        <button onClick={() => excluirProduto(grupo.ids[grupo.ids.length - 1])} className={`w-8 h-7 flex items-center justify-center transition-colors active:scale-95 ${temaNoturno ? 'text-zinc-400 hover:bg-white/[0.06]' : 'text-zinc-500 hover:bg-black/5'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg></button>
                        
                        <input 
                          type="number" min="0" value={quantidadesEditaveis[idx] !== undefined ? quantidadesEditaveis[idx] : grupo.quantidade}
                          onChange={(e) => setQuantidadesEditaveis({...quantidadesEditaveis, [idx]: e.target.value})}
                          onBlur={(e) => handleConfirmarQuantidadeDigitada(grupo, e.target.value, idx)}
                          onKeyDown={(e) => { if(e.key === 'Enter') handleConfirmarQuantidadeDigitada(grupo, e.target.value, idx); }}
                          className={`w-8 h-7 flex items-center justify-center font-medium text-[13px] text-center outline-none tabular-nums ${temaNoturno ? 'bg-transparent text-white' : 'bg-transparent text-zinc-900'}`}
                        />

                        <button onClick={() => adicionarProdutoNaComanda({ nome: grupo.nome, preco: grupo.precoUnitario, custo: grupo.custo })} className={`w-8 h-7 flex items-center justify-center transition-colors active:scale-95 ${temaNoturno ? 'text-zinc-400 hover:bg-white/[0.06]' : 'text-zinc-500 hover:bg-black/5'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg></button>
                      </div>
                      <button onClick={() => editarProduto(grupo.ids[0], grupo.observacao)} className={`text-[11px] font-medium px-2 py-1.5 rounded-md transition-colors ${temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'}`}>Editar Obs</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="w-full shrink-0 p-4 pb-10 md:pb-6 mt-auto">
            <div className={`p-4 rounded-[16px] shadow-2xl border transition-all ${temaNoturno ? 'border-white/[0.08] bg-[#111]/95 backdrop-blur-xl shadow-black/80' : 'border-black/[0.05] bg-white/95 backdrop-blur-xl shadow-zinc-300/80'}`}>
              <div className="flex justify-between items-end mb-4">
                <span className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Total Pendente</span>
                <span className="text-[28px] font-semibold tracking-tighter tabular-nums leading-none">
                  <span className="text-[16px] opacity-40 mr-1 font-medium">R$</span>{produtosSeguros.filter(p => !p.pago).reduce((acc, p) => acc + Number(p.preco || 0), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => setMostrarModalPagamento(true)} disabled={produtosSeguros.filter(p=>!p.pago).length === 0} className={`flex-[2] py-3 rounded-[10px] font-semibold text-[13px] transition-colors shadow-sm disabled:opacity-30 disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2 ${temaNoturno ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                  Cobrar <span className="text-[10px] opacity-70 font-medium px-1.5 border border-current rounded hidden md:inline">F2</span>
                </button>
                <button onClick={encerrarMesa} disabled={!comandaAtiva || produtosSeguros.length === 0 || produtosSeguros.some(p => !p.pago)} className={`flex-1 py-3 rounded-[10px] font-medium text-[13px] transition-colors disabled:opacity-30 active:scale-[0.98] border ${temaNoturno ? 'bg-transparent border-white/[0.1] text-zinc-300 hover:bg-white/[0.04]' : 'bg-transparent border-black/[0.1] text-zinc-700 hover:bg-black/[0.02]'}`}>
                  Encerrar
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}