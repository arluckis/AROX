// src/components/TabComandas.js
'use client';
import { useState, useEffect, useRef } from 'react';
import CardComanda from '@/components/CardComanda';
import PreComanda from '@/components/PreComanda';

export default function TabComandas({
  temaNoturno, comandasAbertas, modoExclusao, setModoExclusao,
  selecionadasExclusao, toggleSelecaoExclusao, confirmarExclusaoEmMassa,
  adicionarComanda, setIdSelecionado, caixaAtual, abrirCaixaManual
}) {

  const [saldoInicial, setSaldoInicial] = useState('');
  const [dataHoje, setDataHoje] = useState('');
  const [mostrarAntigas, setMostrarAntigas] = useState(false);
  const debounceRef = useRef(false);

  useEffect(() => {
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); 
    setDataHoje(hoje);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (!modoExclusao && caixaAtual?.status === 'aberto') {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!debounceRef.current) {
            debounceRef.current = true;
            adicionarComanda('Balcão');
            setTimeout(() => { debounceRef.current = false; }, 1000); 
          }
        }
        
        if (e.key >= '1' && e.key <= '9') {
          const index = parseInt(e.key) - 1;
          const comandasHoje = comandasAbertas.filter(c => !c.data || c.data >= dataHoje);
          if (comandasHoje[index]) {
            e.preventDefault();
            setIdSelecionado(comandasHoje[index].id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modoExclusao, caixaAtual, adicionarComanda, comandasAbertas, dataHoje, setIdSelecionado]);

  const handleAbrirCaixa = () => {
    abrirCaixaManual({
      data_abertura: dataHoje,
      saldo_inicial: parseFloat(saldoInicial || 0)
    });
  };

  const comandasHoje = comandasAbertas.filter(c => !c.data || c.data >= dataHoje);
  const comandasAntigas = comandasAbertas.filter(c => c.data && c.data < dataHoje);
  const comandasParaRenderizar = modoExclusao ? comandasAbertas : comandasHoje;

  const calcularVolumeHoje = () => {
    return comandasHoje.reduce((acc, c) => {
      const sumProdutos = (c.produtos || []).reduce((sum, p) => sum + (Number(p.preco) || 0), 0);
      const taxa = Number(c.taxa_entrega) || 0;
      const pago = (c.pagamentos || []).reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
      return acc + (sumProdutos + taxa - pago);
    }, 0);
  };
  const volumeHoje = calcularVolumeHoje();

  return (
    <div className="w-full animate-in fade-in duration-500 pb-20">
      
      {/* 1. HEADER OPERACIONAL (Linear/Vercel Vibe) */}
      {caixaAtual?.status === 'aberto' && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 w-full border-b pb-6 transition-colors duration-300 border-zinc-200/60 dark:border-white/[0.06]">
            
            {/* Esquerda: Identidade e Métricas */}
            <div className="flex flex-col gap-2.5">
              {!modoExclusao ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className={`text-xl font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      Contas Abertas
                    </h1>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-zinc-100/50 border-zinc-200/80'}`}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span className={`text-xs font-medium tabular-nums ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {comandasHoje.length}
                      </span>
                    </div>
                  </div>
                  <div className={`text-sm font-medium tracking-tight ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Volume atual <span className="mx-1.5 opacity-40">•</span> <span className={temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}>R$ {volumeHoje.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className={`text-xl font-semibold tracking-tight ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>
                      Modo de Exclusão
                    </h1>
                  </div>
                  <div className={`text-sm font-medium tracking-tight ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {selecionadasExclusao.length} {selecionadasExclusao.length === 1 ? 'conta selecionada' : 'contas selecionadas'}
                  </div>
                </>
              )}
            </div>
            
            {/* Direita: Ações */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                {!modoExclusao ? (
                  <>
                    {comandasAbertas.length > 0 && (
                      <button onClick={() => setModoExclusao(!modoExclusao)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80'}`}>
                        Selecionar para excluir
                      </button>
                    )}
                    
                    <button onClick={() => adicionarComanda('Delivery')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ring-1 ring-inset flex items-center justify-center gap-2 ${temaNoturno ? 'bg-[#111] text-zinc-300 ring-white/10 hover:bg-[#1A1A1A] hover:ring-white/20' : 'bg-white text-zinc-700 ring-black/[0.08] hover:bg-zinc-50 hover:ring-black/[0.15]'}`}>
                      Novo Delivery
                    </button>

                    <button onClick={() => adicionarComanda('Balcão')} className={`px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${temaNoturno ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}>
                      Nova conta
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setModoExclusao(false)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ring-1 ring-inset w-full sm:w-auto ${temaNoturno ? 'bg-transparent text-zinc-400 ring-white/10 hover:bg-white/5 hover:text-zinc-200' : 'bg-transparent text-zinc-600 ring-black/[0.08] hover:bg-zinc-50 hover:text-zinc-900'}`}>
                      Cancelar
                    </button>
                    <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="px-5 py-2 rounded-lg font-medium text-sm bg-red-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-sm hover:bg-red-700">
                      Excluir definitivamente
                    </button>
                  </>
                )}
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 mx-auto w-full">
        
        {/* 2. BLOCO DE PENDÊNCIAS (Header de Seção Clicável) */}
        {!modoExclusao && comandasAntigas.length > 0 && caixaAtual?.status === 'aberto' && (
          <div className="w-full mb-10 animate-in slide-in-from-top-2 duration-300">
            <button 
              onClick={() => setMostrarAntigas(!mostrarAntigas)} 
              className={`w-full pb-3 flex justify-between items-center group cursor-pointer transition-all border-b ${temaNoturno ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-amber-600/20 hover:border-amber-600/40'}`}
            >
              <div className="flex items-center gap-3">
                <p className={`text-sm font-medium tracking-tight flex items-center gap-2 ${temaNoturno ? 'text-amber-500/90' : 'text-amber-700'}`}>
                  Pendências de turnos anteriores
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${temaNoturno ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-100 text-amber-800'}`}>
                    {comandasAntigas.length}
                  </span>
                </p>
              </div>
              
              <div className={`transition-transform duration-300 ${mostrarAntigas ? 'rotate-180' : ''} ${temaNoturno ? 'text-amber-500/50' : 'text-amber-700/50'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </button>

            {mostrarAntigas && (
              <div className="flex flex-wrap gap-5 justify-start w-full mt-6 animate-in slide-in-from-top-2 fade-in duration-300">
                {comandasAntigas.map(comanda => (
                  <div key={comanda.id} className="relative group transition-all duration-300 opacity-90 hover:opacity-100">
                    <CardComanda comanda={comanda} onClick={() => setIdSelecionado(comanda.id)} temaNoturno={temaNoturno} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETUP INICIAL */}
{caixaAtual?.status !== 'aberto' ? (
  <PreComanda
    onFinalizarAbertura={(valor) =>
      abrirCaixaManual({
        data_abertura: dataHoje,
        saldo_inicial: valor,
      })
    }
    temPendenciaTurnoAnterior={false}
    onResolverPendencia={() => {}}
  />
) : (
          /* 3. GRID PRINCIPAL */
          <div className="flex flex-wrap gap-5 justify-start w-full">
            
            {/* Empty State Refinado */}
            {comandasHoje.length === 0 && !modoExclusao && (
              <div className="w-full py-32 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                <p className={`text-base font-medium tracking-tight ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>Nenhuma conta aberta</p>
                <p className={`text-sm mt-3 flex items-center gap-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Pressione <kbd className={`px-2 py-1 rounded-md text-[11px] font-medium font-sans ring-1 ring-inset shadow-sm ${temaNoturno ? 'bg-[#1A1A1A] ring-white/10 text-zinc-300' : 'bg-white ring-black/[0.08] text-zinc-600'}`}>Enter</kbd> para criar um registro no balcão
                </p>
              </div>
            )}

            {comandasParaRenderizar.map((comanda, index) => (
              <div key={comanda.id} className="relative group animate-in fade-in zoom-in-95 duration-300 transition-all">
                
                {/* Atalho de Teclado */}
                {index < 9 && !modoExclusao && (
                  <div className="absolute -top-2.5 -left-2.5 z-20 pointer-events-none transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[11px] font-medium shadow-sm backdrop-blur-md ${temaNoturno ? 'bg-[#1A1A1A]/90 border-white/10 text-zinc-400' : 'bg-white/90 border-zinc-200 text-zinc-600'}`}>
                        {index + 1}
                      </div>
                  </div>
                )}

                {/* Checkbox de Exclusão Destrutivo */}
                {modoExclusao && (
                  <div className="absolute top-3 right-3 z-20">
                      <div className={`w-5 h-5 rounded-md ring-1 ring-inset flex items-center justify-center cursor-pointer transition-all shadow-sm ${selecionadasExclusao.includes(comanda.id) ? 'bg-red-500 ring-red-500' : (temaNoturno ? 'bg-[#111] ring-white/20 hover:ring-red-400' : 'bg-white ring-black/[0.15] hover:ring-red-400')}`} onClick={() => toggleSelecaoExclusao(comanda.id)}>
                          {selecionadasExclusao.includes(comanda.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                  </div>
                )}
                
                {/* Container controlando a escala na exclusão */}
                <div 
                  className={`transition-all duration-300 ease-out cursor-pointer h-full ${modoExclusao ? (selecionadasExclusao.includes(comanda.id) ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#09090B] rounded-2xl scale-[0.98]' : 'opacity-40 grayscale-[50%] hover:opacity-80 scale-[0.98]') : ''}`} 
                  onClick={() => { if (modoExclusao) toggleSelecaoExclusao(comanda.id); }}
                >
                  <CardComanda comanda={comanda} onClick={() => { if (!modoExclusao) setIdSelecionado(comanda.id); }} temaNoturno={temaNoturno} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}