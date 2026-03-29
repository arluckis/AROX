// src/components/TabComandas.js
'use client';
import { useState, useEffect, useRef } from 'react';
import CardComanda from '@/components/CardComanda';
import PreComanda from '@/components/PreComanda';

export default function TabComandas({
  temaNoturno, comandasAbertas, modoExclusao, setModoExclusao,
  selecionadasExclusao, toggleSelecaoExclusao, confirmarExclusaoEmMassa,
  adicionarComanda, setIdSelecionado, caixaAtual, abrirCaixaManual,
  abaAtiva // Adicionado aqui para receber a prop
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

  // Constantes de estilo AROX
  const btnPrimario = temaNoturno 
    ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
    : 'bg-zinc-900 text-white hover:bg-black shadow-[0_2px_10px_rgba(0,0,0,0.1)]';
  
  const btnSecundario = temaNoturno
    ? 'bg-[#18181B] border-white/10 text-white hover:bg-zinc-800 shadow-sm'
    : 'bg-white border-black/10 text-zinc-900 hover:bg-zinc-50 shadow-sm';

  return (
    <div className={`w-full h-full flex flex-col font-sans overflow-hidden arox-cinematic pb-20`}>
      
      {/* 1. HEADER OPERACIONAL */}
      {caixaAtual?.status === 'aberto' && (
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 w-full border-b pb-6 transition-colors duration-300 ${temaNoturno ? 'border-white/[0.08]' : 'border-black/[0.04]'}`}>
            
            {/* Esquerda: Identidade e Métricas */}
            <div className="flex flex-col gap-1.5">
              {!modoExclusao ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className={`text-[11px] font-bold tabular-nums ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      Contas Abertas
                    </h1>
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className={`text-[11px] font-bold tabular-nums ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {comandasHoje.length}
                      </span>
                    </div>
                  </div>
                  <div className={`text-[13px] font-medium tracking-tight flex items-center gap-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    <span>Volume em operação</span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
                    <span className={`font-mono font-semibold ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      R$ {volumeHoje.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className={`text-2xl font-bold tracking-tight ${temaNoturno ? 'text-red-400' : 'text-red-600'}`}>
                      Modo de Exclusão
                    </h1>
                  </div>
                  <div className={`text-[13px] font-medium tracking-tight ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
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
                      <button onClick={() => setModoExclusao(!modoExclusao)} className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-black/5'}`}>
                        Excluir Múltiplas
                      </button>
                    )}
                    
                    <button onClick={() => adicionarComanda('Delivery')} className={`px-5 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all border flex items-center justify-center gap-2 active:scale-95 ${btnSecundario}`}>
                      Novo Delivery
                    </button>

                    <button onClick={() => adicionarComanda('Balcão')} className={`px-6 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all flex items-center justify-center gap-2 active:scale-95 ${btnPrimario}`}>
                      Nova Conta
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setModoExclusao(false)} className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border w-full sm:w-auto active:scale-95 ${btnSecundario}`}>
                      Cancelar
                    </button>
                    <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-[0_2px_10px_rgba(239,68,68,0.2)] hover:bg-red-600 active:scale-95">
                      Confirmar Exclusão
                    </button>
                  </>
                )}
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 mx-auto w-full">
        
        {/* 2. BLOCO DE PENDÊNCIAS */}
        {!modoExclusao && comandasAntigas.length > 0 && caixaAtual?.status === 'aberto' && (
          <div className="w-full mb-8 animate-in slide-in-from-top-2 duration-500">
            <button 
              onClick={() => setMostrarAntigas(!mostrarAntigas)} 
              className={`w-full py-4 px-5 rounded-2xl flex justify-between items-center group cursor-pointer transition-all border ${temaNoturno ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' : 'bg-amber-50/50 border-amber-500/30 hover:border-amber-500/50'}`}
            >
              <div className="flex items-center gap-3">
                <p className={`text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 ${temaNoturno ? 'text-amber-500' : 'text-amber-700'}`}>
                  Pendências Anteriores
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black tabular-nums ${temaNoturno ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200 text-amber-800'}`}>
                    {comandasAntigas.length}
                  </span>
                </p>
              </div>
              
              <div className={`transition-transform duration-500 ease-out ${mostrarAntigas ? 'rotate-180' : ''} ${temaNoturno ? 'text-amber-500' : 'text-amber-700'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </button>

            {mostrarAntigas && (
              <div className="flex flex-wrap gap-5 justify-start w-full mt-5 p-2 pt-3 animate-in slide-in-from-top-2 fade-in duration-500">
                {comandasAntigas.map(comanda => (
                  <div key={comanda.id} className="relative group transition-all duration-300 opacity-90 hover:opacity-100 hover:-translate-y-1">
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
            temaAnterior={temaNoturno ? 'dark' : 'light'}
            isSistemaJaAcessado={true}
          />
        ) : (
          /* 3. GRID PRINCIPAL (O pl-2 pt-2 dá o respiro necessário pro número não cortar) */
          <div className="flex flex-wrap gap-5 justify-start w-full pl-2 pt-2">
            
            {/* Empty State AROX */}
            {comandasHoje.length === 0 && !modoExclusao && (
              <div className={`w-full py-32 flex flex-col items-center justify-center rounded-3xl border border-dashed transition-colors ${temaNoturno ? 'border-white/[0.08] bg-white/[0.01]' : 'border-black/[0.08] bg-black/[0.01]'}`}>
                <p className={`text-[15px] font-bold tracking-tight mb-3 ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>Nenhuma conta em operação</p>
                <p className={`text-[13px] flex items-center gap-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Pressione <kbd className={`px-2 py-1 rounded-md text-[11px] font-bold font-sans border shadow-sm ${temaNoturno ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`}>Enter</kbd> para abrir rapidamente no balcão
                </p>
              </div>
            )}

            {comandasParaRenderizar.map((comanda, index) => (
              <div key={comanda.id} className="relative group arox-cinematic transition-all" style={{ animationDelay: `${index * 30}ms` }}>
                
                {/* Atalho de Teclado Premium */}
                {index < 9 && !modoExclusao && (
                  <div className="absolute -top-1 -left-1 z-20 pointer-events-none transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:scale-110">
                      <div className={`w-7 h-7 rounded-xl border flex items-center justify-center text-[12px] font-black shadow-lg backdrop-blur-md ${temaNoturno ? 'bg-zinc-800/90 border-white/10 text-zinc-300' : 'bg-white/90 border-black/10 text-zinc-700'}`}>
                        {index + 1}
                      </div>
                  </div>
                )}

                {/* Checkbox de Exclusão Destrutivo */}
                {modoExclusao && (
                  <div className="absolute top-4 right-4 z-20">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all shadow-sm ${selecionadasExclusao.includes(comanda.id) ? 'bg-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : (temaNoturno ? 'bg-[#111] border-white/20 hover:border-red-400' : 'bg-white border-black/20 hover:border-red-400')}`} onClick={() => toggleSelecaoExclusao(comanda.id)}>
                          {selecionadasExclusao.includes(comanda.id) && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                  </div>
                )}
                
                {/* Container controlando a escala na exclusão */}
                <div 
                  className={`transition-all duration-300 ease-out cursor-pointer h-full ${modoExclusao ? (selecionadasExclusao.includes(comanda.id) ? 'ring-2 ring-red-500 ring-offset-4 dark:ring-offset-[#050505] rounded-3xl scale-[0.96]' : 'opacity-40 grayscale hover:opacity-80 scale-[0.98]') : 'hover:-translate-y-1'}`} 
                  onClick={() => { if (modoExclusao) toggleSelecaoExclusao(comanda.id); }}
                >
                  <CardComanda comanda={comanda} onClick={() => { if (!modoExclusao) setIdSelecionado(comanda.id); }} temaNoturno={temaNoturno} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .arox-cinematic { animation: arox-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); }
        @keyframes arox-fade-up { 100% { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}