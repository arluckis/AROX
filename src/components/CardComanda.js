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
      className={`relative w-full sm:w-[280px] cursor-pointer rounded-2xl border p-5 transition-all duration-300 ease-out flex flex-col justify-between min-h-[140px] group overflow-hidden ${
        temaNoturno 
          ? 'bg-[#0A0A0A] border-white/5 hover:bg-[#121212] hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5' 
          : 'bg-white border-zinc-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-zinc-300/80 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5'
      }`}
    >
      {/* IDENTIDADE LOGÍSTICA SUTIL (Gradient Tint for Delivery) */}
      {isDelivery && (
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${temaNoturno ? 'bg-gradient-to-br from-amber-500/[0.03] to-transparent' : 'bg-gradient-to-br from-amber-500/[0.04] to-transparent'}`}></div>
      )}

      {/* HEADER DO CARD */}
      <div className="flex justify-between items-start gap-3 w-full relative z-10">
        <div className="flex flex-col min-w-0 gap-2">
          
          <div className="flex items-center gap-2">
            <h3 className={`font-medium text-base truncate tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {comanda.nome}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase ${
              isDelivery 
                ? (temaNoturno ? 'bg-amber-500/10 text-amber-500/90' : 'bg-amber-50 text-amber-700')
                : (temaNoturno ? 'bg-white/5 text-zinc-500' : 'bg-zinc-100 text-zinc-600')
            }`}>
              {isDelivery ? 'Delivery' : 'Local'}
            </span>
            
            {tempoTexto && (
               <span className={`text-xs font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>
                 {tempoTexto}
               </span>
            )}
          </div>

        </div>

        {/* STATUS VISUAL PREMIUM */}
        <div className="shrink-0 flex items-center justify-end">
          {isPagaTotal && (
             <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${temaNoturno ? 'bg-[#0A0A0A] text-emerald-400 ring-1 ring-inset ring-emerald-500/20' : 'bg-white text-emerald-600 ring-1 ring-inset ring-emerald-500/20 shadow-sm'}`}>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               Pago
             </div>
          )}
          {isPagaParcial && !isPagaTotal && (
             <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${temaNoturno ? 'bg-[#0A0A0A] text-blue-400 ring-1 ring-inset ring-blue-500/20' : 'bg-white text-blue-600 ring-1 ring-inset ring-blue-500/20 shadow-sm'}`}>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
               Parcial
             </div>
          )}
        </div>
      </div>

      {/* FOOTER DO CARD (Valor reinando absoluto) */}
      <div className="flex justify-between items-end mt-6 relative z-10">
        
        <div className="flex flex-col mb-1.5">
           <span className={`text-xs font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>
             {qtdProdutos === 0 ? 'Vazio' : `${qtdProdutos} ite${qtdProdutos === 1 ? 'm' : 'ns'}`}
           </span>
        </div>

        <div className="text-right flex flex-col items-end leading-none">
           {isPagaParcial && !isPagaTotal ? (
             <div className="flex flex-col items-end gap-1.5">
               <span className={`text-xs font-medium line-through decoration-zinc-400/50 ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>
                 R$ {totalOriginal.toFixed(2)}
               </span>
               <div className="flex items-baseline gap-1">
                 <span className={`text-sm font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                 <span className={`font-semibold text-2xl tabular-nums tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                   {totalPendente.toFixed(2)}
                 </span>
               </div>
             </div>
           ) : isPagaTotal ? (
             <div className="flex items-baseline gap-1">
               <span className={`text-sm font-medium ${temaNoturno ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>R$</span>
               <span className={`font-semibold text-2xl tabular-nums tracking-tight ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>
                 {totalOriginal.toFixed(2)}
               </span>
             </div>
           ) : (
             <div className="flex items-baseline gap-1">
               <span className={`text-sm font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>R$</span>
               <span className={`font-semibold text-2xl tabular-nums tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                 {totalOriginal.toFixed(2)}
               </span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}