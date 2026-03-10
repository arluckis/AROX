'use client';
import CardComanda from '@/components/CardComanda';

export default function TabComandas({
  temaNoturno,
  comandasAbertas,
  modoExclusao,
  setModoExclusao,
  selecionadasExclusao,
  toggleSelecaoExclusao,
  confirmarExclusaoEmMassa,
  adicionarComanda,
  setIdSelecionado,
  caixaAtual // <- Precisamos receber o caixaAtual para a verificação de data
}) {
  return (
    <div className="flex flex-col animate-in fade-in duration-300">
      {comandasAbertas.length > 0 && (
        <div className="flex justify-end mb-4">
          {!modoExclusao ? <button onClick={() => setModoExclusao(true)} className={`font-bold text-sm px-4 py-2 rounded-xl border transition ${temaNoturno ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'}`}>Gerenciar Exclusões</button> : (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${temaNoturno ? 'bg-red-900/20 border-red-900/50' : 'bg-red-50 border-red-100'}`}>
              <span className={`font-bold text-sm ${temaNoturno ? 'text-red-400' : 'text-red-500'}`}>{selecionadasExclusao.length} selecionadas</span>
              <button onClick={() => { setModoExclusao(false); setSelecionadasExclusao([]); }} className={`font-bold text-sm hover:underline ${temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Cancelar</button>
              <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="bg-red-500 text-white font-bold text-sm px-4 py-1.5 rounded-lg disabled:opacity-50 transition">Confirmar Exclusão</button>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-4 md:gap-6">
        <button onClick={() => adicionarComanda('Balcão')} disabled={modoExclusao} className={`w-32 h-44 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center font-bold transition ${temaNoturno ? 'border-purple-500/50 text-purple-400 bg-purple-900/10 hover:bg-purple-900/30' : 'border-purple-300 text-purple-600 bg-purple-50 hover:bg-purple-100'} hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100`}>
          <span className="text-4xl mb-2 font-light">+</span><span>Balcão</span>
        </button>
        <button onClick={() => adicionarComanda('Delivery')} disabled={modoExclusao} className={`w-32 h-44 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center font-bold transition ${temaNoturno ? 'border-orange-500/50 text-orange-400 bg-orange-900/10 hover:bg-orange-900/30' : 'border-orange-300 text-orange-500 bg-orange-50 hover:bg-orange-100'} hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100`}>
          <span className="text-4xl mb-2 font-light">+</span><span>Delivery</span>
        </button>
        
        {comandasAbertas.map((item) => {
          // Correção do Bug de Data: Compara usando substring(0, 10) para garantir que "2026-03-10" não seja confundido.
          const isTurnoAnterior = caixaAtual?.data_abertura && item.data && 
                                  item.data.substring(0, 10) !== caixaAtual.data_abertura.substring(0, 10);

          return (
            <div key={item.id} className="relative">
              {/* Etiqueta elegante e discreta sem emoji */}
              {isTurnoAnterior && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm whitespace-nowrap border flex items-center gap-1.5 backdrop-blur-md transition-colors ${temaNoturno ? 'bg-gray-800/95 border-gray-700 text-gray-400' : 'bg-white/95 border-gray-200 text-gray-500'}`}>
                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {item.data.substring(0,10).split('-').reverse().join('/')}
                </div>
              )}

              <CardComanda comanda={item} temaNoturno={temaNoturno} onClick={() => modoExclusao ? toggleSelecaoExclusao(item.id) : setIdSelecionado(item.id)} />
              {modoExclusao && <div className={`absolute inset-0 rounded-3xl border-4 pointer-events-none transition ${selecionadasExclusao.includes(item.id) ? 'border-red-500 bg-red-500/20' : 'border-transparent bg-black/5'}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}