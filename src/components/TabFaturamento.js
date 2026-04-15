'use client';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';

import { useMetricasFaturamento } from '@/hooks/useMetricasFaturamento';

import ErrorBoundary from './ui/ErrorBoundary';
import { SkeletonWidgetFat, SkeletonCardBase } from './TabFaturamento/SkeletonsFat';

const WidgetTermometro = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetTermometro), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[200px]" /> });
const WidgetLinhaTemporal = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetLinhaTemporal), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[200px]" /> });
const WidgetPagamentos = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetPagamentos), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[180px]" /> });
const WidgetMapaCalor = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetMapaCalor), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[200px]" /> });
const WidgetProdutos = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetProdutos), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[220px]" /> });
const WidgetCombo = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetCombo), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[180px]" /> });

const SortableItem = ({ id, children, temaNoturno, isOverlay, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging && !isOverlay ? 0.3 : 1, zIndex: isOverlay ? 999 : 1, animationDelay: `${index * 50}ms` };
  let colSpanClass = (id === 'linhaTemporal' || id === 'produtos') ? 'col-span-1 md:col-span-2 xl:col-span-2 2xl:col-span-3' : 'col-span-1'; 

  return (
    <div ref={setNodeRef} style={style} className={`${colSpanClass} relative group h-full w-full arox-cinematic ${isOverlay ? 'scale-[1.02] shadow-2xl rounded-[24px] cursor-grabbing !animate-none' : ''}`}>
      <div {...attributes} {...listeners} className={`absolute top-4 right-4 z-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing backdrop-blur-md ${temaNoturno ? 'hover:bg-white/10 text-zinc-500 hover:text-white' : 'hover:bg-black/5 text-zinc-400 hover:text-black'}`}>
        <GripHorizontal className="w-4 h-4" />
      </div>
      <div className={`h-full w-full ${isOverlay ? 'pointer-events-none' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default function TabFaturamento({
  temaNoturno, filtroTempo, setFiltroTempo, getHoje, getMesAtual, getAnoAtual,
  faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos, comandasFiltradas, comandas, caixaAtual 
}) {

  const [mostrarMenuPersonalizar, setMostrarMenuPersonalizar] = useState(false);
  const [widgets, setWidgets] = useState({ bruto: true, lucro: true, ticket: true, termometro: true, linhaTemporal: true, pagamentos: true, mapaCalor: true, produtos: true, combo: true }); 
  const [ordemGraficos, setOrdemGraficos] = useState(['termometro', 'linhaTemporal', 'pagamentos', 'mapaCalor', 'produtos', 'combo']);
  const [activeId, setActiveId] = useState(null); 

  const strHoje = getHoje?.() || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const strMesAtual = getMesAtual?.() || ''; const strAnoAtual = getAnoAtual?.() || '';
  const fTipo = filtroTempo?.tipo || ''; const fValor = filtroTempo?.valor || '';
  const fInicio = filtroTempo?.inicio || ''; const fFim = filtroTempo?.fim || '';
  const fatTotalSafe = faturamentoTotal || 0; const lucroSafe = lucroEstimado || 0;
  const totalComandas = (comandasFiltradas || []).length; const ticketMedio = totalComandas > 0 ? (fatTotalSafe / totalComandas) : 0;

  const metricas = useMetricasFaturamento({
    comandas, comandasFiltradas, fTipo, fValor, fInicio, fFim, strHoje, strMesAtual, strAnoAtual, fatTotalSafe, dadosPizza, rankingProdutos, temaNoturno
  });

  useEffect(() => {
    const ws = localStorage.getItem('bessa_widgets_faturamento_v10');
    const os = localStorage.getItem('bessa_ordem_faturamento_v10');
    if (ws) setWidgets(JSON.parse(ws));
    if (os) setOrdemGraficos(JSON.parse(os));
  }, []);

  const toggleWidget = (chave) => { const n = { ...widgets, [chave]: !widgets[chave] }; setWidgets(n); localStorage.setItem('bessa_widgets_faturamento_v10', JSON.stringify(n)); };
  const handleReorder = (novaOrdem) => { setOrdemGraficos(novaOrdem); localStorage.setItem('bessa_ordem_faturamento_v10', JSON.stringify(novaOrdem)); };

  const mudarTempo = (direcao) => {
    if (fTipo === 'dia') {
      const [ano, mes, dia] = (fValor || strHoje).split('-').map(Number); const dataObj = new Date(ano, mes - 1, dia); dataObj.setDate(dataObj.getDate() + direcao);
      setFiltroTempo({ ...filtroTempo, valor: `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}` });
    } else if (fTipo === 'mes') {
      const [ano, mes] = (fValor || strMesAtual).split('-').map(Number); const dataObj = new Date(ano, mes - 1, 1); dataObj.setMonth(dataObj.getMonth() + direcao);
      setFiltroTempo({ ...filtroTempo, valor: `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}` });
    }
  };

  const podeAvancar = () => { if (fTipo === 'dia') return fValor < strHoje; if (fTipo === 'mes') return fValor < strMesAtual; return false; };

  const renderizarConteudoWidget = (id) => {
    switch(id) {
      case 'termometro': return (
        <ErrorBoundary codigoErro="ERR-FAT-TERM-101" modulo="Termômetro Fat" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[200px]">
          <WidgetTermometro temaNoturno={temaNoturno} semHistorico={metricas.semHistorico} fTipo={fTipo} fatTotalSafe={fatTotalSafe} fValor={fValor} strHoje={strHoje} diferenca={metricas.diferenca} percentualReal={metricas.percentualReal} percentualBarra={metricas.percentualBarra} bateuMeta={metricas.bateuMeta} diffAbsoluta={metricas.diffAbsoluta} />
        </ErrorBoundary>
      );
      case 'linhaTemporal': return (
        <ErrorBoundary codigoErro="ERR-FAT-LINE-202" modulo="Linha Temporal" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[200px]">
          <WidgetLinhaTemporal temaNoturno={temaNoturno} dadosGraficoAcumulado={metricas.dadosGraficoAcumulado} />
        </ErrorBoundary>
      );
      case 'pagamentos': return (
        <ErrorBoundary codigoErro="ERR-FAT-PAG-303" modulo="Pagamentos Fat" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[180px]">
          <WidgetPagamentos temaNoturno={temaNoturno} dadosPizza={dadosPizza} />
        </ErrorBoundary>
      );
      case 'mapaCalor': return (
        <ErrorBoundary codigoErro="ERR-FAT-HEAT-404" modulo="Mapa de Calor" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[200px]">
          <WidgetMapaCalor temaNoturno={temaNoturno} maxCalor={metricas.maxCalor} mapaCalor={metricas.mapaCalor} />
        </ErrorBoundary>
      );
      case 'produtos': return (
        <ErrorBoundary codigoErro="ERR-FAT-PROD-505" modulo="Produtos Fat" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[220px]">
          <WidgetProdutos temaNoturno={temaNoturno} rankingMaiusculo={metricas.rankingMaiusculo} />
        </ErrorBoundary>
      );
      case 'combo': return (
        <ErrorBoundary codigoErro="ERR-FAT-COMB-606" modulo="Combos Fat" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[180px]">
          <WidgetCombo temaNoturno={temaNoturno} topCombos={metricas.topCombos} />
        </ErrorBoundary>
      );
      default: return null;
    }
  };

  const widgetsVisiveis = useMemo(() => ordemGraficos.filter(id => widgets?.[id] && !(id === 'linhaTemporal' && fTipo !== 'dia')), [ordemGraficos, widgets, fTipo]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragEnd = (event) => {
    setActiveId(null); const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetsVisiveis.indexOf(active.id); const newIndex = widgetsVisiveis.indexOf(over.id);
      const novaOrdemVisivel = arrayMove(widgetsVisiveis, oldIndex, newIndex);
      handleReorder([...novaOrdemVisivel, ...ordemGraficos.filter(id => !widgetsVisiveis.includes(id))]);
    }
  };

  const cardSurface = temaNoturno ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/[0.04] shadow-lg' : 'bg-white/80 backdrop-blur-xl border border-black/[0.04] shadow-sm';

  return (
    <div className={`w-full max-w-full pb-8 mt-4 font-sans px-4 md:px-0 ${temaNoturno ? 'text-zinc-100 selection:bg-zinc-800' : 'text-zinc-900 selection:bg-zinc-200'}`}>
      <style dangerouslySetInnerHTML={{__html: `.arox-cinematic { animation: arox-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); } @keyframes arox-fade-up { 100% { opacity: 1; transform: translateY(0); } }`}} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full mb-6">
         <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className={`flex p-1.5 rounded-xl border shadow-sm w-full sm:w-auto ${temaNoturno ? 'bg-[#0A0A0A]/80 backdrop-blur-md border-white/10' : 'bg-white/80 backdrop-blur-md border-black/10'}`}>
              {['dia', '7 dias', 'mes', 'ano', 'periodo'].map(t => (
                 <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?strHoje:t==='mes'?strMesAtual:strAnoAtual})} 
                 className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ease-out ${fTipo === t ? (temaNoturno ? 'bg-white/10 text-white shadow-sm' : 'bg-black/5 text-zinc-900 shadow-sm') : (temaNoturno ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700')}`}>
                   {t}
                 </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(fTipo === 'dia' || fTipo === 'mes') && (
                <>
                  <button onClick={() => mudarTempo(-1)} className={`p-2.5 rounded-xl border hover:scale-105 active:scale-95 shadow-sm ${temaNoturno ? 'bg-[#0A0A0A] border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-black/10 text-zinc-500 hover:text-black'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <input type={fTipo === 'dia' ? 'date' : 'month'} value={fValor || ''} max={fTipo === 'dia' ? strHoje : strMesAtual} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} 
                    className={`px-4 py-2.5 text-center border rounded-xl outline-none text-[12px] font-bold uppercase w-full sm:w-36 ${temaNoturno ? 'bg-[#0A0A0A] border-white/10 [color-scheme:dark]' : 'bg-white border-black/10'}`} />
                  {podeAvancar() ? (
                    <button onClick={() => mudarTempo(1)} className={`p-2.5 rounded-xl border hover:scale-105 active:scale-95 shadow-sm ${temaNoturno ? 'bg-[#0A0A0A] border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-black/10 text-zinc-500 hover:text-black'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  ) : <div className="w-[42px]" />}
                </>
              )}
              {fTipo === 'periodo' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm w-full ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/10'}`}>
                  <input type="date" value={fInicio || ''} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`bg-transparent outline-none text-[11px] font-bold uppercase w-full ${temaNoturno ? '[color-scheme:dark]' : ''}`} />
                  <span className="text-[12px] font-medium opacity-30">/</span>
                  <input type="date" value={fFim || ''} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`bg-transparent outline-none text-[11px] font-bold uppercase w-full ${temaNoturno ? '[color-scheme:dark]' : ''}`} />
                </div>
              )}
            </div>
         </div>

         <button onClick={() => setMostrarMenuPersonalizar(!mostrarMenuPersonalizar)} className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 border ${temaNoturno ? 'bg-[#18181B] border-white/10 text-white hover:bg-zinc-800' : 'bg-white border-black/10 text-zinc-900 hover:bg-zinc-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            Personalizar Dashboard
         </button>
      </div>

      <AnimatePresence>
        {mostrarMenuPersonalizar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden w-full">
            <div className={`p-5 rounded-[24px] border mb-6 flex flex-wrap gap-3 w-full shadow-sm ${temaNoturno ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-black/10'}`}>
              {[{ id: 'bruto', label: 'Bruto' }, { id: 'lucro', label: 'Lucro' }, { id: 'ticket', label: 'Ticket' }, { id: 'termometro', label: 'Crescimento' }, { id: 'linhaTemporal', label: 'Linha Temporal' }, { id: 'pagamentos', label: 'Pagamentos' }, { id: 'produtos', label: 'Rentabilidade' }, { id: 'mapaCalor', label: 'Calor' }, { id: 'combo', label: 'Combos' }].map(item => (
                <label key={item.id} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border cursor-pointer transition-colors text-[10px] font-bold uppercase tracking-wider ${widgets?.[item.id] ? (temaNoturno ? 'bg-white/10 border-white/20 text-zinc-100' : 'bg-black/5 border-black/10 text-zinc-900') : (temaNoturno ? 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300' : 'bg-transparent border-black/5 text-zinc-500 hover:text-zinc-700')}`}>
                  <input type="checkbox" checked={!!widgets?.[item.id]} onChange={() => toggleWidget(item.id)} className="hidden" />
                  <div className={`w-4 h-4 rounded-[6px] border flex items-center justify-center transition-colors flex-shrink-0 ${widgets?.[item.id] ? (temaNoturno ? 'border-transparent bg-zinc-200 text-zinc-900' : 'border-transparent bg-zinc-800 text-white') : (temaNoturno ? 'border-zinc-700' : 'border-zinc-300')}`}>
                    {widgets?.[item.id] && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                  </div>
                  {item.label}
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-5 w-full">

        {([widgets?.bruto, widgets?.lucro, widgets?.ticket].filter(Boolean).length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
            {widgets?.bruto && (
              <ErrorBoundary codigoErro="ERR-FAT-BRUT-002" modulo="Volume Bruto" temaNoturno={temaNoturno} fallbackClassName="w-full h-[120px]">
                <div className={`p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[120px] w-full arox-cinematic ${cardSurface}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Volume Bruto</h3>
                  <p className={`text-3xl font-bold tracking-tight tabular-nums mt-1 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}><span className="text-lg opacity-50 font-normal mr-1">R$</span>{fatTotalSafe.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
              </ErrorBoundary>
            )}
            {widgets?.lucro && (
              <ErrorBoundary codigoErro="ERR-FAT-LUC-003" modulo="Lucro Estimado" temaNoturno={temaNoturno} fallbackClassName="w-full h-[120px]">
                <div className={`p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[120px] w-full arox-cinematic ${cardSurface}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Lucro Estimado</h3>
                  <p className={`text-3xl font-bold tracking-tight tabular-nums mt-1 ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}><span className="text-lg opacity-50 font-normal mr-1">R$</span>{lucroSafe.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
              </ErrorBoundary>
            )}
            {widgets?.ticket && (
              <ErrorBoundary codigoErro="ERR-FAT-TICK-004" modulo="Ticket Médio" temaNoturno={temaNoturno} fallbackClassName="w-full h-[120px]">
                <div className={`p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[120px] w-full arox-cinematic ${cardSurface}`}>
                  <div className="flex justify-between items-start mb-1 w-full"><h3 className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Ticket Médio</h3><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${temaNoturno ? 'bg-white/10 border-white/10 text-zinc-300' : 'bg-black/5 border-black/5 text-zinc-600'}`}>{totalComandas} cmd</span></div>
                  <p className={`text-3xl font-bold tracking-tight tabular-nums mt-1 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}><span className="text-lg opacity-50 font-normal mr-1">R$</span>{ticketMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
              </ErrorBoundary>
            )}
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetsVisiveis} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 w-full grid-flow-dense">
              {widgetsVisiveis.map((id, index) => (
                <SortableItem key={id} id={id} index={index + 4} temaNoturno={temaNoturno}>
                   {renderizarConteudoWidget(id)}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
            {activeId ? <SortableItem id={activeId} index={0} temaNoturno={temaNoturno} isOverlay>{renderizarConteudoWidget(activeId)}</SortableItem> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}