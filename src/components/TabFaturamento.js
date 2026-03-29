'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, DollarSign, Zap, Clock, GripHorizontal, Award, BarChart2, Activity } from 'lucide-react';

import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Constante global para evitar perda de referência no useMemo e loop infinito
const ARRAY_VAZIO = [];

// --- COMPONENTE SORTABLE (Grid Integrado) ---
const SortableItem = ({ id, children, temaNoturno, isOverlay, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
    zIndex: isOverlay ? 999 : 1,
    animationDelay: `${index * 50}ms`
  };

  let colSpanClass = 'col-span-1';
  if (id === 'linhaTemporal' || id === 'produtos') {
    colSpanClass = 'col-span-1 md:col-span-2 xl:col-span-2 2xl:col-span-3'; 
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${colSpanClass} relative group h-full w-full arox-cinematic ${isOverlay ? 'scale-[1.02] shadow-2xl rounded-[24px] cursor-grabbing !animate-none opacity-100' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`absolute top-4 right-4 z-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing outline-none backdrop-blur-md ${temaNoturno ? 'hover:bg-white/10 text-zinc-500 hover:text-white' : 'hover:bg-black/5 text-zinc-400 hover:text-black'}`}
      >
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
  faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos, comandasFiltradas, comandas
}) {

  const [mostrarMenuPersonalizar, setMostrarMenuPersonalizar] = useState(false);
  const [widgets, setWidgets] = useState({
    bruto: true, lucro: true, ticket: true, insights: true, termometro: true, linhaTemporal: true, pagamentos: true, mapaCalor: true, produtos: true, combo: true
  }); 
  const [ordemGraficos, setOrdemGraficos] = useState([
    'termometro', 'linhaTemporal', 'pagamentos', 'mapaCalor', 'produtos', 'combo'
  ]);
  const [insightAtivo, setInsightAtivo] = useState(0);
  const [activeId, setActiveId] = useState(null); 

  // --- BLINDAGEM 1: Extração de valores primitivos para evitar recálculo por perda de referência ---
  const strHoje = getHoje?.() || '';
  const strMesAtual = getMesAtual?.() || '';
  const strAnoAtual = getAnoAtual?.() || '';
  
  const fTipo = filtroTempo?.tipo || '';
  const fValor = filtroTempo?.valor || '';
  const fInicio = filtroTempo?.inicio || '';
  const fFim = filtroTempo?.fim || '';

  const fatTotalSafe = faturamentoTotal || 0;
  const lucroSafe = lucroEstimado || 0;
  const totalComandas = (comandasFiltradas || []).length;
  const ticketMedio = totalComandas > 0 ? (fatTotalSafe / totalComandas) : 0;

  // --- BLINDAGEM 2: Memoização do ranking para não gerar novo array a cada renderização ---
  const rankingMaiusculo = useMemo(() => {
    return (rankingProdutos || []).map(p => ({ 
      ...p, 
      nome: p?.nome || 'Desconhecido',
      custo: Math.max(0, (p?.valor || 0) - (p?.lucro || 0)) || 0,
      lucro: p?.lucro || 0,
      valor: p?.valor || 0
    }));
  }, [rankingProdutos]);

  useEffect(() => {
    const widgetsSalvos = localStorage.getItem('bessa_widgets_faturamento_v10');
    const ordemSalva = localStorage.getItem('bessa_ordem_faturamento_v10');
    if (widgetsSalvos) setWidgets(JSON.parse(widgetsSalvos));
    if (ordemSalva) setOrdemGraficos(JSON.parse(ordemSalva));
  }, []);

  const toggleWidget = (chave) => {
    const novosWidgets = { ...widgets, [chave]: !widgets[chave] };
    setWidgets(novosWidgets);
    localStorage.setItem('bessa_widgets_faturamento_v10', JSON.stringify(novosWidgets));
  };

  const handleReorder = (novaOrdem) => {
    setOrdemGraficos(novaOrdem);
    localStorage.setItem('bessa_ordem_faturamento_v10', JSON.stringify(novaOrdem));
  };

  const mudarTempo = (direcao) => {
    if (fTipo === 'dia') {
      const [ano, mes, dia] = (fValor || strHoje).split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      dataObj.setDate(dataObj.getDate() + direcao);
      
      const anoNovo = dataObj.getFullYear();
      const mesNovo = String(dataObj.getMonth() + 1).padStart(2, '0');
      const diaNovo = String(dataObj.getDate()).padStart(2, '0');
      
      setFiltroTempo({ ...filtroTempo, valor: `${anoNovo}-${mesNovo}-${diaNovo}` });
    } else if (fTipo === 'mes') {
      const [ano, mes] = (fValor || strMesAtual).split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, 1);
      dataObj.setMonth(dataObj.getMonth() + direcao);
      
      const anoNovo = dataObj.getFullYear();
      const mesNovo = String(dataObj.getMonth() + 1).padStart(2, '0');
      
      setFiltroTempo({ ...filtroTempo, valor: `${anoNovo}-${mesNovo}` });
    }
  };

  const podeAvancar = () => {
    if (fTipo === 'dia') return fValor < strHoje;
    if (fTipo === 'mes') return fValor < strMesAtual;
    return false; 
  };

  // --- BLINDAGEM 3: Arrays de dependências ajustados usando apenas as strings extraídas ---
  const { diffAbsoluta, percentualReal, percentualBarra, bateuMeta, semHistorico, diferenca, mediaHistorica } = useMemo(() => {
    const defaultMetrics = { mediaHistorica: 0, diferenca: 0, diffAbsoluta: 0, percentualReal: 0, percentualBarra: 0, bateuMeta: false, semHistorico: true };
    if (!comandas || !Array.isArray(comandas) || comandas.length === 0) return defaultMetrics;

    let media = 0;
    let hasPastData = false;

    if (fTipo === 'dia') {
       const dataAtual = fValor || strHoje;
       const diaSemanaAtual = new Date(dataAtual + 'T12:00:00').getDay();
       let somaPassada = 0;
       let diasUnicos = new Set();

       comandas.forEach(c => {
           if (c?.data && c.data < dataAtual) {
               const dtCmd = new Date(c.data + 'T12:00:00');
               if (dtCmd.getDay() === diaSemanaAtual) {
                   const val = (c.produtos || []).reduce((acc, p) => acc + (p?.preco || 0), 0);
                   somaPassada += val;
                   diasUnicos.add(c.data);
               }
           }
       });

       if (diasUnicos.size > 0) {
           media = somaPassada / diasUnicos.size;
           hasPastData = true;
       }
    } else {
       let pastStart = null;
       let pastEnd = null;
       
       if (fTipo === '7 dias') {
           let end = new Date(strHoje + 'T12:00:00');
           end.setDate(end.getDate() - 7);
           let start = new Date(end.getTime());
           start.setDate(start.getDate() - 6);
           pastStart = start.toISOString().split('T')[0];
           pastEnd = end.toISOString().split('T')[0];
       } else if (fTipo === 'mes') {
           const [ano, mes] = (fValor || strMesAtual).split('-');
           let prevMes = parseInt(mes, 10) - 1; let prevAno = parseInt(ano, 10);
           if (prevMes === 0) { prevMes = 12; prevAno--; }
           pastStart = `${prevAno}-${String(prevMes).padStart(2, '0')}-01`;
           pastEnd = `${prevAno}-${String(prevMes).padStart(2, '0')}-31`; 
       } else if (fTipo === 'ano') {
           const valAno = parseInt(fValor || strAnoAtual, 10);
           pastStart = `${valAno - 1}-01-01`;
           pastEnd = `${valAno - 1}-12-31`;
       } else if (fTipo === 'periodo') {
           if (!fInicio || !fFim) return defaultMetrics;
           const start = new Date(fInicio + 'T12:00:00');
           const end = new Date(fFim + 'T12:00:00');
           const diffTime = Math.abs(end - start);
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           
           let pEnd = new Date(start.getTime());
           pEnd.setDate(pEnd.getDate() - 1);
           let pStart = new Date(pEnd.getTime());
           pStart.setDate(pStart.getDate() - diffDays);
           
           pastStart = pStart.toISOString().split('T')[0];
           pastEnd = pEnd.toISOString().split('T')[0];
       }

       if (pastStart && pastEnd) {
           let somaPassada = 0;
           let found = false;
           comandas.forEach(c => {
              if (c?.data >= pastStart && c?.data <= pastEnd) {
                somaPassada += (c.produtos || []).reduce((acc, p) => acc + (p?.preco || 0), 0);
                found = true;
              }
           });
           if (found) {
               media = somaPassada;
               hasPastData = true;
           }
       }
    }

    if (!hasPastData) return defaultMetrics;

    const pctReal = media > 0 ? (fatTotalSafe / media) * 100 : (fatTotalSafe > 0 ? 100 : 0);
    const pctBarra = Math.min(pctReal || 0, 100);
    const diff = fatTotalSafe - media;
    const bateu = fatTotalSafe >= media && fatTotalSafe > 0;

    return { 
      mediaHistorica: media, diferenca: diff, diffAbsoluta: Math.abs(diff), 
      percentualReal: pctReal || 0, percentualBarra: pctBarra || 0, 
      bateuMeta: bateu, semHistorico: false 
    };
  }, [comandas, fTipo, fValor, fInicio, fFim, fatTotalSafe, strHoje, strMesAtual, strAnoAtual]);

  const dadosGraficoAcumulado = useMemo(() => {
    if (fTipo !== 'dia' || !comandas || comandas.length === 0) return ARRAY_VAZIO;

    const dataAtual = fValor || strHoje;
    const diaSemanaAtual = new Date(dataAtual + 'T12:00:00').getDay();

    let hourlyCurrent = Array(24).fill(0);
    let hourlyPast = Array(24).fill(0);
    let diasUnicosPassados = new Set();

    comandas.forEach(c => {
        const h = c?.hora_abertura ? new Date(c.hora_abertura).getHours() : null;
        if (h !== null && !isNaN(h) && h >= 0 && h < 24) {
            const val = (c.produtos || []).reduce((acc, p) => acc + (p?.preco || 0), 0);
            if (c.data === dataAtual) {
                hourlyCurrent[h] += val;
            } else if (c.data && c.data < dataAtual) {
                const dtCmd = new Date(c.data + 'T12:00:00');
                if (dtCmd.getDay() === diaSemanaAtual) {
                    hourlyPast[h] += val;
                    diasUnicosPassados.add(c.data);
                }
            }
        }
    });

    const qtdDiasPassados = diasUnicosPassados.size || 1;
    for (let i = 0; i < 24; i++) {
        hourlyPast[i] = hourlyPast[i] / qtdDiasPassados;
    }

    const horaAtualDoSistema = new Date().getHours();
    const isHoje = dataAtual === strHoje;

    let accCur = 0, accPast = 0;
    const res = [];
    
    for (let i = 0; i < 24; i++) {
        accCur += hourlyCurrent[i];
        accPast += hourlyPast[i];
        
        if (isHoje && i > horaAtualDoSistema) {
            res.push({ hora: `${i}h`, atual: null, passado: accPast });
        } else {
            res.push({ hora: `${i}h`, atual: accCur, passado: accPast });
        }
    }
    return res;
  }, [comandas, fTipo, fValor, strHoje]);

  const { mapaCalor, maxCalor, topCombos } = useMemo(() => {
    const horasVisiveis = [17, 18, 19, 20, 21, 22, 23];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let matrizSoma = Array(7).fill(0).map(() => Array(24).fill(0));
    let diasUnicos = Array(7).fill(0).map(() => new Set());
    let pares = {};

    (comandas || []).forEach(c => {
      if (c?.hora_abertura && c?.data) {
        const dt = new Date(c.hora_abertura);
        const d = dt.getDay(); const h = dt.getHours();
        if (!isNaN(d) && !isNaN(h) && d >= 0 && d <= 6 && h >= 0 && h <= 23) {
          matrizSoma[d][h]++;
          diasUnicos[d].add(c.data);
        }
      }
    });

    let matrizMedia = Array(7).fill(0).map(() => Array(24).fill(0));
    let localMaxCalor = 0;

    for (let d = 0; d < 7; d++) {
       const qtdDias = diasUnicos[d].size || 1;
       for (let h = 0; h < 24; h++) {
          const media = parseFloat((matrizSoma[d][h] / qtdDias).toFixed(1));
          matrizMedia[d][h] = media;
          if (media > localMaxCalor) localMaxCalor = media;
       }
    }

    (comandasFiltradas || []).forEach(c => {
      if (c?.produtos && Array.isArray(c.produtos) && c.produtos.length > 1 && c.produtos.length < 10) {
        const nomesUnicos = Array.from(new Set(c.produtos.map(p => (p?.nome || '').replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim()).filter(Boolean)));
        for(let i = 0; i < nomesUnicos.length; i++) {
          for(let j = i + 1; j < nomesUnicos.length; j++) {
            const pair = [nomesUnicos[i], nomesUnicos[j]].sort().join(' + ');
            pares[pair] = (pares[pair] || 0) + 1;
          }
        }
      }
    });

    const combList = Object.entries(pares).map(([nome, qtd]) => ({ nome, qtd })).sort((a,b) => b.qtd - a.qtd).slice(0, 5);
    return { mapaCalor: { matriz: matrizMedia, diasSemana, horasVisiveis }, maxCalor: localMaxCalor, topCombos: combList };
  }, [comandas, comandasFiltradas]);

  const insightsDinamicos = useMemo(() => {
    const frases = [];
    const totalPagamentos = (dadosPizza || []).reduce((acc, item) => acc + (item?.value || 0), 0);
    const aindaSemMovimentoHoje = fTipo === 'dia' && fatTotalSafe === 0 && fValor === strHoje;

    if (aindaSemMovimentoHoje) {
      let maxVolHoje = 0;
      let horaPicoHoje = -1;
      
      if (mapaCalor?.matriz) {
        const diaSemanaHoje = new Date().getDay();
        const historicoHoje = mapaCalor.matriz[diaSemanaHoje];
        
        if (Array.isArray(historicoHoje)) {
          historicoHoje.forEach((volume, hora) => {
            if (volume > maxVolHoje) {
              maxVolHoje = volume;
              horaPicoHoje = hora;
            }
          });
        }
      }

      if (maxVolHoje > 0) {
        frases.push({ 
          tipo: 'info', icone: <Zap className="w-5 h-5 text-amber-500" />, 
          titulo: 'Previsão Operacional', texto: `Atenção: com base no seu histórico, prepare a operação para um maior fluxo esperado próximo às ${horaPicoHoje}h.` 
        });
      } else {
        frases.push({ 
          tipo: 'neutro', icone: <Clock className={`w-5 h-5 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`} />, 
          titulo: 'Aguardando Operação', texto: 'Aguardando movimentações suficientes para gerar inteligência de dados.' 
        });
      }
      return frases; 
    }

    if (rankingMaiusculo && rankingMaiusculo.length > 0) {
      const topProduto = [...rankingMaiusculo].sort((a, b) => (b?.valor || 0) - (a?.valor || 0))[0];
      if (topProduto && topProduto.valor > 0) {
        frases.push({ 
          tipo: 'sucesso', icone: <Award className="w-5 h-5 text-indigo-500" />, 
          titulo: 'Destaque Comercial', texto: `${topProduto.nome} liderou as vendas gerando R$ ${(topProduto.valor || 0).toFixed(2)}.` 
        });
      }
    }

    if (dadosPizza && dadosPizza.length > 0 && totalPagamentos > 0) {
      const topPagamento = [...dadosPizza].sort((a, b) => (b?.value || 0) - (a?.value || 0))[0];
      if (topPagamento) {
        const pct = (((topPagamento.value || 0) / totalPagamentos) * 100).toFixed(0);
        frases.push({ 
          tipo: 'info', icone: <DollarSign className="w-5 h-5 text-emerald-500" />, 
          titulo: 'Comportamento Financeiro', texto: `${topPagamento.name} representou ${pct}% de todo o volume transacionado.` 
        });
      }
    }

    if (!semHistorico && mediaHistorica > 0) {
      const variacao = ((diffAbsoluta / mediaHistorica) * 100).toFixed(1);
      if (diferenca >= 0) {
        frases.push({ 
          tipo: 'sucesso', icone: <TrendingUp className="w-5 h-5 text-emerald-500" />, 
          titulo: 'Alta Performance', texto: `Faturamento operando ${variacao}% acima da sua média histórica.` 
        });
      } else {
        frases.push({ 
          tipo: 'alerta', icone: <AlertTriangle className="w-5 h-5 text-amber-500" />, 
          titulo: 'Atenção ao Volume', texto: `O faturamento está ${variacao}% abaixo do padrão histórico esperado.` 
        });
      }
    }

    if (maxCalor > 0 && mapaCalor?.matriz) {
      let maxD = 0, maxH = 0, maxV = 0;
      mapaCalor.matriz.forEach((arr, dIdx) => {
        if (Array.isArray(arr)) {
          arr.forEach((v, hIdx) => { if(v > maxV){ maxV = v; maxD = dIdx; maxH = hIdx; } });
        }
      });
      
      const horaAtual = new Date().getHours();
      const diaNome = mapaCalor?.diasSemana?.[maxD] || '';
      
      if (fTipo === 'dia') {
        frases.push({ 
          tipo: 'info', icone: <Zap className="w-5 h-5 text-amber-500" />, 
          titulo: 'Previsão de Pico Hoje', texto: `Com base no histórico recente, prepare-se para maior volume próximo às ${maxH}h.` 
        });

        const picoHoje = mapaCalor.matriz?.[new Date().getDay()]?.[horaAtual] || 0;
        const mediaHoraEsperada = maxCalor / 2.5; 

        if (picoHoje > mediaHoraEsperada && diferenca > 0) {
          frases.push({ 
            tipo: 'sucesso', icone: <Activity className="w-5 h-5 text-emerald-500" />, 
            titulo: 'Ritmo Acelerado', texto: `O volume neste momento (${horaAtual}h) está superando o padrão diário normal.` 
          });
        } else if (fatTotalSafe > 0 && picoHoje < mediaHoraEsperada && diferenca < 0) {
          frases.push({ 
            tipo: 'alerta', icone: <Activity className="w-5 h-5 text-rose-500" />, 
            titulo: 'Ritmo Lento', texto: `O movimento está abaixo da média histórica para as ${horaAtual}h.` 
          });
        }
      } else {
        frases.push({ 
          tipo: 'info', icone: <BarChart2 className="w-5 h-5 text-blue-500" />, 
          titulo: 'Padrão de Pico (Histórico)', texto: `No período selecionado, o maior volume se concentra às ${maxH}h de ${diaNome}.` 
        });
      }
    }

    if (frases.length === 0) {
      frases.push({ 
        tipo: 'neutro', icone: <Clock className="w-5 h-5 text-zinc-500" />, 
        titulo: 'Processando Dados', texto: 'Aguardando mais movimentações no período para cruzar métricas.' 
      });
    }
    
    return frases;
  }, [rankingMaiusculo, dadosPizza, semHistorico, diferenca, diffAbsoluta, mediaHistorica, maxCalor, mapaCalor, fatTotalSafe, fTipo, fValor, strHoje]);

  useEffect(() => {
    if (!insightsDinamicos || insightsDinamicos.length <= 1) return;
    const interval = setInterval(() => {
      setInsightAtivo(prev => (prev + 1) % insightsDinamicos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [insightsDinamicos?.length]);

  const getCorPagamento = (nome) => {
    const n = (nome || '').toLowerCase();
    if (n.includes('pix')) return temaNoturno ? '#34d399' : '#10b981';
    if (n.includes('crédito') || n.includes('credito')) return temaNoturno ? '#60a5fa' : '#3b82f6';
    if (n.includes('débito') || n.includes('debito')) return temaNoturno ? '#c084fc' : '#a855f7';
    if (n.includes('dinheiro')) return temaNoturno ? '#fbbf24' : '#f59e0b';
    return temaNoturno ? '#71717a' : '#a1a1aa';
  };

  const getHeatmapColor = (intensidade) => {
    if (!intensidade || intensidade === 0) return temaNoturno ? '#18181b' : '#fafafa'; 
    const opacidade = Math.min(1, 0.2 + (intensidade * 0.8));
    return temaNoturno ? `rgba(250, 250, 250, ${opacidade})` : `rgba(24, 24, 27, ${opacidade})`;
  };

  const cardSurface = temaNoturno 
    ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/[0.04] shadow-lg' 
    : 'bg-white/80 backdrop-blur-xl border border-black/[0.04] shadow-sm';

  const labelArox = `text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`;

  const renderizarConteudoWidget = (id) => {
    switch(id) {
      case 'termometro': 
        return (
          <div className={`flex flex-col justify-between p-6 rounded-[24px] transition-all duration-300 hover:shadow-md h-full min-h-[200px] w-full ${cardSurface}`}>
            <div>
              <h3 className={`flex items-center gap-2 mb-1 ${labelArox}`}>
                <Activity className="w-3.5 h-3.5" /> Performance vs Histórico
              </h3>
              <p className={`text-[11px] opacity-70 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Comparado à média de períodos anteriores</p>
            </div>

            {semHistorico || (fTipo === 'dia' && fatTotalSafe === 0 && fValor === strHoje) ? (
              <div className="flex-1 flex flex-col items-center justify-center mt-4">
                <p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem base de comparação</p>
              </div>
            ) : (
              <div className="mt-2 flex flex-col flex-1 justify-end w-full">
                 <div className="flex items-baseline gap-2 mb-3">
                   <span className={`text-4xl font-bold tracking-tight tabular-nums ${diferenca >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {(percentualReal || 0).toFixed(0)}<span className="text-2xl opacity-50 ml-1">%</span>
                   </span>
                 </div>
                 <div className={`w-full h-1.5 rounded-full overflow-hidden mb-4 ${temaNoturno ? 'bg-white/10' : 'bg-black/10'}`}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentualBarra || 0}%` }} transition={{ duration: 1, ease: "easeOut" }} 
                      className={`h-full rounded-full ${diferenca >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                 </div>
                 <div className={`flex justify-between items-end border-t pt-4 w-full ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
                    <div className="flex flex-col gap-1 w-full">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Delta (Histórico)</span>
                        <span className={`text-[14px] font-bold tabular-nums ${bateuMeta ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {bateuMeta ? '+' : '-'} R$ {(diffAbsoluta || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                    </div>
                 </div>
              </div>
            )}
          </div>
        );

      case 'linhaTemporal': 
        return (
          <div className={`flex flex-col justify-between p-6 rounded-[24px] transition-all duration-500 hover:shadow-md h-full min-h-[200px] w-full relative overflow-hidden group ${cardSurface}`}>
            <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none ${temaNoturno ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}></div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 relative z-10 w-full">
              <div>
                <h3 className={`flex items-center gap-2 mb-1 ${labelArox}`}>
                  <TrendingUp className="w-3.5 h-3.5" /> Linha Temporal de Receita
                </h3>
                <p className={`text-[11px] opacity-70 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Acúmulo intradiário vs Média histórica</p>
              </div>
              
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full shadow-sm ${temaNoturno ? 'bg-[#34d399]' : 'bg-[#059669]'}`}></div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Hoje</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${temaNoturno ? 'bg-[#064e3b]' : 'bg-[#a7f3d0]'}`}></div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Média</span>
                </div>
              </div>
            </div>
            
            {dadosGraficoAcumulado.length > 0 ? (
              // BLINDAGEM 4: Adicionado debounce={50} para evitar loop de estado por redimensionamento
              <div className="w-full h-[140px] min-h-[140px] mt-4 -ml-4 relative z-10 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minHeight={140} minWidth={200} debounce={50}>
                  <AreaChart data={dadosGraficoAcumulado} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={temaNoturno ? '#34d399' : '#059669'} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={temaNoturno ? '#34d399' : '#059669'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hora" tick={{fontSize: 10, fontWeight: 700, fill: temaNoturno ? '#71717a' : '#a1a1aa'}} axisLine={false} tickLine={false} />
                    
                    <RechartsTooltip 
                      cursor={{ stroke: temaNoturno ? '#3f3f46' : '#e4e4e7', strokeWidth: 1, strokeDasharray: '4 4' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const valAtual = payload.find(p => p.dataKey === 'atual');
                            const valPassado = payload.find(p => p.dataKey === 'passado');
                            const temAtual = valAtual && valAtual.value !== null;
                            const passadoV = valPassado?.value || 0;
                            const atualV = temAtual ? valAtual.value : 0;
                            const diff = atualV - passadoV;
                            const isPositive = diff >= 0;

                            return (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }} 
                                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                                  transition={{ duration: 0.15 }}
                                  className={`p-4 rounded-[16px] border shadow-xl text-xs backdrop-blur-xl min-w-[200px] ${temaNoturno ? 'bg-zinc-900/80 border-white/10 shadow-black/50' : 'bg-white/80 border-black/10 shadow-zinc-200/50'}`}
                                >
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-500/20">
                                        <p className={`font-bold ${temaNoturno ? 'text-zinc-100' : 'text-zinc-800'}`}>{payload[0].payload.hora}</p>
                                        {temAtual && (
                                          <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-tight ${isPositive ? (temaNoturno ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600') : (temaNoturno ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600')}`}>
                                            <TrendingUp className={`w-3 h-3 ${!isPositive ? 'scale-y-[-1]' : ''}`} />
                                            {Math.abs(diff).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                          </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                      {temAtual ? (
                                        <div className="flex justify-between items-center gap-4">
                                          <span className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-zinc-500">
                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] ${temaNoturno ? 'bg-[#34d399]' : 'bg-[#059669]'}`}></div>
                                            Hoje
                                          </span>
                                          <span className={`font-bold tabular-nums ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>R$ {atualV.toFixed(2)}</span>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-zinc-500 italic pb-1">Ainda sem volume para este horário hoje.</p>
                                      )}
                                      <div className="flex justify-between items-center gap-4">
                                        <span className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-zinc-500">
                                          <div className={`w-2 h-2 rounded-full ${temaNoturno ? 'bg-[#064e3b]' : 'bg-[#a7f3d0]'}`}></div>
                                          Média Hist.
                                        </span>
                                        <span className={`font-bold tabular-nums ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>R$ {passadoV.toFixed(2)}</span>
                                      </div>
                                    </div>
                                </motion.div>
                            );
                        }
                        return null;
                    }} />
                    
                    <Area 
                      type="monotone" 
                      dataKey="passado" 
                      stroke={temaNoturno ? '#064e3b' : '#a7f3d0'} 
                      fill="none" 
                      strokeWidth={2} 
                      dot={false} 
                      activeDot={{ r: 4, fill: temaNoturno ? '#064e3b' : '#a7f3d0', stroke: 'transparent' }} 
                      isAnimationActive={true} 
                    />
                    
                    <Area 
                      type="monotone" 
                      dataKey="atual" 
                      stroke={temaNoturno ? '#34d399' : '#059669'} 
                      fill="url(#colorAtual)" 
                      strokeWidth={3.5} 
                      dot={false} 
                      activeDot={{ r: 6, fill: temaNoturno ? '#34d399' : '#059669', stroke: temaNoturno ? '#0a0a0b' : '#ffffff', strokeWidth: 3 }} 
                      isAnimationActive={true} 
                      animationDuration={1500} 
                      animationEasing="ease-out" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center mt-2 relative z-10 w-full">
                <p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Aguardando volume de vendas</p>
              </div>
            )}
          </div>
        );

      case 'pagamentos':
        const totalPags = (dadosPizza || []).reduce((a, b) => a + (b?.value || 0), 0);
        return (
          <div className={`flex flex-col p-6 rounded-[24px] transition-all duration-300 hover:shadow-md h-full min-h-[180px] w-full ${cardSurface}`}>
            <h3 className={`flex items-center gap-2 mb-4 ${labelArox}`}>
              <DollarSign className="w-3.5 h-3.5" /> Pagamentos
            </h3>
            {dadosPizza && dadosPizza.length > 0 ? (
              <div className="flex-1 flex flex-col justify-center gap-4 w-full">
                {[...dadosPizza].sort((a,b) => (b?.value || 0) - (a?.value || 0)).map((item, idx) => {
                  const val = item?.value || 0;
                  const pct = totalPags > 0 ? ((val / totalPags) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={idx} className="flex flex-col group/item w-full">
                      <div className="flex justify-between items-end mb-1 pr-4 w-full">
                        <span className={`text-[13px] font-bold ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>{item?.name || 'Outros'}</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-[13px] font-bold tabular-nums ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>R$ {val.toLocaleString('pt-BR')}</span>
                            <span className={`text-[11px] w-8 text-right font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${temaNoturno ? 'bg-white/10' : 'bg-black/10'}`}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: idx * 0.1 }}
                          className="h-full rounded-full" style={{ backgroundColor: getCorPagamento(item?.name) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full"><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem transações</p></div>
            )}
          </div>
        );

      case 'mapaCalor':
        return (
          <div className={`flex flex-col p-6 rounded-[24px] transition-all duration-300 hover:shadow-md h-full min-h-[200px] w-full ${cardSurface}`}>
            <h3 className={`flex items-center gap-2 mb-4 ${labelArox}`}>
              <Clock className="w-3.5 h-3.5" /> Densidade Operacional
            </h3>
            {maxCalor > 0 && mapaCalor?.horasVisiveis ? (
              <div className="flex-1 w-full flex flex-col justify-center">
                <div className="w-full">
                  <div className="grid grid-cols-8 gap-1 mb-2 text-[9px] font-bold uppercase tracking-wider text-center text-zinc-400 pr-2">
                    <div></div>{mapaCalor.horasVisiveis.map(h => <div key={h}>{h}h</div>)}
                  </div>
                  {mapaCalor.diasSemana.map((dia, idx) => (
                    <div key={dia} className="grid grid-cols-8 gap-1 mb-1 items-center pr-2">
                      <div className={`text-[9px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{dia}</div>
                      {mapaCalor.horasVisiveis.map(h => {
                        const qtd = mapaCalor?.matriz?.[idx]?.[h] || 0;
                        const intensidade = qtd === 0 ? 0 : Math.max(0.1, qtd / (maxCalor || 1));
                        
                        const corDoTexto = temaNoturno 
                          ? (intensidade > 0.4 ? 'text-zinc-900' : 'text-zinc-300')
                          : (intensidade > 0.4 ? 'text-zinc-100' : 'text-zinc-700');

                        return (
                          <motion.div 
                            whileHover={{ scale: 1.1 }} 
                            key={`${dia}-${h}`} 
                            title={`${qtd} comandas em média`}
                            className={`h-6 sm:h-7 rounded-md transition-colors cursor-crosshair border border-black/5 dark:border-white/5 flex items-center justify-center text-[10px] font-bold w-full ${corDoTexto}`}
                            style={{ backgroundColor: getHeatmapColor(intensidade) }}
                          >
                            {qtd > 0 ? qtd : ''}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full"><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem dados suficientes</p></div>
            )}
          </div>
        );

      case 'produtos':
        return (
          <div className={`flex flex-col p-6 rounded-[24px] transition-all duration-300 hover:shadow-md h-full min-h-[220px] w-full ${cardSurface}`}>
            <div className="flex justify-between items-center mb-4 pr-6 w-full">
              <h3 className={`flex items-center gap-2 ${labelArox}`}>
                <BarChart2 className="w-3.5 h-3.5" /> Rentabilidade (Lucro vs Custo)
              </h3>
            </div>
            {rankingMaiusculo && rankingMaiusculo.length > 0 ? (
              // BLINDAGEM 4: Adicionado debounce={50} no ResponsiveContainer
              <div className="w-full h-[160px] min-h-[160px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minHeight={160} minWidth={200} debounce={50}>
                  <BarChart data={rankingMaiusculo} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#a1a1aa' : '#71717a', fontSize: 11, fontWeight: 700}} width={140} />
                    <RechartsTooltip 
                      cursor={{fill: temaNoturno ? '#18181b' : '#f4f4f5'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const dLucro = data?.lucro || 0;
                          const dCusto = data?.custo || 0;
                          return (
                            <div className={`p-4 rounded-[16px] border shadow-xl backdrop-blur-xl ${temaNoturno ? 'bg-zinc-900/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
                              <p className={`text-[13px] font-bold mb-3 ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>{data?.nome || 'Produto'}</p>
                              <div className="flex flex-col gap-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider flex justify-between gap-6"><span className={temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}>Lucro:</span> <span className="text-emerald-500">R$ {dLucro.toFixed(2)}</span></p>
                                <p className="text-[11px] font-bold uppercase tracking-wider flex justify-between gap-6"><span className={temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}>Custo:</span> <span className={`${temaNoturno ? 'text-zinc-300' : 'text-zinc-600'}`}>R$ {dCusto.toFixed(2)}</span></p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="custo" stackId="a" fill={temaNoturno ? '#27272a' : '#e4e4e7'} radius={[0,0,0,0]} barSize={16} />
                    <Bar dataKey="lucro" stackId="a" fill={temaNoturno ? '#34d399' : '#10b981'} radius={[0,4,4,0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full"><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem movimentação</p></div>
            )}
          </div>
        );

      case 'combo':
        return (
          <div className={`flex flex-col p-6 rounded-[24px] transition-all duration-300 hover:shadow-md h-full min-h-[180px] w-full ${cardSurface}`}>
            <h3 className={`flex items-center gap-2 mb-4 ${labelArox}`}>
              <Zap className="w-3.5 h-3.5" /> Cesta Inteligente
            </h3>
            {topCombos && topCombos.length > 0 ? (
              <div className="flex flex-col gap-2.5 pr-2 w-full">
                {topCombos.map((combo, idx) => {
                  const comboNome = combo?.nome || '';
                  const [p1, p2] = comboNome.includes(' + ') ? comboNome.split(' + ') : [comboNome, ''];
                  return (
                    <motion.div whileHover={{ scale: 1.01 }} key={idx} className={`p-3 rounded-xl border flex items-center justify-between w-full shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
                      <div className="flex flex-col pr-2 min-w-0">
                        <span className={`text-[12px] font-bold line-clamp-1 ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>{p1}</span>
                        {p2 && (
                          <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            <span>+</span><span className="line-clamp-1">{p2}</span>
                          </span>
                        )}
                      </div>
                      <div className={`px-2.5 py-1 flex-shrink-0 rounded-md border text-[10px] font-black ${temaNoturno ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`}>
                        {combo?.qtd || 0}x
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full"><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem padrões consistentes</p></div>
            )}
          </div>
        );
      default: return null;
    }
  };

  const widgetsVisiveis = useMemo(() => {
    return ordemGraficos.filter(id => {
      if (!widgets?.[id]) return false;
      if (id === 'linhaTemporal' && fTipo !== 'dia') return false;
      return true;
    });
  }, [ordemGraficos, widgets, fTipo]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgetsVisiveis.indexOf(active.id);
      const newIndex = widgetsVisiveis.indexOf(over.id);
      const novaOrdemVisivel = arrayMove(widgetsVisiveis, oldIndex, newIndex);
      
      const ocultos = ordemGraficos.filter(id => !widgetsVisiveis.includes(id));
      handleReorder([...novaOrdemVisivel, ...ocultos]);
    }
  };

  const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } })
  };

  const btnAROXSecundario = `px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 border ${temaNoturno ? 'bg-[#18181B] border-white/10 text-white hover:bg-zinc-800' : 'bg-white border-black/10 text-zinc-900 hover:bg-zinc-50'}`;

  return (
    <div className={`w-full max-w-full pb-8 mt-4 font-sans ${temaNoturno ? 'text-zinc-100 selection:bg-zinc-800' : 'text-zinc-900 selection:bg-zinc-200'}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .arox-cinematic { animation: arox-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); }
        @keyframes arox-fade-up { 100% { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* HEADER DE CONTROLES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full mb-6 px-4 md:px-0">
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
                  <button onClick={() => mudarTempo(-1)} className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0 shadow-sm ${temaNoturno ? 'bg-[#0A0A0A] border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-black/10 text-zinc-500 hover:text-black'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <input type={fTipo === 'dia' ? 'date' : 'month'} value={fValor || ''} max={fTipo === 'dia' ? strHoje : strMesAtual} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} 
                    className={`px-4 py-2.5 text-center border rounded-xl outline-none text-[12px] font-bold uppercase tracking-wider transition-all w-full sm:w-36 focus:border-zinc-500 shadow-sm ${temaNoturno ? 'bg-[#0A0A0A] border-white/10 [color-scheme:dark]' : 'bg-white border-black/10'}`} />
                  {podeAvancar() ? (
                    <button onClick={() => mudarTempo(1)} className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0 shadow-sm ${temaNoturno ? 'bg-[#0A0A0A] border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-black/10 text-zinc-500 hover:text-black'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  ) : <div className="w-[42px]" />}
                </>
              )}
              {fTipo === 'periodo' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm w-full ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/10'}`}>
                  <input type="date" value={fInicio || ''} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`bg-transparent outline-none text-[11px] font-bold uppercase tracking-wider w-full ${temaNoturno ? '[color-scheme:dark]' : ''}`} />
                  <span className={`text-[12px] font-medium opacity-30`}>/</span>
                  <input type="date" value={fFim || ''} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`bg-transparent outline-none text-[11px] font-bold uppercase tracking-wider w-full ${temaNoturno ? '[color-scheme:dark]' : ''}`} />
                </div>
              )}
            </div>
         </div>

         <button onClick={() => setMostrarMenuPersonalizar(!mostrarMenuPersonalizar)} 
            className={btnAROXSecundario}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            Personalizar Dashboard
         </button>
      </div>

      {/* PAINEL DE PERSONALIZAÇÃO */}
      <AnimatePresence>
        {mostrarMenuPersonalizar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden w-full">
            <div className={`p-5 rounded-[24px] border mb-6 flex flex-wrap gap-3 px-5 md:px-6 mx-4 md:mx-0 w-full shadow-sm ${temaNoturno ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-black/10'}`}>
              {[
                { id: 'insights', label: 'IA Storytelling' }, { id: 'bruto', label: 'Bruto' }, { id: 'lucro', label: 'Lucro' }, { id: 'ticket', label: 'Ticket' },
                { id: 'termometro', label: 'Crescimento' }, { id: 'linhaTemporal', label: 'Linha Temporal' }, { id: 'pagamentos', label: 'Pagamentos' }, { id: 'produtos', label: 'Rentabilidade' }, { id: 'mapaCalor', label: 'Calor' }, { id: 'combo', label: 'Combos' }
              ].map(item => (
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

      <div className="flex flex-col gap-5 px-4 md:px-0 w-full">
        
        {/* NARRATIVA DE DADOS */}
        {widgets?.insights && insightsDinamicos && insightsDinamicos.length > 0 && (
          <div className={`w-full overflow-hidden p-5 rounded-[24px] border shadow-sm flex items-center gap-4 arox-cinematic ${cardSurface}`}>
             <div className="flex-shrink-0 ml-2">
                {insightsDinamicos[insightAtivo]?.icone}
             </div>
             <div className="flex-1 relative h-10 flex flex-col justify-center w-full min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div key={insightAtivo} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 flex flex-col justify-center w-full">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 truncate w-full ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {insightsDinamicos[insightAtivo]?.titulo || ''}
                    </p>
                    <p className={`text-[13px] font-bold truncate w-full ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      {insightsDinamicos[insightAtivo]?.texto || ''}
                    </p>
                  </motion.div>
                </AnimatePresence>
             </div>
             <div className="hidden sm:flex gap-2 ml-4 pr-2 flex-shrink-0">
                {insightsDinamicos.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === insightAtivo ? (temaNoturno ? 'bg-zinc-300 w-4' : 'bg-zinc-600 w-4') : (temaNoturno ? 'bg-zinc-800' : 'bg-zinc-200')}`} />
                ))}
             </div>
          </div>
        )}

        {/* MÉTRICAS PRINCIPAIS */}
        {([widgets?.bruto, widgets?.lucro, widgets?.ticket].filter(Boolean).length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
            {widgets?.bruto && (
              <motion.div whileHover={{ scale: 1.02 }} className={`p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[120px] w-full arox-cinematic ${cardSurface}`} style={{ animationDelay: '50ms' }}>
                <h3 className={labelArox}>Volume Bruto</h3>
                <p className={`text-3xl font-bold tracking-tight tabular-nums mt-1 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  <span className="text-lg opacity-50 font-normal mr-1">R$</span>{fatTotalSafe.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </motion.div>
            )}
            {widgets?.lucro && (
              <motion.div whileHover={{ scale: 1.02 }} className={`p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[120px] w-full arox-cinematic ${cardSurface}`} style={{ animationDelay: '100ms' }}>
                <h3 className={labelArox}>Lucro Estimado</h3>
                <p className={`text-3xl font-bold tracking-tight tabular-nums mt-1 ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  <span className="text-lg opacity-50 font-normal mr-1">R$</span>{lucroSafe.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </motion.div>
            )}
            {widgets?.ticket && (
              <motion.div whileHover={{ scale: 1.02 }} className={`p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[120px] w-full arox-cinematic ${cardSurface}`} style={{ animationDelay: '150ms' }}>
                <div className="flex justify-between items-start mb-1 w-full">
                  <h3 className={labelArox}>Ticket Médio</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${temaNoturno ? 'bg-white/10 border-white/10 text-zinc-300' : 'bg-black/5 border-black/5 text-zinc-600'}`}>{totalComandas} cmd</span>
                </div>
                <p className={`text-3xl font-bold tracking-tight tabular-nums mt-1 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  <span className="text-lg opacity-50 font-normal mr-1">R$</span>{ticketMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* WIDGETS DRAGGABLE DND-KIT */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={widgetsVisiveis} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 w-full grid-flow-dense">
              {widgetsVisiveis.map((id, index) => (
                <SortableItem key={id} id={id} index={index + 4} temaNoturno={temaNoturno}>
                   {renderizarConteudoWidget(id)}
                </SortableItem>
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeId ? (
              <SortableItem id={activeId} index={0} temaNoturno={temaNoturno} isOverlay>
                   {renderizarConteudoWidget(activeId)}
              </SortableItem>
            ) : null}
          </DragOverlay>
        </DndContext>

      </div>
    </div>
  );
}