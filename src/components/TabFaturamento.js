'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';

const CORES_VIBRANTES = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#0ea5e9', '#f97316', '#14b8a6', '#84cc16', 
  '#d946ef', '#059669'
];

export default function TabFaturamento({
  temaNoturno, filtroTempo, setFiltroTempo, getHoje, getMesAtual, getAnoAtual,
  faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos, comandasFiltradas,
  comandas
}) {

  const [mostrarMenuPersonalizar, setMostrarMenuPersonalizar] = useState(false);
  const [widgets, setWidgets] = useState({
    bruto: true, lucro: true, ticket: true,
    termometro: true, pagamentos: true, produtos: true
  }); 

  useEffect(() => {
    const widgetsSalvos = localStorage.getItem('bessa_widgets_faturamento');
    if (widgetsSalvos) setWidgets(JSON.parse(widgetsSalvos));
  }, []);

  const toggleWidget = (chave) => {
    const novosWidgets = { ...widgets, [chave]: !widgets[chave] };
    setWidgets(novosWidgets);
    localStorage.setItem('bessa_widgets_faturamento', JSON.stringify(novosWidgets));
  };

  const totalComandas = comandasFiltradas.length;
  const ticketMedio = totalComandas > 0 ? (faturamentoTotal / totalComandas) : 0;

  const rankingMaiusculo = rankingProdutos.map(p => ({
    ...p,
    nome: p.nome.toUpperCase()
  }));

  // --- TRAVA DE 7 DIAS BASEADA NO CALENDÁRIO ---
  const faltamDiasParaAnalise = useMemo(() => {
    if (!comandas || comandas.length === 0) return 7;
    
    // Mapeia as datas de todas as comandas e encontra a menor (mais antiga)
    const datasEmMilissegundos = comandas
      .map(c => new Date(c.data + 'T12:00:00').getTime())
      .filter(t => !isNaN(t));

    if (datasEmMilissegundos.length === 0) return 7;

    const dataPrimeira = new Date(Math.min(...datasEmMilissegundos)); 
    const dataHoje = new Date(getHoje() + 'T12:00:00');
    
    const diffDays = Math.floor((dataHoje - dataPrimeira) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - diffDays);
  }, [comandas, getHoje]);

  const { mediaHistorica, percentualDiferenca, statusTermometro, corTermometro } = useMemo(() => {
    if (!comandas || comandas.length === 0) return { mediaHistorica: 0, percentualDiferenca: 0, statusTermometro: 'Sem Histórico', corTermometro: 'text-gray-500' };

    const dataRef = filtroTempo.tipo === 'dia' ? filtroTempo.valor : getHoje();
    const dataObj = new Date(dataRef + 'T12:00:00'); 
    const diaSemana = dataObj.getDay(); 

    const faturamentoPorDia = {};
    // Soma todos os produtos lançados sem exigir que a comanda esteja fechada
    comandas.forEach(c => {
      const dataCaixa = c.data; 
      if (!dataCaixa) return;
      if (!faturamentoPorDia[dataCaixa]) faturamentoPorDia[dataCaixa] = 0;
      const totalProdutos = c.produtos.reduce((acc, p) => acc + p.preco, 0);
      faturamentoPorDia[dataCaixa] += totalProdutos;
    });

    let soma = 0;
    let qtdDias = 0;
    Object.keys(faturamentoPorDia).forEach(data => {
      if (data < dataRef) {
        const dObj = new Date(data + 'T12:00:00');
        if (dObj.getDay() === diaSemana) {
          soma += faturamentoPorDia[data];
          qtdDias++;
        }
      }
    });

    const media = qtdDias > 0 ? (soma / qtdDias) : 0;
    
    let percentual = 0;
    if (media > 0) {
      percentual = ((faturamentoTotal - media) / media) * 100;
    } else if (faturamentoTotal > 0) {
      percentual = 100; 
    }

    let status = 'Dentro da Média ⚖️';
    let cor = temaNoturno ? 'text-gray-300' : 'text-gray-600';

    if (percentual > 15) {
      status = 'Dia Quente 🔥';
      cor = 'text-orange-500';
    } else if (percentual < -15 && faturamentoTotal > 0) {
      status = 'Dia Frio ❄️';
      cor = 'text-blue-500';
    } else if (faturamentoTotal === 0 && media > 0) {
      status = 'Ainda sem vendas';
      cor = temaNoturno ? 'text-gray-500' : 'text-gray-400';
    }

    return { mediaHistorica: media, percentualDiferenca: percentual, statusTermometro: status, corTermometro: cor };
  }, [comandas, filtroTempo.tipo, filtroTempo.valor, getHoje, faturamentoTotal, temaNoturno]);

  const numCardsResumo = [widgets.bruto, widgets.lucro, widgets.ticket].filter(Boolean).length;
  const numCardsMeio = [widgets.termometro, widgets.pagamentos, widgets.produtos].filter(Boolean).length;
  const gridClassMeio = numCardsMeio === 3 ? 'lg:grid-cols-3' : numCardsMeio === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1';

  return (
    <div className="max-w-7xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500 px-2 lg:px-0">
      
      <div className={`p-4 rounded-3xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className={`flex p-1 rounded-xl w-full sm:w-auto border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            {['dia', '7 dias', 'mes', 'ano', 'periodo'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>{t}</button>)}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto flex-1">
            {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
            {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
            {filtroTempo.tipo === 'ano' && <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
            {filtroTempo.tipo === 'periodo' && (
              <><input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`p-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} /><span className={`self-center font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>até</span><input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`p-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} /></>
            )}
          </div>
        </div>

        <button onClick={() => setMostrarMenuPersonalizar(!mostrarMenuPersonalizar)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm border w-full md:w-auto justify-center ${temaNoturno ? 'bg-gray-900 border-gray-700 text-purple-400 hover:bg-gray-800' : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Personalizar Painel
        </button>
      </div>

      {mostrarMenuPersonalizar && (
        <div className={`p-5 rounded-3xl shadow-sm border mb-6 animate-in slide-in-from-top-2 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-black uppercase mb-4 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>Selecione o que deseja visualizar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 'bruto', label: 'Faturamento Bruto' },
              { id: 'lucro', label: 'Lucro Bruto Estimado' },
              { id: 'ticket', label: 'Ticket Médio' },
              { id: 'termometro', label: 'Termômetro de Performance' },
              { id: 'pagamentos', label: 'Divisão por Pagamentos' },
              { id: 'produtos', label: 'Produtos Mais Rentáveis' }
            ].map(item => (
              <label key={item.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${temaNoturno ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-purple-50'}`}>
                <span className={`text-xs font-bold ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
                <input type="checkbox" checked={widgets[item.id]} onChange={() => toggleWidget(item.id)} className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
              </label>
            ))}
          </div>
        </div>
      )}
      
      {numCardsResumo > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${numCardsResumo} gap-6 mb-6`}>
          {widgets.bruto && (
            <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 bg-purple-500/10"></div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Faturamento Bruto</h3>
              <p className={`text-4xl md:text-5xl font-black tracking-tight relative z-10 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>R$ {faturamentoTotal.toFixed(2)}</p>
            </div>
          )}
          {widgets.lucro && (
            <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 bg-green-500/10"></div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Lucro Bruto Estimado</h3>
              <p className="text-4xl md:text-5xl font-black tracking-tight relative z-10 text-green-500">R$ {lucroEstimado.toFixed(2)}</p>
            </div>
          )}
          {widgets.ticket && (
            <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 bg-cyan-500/10"></div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Ticket Médio</h3>
              <div className="relative z-10 flex items-end gap-3">
                <p className="text-4xl md:text-5xl font-black tracking-tight text-cyan-500">R$ {ticketMedio.toFixed(2)}</p>
                <p className={`text-sm font-bold mb-1.5 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>/ {totalComandas} cmds</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {numCardsMeio > 0 && (
        <div className={`grid grid-cols-1 ${gridClassMeio} gap-6 mb-6`}>
          
          {widgets.termometro && (
            <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center items-center text-center h-[350px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-bold uppercase mb-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Performance do Dia</h3>
              
              {faltamDiasParaAnalise > 0 ? (
                <div className="my-auto flex flex-col items-center justify-center text-center px-4">
                  <span className="text-5xl mb-4">🧪</span>
                  <p className={`text-sm font-black ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>Mapeando o DNA do negócio...</p>
                  <p className={`text-xs mt-2 font-medium leading-relaxed ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
                    A inteligência do termômetro será desbloqueada em <span className="text-purple-500 font-black">{faltamDiasParaAnalise} dia{faltamDiasParaAnalise > 1 ? 's' : ''}</span> operacionais. Continue vendendo!
                  </p>
                </div>
              ) : (
                <>
                  <div className="my-auto flex flex-col items-center justify-center">
                    <p className={`text-2xl font-black mb-1 ${corTermometro}`}>{statusTermometro}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${percentualDiferenca >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {percentualDiferenca > 0 ? '+' : ''}{percentualDiferenca.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className={`w-full pt-4 mt-auto border-t ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`text-[10px] uppercase font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Média Histórica (Mesmo Dia)</p>
                    <p className={`text-lg font-black ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>R$ {mediaHistorica.toFixed(2)}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {widgets.pagamentos && (
            <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[350px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-bold uppercase mb-2 text-center ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Divisão de Pagamentos</h3>
              {dadosPizza.length > 0 ? (
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dadosPizza} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                        {dadosPizza.map((e, i) => <Cell key={i} fill={CORES_VIBRANTES[i % CORES_VIBRANTES.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `R$ ${val.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: temaNoturno ? '#1f2937' : '#ffffff', color: temaNoturno ? '#ffffff' : '#000000', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: temaNoturno ? '#e5e7eb' : '#374151' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`flex-1 flex items-center justify-center text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem dados no período</div>
              )}
            </div>
          )}

          {widgets.produtos && (
            <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[350px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-bold uppercase mb-2 text-center ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Produtos Mais Rentáveis</h3>
              {rankingMaiusculo.length > 0 ? (
                <div className="flex-1 w-full">
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
              ) : (
                <div className={`flex-1 flex items-center justify-center text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem vendas no período</div>
              )}
            </div>
          )}

        </div>
      )}

      {Object.values(widgets).every(v => !v) && (
        <div className={`p-10 text-center rounded-3xl border border-dashed ${temaNoturno ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
          <p className="font-bold">Todos os gráficos foram ocultados.</p>
          <p className="text-sm mt-2">Clique em "Personalizar Painel" para exibir os dados.</p>
        </div>
      )}
    </div>
  );
}