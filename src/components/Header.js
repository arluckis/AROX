// src/components/Header.js
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

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

  // LÓGICA ANTI-BUG DO F5: Lê a mesa diretamente do texto caso o banco não traga a coluna `mesa`
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
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // === INTELIGÊNCIA CORRIGIDA (Bug das 2 Mesas Resolvido) ===
  const atualizarNomeInteligente = async (novoNomeCliente, novaMesa) => {
    if (!comandaAtiva) return;

    const nomeAtualDB = comandaAtiva.nome || '';
    const mesaFinal = novaMesa !== undefined ? novaMesa : mesaAtivaVisivel;
    let clienteFinal = novoNomeCliente !== undefined ? novoNomeCliente : '';

    if (novoNomeCliente === undefined) {
      // Regex corrigido: remove a mesa antiga, o hífen agora é opcional -> (?:-\s*)?
      clienteFinal = nomeAtualDB.replace(/^\[Mesa\s\d+\](?:\s*-\s*)?/, '').trim();
      
      // Limpa os fallbacks do sistema
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
    if (novaMesa !== undefined) updates.mesa = novaMesa;

    // Otimista local
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
    else if (e.key === 'Escape') { setMostrarDropdownCliente(false); e.target.blur(); }
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
    }
  };

  const alternarTipoComanda = async () => {
    if (!comandaAtiva) return;
    const novoTipo = comandaAtiva?.tipo === 'Balcão' ? 'Delivery' : 'Balcão';
    if(comandaAtiva) comandaAtiva.tipo = novoTipo; 
    const { error } = await supabase.from('comandas').update({ tipo: novoTipo }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
  };

  const mapAbaTitulo = { comandas: 'Terminal', fechadas: 'Histórico', faturamento: 'Métricas', caixa: 'Caixa Central', fidelidade: 'Clientes' };

  return (
    <header className={`flex items-center justify-between px-4 sm:px-8 h-[76px] shrink-0 sticky top-0 z-50 transition-colors duration-500 bg-transparent backdrop-blur-2xl border-b will-change-transform ${isDark ? 'border-white/[0.06] bg-[#09090b]/85' : 'border-zinc-200 bg-white/85'}`}>
      
      {/* Esquerda: Retornar ou Título */}
      <div className="flex items-center gap-2 sm:gap-4 w-auto sm:w-[200px] shrink-0">
        <button onClick={() => setMenuMobileAberto(true)} className={`xl:hidden p-2 rounded-xl transition duration-200 active:scale-95 outline-none ${isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        {comandaAtiva ? (
          <button onClick={() => { setIdSelecionado(null); setEditandoNome(false); }} className={`group flex items-center gap-2 py-2 pr-4 rounded-xl transition-all duration-300 outline-none active:scale-95 ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-transform duration-500 group-hover:-rotate-12 ${isDark ? 'bg-white/5 group-hover:bg-white/10' : 'bg-zinc-100 group-hover:bg-zinc-200'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </div>
            <span className="hidden sm:inline text-sm font-bold tracking-tight">Voltar</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-[#5a2e8c] shadow-[0_0_8px_rgba(90,46,140,0.6)]'}`}></div>
            <h1 className={`font-bold text-base tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {mapAbaTitulo[abaAtiva] || 'Visão Geral'}
            </h1>
          </div>
        )}
      </div>

      {/* Centro: Controles Ultra Premium da Comanda */}
      <div className="flex justify-center items-center flex-1 px-2 h-full relative">
        {comandaAtiva && (
          <div className={`flex items-center h-12 rounded-full border shadow-sm px-1.5 transition-all duration-300 w-full max-w-[720px] hover:shadow-md ${isDark ? 'bg-[#18181b]/80 border-white/10 shadow-black/50' : 'bg-white/80 border-zinc-200 shadow-zinc-200/50 backdrop-blur-md'}`}>
            
            {/* 1. Nome */}
            <div className="flex-shrink-0 relative hidden md:block min-w-[120px] max-w-[200px]">
              {editandoNome ? (
                <input 
                  autoFocus className={`w-full h-9 text-sm font-bold tracking-tight px-4 rounded-full outline-none transition-all ${isDark ? 'bg-white/10 text-white placeholder-zinc-500' : 'bg-zinc-100 text-zinc-900 placeholder-zinc-400'}`}
                  placeholder="Nome..." value={tempNome} onChange={e => setTempNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => e.key === 'Enter' && salvarNome()}
                />
              ) : (
                <div onClick={() => { setTempNome(comandaAtiva?.nome || ''); setEditandoNome(true); }} className={`h-9 px-3 rounded-full cursor-text transition-all flex items-center gap-2 overflow-hidden hover:scale-105 active:scale-95 ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}>
                  <svg className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  <span className={`text-[13px] font-bold tracking-tight truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {comandaAtiva?.nome || 'Sem nome'}
                  </span>
                </div>
              )}
            </div>

            <div className={`hidden md:block w-[1px] h-5 mx-1.5 shrink-0 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`}></div>

            {/* 2. Busca de Cliente (Fidelidade/Vínculo) */}
            <div className="relative flex-1" ref={dropdownClienteRef}>
              <div className={`flex items-center h-9 px-3 rounded-full transition-all group ${isDark ? 'focus-within:bg-white/5 hover:bg-white/[0.03]' : 'focus-within:bg-zinc-50 hover:bg-zinc-50/50'}`}>
                <svg className={`w-4 h-4 shrink-0 transition-colors ${isDark ? (mostrarDropdownCliente ? 'text-indigo-400' : 'text-zinc-500') : (mostrarDropdownCliente ? 'text-[#5a2e8c]' : 'text-zinc-400')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <input 
                  className={`input-cliente w-full bg-transparent text-[13px] font-semibold outline-none ml-2 tracking-tight md:block ${!mostrarDropdownCliente ? 'hidden' : 'block'} ${isDark ? 'placeholder-zinc-600 text-white' : 'placeholder-zinc-400 text-zinc-900'}`} 
                  placeholder="Cliente..." value={buscaCliente} onChange={e => { setBuscaCliente(e.target.value); setMostrarDropdownCliente(true); setIndexSelecionado(0); }}
                  onFocus={() => setMostrarDropdownCliente(true)} onKeyDown={handleKeyDownCliente}
                />
                {!mostrarDropdownCliente && !buscaCliente && (
                   <span className="hidden md:flex ml-auto text-[9px] font-black uppercase tracking-wider opacity-30 group-hover:opacity-60 transition-opacity">F5</span>
                )}
              </div>
              
              {mostrarDropdownCliente && clientesFiltrados.length > 0 && (
                <div className={`absolute top-full left-0 mt-3 w-full sm:w-[130%] min-w-[280px] rounded-2xl border shadow-2xl z-50 overflow-hidden p-2 backdrop-blur-3xl origin-top animate-in fade-in zoom-in-95 ${isDark ? 'bg-[#18181b]/95 border-white/10 shadow-black/50' : 'bg-white/95 border-zinc-200 shadow-zinc-200/50'}`}>
                  <div className={`px-3 py-2 text-[10px] font-black tracking-widest uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>CRM Fidelidade</div>
                  {clientesFiltrados.map((c, idx) => (
                    <div 
                      key={c.id} onClick={() => vincularCliente(c)} onMouseEnter={() => setIndexSelecionado(idx)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${indexSelecionado === idx ? (isDark ? 'bg-white/10' : 'bg-zinc-100') : ''}`}
                    >
                       <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#f4ebfe] text-[#5a2e8c]'}`}>{c.nome.charAt(0).toUpperCase()}</div>
                         <div className="flex flex-col">
                           <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{c.nome}</span>
                           <span className={`text-[10px] font-semibold ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{c.pontos} pontos VIP</span>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`w-[1px] h-5 mx-1.5 shrink-0 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`}></div>
            
            {/* 3. ALOCAÇÃO DE MESA PREMIUM (F7) */}
            <div className="relative" ref={dropdownMesaRef}>
              <button onClick={() => { setMostrarDropdownMesa(!mostrarDropdownMesa); setTimeout(() => inputMesaRef.current?.focus(), 50); }} className={`flex items-center gap-2 h-9 px-3 sm:px-4 rounded-full transition-all duration-300 group active:scale-95 ${mostrarDropdownMesa ? (isDark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-zinc-100 ring-1 ring-black/10') : (isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50')}`}>
                <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${mostrarDropdownMesa ? 'rotate-180' : ''} ${mesaAtivaVisivel ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-zinc-500' : 'text-zinc-400')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                <span className={`hidden sm:block text-[13px] font-bold tracking-tight ${mesaAtivaVisivel ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-zinc-400' : 'text-zinc-500')}`}>
                  {mesaAtivaVisivel ? `Mesa ${mesaAtivaVisivel}` : 'Alocar'}
                </span>
                <span className="hidden lg:flex text-[9px] font-black uppercase tracking-wider opacity-30 group-hover:opacity-60 transition-opacity ml-1">F7</span>
              </button>

              {mostrarDropdownMesa && (
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[280px] sm:w-[360px] rounded-[24px] border shadow-2xl z-50 overflow-hidden p-4 backdrop-blur-3xl origin-top animate-in fade-in slide-in-from-top-4 duration-300 ease-out ${isDark ? 'bg-[#18181b]/95 border-white/10 shadow-black/80' : 'bg-white/95 border-zinc-200 shadow-zinc-300/80'}`}>
                  
                  <div className="flex items-center gap-2 mb-4 relative">
                    <input 
                      ref={inputMesaRef} className={`input-mesa w-full h-11 px-4 rounded-xl text-sm font-bold outline-none transition-all duration-300 ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-indigo-500/50 focus:bg-white/10' : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-[#5a2e8c]/50 focus:bg-white focus:shadow-sm'}`}
                      placeholder="Filtrar mesa..." value={buscaMesa} onChange={e => setBuscaMesa(e.target.value)} onKeyDown={handleKeyDownMesa}
                    />
                    <button onClick={() => setEditandoTotalMesas(!editandoTotalMesas)} className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 ${editandoTotalMesas ? (isDark ? 'bg-indigo-500/20 text-indigo-400 rotate-90' : 'bg-[#f4ebfe] text-[#5a2e8c] rotate-90') : (isDark ? 'bg-white/5 text-zinc-400 hover:bg-white/10' : 'bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-300')}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                  </div>

                  {editandoTotalMesas && (
                    <div className={`mb-4 p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${isDark ? 'bg-white/[0.03] border-indigo-500/30' : 'bg-[#f4ebfe]/50 border-[#5a2e8c]/20'}`}>
                      <label className={`block text-[11px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-indigo-400' : 'text-[#5a2e8c]'}`}>Total de Mesas no Salão</label>
                      <input type="number" min="1" value={totalMesas} onChange={e => setTotalMesas(Number(e.target.value))} className={`w-full h-10 px-3 rounded-lg text-sm font-bold outline-none transition-all ${isDark ? 'bg-[#09090b] text-white focus:ring-1 focus:ring-indigo-500' : 'bg-white border border-zinc-200 text-zinc-900 focus:ring-1 focus:ring-[#5a2e8c]'}`} />
                    </div>
                  )}

                  <div className="grid grid-cols-5 gap-2 max-h-[240px] overflow-y-auto scrollbar-hide p-1">
                    {mesasFiltradas.length > 0 ? mesasFiltradas.map((numero, idx) => (
                      <button 
                        key={numero} onClick={() => vincularMesa(numero)} 
                        className={`h-11 rounded-xl flex items-center justify-center text-sm font-bold tracking-tight transition-all duration-200 active:scale-90 hover:scale-105 animate-in fade-in zoom-in-95 ${mesaAtivaVisivel === numero ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30 scale-105' : (isDark ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/5' : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 shadow-sm hover:shadow')}`}
                        style={{ animationDelay: `${idx * 15}ms` }}
                      >
                        {numero}
                      </button>
                    )) : (
                      <div className={`col-span-5 text-center py-6 text-sm font-semibold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Mesa não encontrada.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={`w-[1px] h-5 mx-1.5 shrink-0 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`}></div>
            
            {/* 4. Tipo (Balcão/Delivery) */}
            <button onClick={alternarTipoComanda} className={`shrink-0 flex items-center justify-center sm:justify-start gap-2 h-9 w-9 sm:w-auto sm:px-4 rounded-full text-[13px] font-bold tracking-tight transition-all active:scale-95 group relative ${comandaAtiva?.tipo === 'Delivery' ? (isDark ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm') : (isDark ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900')}`}>
              {comandaAtiva?.tipo === 'Delivery' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              )}
              <span className="hidden sm:block">{comandaAtiva?.tipo}</span>
              <span className={`hidden lg:flex text-[9px] font-black uppercase tracking-wider ml-1 transition-opacity ${comandaAtiva?.tipo === 'Delivery' ? (isDark ? 'text-zinc-950/50' : 'text-amber-700/50') : 'opacity-30 group-hover:opacity-60'}`}>F6</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Direita: Espaçador para manter simetria */}
      <div className="hidden sm:block w-[200px] shrink-0"></div>
    </header>
  );
}