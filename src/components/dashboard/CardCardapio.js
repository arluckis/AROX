'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2, ExternalLink, Share2, QrCode, X, Copy, Download, SlidersHorizontal, Save, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const premiumEase = [0.16, 1, 0.3, 1];
const springPhysics = { type: "spring", stiffness: 500, damping: 35 };

// Default Engine State
const defaultDesignEngine = {
  mode: 'dark',
  primaryColor: '#10B981',
  radius: '16px',
  glassmorphism: 'high',
  density: 'comfortable',
  typography: 'sans'
};

// COMPONENTE FAKE PREMIUM
const DummyMenuPreview = ({ designState, empresaNome }) => {
  const isDark = designState.mode === 'dark';
  const primary = designState.primaryColor;
  
  const fontClass = designState.typography === 'serif' ? 'font-serif tracking-tight' : designState.typography === 'mono' ? 'font-mono tracking-tight' : 'font-sans tracking-tight';
  
  const glassClass = designState.glassmorphism === 'high' 
    ? (isDark ? 'bg-white/10 backdrop-blur-md border border-white/10' : 'bg-white/60 backdrop-blur-md border border-black/5')
    : designState.glassmorphism === 'low' 
    ? (isDark ? 'bg-white/5 backdrop-blur-sm border border-white/5' : 'bg-white/90 backdrop-blur-sm border border-black/5')
    : (isDark ? 'bg-[#111113] border border-white/5' : 'bg-white border border-zinc-200');

  return (
    <div 
      className={`w-full h-full relative overflow-y-auto hide-scrollbar ${isDark ? 'bg-[#050505] text-white' : 'bg-[#F9F9F9] text-zinc-900'} ${fontClass}`} 
      style={{ '--radius': designState.radius }}
    >
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[150px] blur-[50px] opacity-20 pointer-events-none rounded-full transition-colors duration-700" style={{ backgroundColor: primary }} />

      {/* Header Fake */}
      <div className="sticky top-0 left-0 w-full px-4 py-3 z-20">
         <div className={`w-full flex items-center justify-between px-3 py-2 rounded-full shadow-sm transition-all duration-300 ${glassClass}`}>
            <div className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center overflow-hidden">
               <span className="text-[8px] font-bold opacity-60">{empresaNome ? empresaNome.charAt(0) : 'A'}</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-sm transition-colors duration-700" style={{ backgroundColor: primary }} />
               <span className="text-[7px] font-bold tracking-widest uppercase bg-current/5 px-2 py-0.5 rounded-full border border-current/10">Mesa 04</span>
            </div>
         </div>
      </div>

      {/* Hero Fake */}
      <div className="pt-4 pb-4 px-4 text-center relative z-10">
         <p className="text-[7px] uppercase tracking-[0.2em] font-semibold mb-2 opacity-50">Sua experiência</p>
         <h2 className="text-xl font-bold leading-[1.1] tracking-tight">Descubra sabores incríveis.</h2>
      </div>

      {/* Search Fake */}
      <div className="px-4 mb-5 relative z-10">
         <div className={`w-full h-9 flex items-center px-3 gap-2 shadow-sm transition-all duration-300 rounded-[var(--radius)] ${glassClass}`}>
            <Search className="w-3 h-3 opacity-40" />
            <div className="h-1.5 w-16 bg-current/20 rounded-full" />
         </div>
      </div>

      {/* Categorias Fake */}
      <div className="px-4 flex gap-2 mb-6 overflow-hidden relative z-10">
         <div className="px-4 py-1.5 rounded-full text-[10px] font-semibold shadow-sm text-white transition-colors duration-700" style={{ backgroundColor: primary }}>Destaques</div>
         <div className={`px-4 py-1.5 rounded-full text-[10px] font-medium shadow-sm transition-all duration-300 ${glassClass}`}>Pratos</div>
         <div className={`px-4 py-1.5 rounded-full text-[10px] font-medium shadow-sm transition-all duration-300 ${glassClass}`}>Bebidas</div>
      </div>

      {/* Produtos Fake */}
      <div className="px-4 flex flex-col gap-3 pb-20 relative z-10">
         {[1, 2, 3].map((i) => (
           <div key={i} className={`p-3 flex gap-3 shadow-sm transition-all duration-300 rounded-[var(--radius)] ${glassClass}`}>
              <div className="w-14 h-14 rounded-lg bg-current/5 border border-current/5 shrink-0" />
              <div className="flex-1 flex flex-col justify-between py-0.5">
                 <div>
                   <div className="w-3/4 h-2.5 bg-current/80 rounded-full mb-2" />
                   <div className="w-full h-1.5 bg-current/30 rounded-full" />
                 </div>
                 <div className="w-1/3 h-2.5 rounded-full mt-2 transition-colors duration-700" style={{ backgroundColor: primary }} />
              </div>
              <div className="flex items-end">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                   <span className="text-[12px] leading-none mb-0.5">+</span>
                </div>
              </div>
           </div>
         ))}
      </div>

      {/* Fake Carrinho FAB */}
      <div className="absolute bottom-4 left-0 w-full px-4 z-30 pointer-events-none">
         <div className="w-full h-12 rounded-full flex items-center justify-between px-2 pr-4 shadow-[0_10px_20px_rgba(0,0,0,0.3)] text-white transition-colors duration-700" style={{ backgroundColor: primary }}>
            <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
               <span className="text-[10px] font-bold">2</span>
            </div>
            <span className="text-[11px] font-bold">Ver Pedido</span>
            <span className="text-[11px] font-bold">R$ 89,90</span>
         </div>
      </div>
    </div>
  );
};

// IPHONE CINEMATOGRÁFICO COM LAYOUT BLINDADO
const CinematicIPhonePreview = ({ children, primaryColor }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-4, 4]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className="relative flex items-center justify-center perspective-[2000px] w-[280px] h-[580px] shrink-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-[100px] opacity-20 pointer-events-none rounded-full transition-colors duration-1000"
        style={{ backgroundColor: primaryColor }}
      />
      
      <motion.div 
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="relative w-full h-full bg-black rounded-[45px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5),inset_0_0_0_2px_#3f3f46,inset_0_0_0_10px_#000] p-[10px] z-10"
      >
        <div className="absolute inset-0 rounded-[45px] bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/[0.08] pointer-events-none z-50" />

        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-black rounded-full z-50 flex items-center justify-between px-3 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden relative">
               <div className="absolute inset-0 bg-blue-500/20 blur-[2px]" />
               <div className="w-1 h-1 bg-blue-400 rounded-full" />
             </div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
        </div>

        <div className="w-full h-full rounded-[36px] overflow-hidden relative bg-[#050505] isolation-auto">
           {children}
        </div>
        
        <div className="absolute -right-6 top-12 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-2xl z-50 rotate-[-90deg] origin-bottom-left">
          Live Render
        </div>
      </motion.div>
    </div>
  );
};

export default function CardCardapio({ core, sessao, isDark }) {
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState('loading-check');
  const [dadosCardapio, setDadosCardapio] = useState(null);
  
  const [modalQR, setModalQR] = useState(false);
  const [modalDesign, setModalDesign] = useState(false);
  
  const [mesaQtd, setMesaQtd] = useState('');
  const [copiado, setCopiado] = useState(false);
  
  const [designState, setDesignState] = useState(defaultDesignEngine);
  const [salvandoDesign, setSalvandoDesign] = useState(false);
  const temaCarregado = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const empresaId = core?.id || core?.empresa_id || sessao?.empresa_id || sessao?.id;

    if (!empresaId) {
      const timer = setTimeout(() => setStatus('idle'), 1500);
      return () => clearTimeout(timer);
    }

    const verificarExistente = async () => {
      try {
        const { data } = await supabase
          .from('cardapios')
          .select('id, slug, tema')
          .eq('empresa_id', empresaId)
          .single();

        if (data && data.slug) {
          setDadosCardapio(data);
          if (data.tema && !temaCarregado.current) {
            setDesignState(typeof data.tema === 'string' || data.tema.estilo ? defaultDesignEngine : { ...defaultDesignEngine, ...data.tema });
            temaCarregado.current = true;
          }
          setStatus('ready');
        } else {
          setStatus('idle');
        }
      } catch (err) {
        setStatus('idle');
      }
    };
    verificarExistente();
  }, [core, sessao]);

  const handleCriarCardapio = async () => {
    const empresaId = core?.id || core?.empresa_id || sessao?.empresa_id || sessao?.id;
    if (!empresaId) return alert("Erro: ID da empresa não encontrado.");

    setStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      const nomeBase = core?.nomeEmpresa || 'catalogo';
      const slugLimpo = nomeBase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const sufixo = Math.random().toString(36).substring(2, 6);
      const slugFinal = `${slugLimpo}-${sufixo}`;

      const { data, error } = await supabase
        .from('cardapios')
        .insert([{ empresa_id: empresaId, slug: slugFinal, tema: defaultDesignEngine }])
        .select()
        .single();

      if (error) throw error;

      setDadosCardapio(data);
      setStatus('ready');
    } catch (err) {
      alert("Falha ao inicializar experiência. " + (err.message || ""));
      setStatus('idle');
    }
  };

  const handleSalvarDesign = async () => {
    if (!dadosCardapio?.id) return;
    setSalvandoDesign(true);
    try {
      const { error } = await supabase
        .from('cardapios')
        .update({ tema: designState })
        .eq('id', dadosCardapio.id);
      if(error) throw error;
      setTimeout(() => setSalvandoDesign(false), 800);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar alterações.");
      setSalvandoDesign(false);
    }
  };

  const updateConfig = (key, value) => {
    setDesignState(prev => ({ ...prev, [key]: value }));
  };

  const urlBase = typeof window !== 'undefined' ? `${window.location.origin}/cardapio/${dadosCardapio?.slug}` : '';
  const urlComMesa = mesaQtd ? `${urlBase}?mesa=${mesaQtd}` : urlBase;
  const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(urlComMesa)}&margin=20`;

  const copiarLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(urlComMesa);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = urlComMesa;
      document.body.prepend(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch (error) {} finally { textArea.remove(); }
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const cardPremium = isDark 
    ? 'bg-[#111113]/80 backdrop-blur-[24px] border border-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_8px_30px_rgba(0,0,0,0.2)] hover:border-white/[0.08]' 
    : 'bg-white/70 backdrop-blur-[24px] border border-zinc-200/50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:border-zinc-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]';

  const Backdrop = ({ onClick }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} onClick={onClick}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
    />
  );

  return (
    <>
      <motion.div layout transition={springPhysics} className={`p-6 md:p-8 rounded-[28px] flex flex-col justify-between h-full w-full relative z-10 transition-colors duration-500 overflow-hidden ${cardPremium}`}>
        {status === 'ready' && (
           <div className={`absolute -top-20 -right-20 w-40 h-40 blur-[50px] rounded-full opacity-20 pointer-events-none transition-colors duration-700`} style={{ backgroundColor: designState.primaryColor }} />
        )}

        <AnimatePresence mode="wait">
          {status === 'loading-check' && (
            <motion.div key="check" initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(4px)' }} className="flex items-center justify-center h-full">
              <Loader2 className={`w-6 h-6 animate-spin opacity-40 ${isDark ? 'text-white' : 'text-black'}`} />
            </motion.div>
          )}
          
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease: premiumEase }} className="flex flex-col gap-4 h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-zinc-800 text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-white/5">
                    Experiência Digital
                  </div>
                  <Sparkles className="w-4 h-4 opacity-40 text-zinc-500" />
                </div>
                <h3 className={`text-2xl font-semibold tracking-tight leading-[1.1] ${isDark ? 'text-white' : 'text-zinc-900'}`}>Sua vitrine imersiva.</h3>
                <p className={`text-[14px] font-light mt-3 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Aproxime seus clientes de uma experiência visual nível Awwwards, pronta para converter.</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleCriarCardapio} 
                className={`w-full py-4 rounded-[16px] font-semibold text-[14px] tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${isDark ? 'bg-white text-black shadow-white/10 hover:bg-zinc-200' : 'bg-black text-white shadow-black/20 hover:bg-zinc-800'}`}
              >
                <Sparkles className="w-4 h-4" />
                Inicializar Experiência
              </motion.button>
            </motion.div>
          )}

          {status === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5, ease: premiumEase }} className="flex flex-col items-center justify-center h-full gap-5">
              <div className="relative flex items-center justify-center">
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 rounded-full border-2 border-zinc-500/20 border-t-current absolute transition-colors duration-700" style={{ color: designState.primaryColor }} />
                 <Sparkles className="w-4 h-4 animate-pulse opacity-50 transition-colors duration-700" style={{ color: designState.primaryColor }} />
              </div>
              <p className={`text-[11px] font-semibold tracking-[0.2em] uppercase animate-pulse ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Orquestrando Design System...</p>
            </motion.div>
          )}

          {status === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: premiumEase }} className="flex flex-col gap-5 h-full justify-between relative z-10">
              <div className="flex items-center gap-4 p-2">
                <div className="w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 border relative transition-colors duration-700" style={{ backgroundColor: `${designState.primaryColor}15`, borderColor: `${designState.primaryColor}30` }}>
                  <div className="absolute inset-0 rounded-[20px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] pointer-events-none" />
                  <CheckCircle2 className="w-6 h-6 transition-colors duration-700" style={{ color: designState.primaryColor }} />
                </div>
                <div className="overflow-hidden flex flex-col justify-center">
                  <h3 className={`text-[16px] font-semibold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-black'}`}>Experiência Ativa</h3>
                  <a href={urlBase} target="_blank" rel="noopener noreferrer" className={`text-[13px] font-medium truncate transition-colors hover:underline duration-700`} style={{ color: designState.primaryColor }}>
                    /cardapio/{dadosCardapio?.slug}
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <motion.a 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  href={urlBase} target="_blank" rel="noopener noreferrer" 
                  className={`group flex items-center justify-between p-4 rounded-[16px] border text-[13px] font-semibold tracking-wide transition-all duration-300 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-zinc-50 hover:bg-white border-zinc-200 hover:border-zinc-300 text-zinc-900 shadow-sm'}`}
                >
                  <span className="flex items-center gap-2"><ExternalLink className="w-4 h-4 opacity-50" /> Acessar vitrine</span>
                </motion.a>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setModalQR(true)} 
                    className={`flex items-center justify-center gap-2 p-4 rounded-[16px] border text-[13px] font-semibold tracking-wide transition-all duration-300 ${isDark ? 'hover:bg-white/5 border-white/10 text-white' : 'hover:bg-white border-zinc-200 text-zinc-900 shadow-sm'}`}
                  >
                    <Share2 className="w-4 h-4 opacity-50" /> Distribuir
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setModalDesign(true)} 
                    className={`relative overflow-hidden flex items-center justify-center gap-2 p-4 rounded-[16px] border text-[13px] font-semibold tracking-wide transition-all duration-300 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900'}`}
                  >
                    <SlidersHorizontal className="w-4 h-4 opacity-70" /> Engine
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* MODAL 1: DISTRIBUIÇÃO */}
      {isMounted && createPortal(
        <AnimatePresence>
          {modalQR && <Backdrop key="backdrop-qr" onClick={() => setModalQR(false)} />}
          {modalQR && (
            <motion.div key="modal-qr" initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} transition={springPhysics}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] z-[101] rounded-[32px] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border ${isDark ? 'bg-[#0A0A0C]/90 backdrop-blur-2xl border-white/10 text-white' : 'bg-white/90 backdrop-blur-2xl border-zinc-200 text-zinc-900'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-[16px] border shadow-sm ${isDark ? 'bg-[#111113] border-white/10' : 'bg-zinc-50 border-zinc-200'}`}><QrCode className="w-5 h-5" /></div>
                  <h3 className="font-semibold tracking-tight text-xl">Pontos de Acesso</h3>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalQR(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-zinc-100 hover:bg-zinc-200'}`}><X className="w-5 h-5" /></motion.button>
              </div>

              <div className="flex flex-col gap-6">
                <label className="flex flex-col gap-3">
                  <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Mapear Contexto (Mesa/Local)</span>
                  <input type="text" placeholder="Ex: Mesa 04" value={mesaQtd} onChange={(e) => setMesaQtd(e.target.value)} 
                    className={`p-4 rounded-[16px] border outline-none text-[15px] font-medium transition-all shadow-sm ${isDark ? 'bg-[#111113] border-white/10 focus:border-white/30 text-white placeholder:text-zinc-700' : 'bg-zinc-50 border-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder:text-zinc-400'}`}
                  />
                </label>

                <div className={`relative aspect-square w-full rounded-[28px] flex items-center justify-center p-8 border shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden ${isDark ? 'bg-white border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 pointer-events-none" />
                  <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, ...springPhysics }}
                    src={qrCodeImage} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply relative z-10" 
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                    onClick={copiarLink} 
                    className={`flex-1 py-4 rounded-[16px] font-semibold text-[14px] flex justify-center items-center gap-2 border transition-all ${copiado ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : (isDark ? 'bg-[#111113] hover:bg-white/10 border-white/10 text-white shadow-sm' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm')}`}
                  >
                    {copiado ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copiado ? 'Copiado!' : 'Copiar URL'}
                  </motion.button>
                  <motion.a 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                    href={qrCodeImage} download="qrcode-experiencia.png" target="_blank" 
                    className={`flex-1 py-4 rounded-[16px] font-semibold text-[14px] flex justify-center items-center gap-2 transition-all shadow-lg ${isDark ? 'bg-white text-black shadow-white/10' : 'bg-black text-white shadow-black/20'}`}
                  >
                    <Download className="w-4 h-4" /> Baixar PNG
                  </motion.a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL 2: DESIGN ENGINE AAA+ */}
      {isMounted && createPortal(
        <AnimatePresence>
          {modalDesign && <Backdrop key="backdrop-engine" onClick={() => setModalDesign(false)} />}
          {modalDesign && (
            <motion.div key="modal-engine" initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`fixed top-4 bottom-4 left-4 right-4 md:top-8 md:bottom-8 md:left-8 md:right-8 z-[101] rounded-[32px] md:rounded-[40px] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_40px_80px_-20px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col ${isDark ? 'bg-[#050505]/95 text-white backdrop-blur-xl' : 'bg-white/95 text-zinc-900 backdrop-blur-xl'}`}
            >
              {/* Ambient Background Noise */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />

              {/* Header Apple Keynote Style */}
              <header className="relative z-20 flex justify-between items-center px-6 md:px-8 py-5 shrink-0 border-b border-white/[0.04] bg-black/5 backdrop-blur-xl">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className={`relative p-2.5 md:p-3 rounded-[14px] border flex items-center justify-center overflow-hidden ${isDark ? 'bg-[#111113] border-white/10' : 'bg-white border-zinc-200'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                    <Sparkles className="w-5 h-5 relative z-10 transition-colors duration-700" style={{ color: designState.primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-tight text-lg md:text-xl leading-none mb-1">Design Engine</h3>
                    <p className="hidden md:block text-[11px] font-medium tracking-widest uppercase opacity-40">Personalize sua experiência em tempo real</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">Engine Active</span>
                  </div>
                  <motion.button whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalDesign(false)} className={`p-2.5 rounded-full border transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/5' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200'}`}>
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </header>

              <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative z-10">
                
                {/* Lado Esquerdo: Controles */}
                {/* VOLTAMOS PARA AS CLASSES ORIGINAIS QUE NÃO QUEBRAM O FLEX */}
                <div className="flex-1 md:overflow-y-auto p-6 md:p-8 space-y-8 shrink-0 md:shrink hide-scrollbar">
                  <LayoutGroup>
                    
                    {/* Smart Presets */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Smart Presets</label>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">New</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'luxury', label: 'Luxury Black', style: { mode: 'dark', primaryColor: '#171717', radius: '0px', glassmorphism: 'high', typography: 'serif' } },
                          { id: 'apple', label: 'Apple White', style: { mode: 'light', primaryColor: '#0A0A0C', radius: '24px', glassmorphism: 'high', typography: 'sans' } },
                          { id: 'killer', label: 'Conversion Killer', style: { mode: 'dark', primaryColor: '#10B981', radius: '12px', glassmorphism: 'none', typography: 'sans' } }
                        ].map(preset => (
                          <motion.button
                            key={preset.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setDesignState(preset.style)}
                            className={`p-3 rounded-[14px] border text-left transition-all ${isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'}`}
                          >
                            <div className="w-full flex justify-between items-center mb-2">
                              <div className="w-4 h-4 rounded-full border border-white/10 shadow-inner" style={{ backgroundColor: preset.style.primaryColor }} />
                            </div>
                            <div className="text-[12px] font-bold tracking-tight">{preset.label}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Mode & Color */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="space-y-3.5">
                        <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Appearance</label>
                        <div className={`flex rounded-[12px] p-1 border relative ${isDark ? 'bg-[#111113] border-white/10' : 'bg-zinc-200/30 border-zinc-200'}`}>
                          {['light', 'dark'].map(m => {
                             const isActive = designState.mode === m;
                             return (
                               <button key={m} onClick={() => updateConfig('mode', m)} className={`relative flex-1 py-3 rounded-[10px] text-[13px] font-semibold capitalize z-10 transition-colors ${isActive ? (isDark ? 'text-black' : 'text-black') : (isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black')}`}>
                                 {isActive && <motion.div layoutId="mode-pill" className={`absolute inset-0 rounded-[10px] shadow-sm -z-10 ${isDark ? 'bg-white' : 'bg-white border border-zinc-200'}`} transition={springPhysics} />}
                                 {m}
                               </button>
                             );
                          })}
                        </div>
                      </div>
                      <div className="space-y-3.5">
                        <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Accent Color</label>
                        <div className="flex gap-2.5 flex-wrap">
                          {['#10B981', '#3B82F6', '#F43F5E', '#F59E0B', '#A855F7', '#171717'].map(color => {
                            const isActive = designState.primaryColor === color;
                            return (
                              <motion.button 
                                key={color} 
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => updateConfig('primaryColor', color)} 
                                className={`relative w-9 h-9 rounded-full shadow-sm flex items-center justify-center transition-all ${isActive ? 'ring-2 ring-offset-2' : 'ring-0'}`} 
                                style={{ backgroundColor: color, ringColor: color, ringOffsetColor: isDark ? '#0A0A0C' : '#FFFFFF' }}
                              >
                                {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-full mix-blend-difference shadow-sm" />}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Typography & Shape */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="space-y-3.5">
                        <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Typography</label>
                        <div className="relative">
                          <select value={designState.typography} onChange={(e) => updateConfig('typography', e.target.value)} className={`w-full p-4 rounded-[12px] border text-[14px] font-medium outline-none appearance-none transition-shadow focus:ring-2 focus:ring-offset-2 ${isDark ? 'bg-[#111113] border-white/10 text-white focus:ring-white/20 ring-offset-[#0A0A0C]' : 'bg-white border-zinc-200 text-zinc-900 focus:ring-zinc-200 ring-offset-white shadow-sm'}`}>
                            <option value="sans">SF Pro (Minimal)</option>
                            <option value="serif">Editorial (Serif)</option>
                            <option value="mono">Technical (Mono)</option>
                          </select>
                          <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                        </div>
                      </div>
                      <div className="space-y-3.5">
                        <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Border Radius</label>
                        <div className={`flex rounded-[12px] p-1 border relative ${isDark ? 'bg-[#111113] border-white/10' : 'bg-zinc-200/30 border-zinc-200'}`}>
                          {[{l: 'Sharp', v: '0px'}, {l: 'Soft', v: '12px'}, {l: 'Round', v: '24px'}].map(r => {
                             const isActive = designState.radius === r.v;
                             return (
                               <button key={r.v} onClick={() => updateConfig('radius', r.v)} className={`relative flex-1 py-3 rounded-[10px] text-[12px] font-semibold z-10 transition-colors ${isActive ? (isDark ? 'text-black' : 'text-black') : (isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black')}`}>
                                 {isActive && <motion.div layoutId="radius-pill" className={`absolute inset-0 rounded-[10px] shadow-sm -z-10 ${isDark ? 'bg-white' : 'bg-white border border-zinc-200'}`} transition={springPhysics} />}
                                 {r.l}
                               </button>
                             );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Surface Physics */}
                    <div className="space-y-3.5">
                      <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Surface Physics</label>
                      <div className={`flex rounded-[12px] p-1 border relative ${isDark ? 'bg-[#111113] border-white/10' : 'bg-zinc-200/30 border-zinc-200'}`}>
                        {['none', 'low', 'high'].map(g => {
                            const isActive = designState.glassmorphism === g;
                            return (
                              <button key={g} onClick={() => updateConfig('glassmorphism', g)} className={`relative flex-1 py-3 rounded-[10px] text-[13px] font-semibold capitalize z-10 transition-colors ${isActive ? (isDark ? 'text-black' : 'text-black') : (isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black')}`}>
                                {isActive && <motion.div layoutId="glass-pill" className={`absolute inset-0 rounded-[10px] shadow-sm -z-10 ${isDark ? 'bg-white' : 'bg-white border border-zinc-200'}`} transition={springPhysics} />}
                                {g}
                              </button>
                            );
                        })}
                      </div>
                    </div>
                  </LayoutGroup>
                </div>

                {/* Lado Direito: Preview & Save (COM CLASSES REVERTIDAS E SEGURAS) */}
                <div className={`w-full md:w-[320px] lg:w-[360px] shrink-0 border-t md:border-t-0 md:border-l flex flex-col p-6 items-center justify-between ${isDark ? 'border-white/10 bg-[#0A0A0C]/50' : 'border-zinc-200 bg-zinc-50'}`}>
                  
                  {/* Glow dinâmico de fundo do painel direito */}
                  <div className="absolute inset-0 opacity-[0.08] blur-[80px] pointer-events-none transition-colors duration-1000" style={{ backgroundColor: designState.primaryColor }} />

                  <div className="w-full flex-1 flex items-center justify-center min-h-[450px] md:min-h-0 py-4 relative z-10">
                    <div className="origin-center scale-[0.80] md:scale-[0.70] lg:scale-[0.85] transition-transform duration-300">
                      <CinematicIPhonePreview primaryColor={designState.primaryColor}>
                        <DummyMenuPreview designState={designState} empresaNome={core?.nomeEmpresa || 'AROX'} />
                      </CinematicIPhonePreview>
                    </div>
                  </div>

                  {/* FIXED BOTTOM DOCK PARA O BOTÃO SALVAR */}
                  <div className="w-full shrink-0 pt-6 mt-4 border-t border-current/10 relative z-20">
                    <motion.button 
                      onClick={handleSalvarDesign}
                      disabled={salvandoDesign}
                      whileHover={{ scale: 1.02, y: -2, boxShadow: `0 20px 40px -10px ${designState.primaryColor}50` }}
                      whileTap={{ scale: 0.98 }}
                      style={{ backgroundColor: designState.primaryColor }}
                      className={`relative overflow-hidden w-full h-14 rounded-full transition-all group flex items-center justify-center shadow-lg text-white font-bold tracking-wide`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      
                      <AnimatePresence mode="wait">
                        {salvandoDesign ? (
                          <motion.div key="saving" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Aplicando na Vitrine...</span>
                          </motion.div>
                        ) : (
                          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5" />
                            <span>Publicar Design Engine</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function ChevronDown(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}