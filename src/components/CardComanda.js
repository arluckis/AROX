export default function CardComanda({ comanda, onClick, temaNoturno }) {
  const valorTotal = comanda.produtos?.reduce((acc, p) => acc + p.preco, 0) || 0;
  const valorPago = comanda.produtos?.filter(p => p.pago).reduce((acc, p) => acc + p.preco, 0) || 0;
  const restante = valorTotal - valorPago;

  const formatarAbertura = (isoDate) => {
    if (!isoDate) return { texto: '', isOutroDia: false, dataCurta: '' };
    const d = new Date(isoDate);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    
    const hoje = new Date();
    const isOutroDia = d.getDate() !== hoje.getDate() || d.getMonth() !== hoje.getMonth() || d.getFullYear() !== hoje.getFullYear();
    
    if (!isOutroDia) {
      return { texto: `Hoje às ${hora}:${min}`, isOutroDia: false, dataCurta: `${dia}/${mes}` };
    }
    return { texto: `${dia}/${mes} às ${hora}:${min}`, isOutroDia: true, dataCurta: `${dia}/${mes}` };
  };

  const abertura = formatarAbertura(comanda.hora_abertura);
  const isDelivery = comanda.tipo === 'Delivery';

  // Cores de fundo: Fica Cinza se for de outro dia. Caso contrário, roxo/laranja normal.
  const bgClass = abertura.isOutroDia
    ? (temaNoturno ? 'bg-gray-800 border-gray-600 hover:border-gray-500' : 'bg-gray-200/80 border-gray-300 hover:border-gray-400')
    : temaNoturno 
      ? (isDelivery ? 'bg-orange-900/20 border-orange-800/50 hover:border-orange-500' : 'bg-purple-900/20 border-purple-800/50 hover:border-purple-500') 
      : (isDelivery ? 'bg-orange-50/70 border-orange-200 hover:border-orange-400' : 'bg-purple-50/70 border-purple-200 hover:border-purple-400');

  return (
    <button 
      onClick={onClick} 
      className={`w-44 h-48 rounded-3xl p-4 flex flex-col hover:shadow-xl transition-all duration-300 cursor-pointer text-left relative active:scale-95 border shadow-sm overflow-hidden ${bgClass}`}
    >
      {/* Banner vermelho destacando o dia que foi aberta caso seja antiga */}
      {abertura.isOutroDia && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[9px] font-black text-center uppercase py-1.5 tracking-widest shadow-md">
          Aberto dia {abertura.dataCurta}
        </div>
      )}

      {/* Margem superior dinâmica para empurrar o conteúdo caso o banner esteja ativado */}
      <div className={`flex flex-col mb-2 w-full gap-1 ${abertura.isOutroDia ? 'mt-4' : ''}`}>
        <div className="flex justify-between items-start w-full gap-2">
          <h3 className={`font-black text-sm uppercase leading-snug line-clamp-2 break-words pr-1 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
            {comanda.nome}
          </h3>
          <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md shrink-0 border mt-0.5 ${
            abertura.isOutroDia
              ? (temaNoturno ? 'bg-gray-700 text-gray-300 border-gray-500' : 'bg-white text-gray-600 border-gray-400')
              : isDelivery 
                ? (temaNoturno ? 'bg-orange-900/50 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-700 border-orange-300') 
                : (temaNoturno ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-300')
          }`}>
            {comanda.tipo.substring(0, 3)}
          </span>
        </div>
        
        {comanda.hora_abertura && (
          <span className={`text-[10px] font-medium flex items-center gap-1 mt-1 w-fit ${
            abertura.isOutroDia 
              ? (temaNoturno ? 'bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded-md border border-red-800/50' : 'bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md border border-red-200')
              : (temaNoturno ? 'text-gray-400' : 'text-gray-600')
          }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {abertura.texto}
          </span>
        )}
      </div>

      {comanda.tags && comanda.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 w-full pb-1 overflow-hidden h-8">
          {comanda.tags.map(tag => (
            <span key={tag} className={`text-[9px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap border shrink-0 ${
              temaNoturno ? 'bg-gray-800/50 text-gray-300 border-gray-600' : 'bg-white/60 text-gray-600 border-gray-300'
            }`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={`mt-auto pt-3 border-t w-full ${temaNoturno ? 'border-gray-700/50' : 'border-gray-300/50'}`}>
        <div className={`flex justify-between items-center text-[10px] font-bold mb-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
          <span>Itens: {comanda.produtos?.length || 0}</span>
        </div>
        <p className={`font-black text-xl tracking-tight ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>
          <span className="text-[10px] opacity-70">R$</span> {restante.toFixed(2)}
        </p>
      </div>
    </button>
  );
}