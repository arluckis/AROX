// src/components/TabComandas.js
'use client';
import { useState, useEffect, useRef } from 'react';
import CardComanda from '@/components/CardComanda';

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
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* 1. HEADER - PAINEL OPERACIONAL PREMIUM */}
      <div className={`p-6 md:px-8 md:py-7 rounded-[1.25rem] border shadow-sm flex flex-col xl:flex-row justify-between gap-6 md:gap-8 transition-colors duration-500 mb-8 ${temaNoturno ? 'bg-[#161a20]/60 border-white/[0.04]' : 'bg-white border-zinc-200/80'}`}>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 w-full xl:w-auto">
            {/* Estado do Sistema */}
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Estado do Sistema</span>
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className={`absolute w-3.5 h-3.5 rounded-full animate-ping opacity-60 ${caixaAtual?.status === 'aberto' ? 'bg-emerald-400' : 'bg-zinc-400'}`}></span>
                  <span className={`relative w-2 h-2 rounded-full ${caixaAtual?.status === 'aberto' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                </div>
                <h2 className={`text-lg md:text-xl font-semibold tracking-tight leading-none ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  {caixaAtual?.status === 'aberto' ? 'Operação ativa' : 'Turno inativo'}
                </h2>
              </div>
            </div>

            {caixaAtual?.status === 'aberto' && (
              <>
                <div className={`hidden md:block w-px h-10 ${temaNoturno ? 'bg-white/[0.06]' : 'bg-zinc-200'}`}></div>
                
                {/* Métricas Principais */}
                <div className="flex items-center gap-8 md:gap-12">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Contas em Aberto</span>
                    <span className={`text-xl font-semibold tracking-tight leading-none ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>{comandasHoje.length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Volume em Trânsito</span>
                    <span className={`text-xl font-semibold tracking-tight leading-none ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      <span className={`text-sm font-medium mr-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                      {volumeHoje.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Ações (Hierarquia Clara) */}
          {caixaAtual?.status === 'aberto' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto animate-in fade-in duration-300">
                {!modoExclusao ? (
                  <>
                    {comandasAbertas.length > 0 && (
                      <button onClick={() => setModoExclusao(!modoExclusao)} className={`px-4 py-3 sm:py-2.5 rounded-xl font-medium text-[13px] transition-colors border active:scale-[0.98] ${temaNoturno ? 'bg-transparent text-zinc-400 border-transparent hover:bg-white/5 hover:text-zinc-200' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-100 hover:text-zinc-800'}`}>
                        Gerenciar múltiplas
                      </button>
                    )}
                    
                    {/* Ação Secundária */}
                    <button onClick={() => adicionarComanda('Delivery')} className={`px-4 py-3 sm:py-2.5 rounded-xl font-medium text-[13px] transition-all border shadow-sm active:scale-[0.98] flex justify-center items-center gap-2 ${temaNoturno ? 'bg-[#1c2128] text-zinc-300 border-white/[0.08] hover:bg-[#232931]' : 'bg-white text-zinc-700 border-zinc-200/80 hover:bg-zinc-50'}`}>
                      <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                      Criar pedido delivery
                    </button>

                    {/* Ação Primária Dominante */}
                    <button onClick={() => adicionarComanda('Balcão')} className={`px-5 py-3 sm:py-2.5 rounded-xl font-semibold text-[14px] transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2 group ${temaNoturno ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                      Abrir nova conta
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setModoExclusao(false)} className={`px-5 py-3 sm:py-2.5 rounded-xl font-medium text-[13px] transition-all border active:scale-[0.98] w-full sm:w-auto ${temaNoturno ? 'bg-[#161a20] text-zinc-300 border-white/[0.08] hover:bg-white/5' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'}`}>
                      Cancelar Operação
                    </button>
                    <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="px-5 py-3 sm:py-2.5 rounded-xl font-semibold text-[13px] bg-rose-600 hover:bg-rose-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full sm:w-auto active:scale-[0.98]">
                      Deletar registros ({selecionadasExclusao.length})
                    </button>
                  </>
                )}
            </div>
          )}
      </div>

      <div className="flex-1 flex flex-col min-w-0 mx-auto w-full">
        
        {/* 2. BLOCO DE PENDÊNCIAS (AUDITORIA OPERACIONAL) */}
        {!modoExclusao && comandasAntigas.length > 0 && caixaAtual?.status === 'aberto' && (
          <div className="w-full mb-10 animate-in slide-in-from-top-2 duration-300">
            <div className={`w-full p-5 md:p-6 rounded-[1.25rem] border transition-colors shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${temaNoturno ? 'bg-[#161a20]/80 border-white/[0.06]' : 'bg-zinc-50 border-zinc-200'}`}>
              
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${temaNoturno ? 'bg-[#111318] border-white/5 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-500'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-[14px] tracking-tight ${temaNoturno ? 'text-zinc-200' : 'text-zinc-900'}`}>Pendências operacionais detectadas</p>
                    <span className={`w-2 h-2 rounded-full ${temaNoturno ? 'bg-amber-500/80' : 'bg-amber-500'}`}></span>
                  </div>
                  <p className={`text-xs font-medium mt-0.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{comandasAntigas.length} {comandasAntigas.length === 1 ? 'registro de turno anterior não finalizado' : 'registros de turnos anteriores não finalizados'}.</p>
                </div>
              </div>
              
              <button onClick={() => setMostrarAntigas(!mostrarAntigas)} className={`px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all border shadow-sm shrink-0 w-full sm:w-auto ${temaNoturno ? 'bg-[#1c2128] text-zinc-300 border-white/[0.05] hover:bg-[#232931]' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'}`}>
                {mostrarAntigas ? 'Ocultar registros' : 'Visualizar registros'}
              </button>

            </div>

            {mostrarAntigas && (
              <div className={`flex flex-wrap gap-5 justify-start w-full mt-4 pt-4 border-t border-dashed animate-in slide-in-from-top-2 fade-in duration-300 ${temaNoturno ? 'border-white/[0.05]' : 'border-zinc-200'}`}>
                {comandasAntigas.map(comanda => (
                  <div key={comanda.id} className="relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl opacity-80 hover:opacity-100 grayscale-[20%] hover:grayscale-0">
                    <CardComanda comanda={comanda} onClick={() => setIdSelecionado(comanda.id)} temaNoturno={temaNoturno} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAIXA FECHADO - TELA SETUP */}
        {caixaAtual?.status !== 'aberto' ? (
          <div className={`w-full max-w-md mx-auto p-10 mt-8 rounded-[1.5rem] border shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500 ${temaNoturno ? 'bg-[#161a20]/80 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-zinc-200/80'}`}>
            <div className="text-center mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 border ${temaNoturno ? 'bg-[#111318] border-white/5 text-zinc-300 shadow-inner' : 'bg-zinc-50 border-zinc-200 text-zinc-600 shadow-sm'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className={`text-xl font-bold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>Iniciar Sessão Operacional</h3>
              <p className={`text-sm mt-2 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Declare o fundo de caixa para o turno de {dataHoje ? dataHoje.split('-').reverse().join('/') : '...'}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`text-xs font-semibold tracking-wide mb-2 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Fundo Inicial em Espécie (R$)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={saldoInicial} 
                  onChange={(e) => setSaldoInicial(e.target.value)} 
                  className={`w-full p-4 rounded-xl border outline-none font-semibold text-center text-lg transition-all shadow-sm focus:ring-2 focus:ring-offset-0 ${temaNoturno ? 'bg-[#0f1115] border-white/10 text-white focus:border-white/20 focus:ring-white/5' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-300 focus:ring-zinc-100'}`} 
                />
              </div>
              <button onClick={handleAbrirCaixa} className={`w-full py-4 font-bold text-[14px] rounded-xl transition-all shadow-md active:scale-[0.98] ${temaNoturno ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                Confirmar Abertura
              </button>
            </div>
          </div>

        ) : (
          /* 3. GRID PRINCIPAL */
          <div className="flex flex-wrap gap-5 justify-start w-full">
            
            {/* Empty State Profissional */}
            {comandasHoje.length === 0 && !modoExclusao && (
              <div className={`w-full p-20 rounded-[1.5rem] text-center border border-dashed animate-in fade-in zoom-in-95 ${temaNoturno ? 'bg-[#111318]/50 border-white/[0.05] text-zinc-500' : 'bg-zinc-50/50 border-zinc-200 text-zinc-400'}`}>
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5 ${temaNoturno ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                  <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <p className={`font-semibold text-base tracking-tight ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>Workspace Operacional Limpo</p>
                <p className={`text-sm font-medium mt-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Utilize os botões no painel para iniciar um novo registro.</p>
              </div>
            )}

            {comandasParaRenderizar.map((comanda, index) => (
              <div key={comanda.id} className="relative group animate-in fade-in zoom-in-95 duration-300 transition-all hover:-translate-y-1 hover:shadow-xl">
                
                {/* Atalho Sutíl */}
                {index < 9 && !modoExclusao && (
                  <div className="absolute -top-3 -left-3 z-20 pointer-events-none transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5">
                     <div className={`w-7 h-7 rounded-lg border shadow-sm flex items-center justify-center text-[10px] font-bold font-mono ${temaNoturno ? 'bg-[#161a20] border-white/10 text-zinc-300 shadow-black/50' : 'bg-white border-zinc-200 text-zinc-500 shadow-sm'}`}>
                       {index + 1}
                     </div>
                  </div>
                )}

                {/* Checkbox de Seleção em Massa */}
                {modoExclusao && (
                  <div className="absolute -top-3 -right-3 z-20">
                      <div className={`w-7 h-7 rounded-lg border shadow-sm flex items-center justify-center cursor-pointer transition-colors ${selecionadasExclusao.includes(comanda.id) ? 'bg-rose-500 border-rose-600 shadow-rose-500/20' : (temaNoturno ? 'bg-[#161a20] border-white/10' : 'bg-white border-zinc-200')}`} onClick={() => toggleSelecaoExclusao(comanda.id)}>
                         {selecionadasExclusao.includes(comanda.id) && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                  </div>
                )}
                
                <div className={modoExclusao ? 'opacity-50 scale-[0.98] transition-all cursor-pointer hover:opacity-80' : ''} onClick={() => { if (modoExclusao) toggleSelecaoExclusao(comanda.id); }}>
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