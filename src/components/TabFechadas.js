'use client';
import { useState } from 'react';

export default function TabFechadas({
  temaNoturno,
  comandasFechadas, // Recebe todas as fechadas
  reabrirComandaFechada,
  excluirComandaFechada,
  getHoje
}) {
  // Pega a data de hoje para usar como limite máximo e padrão inicial
  const hoje = getHoje ? getHoje() : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  
  // Estado para armazenar a data escolhida
  const [dataFiltro, setDataFiltro] = useState(hoje);

  // Função para avançar ou retroceder dias
  const mudarDia = (quantidadeDias) => {
    // Quebra a string YYYY-MM-DD para criar a data corretamente sem fuso horário atrapalhar
    const [ano, mes, dia] = dataFiltro.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    
    // Adiciona ou subtrai os dias
    dataObj.setDate(dataObj.getDate() + quantidadeDias);
    
    // Formata de volta para YYYY-MM-DD
    const anoNovo = dataObj.getFullYear();
    const mesNovo = String(dataObj.getMonth() + 1).padStart(2, '0');
    const diaNovo = String(dataObj.getDate()).padStart(2, '0');
    
    setDataFiltro(`${anoNovo}-${mesNovo}-${diaNovo}`);
  };

  // Filtra as comandas baseadas na data escolhida
  const comandasDoDia = comandasFechadas.filter(c => c.data === dataFiltro);

  // Ordena deixando as comandas MAIS RECENTES no topo
  const comandasOrdenadas = [...comandasDoDia].sort((a, b) => {
    const timeA = a.hora_fechamento ? new Date(a.hora_fechamento).getTime() : 0;
    const timeB = b.hora_fechamento ? new Date(b.hora_fechamento).getTime() : 0;
    return timeB - timeA; 
  });

  return (
    <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className={`text-2xl font-black flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>
          Comandas Encerradas 
          <span className={`text-sm font-normal px-2 py-0.5 rounded-md ${temaNoturno ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>
            ({comandasOrdenadas.length})
          </span>
        </h2>
        
        {/* Controles de Data com Botões Anterior e Seguinte */}
        <div className="flex items-center gap-2">
          {/* Botão Dia Anterior */}
          <button 
            onClick={() => mudarDia(-1)}
            title="Dia Anterior"
            className={`p-2.5 rounded-xl transition flex items-center justify-center border ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>

          {/* Input de Data */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <span className={`text-sm font-bold hidden sm:inline-block ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Data:</span>
            <input 
              type="date" 
              value={dataFiltro}
              max={hoje}
              onChange={(e) => setDataFiltro(e.target.value)}
              className={`bg-transparent outline-none text-sm font-medium ${temaNoturno ? 'text-white [color-scheme:dark]' : 'text-gray-800'}`}
            />
          </div>

          {/* Botão Dia Seguinte (Só aparece se a data do filtro for menor que hoje) */}
          {dataFiltro < hoje ? (
            <button 
              onClick={() => mudarDia(1)}
              title="Dia Seguinte"
              className={`p-2.5 rounded-xl transition flex items-center justify-center border ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          ) : (
            // Espaçador invisível para manter o layout alinhado quando o botão some
            <div className="w-[42px]"></div>
          )}
        </div>
      </div>
      
      {comandasOrdenadas.length === 0 ? (
        <div className={`p-12 rounded-3xl text-center shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center ${temaNoturno ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <p className={`font-bold text-lg mb-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>Nenhuma comanda encerrada nesta data.</p>
          <p className={`text-sm ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Tente usar as setas ou selecionar outro dia no calendário acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comandasOrdenadas.map(c => {
            const valorTotalComanda = c.pagamentos.reduce((acc, p) => acc + p.valor, 0);
            return (
              <div key={c.id} className={`p-5 rounded-3xl shadow-sm border flex flex-col ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
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
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Resumo dos Itens</p>
                  <p className={`text-sm line-clamp-2 leading-relaxed ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>{c.produtos.map(p => p.nome).join(', ')}</p>
                  <p className={`text-xs mt-1 font-medium italic ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>({c.produtos.length} produtos)</p>
                </div>
                
                <div className={`p-3 rounded-xl flex items-center justify-between border mb-3 ${temaNoturno ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`text-xs font-bold uppercase ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>Pagamento</span>
                  <div className="flex flex-wrap gap-1 justify-end">{c.pagamentos.map((p, i) => <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>{p.forma}</span>)}</div>
                </div>
                
                <div className={`flex gap-2 pt-3 border-t ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button onClick={() => reabrirComandaFechada(c.id)} className={`flex-1 font-bold p-2 rounded-xl text-xs transition text-center ${temaNoturno ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>🔄 Reabrir</button>
                  <button onClick={() => excluirComandaFechada(c.id)} className={`flex-1 font-bold p-2 rounded-xl text-xs transition text-center ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>🗑️ Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}