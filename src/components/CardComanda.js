// src/components/CardComanda.js
'use client';

export default function CardComanda({ comanda, onClick, temaNoturno }) {
  const isDelivery = comanda.tipo === 'Delivery';
  
  // Cálculo do total
  const totalOriginal = (comanda.produtos || []).reduce((acc, p) => acc + (Number(p.preco) || 0), 0) + (Number(comanda.taxa_entrega) || 0);
  const totalPago = (comanda.pagamentos || []).reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
  const totalPendente = totalOriginal - totalPago;
  
  // Status de pagamento e produtos
  const isPagaParcial = totalPago > 0 && totalPendente > 0.01;
  const isPagaTotal = totalOriginal > 0 && totalPendente <= 0.01;
  const qtdProdutos = (comanda.produtos || []).length;
  
  // Tempo aberto
  const getTempoAberto = () => {
    if (!comanda.hora_abertura) return '';
    try {
      const ms = new Date() - new Date(comanda.hora_abertura);
      if (isNaN(ms) || ms < 0) return '';
      const minutos = Math.floor(ms / 60000);
      if (minutos < 60) return `${minutos}m`;
      const horas = Math.floor(minutos / 60);
      return `${horas}h ${minutos % 60}m`;
    } catch(e) { return ''; }
  };
  const tempoTexto = getTempoAberto();

  return (
    <div 
      onClick={onClick}
      className={`w-full sm:w-[260px] cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md active:scale-[0.98] h-[140px] ${
        temaNoturno 
          ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10' 
          : 'bg-white border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {/* HEADER DO CARD */}
      <div className="flex justify-between items-start gap-3 w-full">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-sm truncate tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {comanda.nome}
            </h3>
            {comanda.tags && comanda.tags.length > 0 && (
              <span className={`w-2 h-2 rounded-full shrink-0 ${temaNoturno ? 'bg-purple-500' : 'bg-purple-600'}`}></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
              isDelivery 
                ? (temaNoturno ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200')
                : (temaNoturno ? 'bg-white/5 text-zinc-400 border-white/10' : 'bg-zinc-50 text-zinc-500 border-zinc-200')
            }`}>
              {isDelivery ? 'Delivery' : 'Balcão'}
            </span>
            {tempoTexto && (
               <span className={`text-[10px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
                 {tempoTexto}
               </span>
            )}
          </div>
        </div>

        {/* STATUS VISUAL COMPACTO */}
        <div className="shrink-0 flex gap-1">
          {isPagaTotal && (
             <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${temaNoturno ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
             </div>
          )}
          {isPagaParcial && !isPagaTotal && (
             <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${temaNoturno ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
          )}
        </div>
      </div>

      {/* FOOTER DO CARD */}
      <div className={`flex justify-between items-end mt-4 pt-3 border-t ${temaNoturno ? 'border-white/5' : 'border-zinc-100'}`}>
        <div className="flex flex-col">
           <span className={`text-[11px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
             {qtdProdutos === 0 ? 'Vazio' : `${qtdProdutos} ite${qtdProdutos === 1 ? 'm' : 'ns'}`}
           </span>
        </div>
        <div className="text-right flex flex-col items-end">
           {isPagaParcial && !isPagaTotal ? (
             <>
               <span className={`text-[10px] font-medium line-through ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>R$ {totalOriginal.toFixed(2)}</span>
               <span className={`font-semibold text-sm ${temaNoturno ? 'text-blue-400' : 'text-blue-600'}`}>R$ {totalPendente.toFixed(2)}</span>
             </>
           ) : isPagaTotal ? (
             <span className={`font-semibold text-sm ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>R$ {totalOriginal.toFixed(2)}</span>
           ) : (
             <span className={`font-semibold text-sm ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
               R$ {totalOriginal.toFixed(2)}
             </span>
           )}
        </div>
      </div>
    </div>
  );
}