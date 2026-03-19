'use client';
import { useMemo, useState } from 'react';

export default function PainelComanda({
  temaNoturno,
  comandaAtiva,
  abaDetalheMobile,
  setAbaDetalheMobile,
  filtroCategoriaCardapio,
  setFiltroCategoriaCardapio,
  menuCategorias,
  adicionarProdutoNaComanda,
  setMostrarModalPeso,
  tagsGlobais,
  toggleTag,
  editarProduto,
  excluirProduto,
  setMostrarModalPagamento,
  encerrarMesa
}) {
  
  const [mostrarTags, setMostrarTags] = useState(false);

  const categoriasSeguras = Array.isArray(menuCategorias) ? menuCategorias : [];
  const produtosSeguros = Array.isArray(comandaAtiva?.produtos) ? comandaAtiva.produtos : [];
  const tagsSeguras = Array.isArray(comandaAtiva?.tags) ? comandaAtiva.tags : [];
  const tagsDoSistema = Array.isArray(tagsGlobais) ? tagsGlobais : [];

  const categoriaSelecionada = categoriasSeguras.find(c => c.id === filtroCategoriaCardapio) || categoriasSeguras[0];

  const produtosFavoritos = useMemo(() => {
    return categoriasSeguras.flatMap(c => c?.itens || []).filter(p => p && p.favorito).slice(0, 6);
  }, [categoriasSeguras]);

  const produtosAgrupados = useMemo(() => {
    const grupos = [];
    produtosSeguros.forEach(p => {
      const index = grupos.findIndex(g => 
        g.nome === p.nome && g.precoUnitario === Number(p.preco) && g.observacao === p.observacao && g.pago === p.pago
      );
      if (index >= 0) {
        grupos[index].quantidade += 1;
        grupos[index].ids.push(p.id);
        grupos[index].precoTotal += Number(p.preco);
      } else {
        grupos.push({
          nome: p.nome,
          precoUnitario: Number(p.preco),
          precoTotal: Number(p.preco),
          observacao: p.observacao,
          pago: p.pago,
          quantidade: 1,
          ids: [p.id],
          custo: p.custo || 0
        });
      }
    });
    return grupos;
  }, [produtosSeguros]);

  const handleAdicionarItem = (item) => adicionarProdutoNaComanda(item);
  
  const handleIncrementarGrupo = (grupo) => {
    adicionarProdutoNaComanda({ nome: grupo.nome, preco: grupo.precoUnitario, custo: grupo.custo });
  };
  
  const handleDecrementarGrupo = (grupo) => {
    excluirProduto(grupo.ids[grupo.ids.length - 1]);
  };

  const renderBotaoProduto = (item) => (
    <button 
      key={item.id || Math.random()} 
      onClick={() => handleAdicionarItem(item)} 
      className={`p-3.5 rounded-xl border flex justify-between items-center gap-3 transition-all active:scale-95 text-left group ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:border-purple-500 hover:bg-gray-800/80' : 'bg-white border-gray-200 hover:border-purple-400 hover:shadow-sm'}`}
    >
      <span className={`font-bold text-[13px] leading-snug group-hover:text-purple-600 transition-colors ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>
        {item?.nome || 'Produto'}
      </span>
      <span className={`px-2 py-1 rounded-md text-[11px] font-black whitespace-nowrap ${temaNoturno ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
        R$ {Number(item?.preco || 0).toFixed(2)}
      </span>
    </button>
  );

  if (!comandaAtiva) return null;

  return (
    <div className={`flex flex-col md:flex-row w-full h-[calc(100vh-140px)] min-h-[500px] animate-in zoom-in-95 duration-300 rounded-b-2xl overflow-hidden shadow-xl border-x border-b border-t-0 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      
      {/* NAVEGAÇÃO MOBILE */}
      <div className={`md:hidden flex p-1 mx-4 mt-4 rounded-xl shrink-0 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
        <button onClick={() => setAbaDetalheMobile('menu')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${abaDetalheMobile === 'menu' ? (temaNoturno ? 'bg-gray-700 text-purple-400 shadow-sm' : 'bg-white text-purple-700 shadow-sm') : 'text-gray-500'}`}>Cardápio</button>
        <button onClick={() => setAbaDetalheMobile('resumo')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${abaDetalheMobile === 'resumo' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500'}`}>
          Resumo <span className="bg-black/20 text-white px-2 py-0.5 rounded-full">{produtosSeguros.length}</span>
        </button>
      </div>
      
      {/* LADO ESQUERDO: CARDÁPIO */}
      <div className={`w-full md:w-[60%] lg:w-[65%] flex flex-col h-full min-h-0 border-r ${abaDetalheMobile === 'menu' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
        
        {/* Categorias - Sem bordas, fluindo com o fundo */}
        <div className={`p-4 pb-2 flex flex-wrap gap-2 sticky top-0 z-10 ${temaNoturno ? 'bg-gray-900/90 backdrop-blur-md' : 'bg-gray-50/90 backdrop-blur-md'}`}>
          {categoriasSeguras.map(c => c ? (
            <button key={c.id} onClick={() => setFiltroCategoriaCardapio(c.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${(categoriaSelecionada?.id === c.id) ? (temaNoturno ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-purple-600 text-white border-purple-600 shadow-sm') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100')}`}>
              {c.nome}
            </button>
          ) : null)}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 pb-10 scrollbar-hide">
          
          <button onClick={() => setMostrarModalPeso(true)} className={`w-full flex justify-between items-center p-4 mb-6 rounded-xl border transition-all active:scale-95 shadow-sm group ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:border-purple-500 text-gray-200' : 'bg-white border-gray-200 hover:border-purple-400 text-gray-800'}`}>
             <div className="flex flex-col text-left">
               <span className="font-bold text-sm">Adicionar Produto por Peso</span>
               <span className={`text-[10px] font-medium uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Pesagem Manual Integrada</span>
             </div>
             <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${temaNoturno ? 'bg-gray-700 group-hover:bg-purple-600 text-white' : 'bg-gray-100 group-hover:bg-purple-100 group-hover:text-purple-700'}`}>+</span>
          </button>

          {produtosFavoritos.length > 0 && (
             <div className="mb-6">
               <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${temaNoturno ? 'text-yellow-500/70' : 'text-yellow-600/80'}`}>⭐ Favoritos Frequentes</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                 {produtosFavoritos.map(renderBotaoProduto)}
               </div>
             </div>
          )}

          {categoriaSelecionada && (
            <div>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>
                {categoriaSelecionada.nome}
              </h3>
              {(!categoriaSelecionada.itens || categoriaSelecionada.itens.length === 0) ? (
                <p className={`text-sm italic ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhum produto cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {categoriaSelecionada.itens.map(renderBotaoProduto)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
        
      {/* LADO DIREITO: RESUMO DO CARRINHO */}
      <div className={`w-full md:w-[40%] lg:w-[35%] flex flex-col h-full min-h-0 relative ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
        
        <div className={`p-4 border-b shrink-0 flex flex-col gap-2 ${temaNoturno ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
             <span className={`text-[10px] uppercase tracking-widest font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Classificação (Tags)</span>
             <button onClick={() => setMostrarTags(!mostrarTags)} className="text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700 transition-colors">
               {mostrarTags ? 'Ocultar Opções' : 'Editar Classificação'}
             </button>
          </div>
          
          {(mostrarTags || tagsSeguras.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in slide-in-from-top-2">
              {tagsDoSistema.map(tagObj => tagObj?.nome ? (
                <button key={tagObj.id} onClick={() => toggleTag(tagObj.nome)} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors border ${tagsSeguras.includes(tagObj.nome) ? (temaNoturno ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-purple-600 text-white border-purple-700') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100')} ${!mostrarTags && !tagsSeguras.includes(tagObj.nome) ? 'hidden' : ''}`}>
                  {tagObj.nome}
                </button>
              ) : null)}
            </div>
          )}
        </div>
        
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
                  <div className="flex justify-between items-center mt-3">
                    <div className={`flex items-center rounded-lg border overflow-hidden ${temaNoturno ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white shadow-sm'}`}>
                      <button onClick={() => handleDecrementarGrupo(grupo)} className={`w-9 h-8 flex items-center justify-center font-bold text-lg transition-colors active:scale-95 ${temaNoturno ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}>-</button>
                      <div className={`w-10 h-8 flex items-center justify-center font-black text-sm border-x ${temaNoturno ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-800'}`}>{grupo.quantidade}</div>
                      <button onClick={() => handleIncrementarGrupo(grupo)} className={`w-9 h-8 flex items-center justify-center font-bold text-lg transition-colors active:scale-95 ${temaNoturno ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-50'}`}>+</button>
                    </div>
                    <button onClick={() => editarProduto(grupo.ids[0], grupo.observacao)} className={`text-[10px] font-black uppercase px-3 py-2 rounded-md transition-colors ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>Editar Obs</button>
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
            <button onClick={() => setMostrarModalPagamento(true)} disabled={produtosSeguros.filter(p=>!p.pago).length === 0} className="flex-[2] bg-green-600 hover:bg-green-700 py-4 rounded-xl font-black text-white text-sm uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 active:scale-95">COBRAR</button>
            <button onClick={encerrarMesa} disabled={!comandaAtiva || produtosSeguros.length === 0 || produtosSeguros.some(p => !p.pago)} className={`flex-1 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Encerrar</button>
          </div>
        </div>
      </div>

    </div>
  );
}