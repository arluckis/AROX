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
    <div className="w-full animate-in slide-in-from-bottom-4 duration-500 px-2 lg:px-0 pb-10">
      
      {/* TÍTULO FUNDIDO AO HEADER */}
      <div className={`p-5 lg:p-6 pt-4 lg:pt-5 rounded-b-3xl shadow-sm border-x border-b border-t-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative transition-colors duration-500 mb-6 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`absolute top-0 left-6 right-6 border-t border-dashed ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}></div>
          <div className="mt-2 md:mt-0">
            <h2 className={`text-xl font-black flex items-center gap-2 uppercase tracking-wide ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
              Comandas Encerradas
              <span className={`text-sm font-normal px-2 py-0.5 rounded-md ${temaNoturno ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>({comandasOrdenadas.length})</span>
            </h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Histórico de vendas por dia</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-end animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => mudarDia(-1)} title="Dia Anterior" className={`p-3 rounded-xl border flex-shrink-0 flex items-center justify-center transition-all active:scale-95 ${temaNoturno ? 'bg-gray-900 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <input 
              type="date" 
              value={dataFiltro}
              max={hoje}
              onChange={(e) => setDataFiltro(e.target.value)}
              className={`w-full md:w-40 px-3 py-3 text-center border rounded-xl outline-none text-xs font-bold transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
            />
            {dataFiltro < hoje ? (
              <button onClick={() => mudarDia(1)} title="Dia Seguinte" className={`p-3 rounded-xl border flex-shrink-0 flex items-center justify-center transition-all active:scale-95 ${temaNoturno ? 'bg-gray-900 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            ) : (
              <div className="w-[42px]"></div>
            )}
          </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto">
        {comandasOrdenadas.length === 0 ? (
          <div className={`p-12 rounded-3xl text-center shadow-sm border animate-in fade-in slide-in-from-bottom-4 duration-500 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className={`mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center ${temaNoturno ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <p className={`font-bold text-[10px] uppercase tracking-widest mb-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>Nenhuma comanda encerrada nesta data.</p>
            <p className={`text-[10px] font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Utilize o calendário no topo para buscar outros dias.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comandasOrdenadas.map(c => {
              const valorTotalComanda = c.pagamentos.reduce((acc, p) => acc + p.valor, 0);
              return (
                <div key={c.id} className={`p-5 rounded-3xl shadow-sm border flex flex-col transition-all hover:-translate-y-1 animate-in fade-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className={`flex justify-between items-start border-b pb-4 mb-3 ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div>
                      <h3 className={`font-black text-lg leading-tight flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>
                        {c.nome} {c.tags?.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase border ${temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{c.tags[0]}</span>}
                      </h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 inline-block border ${c.tipo === 'Delivery' ? (temaNoturno ? 'bg-orange-900/20 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-600 border-orange-100') : (temaNoturno ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-100')}`}>{c.tipo}</span>
                      
                      <div className="flex flex-col gap-1.5 mt-3">
                        {c.hora_abertura && (
                          <span className={`text-[11px] font-medium flex items-center gap-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Aberto às {new Date(c.hora_abertura).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {c.hora_fechamento && (
                          <span className={`text-[11px] font-black flex items-center gap-1 ${temaNoturno ? 'text-purple-400' : 'text-purple-700'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            Fechado às {new Date(c.hora_fechamento).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-xl tracking-tight text-green-500">R$ {valorTotalComanda.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex-1 mb-4">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Resumo dos Itens</p>
                    <p className={`text-sm line-clamp-2 leading-relaxed ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>{c.produtos.map(p => p.nome).join(', ')}</p>
                    <p className={`text-[10px] mt-1 font-bold italic ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>({c.produtos.length} produtos)</p>
                  </div>
                  
                  <div className={`p-3 rounded-xl flex items-center justify-between border mb-3 ${temaNoturno ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>Pagamento</span>
                    <div className="flex flex-wrap gap-1 justify-end">{c.pagamentos.map((p, i) => <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>{p.forma}</span>)}</div>
                  </div>
                  
                  <div className={`flex gap-2 pt-3 border-t ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
                    <button onClick={() => reabrirComandaFechada(c.id)} className={`flex-1 font-bold p-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 text-center ${temaNoturno ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>Reabrir</button>
                    <button onClick={() => excluirComandaFechada(c.id)} className={`flex-1 font-bold p-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 text-center ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>Excluir</button>
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