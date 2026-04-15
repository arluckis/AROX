'use client';
import React from 'react';
import dynamic from 'next/dynamic';

import { useFidelidade } from '@/hooks/useFidelidade';
import ErrorBoundary from './ui/ErrorBoundary';
import { SkeletonRanking } from './TabFidelidade/SkeletonsFid';

const PerfilCliente = dynamic(() => import('./TabFidelidade/WidgetsFid').then(m => m.PerfilCliente), { ssr: false });

export default function TabFidelidade({ temaNoturno, sessao, mostrarAlerta, clientesFidelidade, setClientesFidelidade, comandas }) {
  
  const ctx = useFidelidade({ temaNoturno, sessao, mostrarAlerta, clientesFidelidade, setClientesFidelidade, comandas });
  
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const bgPrincipal = temaNoturno ? 'bg-[#050505]' : 'bg-[#FAFAFA]';
  const surfaceBase = temaNoturno ? 'bg-[#0A0A0A]/80 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl';
  const surfaceHover = temaNoturno ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]';
  const textPrincipal = temaNoturno ? 'text-zinc-100' : 'text-zinc-900';
  const textSecundario = temaNoturno ? 'text-zinc-500' : 'text-zinc-500'; 
  const bordaBase = temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]';
  const bordaDestaque = temaNoturno ? 'border-white/[0.08]' : 'border-black/[0.08]';
  const btnArox = temaNoturno ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-zinc-900 text-white hover:bg-black shadow-[0_2px_10px_rgba(0,0,0,0.1)]';
  const modalBackdrop = temaNoturno ? 'bg-black/60' : 'bg-white/40';
  const surfaceModal = temaNoturno ? 'bg-[#0A0A0C] border-white/[0.08]' : 'bg-white/90 backdrop-blur-2xl border-black/[0.05] shadow-2xl';

  const tabs = [{ id: 'clientes', label: 'Clientes' }, { id: 'ranking', label: 'Pódio' }, { id: 'config', label: 'Regras da Premiação' }];

  return (
    <div className={`w-full h-full flex flex-col font-sans overflow-hidden ${bgPrincipal} ${textPrincipal}`}>
      <style dangerouslySetInnerHTML={{__html: `.arox-cinematic { animation: arox-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); } .arox-scale-in { animation: arox-zoom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; } @keyframes arox-fade-up { 100% { opacity: 1; transform: translateY(0); } } @keyframes arox-zoom { 0% { transform: scale(0.97); opacity: 0; } 100% { transform: scale(1); opacity: 1; } } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}} />

      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 shrink-0 border-b mb-6 px-4 md:px-6 transition-colors duration-300 ${bordaDestaque}`}>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {tabs.map(tab => (
            <button key={tab.id} onMouseEnter={() => ctx.setAbaInterna(tab.id)} onClick={() => ctx.setAbaInterna(tab.id)} className={`relative py-3 text-[11px] font-bold tracking-[0.05em] uppercase transition-colors duration-300 ${ctx.abaInterna === tab.id ? (temaNoturno ? 'text-white' : 'text-black') : `${textSecundario} hover:${textPrincipal}`}`}>
              {tab.label}
              {ctx.abaInterna === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_-1px_8px_rgba(16,185,129,0.4)]" />}
            </button>
          ))}
        </div>

        {ctx.abaInterna === 'clientes' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end arox-cinematic" style={{animationDelay: '0ms'}}>
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={ctx.fileInputRef} onChange={ctx.acionarImportacao} />
            <div className="flex w-full sm:w-auto bg-transparent rounded-xl border border-dashed overflow-hidden shadow-sm" style={{borderColor: temaNoturno ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}}>
               <button onClick={() => ctx.fileInputRef.current?.click()} className={`flex-1 sm:flex-none px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:bg-zinc-500/10 ${temaNoturno ? 'text-zinc-300 hover:text-white border-r border-white/10' : 'text-zinc-600 hover:text-black border-r border-black/10'}`}>Excel / CSV</button>
               <button onClick={() => ctx.setMostrarModalTexto(true)} className={`flex-1 sm:flex-none px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:bg-zinc-500/10 ${temaNoturno ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-black'}`}>Colar Lista</button>
            </div>
            <button onClick={() => { ctx.setClienteEditando(null); ctx.setNovoCliente({nome:'', telefone:'', aniversario:'', pontos:0}); ctx.setMostrarModalNovo(true); }} className={`w-full sm:w-auto px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 active:scale-95 border border-transparent ${btnArox}`}>+ Integrar Cliente</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-16 scrollbar-hide px-4 md:px-6 relative z-10 w-full">
        {ctx.abaInterna === 'clientes' && (
          <ErrorBoundary codigoErro="ERR-FID-LIST-101" modulo="Lista de Clientes" temaNoturno={temaNoturno} fallbackClassName="w-full h-64">
            <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row gap-3 w-full mb-6 arox-cinematic" style={{animationDelay: '0ms'}}>
                <div className={`relative w-full sm:w-80 flex items-center rounded-xl border transition-all duration-300 focus-within:border-emerald-500/40 shadow-sm ${surfaceBase} ${bordaDestaque}`}>
                  <div className="pl-3 opacity-40"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
                  <input type="text" placeholder="Buscar cliente..." value={ctx.busca} onChange={e => ctx.setBusca(e.target.value)} className="w-full bg-transparent border-none outline-none py-2.5 px-3 text-[13px] font-bold placeholder:text-zinc-500" />
                </div>
                <div className={`flex items-center p-1 rounded-xl border shadow-sm overflow-x-auto scrollbar-hide w-full sm:w-auto ${surfaceBase} ${bordaDestaque}`}>
                  {[{id:'todos', l:'Todos'}, {id:'resgate', l:'Prontos'}, {id:'quase', l:'Aquecidos'}, {id:'inativos', l:'Inativos'}].map(f => (
                    <button key={f.id} onClick={() => ctx.setFiltroCategoria(f.id)} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 shrink-0 ${ctx.filtroCategoria === f.id ? (temaNoturno ? 'bg-white/10 text-white shadow-sm' : 'bg-black/5 text-black shadow-sm') : `bg-transparent ${textSecundario} hover:${textPrincipal}`}`}>{f.l}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                {ctx.clientesFiltrados.length === 0 ? (
                  <div className={`py-24 text-center rounded-[24px] border border-dashed ${bordaDestaque} arox-cinematic`}><p className="text-[15px] font-bold mb-1">Radar Limpo</p><p className={`text-[13px] ${textSecundario}`}>Nenhum cliente atende aos filtros atuais.</p></div>
                ) : (
                  ctx.clientesFiltrados.map((c, idx) => {
                    const atingiu = c.pontos >= ctx.meta.pontos_necessarios; const percent = Math.min((c.pontos / ctx.meta.pontos_necessarios) * 100, 100); const inativo = c.pontos === 0; const quaseLa = percent >= 75 && !atingiu; const superVIP = c.pontos_totais > ctx.meta.pontos_necessarios * 3;
                    let cardStyle = `${surfaceBase} ${bordaBase}`;
                    if (atingiu) cardStyle = temaNoturno ? 'bg-[#06120D] border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-500/30';
                    else if (quaseLa) cardStyle = temaNoturno ? 'bg-[#120D06] border-amber-500/20' : 'bg-amber-50/50 border-amber-500/30';
                    else if (inativo) cardStyle = `${surfaceBase} ${bordaBase} opacity-70 hover:opacity-100 transition-all duration-500`;

                    return (
                      <div key={c.id} onClick={() => ctx.setClientePerfil(c)} className={`group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-[20px] border transition-all duration-300 ease-out w-full ${cardStyle} ${!inativo && surfaceHover} hover:shadow-md cursor-pointer`} style={{ animationDelay: `${(idx * 20) + 50}ms` }}>
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black shrink-0 transition-transform duration-500 group-hover:scale-105 ${atingiu ? 'bg-emerald-500 text-white' : quaseLa ? 'bg-amber-500 text-white' : (temaNoturno ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-700')}`}>
                            {c.nome.charAt(0).toUpperCase()}{atingiu && <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-20" />}
                          </div>
                          <div className="min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-[15px] font-bold truncate group-hover:text-emerald-500 transition-colors">{c.nome}</p>
                              {superVIP && !atingiu && <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">Fiel</div>}
                              {quaseLa && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Próximo do resgate" />}{atingiu && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Pronto" />}
                            </div>
                            <p className={`text-[12px] font-medium truncate ${textSecundario}`}>{c.telefone || 'Nenhum telefone'}</p>
                          </div>
                        </div>
                        <div className="hidden md:flex flex-col justify-center w-56 lg:w-80 mr-8 mt-4 md:mt-0">
                          <div className="flex justify-between items-end mb-2"><span className={`text-[10px] font-bold uppercase tracking-widest ${atingiu ? 'text-emerald-500' : textSecundario}`}>Pontos Acumulados</span><div className="flex items-baseline gap-1"><span className={`text-[14px] font-bold ${atingiu ? 'text-emerald-500' : textPrincipal}`}>{c.pontos}</span><span className={`text-[11px] font-medium ${textSecundario}`}>/ {ctx.meta.pontos_necessarios}</span></div></div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${temaNoturno ? 'bg-white/5' : 'bg-black/10'}`}><div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${atingiu ? 'bg-emerald-500' : quaseLa ? 'bg-amber-500' : (temaNoturno ? 'bg-zinc-500' : 'bg-zinc-500')}`} style={{ width: `${percent}%` }} /></div>
                        </div>
                        <div className="flex items-center justify-end gap-3 shrink-0 mt-4 md:mt-0" onClick={e => e.stopPropagation()}>
                          {atingiu ? (<button onClick={() => ctx.setClienteResgate(c)} className="relative group/btn px-5 py-2.5 rounded-xl overflow-hidden active:scale-95 transition-transform"><div className="absolute inset-0 bg-emerald-500 transition-opacity duration-300 hover:opacity-90" /><span className="relative text-[10px] font-bold uppercase tracking-wider text-white">Resgatar</span></button>) : (<div className="w-20" />)}
                          <button onClick={() => ctx.abrirEdicao(c)} className={`p-2.5 rounded-xl transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 ${temaNoturno ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-500 hover:text-black'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </ErrorBoundary>
        )}

        {ctx.abaInterna === 'ranking' && (
          <ErrorBoundary codigoErro="ERR-FID-RANK-202" modulo="Pódio de Clientes" temaNoturno={temaNoturno} fallbackClassName="w-full h-64">
            <div className="animate-in fade-in duration-500 w-full mx-auto pt-4 md:pt-6">
              {ctx.ranking.length === 0 ? (
                <div className={`py-16 text-center rounded-[24px] border border-dashed ${bordaDestaque} arox-cinematic`}><p className={`text-[13px] ${textSecundario}`}>Sem histórico para ranking.</p></div>
              ) : (
                <div className="flex flex-col gap-6 md:gap-10 w-full">
                  <div className="flex flex-col items-center justify-center relative arox-cinematic w-full" style={{animationDelay: '50ms'}}>
                    <div onClick={() => ctx.setClientePerfil(ctx.ranking[0])} className={`relative z-10 flex flex-col items-center p-6 md:p-8 rounded-[32px] border transition-all duration-500 cursor-pointer hover:scale-[1.02] ${temaNoturno ? 'bg-gradient-to-b from-[#14120C] to-[#0A0A0A] border-amber-500/20 shadow-[0_10px_40px_rgba(245,158,11,0.05)]' : 'bg-gradient-to-b from-amber-50/50 to-white/50 backdrop-blur-xl border-amber-200 shadow-[0_10px_40px_rgba(245,158,11,0.08)]'} w-full max-w-sm text-center`}>
                      <div className="absolute -top-3 px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">Cliente mais Popular</div>
                      <div className="w-14 h-14 mb-4 rounded-full flex items-center justify-center text-2xl font-black bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-sm">{ctx.ranking[0].nome.charAt(0).toUpperCase()}</div>
                      <h2 className={`text-2xl md:text-3xl font-bold tracking-tight mb-1 truncate w-full px-4 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>{ctx.ranking[0].nome}</h2>
                      <div className="mt-2 flex items-baseline gap-1.5"><span className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-amber-700 dark:from-amber-400 dark:to-amber-600">{ctx.ranking[0].pontos_totais || ctx.ranking[0].pontos}</span><span className={`text-[11px] font-bold uppercase tracking-widest ${textSecundario}`}>Pontos Totais</span></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5 w-full">
                    {ctx.ranking.slice(1).map((c, idx) => (
                      <div key={c.id} onClick={() => ctx.setClientePerfil(c)} className={`group flex flex-col p-5 md:p-6 rounded-[24px] border transition-all duration-300 cursor-pointer ${surfaceBase} ${bordaBase} hover:border-zinc-500/20 hover:-translate-y-1 hover:shadow-lg arox-cinematic w-full`} style={{ animationDelay: `${(idx * 30) + 100}ms` }}>
                        <div className="flex justify-between items-start mb-4 md:mb-5">
                          <div className={`text-xl font-black ${idx === 0 ? 'text-zinc-400' : idx === 1 ? 'text-amber-800/60' : textSecundario}`}>#{idx + 2}</div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black ${temaNoturno ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`}>{c.nome.charAt(0).toUpperCase()}</div>
                        </div>
                        <p className="text-[15px] md:text-[16px] font-bold tracking-tight mb-1 truncate group-hover:text-emerald-500 transition-colors">{c.nome}</p>
                        <div className="mt-auto pt-4 flex items-baseline gap-1 border-t border-dashed border-zinc-500/20"><p className="text-2xl font-black">{c.pontos_totais || c.pontos}</p><p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${textSecundario}`}>LTV Acumulado</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}

        {ctx.abaInterna === 'config' && (
          <ErrorBoundary codigoErro="ERR-FID-CONF-404" modulo="Regras Premiação" temaNoturno={temaNoturno} fallbackClassName="w-full h-64">
            <div className="animate-in fade-in duration-500 w-full mx-auto pt-4 md:pt-6 relative">
              <div className={`relative z-10 p-6 md:p-10 rounded-[32px] border shadow-sm w-full ${surfaceBase} ${bordaDestaque} arox-cinematic`}>
                <div className="mb-8"><h2 className="text-2xl font-bold tracking-tight mb-2">Regras de Fidelidade</h2><p className={`text-[13px] font-medium ${textSecundario}`}>Ajuste a mecânica de pontos.</p></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full">
                  <div className="flex flex-col gap-6 w-full">
                    <div className="grid grid-cols-2 gap-5 w-full">
                      <div className="group relative w-full">
                        <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors ${textSecundario} group-focus-within:text-emerald-500`}>Pontos Necessários</label>
                        <input type="number" value={ctx.meta.pontos_necessarios} onChange={e => ctx.setMeta({...ctx.meta, pontos_necessarios: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-all duration-300 focus:border-emerald-500/50 ${bordaBase}`} />
                      </div>
                      <div className="group relative w-full">
                        <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors ${textSecundario} group-focus-within:text-emerald-500`}>Valor Mínimo (R$)</label>
                        <input type="number" value={ctx.meta.valor_minimo} onChange={e => ctx.setMeta({...ctx.meta, valor_minimo: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-all duration-300 focus:border-emerald-500/50 ${bordaBase}`} />
                      </div>
                    </div>
                    <div className="group relative w-full">
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors ${textSecundario} group-focus-within:text-emerald-500`}>Prêmio do Resgate</label>
                      <input type="text" value={ctx.meta.premio} onChange={e => ctx.setMeta({...ctx.meta, premio: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-all duration-300 focus:border-emerald-500/50 ${bordaBase}`} />
                    </div>
                    <div className="pt-4 w-full"><button onClick={ctx.atualizarMeta} className={`w-full md:w-auto px-8 py-3.5 text-[12px] font-bold uppercase tracking-widest rounded-xl active:scale-95 transition-transform border border-transparent ${btnArox}`}>Salvar Regras</button></div>
                  </div>
                  <div className={`rounded-[32px] border relative flex flex-col justify-center overflow-hidden transition-all duration-500 w-full shadow-inner ${temaNoturno ? 'bg-[#0b141a] border-[#202c33]' : 'bg-[#efeae2] border-[#d1d7db]'}`}>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.20] dark:opacity-[0.10]" style={{ backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundSize: '400px' }} />
                    <div className="relative z-10 px-6 py-10 flex flex-col h-full w-full">
                      <div className="flex justify-between items-start mb-8 z-20 w-full">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${temaNoturno ? 'bg-white/10 text-zinc-300' : 'bg-black/10 text-zinc-800'}`}>Visão do Cliente</div>
                        <button onClick={ctx.copiarRegrasWhatsApp} className={`px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-md backdrop-blur-xl flex items-center gap-2 ${ctx.copiado ? 'bg-emerald-500 text-white' : (temaNoturno ? 'bg-[#202c33] text-white hover:bg-[#2a3942]' : 'bg-white/90 text-black hover:bg-white')}`}>
                          {ctx.copiado ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>}
                          <span className="text-[11px] font-bold uppercase tracking-wider">{ctx.copiado ? 'Copiado!' : 'Copiar Texto'}</span>
                        </button>
                      </div>
                      <div className="flex items-start justify-end w-full relative">
                         <div className={`relative max-w-[85%] px-4 py-3 rounded-[16px] rounded-tr-none shadow-[0_2px_4px_rgba(0,0,0,0.1)] ${temaNoturno ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#d9fdd3] text-[#111b21]'}`}>
                            <div className={`absolute top-0 -right-[10px] w-0 h-0 border-t-[0px] border-t-transparent border-l-[12px] ${temaNoturno ? 'border-l-[#005c4b]' : 'border-l-[#d9fdd3]'} border-b-[14px] border-b-transparent`} />
                            <p className="text-[14px] font-bold mb-2">*COMO VAI FUNCIONAR:*</p>
                            <ul className="text-[14px] space-y-1.5 leading-snug mb-2"><li>• A cada compra maior que *R$ {ctx.meta.valor_minimo}*, você ganha 1 ponto.</li><li>• Quando acumular *{ctx.meta.pontos_necessarios} pontos*, você estará pronto para o resgate.</li><li>• O sistema indicará que você ganhou: *{ctx.meta.premio}*.</li></ul>
                            <div className="flex justify-end items-center gap-1.5 opacity-70 mt-1"><span className="text-[11px] font-medium">{new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span><svg viewBox="0 0 16 11" width="18" height="12" className={`${temaNoturno ? 'text-[#53bdeb]' : 'text-[#53bdeb]'}`}><path fill="currentColor" d="M11.8 1.1l-6.8 7.3L1.5 5 0 6.6l5 5.3L13.3 2.7l-1.5-1.6zm3.9-.1L10.5 6.4 9 4.9l5.2-5.5 1.5 1.6z"/></svg></div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ErrorBoundary>
        )}
      </div>

      {ctx.mostrarModalTexto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${modalBackdrop}`} onClick={() => ctx.setMostrarModalTexto(false)} />
          <div className={`relative w-full max-w-xl p-8 rounded-[32px] flex flex-col gap-5 arox-scale-in border ${surfaceModal}`}>
            <h2 className="text-2xl font-bold tracking-tight">Importação Rápida</h2>
            <p className={`text-[13px] leading-relaxed font-medium ${textSecundario}`}>Cole os dados dos clientes de uma planilha.<br/>Padrão: <strong className={textPrincipal}>NOME | TELEFONE | ANIVERSARIO | PONTOS</strong>.</p>
            <textarea rows="6" value={ctx.textoColado} onChange={e => ctx.setTextoColado(e.target.value)} className={`w-full p-5 rounded-[20px] border bg-transparent outline-none text-[14px] font-mono leading-relaxed transition-all focus:border-emerald-500/50 resize-none shadow-inner ${bordaBase}`} />
            <div className="flex justify-end gap-3 mt-4"><button onClick={() => ctx.setMostrarModalTexto(false)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors border border-transparent ${temaNoturno ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-zinc-600'}`}>Cancelar</button><button onClick={() => ctx.processarTextoImportacao(ctx.textoColado)} className={`px-6 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-transparent active:scale-95 transition-all ${btnArox}`}>Processar Lista</button></div>
          </div>
        </div>
      )}

      {ctx.mostrarModalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${modalBackdrop}`} onClick={() => ctx.setMostrarModalNovo(false)} />
          <div className={`relative w-full max-w-md p-8 rounded-[32px] flex flex-col gap-6 arox-scale-in border ${surfaceModal}`}>
            <h2 className="text-2xl font-bold tracking-tight">{ctx.clienteEditando ? 'Editar Cliente' : 'Integrar Novo Cliente'}</h2>
            <div className="flex flex-col gap-5">
              <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Nome do Cliente *</label><input type="text" value={ctx.novoCliente.nome} onChange={e => ctx.setNovoCliente({...ctx.novoCliente, nome: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-colors focus:border-emerald-500/50 shadow-inner ${bordaBase}`} /></div>
              <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Telefone (Whats)</label><input type="text" value={ctx.novoCliente.telefone} onChange={e => ctx.setNovoCliente({...ctx.novoCliente, telefone: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-colors focus:border-emerald-500/50 shadow-inner ${bordaBase}`} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Aniversário</label><input type="date" value={ctx.novoCliente.aniversario} onChange={e => ctx.setNovoCliente({...ctx.novoCliente, aniversario: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-colors focus:border-emerald-500/50 shadow-inner ${bordaBase} ${temaNoturno ? '[color-scheme:dark]' : ''}`} /></div>
                <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Pontos Iniciais</label><input type="number" value={ctx.novoCliente.pontos} onChange={e => ctx.setNovoCliente({...ctx.novoCliente, pontos: parseInt(e.target.value) || 0})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-colors focus:border-emerald-500/50 shadow-inner ${bordaBase}`} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4"><button onClick={() => ctx.setMostrarModalNovo(false)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors border border-transparent ${temaNoturno ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-zinc-600'}`}>Cancelar</button><button onClick={ctx.salvarNovoCliente} className={`px-6 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-transparent active:scale-95 transition-all ${btnArox}`}>Salvar</button></div>
          </div>
        </div>
      )}

      {ctx.clientePerfil && (
        <ErrorBoundary codigoErro="ERR-FID-PERF-505" modulo="Perfil Cliente" temaNoturno={temaNoturno} fallbackClassName="fixed inset-0 z-50">
          <PerfilCliente temaNoturno={temaNoturno} clientePerfil={ctx.clientePerfil} setClientePerfil={ctx.setClientePerfil} comandas={comandas} meta={ctx.meta} obterDiagnostico={ctx.obterDiagnostico} formatarData={ctx.formatarData} diasSemana={diasSemana} />
        </ErrorBoundary>
      )}

      {ctx.clienteResgate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${modalBackdrop}`} onClick={() => ctx.setClienteResgate(null)} />
          <div className={`relative w-full max-w-sm p-8 md:p-10 rounded-[32px] shadow-2xl border arox-scale-in flex flex-col items-center text-center ${surfaceModal} ${temaNoturno ? 'border-emerald-500/20' : 'border-emerald-500/40'}`}>
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg></div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Liberar Prêmio</h2>
            <p className={`text-[13px] mb-8 leading-relaxed font-medium ${textSecundario}`}>Confirmar resgate de <strong className={textPrincipal}>{ctx.meta.premio}</strong>? Pontos serão deduzidos do saldo.</p>
            <div className="flex flex-col gap-3 w-full relative z-10"><button onClick={ctx.confirmarResgatePremio} className="w-full py-3.5 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.3)] hover:bg-emerald-600 active:scale-95 transition-all">Confirmar e Descontar</button><button onClick={() => ctx.setClienteResgate(null)} className={`w-full py-3.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors border border-transparent ${temaNoturno ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-zinc-600'}`}>Cancelar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}