// src/components/TabFechadas.js
'use client';
import { useState } from 'react';

export default function TabFechadas({
  temaNoturno,
  comandasFechadas,
  reabrirComandaFechada,
  excluirComandaFechada,
  getHoje
}) {
  const hoje = getHoje ? getHoje() : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [dataFiltro, setDataFiltro] = useState(hoje);

  const mudarDia = (quantidadeDias) => {
    const [ano, mes, dia] = dataFiltro.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    dataObj.setDate(dataObj.getDate() + quantidadeDias);
    const anoNovo = dataObj.getFullYear();
    const mesNovo = String(dataObj.getMonth() + 1).padStart(2, '0');
    const diaNovo = String(dataObj.getDate()).padStart(2, '0');
    setDataFiltro(`${anoNovo}-${mesNovo}-${diaNovo}`);
  };

  const comandasDoDia = comandasFechadas.filter(c => c.data === dataFiltro);
  const comandasOrdenadas = [...comandasDoDia].sort((a, b) => {
    const timeA = a.hora_fechamento ? new Date(a.hora_fechamento).getTime() : 0;
    const timeB = b.hora_fechamento ? new Date(b.hora_fechamento).getTime() : 0;
    return timeB - timeA; 
  });

  return (
    <div className="w-full max-w-full animate-in fade-in duration-500 pb-20">
      
      {/* HEADER OPERACIONAL PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 w-full pb-5 border-b transition-colors duration-300 border-zinc-200/60 dark:border-white/[0.08]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Histórico Operacional
              </h1>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-zinc-100/80 border-zinc-200/80'}`}>
                <span className={`text-xs font-semibold tabular-nums ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {comandasOrdenadas.length}
                </span>
              </div>
            </div>
            <div className={`text-sm font-medium tracking-tight flex items-center gap-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
              <span>Registros finalizados e arquivados</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button 
              onClick={() => mudarDia(-1)} 
              title="Dia Anterior" 
              className={`w-10 h-10 rounded-lg border flex flex-shrink-0 items-center justify-center transition-all outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-[#0A0A0A] ${temaNoturno ? 'bg-[#111] border-white/10 text-zinc-400 hover:bg-[#1A1A1A] hover:text-zinc-200 focus:ring-zinc-700' : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 focus:ring-zinc-300 shadow-sm'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            
            <div className="relative group flex items-center">
              <input 
                type="date" 
                value={dataFiltro}
                max={hoje}
                onChange={(e) => setDataFiltro(e.target.value)}
                className={`w-full md:w-40 px-3 h-10 border rounded-lg outline-none text-sm font-semibold transition-all focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-[#0A0A0A] ${temaNoturno ? 'bg-[#111] border-white/10 text-zinc-300 focus:ring-zinc-700 [color-scheme:dark]' : 'bg-white border-zinc-200/80 text-zinc-700 focus:ring-zinc-300 shadow-sm'}`} 
              />
            </div>

            <button 
              onClick={() => mudarDia(1)} 
              disabled={dataFiltro >= hoje}
              title="Dia Seguinte" 
              className={`w-10 h-10 rounded-lg border flex flex-shrink-0 items-center justify-center transition-all outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-[#0A0A0A] ${dataFiltro >= hoje ? 'opacity-40 cursor-not-allowed' : ''} ${temaNoturno ? 'bg-[#111] border-white/10 text-zinc-400 hover:bg-[#1A1A1A] hover:text-zinc-200 focus:ring-zinc-700' : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 focus:ring-zinc-300 shadow-sm'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 mx-auto w-full">
        {comandasOrdenadas.length === 0 ? (
          
          /* EMPTY STATE PREMIUM */
          <div className="w-full py-28 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 ${temaNoturno ? 'bg-white/5 text-zinc-500' : 'bg-white shadow-sm text-zinc-400 border border-zinc-100'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l5-5 5 5"/></svg>
            </div>
            <p className={`text-base font-semibold tracking-tight ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>Nenhum registro finalizado nesta data</p>
            <p className={`text-sm mt-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Navegue pelos dias anteriores para visualizar o histórico operacional.
            </p>
          </div>

        ) : (
          
          /* GRID PRINCIPAL (Expansivo) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {comandasOrdenadas.map(c => {
              const valorTotalComanda = c.pagamentos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
              const isDelivery = c.tipo === 'Delivery';
              
              return (
                <div key={c.id} className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-300 ease-out group overflow-hidden animate-in fade-in zoom-in-95 w-full ${temaNoturno ? 'bg-[#0A0A0A] border-white/[0.08] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-lg' : 'bg-white border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-zinc-300/80 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5'}`}>
                  
                  {/* IDENTIDADE LOGÍSTICA SUTIL (Side strip indicator) */}
                  {isDelivery && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500/80 dark:bg-amber-500/60"></div>
                  )}

                  {/* HEADER DO CARD */}
                  <div className={`flex justify-between items-start gap-3 w-full relative z-10 ${isDelivery ? 'pl-1' : ''}`}>
                    <div className="flex flex-col min-w-0 gap-1.5 w-full">
                      <h3 className={`font-semibold text-base truncate tracking-tight w-full ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {c.nome}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                          isDelivery 
                            ? (temaNoturno ? 'bg-amber-500/10 border-amber-500/20 text-amber-500/90' : 'bg-amber-50 border-amber-200/60 text-amber-700')
                            : (temaNoturno ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-zinc-50 border-zinc-200/60 text-zinc-500')
                        }`}>
                          {c.tipo}
                        </span>
                        
                        {c.hora_fechamento && (
                           <span className={`text-[11px] font-medium flex items-center gap-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
                             {new Date(c.hora_fechamento).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CORPO DO CARD (Resumo Sintético) */}
                  <div className={`mt-5 flex-1 relative z-10 ${isDelivery ? 'pl-1' : ''}`}>
                    <p className={`text-xs font-medium line-clamp-2 leading-relaxed ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {c.produtos?.length > 0 ? c.produtos.map(p => p.nome).join(', ') : 'Sem produtos registrados'}
                    </p>
                    <p className={`text-[11px] font-semibold mt-1.5 opacity-60 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {c.produtos?.length || 0} {(c.produtos?.length === 1) ? 'item' : 'itens'}
                    </p>
                  </div>

                  {/* ZONA DE PAGAMENTO E VALOR */}
                  <div className={`mt-5 pt-4 border-t flex justify-between items-end relative z-10 ${temaNoturno ? 'border-white/5' : 'border-zinc-100'} ${isDelivery ? 'pl-1' : ''}`}>
                    <div className="flex flex-col gap-1.5 mb-0.5 w-full">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        Pagamento
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {c.pagamentos?.length > 0 ? (
                          c.pagamentos.map((p, i) => (
                            <span key={i} className={`text-[10px] font-semibold ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {p.forma}{i < c.pagamentos.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        ) : (
                          <span className={`text-[10px] font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Não informado</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 leading-none text-right flex-shrink-0">
                      <span className={`text-sm font-medium ${temaNoturno ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>R$</span>
                      <span className={`font-bold text-2xl tabular-nums tracking-tighter ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {valorTotalComanda.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* FOOTER DE AÇÕES (Alta Fidelidade) */}
                  <div className={`flex gap-2 mt-5 pt-3 border-t relative z-10 ${temaNoturno ? 'border-white/[0.04]' : 'border-zinc-100'} ${isDelivery ? 'pl-1' : ''}`}>
                    <button 
                      onClick={() => reabrirComandaFechada(c.id)} 
                      className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all w-full ${temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}
                    >
                      Reabrir
                    </button>
                    <button 
                      onClick={() => excluirComandaFechada(c.id)} 
                      className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all w-full ${temaNoturno ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10' : 'text-red-500/70 hover:text-red-600 hover:bg-red-50'}`}
                    >
                      Apagar
                    </button>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}