export default function CardComanda({ comanda, onClick }) {
  const valorTotal = comanda.produtos?.reduce((acc, p) => acc + p.preco, 0) || 0;
  const valorPago = comanda.produtos?.filter(p => p.pago).reduce((acc, p) => acc + p.preco, 0) || 0;
  const restante = valorTotal - valorPago;

  return (
    <button 
      onClick={onClick} 
      className="w-32 h-44 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col hover:border-purple-300 hover:shadow-lg transition cursor-pointer text-left relative overflow-hidden active:scale-95"
    >
      <div className="flex justify-between items-start mb-2 w-full">
        <h3 className="font-black text-gray-800 text-sm leading-tight truncate pr-1">{comanda.nome}</h3>
        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${comanda.tipo === 'Delivery' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
          {comanda.tipo.substring(0, 3)}
        </span>
      </div>

      {/* AS TAGS APARECENDO AQUI BEM ABAIXO DO NOME */}
      {comanda.tags && comanda.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 max-h-[32px] overflow-hidden">
          {comanda.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] bg-purple-50 border border-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-bold truncate max-w-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-2 border-t border-gray-50 w-full">
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mb-1">
          <span>Itens: {comanda.produtos?.length || 0}</span>
        </div>
        <p className="font-black text-green-600 text-lg tracking-tight">
          <span className="text-[10px] text-green-500/70">R$</span> {restante.toFixed(2)}
        </p>
      </div>
    </button>
  );
}