'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';

const CORES_VIBRANTES = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6', '#84cc16'];

export default function TabFaturamento({
  temaNoturno, filtroTempo, setFiltroTempo, getHoje, getMesAtual, getAnoAtual,
  faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos, comandasFiltradas, comandas
}) {

  const [mostrarMenuPersonalizar, setMostrarMenuPersonalizar] = useState(false);
  
  const [widgets, setWidgets] = useState({
    bruto: true, lucro: true, ticket: true, termometro: true, pagamentos: true, produtos: true, mapaCalor: true, combo: true 
  }); 

  useEffect(() => {
    const widgetsSalvos = localStorage.getItem('bessa_widgets_faturamento_v5');
    if (widgetsSalvos) setWidgets(JSON.parse(widgetsSalvos));
  }, []);

  const toggleWidget = (chave) => {
    const novosWidgets = { ...widgets, [chave]: !widgets[chave] };
    setWidgets(novosWidgets);
    localStorage.setItem('bessa_widgets_faturamento_v5', JSON.stringify(novosWidgets));
  };

  const mudarTempo = (direcao) => {
    if (filtroTempo.tipo === 'dia') {
      const [ano, mes, dia] = filtroTempo.valor.split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      dataObj.setDate(dataObj.getDate() + direcao);
      
      const anoNovo = dataObj.getFullYear();
      const mesNovo = String(dataObj.getMonth() + 1).padStart(2, '0');
      const diaNovo = String(dataObj.getDate()).padStart(2, '0');
      
      setFiltroTempo({ ...filtroTempo, valor: `${anoNovo}-${mesNovo}-${diaNovo}` });
      
    } else if (filtroTempo.tipo === 'mes') {
      const [ano, mes] = filtroTempo.valor.split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, 1);
      dataObj.setMonth(dataObj.getMonth() + direcao);
      
      const anoNovo = dataObj.getFullYear();
      const mesNovo = String(dataObj.getMonth() + 1).padStart(2, '0');
      
      setFiltroTempo({ ...filtroTempo, valor: `${anoNovo}-${mesNovo}` });
    }
  };

  const podeAvancar = () => {
    if (filtroTempo.tipo === 'dia') return filtroTempo.valor < getHoje();
    if (filtroTempo.tipo === 'mes') return filtroTempo.valor < getMesAtual();
    return false; 
  };

  const totalComandas = comandasFiltradas.length;
  const ticketMedio = totalComandas > 0 ? (faturamentoTotal / totalComandas) : 0;
  
  const rankingMaiusculo = rankingProdutos.map(p => ({ 
    ...p, 
    nome: p.nome.toUpperCase(),
    custo: Math.max(0, p.valor - (p.lucro || 0)),
    lucro: p.lucro || 0
  }));

  const { mediaHistorica, diffAbsoluta, percentualReal, percentualBarra, bateuMeta, semHistorico, textoComparacao } = useMemo(() => {
    if (!comandas || comandas.length === 0) return { semHistorico: true };

    let pastStart = null;
    let pastEnd = null;
    let textoComp = "Vs. Passado";

    if (filtroTempo.tipo === 'dia') {
       let d = new Date(filtroTempo.valor + 'T12:00:00');
       d.setDate(d.getDate() - 7); 
       pastStart = d.toISOString().split('T')[0];
       pastEnd = pastStart;
       textoComp = "Vs. mesmo dia da sem. passada";
    } else if (filtroTempo.tipo === '7 dias') {
       let end = new Date(getHoje() + 'T12:00:00');
       end.setDate(end.getDate() - 7);
       let start = new Date(end.getTime());
       start.setDate(start.getDate() - 6);
       pastStart = start.toISOString().split('T')[0];
       pastEnd = end.toISOString().split('T')[0];
       textoComp = "Vs. 7 dias anteriores";
    } else if (filtroTempo.tipo === 'mes') {
       const [ano, mes] = filtroTempo.valor.split('-');
       let prevMes = parseInt(mes) - 1; let prevAno = parseInt(ano);
       if (prevMes === 0) { prevMes = 12; prevAno--; }
       pastStart = `${prevAno}-${String(prevMes).padStart(2, '0')}-01`;
       pastEnd = `${prevAno}-${String(prevMes).padStart(2, '0')}-31`; 
       textoComp = "Vs. mês anterior";
    } else if (filtroTempo.tipo === 'ano') {
       pastStart = `${parseInt(filtroTempo.valor) - 1}-01-01`;
       pastEnd = `${parseInt(filtroTempo.valor) - 1}-12-31`;
       textoComp = "Vs. ano anterior";
    }  else if (filtroTempo.tipo === 'periodo') {
       if (!filtroTempo.inicio || !filtroTempo.fim) return { semHistorico: true };

       const start = new Date(filtroTempo.inicio + 'T12:00:00');
       const end = new Date(filtroTempo.fim + 'T12:00:00');
       const diffTime = Math.abs(end - start);
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       
       let pEnd = new Date(start.getTime());
       pEnd.setDate(pEnd.getDate() - 1);
       let pStart = new Date(pEnd.getTime());
       pStart.setDate(pStart.getDate() - diffDays);
       
       pastStart = pStart.toISOString().split('T')[0];
       pastEnd = pEnd.toISOString().split('T')[0];
       textoComp = "Vs. período anterior equiv.";
    }

    const temDadosPassados = comandas.some(c => c.data >= pastStart && c.data <= pastEnd);
    
    if (!temDadosPassados || !pastStart) {
       return { semHistorico: true };
    }

    let somaPassada = 0;
    comandas.forEach(c => {
       if (c.data >= pastStart && c.data <= pastEnd) {
          somaPassada += (c.produtos || []).reduce((acc, p) => acc + p.preco, 0);
       }
    });

    const media = somaPassada; 
    const pctReal = media > 0 ? (faturamentoTotal / media) * 100 : (faturamentoTotal > 0 ? 100 : 0);
    const pctBarra = Math.min(pctReal, 100);
    const diferenca = faturamentoTotal - media;
    const bateu = faturamentoTotal >= media && faturamentoTotal > 0;

    return { mediaHistorica: media, diffAbsoluta: Math.abs(diferenca), percentualReal: pctReal, percentualBarra: pctBarra, bateuMeta: bateu, semHistorico: false, textoComparacao: textoComp };
  }, [comandas, filtroTempo.tipo, filtroTempo.valor, filtroTempo.inicio, filtroTempo.fim, getHoje, faturamentoTotal]);

  const { mapaCalor, maxCalor, topCombos } = useMemo(() => {
    const horasVisiveis = [17, 18, 19, 20, 21, 22, 23];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let matriz = Array(7).fill(0).map(() => Array(24).fill(0));
    let localMaxCalor = 0;
    const pares = {};

    comandas.forEach(c => {
      if (c.hora_abertura) {
        const dt = new Date(c.hora_abertura);
        const d = dt.getDay(); const h = dt.getHours();
        if (!isNaN(d) && !isNaN(h)) {
          matriz[d][h]++;
          if(matriz[d][h] > localMaxCalor) localMaxCalor = matriz[d][h];
        }
      }
    });

    comandasFiltradas.forEach(c => {
      if (c.produtos && c.produtos.length > 1 && c.produtos.length < 10) {
        const nomesUnicos = Array.from(new Set(c.produtos.map(p => p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim().toUpperCase())));
        for(let i = 0; i < nomesUnicos.length; i++) {
          for(let j = i + 1; j < nomesUnicos.length; j++) {
            const pair = [nomesUnicos[i], nomesUnicos[j]].sort().join(' + ');
            pares[pair] = (pares[pair] || 0) + 1;
          }
        }
      }
    });

    const combList = Object.entries(pares).map(([nome, qtd]) => ({ nome, qtd })).sort((a,b) => b.qtd - a.qtd).slice(0, 5);
    return { mapaCalor: { matriz, diasSemana, horasVisiveis }, maxCalor: localMaxCalor, topCombos: combList };
  }, [comandas, comandasFiltradas]);

  // Lógica Gamificada Premium para Status de Performance
  let statusPerformance = "";
  let colorPerformance = "";
  let corBarraPremium = "";

  if (!semHistorico) {
    if (percentualReal === 0) {
      statusPerformance = "Aguardando volume de dados para projeção.";
      colorPerformance = temaNoturno ? "text-gray-400" : "text-gray-500";
      corBarraPremium = temaNoturno ? "bg-gray-700" : "bg-gray-300";
    } else if (percentualReal < 25) {
      statusPerformance = "Atividade detectada. Fluxo em crescimento.";
      colorPerformance = "text-sky-500";
      corBarraPremium = "bg-sky-500";
    } else if (percentualReal < 50) {
      statusPerformance = "Consistência operacional estável. Volume em ascensão.";
      colorPerformance = "text-amber-500";
      corBarraPremium = "bg-amber-500";
    } else if (percentualReal < 75) {
      statusPerformance = "Mais da metade do objetivo alcançado. Excelente!";
      colorPerformance = "text-orange-500";
      corBarraPremium = "bg-orange-500";
    } else if (percentualReal < 100) {
      statusPerformance = "Fase de aceleração. Performance acima da média.";
      colorPerformance = "text-emerald-400";
      corBarraPremium = "bg-emerald-400";
    } else {
      statusPerformance = percentualReal >= 150 ? "Resultado acima da projeção." : "Performance superando o histórico.";
      colorPerformance = "text-emerald-500 font-black shadow-emerald-500/50";
      corBarraPremium = "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]";
    }
  }

  const numCardsResumo = [widgets.bruto, widgets.lucro, widgets.ticket].filter(Boolean).length;
  const totalPagamentos = dadosPizza.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* ===== INÍCIO DA ÁREA INTOCÁVEL (TOPO) ===== */}
      <div className={`p-4 md:p-5 rounded-b-2xl shadow-sm border-x border-b border-t-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative transition-colors duration-500 mb-4 md:mb-5 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
         <div className={`absolute top-0 left-5 right-5 border-t border-dashed ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}></div>

         <div className="mt-2 md:mt-0">
            <h2 className={`text-lg md:text-xl font-black uppercase tracking-wide flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
              Resumo Financeiro
            </h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
              Faturamento e Métricas
            </p>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto justify-end">
            <div className={`flex p-1 rounded-xl w-full sm:w-auto border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              {['dia', '7 dias', 'mes', 'ano', 'periodo'].map(t => (
                 <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} 
                 className={`flex-1 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all duration-300 ${filtroTempo.tipo === t ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-transparent' : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>
                   {t}
                 </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in zoom-in-95 duration-300">
              {(filtroTempo.tipo === 'dia' || filtroTempo.tipo === 'mes') && (
                <>
                  <button onClick={() => mudarTempo(-1)} title="Anterior" className={`p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center transition-all active:scale-95 ${temaNoturno ? 'bg-gray-900 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <input 
                    type={filtroTempo.tipo === 'dia' ? 'date' : 'month'} 
                    value={filtroTempo.valor} 
                    max={filtroTempo.tipo === 'dia' ? getHoje() : getMesAtual()}
                    onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} 
                    className={`w-full md:w-36 px-2 py-2.5 text-center border rounded-xl outline-none text-[11px] font-bold transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
                  />
                  {podeAvancar() ? (
                    <button onClick={() => mudarTempo(1)} title="Seguinte" className={`p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center transition-all active:scale-95 ${temaNoturno ? 'bg-gray-900 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  ) : (
                    <div className="w-[38px]"></div>
                  )}
                </>
              )}
              {filtroTempo.tipo === 'ano' && (
                <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`w-full md:w-28 px-2 py-2.5 text-center border rounded-xl outline-none text-[11px] font-bold transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} />
              )}
              {filtroTempo.tipo === 'periodo' && (
                <div className={`flex items-center gap-2 px-2 py-2 rounded-xl border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`bg-transparent outline-none text-[10px] font-bold w-full ${temaNoturno ? 'text-white [color-scheme:dark]' : 'text-gray-700'}`} />
                  <span className={`font-bold text-[9px] uppercase ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>até</span>
                  <input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`bg-transparent outline-none text-[10px] font-bold w-full ${temaNoturno ? 'text-white [color-scheme:dark]' : 'text-gray-700'}`} />
                </div>
              )}
            </div>

            <button 
              onClick={() => setMostrarMenuPersonalizar(!mostrarMenuPersonalizar)} 
              title="Personalizar Painel"
              className={`p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center transition-all active:scale-95 ${temaNoturno ? (mostrarMenuPersonalizar ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-900 border-gray-700 hover:bg-gray-700 text-gray-300') : (mostrarMenuPersonalizar ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600')}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </button>
         </div>
      </div>
      {/* ===== FIM DA ÁREA INTOCÁVEL (TOPO) ===== */}

      {mostrarMenuPersonalizar && (
        <div className={`p-3 rounded-2xl border mb-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${temaNoturno ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200 backdrop-blur-md'}`}>
          {[
            { id: 'bruto', label: 'Fat. Bruto' }, { id: 'lucro', label: 'Lucro Bruto' }, { id: 'ticket', label: 'Ticket Médio' }, { id: 'termometro', label: 'Termômetro' }, 
            { id: 'pagamentos', label: 'Pagamentos' }, { id: 'produtos', label: 'Rentabilidade' }, { id: 'mapaCalor', label: 'Mapa Calor' }, { id: 'combo', label: 'Cesta Média' }
          ].map(item => (
            <label key={item.id} className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer transition-all select-none ${widgets[item.id] ? (temaNoturno ? 'bg-purple-600/20 border-purple-500/50 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm') : (temaNoturno ? 'bg-gray-900 border-gray-700 hover:bg-gray-800 text-gray-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-400')}`}>
              <input type="checkbox" checked={widgets[item.id]} onChange={() => toggleWidget(item.id)} className="hidden" />
              <div className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm flex-shrink-0 border flex items-center justify-center transition-colors ${widgets[item.id] ? 'bg-purple-500 border-purple-500' : (temaNoturno ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white')}`}>
                  {widgets[item.id] && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-center">{item.label}</span>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* ÁREA DE MÉTRICAS */}
      <div className="flex flex-col w-full min-w-0 gap-3">
        
        {/* LINHA 1 */}
        {numCardsResumo > 0 && (
          <div className={`grid grid-cols-3 gap-2 md:gap-4`}>
            {widgets.bruto && (
              <div className={`p-3 md:p-5 rounded-[1.25rem] border relative overflow-hidden group ${temaNoturno ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 bg-purple-500 blur-2xl group-hover:opacity-40 transition-opacity"></div>
                <div className="flex items-center gap-1.5 mb-1.5 md:mb-2 relative z-10">
                  <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <h3 className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Fat. Bruto</h3>
                </div>
                <p className={`text-sm md:text-2xl font-black tracking-tighter relative z-10 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>R$ {faturamentoTotal.toFixed(2)}</p>
              </div>
            )}
            {widgets.lucro && (
              <div className={`p-3 md:p-5 rounded-[1.25rem] border relative overflow-hidden group ${temaNoturno ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 bg-emerald-500 blur-2xl group-hover:opacity-40 transition-opacity"></div>
                <div className="flex items-center gap-1.5 mb-1.5 md:mb-2 relative z-10">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  <h3 className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Lucro Est.</h3>
                </div>
                <p className="text-sm md:text-2xl font-black tracking-tighter relative z-10 text-emerald-500">R$ {lucroEstimado.toFixed(2)}</p>
              </div>
            )}
            {widgets.ticket && (
              <div className={`p-3 md:p-5 rounded-[1.25rem] border relative overflow-hidden group ${temaNoturno ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 bg-cyan-500 blur-2xl group-hover:opacity-40 transition-opacity"></div>
                <div className="flex items-center gap-1.5 mb-1.5 md:mb-2 relative z-10">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                  <h3 className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Ticket Médio</h3>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-baseline md:gap-1.5">
                  <p className="text-sm md:text-2xl font-black tracking-tighter text-cyan-500">R$ {ticketMedio.toFixed(2)}</p>
                  <p className={`text-[8px] md:text-[10px] font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>/ {totalComandas} cmd</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* LINHA 2: Termômetro, Pagamentos e Mapa de Calor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          
          {widgets.termometro && (
            <div className={`p-4 md:p-5 rounded-[1.25rem] border flex flex-col justify-center h-[240px] relative overflow-hidden ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                <svg className={`w-4 h-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Performance
              </h3>
              
              {semHistorico ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${temaNoturno ? 'bg-gray-900 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Sem Base de Comparação</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center">
                   <div className="flex justify-between items-end mb-1">
                     <span className={`text-4xl font-black tracking-tighter ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                        {percentualReal.toFixed(0)}%
                     </span>
                     <span className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>{textoComparacao}</span>
                   </div>
                   
                   {/* Barra Premium Listrada CSS */}
                   <div className={`w-full h-3 rounded-full overflow-hidden relative mb-4 shadow-inner ${temaNoturno ? 'bg-gray-900' : 'bg-gray-100'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${corBarraPremium}`} 
                        style={{ 
                          width: `${percentualBarra}%`,
                          backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                          backgroundSize: '1rem 1rem'
                        }}>
                      </div>
                   </div>
                   
                   <div className={`p-3 rounded-xl border flex items-center justify-between ${temaNoturno ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex flex-col">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Status</span>
                          <span className={`text-[11px] font-bold mt-0.5 ${colorPerformance}`}>{statusPerformance}</span>
                      </div>
                      <div className="flex flex-col text-right">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Diferença</span>
                          <span className={`text-[11px] font-bold mt-0.5 ${bateuMeta ? 'text-emerald-500' : 'text-gray-500'}`}>
                              {bateuMeta ? `+ R$ ${diffAbsoluta.toFixed(2)}` : `- R$ ${diffAbsoluta.toFixed(2)}`}
                          </span>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {widgets.pagamentos && (
            <div className={`p-4 md:p-5 rounded-[1.25rem] border flex flex-col h-[240px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                <svg className={`w-4 h-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                Pagamentos
              </h3>
              
              {dadosPizza.length > 0 ? (
                <div className="flex-1 w-full overflow-y-auto pr-2 scrollbar-hide flex flex-col justify-start gap-3">
                  {dadosPizza.sort((a,b) => b.value - a.value).map((item, idx) => {
                    const percent = ((item.value / totalPagamentos) * 100).toFixed(1);
                    const isFidelidade = item.name === 'Fidelidade';
                    return (
                      <div key={idx} className="flex flex-col">
                        <div className="flex justify-between items-end mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest truncate max-w-[80px] ${isFidelidade ? 'text-purple-500' : (temaNoturno ? 'text-gray-300' : 'text-gray-700')}`} title={item.name}>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                             <span className={`text-[10px] font-black ${isFidelidade ? 'text-purple-500' : (temaNoturno ? 'text-white' : 'text-gray-900')}`}>R$ {item.value.toFixed(0)}</span>
                             <span className={`text-[9px] font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>({percent}%)</span>
                          </div>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${temaNoturno ? 'bg-gray-900' : 'bg-gray-100'}`}>
                          <div className={`h-full rounded-full transition-all duration-700 ${isFidelidade ? 'bg-purple-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`flex-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem recebimentos</div>
              )}
            </div>
          )}

         {widgets.mapaCalor && (
            <div className={`p-4 md:p-5 rounded-[1.25rem] border flex flex-col h-[240px] overflow-hidden ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 shrink-0 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                <svg className={`w-4 h-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Picos de Venda
              </h3>
              {maxCalor > 0 ? (
                <div className="flex-1 w-full overflow-x-auto scrollbar-hide flex flex-col justify-center">
                  <div className="min-w-[240px] mx-auto">
                    <div className="grid grid-cols-8 gap-[3px] mb-[3px] text-[8px] font-black text-center uppercase tracking-widest text-gray-400">
                      <div></div>
                      {mapaCalor.horasVisiveis.map(h => <div key={h}>{h}h</div>)}
                    </div>
                    {mapaCalor.diasSemana.map((dia, idx) => (
                      <div key={dia} className="grid grid-cols-8 gap-[3px] mb-[3px] items-center">
                        <div className={`flex items-center text-[8px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{dia}</div>
                        {mapaCalor.horasVisiveis.map(h => {
                          const qtd = mapaCalor.matriz[idx][h];
                          const intensidade = qtd === 0 ? 0 : Math.max(0.15, qtd / maxCalor);
                          return (
                            <div 
                              key={`${dia}-${h}`} title={`${qtd} comandas às ${h}h`}
                              className={`h-[18px] sm:h-[22px] rounded-[4px] transition-all cursor-crosshair border ${temaNoturno ? 'border-gray-800' : 'border-white'}`}
                              style={{ backgroundColor: qtd > 0 ? `rgba(168, 85, 247, ${intensidade})` : (temaNoturno ? '#1f2937' : '#f3f4f6') }}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className={`flex-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Dados insuficientes</div>}
            </div>
          )}

        </div>

        {/* LINHA 3: Produtos Rentáveis e Análise de Cesta */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-2">
          
          {widgets.produtos && (
            <div className={`lg:col-span-2 p-4 md:p-5 rounded-[1.25rem] border flex flex-col h-[280px] relative ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                  <svg className={`w-4 h-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                  Rentabilidade (Lucro vs Custo)
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span><span className={`text-[8px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>Lucro</span></div>
                  <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-sm ${temaNoturno ? 'bg-gray-600' : 'bg-gray-300'}`}></span><span className={`text-[8px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Custo</span></div>
                </div>
              </div>
              
              {rankingMaiusculo.length > 0 ? (
                <div className="flex-1 w-full overflow-y-auto pr-1 scrollbar-hide relative">
                  <div style={{ height: Math.max(200, rankingMaiusculo.length * 35) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rankingMaiusculo} layout="vertical" margin={{ top: 0, right: 20, left: -25, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 9, fontWeight: '900'}} width={120} />
                        <RechartsTooltip 
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperStyle={{ zIndex: 1000 }}
                          cursor={{fill: temaNoturno ? '#37415150' : '#f3f4f680', radius: 8}} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className={`p-3 shadow-2xl rounded-xl border backdrop-blur-md ${temaNoturno ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                                  <p className={`text-[10px] font-black uppercase mb-1.5 border-b pb-1 ${temaNoturno ? 'text-white border-gray-700' : 'text-gray-900 border-gray-100'}`}>{data.nome}</p>
                                  <p className="text-[10px] font-bold text-emerald-500 flex justify-between gap-4"><span>Lucro:</span> <span>R$ {data.lucro.toFixed(2)}</span></p>
                                  <p className={`text-[10px] font-bold flex justify-between gap-4 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}><span>Custo:</span> <span>R$ {data.custo.toFixed(2)}</span></p>
                                  <p className={`text-[10px] font-black mt-1 flex justify-between gap-4 ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}><span>Receita Total:</span> <span>R$ {data.valor.toFixed(2)}</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="custo" stackId="a" fill={temaNoturno ? '#4b5563' : '#d1d5db'} radius={[0, 0, 0, 0]} barSize={16} />
                        <Bar dataKey="lucro" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className={`flex-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem vendas no período</div>
              )}
            </div>
          )}

          {widgets.combo && (
            <div className={`p-4 md:p-5 rounded-[1.25rem] border flex flex-col h-[280px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center justify-between ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                <div className="flex items-center gap-1.5">
                  <svg className={`w-4 h-4 text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  Cesta Média
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${temaNoturno ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>Venda Casada</span>
              </h3>
              
              {topCombos.length > 0 ? (
                <div className="flex-1 w-full overflow-y-auto pr-1 scrollbar-hide flex flex-col gap-2">
                  {topCombos.map((combo, idx) => {
                    const [p1, p2] = combo.nome.split(' + ');
                    return (
                      <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-md group ${temaNoturno ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 hover:border-purple-500/50' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-sm hover:border-purple-300'}`}>
                        <div className="flex flex-col gap-1 w-full pr-2">
                          <span className={`text-[10px] font-black uppercase line-clamp-1 ${temaNoturno ? 'text-white' : 'text-gray-900'}`} title={p1}>{p1}</span>
                          <span className={`text-[9px] font-bold flex items-center gap-1.5 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                            <span className="line-clamp-1" title={p2}>{p2}</span>
                          </span>
                        </div>
                        <div className={`flex flex-col items-center justify-center min-w-[36px] h-[36px] rounded-lg border shadow-sm transition-colors ${temaNoturno ? 'bg-purple-900/40 border-purple-500/30 text-purple-300 group-hover:bg-purple-600 group-hover:text-white' : 'bg-purple-50 border-purple-200 text-purple-700 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600'}`}>
                          <span className="text-[11px] font-black">{combo.qtd}x</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className={`flex-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-center px-4 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Incentive vendas combinadas para obter a análise.</div>}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}