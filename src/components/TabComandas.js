'use client';
import CardComanda from '@/components/CardComanda';

export default function TabComandas({
  temaNoturno, comandasAbertas, modoExclusao, setModoExclusao,
  selecionadasExclusao, toggleSelecaoExclusao, confirmarExclusaoEmMassa,
  adicionarComanda, setIdSelecionado, caixaAtual
}) {

  return (
    <div className="flex-1 animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-black ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>
          Comandas em Aberto ({comandasAbertas.length})
        </h2>
        {comandasAbertas.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={() => setModoExclusao(!modoExclusao)} 
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition ${modoExclusao ? (temaNoturno ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700') : (temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100')}`}
            >
              {modoExclusao ? 'Cancelar' : 'Excluir Várias'}
            </button>
            {modoExclusao && (
              <button 
                onClick={confirmarExclusaoEmMassa} 
                disabled={selecionadasExclusao.length === 0} 
                className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 shadow-md"
              >
                Confirmar ({selecionadasExclusao.length})
              </button>
            )}
          </div>
        )}
      </div>

      {caixaAtual?.status !== 'aberto' && (
        <div className={`w-full p-10 mb-6 text-center rounded-3xl border border-dashed flex-1 ${temaNoturno ? 'border-gray-700 text-red-400 bg-red-900/10' : 'border-red-200 text-red-600 bg-red-50'}`}>
          <p className="font-black text-lg mb-2">O Caixa está Fechado!</p>
          <p className="text-sm font-medium">Abra o caixa na aba "Caixa" para criar novas comandas.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 md:gap-6 justify-start w-full">
        {!modoExclusao && caixaAtual?.status === 'aberto' && (
          <>
            <button onClick={() => adicionarComanda('Balcão')} className={`w-44 h-48 rounded-3xl p-4 flex flex-col justify-center items-center gap-3 border-2 border-dashed transition-all hover:scale-105 active:scale-95 ${temaNoturno ? 'border-purple-500/30 text-purple-400 bg-purple-900/10 hover:bg-purple-900/30' : 'border-purple-300 text-purple-600 bg-purple-50 hover:bg-purple-100'}`}>
              <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              <span className="text-xs font-black text-center uppercase tracking-widest leading-tight mt-1">Nova Comanda<br/>Balcão</span>
            </button>

            <button onClick={() => adicionarComanda('Delivery')} className={`w-44 h-48 rounded-3xl p-4 flex flex-col justify-center items-center gap-3 border-2 border-dashed transition-all hover:scale-105 active:scale-95 ${temaNoturno ? 'border-orange-500/30 text-orange-400 bg-orange-900/10 hover:bg-orange-900/30' : 'border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100'}`}>
              <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l3 5v6H8m12-11v11M8 7V5a2 2 0 00-2-2H3v14h1m4-12v12m0 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m16 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m-8-2h4"></path></svg>
              <span className="text-xs font-black text-center uppercase tracking-widest leading-tight mt-1">Nova Comanda<br/>Delivery</span>
            </button>
          </>
        )}

        {comandasAbertas.map(comanda => (
          <div key={comanda.id} className="relative group">
            {modoExclusao && (
              <div className="absolute -top-2 -right-2 z-20">
                 <input type="checkbox" checked={selecionadasExclusao.includes(comanda.id)} onChange={() => toggleSelecaoExclusao(comanda.id)} className="w-6 h-6 rounded-full border-2 border-red-500 text-red-500 cursor-pointer shadow-sm" />
              </div>
            )}
            <div className={modoExclusao ? 'opacity-50 scale-95 transition-all' : 'transition-all'}>
              <CardComanda comanda={comanda} onClick={() => { if (!modoExclusao) setIdSelecionado(comanda.id); else toggleSelecaoExclusao(comanda.id); }} temaNoturno={temaNoturno} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}