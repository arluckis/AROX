'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export default function Header({
  comandaAtiva, setIdSelecionado, setMenuMobileAberto, temaNoturno,
  abaAtiva, fetchData, sessao, caixaAtual, setAbaAtiva,
  sidebarExpandida = false // Nova prop cirúrgica adicionada aqui
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

  // === CORREÇÃO VISUAL DE TEMA E PLANETA ===
  const isPlanetVisible = abaAtiva === 'comandas' && (!caixaAtual || caixaAtual.status !== 'aberto');
  const isDark = temaNoturno; 

  // === LÓGICA DE STATUS OPERACIONAL BASE ===
  const isOperacaoAtiva = caixaAtual?.status === 'aberto';
  let statusOperacao = isOperacaoAtiva ? 'ativa' : 'inativa';
  
  let dataCaixaFormatada = '';
  if (caixaAtual?.data_abertura) {
    const [ano, mes, dia] = String(caixaAtual.data_abertura).substring(0, 10).split('-');
    dataCaixaFormatada = `${dia}/${mes}`;
  }

  if (isOperacaoAtiva && caixaAtual?.data_abertura) {
    const dataAberturaDB = String(caixaAtual.data_abertura).substring(0, 10);
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    
    if (dataAberturaDB < hoje && agora.getHours() >= 5) {
      statusOperacao = 'pendente';
    }
  }

  // === AVISO GLOBAL PREMIUM DE CICLO ESTENDIDO ===
  const hojeCalendario = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const isCicloAtrasado = caixaAtual?.status === 'aberto' && caixaAtual?.data_abertura && String(caixaAtual.data_abertura).substring(0, 10) < hojeCalendario;

  // 🧠 === SISTEMA DE ESTADO OPERACIONAL INTELIGENTE === 🧠
  const [horarioFechamento, setHorarioFechamento] = useState('23:00:00');
  const [tensaoEstado, setTensaoEstado] = useState('normal');

  useEffect(() => {
    const fetchConfigEmpresa = async () => {
      if (!sessao?.empresa_id) return;
      const { data } = await supabase.from('empresas').select('horario_fechamento').eq('id', sessao.empresa_id).single();
      if (data?.horario_fechamento) {
        setHorarioFechamento(data.horario_fechamento);
      }
    };
    fetchConfigEmpresa();
  }, [sessao?.empresa_id]);

  useEffect(() => {
    if (statusOperacao === 'inativa') {
      setTensaoEstado('normal');
      return;
    }

    const calcularTensao = () => {
      const agoraStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
      const agora = new Date(agoraStr);
      const agoraMinutos = agora.getHours() * 60 + agora.getMinutes();

      const [fHourStr, fMinStr] = horarioFechamento.split(':');
      const fHour = parseInt(fHourStr);
      const fMin = parseInt(fMinStr);
      let fechamentoMinutos = fHour * 60 + fMin;

      if (fHour < 5 && agora.getHours() >= 12) fechamentoMinutos += 24 * 60;
      let minAtuaisParaCalculo = agoraMinutos;
      if (agora.getHours() < 5 && fHour >= 12) minAtuaisParaCalculo += 24 * 60;

      const diff = fechamentoMinutos - minAtuaisParaCalculo;

      if (diff > 10) setTensaoEstado('normal');
      else if (diff <= 10 && diff > 0) setTensaoEstado('pre-fechamento');
      else if (diff <= 0 && diff > -30) setTensaoEstado('atraso');
      else setTensaoEstado('critico');
    };

    calcularTensao();
    const tickInterval = setInterval(calcularTensao, 60000);
    return () => clearInterval(tickInterval);
  }, [statusOperacao, horarioFechamento]);

  const getThemeStyles = () => {
    if (statusOperacao === 'inativa') return { 
      headerBg: isDark ? 'bg-[#09090b]/70 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.03)]' : 'bg-white/70 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.04)]',
      btnBg: isDark ? 'bg-white/5 ring-white/10 text-zinc-400 hover:bg-white/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]' : 'bg-black/5 ring-black/5 text-zinc-600 hover:bg-black/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]',
      dot: 'bg-zinc-500/50',
      ping: 'hidden',
      label: 'Sistema inativo',
      mobileLabel: 'Inativo',
      msgText: ''
    };

    switch (tensaoEstado) {
      case 'pre-fechamento':
        return {
          headerBg: isDark ? 'bg-[#09090b]/75 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.03)]' : 'bg-white/75 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.04)]',
          btnBg: isDark 
            ? 'bg-amber-500/10 ring-amber-500/20 text-amber-400/90 shadow-[inset_0_1px_4px_rgba(245,158,11,0.05),0_2px_8px_-2px_rgba(0,0,0,0.2)] hover:bg-amber-500/15' 
            : 'bg-amber-500/10 ring-amber-500/20 text-amber-700 shadow-[inset_0_1px_4px_rgba(245,158,11,0.05),0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-amber-500/15',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]', 
          ping: 'bg-amber-400/40 animate-[pulse_4s_ease-in-out_infinite]',
          label: 'Finalizar ciclo',
          mobileLabel: 'Finalizar',
          msgText: 'Janela operacional'
        };
      case 'atraso':
        return {
          headerBg: isDark ? 'bg-[#09090b]/80 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)]' : 'bg-white/80 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.05)]',
          btnBg: isDark 
            ? 'bg-orange-500/10 ring-orange-500/20 text-orange-400/90 shadow-[inset_0_1px_6px_rgba(249,115,22,0.05),0_2px_8px_-2px_rgba(0,0,0,0.2)] hover:bg-orange-500/15' 
            : 'bg-orange-500/10 ring-orange-500/20 text-orange-700 shadow-[inset_0_1px_6px_rgba(249,115,22,0.05),0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-orange-500/15',
          dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]', 
          ping: 'bg-orange-500/40 animate-[pulse_3s_ease-in-out_infinite]',
          label: 'Encerramento pendente',
          mobileLabel: 'Pendente',
          msgText: 'Operação estendida'
        };
      case 'critico':
        return {
          headerBg: isDark 
            ? 'bg-gradient-to-b from-rose-950/10 to-[#09090b]/90 shadow-[inset_0_-1px_0_0_rgba(225,29,72,0.08)]' 
            : 'bg-gradient-to-b from-rose-50/50 to-white/90 shadow-[inset_0_-1px_0_0_rgba(225,29,72,0.08)]',
          btnBg: isDark 
            ? 'bg-rose-500/10 ring-rose-500/20 text-rose-400/90 shadow-[inset_0_0_12px_rgba(225,29,72,0.1),0_2px_8px_-2px_rgba(0,0,0,0.2)] hover:bg-rose-500/15 transition-all duration-500' 
            : 'bg-rose-500/10 ring-rose-500/20 text-rose-700 shadow-[inset_0_0_12px_rgba(225,29,72,0.08),0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-rose-500/15 transition-all duration-500',
          dot: 'bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.6)]', 
          ping: 'bg-rose-500/40 animate-[pulse_2s_ease-in-out_infinite]',
          label: 'Encerrar operação',
          mobileLabel: 'Encerrar',
          msgText: 'Ciclo excedido'
        };
      default:
        return {
          headerBg: isDark ? 'bg-[#09090b]/70 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.03)]' : 'bg-white/70 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.04)]',
          btnBg: isDark ? 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-400/90 hover:bg-emerald-500/15 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]' : 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-700 hover:bg-emerald-500/15 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]',
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]', 
          ping: 'bg-emerald-500/30 animate-[pulse_4s_ease-in-out_infinite]',
          label: statusOperacao === 'pendente' ? 'Sistema ativo' : `Ciclo • ${dataCaixaFormatada}`,
          mobileLabel: statusOperacao === 'pendente' ? 'Ativo' : dataCaixaFormatada,
          msgText: ''
        };
    }
  };

  const currentStyle = getThemeStyles();

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownClienteRef.current && !dropdownClienteRef.current.contains(e.target)) setMostrarDropdownCliente(false);
      if (dropdownMesaRef.current && !dropdownMesaRef.current.contains(e.target)) { setMostrarDropdownMesa(false); setEditandoTotalMesas(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const clientesFiltrados = clientesFidelidade.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 6);

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
    if (e.key === 'Enter' && mesasFiltradas.length > 0) { e.preventDefault(); vincularMesa(mesasFiltradas[0]); } 
    else if (e.key === 'Escape') { setMostrarDropdownMesa(false); e.target.blur(); focarBuscaProduto(); }
  };

  const alternarTipoComanda = async () => {
    if (!comandaAtiva) return;
    const novoTipo = comandaAtiva?.tipo === 'Balcão' ? 'Delivery' : 'Balcão';
    if(comandaAtiva) comandaAtiva.tipo = novoTipo; 
    const { error } = await supabase.from('comandas').update({ tipo: novoTipo }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
  };

  const irParaControleOperacional = () => {
    if(setAbaAtiva) setAbaAtiva('caixa');
    setIdSelecionado(null);
  };

  const mapAbaTitulo = { comandas: 'Terminal de Operações', fechadas: 'Histórico de Vendas', faturamento: 'Métricas de Crescimento', caixa: 'Controle Operacional', fidelidade: 'CRM & Fidelidade' };

  const Kbd = ({ children }) => (
    <kbd className={`hidden xl:flex items-center justify-center px-1.5 h-[18px] text-[9px] font-semibold uppercase tracking-widest rounded-md transition-all shrink-0 ${isDark ? 'bg-white/5 text-zinc-400 ring-1 ring-white/10' : 'bg-black/5 text-zinc-500 ring-1 ring-black/5'}`}>
      {children}
    </kbd>
  );

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full">
      
      {/* LINHA PREMIUM GLOBAL DE CICLO ATRASADO */}
      <AnimatePresence>
        {isCicloAtrasado && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 22, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full flex items-center justify-center relative overflow-hidden border-b z-[100] ${isDark ? 'bg-[#0A0A0A] border-amber-500/10' : 'bg-[#FAFAFA] border-amber-500/20'}`}
          >
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent ${isDark ? 'via-amber-500/10' : 'via-amber-500/5'} to-transparent`}
            />
            
            <div className="flex items-center justify-center gap-3 relative z-10 px-4 w-full text-center">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] truncate ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                TURNO ESTENDIDO— DADOS CONTÁBEIS SENDO DIRECIONADOS PARA O DIA {caixaAtual?.data_abertura ? caixaAtual.data_abertura.substring(0,10).split('-').reverse().join('/') : ''}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header 
        className={`flex items-center justify-between px-3 sm:px-6 h-[72px] shrink-0 transition-all duration-[800ms] ease-out backdrop-blur-[24px] ${currentStyle.headerBg}`}
      >
        
        {/* Esquerda: Identidade & Navegação */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 relative z-20 w-auto sm:w-[280px]">
          
          <AnimatePresence initial={false}>
            {!sidebarExpandida && (
              <motion.div
                initial={{ opacity: 0, width: 0, filter: 'blur(4px)', x: -10 }}
                animate={{ opacity: 1, width: 'auto', filter: 'blur(0px)', x: 0 }}
                exit={{ opacity: 0, width: 0, filter: 'blur(4px)', x: -10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center cursor-default shrink-0 overflow-hidden"
              >
                <span className={`font-black tracking-[-0.04em] text-[18px] leading-none select-none flex items-center pr-3 bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-b from-white to-zinc-400' : 'bg-gradient-to-b from-zinc-900 to-zinc-500'}`}>
                  AROX
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout" initial={false}>
            {comandaAtiva ? (
              <motion.button
                key="btn-voltar"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                onClick={() => { setIdSelecionado(null); setEditandoNome(false); }} 
                className={`group flex items-center justify-center sm:justify-start w-9 h-9 sm:w-auto sm:px-3 sm:gap-2 rounded-xl transition-colors duration-200 outline-none ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'}`}
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                <span className="hidden sm:inline text-[13px] font-semibold tracking-tight">Voltar</span>
              </motion.button>
            ) : (
              <motion.button
                key="btn-menu"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                onClick={() => setMenuMobileAberto(true)} 
                className={`xl:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200 outline-none ${isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-900'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </motion.button>
            )}
          </AnimatePresence>
          
        </div>

        {/* Título Centralizado Absoluto */}
        {!comandaAtiva && (
          <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full flex justify-center items-center pointer-events-none z-0 w-full px-4">
            <motion.h1 
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className={`font-semibold text-[15px] sm:text-[16px] tracking-[-0.015em] truncate max-w-full ${isDark ? 'text-zinc-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]' : 'text-zinc-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]'}`}
            >
              {mapAbaTitulo[abaAtiva] || 'Visão Geral'}
            </motion.h1>
          </div>
        )}

        {/* Centro: DYNAMIC ISLAND */}
        <LayoutGroup>
          <div className={`flex justify-center items-center flex-1 h-full relative z-30 ${comandaAtiva ? 'px-1 sm:px-2 min-w-0' : 'hidden'}`}>
            <AnimatePresence>
              {comandaAtiva && (
                <motion.div 
                  layoutId="arox-dynamic-island"
                  initial={{ opacity: 0, y: -15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={`flex items-center h-11 sm:h-12 rounded-full px-1.5 sm:px-2 w-auto sm:w-full max-w-[760px] transition-colors duration-300 ${isDark ? 'bg-[#18181b]/80 ring-1 ring-white/10 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-3xl' : 'bg-white/90 ring-1 ring-black/[0.04] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.4)] backdrop-blur-2xl'}`}
                >
                  
                  {/* Editor de Nome */}
                  <motion.div layout="position" className="flex-shrink-0 relative flex items-center min-w-[40px] md:min-w-[140px] max-w-[120px] sm:max-w-[200px] md:max-w-[260px]">
                    {editandoNome ? (
                      <input 
                        autoFocus className={`w-full h-8 sm:h-9 text-[13px] font-medium tracking-tight px-3 md:px-4 rounded-full outline-none transition-all ${isDark ? 'bg-white/10 text-white placeholder-zinc-400 focus:ring-1 focus:ring-white/30' : 'bg-black/5 text-zinc-900 placeholder-zinc-500 focus:ring-1 focus:ring-black/10'}`}
                        placeholder="Nome da comanda..." value={tempNome} onChange={e => setTempNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => e.key === 'Enter' && salvarNome()}
                      />
                    ) : (
                      <button onClick={() => { setTempNome(comandaAtiva?.nome || ''); setEditandoNome(true); }} className={`h-8 sm:h-9 w-8 sm:w-9 md:w-auto px-0 md:px-4 rounded-full cursor-text transition-all duration-200 flex items-center justify-center md:justify-start gap-2.5 overflow-hidden group ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                        <svg className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        <span className={`hidden md:block text-[13px] font-semibold tracking-tight truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {comandaAtiva?.nome || 'Definir nome'}
                        </span>
                      </button>
                    )}
                  </motion.div>

                  <motion.div layout="position" className={`w-[1px] h-4 mx-1.5 md:mx-2 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></motion.div>

                  {/* Busca de Cliente */}
                  <motion.div layout="position" className="relative flex flex-1 items-center" ref={dropdownClienteRef}>
                    <div 
                      className={`flex items-center justify-between sm:justify-start h-8 sm:h-9 px-2 sm:px-3 w-full rounded-full transition-all duration-200 group cursor-text ${isDark ? 'focus-within:bg-white/10 hover:bg-white/5' : 'focus-within:bg-black/5 hover:bg-black/[0.02]'}`}
                      onClick={() => { setMostrarDropdownCliente(true); setTimeout(() => document.querySelector('.input-cliente')?.focus(), 50); }}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <svg className={`w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0 transition-colors ${mostrarDropdownCliente ? (isDark ? 'text-white' : 'text-zinc-900') : (isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <input 
                          className={`input-cliente w-full bg-transparent text-[13px] font-medium outline-none mx-2.5 tracking-tight transition-all truncate ${mostrarDropdownCliente ? 'block' : 'hidden md:block'} ${isDark ? 'placeholder-zinc-500 text-white' : 'placeholder-zinc-400 text-zinc-900'}`} 
                          placeholder="Vincular cliente..." value={buscaCliente} onChange={e => { setBuscaCliente(e.target.value); setMostrarDropdownCliente(true); setIndexSelecionado(0); }}
                          onFocus={() => setMostrarDropdownCliente(true)} onKeyDown={handleKeyDownCliente}
                        />
                      </div>
                      
                      {!mostrarDropdownCliente && !buscaCliente && (
                        <div className="hidden xl:flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <Kbd>F4</Kbd>
                        </div>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {mostrarDropdownCliente && clientesFiltrados.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 2, scale: 0.99 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className={`absolute top-[calc(100%+16px)] left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[300px] sm:w-[140%] sm:min-w-[320px] rounded-2xl ring-1 z-50 overflow-hidden p-1.5 backdrop-blur-3xl ${isDark ? 'bg-[#18181b]/95 ring-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'bg-white/95 ring-black/5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]'}`}
                        >
                          <div className="flex flex-col gap-0.5">
                            {clientesFiltrados.map((c, idx) => (
                              <div 
                                key={c.id} onClick={() => vincularCliente(c)} onMouseEnter={() => setIndexSelecionado(idx)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${indexSelecionado === idx ? (isDark ? 'bg-white/10' : 'bg-black/5') : 'hover:bg-transparent'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-[13px] ${isDark ? 'bg-white/5 text-zinc-300 ring-1 ring-inset ring-white/10' : 'bg-white text-zinc-700 ring-1 ring-inset ring-black/10 shadow-sm'}`}>
                                    {c.nome.charAt(0).toUpperCase()}
                                   </div>
                                  <div className="flex flex-col">
                                    <span className={`text-[13px] font-semibold tracking-tight leading-none ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{c.nome}</span>
                                    <span className={`text-[10px] font-medium mt-1 uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                      {c.pontos} Pts
                                    </span>
                                  </div>
                                </div>
                                <svg className={`w-4 h-4 transition-transform duration-200 ${indexSelecionado === idx ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div layout="position" className={`w-[1px] h-4 mx-1.5 md:mx-2 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></motion.div>
                  
                  {/* ALOCAÇÃO DE MESA */}
                  <motion.div layout="position" className="relative flex items-center" ref={dropdownMesaRef}>
                    <button onClick={() => { setMostrarDropdownMesa(!mostrarDropdownMesa); setTimeout(() => inputMesaRef.current?.focus(), 50); }} className={`flex items-center gap-2 h-8 sm:h-9 w-8 sm:w-9 md:w-auto justify-center px-0 md:px-3 rounded-full transition-all duration-200 group ${mostrarDropdownMesa ? (isDark ? 'bg-white/10' : 'bg-black/5') : (isDark ? 'hover:bg-white/10' : 'hover:bg-black/5')} ${mesaAtivaVisivel && !mostrarDropdownMesa ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}>
                      <svg className={`w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform duration-300 ${mostrarDropdownMesa ? 'rotate-180' : 'rotate-0'} ${mesaAtivaVisivel ? (isDark ? 'text-zinc-200' : 'text-zinc-900') : (isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      
                      <span className={`hidden sm:block text-[13px] font-semibold tracking-tight transition-colors ${mesaAtivaVisivel ? (isDark ? 'text-white' : 'text-zinc-900') : (isDark ? 'text-zinc-400' : 'text-zinc-600')}`}>
                        {mesaAtivaVisivel ? `Mesa ${mesaAtivaVisivel}` : 'Mesa'}
                      </span>
                      
                      <div className="hidden xl:flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Kbd>F7</Kbd>
                      </div>
                    </button>

                    <AnimatePresence>
                      {mostrarDropdownMesa && (
                        <motion.div 
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 2, scale: 0.99 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className={`absolute top-[calc(100%+16px)] right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-[280px] sm:w-[320px] rounded-2xl ring-1 z-50 overflow-hidden p-3 backdrop-blur-3xl ${isDark ? 'bg-[#18181b]/95 ring-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'bg-white/95 ring-black/5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]'}`}
                        >
                          <div className="flex items-center gap-2 mb-3 relative">
                            <div className="relative flex-1">
                              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                              <input 
                                ref={inputMesaRef} className={`input-mesa w-full h-9 pl-9 pr-3 rounded-xl text-[13px] font-medium outline-none transition-all ${isDark ? 'bg-white/5 border border-transparent text-white placeholder-zinc-500 focus:ring-1 focus:ring-white/20' : 'bg-black/5 border border-transparent text-zinc-900 placeholder-zinc-500 focus:ring-1 focus:ring-black/10 focus:bg-white'}`}
                                placeholder="Buscar mesa..." value={buscaMesa} onChange={e => setBuscaMesa(e.target.value)} onKeyDown={handleKeyDownMesa}
                              />
                            </div>
                            <button onClick={() => setEditandoTotalMesas(!editandoTotalMesas)} className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all ${editandoTotalMesas ? (isDark ? 'bg-white/10 text-white ring-1 ring-inset ring-white/20' : 'bg-black/5 text-zinc-900 ring-1 ring-inset ring-black/10') : (isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300' : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-800')}`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                            </button>
                          </div>

                          <AnimatePresence>
                            {editandoTotalMesas && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className={`mb-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                  <label className={`block text-[10px] font-semibold uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Capacidade Operacional</label>
                                  <input type="number" min="1" value={totalMesas} onChange={e => setTotalMesas(Number(e.target.value))} className={`w-full h-8 px-3 rounded-lg text-[13px] font-medium outline-none transition-all ${isDark ? 'bg-black/40 text-white focus:ring-1 focus:ring-white/20' : 'bg-white text-zinc-900 focus:ring-1 focus:ring-black/10 shadow-sm'}`} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="grid grid-cols-5 gap-1.5 max-h-[220px] overflow-y-auto scrollbar-hide p-0.5">
                            {mesasFiltradas.length > 0 ? mesasFiltradas.map((numero) => (
                              <button 
                                key={numero} 
                                onClick={() => vincularMesa(numero)} 
                                className={`relative overflow-hidden h-10 rounded-xl flex items-center justify-center text-[13px] font-semibold tracking-tight transition-colors ${
                                  mesaAtivaVisivel === numero 
                                    ? (isDark 
                                        ? 'bg-white/10 ring-1 ring-inset ring-white/20 text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]' 
                                        : 'bg-black/5 ring-1 ring-inset ring-black/10 text-zinc-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]') 
                                    : (isDark 
                                        ? 'bg-transparent text-zinc-300 hover:bg-white/10 ring-1 ring-inset ring-white/5' 
                                        : 'bg-white text-zinc-700 hover:bg-black/5 ring-1 ring-inset ring-black/5 shadow-sm')
                                }`}
                              >
                                {numero}
                              </button>
                            )) : (
                              <div className={`col-span-5 text-center py-6 text-[12px] font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Nenhuma mesa encontrada.</div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div layout="position" className={`w-[1px] h-4 mx-1.5 md:mx-2 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></motion.div>
                  
                  {/* Tipo de Serviço */}
                  <motion.button layout="position" onClick={alternarTipoComanda} className={`shrink-0 flex items-center justify-center sm:justify-start gap-2 h-8 sm:h-9 w-8 sm:w-9 md:w-auto sm:px-3 rounded-full text-[13px] font-semibold tracking-tight group relative overflow-hidden transition-all duration-300 ${comandaAtiva?.tipo === 'Delivery' ? (isDark ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-zinc-900 text-white shadow-md') : (isDark ? 'bg-transparent text-zinc-400 hover:bg-white/10 hover:text-zinc-200' : 'bg-transparent text-zinc-600 hover:bg-black/5 hover:text-zinc-900')}`}>
                    <div className="relative flex items-center justify-center">
                      {comandaAtiva?.tipo === 'Delivery' ? (
                        <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      )}
                    </div>
                    
                    <span className="hidden md:block relative z-10">{comandaAtiva?.tipo}</span>
                    
                    <div className="hidden xl:flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Kbd>F6</Kbd>
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
        
        {/* Direita: Cápsula de Estado Operacional */}
        <div className="flex justify-end items-center gap-3 shrink-0 relative z-20 w-auto sm:w-[280px]">
          {!comandaAtiva && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <AnimatePresence>
                {statusOperacao === 'ativa' && tensaoEstado !== 'normal' && (
                  <motion.div
                    initial={{ opacity: 0, x: 15, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`hidden xl:flex text-[11px] font-medium tracking-tight whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
                  >
                    {currentStyle.msgText}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={irParaControleOperacional}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-700 ease-out group ring-1 ring-inset ${currentStyle.btnBg}`}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  {(statusOperacao === 'ativa' || statusOperacao === 'pendente') && (
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStyle.ping}`}></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-700 ${currentStyle.dot}`}></span>
                </span>
                
                <span className={`text-[10px] sm:text-[11px] font-semibold tracking-wide ${tensaoEstado !== 'normal' ? 'block' : 'hidden sm:block'}`}>
                  <span className="sm:hidden">{currentStyle.mobileLabel}</span>
                  <span className="hidden sm:inline">{currentStyle.label}</span>
                </span>
              </button>
            </motion.div>
          )}
        </div>

      </header>
    </div>
  );
}