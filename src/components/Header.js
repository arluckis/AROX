// src/components/Header.js
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({
  comandaAtiva, setIdSelecionado, setMenuMobileAberto, temaNoturno,
  abaAtiva, fetchData, sessao, caixaAtual
}) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [tempNome, setTempNome] = useState('');
  
  // === ESTADOS PARA CLIENTE FIDELIDADE ===
  const [buscaCliente, setBuscaCliente] = useState('');
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);
  const [clientesFidelidade, setClientesFidelidade] = useState([]);
  const [indexSelecionado, setIndexSelecionado] = useState(0);
  const dropdownClienteRef = useRef(null);

  // === ESTADOS PARA ALOCAÇÃO DE MESA ===
  const [mostrarDropdownMesa, setMostrarDropdownMesa] = useState(false);
  const [buscaMesa, setBuscaMesa] = useState('');
  const [totalMesas, setTotalMesas] = useState(20);
  const [editandoTotalMesas, setEditandoTotalMesas] = useState(false);
  const dropdownMesaRef = useRef(null);
  const inputMesaRef = useRef(null);

  // === CORREÇÃO VISUAL DE TEMA ===
  const isPlanetVisible = abaAtiva === 'comandas' && (!caixaAtual || caixaAtual.status !== 'aberto');
  const isDark = isPlanetVisible ? true : temaNoturno;

  // LÓGICA ANTI-BUG DO F5
  const matchMesaAtiva = (comandaAtiva?.nome || '').match(/^\[Mesa\s(\d+)\]/);
  const mesaAtivaVisivel = comandaAtiva?.mesa || (matchMesaAtiva ? matchMesaAtiva[1] : null);

  const focarBuscaProduto = () => {
    setTimeout(() => {
      const inputProduto = document.querySelector('.input-busca-produto');
      if (inputProduto) inputProduto.focus();
    }, 100);
  };

  const carregarClientes = useCallback(async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data, error } = await supabase.from('clientes_fidelidade').select('id, nome, pontos').eq('empresa_id', sessao.empresa_id);
      if (data && !error) setClientesFidelidade(data);
    } catch (err) {}
  }, [sessao?.empresa_id]);

  useEffect(() => { carregarClientes(); }, [carregarClientes]);

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownClienteRef.current && !dropdownClienteRef.current.contains(e.target)) setMostrarDropdownCliente(false);
      if (dropdownMesaRef.current && !dropdownMesaRef.current.contains(e.target)) { setMostrarDropdownMesa(false); setEditandoTotalMesas(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atalhos Globais no Header
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'F7') {
        e.preventDefault();
        setMostrarDropdownMesa(true);
        setTimeout(() => inputMesaRef.current?.focus(), 50);
      }
      if (e.key === 'F6' && comandaAtiva) {
        e.preventDefault();
        alternarTipoComanda();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [comandaAtiva]);

  // === INTELIGÊNCIA CORRIGIDA ===
  const atualizarNomeInteligente = async (novoNomeCliente, novaMesa) => {
    if (!comandaAtiva) return;

    const nomeAtualDB = comandaAtiva.nome || '';
    const mesaFinal = novaMesa !== undefined ? novaMesa : mesaAtivaVisivel;
    let clienteFinal = novoNomeCliente !== undefined ? novoNomeCliente : '';

    if (novoNomeCliente === undefined) {
      clienteFinal = nomeAtualDB.replace(/^\[Mesa\s\d+\](?:\s*-\s*)?/, '').trim();
      if (['Mesa ', 'Balcão', 'Delivery', 'Comanda'].some(prefix => clienteFinal.startsWith(prefix))) {
         clienteFinal = '';
      }
    }

    let nomeConstruido = '';
    if (mesaFinal && clienteFinal) {
      nomeConstruido = `[Mesa ${mesaFinal}] - ${clienteFinal}`;
    } else if (clienteFinal) {
      nomeConstruido = clienteFinal;
    } else if (mesaFinal) {
      nomeConstruido = `[Mesa ${mesaFinal}]`;
    } else {
      nomeConstruido = comandaAtiva?.tipo || 'Comanda';
    }

    const updates = { nome: nomeConstruido };

    if (comandaAtiva) {
        comandaAtiva.nome = nomeConstruido;
        if(novaMesa !== undefined) comandaAtiva.mesa = novaMesa;
    }

    const { error } = await supabase.from('comandas').update(updates).eq('id', comandaAtiva.id);
    if (!error && fetchData) await fetchData();
  };

  // === LÓGICA DE CLIENTE ===
  const clientesFiltrados = clientesFidelidade.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 6);
  const handleKeyDownCliente = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndexSelecionado(prev => Math.min(prev + 1, clientesFiltrados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndexSelecionado(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (clientesFiltrados.length > 0 && mostrarDropdownCliente) vincularCliente(clientesFiltrados[indexSelecionado]);
      else if (buscaCliente.trim()) vincularCliente({ nome: buscaCliente.trim(), pontos: undefined });
    }
    else if (e.key === 'Escape') { 
      setMostrarDropdownCliente(false); 
      e.target.blur(); 
      focarBuscaProduto();
    }
  };

  const vincularCliente = async (cliente) => {
    if (!comandaAtiva) return;
    let tagsAtuais = comandaAtiva.tags || [];
    if (cliente.pontos !== undefined && !tagsAtuais.includes('Fidelidade')) tagsAtuais = [...tagsAtuais, 'Fidelidade'];
    
    if (tagsAtuais.length !== (comandaAtiva.tags || []).length) {
       await supabase.from('comandas').update({ tags: tagsAtuais }).eq('id', comandaAtiva.id);
    }
    
    await atualizarNomeInteligente(cliente.nome, undefined);

    setBuscaCliente('');
    setMostrarDropdownCliente(false);
    focarBuscaProduto();
  };

  const salvarNome = async () => {
    if (!tempNome || !tempNome.trim() || tempNome === comandaAtiva?.nome) { setEditandoNome(false); return; }
    if (comandaAtiva) comandaAtiva.nome = tempNome; 
    const { error } = await supabase.from('comandas').update({ nome: tempNome }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
    setEditandoNome(false);
  };

  // === LÓGICA DE MESA ===
  const mesasGeradas = Array.from({ length: totalMesas }, (_, i) => String(i + 1));
  const mesasFiltradas = buscaMesa ? mesasGeradas.filter(m => m.includes(buscaMesa)) : mesasGeradas;

  const vincularMesa = async (numero) => {
    if (!comandaAtiva) return;
    await atualizarNomeInteligente(undefined, String(numero));
    setBuscaMesa('');
    setMostrarDropdownMesa(false);
    focarBuscaProduto();
  };

  const handleKeyDownMesa = (e) => {
    if (e.key === 'Enter' && mesasFiltradas.length > 0) {
      e.preventDefault();
      vincularMesa(mesasFiltradas[0]); 
    } else if (e.key === 'Escape') {
      setMostrarDropdownMesa(false);
      e.target.blur();
      focarBuscaProduto();
    }
  };

  const alternarTipoComanda = async () => {
    if (!comandaAtiva) return;
    const novoTipo = comandaAtiva?.tipo === 'Balcão' ? 'Delivery' : 'Balcão';
    if(comandaAtiva) comandaAtiva.tipo = novoTipo; 
    const { error } = await supabase.from('comandas').update({ tipo: novoTipo }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
  };

  const mapAbaTitulo = { comandas: 'Terminal de Operações', fechadas: 'Histórico de Vendas', faturamento: 'Métricas de Crescimento', caixa: 'Controle de Caixa Central', fidelidade: 'CRM & Fidelidade' };

  const Kbd = ({ children }) => (
    <kbd className={`hidden md:inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-[4px] shadow-[0_1px_0_rgba(0,0,0,0.1)] transition-all ${isDark ? 'bg-white/10 text-white/60 border border-white/5' : 'bg-zinc-100 text-zinc-500 border border-zinc-200/60'}`}>{children}</kbd>
  );

  return (
    <motion.header 
      layout
      className={`flex items-center justify-between px-4 sm:px-8 h-[84px] shrink-0 sticky top-0 z-50 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-[40px] border-b ${isDark ? 'border-white/[0.04] bg-[#09090b]/70 shadow-[0_4px_40px_-10px_rgba(0,0,0,0.5)]' : 'border-zinc-200/80 bg-white/70 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.05)]'}`}
    >
      
      {/* Esquerda: Retornar ou Título (Animado) */}
      <div className="flex items-center gap-2 sm:gap-4 w-auto sm:w-[240px] shrink-0 relative z-10">
        <AnimatePresence mode="wait">
          {!comandaAtiva ? (
            <motion.div 
              key="titulo-visao-geral"
              initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 sm:gap-3.5"
            >
              <button onClick={() => setMenuMobileAberto(true)} className={`xl:hidden p-2.5 rounded-2xl transition-all duration-300 active:scale-90 outline-none ${isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <div className={`relative hidden sm:flex items-center justify-center w-6 h-6 rounded-full ${isDark ? 'bg-indigo-500/10' : 'bg-[#5a2e8c]/10'}`}>
                 <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-2 h-2 rounded-full ${isDark ? 'bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.8)]' : 'bg-[#5a2e8c] shadow-[0_0_12px_rgba(90,46,140,0.6)]'}`}
                 />
              </div>
              <h1 className={`font-extrabold text-[15px] tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {mapAbaTitulo[abaAtiva] || 'Visão Geral'}
              </h1>
            </motion.div>
          ) : (
            <motion.div
              key="btn-voltar"
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <button id="btn-voltar-header" onClick={() => { setIdSelecionado(null); setEditandoNome(false); }} className={`group flex items-center gap-3 py-2 pr-5 rounded-2xl transition-all duration-400 outline-none active:scale-95 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full shadow-sm transition-transform duration-500 group-hover:-translate-x-1 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-zinc-200/80'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                </div>
                <span className="hidden sm:inline text-[14px] font-bold tracking-tight">Voltar</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Centro: DYNAMIC ISLAND (Cinematográfica) */}
      <div className="flex justify-end sm:justify-center items-center flex-1 px-0 sm:px-2 h-full relative z-20">
        <AnimatePresence>
          {comandaAtiva && (
            <motion.div 
              layoutId="dynamic-island"
              initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ type: "spring", stiffness: 300, damping: 25, mass: 1 }}
              className={`flex items-center h-12 sm:h-14 rounded-full border shadow-2xl px-1.5 sm:px-2 w-auto sm:w-full max-w-[800px] ring-1 ring-inset ${isDark ? 'bg-[#18181b]/80 border-white/10 shadow-black/60 ring-white/5 backdrop-blur-2xl' : 'bg-white/90 border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-black/[0.02] backdrop-blur-xl'}`}
            >
              
              {/* 1. Nome */}
              <motion.div layout className="flex-shrink-0 relative flex items-center min-w-[36px] md:min-w-[140px] max-w-[120px] sm:max-w-[160px] md:max-w-[220px]">
                {editandoNome ? (
                  <motion.input 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "100%" }}
                    autoFocus className={`w-full h-9 sm:h-10 text-xs sm:text-sm font-bold tracking-tight px-3 sm:px-4 rounded-full outline-none transition-colors shadow-inner ${isDark ? 'bg-black/40 text-white placeholder-zinc-500 focus:ring-1 focus:ring-indigo-500/50' : 'bg-zinc-100/80 text-zinc-900 placeholder-zinc-400 focus:ring-1 focus:ring-[#5a2e8c]/30'}`}
                    placeholder="Nome..." value={tempNome} onChange={e => setTempNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => e.key === 'Enter' && salvarNome()}
                  />
                ) : (
                  <button onClick={() => { setTempNome(comandaAtiva?.nome || ''); setEditandoNome(true); }} className={`h-9 sm:h-10 w-9 sm:w-10 md:w-auto px-0 md:px-4 rounded-full cursor-text transition-all duration-300 flex items-center justify-center md:justify-start gap-2.5 overflow-hidden active:scale-95 group ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}>
                    <svg className={`w-4 h-4 shrink-0 transition-colors ${isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    <span className={`hidden md:block text-[14px] font-bold tracking-tight truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      {comandaAtiva?.nome || 'Sem nome'}
                    </span>
                  </button>
                )}
              </motion.div>

              <motion.div layout className={`w-[1px] h-5 sm:h-6 mx-1 md:mx-2 shrink-0 bg-gradient-to-b from-transparent ${isDark ? 'via-white/20' : 'via-zinc-300'} to-transparent`}></motion.div>

              {/* 2. Busca de Cliente (CRM) - Oculto em telas super pequenas se não estiver focado */}
              <motion.div layout className="relative hidden sm:flex flex-1" ref={dropdownClienteRef}>
                <div 
                  className={`flex items-center h-10 px-2 sm:px-3 w-full rounded-full transition-all duration-300 group cursor-text ${isDark ? 'focus-within:bg-white/10 hover:bg-white/[0.05]' : 'focus-within:bg-zinc-100/80 hover:bg-zinc-50'}`}
                  onClick={() => { setMostrarDropdownCliente(true); setTimeout(() => document.querySelector('.input-cliente')?.focus(), 50); }}
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all duration-500 ${mostrarDropdownCliente ? (isDark ? 'bg-indigo-500/20 text-indigo-400 scale-110' : 'bg-[#5a2e8c]/10 text-[#5a2e8c] scale-110') : 'bg-transparent text-zinc-400 group-hover:text-zinc-500'}`}>
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input 
                    className={`input-cliente w-full bg-transparent text-[14px] font-semibold outline-none ml-2.5 tracking-tight transition-all ${mostrarDropdownCliente ? 'block' : 'hidden md:block'} ${isDark ? 'placeholder-zinc-500 text-white' : 'placeholder-zinc-400 text-zinc-900'}`} 
                    placeholder="Vincular cliente..." value={buscaCliente} onChange={e => { setBuscaCliente(e.target.value); setMostrarDropdownCliente(true); setIndexSelecionado(0); }}
                    onFocus={() => setMostrarDropdownCliente(true)} onKeyDown={handleKeyDownCliente}
                  />
                  <AnimatePresence>
                    {!mostrarDropdownCliente && !buscaCliente && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-auto hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity"><Kbd>F4</Kbd></motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <AnimatePresence>
                  {mostrarDropdownCliente && clientesFiltrados.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scaleY: 0.9, transformOrigin: 'top' }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className={`absolute top-[calc(100%+12px)] left-0 w-full sm:w-[140%] min-w-[320px] rounded-[24px] border shadow-2xl z-50 overflow-hidden p-2 backdrop-blur-[40px] ${isDark ? 'bg-[#18181b]/95 border-white/10 shadow-black/80' : 'bg-white/95 border-zinc-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'}`}
                    >
                      <div className={`flex items-center px-4 py-3 gap-2 ${isDark ? 'border-b border-white/5' : 'border-b border-zinc-100'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className={`text-[10px] font-black tracking-widest uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>CRM Inteligente</span>
                      </div>
                      <div className="p-1.5 flex flex-col gap-1">
                        {clientesFiltrados.map((c, idx) => (
                          <motion.div 
                            key={c.id} onClick={() => vincularCliente(c)} onMouseEnter={() => setIndexSelecionado(idx)}
                            whileTap={{ scale: 0.98 }}
                            className={`group/item flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer transition-colors ${indexSelecionado === idx ? (isDark ? 'bg-white/10 shadow-inner' : 'bg-zinc-100/80 shadow-inner') : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-[13px] shadow-sm ${isDark ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/10 text-indigo-300 ring-1 ring-inset ring-white/10' : 'bg-gradient-to-br from-[#f4ebfe] to-[#e8d5f8] text-[#5a2e8c] ring-1 ring-inset ring-black/5'}`}>
                                {c.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[14px] font-bold tracking-tight ${isDark ? 'text-zinc-200 group-hover/item:text-white' : 'text-zinc-800 group-hover/item:text-black'}`}>{c.nome}</span>
                                <span className={`text-[11px] font-semibold flex items-center gap-1 mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                  <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                  {c.pontos} PONTOS
                                </span>
                              </div>
                            </div>
                            <svg className={`w-4 h-4 transition-transform duration-300 ${indexSelecionado === idx ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} ${isDark ? 'text-indigo-400' : 'text-[#5a2e8c]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div layout className={`hidden sm:block w-[1px] h-5 sm:h-6 mx-1 md:mx-2 shrink-0 bg-gradient-to-b from-transparent ${isDark ? 'via-white/20' : 'via-zinc-300'} to-transparent`}></motion.div>
              
              {/* 3. ALOCAÇÃO DE MESA (F7) */}
              <motion.div layout className="relative" ref={dropdownMesaRef}>
                <button onClick={() => { setMostrarDropdownMesa(!mostrarDropdownMesa); setTimeout(() => inputMesaRef.current?.focus(), 50); }} className={`flex items-center gap-2.5 h-9 sm:h-10 w-9 sm:w-10 md:w-auto justify-center px-0 md:px-4 rounded-full transition-all duration-300 group active:scale-95 ${mostrarDropdownMesa ? (isDark ? 'bg-white/10 ring-1 ring-inset ring-white/20' : 'bg-zinc-100 ring-1 ring-inset ring-black/10') : (isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100/80')} ${mesaAtivaVisivel && !mostrarDropdownMesa ? (isDark ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'bg-emerald-50 hover:bg-emerald-100') : ''}`}>
                  <motion.svg animate={{ rotate: mostrarDropdownMesa ? 180 : 0 }} className={`w-4 h-4 shrink-0 ${mesaAtivaVisivel ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></motion.svg>
                  <span className={`hidden sm:block text-[14px] font-bold tracking-tight transition-colors ${mesaAtivaVisivel ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-zinc-300' : 'text-zinc-700')}`}>
                    {mesaAtivaVisivel ? `Mesa ${mesaAtivaVisivel}` : 'Mesa'}
                  </span>
                  <div className="hidden lg:block ml-1 opacity-0 group-hover:opacity-100 transition-opacity"><Kbd>F7</Kbd></div>
                </button>

                <AnimatePresence>
                  {mostrarDropdownMesa && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scaleY: 0.9, transformOrigin: 'top' }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className={`absolute top-[calc(100%+12px)] right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-[280px] sm:w-[380px] rounded-[28px] border shadow-2xl z-50 overflow-hidden p-4 backdrop-blur-[40px] ${isDark ? 'bg-[#18181b]/95 border-white/10 shadow-black/80' : 'bg-white/95 border-zinc-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'}`}
                    >
                      <div className="flex items-center gap-3 mb-5 relative">
                        <div className="relative flex-1">
                          <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                          <input 
                            ref={inputMesaRef} className={`input-mesa w-full h-12 pl-10 pr-4 rounded-2xl text-sm font-bold outline-none transition-all shadow-inner ${isDark ? 'bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:border-indigo-500/50' : 'bg-zinc-50 border border-zinc-200/80 text-zinc-900 placeholder-zinc-400 focus:border-[#5a2e8c]/50'}`}
                            placeholder="Buscar ou digitar mesa..." value={buscaMesa} onChange={e => setBuscaMesa(e.target.value)} onKeyDown={handleKeyDownMesa}
                          />
                        </div>
                        <button onClick={() => setEditandoTotalMesas(!editandoTotalMesas)} className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-all ${editandoTotalMesas ? (isDark ? 'bg-indigo-500/20 text-indigo-400 rotate-90 scale-105 ring-1 ring-inset ring-indigo-500/30' : 'bg-[#f4ebfe] text-[#5a2e8c] rotate-90 scale-105 ring-1 ring-inset ring-[#5a2e8c]/20') : (isDark ? 'bg-white/5 text-zinc-400 hover:bg-white/10' : 'bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:bg-zinc-100')}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                      </div>

                      <AnimatePresence>
                        {editandoTotalMesas && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className={`mb-5 p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20' : 'bg-gradient-to-br from-[#f4ebfe]/80 to-transparent border-[#5a2e8c]/10'}`}>
                              <label className={`block text-[11px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-indigo-400' : 'text-[#5a2e8c]'}`}>Capacidade do Salão</label>
                              <input type="number" min="1" value={totalMesas} onChange={e => setTotalMesas(Number(e.target.value))} className={`w-full h-11 px-4 rounded-xl text-sm font-bold outline-none transition-all shadow-inner ${isDark ? 'bg-black/40 text-white focus:ring-2 focus:ring-indigo-500/50' : 'bg-white border border-zinc-200/80 text-zinc-900 focus:ring-2 focus:ring-[#5a2e8c]/30'}`} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div layout className="grid grid-cols-5 gap-2.5 max-h-[260px] overflow-y-auto scrollbar-hide p-1">
                        <AnimatePresence>
                          {mesasFiltradas.length > 0 ? mesasFiltradas.map((numero) => (
                            <motion.button 
                              key={numero} 
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => vincularMesa(numero)} 
                              className={`relative overflow-hidden h-12 rounded-[14px] flex items-center justify-center text-[15px] font-extrabold tracking-tight ${mesaAtivaVisivel === numero ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_15px_rgba(52,211,153,0.4)] scale-105 ring-2 ring-emerald-400/50 ring-offset-2 dark:ring-offset-[#18181b]' : (isDark ? 'bg-white/5 text-zinc-300 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' : 'bg-zinc-50 border border-zinc-200/80 text-zinc-700 shadow-[0_2px_4px_rgba(0,0,0,0.02),inset_0_-2px_0_rgba(0,0,0,0.02)]')}`}
                            >
                              {numero}
                              {mesaAtivaVisivel === numero && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-[14px]"></div>}
                            </motion.button>
                          )) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`col-span-5 text-center py-8 text-[13px] font-bold flex flex-col items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                               <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                               Nenhuma mesa encontrada.
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div layout className={`w-[1px] h-5 sm:h-6 mx-1 md:mx-2 shrink-0 bg-gradient-to-b from-transparent ${isDark ? 'via-white/20' : 'via-zinc-300'} to-transparent`}></motion.div>
              
              {/* 4. Tipo de Serviço (Toggle Ultra Premium) */}
              <motion.button layout onClick={alternarTipoComanda} className={`shrink-0 flex items-center justify-center sm:justify-start gap-2.5 h-9 sm:h-10 w-9 sm:w-10 md:w-auto sm:px-4 rounded-full text-[14px] font-bold tracking-tight active:scale-95 group relative overflow-hidden transition-colors ${comandaAtiva?.tipo === 'Delivery' ? (isDark ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 shadow-[0_4px_15px_rgba(251,191,36,0.2)] ring-1 ring-inset ring-amber-300/50' : 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 border border-amber-300 shadow-sm') : (isDark ? 'bg-white/5 text-zinc-300 hover:bg-white/10 ring-1 ring-inset ring-white/5' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200/50')}`}>
                <motion.div 
                  initial={false}
                  animate={{ rotate: comandaAtiva?.tipo === 'Delivery' ? 0 : -10, scale: comandaAtiva?.tipo === 'Delivery' ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="relative flex items-center justify-center"
                >
                  <AnimatePresence mode="wait">
                    {comandaAtiva?.tipo === 'Delivery' ? (
                      <motion.svg key="delivery" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></motion.svg>
                    ) : (
                      <motion.svg key="balcao" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></motion.svg>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.span layout="position" className="hidden md:block relative z-10">{comandaAtiva?.tipo}</motion.span>
                <div className="hidden lg:block ml-1 opacity-0 group-hover:opacity-100 transition-opacity"><Kbd>F6</Kbd></div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Direita: Espaço simétrico invisível para manter a Ilha Dinâmica no centro perfeito */}
      <div className="hidden sm:block w-[240px] shrink-0 pointer-events-none"></div>
    </motion.header>
  );
}