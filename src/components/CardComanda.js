export default function CardComanda({ comanda, onClick, temaNoturno }) {
  const valorTotal = comanda.produtos?.reduce((acc, p) => acc + p.preco, 0) || 0;
  const valorPago = comanda.produtos?.filter(p => p.pago).reduce((acc, p) => acc + p.preco, 0) || 0;
  const restante = valorTotal - valorPago;

  return (
    <button 
      onClick={onClick} 
      className={`w-32 h-44 rounded-3xl p-4 flex flex-col hover:shadow-xl transition-all duration-300 cursor-pointer text-left relative active:scale-95 border ${
        temaNoturno 
          ? 'bg-gray-800 border-gray-700 hover:border-purple-500 shadow-black/20' 
          : 'bg-white border-gray-100 hover:border-purple-300 shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start mb-3 w-full overflow-hidden">
        <h3 className={`font-black text-sm leading-tight truncate pr-1 ${temaNoturno ? 'text-gray-100' : 'text-gray-800'}`}>
          {comanda.nome}
        </h3>
        <span className={`text-[8px] font-bold uppercase px-2 py-1 rounded-md shrink-0 border ${
          comanda.tipo === 'Delivery' 
            ? (temaNoturno ? 'bg-orange-900/30 text-orange-400 border-orange-800/50' : 'bg-orange-50 text-orange-700 border-orange-100') 
            : (temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800/50' : 'bg-purple-50 text-purple-700 border-purple-100')
        }`}>
          {comanda.tipo.substring(0, 3)}
        </span>
      </div>

      {comanda.tags && comanda.tags.length > 0 && (
        <div className="flex gap-1 mb-2 w-full overflow-x-auto scrollbar-hide pb-1">
          {comanda.tags.map(tag => (
            <span key={tag} className={`text-[9px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap border shrink-0 ${
              temaNoturno ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={`mt-auto pt-3 border-t w-full ${temaNoturno ? 'border-gray-700' : 'border-gray-50'}`}>
        <div className={`flex justify-between items-center text-[10px] font-bold mb-1 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>
          <span>Itens: {comanda.produtos?.length || 0}</span>
        </div>
        <p className={`font-black text-xl tracking-tight ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>
          <span className="text-[10px] opacity-70">R$</span> {restante.toFixed(2)}
        </p>
      </div>
    </button>
  );
}