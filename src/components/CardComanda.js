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
  
  // Tempo aberto com cálculo de Semanas e Dias
  const getTempoAberto = () => {
    if (!comanda.hora_abertura) return '';
    try {
      const ms = new Date() - new Date(comanda.hora_abertura);
      if (isNaN(ms) || ms < 0) return '';
      
      const minutosTotais = Math.floor(ms / 60000);
      const minutos = minutosTotais % 60;
      
      const horasTotais = Math.floor(minutosTotais / 60);
      const horas = horasTotais % 24;
      
      const diasTotais = Math.floor(horasTotais / 24);
      const dias = diasTotais % 7;
        
      if (diasTotais > 0) {
        return horas > 0 ? `${diasTotais}d ${horas}h` : `${diasTotais}d`;
      }
      if (horasTotais > 0) {
        return minutos > 0 ? `${horasTotais}h ${minutos}m` : `${horasTotais}h`;
      }
      return `${minutosTotais}m`;
    } catch(e) { return ''; }
  };
  const tempoTexto = getTempoAberto();

  return (
    <div 
      onClick={onClick}
      className={`relative w-full sm:w-[280px] cursor-pointer rounded-2xl border p-5 transition-all duration-300 ease-out flex flex-col justify-between h-[152px] group overflow-hidden ${
        temaNoturno 
          ? 'bg-[#0A0A0A] border-white/[0.08] hover:border-white/[0.15] hover:shadow-lg' 
          : 'bg-white border-black/[0.08] hover:border-black/[0.15] hover:shadow-md'
      }`}
    >
      {/* IDENTIDADE LOGÍSTICA SUTIL */}
      {isDelivery && (
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${temaNoturno ? 'bg-gradient-to-br from-amber-500/[0.03] to-transparent' : 'bg-gradient-to-br from-amber-500/[0.04] to-transparent'}`}></div>
      )}

      {/* HEADER DO CARD */}
      <div className="flex justify-between items-start gap-3 w-full relative z-10">
        <div className="flex flex-col min-w-0 gap-1.5 w-full pr-2">
          
          <h3 className={`font-bold text-[15px] truncate tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
            {comanda.nome}
          </h3>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${
              isDelivery 
                ? (temaNoturno ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700')
                : (temaNoturno ? 'bg-white/5 border-white/5 text-zinc-400' : 'bg-black/5 border-black/5 text-zinc-600')
            }`}>
              {isDelivery ? 'Delivery' : 'Local'}
            </span>
            
            {tempoTexto && (
               <span className={`text-[10px] font-bold tracking-wider ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
                 {tempoTexto}
               </span>
            )}
          </div>
        </div>

        {/* STATUS VISUAL PREMIUM */}
        <div className="shrink-0 flex items-center justify-end">
          {isPagaTotal && (
             <div className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase border ${temaNoturno ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
               Pago
             </div>
          )}
          {isPagaParcial && !isPagaTotal && (
             <div className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase border ${temaNoturno ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
               Parcial
             </div>
          )}
        </div>
      </div>

      {/* FOOTER DO CARD (O valor riscado não aumenta a altura do card) */}
      <div className="flex justify-between items-end mt-auto relative z-10">
        
        <div className="flex flex-col mb-1">
           <span className={`text-[11px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
             {qtdProdutos === 0 ? 'Vazio' : `${qtdProdutos} ite${qtdProdutos === 1 ? 'm' : 'ns'}`}
           </span>
        </div>

        <div className="text-right flex flex-col items-end leading-none relative">
           {isPagaParcial && !isPagaTotal ? (
             <>
               {/* Preço original riscado posicionado de forma ABSOLUTA para não empurrar o layout pra baixo */}
               <span className={`absolute bottom-full right-0 mb-1 text-[11px] font-bold line-through opacity-40 ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>
                 R$ {totalOriginal.toFixed(2)}
               </span>
               <div className="flex items-baseline gap-1.5">
                 <span className={`text-[12px] font-bold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                 <span className={`font-black text-2xl tabular-nums tracking-tighter ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                   {totalPendente.toFixed(2)}
                 </span>
               </div>
             </>
           ) : isPagaTotal ? (
             <div className="flex items-baseline gap-1.5">
               <span className={`text-[12px] font-bold ${temaNoturno ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>R$</span>
               <span className={`font-black text-2xl tabular-nums tracking-tighter ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>
                 {totalOriginal.toFixed(2)}
               </span>
             </div>
           ) : (
             <div className="flex items-baseline gap-1.5">
               <span className={`text-[12px] font-bold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
               <span className={`font-black text-2xl tabular-nums tracking-tighter ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                 {totalOriginal.toFixed(2)}
               </span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}