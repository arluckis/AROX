'use client';
import { useMemo, useState, useEffect, useRef } from 'react';

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

  // Estados para nova linha de categorias responsiva
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  const categoriasContainerRef = useRef(null);
  const [precisaBotaoMais, setPrecisaBotaoMais] = useState(false);

  const categoriasSeguras = Array.isArray(menuCategorias) ? menuCategorias : [];
  const produtosSeguros = Array.isArray(comandaAtiva?.produtos) ? comandaAtiva.produtos : [];
  const tagsSeguras = Array.isArray(comandaAtiva?.tags) ? comandaAtiva.tags : [];
  const tagsDoSistema = Array.isArray(tagsGlobais) ? tagsGlobais : [];

  const categoriaSelecionada = categoriasSeguras.find(c => c.id === filtroCategoriaCardapio) || categoriasSeguras[0];

  useEffect(() => {
    if (inputBuscaRef.current && !modalAberto) inputBuscaRef.current.focus();
  }, [comandaAtiva?.id, modalAberto]);

  // Listener para identificar se a barra de categorias precisa do botão de expandir
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

      // REMOVIDO F4 da lista de atalhos globais
      const isSpecialKey = ['F1', 'F2', 'F3', 'F5', 'F6', 'Escape', 'Enter'].includes(e.key);
      
      if (!isSpecialKey && isInput) return;

      if (e.key === 'Escape') { 
        e.preventDefault(); 
        if (isInput && activeEl !== inputBuscaRef.current) {
          inputBuscaRef.current?.focus();
        } else {
          activeEl?.blur();
          if (setIdSelecionado) setIdSelecionado(null); 
        }
        return;
      }

      if (e.key === 'Enter' && isInput) {
        const placeholder = activeEl?.placeholder?.toLowerCase() || '';
        if (placeholder.includes('liente') || placeholder.includes('fidelidade')) {
           e.preventDefault();
           const primeiroCliente = document.querySelector('ul > li, li[class*="cursor-pointer"], div[class*="cursor-pointer"][class*="hover"], .item-cliente');
           if (primeiroCliente) {
              primeiroCliente.click();
              setTimeout(() => {
                inputBuscaRef.current?.focus();
              }, 150);
           }
           return;
        }
      }

      if (e.key === 'Enter' && isInput && activeEl === inputBuscaRef.current) {
        return; 
      }

      if (e.key === 'F1') { e.preventDefault(); activeEl?.blur(); setMostrarModalPeso(true); }
      if (e.key === 'F2') { 
        e.preventDefault(); 
        if (produtosSeguros.filter(p => !p.pago).length > 0) {
          activeEl?.blur(); 
          setMostrarModalPagamento(true); 
        }
      }
      if (e.key === 'F3') { 
        e.preventDefault(); 
        if (produtosSeguros.length > 0 && !produtosSeguros.some(p => !p.pago)) {
           activeEl?.blur();
           encerrarMesa(); 
        }
      }
      
      if (e.key === 'F5') { 
        e.preventDefault();
        const inputCliente = document.querySelector('input[placeholder*="liente" i], input[placeholder*="Fidelidade" i], .input-cliente');
        if (inputCliente) {
          inputCliente.focus();
        } else if (adicionarClienteComanda) {
          activeEl?.blur();
          adicionarClienteComanda(comandaAtiva.id, comandaAtiva.nome);
        }
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
          if (produtoEncontrado) {
            idCategoriaDoProduto = cat.id;
            break;
          }
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

  const produtosFavoritos = useMemo(() => {
    return categoriasSeguras.flatMap(c => c?.itens || []).filter(p => p && p.favorito).slice(0, 6);
  }, [categoriasSeguras]);

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

  const renderBotaoProduto = (item) => (
    <button 
      key={item.id || Math.random()} 
      onClick={() => adicionarProdutoNaComanda(item)} 
      className={`p-3.5 rounded-xl border flex justify-between items-center gap-3 transition-all active:scale-95 text-left group ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:border-purple-500 hover:bg-gray-800/80' : 'bg-white border-gray-200 hover:border-purple-400 hover:shadow-sm'}`}
    >
      <span className={`font-bold text-[13px] leading-snug group-hover:text-purple-600 transition-colors flex flex-col ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>
        {item?.nome || 'Produto'}
        {item?.codigo && <span className="text-[9px] opacity-60">Cód: {item.codigo}</span>}
      </span>
      <span className={`px-2 py-1 rounded-md text-[11px] font-black whitespace-nowrap ${temaNoturno ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
        R$ {Number(item?.preco || 0).toFixed(2)}
      </span>
    </button>
  );

  if (!comandaAtiva) return null;

  return (
    <div className={`flex flex-col w-full h-[calc(100vh-140px)] min-h-[500px] animate-in zoom-in-95 duration-300 rounded-b-2xl shadow-xl border-x border-b border-t-0 overflow-hidden ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      
      {/* --- NOVA BARRA SUPERIOR (PESQUISA ESQUERDA, ATALHOS DIREITA) --- */}
      <div className={`w-full shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b min-h-[64px] ${temaNoturno ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {/* Barra de Pesquisa */}
        <div className="w-full md:w-1/2 relative">
          <input 
              ref={inputBuscaRef} type="text" 
              placeholder="Busque pelo nome ou código do produto" 
              value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} onKeyDown={handleBuscaKeyDown}
              className={`w-full p-3 pl-10 rounded-xl outline-none font-bold text-sm transition-all border ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-300 text-black focus:border-purple-500 shadow-sm'}`}
          />
          <svg className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>

        {/* Barra de Atalhos Exclusiva Desktop (hidden md:flex) */}
        <div className={`hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>
          <button onClick={() => setIdSelecionado(null)} className="hover:text-purple-500 transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <kbd className={`px-1.5 py-0.5 rounded shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>ESC</kbd> Voltar
          </button>
          
          <div className={`w-px h-4 ${temaNoturno ? 'bg-gray-800' : 'bg-gray-300'}`}></div>

          <button onClick={() => setMostrarModalPeso(true)} className="hover:text-purple-500 transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <kbd className={`px-1.5 py-0.5 rounded shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>F1</kbd> Peso
          </button>
          
          <button onClick={() => { if(produtosSeguros.filter(p => !p.pago).length > 0) setMostrarModalPagamento(true); }} className="hover:text-purple-500 transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <kbd className={`px-1.5 py-0.5 rounded shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>F2</kbd> Cobrar
          </button>
          
          <button onClick={() => { if(produtosSeguros.length > 0 && !produtosSeguros.some(p => !p.pago)) encerrarMesa(); }} className="hover:text-purple-500 transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <kbd className={`px-1.5 py-0.5 rounded shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>F3</kbd> Encerrar
          </button>

          <div className={`w-px h-4 ${temaNoturno ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
          
          {/* F4 FOI REMOVIDO DA INTERFACE */}

          <button onClick={() => adicionarClienteComanda(comandaAtiva.id, comandaAtiva.nome)} className="hover:text-purple-500 transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <kbd className={`px-1.5 py-0.5 rounded shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>F5</kbd> Cliente
          </button>
        </div>
      </div>

      {/* --- NOVA LINHA DE CATEGORIAS RESPONSIVA --- */}
      <div className={`w-full shrink-0 border-b relative p-3 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex gap-2 items-center w-full">
          <div 
            ref={categoriasContainerRef}
            className={`flex gap-2 overflow-hidden transition-all duration-300 w-full ${categoriasExpandidas ? 'flex-wrap max-h-[300px]' : 'flex-nowrap max-h-12 pr-24'}`}
          >
            {categoriasSeguras.map(c => c ? (
              <button 
                key={c.id} 
                onClick={() => { setFiltroCategoriaCardapio(c.id); setFiltroTexto(''); setCategoriasExpandidas(false); }} 
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${categoriaSelecionada?.id === c.id ? (temaNoturno ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-600 text-white shadow-md') : (temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200')}`}
              >
                {c.nome}
              </button>
            ) : null)}
          </div>
          
          {/* Botão para Expandir Categorias no mobile ou telas pequenas */}
          {precisaBotaoMais && !categoriasExpandidas && (
            <button 
              onClick={() => setCategoriasExpandidas(true)} 
              className={`absolute right-0 top-0 h-full px-4 font-black text-[10px] uppercase tracking-widest flex items-center shadow-[-10px_0_15px_rgba(0,0,0,0.1)] transition-colors ${temaNoturno ? 'bg-gray-900 text-purple-400 hover:text-purple-300' : 'bg-gray-50 text-purple-600 hover:text-purple-700'}`}
            >
              + Categorias
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        <div className={`md:hidden flex p-1 mx-4 mt-4 rounded-xl shrink-0 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <button onClick={() => setAbaDetalheMobile('menu')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${abaDetalheMobile === 'menu' ? (temaNoturno ? 'bg-gray-700 text-purple-400 shadow-sm' : 'bg-white text-purple-700 shadow-sm') : 'text-gray-500'}`}>Cardápio</button>
          <button onClick={() => setAbaDetalheMobile('resumo')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${abaDetalheMobile === 'resumo' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500'}`}>
            Resumo <span className="bg-black/20 text-white px-2 py-0.5 rounded-full">{produtosSeguros.filter(p=>p.id).length}</span>
          </button>
        </div>
        
        <div className={`w-full md:w-[60%] lg:w-[65%] flex flex-col h-full min-h-0 border-r ${abaDetalheMobile === 'menu' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
          
          {/* Pesquisa e Categorias foram movidas para a Global Top Bar */}

          <div className="flex-1 overflow-y-auto min-h-0 p-4 pb-10 scrollbar-hide">
            
            <button onClick={() => setMostrarModalPeso(true)} className={`w-full flex justify-between items-center p-4 mb-6 rounded-xl border transition-all active:scale-95 shadow-sm group ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:border-purple-500 text-gray-200' : 'bg-white border-gray-200 hover:border-purple-400 text-gray-800'}`}>
               <div className="flex flex-col text-left">
                 <span className="font-bold text-sm">Adicionar Produto por Peso <span className="opacity-70 text-purple-500 ml-1 hidden md:inline">[F1]</span></span>
                 <span className={`text-[10px] font-medium uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Pesagem Manual Integrada</span>
               </div>
               <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${temaNoturno ? 'bg-gray-700 group-hover:bg-purple-600 text-white' : 'bg-gray-100 group-hover:bg-purple-100 group-hover:text-purple-700'}`}>+</span>
            </button>

            <div>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>
                {filtroTexto ? 'Resultados da Busca' : categoriaSelecionada?.nome}
              </h3>
              {itensFiltrados.length === 0 ? (
                <p className={`text-sm italic ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhum produto encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {itensFiltrados.map(renderBotaoProduto)}
                </div>
              )}
            </div>
          </div>
        </div>
          
        <div className={`w-full md:w-[40%] lg:w-[35%] flex flex-col h-full min-h-0 relative ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            {produtosAgrupados.length === 0 ? (
              <div className={`p-8 text-center text-sm font-bold mt-10 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>
                 O carrinho está vazio.<br/>Adicione produtos ao lado.
              </div>
            ) : (
              produtosAgrupados.map((grupo, idx) => (
                <div key={idx} className={`flex flex-col p-4 border-b transition-colors ${grupo.pago ? 'opacity-40' : ''} ${temaNoturno ? 'border-gray-800/80 hover:bg-gray-800' : 'border-gray-200 hover:bg-white'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col">
                      <span className={`font-bold uppercase text-[11px] sm:text-xs ${temaNoturno ? 'text-gray-200' : 'text-gray-900'}`}>
                         {grupo.nome} {grupo.pago && <span className={`text-[9px] px-1 py-0.5 rounded ml-2 align-middle ${temaNoturno ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>PAGO</span>}
                      </span>
                      {grupo.observacao && <span className={`text-[10px] font-black tracking-widest uppercase mt-0.5 ${temaNoturno ? 'text-orange-400' : 'text-orange-500'}`}>↳ {grupo.observacao}</span>}
                    </div>
                    <span className={`font-black tracking-tight ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>R$ {grupo.precoTotal.toFixed(2)}</span>
                  </div>
                  
                  {!grupo.pago && (
                    <div className="flex justify-between items-center mt-3 gap-2">
                      <div className={`flex items-center rounded-lg border overflow-hidden ${temaNoturno ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white shadow-sm'}`}>
                        <button onClick={() => excluirProduto(grupo.ids[grupo.ids.length - 1])} className={`w-8 h-8 flex items-center justify-center font-bold text-lg transition-colors active:scale-95 ${temaNoturno ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}>-</button>
                        
                        <input 
                          type="number" 
                          min="0"
                          value={quantidadesEditaveis[idx] !== undefined ? quantidadesEditaveis[idx] : grupo.quantidade}
                          onChange={(e) => setQuantidadesEditaveis({...quantidadesEditaveis, [idx]: e.target.value})}
                          onBlur={(e) => handleConfirmarQuantidadeDigitada(grupo, e.target.value, idx)}
                          onKeyDown={(e) => { if(e.key === 'Enter') handleConfirmarQuantidadeDigitada(grupo, e.target.value, idx); }}
                          className={`w-10 h-8 flex items-center justify-center font-black text-sm text-center border-x outline-none transition-colors ${temaNoturno ? 'border-gray-700 bg-gray-900 text-purple-300 focus:border-purple-500' : 'border-gray-200 bg-gray-50 text-purple-800 focus:border-purple-400 focus:bg-white'}`}
                        />

                        <button onClick={() => adicionarProdutoNaComanda({ nome: grupo.nome, preco: grupo.precoUnitario, custo: grupo.custo })} className={`w-8 h-8 flex items-center justify-center font-bold text-lg transition-colors active:scale-95 ${temaNoturno ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-50'}`}>+</button>
                      </div>
                      <button onClick={() => editarProduto(grupo.ids[0], grupo.observacao)} className={`text-[10px] font-black uppercase px-3 py-2 rounded-md transition-colors whitespace-nowrap ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>Editar Obs</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className={`p-4 border-t shrink-0 relative z-10 ${temaNoturno ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <div className="flex justify-between items-end mb-4 px-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>A Pagar</span>
              <span className="text-3xl font-black text-green-600 dark:text-green-400 tracking-tighter">R$ {produtosSeguros.filter(p => !p.pago).reduce((acc, p) => acc + Number(p.preco || 0), 0).toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMostrarModalPagamento(true)} disabled={produtosSeguros.filter(p=>!p.pago).length === 0} className="flex-[2] bg-green-600 hover:bg-green-700 py-4 rounded-xl font-black text-white text-sm uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 active:scale-95">COBRAR <span className="text-[10px] opacity-70 ml-1 hidden md:inline">[F2]</span></button>
              <button onClick={encerrarMesa} disabled={!comandaAtiva || produtosSeguros.length === 0 || produtosSeguros.some(p => !p.pago)} className={`flex-1 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 active:scale-95 flex flex-col items-center justify-center ${temaNoturno ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><span>Encerrar</span><span className="text-[8px] opacity-70 hidden md:inline">[F3]</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}