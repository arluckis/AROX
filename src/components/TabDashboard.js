'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, animate, AnimatePresence, useScroll, useTransform, useReducedMotion, useSpring, LayoutGroup } from 'framer-motion';
import { Play, Square, AlertCircle, ArrowRight, Wallet, TrendingUp, AlertTriangle, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import CardCardapio from '@/components/dashboard/CardCardapio';

const premiumEase = [0.16, 1, 0.3, 1];

function useImageColors(src) {
  const [colors, setColors] = useState(['#6366f1', '#10b981']);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64; 
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;
        let r1 = 0, g1 = 0, b1 = 0, count1 = 0;
        let r2 = 0, g2 = 0, b2 = 0, count2 = 0;
        for (let i = 0; i < data.length; i += 16) { 
          const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
          if (a < 128) continue;
          const x = (i / 4) % 64;
          if (x < 32) { r1 += r; g1 += g; b1 += b; count1++; } 
          else { r2 += r; g2 += g; b2 += b; count2++; }
        }
        const c1 = count1 > 0 ? `rgb(${Math.round(r1/count1)}, ${Math.round(g1/count1)}, ${Math.round(b1/count1)})` : '#6366f1';
        const c2 = count2 > 0 ? `rgb(${Math.round(r2/count2)}, ${Math.round(g2/count2)}, ${Math.round(b2/count2)})` : '#10b981';
        setColors([c1, c2]);
      } catch (e) {}
    };
  }, [src]);
  return colors;
}

function AnimatedMoney({ value, isDark, className, prefix = 'R$' }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const controls = animate(displayValue, Number(value) || 0, { duration: 1.2, ease: premiumEase, onUpdate: (latest) => setDisplayValue(latest) });
    return controls.stop;
  }, [value]);
  return (
    <span className={className}>
      <span className="text-[0.65em] opacity-60 mr-1 font-medium">{prefix}</span>
      {Number(displayValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export default function TabDashboard({ temaNoturno, core, sessao }) {
  const isDark = temaNoturno;
  const prefersReducedMotion = useReducedMotion();
  const logoUrl = core?.logoEmpresa || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  const dynamicColors = useImageColors(logoUrl);

  const { scrollY } = useScroll();
  const smoothScroll = useSpring(scrollY, { stiffness: 120, damping: 20, mass: 0.3 });
  const heroY = useTransform(smoothScroll, [0, 400], [0, prefersReducedMotion ? 0 : 20]);
  const heroOpacity = useTransform(smoothScroll, [0, 300], [1, 0.5]);

  const { faturamentoHoje, faturamentoMensal, dinheiroParado, ticketMedio, comandasAbertasQtd, itensPendentesQtd, cicloAtrasado, topProdutos, pagamentosResumo, tendenciaFaturamento } = useMemo(() => {
    const hoje = core?.getHoje?.() || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const mesAtual = core?.getMesAtual?.() || hoje.substring(0, 7);
    const dataOntem = new Date(); dataOntem.setDate(dataOntem.getDate() - 1);
    const ontem = dataOntem.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const comandasAll = Array.isArray(core?.comandas) ? core.comandas : [];
    const abertasAll = Array.isArray(core?.comandasAbertas) ? core.comandasAbertas : [];
    const filtradasAll = Array.isArray(core?.comandasFiltradas) ? core.comandasFiltradas : [];
    const rankingSafe = Array.isArray(core?.rankingProdutos) ? core.rankingProdutos : [];
    const pizzaSafe = Array.isArray(core?.dadosPizza) ? core.dadosPizza : [];
    const comandasOntem = comandasAll.filter(c => c?.data?.startsWith(ontem));
    const fatOntem = comandasOntem.reduce((acc, c) => acc + (Array.isArray(c?.produtos) ? c.produtos : []).reduce((sum, p) => sum + Number(p?.preco || 0), 0), 0);
    const fatHoje = Number(core?.faturamentoTotal) || 0;
    const tendenciaFaturamento = fatOntem === 0 ? null : ((fatHoje - fatOntem) / fatOntem) * 100;
    const comandasMes = comandasAll.filter(c => c?.data?.startsWith(mesAtual));
    const fatMensal = comandasMes.reduce((acc, c) => acc + (Array.isArray(c?.produtos) ? c.produtos : []).reduce((sum, p) => sum + Number(p?.preco || 0), 0), 0);
    let dinParado = 0; let itensPend = 0;
    abertasAll.forEach(c => { (Array.isArray(c?.produtos) ? c.produtos : []).filter(p => !p?.pago).forEach(p => { dinParado += Number(p?.preco || 0); itensPend += 1; }); });
    const tMedio = filtradasAll.length > 0 ? (fatHoje / filtradasAll.length) : 0;
    const isAtrasado = core?.caixaAtual?.status === 'aberto' && core?.caixaAtual?.data_abertura && String(core.caixaAtual.data_abertura).substring(0, 10) < hoje;
    return { faturamentoHoje: fatHoje, faturamentoMensal: fatMensal, dinheiroParado: dinParado, ticketMedio: tMedio, comandasAbertasQtd: abertasAll.length, itensPendentesQtd: itensPend, cicloAtrasado: isAtrasado, topProdutos: rankingSafe.slice(0, 3), pagamentosResumo: pizzaSafe, tendenciaFaturamento };
  }, [core]);

  const proximaAcao = useMemo(() => {
    const hora = new Date().getHours();
    if (core?.caixaAtual?.status !== 'aberto') {
      return { id: 'abrir', titulo: "Iniciar Expedição", subtitulo: "O caixa está fechado. Clique para abrir e iniciar vendas.", acao: () => { if (core?.setModalGlobal) { core.setModalGlobal({ visivel: true, titulo: "Abertura de Expediente", mensagem: "Deseja iniciar o caixa com saldo R$ 0,00 e ir direto para o terminal de vendas?", tipo: "confirmacao", acaoConfirmar: () => { core.abrirCaixaManual({ data_abertura: core.getHoje(), saldo_inicial: 0 }); core.setAbaAtiva('comandas'); } }); } else { core?.setAbaAtiva('caixa'); } }, icone: Play, accent: 'emerald' };
    }
    if (dinheiroParado > 0 && comandasAbertasQtd >= 3) return { id: 'risco', titulo: "Cobrar Pendências", subtitulo: `Existem R$ ${dinheiroParado.toFixed(2).replace('.', ',')} retidos aguardando pagamento.`, acao: () => core?.setAbaAtiva('comandas'), icone: AlertCircle, accent: 'amber' };
    if (cicloAtrasado) return { id: 'atraso', titulo: "Turno Estendido", subtitulo: "Operação rodando com data retroativa. Acesse para operar as mesas pendentes.", acao: () => core?.setAbaAtiva('comandas'), icone: Square, accent: 'rose' };
    if (hora >= 23 || hora < 4) return { id: 'fechar', titulo: "Auditoria Final", subtitulo: "Fim de expediente detectado. Acesse o controle para encerrar o ciclo.", acao: () => core?.setAbaAtiva('caixa'), icone: CheckCircle2, accent: 'indigo' };
    if (topProdutos.length > 0) return { id: 'vender', titulo: "Impulsionar Vendas", subtitulo: `Produto campeão: ${topProdutos[0]?.nome}. Aproveite o fluxo e vá para o terminal.`, acao: () => core?.setAbaAtiva('comandas'), icone: Zap, accent: 'zinc' };
    return { id: 'terminal', titulo: "Abrir Terminal", subtitulo: "Operação rodando 100%. Clique para acessar a frente de caixa.", acao: () => core?.setAbaAtiva('comandas'), icone: ArrowRight, accent: 'zinc' };
  }, [core, cicloAtrasado, dinheiroParado, comandasAbertasQtd, topProdutos]);

  const cardPremium = isDark 
    ? 'bg-[#111113]/80 backdrop-blur-[24px] border border-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_8px_30px_rgba(0,0,0,0.2)]' 
    : 'bg-white/70 backdrop-blur-[24px] border border-zinc-200/50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const textPrimary = isDark ? 'text-zinc-50' : 'text-zinc-900';

  const getActionColors = (accent) => {
    const map = {
      emerald: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
      rose: isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-100',
      amber: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-100',
      indigo: isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100',
      zinc: isDark ? 'bg-white/5 text-zinc-300 border-white/10' : 'bg-zinc-900 text-white border-zinc-800'
    };
    return map[accent] || map.zinc;
  };
  
  const rootVariants = { hidden: { opacity: 0, y: 10, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: premiumEase } } };
  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 12, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: premiumEase } } };

  return (
    <div className={`w-full min-h-screen pb-12 pt-6 px-4 md:px-6 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] selection:bg-zinc-800 selection:text-white ${isDark ? 'bg-[#050505]' : 'bg-[#FAFAFA]'}`}>
      
      <motion.div variants={rootVariants} initial="hidden" animate="visible" className="flex flex-col gap-6 max-w-[1200px] w-full mx-auto relative z-10">
        
        <LayoutGroup>
          {/* GRID PRINCIPAL DO TOPO */}
          <motion.div layout transition={{ ...premiumEase, duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
            
            <motion.div layout style={{ y: heroY, opacity: heroOpacity }} className={`lg:col-span-2 relative p-6 md:p-8 rounded-[28px] overflow-hidden flex flex-col justify-end min-h-[180px] border ${isDark ? 'bg-[#0A0A0C] border-white/[0.04]' : 'bg-gradient-to-b from-white to-zinc-50/50 border-zinc-200/50'}`}>
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[28px] z-0">
                <motion.div animate={{ backgroundColor: dynamicColors[0] }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute -right-10 -top-20 w-[400px] h-[400px] blur-[60px] rounded-full opacity-[0.08] mix-blend-screen" />
                <motion.div animate={{ backgroundColor: dynamicColors[1] }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} className="absolute -left-10 -bottom-10 w-[300px] h-[300px] blur-[60px] rounded-full opacity-[0.06] mix-blend-screen" />
              </div>
              <motion.div variants={containerVariants} className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mt-6">
                <div className="flex flex-col gap-5">
                  <motion.div variants={itemVariants} className={`w-14 h-14 shrink-0 rounded-full overflow-hidden border shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${isDark ? 'bg-[#111113]/80 backdrop-blur-md border-white/[0.08]' : 'bg-white backdrop-blur-md border-zinc-200/80'}`}>
                    <img src={logoUrl} alt="Logo Sede" className="w-full h-full object-cover rounded-full" />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight mb-2.5 leading-[1.1] ${textPrimary}`}>{core?.nomeEmpresa || 'AROX Business'}</h1>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-[0.1em] ${isDark ? 'bg-white/10 text-white' : 'bg-zinc-900 text-white'}`}>{core?.dadosPlano?.nome || 'Premium'}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-500/30" />
                      <span className={`text-[12px] font-medium tracking-wide ${textMuted}`}>Sessão por {sessao?.nome_usuario || 'Admin'}</span>
                    </div>
                  </motion.div>
                </div>
                <motion.div variants={itemVariants} className={`flex flex-col gap-1 p-3.5 rounded-xl border backdrop-blur-[24px] min-w-[160px] ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/60 border-zinc-200/60 shadow-sm'}`}>
                  <span className={`text-[9px] font-medium uppercase tracking-[0.15em] ${textMuted}`}>Data Contábil</span>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[14px] font-medium tracking-tight ${textPrimary}`}>{core?.caixaAtual?.data_abertura ? String(core.caixaAtual.data_abertura).substring(0, 10).split('-').reverse().join('/') : core?.getHoje?.().split('-').reverse().join('/')}</span>
                    {cicloAtrasado && <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium uppercase tracking-[0.1em] ${isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>Atrasado</span>}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div layout variants={itemVariants} className="lg:col-span-1 w-full h-full">
              <CardCardapio core={core} sessao={sessao} isDark={isDark} />
            </motion.div>

          </motion.div>

          {/* METRICS CARDS */}
          <motion.div layout variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Faturamento Hoje', value: faturamentoHoje, sub: tendenciaFaturamento !== null && `${tendenciaFaturamento >= 0 ? '+' : ''}${tendenciaFaturamento.toFixed(1)}% vs ontem`, isPositive: tendenciaFaturamento >= 0, main: true },
              { label: 'Projeção Mensal', value: faturamentoMensal },
              { label: 'Ticket Médio', value: ticketMedio, sub: `${Array.isArray(core?.comandasFiltradas) ? core.comandasFiltradas.length : 0} cmd.`, isBadge: true }
            ].map((metric, idx) => (
              <motion.div layout key={idx} variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} transition={{ ease: premiumEase, duration: 0.4 }} className={`p-7 rounded-[28px] flex flex-col justify-between min-h-[170px] ${cardPremium}`}>
                <div className="flex justify-between items-start">
                   <span className={`text-[10px] font-medium uppercase tracking-[0.15em] ${textMuted}`}>{metric.label}</span>
                   {metric.sub && ( <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${metric.isBadge ? (isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600') : (metric.isPositive ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'))}`}>{metric.sub}</span> )}
                </div>
                <AnimatedMoney value={metric.value} isDark={isDark} className={`${metric.main ? 'text-3xl md:text-4xl font-semibold' : 'text-2xl font-medium'} tracking-tight tabular-nums mt-6 ${textPrimary}`} />
              </motion.div>
            ))}
          </motion.div>

          {/* RISK & ACTION */}
          <motion.div layout transition={{ ...premiumEase, duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <motion.div layout variants={itemVariants} className="col-span-1 lg:col-span-2 relative group cursor-pointer" onClick={proximaAcao.acao}>
              <div className={`absolute inset-0 -z-10 blur-[50px] opacity-0 group-hover:opacity-[0.15] transition-opacity duration-700 ${getActionColors(proximaAcao.accent).split(' ')[0]}`} />
              <motion.div whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ ease: premiumEase, duration: 0.4 }} className={`relative z-10 h-full p-8 md:p-10 rounded-[28px] flex flex-col justify-center border transition-all duration-500 ${isDark ? 'bg-[#111113]/90 border-white/[0.08] hover:border-white/20' : 'bg-white border-zinc-200 hover:border-zinc-300'} shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]`}>
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-6 md:gap-8">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[20px] flex items-center justify-center shrink-0 border transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3 ${getActionColors(proximaAcao.accent)}`}>
                      <proximaAcao.icone className="w-7 h-7 md:w-8 md:h-8 font-light" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[9px] font-medium uppercase tracking-[0.2em] mb-2.5 ${proximaAcao.accent === 'emerald' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : textMuted}`}>Ação Primária Recomendada</span>
                      <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight leading-none mb-2.5 ${textPrimary}`}>{proximaAcao.titulo}</h2>
                      <p className={`text-[14px] font-light leading-relaxed ${textMuted}`}>{proximaAcao.subtitulo}</p>
                    </div>
                  </div>
                  <div className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition-all duration-700 ease-out group-hover:translate-x-2 border shadow-sm ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white'}`}><ChevronRight className="w-5 h-5" strokeWidth={1.5} /></div>
                </div>
              </motion.div>
            </motion.div>
            <motion.div layout variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} transition={{ ease: premiumEase, duration: 0.4 }} className="relative h-full">
              <div className={`h-full p-8 rounded-[28px] flex flex-col justify-between transition-colors duration-700 ${cardPremium} ${dinheiroParado > 0 ? (isDark ? 'border-amber-500/20' : 'border-amber-300/50 bg-amber-50/20') : ''}`}>
                <div className="flex items-center gap-2.5 mb-6">
                  <AlertTriangle className={`w-4 h-4 ${dinheiroParado > 0 ? (isDark ? 'text-amber-500' : 'text-amber-600') : textMuted}`} strokeWidth={1.5} />
                  <span className={`text-[9px] font-medium uppercase tracking-[0.15em] ${dinheiroParado > 0 ? (isDark ? 'text-amber-400' : 'text-amber-700') : textMuted}`}>Receita Travada</span>
                </div>
                <div>
                  <AnimatedMoney value={dinheiroParado} isDark={isDark} className={`text-3xl font-semibold tracking-tight tabular-nums ${dinheiroParado > 0 ? (isDark ? 'text-amber-400' : 'text-amber-600') : textPrimary}`} />
                  <div className="flex flex-col gap-2.5 mt-6 pt-5 border-t border-solid border-zinc-500/10">
                    <div className="flex justify-between items-center"><span className={`text-[12px] font-light ${textMuted}`}>Comandas Abertas</span><span className={`text-[13px] font-medium tabular-nums ${textPrimary}`}>{comandasAbertasQtd}</span></div>
                    <div className="flex justify-between items-center"><span className={`text-[12px] font-light ${textMuted}`}>Itens Pendentes</span><span className={`text-[13px] font-medium tabular-nums ${textPrimary}`}>{itensPendentesQtd}</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* DATA DRIVERS */}
          <motion.div layout transition={{ ...premiumEase, duration: 0.5 }} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={`p-8 rounded-[28px] ${cardPremium}`}>
              <div className="flex items-center gap-2.5 mb-6"><TrendingUp className={`w-4 h-4 ${textMuted}`} strokeWidth={1.5} /><span className={`text-[9px] font-medium uppercase tracking-[0.15em] ${textMuted}`}>Motores de Receita (Top 3)</span></div>
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {topProdutos.length > 0 ? topProdutos.map((prod, idx) => (
                    <motion.div key={idx} variants={{ hidden: { opacity: 0, x: -20, filter: 'blur(4px)' }, visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: premiumEase } } }} className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors duration-300 hover:bg-white/[0.02] ${isDark ? 'bg-transparent border-white/[0.04]' : 'bg-transparent border-zinc-200/50'}`}>
                      <div className="flex items-center gap-3 overflow-hidden"><span className={`text-[12px] font-medium w-4 ${textMuted}`}>{idx + 1}.</span><span className={`text-[13px] font-medium tracking-tight truncate ${textPrimary}`}>{prod?.nome || 'Produto'}</span></div>
                      <div className="flex items-baseline gap-3 shrink-0"><span className={`text-[11px] font-light ${textMuted}`}>{prod?.volume || 0}x</span><span className={`text-[13px] font-medium tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>R$ {Number(prod?.valor || prod?.total || prod?.preco || 0).toFixed(2)}</span></div>
                    </motion.div>
                  )) : <div className={`py-8 text-center text-[12px] font-light ${textMuted}`}>Aguardando movimentações.</div>}
                </AnimatePresence>
              </div>
            </div>
            <div className={`p-8 rounded-[28px] ${cardPremium}`}>
               <div className="flex items-center gap-2.5 mb-6"><Wallet className={`w-4 h-4 ${textMuted}`} strokeWidth={1.5} /><span className={`text-[9px] font-medium uppercase tracking-[0.15em] ${textMuted}`}>Entradas Consolidadas</span></div>
              <div className="flex flex-col gap-6">
                <AnimatePresence>
                  {pagamentosResumo.length > 0 ? [...pagamentosResumo].sort((a,b) => (Number(b?.value) || 0) - (Number(a?.value) || 0)).slice(0, 4).map((pag, idx) => {
                    const safeValue = Number(pag?.value) || 0; const perc = faturamentoHoje > 0 ? (safeValue / faturamentoHoje) * 100 : 0;
                    return (
                      <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 15, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: premiumEase } } }} className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-end"><span className={`text-[12px] font-medium ${textPrimary}`}>{pag?.name || 'Outros'}</span><div className="flex items-baseline gap-2.5"><span className={`text-[10px] font-light ${textMuted}`}>{perc.toFixed(0)}%</span><span className={`text-[13px] font-medium tabular-nums ${textPrimary}`}>R$ {safeValue.toFixed(2)}</span></div></div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-zinc-100'}`}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${perc}%` }} viewport={{ once: true }} transition={{ duration: 1.5, ease: premiumEase, delay: 0.2 + (idx * 0.1) }} className={`h-full rounded-full ${isDark ? 'bg-white/60' : 'bg-zinc-800'}`} />
                        </div>
                      </motion.div>
                    );
                  }) : <div className={`py-8 text-center text-[12px] font-light ${textMuted}`}>Nenhum pagamento registrado.</div>}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </LayoutGroup>

      </motion.div>

    </div>
  );
}