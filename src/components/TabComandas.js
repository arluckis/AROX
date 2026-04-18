'use client';
import { useState, useEffect, useRef } from 'react';
import CardComanda from '@/components/CardComanda';
import PreComanda from '@/components/PreComanda';

export default function TabComandas({
  temaNoturno, comandasAbertas, modoExclusao, setModoExclusao,
  selecionadasExclusao, toggleSelecaoExclusao, confirmarExclusaoEmMassa,
  adicionarComanda, setIdSelecionado, caixaAtual, abrirCaixaManual,
  abaAtiva
}) {

  const [saldoInicial, setSaldoInicial] = useState('');
  const [dataHoje, setDataHoje] = useState('');
  const [mostrarAntigas, setMostrarAntigas] = useState(false);
  const debounceRef = useRef(false);

  useEffect(() => {
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); 
    setDataHoje(hoje);
  }, []);

  // === FIX ABA FANTASMA: Se o usuário clica na Sidebar para ir para outra aba, fecha a comanda aberta ===
  useEffect(() => {
    if (abaAtiva !== 'comandas') {
      setIdSelecionado(null);
    }
  }, [abaAtiva, setIdSelecionado]);


  // === CORREÇÃO CIRÚRGICA: Revelar a Cena Cinematográfica (Planeta) ===
  useEffect(() => {
    if (caixaAtual?.status !== 'aberto') {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.style.setProperty('background-color', 'transparent', 'important');
      }
      return () => {
        if (mainEl) mainEl.style.removeProperty('background-color');
      };
    }
  }, [caixaAtual?.status]);

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
          const comandasHoje = comandasAbertas.filter(c => {
            if (caixaAtual?.status === 'aberto' && c.caixa_id === caixaAtual.id) return true;
            return !c.data || c.data >= dataHoje;
          });
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

  const comandasHoje = comandasAbertas.filter(c => {
    if (caixaAtual?.status === 'aberto' && c.caixa_id === caixaAtual.id) return true;
    return !c.data || c.data >= dataHoje;
  });

  const comandasAntigas = comandasAbertas.filter(c => {
    if (caixaAtual?.status === 'aberto' && c.caixa_id === caixaAtual.id) return false;
    return c.data && c.data < dataHoje;
  });

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

  // Botões mais ágeis. Retirado o eixo Y agressivo, focado no feedback de toque.
  const btnPrimario = temaNoturno 
    ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.95]' 
    : 'bg-zinc-900 text-white hover:bg-black shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.95]';
  
  const btnSecundario = temaNoturno
    ? 'bg-[#18181B] border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-sm hover:border-white/20 active:scale-[0.95]'
    : 'bg-white border-black/10 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-sm hover:border-black/20 active:scale-[0.95]';

  return (
    <div className={`w-full h-full flex flex-col font-sans overflow-hidden arox-entrance pb-20`}>
      
      {/* HEADER OPERACIONAL - Snappy Slide */}
      {caixaAtual?.status === 'aberto' && (
        <div className={`arox-slide-down flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 w-full border-b pb-6 transition-colors duration-200 ${temaNoturno ? 'border-white/[0.08]' : 'border-black/[0.04]'}`}>
            
            <div className="flex flex-col gap-1.5 arox-fade-in-fast">
              {!modoExclusao ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className={`text-[11px] font-bold tabular-nums tracking-widest uppercase ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Contas Abertas
                    </h1>
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border ${temaNoturno ? 'bg-white/5 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'bg-black/5 border-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'}`}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-[1200ms]"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className={`text-[11px] font-black tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>
                        {comandasHoje.length}
                      </span>
                    </div>
                  </div>
                  <div className={`text-[13px] font-medium tracking-tight flex items-center gap-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span>Volume em operação</span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
                    <span className={`font-mono font-bold tracking-tight transition-all duration-300 ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      R$ {volumeHoje.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="arox-alert-enter">
                  <div className="flex items-center gap-3">
                    <h1 className={`text-2xl font-black tracking-tighter ${temaNoturno ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.2)]' : 'text-red-600'}`}>
                      Modo de Exclusão
                    </h1>
                  </div>
                  <div className={`text-[13px] font-medium tracking-tight mt-1 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {selecionadasExclusao.length} {selecionadasExclusao.length === 1 ? 'conta selecionada' : 'contas selecionadas'}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto arox-fade-in-fast">
                {!modoExclusao ? (
                  <>
                    {comandasAbertas.length > 0 && (
                      <button onClick={() => setModoExclusao(!modoExclusao)} className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${temaNoturno ? 'text-zinc-500 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-black/5'}`}>
                        Excluir Múltiplas
                      </button>
                    )}
                    
                    <button onClick={() => adicionarComanda('Delivery')} className={`px-5 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all duration-200 border flex items-center justify-center gap-2 ${btnSecundario}`}>
                      Novo Delivery
                    </button>

                    <button onClick={() => adicionarComanda('Balcão')} className={`px-6 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${btnPrimario}`}>
                      Nova Conta
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setModoExclusao(false)} className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border w-full sm:w-auto active:scale-95 ${btnSecundario}`}>
                      Cancelar
                    </button>
                    <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-500 text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto shadow-sm hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:bg-red-600 active:scale-95">
                      Confirmar Exclusão
                    </button>
                  </>
                )}
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 mx-auto w-full">
        
        {/* BLOCO DE PENDÊNCIAS */}
        {!modoExclusao && comandasAntigas.length > 0 && caixaAtual?.status === 'aberto' && (
          <div className="w-full mb-8 arox-slide-up-fast">
            <button 
              onClick={() => setMostrarAntigas(!mostrarAntigas)} 
              className={`w-full py-4 px-5 rounded-2xl flex justify-between items-center group cursor-pointer transition-all duration-200 border active:scale-[0.98] ${temaNoturno ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30' : 'bg-amber-50/50 border-amber-500/30 hover:bg-amber-100/50 hover:border-amber-500/50'}`}
            >
              <div className="flex items-center gap-3">
                <p className={`text-[13px] font-bold uppercase tracking-widest flex items-center gap-3 transition-colors duration-200 ${temaNoturno ? 'text-amber-500 group-hover:text-amber-400' : 'text-amber-700 group-hover:text-amber-800'}`}>
                  Pendências Anteriores
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black tabular-nums transition-colors duration-200 ${temaNoturno ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200 text-amber-800'}`}>
                    {comandasAntigas.length}
                  </span>
                </p>
              </div>
              
              <div className={`transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${mostrarAntigas ? 'rotate-180' : 'rotate-0'} ${temaNoturno ? 'text-amber-500' : 'text-amber-700'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${mostrarAntigas ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
              <div className="overflow-hidden">
                <div className="flex flex-wrap gap-5 justify-start w-full p-2 pt-1">
                  {comandasAntigas.map((comanda, index) => (
                    <div key={comanda.id} className="relative group arox-stagger-card" style={{ animationDelay: `${index * 15}ms` }}>
                      <div className="transition-all duration-200 ease-out opacity-80 hover:opacity-100 hover:scale-[1.02] active:scale-[0.96] cursor-pointer">
                        <CardComanda comanda={comanda} onClick={() => setIdSelecionado(comanda.id)} temaNoturno={temaNoturno} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETUP INICIAL */}
        {caixaAtual?.status !== 'aberto' ? (
          <div className="animate-in fade-in duration-300">
            <PreComanda
              onFinalizarAbertura={(valor) =>
                abrirCaixaManual({
                  data_abertura: dataHoje,
                  saldo_inicial: valor,
                })
              }
              temPendenciaTurnoAnterior={false}
              onResolverPendencia={() => {}}
              temaAnterior={temaNoturno ? 'dark' : 'light'}
              isSistemaJaAcessado={true}
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-5 justify-start w-full pl-2 pt-2 relative">
            
            {/* Empty State Simplificado e Direto */}
            {comandasHoje.length === 0 && !modoExclusao && (
              <div className={`w-full py-32 flex flex-col items-center justify-center rounded-3xl border border-dashed transition-all duration-300 ${temaNoturno ? 'border-white/[0.08] bg-white/[0.01]' : 'border-black/[0.08] bg-black/[0.01]'}`}>
                <p className={`text-[15px] font-bold tracking-tight mb-3 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>Nenhuma conta em operação</p>
                <p className={`text-[13px] flex items-center gap-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Pressione <kbd className={`px-2 py-1 rounded-md text-[11px] font-bold font-sans border shadow-sm transition-all duration-200 ${temaNoturno ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`}>Enter</kbd> para abrir rapidamente no balcão
                </p>
              </div>
            )}

            {comandasParaRenderizar.map((comanda, index) => (
              <div key={comanda.id} className="relative group arox-stagger-card" style={{ animationDelay: `${index * 15}ms` }}>
                
                {/* Indicador Numérico Rápido */}
                {index < 9 && !modoExclusao && (
                  <div className="absolute -top-2 -left-2 z-20 pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[13px] font-black shadow-lg backdrop-blur-md ${temaNoturno ? 'bg-zinc-800/95 border-white/20 text-zinc-200' : 'bg-white/95 border-black/20 text-zinc-800'}`}>
                        {index + 1}
                      </div>
                  </div>
                )}

                {/* Checkbox de Exclusão Snappy */}
                {modoExclusao && (
                  <div className="absolute top-4 right-4 z-20 arox-pop-in">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] shadow-sm active:scale-90 ${selecionadasExclusao.includes(comanda.id) ? 'bg-red-500 border-red-500 scale-110' : (temaNoturno ? 'bg-black/50 backdrop-blur-sm border-white/30' : 'bg-white/50 backdrop-blur-sm border-black/30')}`} onClick={() => toggleSelecaoExclusao(comanda.id)}>
                          {selecionadasExclusao.includes(comanda.id) && <svg className="w-4 h-4 text-white arox-check-draw" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                  </div>
                )}
                
                {/* O Cartão - Foco no Scale e Active (Clique) */}
                <div 
                  className={`transition-all duration-200 ease-out cursor-pointer h-full origin-center
                    ${modoExclusao 
                      ? (selecionadasExclusao.includes(comanda.id) 
                          ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#050505] rounded-[24px] scale-[0.96] opacity-100' 
                          : 'opacity-40 grayscale-[0.8] hover:opacity-70 scale-[0.98]') 
                      : 'hover:scale-[1.02] active:scale-[0.96] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_20px_rgba(255,255,255,0.03)] hover:z-10'}`} 
                  onClick={() => { if (modoExclusao) toggleSelecaoExclusao(comanda.id); }}
                >
                  <CardComanda comanda={comanda} onClick={() => { if (!modoExclusao) setIdSelecionado(comanda.id); }} temaNoturno={temaNoturno} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* A MENTE DO CINEGRAFISTA: SAAS Edition (Rápido, Elástico, Responsivo) */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Curva Apple Spring: rápida no início, leve elástico no fim */
        :root { --spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1); }

        .arox-entrance { animation: fadeUp 0.35s var(--ease-out) forwards; }
        .arox-slide-down { animation: slideDown 0.3s var(--ease-out) forwards; opacity: 0; transform: translateY(-8px); }
        .arox-slide-up-fast { animation: fadeUp 0.3s var(--ease-out) 0.05s forwards; opacity: 0; transform: translateY(8px); }
        .arox-fade-in-fast { animation: fadeIn 0.3s ease-out 0.1s forwards; opacity: 0; }
        
        /* Stagger agora é ágil, sem translação exagerada no Y */
        .arox-stagger-card { 
          animation: cardPopUp 0.35s var(--spring) forwards; 
          opacity: 0; 
          transform: translateY(10px) scale(0.96); 
        }

        .arox-alert-enter { animation: alertPop 0.3s var(--spring) forwards; }
        .arox-pop-in { animation: scaleIn 0.25s var(--spring) forwards; }
        .arox-check-draw { stroke-dasharray: 20; stroke-dashoffset: 20; animation: drawCheck 0.2s ease-out forwards; }

        @keyframes fadeUp { 
          0% { opacity: 0; transform: translateY(10px); } 
          100% { opacity: 1; transform: translateY(0); } 
        }
        @keyframes slideDown { 
          0% { opacity: 0; transform: translateY(-10px); } 
          100% { opacity: 1; transform: translateY(0); } 
        }
        @keyframes fadeIn { 
          0% { opacity: 0; } 
          100% { opacity: 1; } 
        }
        @keyframes cardPopUp { 
          0% { opacity: 0; transform: translateY(15px) scale(0.92); } 
          100% { opacity: 1; transform: translateY(0) scale(1); } 
        }
        @keyframes alertPop {
          0% { opacity: 0; transform: scale(0.95) translateX(-5px); }
          100% { opacity: 1; transform: scale(1) translateX(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
      `}} />
    </div>
  );
}