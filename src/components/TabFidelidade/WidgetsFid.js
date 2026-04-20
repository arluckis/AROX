'use client';
import React, { useState, useMemo } from 'react';

const textSecundario = (tema) => tema ? 'text-zinc-400' : 'text-zinc-500';
const textPrincipal = (tema) => tema ? 'text-zinc-100' : 'text-zinc-900';
const bordaBase = (tema) => tema ? 'border-white/[0.06]' : 'border-black/[0.06]';
const surfaceBase = (tema) => tema ? 'bg-[#0A0A0C]' : 'bg-white';

export const PerfilCliente = ({ temaNoturno, clientePerfil, setClientePerfil, comandas, meta, obterDiagnostico }) => {
  // viewMapa: 'mes' (calendário navegável) | 'hora' (0h às 23h)
  const [viewMapa, setViewMapa] = useState('mes'); 
  const [hoverBox, setHoverBox] = useState(null);
  
  // Navegação do Calendário
  const [mesFoco, setMesFoco] = useState(new Date());

  const diasSemanaNomesCurto = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Core Analytics
  const metricas = useMemo(() => {
    let totalGasto = 0;
    let totalVisitas = 0;
    let ultimaVisitaDate = null;
    
    const contagemGlobal = {};
    let horasFrequencia = Array.from({ length: 24 }, () => ({ count: 0 })); 
    let diasSemFrequencia = Array.from({ length: 7 }, () => ({ count: 0 }));
    let diasDoMesFrequencia = {}; 

    const comandasDele = (comandas || []).filter(c => c.nome?.toLowerCase() === clientePerfil.nome?.toLowerCase());
    
    comandasDele.forEach(c => {
      const ticket = (c.produtos || []).reduce((acc, p) => acc + (p.preco || 0), 0);
      totalGasto += ticket;
      
      const dataVisita = c.created_at || c.data_hora || c.data;
      if (dataVisita) {
        totalVisitas++;
        const d = new Date(dataVisita);
        const diaSemana = d.getDay();
        const hora = d.getHours();
        
        // Chave universal para mapeamento do calendário
        const diaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        if (!ultimaVisitaDate || d > ultimaVisitaDate) ultimaVisitaDate = d;
        
        if (diaSemana >= 0 && diaSemana <= 6) diasSemFrequencia[diaSemana].count++;
        if (hora >= 0 && hora <= 23) horasFrequencia[hora].count++;
        
        if (!diasDoMesFrequencia[diaStr]) diasDoMesFrequencia[diaStr] = { count: 0, gasto: 0 };
        diasDoMesFrequencia[diaStr].count++;
        diasDoMesFrequencia[diaStr].gasto += ticket;
      }

      (c.produtos || []).forEach(p => {
        const n = p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim().toUpperCase();
        contagemGlobal[n] = (contagemGlobal[n] || 0) + 1;
      });
    });

    const ticketMedio = totalVisitas > 0 ? (totalGasto / totalVisitas) : 0;
    
    // Fallback elegante para Valor Consumido (Estimativa)
    let isEstimado = false;
    let valorAcumuladoExibicao = totalGasto;
    if (totalGasto === 0 && (clientePerfil.pontos_totais || clientePerfil.pontos) > 0) {
        valorAcumuladoExibicao = (clientePerfil.pontos_totais || clientePerfil.pontos) * (meta.valor_minimo || 1);
        isEstimado = true;
    }

    // LTV: Pontos vitais (Nunca desconta o que foi gasto)
    const totalPontosLtv = clientePerfil.pontos_totais || clientePerfil.pontos || 0;
    
    // Sort produtos
    let produtos = Object.entries(contagemGlobal).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
    const totalItensComprados = produtos.reduce((acc, p) => acc + p.qtd, 0);
    produtos = produtos.map(p => ({ ...p, percent: totalItensComprados ? ((p.qtd / totalItensComprados) * 100) : 0 }));

    // Insights Herois
    let diaFavorito = { nome: '-', count: 0 };
    diasSemFrequencia.forEach((d, i) => { if (d.count > diaFavorito.count) diaFavorito = { nome: diasSemanaNomes[i], count: d.count }; });
    
    let horaFavorita = { nome: '-', count: 0 };
    let maxHoraRealCount = 0;
    horasFrequencia.forEach((h, i) => { 
        if (h.count > horaFavorita.count) {
            horaFavorita = { nome: `${i}h`, count: h.count }; 
            maxHoraRealCount = h.count;
        }
    });

    let produtoFavorito = produtos.length > 0 ? produtos[0].nome : 'Nenhum item';

    let diasAtrasVisita = 'Inativo';
    if (ultimaVisitaDate) {
      const diff = new Date() - ultimaVisitaDate;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diasAtrasVisita = days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : `${days} dias atrás`;
    }

    return { 
        totalGasto: valorAcumuladoExibicao, isEstimado, ticketMedio, totalVisitas, diasAtrasVisita,
        produtos, maxProdutoQtd: produtos.length > 0 ? produtos[0].qtd : 1,
        horasFrequencia, maxHoraRealCount, diasDoMesFrequencia, totalPontosLtv,
        insights: { diaFavorito: diaFavorito.nome, horaFavorita: horaFavorita.nome, produtoFavorito }
    };
  }, [clientePerfil, comandas, meta, diasSemanaNomes]);

  // Cálculos dinâmicos do Calendário baseado no `mesFoco`
  const anoFoco = mesFoco.getFullYear();
  const mesFocoIdx = mesFoco.getMonth();
  const diasNoMes = new Date(anoFoco, mesFocoIdx + 1, 0).getDate();
  const primeiroDiaDaSemana = new Date(anoFoco, mesFocoIdx, 1).getDay(); // 0 (Dom) a 6 (Sáb)
  
  // Monta a grade real de dias
  const gridDias = Array.from({ length: primeiroDiaDaSemana }, () => null).concat(
      Array.from({ length: diasNoMes }, (_, i) => i + 1)
  );

  // Calcula o máximo de visitas DENTRO do mês focado para calibrar o Heatmap
  const maxMensalCount = useMemo(() => {
    let max = 1;
    for (let i = 1; i <= diasNoMes; i++) {
        const dStr = `${anoFoco}-${String(mesFocoIdx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (metricas.diasDoMesFrequencia[dStr] && metricas.diasDoMesFrequencia[dStr].count > max) {
            max = metricas.diasDoMesFrequencia[dStr].count;
        }
    }
    return max;
  }, [anoFoco, mesFocoIdx, diasNoMes, metricas.diasDoMesFrequencia]);

  const irParaMesAnterior = () => setMesFoco(new Date(anoFoco, mesFocoIdx - 1, 1));
  const irParaProximoMes = () => setMesFoco(new Date(anoFoco, mesFocoIdx + 1, 1));

  return (
    <div className={`flex flex-col h-full w-full animate-in fade-in duration-700 bg-transparent`}>
      
      {/* 1. TOPO EDITORIAL (HERO) */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-10 shrink-0 flex items-start gap-5 relative group">
        <button 
          onClick={() => setClientePerfil(null)} 
          className={`mt-2 shrink-0 flex items-center justify-center transition-all duration-300 opacity-60 hover:opacity-100 hover:-translate-x-1 ${textPrincipal(temaNoturno)}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <h1 className={`text-4xl md:text-5xl font-black tracking-tighter truncate ${textPrincipal(temaNoturno)}`}>
              {clientePerfil.nome}
            </h1>
            <div className={`px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest border ${obterDiagnostico(clientePerfil).bg} ${obterDiagnostico(clientePerfil).color} ${temaNoturno ? 'border-white/10' : 'border-black/10'}`}>
              {obterDiagnostico(clientePerfil).label}
            </div>
          </div>
          <p className={`text-[13px] md:text-[14px] font-semibold tracking-wide flex items-center gap-2 ${textSecundario(temaNoturno)}`}>
            <span>{clientePerfil.telefone || 'S/ Contato'}</span>
            <span className="opacity-40">•</span>
            <span>Cliente desde {new Date(clientePerfil.created_at).getFullYear()}</span>
          </p>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 w-full px-4 md:px-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          {/* 2. ARQUITETURA DE MÉTRICAS (Assimetria Premium) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
            
            {/* Box Hero: LTV + Valor Consumido (Span 5) */}
            <div className={`col-span-1 md:col-span-5 p-6 md:p-8 rounded-[32px] border flex flex-col justify-between relative overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-700 ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
              {/* Bg glow sutil */}
              <div className={`absolute -top-10 -right-10 w-40 h-40 blur-3xl rounded-full opacity-20 pointer-events-none ${temaNoturno ? 'bg-indigo-500' : 'bg-indigo-300'}`} />
              
              <div className="flex justify-between items-start z-10">
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Valor Consumido</p>
                    <div className="flex items-baseline gap-1.5 group cursor-default">
                        <span className={`text-[18px] font-bold ${textSecundario(temaNoturno)}`}>R$</span>
                        <p className={`text-4xl md:text-5xl font-black tracking-tighter ${textPrincipal(temaNoturno)}`}>{metricas.totalGasto.toFixed(2).replace('.', ',')}</p>
                        {metricas.isEstimado && (
                            <span className={`ml-1 text-[16px] font-bold opacity-40 hover:opacity-100 transition-opacity cursor-help ${textPrincipal(temaNoturno)}`} title="Valor estimado com base no acúmulo de pontos">
                                *
                            </span>
                        )}
                    </div>
                    {metricas.isEstimado && (
                        <p className={`text-[9px] mt-1 italic tracking-wide ${textSecundario(temaNoturno)}`}>*Projeção baseada no histórico de pontos</p>
                    )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t z-10 flex justify-between items-end border-white/[0.04]">
                 <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Histórico Total (Sempre)</p>
                    <p className={`text-2xl font-black tracking-tighter ${textPrincipal(temaNoturno)}`}>{metricas.totalPontosLtv} <span className="text-[12px] font-semibold opacity-60">pts</span></p>
                 </div>
                 <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Visitas</p>
                    <p className={`text-xl font-bold tracking-tighter ${textPrincipal(temaNoturno)}`}>{metricas.totalVisitas}</p>
                 </div>
              </div>
            </div>

            {/* Box Secundário: Progresso Resgate (Span 3) */}
            <div className={`col-span-1 md:col-span-3 p-6 rounded-[32px] border flex flex-col justify-center animate-in slide-in-from-bottom-4 fade-in duration-700 delay-[50ms] ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70 ${textSecundario(temaNoturno)}`}>Meta de Resgate</p>
              <div className="flex items-baseline gap-1.5 mb-4">
                <p className={`text-4xl font-black tracking-tighter ${clientePerfil.pontos >= meta.pontos_necessarios ? 'text-emerald-500' : textPrincipal(temaNoturno)}`}>{clientePerfil.pontos}</p>
                <span className={`text-[13px] font-bold ${textSecundario(temaNoturno)}`}>/ {meta.pontos_necessarios} pts</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${temaNoturno ? 'bg-white/5' : 'bg-black/5'}`}>
                 <div 
                   className={`h-full rounded-full transition-all duration-1000 ${clientePerfil.pontos >= meta.pontos_necessarios ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                   style={{ width: `${Math.min((clientePerfil.pontos / meta.pontos_necessarios) * 100, 100)}%` }} 
                 />
              </div>
            </div>

            {/* Grid Insights Compactos (Span 4) */}
            <div className="col-span-1 md:col-span-4 grid grid-rows-2 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-[100ms]">
                <div className={`p-5 rounded-[24px] border flex items-center justify-between transition-colors hover:bg-white/[0.02] ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
                   <div>
                     <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Última Visita</p>
                     <p className={`text-xl font-black tracking-tight ${textPrincipal(temaNoturno)}`}>{metricas.diasAtrasVisita}</p>
                   </div>
                   <div className="text-right">
                     <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Ticket Médio</p>
                     <p className={`text-xl font-black tracking-tight ${textPrincipal(temaNoturno)}`}><span className="text-sm">R$</span> {metricas.ticketMedio.toFixed(2).replace('.', ',')}</p>
                   </div>
                </div>
                <div className={`p-5 rounded-[24px] border flex items-center justify-between transition-colors hover:bg-white/[0.02] ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
                   <div>
                     <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Golden Hour</p>
                     <p className={`text-[15px] font-bold tracking-tight ${textPrincipal(temaNoturno)}`}>
                         <span className={temaNoturno ? 'text-amber-400' : 'text-amber-600'}>{metricas.insights.diaFavorito}</span> às <span className={temaNoturno ? 'text-amber-400' : 'text-amber-600'}>{metricas.insights.horaFavorita}</span>
                     </p>
                   </div>
                   <div className="text-right max-w-[45%]">
                     <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>DNA</p>
                     <p className={`text-[12px] font-bold tracking-tight truncate ${textPrincipal(temaNoturno)}`}>{metricas.insights.produtoFavorito}</p>
                   </div>
                </div>
            </div>
          </div>

          {/* 3. MAPAS ANALÍTICOS & DNA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
             
             {/* PAINEL TEMPORAL (Esquerda - 7 colunas) */}
             <div className={`col-span-1 lg:col-span-7 p-6 md:p-8 rounded-[32px] border flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-700 delay-[150ms] ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                   <h3 className={`text-[13px] font-bold uppercase tracking-widest ${textSecundario(temaNoturno)}`}>Inteligência Temporal</h3>
                   
                   <div className={`flex items-center p-1 rounded-xl border ${temaNoturno ? 'bg-[#141414] border-white/5' : 'bg-zinc-50 border-black/5'}`}>
                      {[{id: 'mes', l:'Calendário'}, {id: 'hora', l:'24 Horas'}].map((btn) => (
                        <button key={btn.id} onClick={() => setViewMapa(btn.id)} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${viewMapa === btn.id ? (temaNoturno ? 'bg-white/10 text-white shadow-sm' : 'bg-white shadow-sm text-black') : `hover:opacity-80 ${textSecundario(temaNoturno)}`}`}>
                          {btn.l}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Wrapper do Gráfico corrigido: altura dinâmica para o calendário (evita overflow), altura fixa para as barras de 24h */}
                <div className={`w-full flex justify-center mt-auto relative ${viewMapa === 'hora' ? 'h-64 items-end' : ''}`}>
                   
                   {/* VISÃO CALENDÁRIO MENSAL (Malha Autêntica) */}
                   {viewMapa === 'mes' && (
                     <div className="w-full max-w-[400px] mx-auto flex flex-col h-full animate-in fade-in duration-500">
                       
                       {/* Controle de Mês */}
                       <div className="flex items-center justify-between mb-4 px-2">
                          <button onClick={irParaMesAnterior} className={`p-1.5 rounded-md transition-colors ${temaNoturno ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <span className={`text-[11px] font-bold uppercase tracking-widest ${textPrincipal(temaNoturno)}`}>
                             {mesFoco.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                          </span>
                          <button onClick={irParaProximoMes} className={`p-1.5 rounded-md transition-colors ${temaNoturno ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </button>
                       </div>

                       {/* Grid do Calendário */}
                       <div className="grid grid-cols-7 gap-1 w-full h-full pb-2">
                         {/* Cabeçalho dos Dias */}
                         {diasSemanaNomesCurto.map((d, i) => (
                           <div key={`h-${i}`} className={`text-center text-[9px] font-bold uppercase opacity-50 ${textSecundario(temaNoturno)}`}>{d}</div>
                         ))}
                         
                         {/* Dias (Células Vazias + Dias Reais) */}
                         {gridDias.map((dia, idx) => {
                            if (!dia) return <div key={`empty-${idx}`} className="w-full aspect-square" />;

                            const dataStr = `${anoFoco}-${String(mesFocoIdx + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                            const info = metricas.diasDoMesFrequencia[dataStr];
                            const count = info ? info.count : 0;
                            const isPico = count === maxMensalCount && count > 0;
                            
                            // Lógica de Heatmap Elegante
                            let corFundo = temaNoturno ? 'bg-transparent border border-white/[0.02]' : 'bg-transparent border border-black/[0.02]';
                            if (count > 0) {
                                corFundo = isPico ? 'bg-indigo-500/90' : (temaNoturno ? 'bg-indigo-500/40' : 'bg-indigo-500/30');
                            }

                            return (
                              <div key={dia} onMouseEnter={() => setHoverBox(`dia_${dia}`)} onMouseLeave={() => setHoverBox(null)} className="w-full aspect-square relative group cursor-crosshair p-0.5">
                                <div className={`w-full h-full rounded-md flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${count > 0 ? 'hover:scale-[1.15] z-10 shadow-sm' : ''} ${corFundo} ${count > 0 ? 'text-white' : (temaNoturno ? 'text-zinc-700' : 'text-zinc-300')}`}>
                                  {dia}
                                </div>

                                {/* Tooltip Rico */}
                                {hoverBox === `dia_${dia}` && count > 0 && (
                                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2.5 bg-[#1A1A1A] border border-white/10 text-white text-left rounded-xl shadow-2xl z-30 min-w-[120px] pointer-events-none animate-in fade-in zoom-in-95">
                                    <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1 border-b border-white/10 pb-1">{dia} {mesFoco.toLocaleString('pt-BR', {month:'short'})}</p>
                                    <div className="flex justify-between items-center text-[11px] font-bold">
                                        <span>Visitas:</span>
                                        <span className="text-indigo-400">{count}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-bold">
                                        <span>Gasto:</span>
                                        <span className="text-emerald-400">R$ {info.gasto.toFixed(2).replace('.',',')}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                         })}
                       </div>
                     </div>
                   )}

                   {/* VISÃO 24 HORAS (Elegância Gráfica) */}
                   {viewMapa === 'hora' && (
                     <div className="w-full h-full flex flex-col justify-end gap-2 animate-in fade-in duration-500 pb-2">
                        <div className="flex-1 flex items-end justify-between gap-1 sm:gap-1.5 w-full">
                            {metricas.horasFrequencia.map((h, i) => {
                            const height = metricas.maxHoraRealCount === 0 ? 0 : (h.count / metricas.maxHoraRealCount) * 100;
                            const isPico = h.count === metricas.maxHoraRealCount && h.count > 0;
                            
                            return (
                                <div key={i} onMouseEnter={() => setHoverBox(`hora_${i}`)} onMouseLeave={() => setHoverBox(null)} className="flex flex-col items-center justify-end w-full h-full relative cursor-crosshair group">
                                    
                                    {/* Tooltip */}
                                    {hoverBox === `hora_${i}` && h.count > 0 && (
                                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#1A1A1A] border border-white/10 text-white text-[11px] font-bold rounded-lg shadow-xl z-20 whitespace-nowrap animate-in fade-in zoom-in-95">
                                        {h.count} visitas <span className="text-amber-400 opacity-80">({i}h)</span>
                                        </div>
                                    )}
                                    
                                    {/* Barra Elegante */}
                                    <div className="w-full max-w-[24px] bg-transparent flex flex-col justify-end h-full">
                                        <div className={`w-full rounded-t-[4px] transition-all duration-[800ms] ease-out group-hover:opacity-100 ${isPico ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : (temaNoturno ? 'bg-white/[0.08] group-hover:bg-white/[0.15]' : 'bg-black/[0.08] group-hover:bg-black/[0.15]')}`} style={{ height: `${height}%`, minHeight: h.count > 0 ? '4px' : '0' }} />
                                    </div>
                                </div>
                            )
                            })}
                        </div>
                        {/* Labels Responsivos e Limpos */}
                        <div className="flex justify-between w-full border-t pt-2 opacity-50 px-1" style={{ borderColor: temaNoturno ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}>
                            {metricas.horasFrequencia.map((_, i) => (
                                <span key={`lbl-${i}`} className={`text-[9px] font-bold w-full text-center ${textSecundario(temaNoturno)}`}>
                                    <span className="md:hidden">{i % 6 === 0 ? `${i}h` : ''}</span>
                                    <span className="hidden md:block lg:hidden">{i % 3 === 0 ? `${i}h` : ''}</span>
                                    <span className="hidden lg:block">{i % 2 === 0 ? `${i}h` : ''}</span>
                                </span>
                            ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* PREFERÊNCIAS DE CONSUMO (Direita - 5 colunas) */}
             <div className={`col-span-1 lg:col-span-5 p-6 md:p-8 rounded-[32px] border flex flex-col min-h-[420px] animate-in slide-in-from-bottom-4 fade-in duration-700 delay-[200ms] ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
                <div className="flex justify-between items-center mb-6 shrink-0">
                   <h3 className={`text-[13px] font-bold uppercase tracking-widest ${textSecundario(temaNoturno)}`}>DNA de Consumo</h3>
                   <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md tracking-wider border ${temaNoturno ? 'bg-white/5 border-white/5 text-zinc-400' : 'bg-black/5 border-black/5 text-zinc-500'}`}>Ranking</span>
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 space-y-5 relative">
                   {metricas.produtos.length === 0 ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30">
                        <svg className="w-8 h-8 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="text-[11px] font-bold uppercase tracking-widest">Sem Histórico de Itens</p>
                     </div>
                   ) : (
                     metricas.produtos.slice(0, 10).map((p, idx) => {
                       const barWidth = `${(p.qtd / metricas.maxProdutoQtd) * 100}%`;
                       
                       // Assimetria visual baseada na posição do ranking
                       const isTop1 = idx === 0;
                       const isTop3 = idx > 0 && idx < 3;
                       
                       return (
                         <div key={idx} className="flex flex-col gap-1.5 w-full group">
                           <div className="flex justify-between items-end gap-3 w-full">
                              <span className={`font-bold tracking-tight truncate flex-1 ${isTop1 ? `text-[15px] ${textPrincipal(temaNoturno)}` : isTop3 ? `text-[13px] ${textPrincipal(temaNoturno)}` : `text-[12px] opacity-70 ${textSecundario(temaNoturno)}`}`}>
                                <span className={isTop1 ? (temaNoturno ? 'text-emerald-400 mr-1' : 'text-emerald-600 mr-1') : 'opacity-40 mr-1'}>{idx + 1}.</span> 
                                {p.nome}
                              </span>
                              <div className="flex items-baseline gap-2 shrink-0">
                                <span className={`text-[10px] font-black ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>{p.percent.toFixed(1)}%</span>
                                <span className={`font-black ${isTop1 ? `text-[16px] ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}` : isTop3 ? `text-[14px] ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}` : `text-[12px] ${textSecundario(temaNoturno)}`}`}>{p.qtd}x</span>
                              </div>
                           </div>
                           
                           {/* Linha de proporção assinada */}
                           <div className={`w-full rounded-full overflow-hidden ${isTop1 ? 'h-2' : isTop3 ? 'h-1.5' : 'h-1 opacity-50'} ${temaNoturno ? 'bg-white/5' : 'bg-black/5'}`}>
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out origin-left ${isTop1 ? 'bg-emerald-500' : isTop3 ? (temaNoturno ? 'bg-zinc-400' : 'bg-zinc-600') : (temaNoturno ? 'bg-zinc-700' : 'bg-zinc-300')}`} 
                                style={{ width: barWidth }} 
                              />
                           </div>
                         </div>
                       );
                     })
                   )}
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};