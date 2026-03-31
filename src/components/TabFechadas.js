'use client';
import { useState } from 'react';

export default function TabFechadas({
  temaNoturno,
  comandasFechadas,
  reabrirComandaFechada,
  excluirComandaFechada,
  getHoje,
  caixaAtual
}) {
  const hojeCalendario = getHoje ? getHoje() : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const cicloAtualData = (caixaAtual?.status === 'aberto' && caixaAtual?.data_abertura) ? caixaAtual.data_abertura : hojeCalendario;

  const [dataFiltro, setDataFiltro] = useState(cicloAtualData);

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

  const renderDataLabel = () => {
    if (dataFiltro === hojeCalendario) return 'Hoje';
    const dataObj = new Date(dataFiltro + 'T12:00:00');
    return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace(' de ', ' ');
  };

  const bgPrincipal = temaNoturno ? 'bg-[#050505]' : 'bg-[#FAFAFA]';
  const surfaceBase = temaNoturno ? 'bg-[#0A0A0A]' : 'bg-white/80 backdrop-blur-xl';
  const bordaBase = temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]';
  const bordaDestaque = temaNoturno ? 'border-white/[0.08]' : 'border-black/[0.08]';
  const textSecundario = temaNoturno ? 'text-zinc-500' : 'text-zinc-500';

  return (
    <div className={`w-full max-w-full font-sans arox-cinematic pb-20 px-4 md:px-0 ${bgPrincipal}`}>

      {/* HEADER OPERACIONAL PREMIUM */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 w-full pb-6 border-b transition-colors duration-300 ${bordaDestaque}`}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
                <span className={`text-[11px] font-bold tabular-nums ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {comandasOrdenadas.length} {comandasOrdenadas.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
            </div>
            <div className={`text-[13px] font-medium tracking-tight flex items-center gap-2 ${textSecundario}`}>
              <span>Comandas finalizadas e arquivadas do dia selecionado</span>
            </div>
          </div>
          
          <div className={`flex items-center p-1.5 rounded-xl border shadow-sm ${surfaceBase} ${bordaDestaque}`}>
             <button onClick={() => mudarDia(-1)} className={`p-2.5 rounded-lg transition-colors active:scale-95 ${temaNoturno ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-black'}`}>
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
             </button>
             
             <div className="relative flex items-center justify-center min-w-[140px]">
               <input 
                 type="date" 
                 value={dataFiltro}
                 max={hojeCalendario}
                 onChange={(e) => setDataFiltro(e.target.value)}
                 className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${temaNoturno ? '[color-scheme:dark]' : ''}`} 
               />
               <span className={`text-[13px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>
                 {renderDataLabel()}
               </span>
             </div>

             <button onClick={() => mudarDia(1)} disabled={dataFiltro >= hojeCalendario} className={`p-2.5 rounded-lg transition-colors active:scale-95 disabled:opacity-20 disabled:hover:bg-transparent disabled:active:scale-100 ${temaNoturno ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-black'}`}>
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
             </button>
          </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 mx-auto w-full">
        {comandasOrdenadas.length === 0 ? (
          
          <div className={`w-full py-32 flex flex-col items-center justify-center rounded-3xl border border-dashed transition-colors ${temaNoturno ? 'border-white/[0.08] bg-white/[0.01]' : 'border-black/[0.08] bg-black/[0.01]'}`}>
            <p className={`text-[15px] font-bold tracking-tight mb-2 ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>Radar Limpo</p>
            <p className={`text-[13px] ${textSecundario}`}>
              Nenhum registro finalizado na data selecionada.
            </p>
          </div>

        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {comandasOrdenadas.map((c, idx) => {
              const valorTotalComanda = c.pagamentos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
              const isDelivery = c.tipo === 'Delivery';
              
              let isDiaDiferente = false;
              let dataHoraAberturaStr = '';
              if (c.hora_abertura || c.created_at) {
                const dataObj = new Date(c.hora_abertura || c.created_at);
                const isoReal = dataObj.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
                isDiaDiferente = isoReal !== c.data;
                dataHoraAberturaStr = `${dataObj.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}).replace(' de ', ' ')}, `;
              }

              const cardBg = isDiaDiferente 
                ? (temaNoturno ? 'bg-indigo-500/[0.02] border-indigo-500/20 hover:border-indigo-500/40' : 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-300')
                : (temaNoturno ? 'bg-[#0A0A0A] border-white/[0.04] hover:border-white/[0.08]' : 'bg-white border-black/[0.04] hover:border-black/[0.08]');

              const textHoraColor = isDiaDiferente 
                ? (temaNoturno ? 'text-indigo-400' : 'text-indigo-600')
                : textSecundario;

              return (
                <div key={c.id} className={`relative flex flex-col rounded-3xl border p-5 transition-all duration-300 ease-out group overflow-hidden arox-cinematic w-full hover:shadow-lg hover:-translate-y-1 ${cardBg}`} style={{ animationDelay: `${idx * 20}ms` }}>
                  
                  {isDelivery && (
                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-3xl">
                       <div className="absolute top-[-20px] right-[-20px] w-10 h-10 bg-amber-500/20 blur-xl"></div>
                       <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                    </div>
                  )}

                  {isDiaDiferente && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${temaNoturno ? 'bg-indigo-500/50' : 'bg-indigo-400'}`}></div>
                  )}

                  <div className="flex justify-between items-start gap-3 w-full relative z-10">
                    <div className="flex flex-col min-w-0 gap-1.5 w-full pr-4">
                      <h3 className={`text-[15px] font-bold truncate tracking-tight w-full transition-colors duration-300 ${isDiaDiferente ? (temaNoturno ? 'text-indigo-100 group-hover:text-indigo-300' : 'text-indigo-900 group-hover:text-indigo-700') : (temaNoturno ? 'text-zinc-100 group-hover:text-emerald-500' : 'text-zinc-900 group-hover:text-emerald-500')}`}>
                        {c.nome}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${
                          isDelivery 
                            ? (temaNoturno ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700')
                            : (temaNoturno ? 'bg-white/5 border-white/5 text-zinc-400' : 'bg-black/5 border-black/5 text-zinc-600')
                        }`}>
                          {c.tipo}
                        </span>
                        
                        {c.hora_fechamento && (
                           <span className={`text-[10px] font-bold tracking-wider flex items-center gap-1 ${textHoraColor}`}>
                             {isDiaDiferente && dataHoraAberturaStr}
                             {new Date(c.hora_fechamento).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex-1 relative z-10">
                    <p className={`text-[12px] font-medium line-clamp-2 leading-relaxed ${textSecundario}`}>
                      {c.produtos?.length > 0 ? c.produtos.map(p => p.nome).join(', ') : 'Sem itens registrados'}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 opacity-60 ${textSecundario}`}>
                      {c.produtos?.length || 0} {(c.produtos?.length === 1) ? 'item' : 'itens'}
                    </p>
                  </div>

                  <div className={`mt-5 pt-4 border-t flex justify-between items-end relative z-10 ${bordaBase}`}>
                    <div className="flex flex-col gap-1 mb-0.5 w-full">
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${textSecundario}`}>
                        Pagamento via
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {c.pagamentos?.length > 0 ? (
                          c.pagamentos.map((p, i) => (
                            <span key={i} className={`text-[11px] font-bold ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>
                              {p.forma}{i < c.pagamentos.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        ) : (
                          <span className={`text-[11px] font-bold ${textSecundario}`}>Não informado</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 leading-none text-right flex-shrink-0">
                      <span className={`text-[12px] font-bold ${temaNoturno ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>R$</span>
                      <span className={`text-2xl font-black tabular-nums tracking-tighter ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {valorTotalComanda.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className={`flex gap-2 mt-5 pt-4 border-t relative z-10 ${bordaBase}`}>
                    <button 
                      onClick={() => reabrirComandaFechada(c.id)} 
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors w-full ${temaNoturno ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-black/5'}`}
                    >
                      Reabrir
                    </button>
                    <button 
                      onClick={() => excluirComandaFechada(c.id)} 
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors w-full ${temaNoturno ? 'text-red-400/80 hover:text-red-400 hover:bg-red-500/10' : 'text-red-500/80 hover:text-red-600 hover:bg-red-50'}`}
                    >
                      Estornar
                    </button>
                  </div>
                  
                </div>
              );
            })}
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