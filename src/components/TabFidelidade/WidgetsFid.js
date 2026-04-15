'use client';
import React, { useState } from 'react';

const textSecundario = (tema) => tema ? 'text-zinc-500' : 'text-zinc-500';
const textPrincipal = (tema) => tema ? 'text-zinc-100' : 'text-zinc-900';
const bordaDestaque = (tema) => tema ? 'border-white/[0.08]' : 'border-black/[0.08]';

export const PerfilCliente = ({ temaNoturno, clientePerfil, setClientePerfil, comandas, meta, obterDiagnostico, formatarData, diasSemana }) => {
  const [diaClienteHover, setDiaClienteHover] = useState(null);
  
  let produtosDoCliente = []; let diasFrequencia = Array.from({length: 7}, () => ({ count: 0, produtos: {} })); let ticketMedio = 0;
  if (clientePerfil) {
     const comandasDele = (comandas || []).filter(c => c.nome?.toLowerCase() === clientePerfil.nome?.toLowerCase());
     const contagemGlobal = {}; let totalGasto = 0;
     comandasDele.forEach(c => {
        totalGasto += (c.produtos || []).reduce((acc, p) => acc + (p.preco || 0), 0);
        const dia = (c.created_at || c.data_hora || c.data) ? new Date(c.created_at || c.data_hora || c.data).getDay() : -1;
        if(dia >= 0 && dia <= 6) diasFrequencia[dia].count++;
        (c.produtos || []).forEach(p => {
           const n = p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim().toUpperCase();
           contagemGlobal[n] = (contagemGlobal[n] || 0) + 1;
           if(dia >= 0 && dia <= 6) diasFrequencia[dia].produtos[n] = (diasFrequencia[dia].produtos[n] || 0) + 1;
        });
     });
     ticketMedio = comandasDele.length ? (totalGasto / comandasDele.length) : 0;
     produtosDoCliente = Object.entries(contagemGlobal).map(([nome, qtd]) => ({ nome, qtd })).sort((a,b) => b.qtd - a.qtd);
  }
  const maxDias = Math.max(...diasFrequencia.map(d => d.count), 1);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${temaNoturno ? 'bg-black/60' : 'bg-white/40'}`} onClick={() => setClientePerfil(null)} />
      <div className={`relative w-full max-w-3xl p-8 md:p-10 rounded-[32px] flex flex-col gap-6 md:gap-8 arox-scale-in border max-h-[95vh] overflow-y-auto scrollbar-hide ${temaNoturno ? 'bg-[#0A0A0C] border-white/[0.08]' : 'bg-white/90 backdrop-blur-2xl border-black/[0.05] shadow-2xl'}`}>
        <button onClick={() => setClientePerfil(null)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mt-4 md:mt-0">
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-black shrink-0 shadow-sm ${temaNoturno ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-800'}`}>{clientePerfil.nome.charAt(0).toUpperCase()}</div>
          <div className="flex-1 min-w-0 pr-6">
            <div className={`inline-block mb-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${obterDiagnostico(clientePerfil).bg} ${obterDiagnostico(clientePerfil).color} ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>{obterDiagnostico(clientePerfil).label}</div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{clientePerfil.nome}</h2>
            <p className={`text-[13px] font-medium ${textSecundario(temaNoturno)}`}>{clientePerfil.telefone || 'Sem contato'} • Integrado em {formatarData(clientePerfil.created_at)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-[20px] border relative overflow-hidden shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            {clientePerfil.pontos >= meta.pontos_necessarios && <div className="absolute inset-0 bg-emerald-500/5" />}
            <p className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario(temaNoturno)}`}>Pontos Atuais</p>
            <div className="relative z-10 flex items-baseline gap-1.5"><p className="text-3xl md:text-4xl font-black tracking-tighter">{clientePerfil.pontos}</p><span className={`text-[10px] font-bold uppercase tracking-wider ${textSecundario(temaNoturno)}`}>/ {meta.pontos_necessarios}</span></div>
          </div>
          <div className={`p-5 rounded-[20px] border relative overflow-hidden shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            <p className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario(temaNoturno)}`}>Histórico (LTV)</p>
            <div className="relative z-10 flex items-baseline gap-1.5"><p className="text-3xl md:text-4xl font-black tracking-tighter">{clientePerfil.pontos_totais || clientePerfil.pontos}</p></div>
          </div>
          <div className={`col-span-2 p-5 rounded-[20px] border relative overflow-hidden flex flex-col justify-center shadow-sm ${temaNoturno ? 'bg-gradient-to-r from-emerald-900/10 to-transparent border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-transparent border-emerald-200'}`}>
            <p className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario(temaNoturno)}`}>Ticket Médio Gasto</p>
            <div className="relative z-10 flex items-baseline gap-1.5"><span className={`text-[15px] font-bold ${textSecundario(temaNoturno)}`}>R$</span><p className={`text-3xl md:text-4xl font-black tracking-tighter ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>{ticketMedio.toFixed(2).replace('.', ',')}</p></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
           <div className="flex flex-col h-full">
             <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-5 ${textSecundario(temaNoturno)}`}>Mapa de Visitas (Dias mais idos)</h3>
             <div className="flex items-end justify-between h-32 gap-2 md:gap-3 px-2 border-b border-dashed border-zinc-500/20 pb-2">
               {diasSemana.map((d, i) => (
                  <div key={d} onMouseEnter={() => setDiaClienteHover(i)} onMouseLeave={() => setDiaClienteHover(null)} className="flex flex-col items-center gap-2.5 w-full h-full cursor-crosshair group">
                     <div className={`relative w-full h-full flex flex-col justify-end rounded-lg overflow-hidden transition-colors ${diaClienteHover === i ? (temaNoturno ? 'bg-white/10' : 'bg-black/10') : (temaNoturno ? 'bg-white/5' : 'bg-black/5')}`}>
                        {diasFrequencia[i].count > 0 && <span className={`absolute -top-1 left-0 right-0 text-center text-[10px] font-bold transition-opacity -translate-y-full pb-1.5 z-10 ${diaClienteHover === i ? 'opacity-100' : 'opacity-0'}`}>{diasFrequencia[i].count}</span>}
                        <div className={`w-full rounded-sm transition-all duration-700 ${diasFrequencia[i].count === maxDias && maxDias > 0 ? 'bg-emerald-500' : (temaNoturno ? 'bg-zinc-600' : 'bg-zinc-400')}`} style={{ height: `${maxDias === 0 ? 0 : (diasFrequencia[i].count/maxDias)*100}%` }} />
                     </div>
                     <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${diaClienteHover === i ? (temaNoturno ? 'text-white' : 'text-black') : (diasFrequencia[i].count === maxDias && maxDias > 0 ? (temaNoturno ? 'text-emerald-400' : 'text-emerald-600') : textSecundario(temaNoturno))}`}>{d}</span>
                  </div>
               ))}
             </div>
             <div className={`mt-4 p-4 rounded-xl min-h-[5.5rem] transition-all flex flex-col justify-center shadow-inner ${temaNoturno ? 'bg-[#141414] border border-white/5' : 'bg-zinc-50 border border-black/5'}`}>
                {diaClienteHover !== null && diasFrequencia[diaClienteHover].count > 0 ? (
                   <div>
                     <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>{diasSemana[diaClienteHover]}: {diasFrequencia[diaClienteHover].count} Visitas</p>
                     <div className="flex flex-wrap gap-2">
                       {Object.entries(diasFrequencia[diaClienteHover].produtos).sort((a,b)=>b[1]-a[1]).slice(0, 3).map(([nome, qtd], idx) => <span key={idx} className={`text-[10px] font-bold px-2 py-1 rounded-md border ${temaNoturno ? 'bg-black/50 border-white/10 text-zinc-300' : 'bg-white border-black/10 text-zinc-700'}`}>{qtd}x {nome}</span>)}
                     </div>
                   </div>
                ) : (<p className={`text-[10px] font-bold uppercase tracking-widest text-center opacity-50 ${textSecundario(temaNoturno)}`}>Passe o mouse nas barras para detalhar</p>)}
             </div>
           </div>
           <div>
             <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-5 ${textSecundario(temaNoturno)}`}>Top Preferências (DNA de Consumo)</h3>
             {produtosDoCliente.length === 0 ? (
               <div className={`py-8 px-4 h-36 flex items-center justify-center text-center rounded-[20px] border border-dashed ${bordaDestaque(temaNoturno)}`}><p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Aguardando compras p/ análise</p></div>
             ) : (
               <div className="flex flex-wrap gap-3">
                 {produtosDoCliente.slice(0, 5).map((p, idx) => (
                   <div key={idx} className={`flex items-center gap-2.5 px-3 py-2 rounded-full border transition-colors ${temaNoturno ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-black/5 border-black/10 hover:border-black/20 shadow-sm'}`}>
                     <span className="text-[12px] font-bold tracking-tight max-w-[150px] truncate">{p.nome}</span><div className={`w-1 h-1 rounded-full ${temaNoturno ? 'bg-zinc-600' : 'bg-zinc-300'}`} /><span className={`text-[11px] font-black ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>{p.qtd}x</span>
                   </div>
                 ))}
                 {produtosDoCliente.length > 5 && <div className={`flex items-center justify-center px-4 py-2 rounded-full border border-dashed ${bordaDestaque(temaNoturno)}`}><span className={`text-[11px] font-bold ${textSecundario(temaNoturno)}`}>+{produtosDoCliente.length - 5} itens</span></div>}
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};