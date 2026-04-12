'use client';
import React, { useState, useMemo } from 'react';
import Button from '../ui/Button';

export default function ResumoCarrinho({
  temaNoturno,
  abaDetalheMobile,
  produtosSeguros,
  comandaAtiva,
  excluirProduto,
  adicionarProdutoNaComanda,
  excluirGrupoProdutos,
  editarProduto,
  setMostrarModalPagamento,
  encerrarMesa
}) {

  
  const [quantidadesEditaveis, setQuantidadesEditaveis] = useState({});

  const produtosAgrupados = useMemo(() => {
    const grupos = [];
    produtosSeguros.forEach(p => {
      if (!p.id) return;
      const index = grupos.findIndex(g => g.nome === p.nome && g.precoUnitario === Number(p.preco) && g.observacao === p.observacao && g.pago === p.pago);
      if (index >= 0) { 
        grupos[index].quantidade += 1; 
        grupos[index].ids.push(p.id); 
        grupos[index].precoTotal += Number(p.preco); 
      } else { 
        grupos.push({ nome: p.nome, precoUnitario: Number(p.preco), precoTotal: Number(p.preco), observacao: p.observacao, pago: p.pago, quantidade: 1, ids: [p.id], custo: p.custo || 0 }); 
      }
    });
    return grupos;
  }, [produtosSeguros]);

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

  const totalPendente = produtosSeguros.filter(p => !p.pago).reduce((acc, p) => acc + Number(p.preco || 0), 0).toFixed(2);
  const temPendentes = produtosSeguros.filter(p => !p.pago).length > 0;

  return (
    <div className={`w-full md:w-[35%] lg:w-[30%] flex flex-col h-full min-h-0 relative ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
      
      <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-5 py-4 scrollbar-hide">
        {produtosAgrupados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
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
              <span className="text-[16px] opacity-40 mr-1 font-medium">R$</span>{totalPendente}
            </span>
          </div>
          <div className="flex gap-2.5">
            <Button 
               variant="primary" 
               fullWidth 
               temaNoturno={temaNoturno} 
               disabled={!temPendentes} 
               onClick={() => setMostrarModalPagamento(true)}
               className="flex-[2] flex items-center justify-center gap-2"
            >
              Cobrar <span className="text-[10px] opacity-70 font-medium px-1.5 border border-current rounded hidden md:inline">F2</span>
            </Button>

            <Button 
               variant="ghost" 
               fullWidth 
               temaNoturno={temaNoturno} 
               disabled={!comandaAtiva || produtosSeguros.length === 0 || !temPendentes} 
               onClick={encerrarMesa}
               className="flex-1"
            >
              Encerrar
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}