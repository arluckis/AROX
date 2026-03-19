'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';

const CORES_VIBRANTES = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6', '#84cc16'];

export default function TabFaturamento({
  temaNoturno, filtroTempo, setFiltroTempo, getHoje, getMesAtual, getAnoAtual,
  faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos, comandasFiltradas, comandas
}) {

  const [mostrarMenuPersonalizar, setMostrarMenuPersonalizar] = useState(false);
  const [mostrarFiltroPeriodo, setMostrarFiltroPeriodo] = useState(true);
  
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

  // --- NOVA LÓGICA DE NAVEGAÇÃO NO TEMPO ---
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
  // -----------------------------------------

  const totalComandas = comandasFiltradas.length;
  const ticketMedio = totalComandas > 0 ? (faturamentoTotal / totalComandas) : 0;
  const rankingMaiusculo = rankingProdutos.map(p => ({ ...p, nome: p.nome.toUpperCase() }));

  const { mediaHistorica, diffAbsoluta, percentualReal, percentualBarra, bateuMeta, semHistorico } = useMemo(() => {
    if (!comandas || comandas.length === 0) return { semHistorico: true };

    let pastStart = null;
    let pastEnd = null;

    if (filtroTempo.tipo === 'dia') {
       let d = new Date(filtroTempo.valor + 'T12:00:00');
       d.setDate(d.getDate() - 7); 
       pastStart = d.toISOString().split('T')[0];
       pastEnd = pastStart;
    } else if (filtroTempo.tipo === '7 dias') {
       let end = new Date(getHoje() + 'T12:00:00');
       end.setDate(end.getDate() - 7);
       let start = new Date(end.getTime());
       start.setDate(start.getDate() - 6);
       pastStart = start.toISOString().split('T')[0];
       pastEnd = end.toISOString().split('T')[0];
    } else if (filtroTempo.tipo === 'mes') {
       const [ano, mes] = filtroTempo.valor.split('-');
       let prevMes = parseInt(mes) - 1; let prevAno = parseInt(ano);
       if (prevMes === 0) { prevMes = 12; prevAno--; }
       pastStart = `${prevAno}-${String(prevMes).padStart(2, '0')}-01`;
       pastEnd = `${prevAno}-${String(prevMes).padStart(2, '0')}-31`; 
    } else if (filtroTempo.tipo === 'ano') {
       pastStart = `${parseInt(filtroTempo.valor) - 1}-01-01`;
       pastEnd = `${parseInt(filtroTempo.valor) - 1}-12-31`;
    }  else if (filtroTempo.tipo === 'periodo') {
       // Trava de segurança: se faltar alguma data, cancela o cálculo temporariamente
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
    const diferenca = Math.abs(faturamentoTotal - media);
    const bateu = faturamentoTotal >= media && faturamentoTotal > 0;

    return { mediaHistorica: media, diffAbsoluta: diferenca, percentualReal: pctReal, percentualBarra: pctBarra, bateuMeta: bateu, semHistorico: false };
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

  const numCardsResumo = [widgets.bruto, widgets.lucro, widgets.ticket].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500 px-2 lg:px-0 pb-10">
      
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* BARRA LATERAL ESQUERDA (DESKTOP) E MENU TOPO (MOBILE) PARA WIDGETS */}
        <div className="shrink-0 lg:w-64 flex flex-col gap-4">
           
           <div className={`hidden lg:flex p-5 rounded-3xl shadow-sm border h-fit flex-col ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-center cursor-pointer mb-2" onClick={() => setMostrarFiltroPeriodo(!mostrarFiltroPeriodo)}>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Filtro de Período</span>
                 <span className={`text-sm font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{mostrarFiltroPeriodo ? '▲' : '▼'}</span>
              </div>
              
              {mostrarFiltroPeriodo && (
                <div className="flex flex-col gap-3 mt-3 animate-in slide-in-from-top-2">
                  <div className={`flex flex-col p-1 rounded-xl border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    {['dia', '7 dias', 'mes', 'ano', 'periodo'].map(t => (
                      <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} 
                      className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full mt-1">
                    {(filtroTempo.tipo === 'dia' || filtroTempo.tipo === 'mes') && (
                      <div className="flex items-center gap-1 w-full">
                        <button onClick={() => mudarTempo(-1)} title="Anterior" className={`p-2 rounded-xl border flex-shrink-0 flex items-center justify-center transition ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <input 
                          type={filtroTempo.tipo === 'dia' ? 'date' : 'month'} 
                          value={filtroTempo.valor} 
                          max={filtroTempo.tipo === 'dia' ? getHoje() : getMesAtual()}
                          onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} 
                          className={`flex-1 min-w-0 px-2 py-2 border rounded-xl outline-none text-xs font-bold focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} 
                        />
                        {podeAvancar() ? (
                          <button onClick={() => mudarTempo(1)} title="Seguinte" className={`p-2 rounded-xl border flex-shrink-0 flex items-center justify-center transition ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                          </button>
                        ) : (
                          <div className="w-[34px]"></div>
                        )}
                      </div>
                    )}
                    {filtroTempo.tipo === 'ano' && <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`px-3 py-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} />}
                    {filtroTempo.tipo === 'periodo' && (
                      <div className="flex flex-col gap-2">
                        <input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`px-3 py-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} />
                        <span className={`text-center font-bold text-[10px] uppercase ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>até</span>
                        <input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`px-3 py-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                    )}
                  </div>
                </div>
              )}
           </div>

           <div className={`p-4 lg:p-5 rounded-2xl lg:rounded-3xl shadow-sm border h-fit ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setMostrarMenuPersonalizar(!mostrarMenuPersonalizar)}>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Visuais do Painel</span>
                 <span className={`text-sm font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{mostrarMenuPersonalizar ? '▲' : '▼'}</span>
              </div>
              
              {mostrarMenuPersonalizar && (
                <div className="flex flex-col gap-3 mt-4 animate-in slide-in-from-top-2">
                  {[
                    { id: 'bruto', label: 'Fat. Bruto' }, { id: 'lucro', label: 'Lucro Bruto' }, { id: 'ticket', label: 'Ticket Médio' }, { id: 'termometro', label: 'Termômetro' }, 
                    { id: 'pagamentos', label: 'Pagamentos' }, { id: 'produtos', label: 'Rentabilidade' }, { id: 'mapaCalor', label: 'Mapa Calor' }, { id: 'combo', label: 'Cesta Média' }
                  ].map(item => (
                    <label key={item.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${temaNoturno ? 'bg-gray-900 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-purple-50'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
                      <input type="checkbox" checked={widgets[item.id]} onChange={() => toggleWidget(item.id)} className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500" />
                    </label>
                  ))}
                </div>
              )}
           </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          
          {/* HEADER DOS FILTROS MAIS COMPACTO NO MOBILE */}
          <div className={`lg:hidden p-3 rounded-2xl shadow-sm border mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className={`flex p-1 rounded-xl w-full sm:w-auto border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              {['dia', '7 dias', 'mes', 'ano', 'periodo'].map(t => (
                 <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} 
                 className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>
                   {t}
                 </button>
              ))}
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {(filtroTempo.tipo === 'dia' || filtroTempo.tipo === 'mes') && (
                <div className="flex items-center gap-1 w-full">
                  <button onClick={() => mudarTempo(-1)} title="Anterior" className={`p-2 rounded-xl border flex-shrink-0 flex items-center justify-center transition ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <input 
                    type={filtroTempo.tipo === 'dia' ? 'date' : 'month'} 
                    value={filtroTempo.valor} 
                    max={filtroTempo.tipo === 'dia' ? getHoje() : getMesAtual()}
                    onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} 
                    className={`flex-1 min-w-0 px-2 py-1.5 border rounded-xl outline-none text-xs font-bold focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} 
                  />
                  {podeAvancar() ? (
                    <button onClick={() => mudarTempo(1)} title="Seguinte" className={`p-2 rounded-xl border flex-shrink-0 flex items-center justify-center transition ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  ) : (
                    <div className="w-[34px]"></div>
                  )}
                </div>
              )}
              {filtroTempo.tipo === 'ano' && <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`px-3 py-1.5 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} />}
              {filtroTempo.tipo === 'periodo' && (
                <><input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`px-3 py-1.5 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} /><span className={`self-center font-bold text-xs ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>até</span><input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`px-3 py-1.5 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200'}`} /></>
              )}
            </div>
          </div>

          {numCardsResumo > 0 && (
            <div className={`grid grid-cols-1 md:grid-cols-${numCardsResumo} gap-4 mb-4`}>
              {widgets.bruto && (
                <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-50 bg-purple-500/10"></div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Faturamento Bruto</h3>
                  <p className={`text-3xl md:text-4xl font-black tracking-tight relative z-10 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>R$ {faturamentoTotal.toFixed(2)}</p>
                </div>
              )}
              {widgets.lucro && (
                <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-50 bg-green-500/10"></div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Lucro Bruto Estimado</h3>
                  <p className="text-3xl md:text-4xl font-black tracking-tight relative z-10 text-green-500">R$ {lucroEstimado.toFixed(2)}</p>
                </div>
              )}
              {widgets.ticket && (
                <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-50 bg-cyan-500/10"></div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Ticket Médio</h3>
                  <div className="relative z-10 flex items-end gap-2">
                    <p className="text-3xl md:text-4xl font-black tracking-tight text-cyan-500">R$ {ticketMedio.toFixed(2)}</p>
                    <p className={`text-xs font-bold mb-1 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>/ {totalComandas} cmd</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            
            {widgets.termometro && (
              <div className={`p-6 rounded-3xl shadow-sm border flex flex-col items-center justify-between h-[300px] relative ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm w-full font-black uppercase tracking-widest mb-4 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Performance de Vendas</h3>
                
                {semHistorico ? (
                  <div className="my-auto flex flex-col items-center justify-center text-center px-4">
                    <span className="text-4xl mb-4 opacity-50 grayscale">📊</span>
                    <p className={`text-sm font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>Sem Comparação</p>
                    <p className={`text-[10px] font-bold mt-2 leading-relaxed uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>
                      Não há comandas registradas no <br/>período passado correspondente.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 w-full flex flex-col justify-center px-1">
                     <div className="flex justify-between items-end mb-2">
                       <span className={`text-5xl font-black transition-colors duration-500 ${bateuMeta ? 'text-green-500' : (temaNoturno ? 'text-white' : 'text-gray-800')}`}>
                          {percentualReal.toFixed(0)}%
                       </span>
                       <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>da Meta Base</span>
                     </div>
                     
                     <div className={`w-full h-4 rounded-full overflow-hidden relative ${temaNoturno ? 'bg-gray-900' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${bateuMeta ? 'bg-green-500' : 'bg-purple-500'}`} 
                          style={{ width: `${percentualBarra}%` }}>
                        </div>
                     </div>
                     
                     <div className={`mt-8 p-4 rounded-2xl border flex items-center justify-between transition-colors ${bateuMeta ? (temaNoturno ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200') : (temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200')}`}>
                        <div className="flex items-center gap-3">
                           <span className="text-2xl">{bateuMeta ? '📈' : '📉'}</span>
                           <div className="flex flex-col">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${bateuMeta ? 'text-green-600' : (temaNoturno ? 'text-gray-500' : 'text-gray-500')}`}>
                                 {bateuMeta ? 'Meta Atingida' : 'Abaixo da Média'}
                              </span>
                              <span className={`text-sm font-bold mt-0.5 ${bateuMeta ? 'text-green-500' : (temaNoturno ? 'text-gray-400' : 'text-gray-700')}`}>
                                 {bateuMeta ? `+ R$ ${diffAbsoluta.toFixed(2)} acima` : `Faltam R$ ${diffAbsoluta.toFixed(2)}`}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            )}

            {widgets.pagamentos && (
              <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[300px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-black uppercase mb-2 text-center tracking-widest ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Formas de Pagamento</h3>
                {dadosPizza.length > 0 ? (
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosPizza} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                          {dadosPizza.map((e, i) => <Cell key={i} fill={CORES_VIBRANTES[i % CORES_VIBRANTES.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(val) => `R$ ${val.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: temaNoturno ? '#1f2937' : '#ffffff', color: temaNoturno ? '#ffffff' : '#000000', fontWeight: 'bold' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: temaNoturno ? '#e5e7eb' : '#374151' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className={`flex-1 flex items-center justify-center text-xs font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem dados</div>
                )}
              </div>
            )}

            {widgets.produtos && (
              <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[300px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-black uppercase mb-2 text-center tracking-widest ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Produtos Mais Rentáveis</h3>
                {rankingMaiusculo.length > 0 ? (
                  <div className="flex-1 w-full overflow-y-auto pr-2 scrollbar-hide">
                    <div style={{ height: Math.max(200, rankingMaiusculo.length * 40) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankingMaiusculo} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 'bold'}} width={120} />
                          <RechartsTooltip 
                            cursor={{fill: temaNoturno ? '#374151' : '#f3f4f6'}} 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className={`p-4 shadow-xl rounded-2xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <p className={`text-xs font-black mb-1 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>{data.nome}</p>
                                    <p className="text-sm font-bold text-green-500">Receita: R$ {data.valor.toFixed(2)}</p>
                                    <p className={`text-[10px] font-bold uppercase mt-2 border-t pt-1 ${temaNoturno ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                                      {data.isPeso ? `Volume: ${(data.volume / 1000).toFixed(3)} kg` : `Vendidos: ${data.volume} unid.`}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', formatter: (val) => `R$ ${val.toFixed(2)}`, fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 'bold' }}>
                            {rankingMaiusculo.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CORES_VIBRANTES[index % CORES_VIBRANTES.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className={`flex-1 flex items-center justify-center text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem vendas no período</div>
                )}
              </div>
            )}
            
            {widgets.mapaCalor && (
              <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[300px] overflow-hidden ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Mapa de Calor (Pico)
                </h3>
                {maxCalor > 0 ? (
                  <div className="flex-1 w-full overflow-x-auto scrollbar-hide flex flex-col justify-center">
                    <div className="min-w-[400px]">
                      <div className="grid grid-cols-8 gap-1 mb-2 text-[10px] font-bold text-center uppercase tracking-widest text-gray-400">
                        <div></div>
                        {mapaCalor.horasVisiveis.map(h => <div key={h}>{h}h</div>)}
                      </div>
                      {mapaCalor.diasSemana.map((dia, idx) => (
                        <div key={dia} className="grid grid-cols-8 gap-0.5 mb-0.5">
                          <div className={`flex items-center text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{dia}</div>
                          {mapaCalor.horasVisiveis.map(h => {
                            const qtd = mapaCalor.matriz[idx][h];
                            const intensidade = qtd === 0 ? 0 : Math.max(0.15, qtd / maxCalor);
                            return (
                              <div 
                                key={`${dia}-${h}`} title={`${qtd} comandas criadas às ${h}h`}
                                className={`h-6 rounded-md transition-all cursor-crosshair ${temaNoturno ? '' : 'border border-gray-50'}`}
                                style={{ backgroundColor: qtd > 0 ? `rgba(147, 51, 234, ${intensidade})` : (temaNoturno ? '#374151' : '#f9fafb') }}
                              ></div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className={`flex-1 flex items-center justify-center text-xs font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Dados insuficientes.</div>}
              </div>
            )}

          </div>

          {widgets.combo && (
            <div className={`p-6 rounded-3xl shadow-sm border flex flex-col mb-4 min-h-[200px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-black uppercase mb-4 tracking-widest flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Análise de Cesta (Cross-Sell)
              </h3>
              {topCombos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {topCombos.map((combo, idx) => {
                    const [p1, p2] = combo.nome.split(' + ');
                    return (
                      <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-black uppercase ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{p1}</span>
                          <span className={`text-[10px] font-bold mt-0.5 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>+ {p2}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${temaNoturno ? 'bg-gray-800 text-purple-400 border border-gray-700' : 'bg-white text-purple-700 border border-purple-100'}`}>{combo.qtd}x</span>
                      </div>
                    );
                  })}
                </div>
              ) : <div className={`flex-1 flex items-center justify-center text-xs font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Faça vendas combinadas para análise.</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}