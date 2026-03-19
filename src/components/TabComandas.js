'use client';
import { useState, useEffect } from 'react';
import CardComanda from '@/components/CardComanda';

export default function TabComandas({
  temaNoturno, comandasAbertas, modoExclusao, setModoExclusao,
  selecionadasExclusao, toggleSelecaoExclusao, confirmarExclusaoEmMassa,
  adicionarComanda, setIdSelecionado, caixaAtual, abrirCaixaManual, mostrarAlerta
}) {

  const [saldoInicial, setSaldoInicial] = useState('');
  const [dataHoje, setDataHoje] = useState('');
  const [mostrarModalAntigas, setMostrarModalAntigas] = useState(false);

  useEffect(() => {
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); 
    setDataHoje(hoje);
  }, []);

  useEffect(() => {
    if (dataHoje && comandasAbertas) {
      const comandasAntigasTemp = comandasAbertas.filter(c => c.data && c.data < dataHoje);
      if (comandasAntigasTemp.length > 0) {
        // Verifica se o usuário já clicou em fechar nesta sessão
        const avisoJaMostrado = sessionStorage.getItem('avisoTurnoAnteriorMostrado');
        if (avisoJaMostrado !== 'true') {
          setMostrarModalAntigas(true);
        } else {
          setMostrarModalAntigas(false); // Previne reabertura no reload da página
        }
      }
    }
  }, [comandasAbertas, dataHoje]);

  // Só salva a informação de que foi lido após o clique do usuário
  const fecharAvisoModal = () => {
    sessionStorage.setItem('avisoTurnoAnteriorMostrado', 'true');
    setMostrarModalAntigas(false);
  };

  const comandasAntigas = comandasAbertas.filter(c => c.data && c.data < dataHoje);

  const handleAbrirCaixa = () => {
    abrirCaixaManual({
      data_abertura: dataHoje,
      saldo_inicial: parseFloat(saldoInicial || 0)
    });
  };

  return (
    <>
      {mostrarModalAntigas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl flex flex-col gap-4 border animate-in zoom-in-95 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-2xl ${temaNoturno ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                ⚠️
              </div>
              <div>
                <h3 className={`text-lg font-black uppercase tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Turno Anterior</h3>
                <p className={`text-[10px] font-bold uppercase ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Comandas Pendentes</p>
              </div>
            </div>
            <p className={`text-sm font-medium ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>
              Identificamos <strong>{comandasAntigas.length} comanda(s)</strong> abertas de dias anteriores. Elas continuam disponíveis no painel para serem finalizadas hoje.
            </p>
            <button 
              onClick={fecharAvisoModal} 
              className="w-full py-4 mt-2 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg bg-orange-500 hover:bg-orange-600 text-white active:scale-95"
            >
              Ciente, Fechar Aviso
            </button>
          </div>
        </div>
      )}

      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        
        {/* TÍTULO FUNDIDO AO HEADER COM BORDAS CONECTADAS */}
        <div className={`p-5 md:p-6 pt-4 md:pt-5 rounded-b-2xl shadow-sm border-x border-b border-t-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative transition-colors duration-500 mb-6 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="mt-2 md:mt-0">
              <h2 className={`text-xl font-black flex items-center gap-2 uppercase tracking-wide ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                Comandas em Aberto
                <span className={`text-sm font-normal px-2 py-0.5 rounded-md ${temaNoturno ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>({comandasAbertas.length})</span>
              </h2>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Gestão de Mesas e Entregas</p>
            </div>
            
            {caixaAtual?.status === 'aberto' && (
              <div className="flex flex-wrap gap-2 w-full md:w-auto animate-in fade-in zoom-in-95 duration-300">
                  {!modoExclusao && (
                    <>
                      <button onClick={() => adicionarComanda('Balcão')} className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-dashed active:scale-95 ${temaNoturno ? 'bg-purple-900/20 text-purple-400 border-purple-800 hover:bg-purple-900/40' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}>+ Nova Comanda</button>
                      <button onClick={() => adicionarComanda('Delivery')} className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-dashed active:scale-95 ${temaNoturno ? 'bg-orange-900/20 text-orange-400 border-orange-800 hover:bg-orange-900/40' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'}`}>+ Novo Delivery</button>
                    </>
                  )}
                  {comandasAbertas.length > 0 && (
                    <button onClick={() => setModoExclusao(!modoExclusao)} className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border active:scale-95 ${modoExclusao ? (temaNoturno ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-200 text-gray-700 border-gray-300') : (temaNoturno ? 'bg-red-900/20 text-red-400 border-red-800/50 hover:bg-red-900/40' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100')}`}>
                      {modoExclusao ? 'Cancelar Exclusão' : 'Excluir Várias'}
                    </button>
                  )}
                  {modoExclusao && (
                    <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 shadow-md active:scale-95">
                      Confirmar Exclusão ({selecionadasExclusao.length})
                    </button>
                  )}
              </div>
            )}
        </div>

        <div className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto">
          {caixaAtual?.status !== 'aberto' ? (
            <div className={`w-full max-w-lg mx-auto p-6 mb-6 rounded-3xl border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="text-center mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${temaNoturno ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h3 className={`text-lg font-black ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Abertura de Caixa</h3>
                <p className={`text-sm mt-1 font-bold ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>
                  Iniciando operações para hoje: {dataHoje ? dataHoje.split('-').reverse().join('/') : '...'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Suprimento Inicial em Espécie (R$)</label>
                  <input type="number" placeholder="0.00" value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-black text-center text-lg transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`} />
                </div>

                <button onClick={handleAbrirCaixa} className="w-full py-4 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg mt-2 active:scale-95 bg-purple-600 hover:bg-purple-700 text-white">
                  Confirmar e Abrir Caixa
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 md:gap-6 justify-start w-full pb-10">
              {comandasAbertas.length === 0 && !modoExclusao && (
                <div className={`w-full p-12 rounded-3xl text-center border border-dashed animate-in fade-in zoom-in-95 ${temaNoturno ? 'border-gray-700 text-gray-500 bg-gray-800/50' : 'border-gray-300 text-gray-400 bg-gray-50'}`}>
                  <p className="font-bold uppercase tracking-widest text-[10px]">Nenhuma comanda aberta</p>
                  <p className="text-[10px] font-bold mt-1">Use os botões no cabeçalho acima para criar uma nova venda.</p>
                </div>
              )}

              {comandasAbertas.map(comanda => (
                <div key={comanda.id} className="relative group animate-in fade-in zoom-in-95 duration-300">
                  {modoExclusao && (
                    <div className="absolute -top-2 -right-2 z-20">
                        <input type="checkbox" checked={selecionadasExclusao.includes(comanda.id)} onChange={() => toggleSelecaoExclusao(comanda.id)} className="w-6 h-6 rounded-full border-2 border-red-500 text-red-500 cursor-pointer shadow-sm" />
                    </div>
                  )}
                  <div className={modoExclusao ? 'opacity-50 scale-95 transition-all' : 'transition-all hover:-translate-y-1'}>
                    <CardComanda comanda={comanda} onClick={() => { if (!modoExclusao) setIdSelecionado(comanda.id); else toggleSelecaoExclusao(comanda.id); }} temaNoturno={temaNoturno} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}