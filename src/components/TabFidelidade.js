'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function TabFidelidade({ temaNoturno, sessao, mostrarAlerta, clientesFidelidade, setClientesFidelidade, comandas }) {
  const [abaInterna, setAbaInterna] = useState('clientes'); 
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('pontos');
  const [meta, setMeta] = useState({ pontos_necessarios: 10, premio: '1 Açaí de 500ml', valor_minimo: 0 });
  const [mostrarModalNovo, setMostrarModalNovo] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null); 
  const [clientePerfil, setClientePerfil] = useState(null); 
  const [clienteResgate, setClienteResgate] = useState(null); 
  const [mostrarModalTexto, setMostrarModalTexto] = useState(false);
  const [textoColado, setTextoColado] = useState('');
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', aniversario: '', pontos: 0 });
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef(null);

  const [diaClienteHover, setDiaClienteHover] = useState(null);
  const [diaGlobalSelect, setDiaGlobalSelect] = useState(new Date().getDay()); 

  useEffect(() => {
    const fetchMeta = async () => {
      const { data } = await supabase.from('config_fidelidade').select('*').eq('empresa_id', sessao.empresa_id).single();
      if (data) setMeta({ pontos_necessarios: data.pontos_necessarios, premio: data.premio, valor_minimo: data.valor_minimo || 0 });
    };
    if (sessao?.empresa_id) fetchMeta();
  }, [sessao]);

  const atualizarMeta = async () => {
    const { error } = await supabase.from('config_fidelidade').upsert({ empresa_id: sessao.empresa_id, pontos_necessarios: meta.pontos_necessarios, premio: meta.premio, valor_minimo: parseFloat(meta.valor_minimo) || 0 }, { onConflict: 'empresa_id' });
    if (!error) mostrarAlerta("Sucesso", "Regras atualizadas e ativas no sistema.");
  };

  const clientesFiltrados = useMemo(() => {
    let filtrados = clientesFidelidade.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone && c.telefone.includes(busca)));
    if (filtroCategoria === 'resgate') filtrados = filtrados.filter(c => c.pontos >= meta.pontos_necessarios);
    else if (filtroCategoria === 'quase') filtrados = filtrados.filter(c => c.pontos >= meta.pontos_necessarios * 0.7 && c.pontos < meta.pontos_necessarios);
    else if (filtroCategoria === 'inativos') filtrados = filtrados.filter(c => c.pontos === 0);
    return filtrados.sort((a, b) => {
      if (ordenacao === 'pontos') return b.pontos - a.pontos;
      if (ordenacao === 'recentes') return new Date(b.created_at || 0) > new Date(a.created_at || 0) ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [clientesFidelidade, busca, filtroCategoria, ordenacao, meta.pontos_necessarios]);

  const ranking = [...clientesFidelidade].sort((a, b) => (b.pontos_totais || b.pontos) - (a.pontos_totais || a.pontos)).slice(0, 10);

  const salvarNovoCliente = async () => {
    if (!novoCliente.nome) return mostrarAlerta("Aviso", "O nome do cliente é obrigatório.");
    if (clienteEditando) {
       const { error } = await supabase.from('clientes_fidelidade').update({nome: novoCliente.nome, telefone: novoCliente.telefone, aniversario: novoCliente.aniversario || null, pontos: novoCliente.pontos}).eq('id', clienteEditando.id);
       if (!error) { setClientesFidelidade(clientesFidelidade.map(c => c.id === clienteEditando.id ? { ...c, ...novoCliente } : c)); mostrarAlerta("Sucesso", "Dados atualizados."); }
    } else {
       const payload = { ...novoCliente, aniversario: novoCliente.aniversario || null, empresa_id: sessao.empresa_id, pontos_totais: novoCliente.pontos };
       const { data, error } = await supabase.from('clientes_fidelidade').insert([payload]).select().single();
       if (data && !error) { setClientesFidelidade([...clientesFidelidade, data]); mostrarAlerta("Sucesso", "Cliente integrado."); }
    }
    setMostrarModalNovo(false); setClienteEditando(null); setNovoCliente({ nome: '', telefone: '', aniversario: '', pontos: 0 });
  };

  const abrirEdicao = (cliente) => {
    setClienteEditando(cliente); setNovoCliente({ nome: cliente.nome, telefone: cliente.telefone || '', aniversario: cliente.aniversario || '', pontos: cliente.pontos }); setMostrarModalNovo(true);
  };

  const confirmarResgatePremio = async () => {
    if (!clienteResgate) return;
    const novosPontos = clienteResgate.pontos - meta.pontos_necessarios;
    const { error } = await supabase.from('clientes_fidelidade').update({ pontos: novosPontos }).eq('id', clienteResgate.id);
    if (!error) {
      setClientesFidelidade(clientesFidelidade.map(c => c.id === clienteResgate.id ? { ...c, pontos: novosPontos } : c));
      setClienteResgate(null); mostrarAlerta("Resgate Aprovado", "Ciclo renovado e prêmio entregue.");
    }
  };

  const acionarImportacao = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evento) => { await processarTextoImportacao(evento.target.result); if (fileInputRef.current) fileInputRef.current.value = ''; };
      reader.readAsText(file);
    }
  };

  const processarTextoImportacao = async (textoImportacao) => {
    if (!textoImportacao.trim()) return;
    try {
      const linhas = textoImportacao.trim().split('\n');
      if (linhas.length === 0) return;
      const primeiraLinha = linhas[0].toLowerCase();
      const separador = primeiraLinha.includes(';') ? ';' : (primeiraLinha.includes('\t') ? '\t' : (primeiraLinha.includes('|') ? '|' : ','));
      const headers = primeiraLinha.split(separador).map(h => h.trim().replace(/["']/g, ''));
      let idxNome = headers.indexOf('nome'); let idxTel = headers.indexOf('telefone'); let idxNasc = headers.findIndex(h => h.includes('aniversario') || h.includes('data')); let idxPontos = headers.indexOf('pontos');
      if (idxNome === -1) { idxNome = 0; idxTel = 1; idxNasc = 2; idxPontos = 3; }
      
      const novos = (idxNome !== -1 ? linhas.slice(1) : linhas).map((l) => {
        let cleanLine = l.replace(/^\|/, '').replace(/\|$/, '').trim(); 
        if (!cleanLine || cleanLine.startsWith('---') || cleanLine.includes('---')) return null;
        const cols = cleanLine.split(separador);
        let nomeStr = (cols[idxNome] || '').trim().replace(/\*\*/g, '').replace(/["']/g, ''); 
        if (!nomeStr || nomeStr.toLowerCase().includes('nome') || nomeStr.toLowerCase().includes('cliente')) return null;
        let dataNasc = (cols[idxNasc] || '').trim().replace(/["']/g, '');
        if (dataNasc && dataNasc.toLowerCase().includes('anivers')) return null; 
        const pt = parseInt((cols[idxPontos] || '').replace(/[^\d]/g, '')) || 0;
        if (dataNasc) {
           if (dataNasc.includes('/')) { const p = dataNasc.split('/'); if (p.length === 3) dataNasc = `${p[2]}-${p[1]}-${p[0]}`; else dataNasc = null; }
           else if (/[a-zA-Z]/.test(dataNasc) || !/^\d{4}-\d{2}-\d{2}$/.test(dataNasc)) dataNasc = null;
        }
        return { nome: nomeStr, telefone: (cols[idxTel] || '').trim().replace(/["']/g, '') || null, aniversario: dataNasc || null, pontos: pt, pontos_totais: pt, empresa_id: sessao.empresa_id };
      }).filter(Boolean);

      if (novos.length > 0) {
        const { data, error } = await supabase.from('clientes_fidelidade').insert(novos).select();
        if (data && !error) { setClientesFidelidade([...clientesFidelidade, ...data]); setMostrarModalTexto(false); setTextoColado(''); mostrarAlerta("Sucesso", `${data.length} clientes importados!`); } 
        else mostrarAlerta("Erro", "Falha de comunicação com o banco.");
      } else mostrarAlerta("Aviso", "Verifique o formato, nenhum cliente válido."); 
    } catch(e) { mostrarAlerta("Erro", "Ocorreu um erro ao decodificar sua tabela."); }
  };

  const copiarRegrasWhatsApp = async () => {
    const texto = `*COMO VAI FUNCIONAR:*\n• A cada compra maior que R$ ${meta.valor_minimo}, você ganha 1 ponto.\n• Quando acumular ${meta.pontos_necessarios} pontos, você estará pronto para o resgate.\n• O sistema indicará que você ganhou: ${meta.premio}.`;
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(texto);
      else {
        const t = document.createElement("textarea"); t.value = texto; t.style.position = "fixed"; t.style.left = "-999999px";
        document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
      }
      setCopiado(true); setTimeout(() => setCopiado(false), 2000);
    } catch (err) { mostrarAlerta("Aviso", "O navegador bloqueou a cópia automática. Selecione o texto manualmente."); }
  };

  const formatarData = (dataStr) => !dataStr ? '—' : new Date(dataStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

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
  
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const maxDias = Math.max(...diasFrequencia.map(d => d.count), 1);

  const analiseGlobal = useMemo(() => {
    let faturamentoTotal = 0; let faturamentoFiel = 0; let cmdsFieis = 0;
    let diasFaturados = [0, 0, 0, 0, 0, 0, 0]; let diasVolume = [0, 0, 0, 0, 0, 0, 0]; let produtosPorDiaGlobal = Array.from({length: 7}, () => ({}));
    (comandas || []).forEach(c => {
      if(c.status === 'aberta') return; 
      const isFiel = c.tags && c.tags.includes('Fidelidade');
      const ticket = (c.produtos || []).reduce((acc, p) => acc + (p.preco || 0), 0);
      const dia = (c.created_at || c.data_hora || c.data) ? new Date(c.created_at || c.data_hora || c.data).getDay() : -1;
      faturamentoTotal += ticket;
      if (isFiel) { faturamentoFiel += ticket; cmdsFieis++; }
      if(dia >= 0 && dia <= 6) {
        diasFaturados[dia] += ticket; diasVolume[dia] += 1;
        (c.produtos || []).forEach(p => { const n = p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim().toUpperCase(); produtosPorDiaGlobal[dia][n] = (produtosPorDiaGlobal[dia][n] || 0) + 1; });
      }
    });
    return { diasFaturados, diasVolume, produtosPorDiaGlobal, taxaFidelidade: faturamentoTotal > 0 ? ((faturamentoFiel / faturamentoTotal) * 100).toFixed(1) : 0, ticketGeral: comandas.length ? (faturamentoTotal / comandas.length) : 0, ticketFiel: cmdsFieis ? (faturamentoFiel / cmdsFieis) : 0 };
  }, [comandas]);

  const maxVolumeGlobal = Math.max(...analiseGlobal.diasVolume, 1);
  const top5DiaSelecionado = useMemo(() => Object.entries(analiseGlobal.produtosPorDiaGlobal[diaGlobalSelect] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5), [analiseGlobal, diaGlobalSelect]);

  const obterDiagnostico = (c) => {
    const percent = (c.pontos / meta.pontos_necessarios) * 100;
    if (c.pontos >= meta.pontos_necessarios) return { label: 'Pronto para Resgate', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (percent >= 75) return { label: 'Muito Ativo', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (c.pontos_totais > meta.pontos_necessarios * 3) return { label: 'Cliente Fiel', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (c.pontos === 0) return { label: 'Inativo', color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
    return { label: 'Acumulando', color: temaNoturno ? 'text-zinc-300' : 'text-zinc-600', bg: temaNoturno ? 'bg-white/5' : 'bg-black/5' };
  };

  const tabs = [{ id: 'clientes', label: 'Clientes' }, { id: 'ranking', label: 'Pódio' }, { id: 'insights', label: 'Inteligência' }, { id: 'config', label: 'Regras da Premiação' }];

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

  return (
    <div className={`w-full h-full flex flex-col font-sans overflow-hidden ${bgPrincipal} ${textPrincipal}`}>
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 shrink-0 border-b mb-6 px-4 md:px-6 transition-colors duration-300 ${bordaDestaque}`}>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onMouseEnter={() => setAbaInterna(tab.id)}
              onClick={() => setAbaInterna(tab.id)}
              className={`relative py-3 text-[11px] font-bold tracking-[0.05em] uppercase transition-colors duration-300 ${abaInterna === tab.id ? (temaNoturno ? 'text-white' : 'text-black') : `${textSecundario} hover:${textPrincipal}`}`}
            >
              {tab.label}
              {abaInterna === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_-1px_8px_rgba(16,185,129,0.4)]" />}
            </button>
          ))}
        </div>

        {abaInterna === 'clientes' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end arox-cinematic" style={{animationDelay: '0ms'}}>
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={acionarImportacao} />
            <div className="hidden sm:flex bg-transparent rounded-xl border border-dashed overflow-hidden shadow-sm" style={{borderColor: temaNoturno ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}}>
               <button onClick={() => fileInputRef.current?.click()} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:bg-zinc-500/10 ${temaNoturno ? 'text-zinc-300 hover:text-white border-r border-white/10' : 'text-zinc-600 hover:text-black border-r border-black/10'}`}>Excel / CSV</button>
               <button onClick={() => setMostrarModalTexto(true)} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:bg-zinc-500/10 ${temaNoturno ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-black'}`}>Colar Lista</button>
            </div>
            <button onClick={() => { setClienteEditando(null); setNovoCliente({nome:'', telefone:'', aniversario:'', pontos:0}); setMostrarModalNovo(true); }} className={`flex-1 sm:flex-none px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 active:scale-95 border border-transparent ${btnArox}`}>+ Integrar Cliente</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-16 scrollbar-hide px-4 md:px-6 relative z-10 w-full">
        {abaInterna === 'clientes' && (
          <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row gap-3 w-full mb-6 arox-cinematic" style={{animationDelay: '0ms'}}>
              <div className={`relative w-full sm:w-80 flex items-center rounded-xl border transition-all duration-300 focus-within:border-emerald-500/40 shadow-sm ${surfaceBase} ${bordaDestaque}`}>
                <div className="pl-3 opacity-40"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
                <input type="text" placeholder="Buscar cliente ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-transparent border-none outline-none py-2.5 px-3 text-[13px] font-bold placeholder:text-zinc-500" />
              </div>
              <div className={`flex items-center p-1 rounded-xl border shadow-sm overflow-x-auto scrollbar-hide w-full sm:w-auto ${surfaceBase} ${bordaDestaque}`}>
                {[{id:'todos', l:'Todos'}, {id:'resgate', l:'Prontos'}, {id:'quase', l:'Aquecidos'}, {id:'inativos', l:'Inativos'}].map(f => (
                  <button key={f.id} onClick={() => setFiltroCategoria(f.id)} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 shrink-0 ${filtroCategoria === f.id ? (temaNoturno ? 'bg-white/10 text-white shadow-sm' : 'bg-black/5 text-black shadow-sm') : `bg-transparent ${textSecundario} hover:${textPrincipal}`}`}>{f.l}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {clientesFiltrados.length === 0 ? (
                <div className={`py-24 text-center rounded-[24px] border border-dashed ${bordaDestaque} arox-cinematic`} style={{animationDelay: '50ms'}}>
                  <p className="text-[15px] font-bold mb-1">Radar Limpo</p>
                  <p className={`text-[13px] ${textSecundario}`}>Nenhum cliente atende aos filtros atuais.</p>
                </div>
              ) : (
                clientesFiltrados.map((c, idx) => {
                  const atingiu = c.pontos >= meta.pontos_necessarios; const percent = Math.min((c.pontos / meta.pontos_necessarios) * 100, 100); const inativo = c.pontos === 0; const quaseLa = percent >= 75 && !atingiu; const superVIP = c.pontos_totais > meta.pontos_necessarios * 3;
                  let cardStyle = `${surfaceBase} ${bordaBase}`;
                  if (atingiu) cardStyle = temaNoturno ? 'bg-[#06120D] border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-500/30';
                  else if (quaseLa) cardStyle = temaNoturno ? 'bg-[#120D06] border-amber-500/20' : 'bg-amber-50/50 border-amber-500/30';
                  else if (inativo) cardStyle = `${surfaceBase} ${bordaBase} opacity-70 hover:opacity-100 transition-all duration-500`;

                  return (
                    <div key={c.id} className={`group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-[20px] border transition-all duration-300 ease-out w-full ${cardStyle} ${!inativo && surfaceHover} hover:shadow-md active:scale-[0.99] arox-cinematic cursor-pointer`} style={{ animationDelay: `${(idx * 20) + 50}ms` }} onClick={() => setClientePerfil(c)}>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black shrink-0 transition-transform duration-500 group-hover:scale-105 ${atingiu ? 'bg-emerald-500 text-white' : quaseLa ? 'bg-amber-500 text-white' : (temaNoturno ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-700')}`}>
                          {c.nome.charAt(0).toUpperCase()}
                          {atingiu && <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-20" />}
                        </div>
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[15px] font-bold truncate group-hover:text-emerald-500 transition-colors duration-300">{c.nome}</p>
                            {superVIP && !atingiu && <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">Fiel</div>}
                            {quaseLa && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Próximo do resgate" />}
                            {atingiu && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Pronto" />}
                          </div>
                          <p className={`text-[12px] font-medium truncate ${textSecundario}`}>{c.telefone || 'Nenhum telefone'}</p>
                        </div>
                      </div>
                      <div className="hidden md:flex flex-col justify-center w-56 lg:w-80 mr-8 mt-4 md:mt-0">
                        <div className="flex justify-between items-end mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${atingiu ? 'text-emerald-500' : textSecundario}`}>Pontos Acumulados</span>
                          <div className="flex items-baseline gap-1"><span className={`text-[14px] font-bold ${atingiu ? 'text-emerald-500' : textPrincipal}`}>{c.pontos}</span><span className={`text-[11px] font-medium ${textSecundario}`}>/ {meta.pontos_necessarios}</span></div>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${temaNoturno ? 'bg-white/5' : 'bg-black/10'}`}><div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${atingiu ? 'bg-emerald-500' : quaseLa ? 'bg-amber-500' : (temaNoturno ? 'bg-zinc-500' : 'bg-zinc-500')}`} style={{ width: `${percent}%` }} /></div>
                      </div>
                      <div className="flex items-center justify-end gap-3 shrink-0 mt-4 md:mt-0" onClick={e => e.stopPropagation()}>
                        {atingiu ? (
                          <button onClick={() => setClienteResgate(c)} className="relative group/btn px-5 py-2.5 rounded-xl overflow-hidden active:scale-95 transition-transform">
                            <div className="absolute inset-0 bg-emerald-500 transition-opacity duration-300 hover:opacity-90" /><span className="relative text-[10px] font-bold uppercase tracking-wider text-white">Resgatar</span>
                          </button>
                        ) : (<div className="w-20" />)}
                        <button onClick={() => abrirEdicao(c)} className={`p-2.5 rounded-xl transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 ${temaNoturno ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-500 hover:text-black'}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {abaInterna === 'ranking' && (
          <div className="animate-in fade-in duration-500 w-full mx-auto pt-4 md:pt-6">
            {ranking.length === 0 ? (
              <div className={`py-16 text-center rounded-[24px] border border-dashed ${bordaDestaque} arox-cinematic`}><p className={`text-[13px] ${textSecundario}`}>Sem histórico de clientes para gerar o ranking.</p></div>
            ) : (
              <div className="flex flex-col gap-6 md:gap-10 w-full">
                <div className="flex flex-col items-center justify-center relative arox-cinematic w-full" style={{animationDelay: '50ms'}}>
                  <div onClick={() => setClientePerfil(ranking[0])} className={`relative z-10 flex flex-col items-center p-6 md:p-8 rounded-[32px] border transition-all duration-500 cursor-pointer hover:scale-[1.02] ${temaNoturno ? 'bg-gradient-to-b from-[#14120C] to-[#0A0A0A] border-amber-500/20 shadow-[0_10px_40px_rgba(245,158,11,0.05)]' : 'bg-gradient-to-b from-amber-50/50 to-white/50 backdrop-blur-xl border-amber-200 shadow-[0_10px_40px_rgba(245,158,11,0.08)]'} w-full max-w-sm text-center`}>
                    <div className="absolute -top-3 px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">Cliente mais Popular</div>
                    <div className="w-14 h-14 mb-4 rounded-full flex items-center justify-center text-2xl font-black bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-sm">{ranking[0].nome.charAt(0).toUpperCase()}</div>
                    <h2 className={`text-2xl md:text-3xl font-bold tracking-tight mb-1 truncate w-full px-4 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>{ranking[0].nome}</h2>
                    <div className="mt-2 flex items-baseline gap-1.5"><span className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-amber-700 dark:from-amber-400 dark:to-amber-600">{ranking[0].pontos_totais || ranking[0].pontos}</span><span className={`text-[11px] font-bold uppercase tracking-widest ${textSecundario}`}>Pontos Totais</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5 w-full">
                  {ranking.slice(1).map((c, idx) => (
                    <div key={c.id} onClick={() => setClientePerfil(c)} className={`group flex flex-col p-5 md:p-6 rounded-[24px] border transition-all duration-300 cursor-pointer ${surfaceBase} ${bordaBase} hover:border-zinc-500/20 hover:-translate-y-1 hover:shadow-lg arox-cinematic w-full`} style={{ animationDelay: `${(idx * 30) + 100}ms` }}>
                      <div className="flex justify-between items-start mb-4 md:mb-5">
                        <div className={`text-xl font-black ${idx === 0 ? 'text-zinc-400' : idx === 1 ? 'text-amber-800/60' : textSecundario}`}>#{idx + 2}</div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black ${temaNoturno ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`}>{c.nome.charAt(0).toUpperCase()}</div>
                      </div>
                      <p className="text-[15px] md:text-[16px] font-bold tracking-tight mb-1 truncate group-hover:text-emerald-500 transition-colors">{c.nome}</p>
                      <div className="mt-auto pt-4 flex items-baseline gap-1 border-t border-dashed border-zinc-500/20">
                        <p className="text-2xl font-black">{c.pontos_totais || c.pontos}</p><p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${textSecundario}`}>LTV Acumulado</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {abaInterna === 'insights' && (
          <div className="animate-in fade-in duration-500 w-full mx-auto pt-4 md:pt-6">
            <div className="mb-8 arox-cinematic" style={{animationDelay: '0ms'}}>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Estratégia de Base</h2>
              <p className={`text-[13px] font-medium ${textSecundario}`}>Transforme dados dos seus clientes em decisões operacionais e de marketing.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 w-full">
              <div className={`p-8 rounded-[32px] border flex flex-col justify-between arox-cinematic w-full ${temaNoturno ? 'bg-gradient-to-br from-[#06120D] to-[#0A0A0A] border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50/50 to-white/50 backdrop-blur-xl border-emerald-200'}`} style={{animationDelay: '100ms'}}>
                <div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 mb-5 border border-emerald-500/20"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg></div>
                  <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${textSecundario}`}>Fatia de Clientes Mapeados</h3>
                  <div className="flex items-baseline gap-1.5 mb-3"><p className="text-4xl font-bold tracking-tighter">{analiseGlobal.taxaFidelidade}</p><span className="text-xl font-bold text-emerald-500">% da Receita</span></div>
                  <p className={`text-[13px] font-medium leading-relaxed ${temaNoturno ? 'text-emerald-100/70' : 'text-emerald-900/70'}`}>
                    O cadastro não é apenas um registro, é um <strong>ativo financeiro</strong>. Uma base estruturada reduz o Custo de Aquisição de Clientes (CAC), permitindo campanhas diretas de WhatsApp, ofertas personalizadas e maior retorno sobre o investimento em marketing.
                  </p>
                </div>
              </div>

              <div className={`p-8 rounded-[32px] border flex flex-col justify-between arox-cinematic w-full ${temaNoturno ? 'bg-gradient-to-br from-[#0A0F1A] to-[#0A0A0A] border-blue-500/20' : 'bg-gradient-to-br from-blue-50/50 to-white/50 backdrop-blur-xl border-blue-200'}`} style={{animationDelay: '200ms'}}>
                <div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 mb-5 border border-blue-500/20"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                  <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-5 ${textSecundario}`}>Comportamento de Gasto</h3>
                  <div className="space-y-5">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-end mb-1.5"><span className={`text-[12px] font-bold ${temaNoturno ? 'text-blue-400' : 'text-blue-700'}`}>Ticket Médio do Cliente Fiel</span><span className="text-xl font-bold tabular-nums">R$ {analiseGlobal.ticketFiel.toFixed(2).replace('.', ',')}</span></div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${temaNoturno ? 'bg-black/40' : 'bg-blue-100'}`}><div className="h-full rounded-full bg-blue-500 transition-all duration-1000 w-[100%]" /></div>
                    </div>
                    <div className="flex flex-col opacity-60">
                      <div className="flex justify-between items-end mb-1.5"><span className={`text-[12px] font-bold ${textPrincipal}`}>Ticket Médio Global (Avulsos)</span><span className="text-lg font-bold tabular-nums">R$ {analiseGlobal.ticketGeral.toFixed(2).replace('.', ',')}</span></div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${temaNoturno ? 'bg-black/40' : 'bg-zinc-200'}`}><div className="h-full rounded-full bg-zinc-500 transition-all duration-1000" style={{ width: `${analiseGlobal.ticketGeral > 0 && analiseGlobal.ticketFiel > 0 ? (analiseGlobal.ticketGeral / analiseGlobal.ticketFiel) * 100 : 0}%`}} /></div>
                    </div>
                  </div>
                  <p className={`text-[12px] mt-5 font-medium leading-relaxed ${textSecundario}`}>
                    Analisar a diferença de consumo permite mensurar o valor da retenção. Clientes engajados fornecem dados cruciais para otimizar campanhas de tráfego pago (públicos Lookalike) e escalar receitas com maior previsibilidade.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 md:p-8 rounded-[32px] border flex flex-col lg:flex-row gap-8 arox-cinematic w-full shadow-sm ${surfaceBase} ${bordaDestaque}`} style={{animationDelay: '300ms'}}>
               <div className="flex-1 w-full">
                 <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${textSecundario}`}>Mapa de Tráfego Diário</h3>
                 <p className={`text-[13px] mb-8 font-medium ${textSecundario}`}>Passe o mouse nos dias para analisar a demanda base e organizar compras/estoque.</p>
                 <div className="flex items-end justify-between h-48 gap-2 md:gap-4 px-2 w-full">
                   {diasSemana.map((d, i) => {
                      const isSelected = diaGlobalSelect === i;
                      return (
                        <div key={d} onMouseEnter={() => setDiaGlobalSelect(i)} className="flex flex-col items-center gap-3 w-full h-full cursor-crosshair group">
                           <div className={`relative w-full h-full flex flex-col justify-end rounded-xl overflow-hidden transition-colors ${isSelected ? (temaNoturno ? 'bg-white/10' : 'bg-black/10') : (temaNoturno ? 'bg-white/5 group-hover:bg-white/10' : 'bg-black/5 group-hover:bg-black/10')}`}>
                              {analiseGlobal.diasVolume[i] > 0 && (
                                 <span className={`absolute -top-1 left-0 right-0 text-center text-[11px] font-bold transition-opacity -translate-y-full pb-1 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                   {analiseGlobal.diasVolume[i]}<span className="text-[9px]"> cmds</span>
                                 </span>
                              )}
                              <div className={`w-full rounded-[4px] transition-all duration-300 ${isSelected ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : (analiseGlobal.diasVolume[i] === maxVolumeGlobal && maxVolumeGlobal > 0 ? (temaNoturno ? 'bg-zinc-400' : 'bg-zinc-600') : (temaNoturno ? 'bg-zinc-700' : 'bg-zinc-300'))}`} style={{ height: `${maxVolumeGlobal === 0 ? 0 : (analiseGlobal.diasVolume[i] / maxVolumeGlobal) * 100}%` }} />
                           </div>
                           <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isSelected ? (temaNoturno ? 'text-amber-400' : 'text-amber-600') : textSecundario}`}>{d}</span>
                        </div>
                      )
                   })}
                 </div>
               </div>

               <div className="lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 border-dashed border-zinc-500/20 flex flex-col">
                 <div className="mb-5">
                   <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${textSecundario}`}>Top 5 - {diasSemana[diaGlobalSelect]}</h3>
                   <p className={`text-[13px] font-bold ${textPrincipal}`}>Produtos mais consumidos neste dia</p>
                 </div>
                 {top5DiaSelecionado.length === 0 ? (
                    <div className={`flex-1 flex items-center justify-center rounded-[20px] border border-dashed text-center p-4 ${bordaDestaque}`}><p className={`text-[11px] uppercase font-bold tracking-widest ${textSecundario}`}>Aguardando Dados</p></div>
                 ) : (
                    <div className="flex flex-col gap-3 flex-1 justify-center w-full">
                       {top5DiaSelecionado.map(([nome, qtd], idx) => (
                         <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors w-full shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
                            <div className={`w-6 h-6 flex items-center justify-center rounded-lg text-[11px] font-black shrink-0 ${idx === 0 ? 'bg-amber-500/10 text-amber-500' : (temaNoturno ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-600')}`}>{idx + 1}</div>
                            <span className="text-[13px] font-bold flex-1 truncate">{nome}</span>
                            <span className={`text-[11px] font-black px-2 py-1 rounded-md ${temaNoturno ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>{qtd}x</span>
                         </div>
                       ))}
                    </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {abaInterna === 'config' && (
          <div className="animate-in fade-in duration-500 w-full mx-auto pt-4 md:pt-6 relative">
            <div className={`relative z-10 p-6 md:p-10 rounded-[32px] border shadow-sm w-full ${surfaceBase} ${bordaDestaque} arox-cinematic`}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Regras de Fidelidade</h2>
                <p className={`text-[13px] font-medium ${textSecundario}`}>Ajuste a mecânica de pontos e veja como a mensagem chega para o cliente.</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full">
                <div className="flex flex-col gap-6 w-full">
                  <div className="grid grid-cols-2 gap-5 w-full">
                    <div className="group relative w-full">
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors ${textSecundario} group-focus-within:text-emerald-500`}>Pontos Necessários</label>
                      <input type="number" value={meta.pontos_necessarios} onChange={e => setMeta({...meta, pontos_necessarios: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-all duration-300 focus:border-emerald-500/50 ${bordaBase}`} />
                    </div>
                    <div className="group relative w-full">
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors ${textSecundario} group-focus-within:text-emerald-500`}>Valor Mínimo (R$)</label>
                      <input type="number" value={meta.valor_minimo} onChange={e => setMeta({...meta, valor_minimo: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-all duration-300 focus:border-emerald-500/50 ${bordaBase}`} />
                    </div>
                  </div>
                  <div className="group relative w-full">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors ${textSecundario} group-focus-within:text-emerald-500`}>Prêmio do Resgate</label>
                    <input type="text" value={meta.premio} onChange={e => setMeta({...meta, premio: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-all duration-300 focus:border-emerald-500/50 ${bordaBase}`} />
                  </div>
                  <div className="pt-4 w-full">
                    <button onClick={atualizarMeta} className={`w-full md:w-auto px-8 py-3.5 text-[12px] font-bold uppercase tracking-widest rounded-xl active:scale-95 transition-transform border border-transparent ${btnArox}`}>Salvar Regras</button>
                  </div>
                </div>

                <div className={`rounded-[32px] border relative flex flex-col justify-center overflow-hidden transition-all duration-500 w-full shadow-inner ${temaNoturno ? 'bg-[#0b141a] border-[#202c33]' : 'bg-[#efeae2] border-[#d1d7db]'}`}>
                  <div className="absolute inset-0 pointer-events-none opacity-[0.20] dark:opacity-[0.10]" style={{ backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundSize: '400px' }} />
                  <div className="relative z-10 px-6 py-10 flex flex-col h-full w-full">
                    <div className="flex justify-between items-start mb-8 z-20 w-full">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${temaNoturno ? 'bg-white/10 text-zinc-300' : 'bg-black/10 text-zinc-800'}`}>Visão do Cliente</div>
                      <button onClick={copiarRegrasWhatsApp} className={`px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-md backdrop-blur-xl flex items-center gap-2 ${copiado ? 'bg-emerald-500 text-white' : (temaNoturno ? 'bg-[#202c33] text-white hover:bg-[#2a3942]' : 'bg-white/90 text-black hover:bg-white')}`}>
                        {copiado ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>}
                        <span className="text-[11px] font-bold uppercase tracking-wider">{copiado ? 'Copiado!' : 'Copiar Texto'}</span>
                      </button>
                    </div>

                    <div className="flex items-start justify-end w-full relative">
                       <div className={`relative max-w-[85%] px-4 py-3 rounded-[16px] rounded-tr-none shadow-[0_2px_4px_rgba(0,0,0,0.1)] ${temaNoturno ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#d9fdd3] text-[#111b21]'}`}>
                          <div className={`absolute top-0 -right-[10px] w-0 h-0 border-t-[0px] border-t-transparent border-l-[12px] ${temaNoturno ? 'border-l-[#005c4b]' : 'border-l-[#d9fdd3]'} border-b-[14px] border-b-transparent`} />
                          <p className="text-[14px] font-bold mb-2">*COMO VAI FUNCIONAR:*</p>
                          <ul className="text-[14px] space-y-1.5 leading-snug mb-2">
                             <li>• A cada compra maior que *R$ {meta.valor_minimo}*, você ganha 1 ponto.</li>
                             <li>• Quando acumular *{meta.pontos_necessarios} pontos*, você estará pronto para o resgate.</li>
                             <li>• O sistema indicará que você ganhou: *{meta.premio}*.</li>
                          </ul>
                          <div className="flex justify-end items-center gap-1.5 opacity-70 mt-1">
                            <span className="text-[11px] font-medium">{new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            <svg viewBox="0 0 16 11" width="18" height="12" className={`${temaNoturno ? 'text-[#53bdeb]' : 'text-[#53bdeb]'}`}><path fill="currentColor" d="M11.8 1.1l-6.8 7.3L1.5 5 0 6.6l5 5.3L13.3 2.7l-1.5-1.6zm3.9-.1L10.5 6.4 9 4.9l5.2-5.5 1.5 1.6z"/></svg>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {mostrarModalTexto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${modalBackdrop}`} onClick={() => setMostrarModalTexto(false)} />
          <div className={`relative w-full max-w-xl p-8 rounded-[32px] flex flex-col gap-5 arox-scale-in border ${surfaceModal}`}>
            <h2 className="text-2xl font-bold tracking-tight">Importação Rápida</h2>
            <p className={`text-[13px] leading-relaxed font-medium ${textSecundario}`}>Cole os dados dos clientes de uma planilha, texto ou IA.<br/>Padrão reconhecido: <strong className={textPrincipal}>NOME | TELEFONE | ANIVERSARIO | PONTOS</strong>.</p>
            <textarea rows="6" placeholder="Ex:\nJoão Silva | 84999999999 | 10/05/1990 | 5\nMaria Souza | 84988888888 | 20/08/1985 | 12" value={textoColado} onChange={e => setTextoColado(e.target.value)} className={`w-full p-5 rounded-[20px] border bg-transparent outline-none text-[14px] font-mono leading-relaxed transition-all focus:border-emerald-500/50 resize-none shadow-inner ${bordaBase}`} />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setMostrarModalTexto(false)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors border border-transparent ${temaNoturno ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-zinc-600'}`}>Cancelar</button>
              <button onClick={() => processarTextoImportacao(textoColado)} className={`px-6 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-transparent active:scale-95 transition-all ${btnArox}`}>Processar Lista</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${modalBackdrop}`} onClick={() => setMostrarModalNovo(false)} />
          <div className={`relative w-full max-w-md p-8 rounded-[32px] flex flex-col gap-6 arox-scale-in border ${surfaceModal}`}>
            <h2 className="text-2xl font-bold tracking-tight">{clienteEditando ? 'Editar Cliente' : 'Integrar Novo Cliente'}</h2>
            <div className="flex flex-col gap-5">
              <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Nome do Cliente *</label><input type="text" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-colors focus:border-emerald-500/50 shadow-inner ${bordaBase}`} placeholder="Ex: João Silva" /></div>
              <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Telefone (Whats)</label><input type="text" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-colors focus:border-emerald-500/50 shadow-inner ${bordaBase}`} placeholder="(00) 00000-0000" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Aniversário</label><input type="date" value={novoCliente.aniversario} onChange={e => setNovoCliente({...novoCliente, aniversario: e.target.value})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-colors focus:border-emerald-500/50 shadow-inner ${bordaBase} ${temaNoturno ? '[color-scheme:dark]' : ''}`} /></div>
                <div><label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Pontos Iniciais</label><input type="number" value={novoCliente.pontos} onChange={e => setNovoCliente({...novoCliente, pontos: parseInt(e.target.value) || 0})} className={`w-full px-4 py-3 text-[15px] font-bold rounded-xl border bg-transparent outline-none transition-colors focus:border-emerald-500/50 shadow-inner ${bordaBase}`} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setMostrarModalNovo(false)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors border border-transparent ${temaNoturno ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-zinc-600'}`}>Cancelar</button>
              <button onClick={salvarNovoCliente} className={`px-6 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-transparent active:scale-95 transition-all ${btnArox}`}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {clientePerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${modalBackdrop}`} onClick={() => setClientePerfil(null)} />
          <div className={`relative w-full max-w-3xl p-8 md:p-10 rounded-[32px] flex flex-col gap-6 md:gap-8 arox-scale-in border max-h-[95vh] overflow-y-auto scrollbar-hide ${surfaceModal}`}>
            <button onClick={() => setClientePerfil(null)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-20 ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mt-4 md:mt-0">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-black shrink-0 shadow-sm ${temaNoturno ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-800'}`}>{clientePerfil.nome.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0 pr-6">
                <div className={`inline-block mb-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${obterDiagnostico(clientePerfil).bg} ${obterDiagnostico(clientePerfil).color} ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>{obterDiagnostico(clientePerfil).label}</div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{clientePerfil.nome}</h2>
                <p className={`text-[13px] font-medium ${textSecundario}`}>{clientePerfil.telefone || 'Sem contato'} • Integrado em {formatarData(clientePerfil.created_at)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-[20px] border relative overflow-hidden shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
                {clientePerfil.pontos >= meta.pontos_necessarios && <div className="absolute inset-0 bg-emerald-500/5" />}
                <p className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Pontos Atuais</p>
                <div className="relative z-10 flex items-baseline gap-1.5"><p className="text-3xl md:text-4xl font-black tracking-tighter">{clientePerfil.pontos}</p><span className={`text-[10px] font-bold uppercase tracking-wider ${textSecundario}`}>/ {meta.pontos_necessarios}</span></div>
              </div>
              <div className={`p-5 rounded-[20px] border relative overflow-hidden shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
                <p className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Histórico (LTV)</p>
                <div className="relative z-10 flex items-baseline gap-1.5"><p className="text-3xl md:text-4xl font-black tracking-tighter">{clientePerfil.pontos_totais || clientePerfil.pontos}</p></div>
              </div>
              <div className={`col-span-2 p-5 rounded-[20px] border relative overflow-hidden flex flex-col justify-center shadow-sm ${temaNoturno ? 'bg-gradient-to-r from-emerald-900/10 to-transparent border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-transparent border-emerald-200'}`}>
                <p className={`relative z-10 text-[10px] font-bold uppercase tracking-widest mb-2 ${textSecundario}`}>Ticket Médio Gasto</p>
                <div className="relative z-10 flex items-baseline gap-1.5"><span className={`text-[15px] font-bold ${textSecundario}`}>R$</span><p className={`text-3xl md:text-4xl font-black tracking-tighter ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>{ticketMedio.toFixed(2).replace('.', ',')}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
               <div className="flex flex-col h-full">
                 <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-5 ${textSecundario}`}>Mapa de Visitas (Dias mais idos)</h3>
                 <div className="flex items-end justify-between h-32 gap-2 md:gap-3 px-2 border-b border-dashed border-zinc-500/20 pb-2">
                   {diasSemana.map((d, i) => (
                      <div key={d} onMouseEnter={() => setDiaClienteHover(i)} onMouseLeave={() => setDiaClienteHover(null)} className="flex flex-col items-center gap-2.5 w-full h-full cursor-crosshair group">
                         <div className={`relative w-full h-full flex flex-col justify-end rounded-lg overflow-hidden transition-colors ${diaClienteHover === i ? (temaNoturno ? 'bg-white/10' : 'bg-black/10') : (temaNoturno ? 'bg-white/5' : 'bg-black/5')}`}>
                            {diasFrequencia[i].count > 0 && <span className={`absolute -top-1 left-0 right-0 text-center text-[10px] font-bold transition-opacity -translate-y-full pb-1.5 z-10 ${diaClienteHover === i ? 'opacity-100' : 'opacity-0'}`}>{diasFrequencia[i].count}</span>}
                            <div className={`w-full rounded-sm transition-all duration-700 ${diasFrequencia[i].count === maxDias && maxDias > 0 ? 'bg-emerald-500' : (temaNoturno ? 'bg-zinc-600' : 'bg-zinc-400')}`} style={{ height: `${maxDias === 0 ? 0 : (diasFrequencia[i].count/maxDias)*100}%` }} />
                         </div>
                         <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${diaClienteHover === i ? (temaNoturno ? 'text-white' : 'text-black') : (diasFrequencia[i].count === maxDias && maxDias > 0 ? (temaNoturno ? 'text-emerald-400' : 'text-emerald-600') : textSecundario)}`}>{d}</span>
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
                    ) : (<p className={`text-[10px] font-bold uppercase tracking-widest text-center opacity-50 ${textSecundario}`}>Passe o mouse nas barras para detalhar</p>)}
                 </div>
               </div>
               <div>
                 <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-5 ${textSecundario}`}>Top Preferências (DNA de Consumo)</h3>
                 {produtosDoCliente.length === 0 ? (
                   <div className={`py-8 px-4 h-36 flex items-center justify-center text-center rounded-[20px] border border-dashed ${bordaDestaque}`}><p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Aguardando compras p/ análise</p></div>
                 ) : (
                   <div className="flex flex-wrap gap-3">
                     {produtosDoCliente.slice(0, 5).map((p, idx) => (
                       <div key={idx} className={`flex items-center gap-2.5 px-3 py-2 rounded-full border transition-colors ${temaNoturno ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-black/5 border-black/10 hover:border-black/20 shadow-sm'}`}>
                         <span className="text-[12px] font-bold tracking-tight max-w-[150px] truncate">{p.nome}</span><div className={`w-1 h-1 rounded-full ${temaNoturno ? 'bg-zinc-600' : 'bg-zinc-300'}`} /><span className={`text-[11px] font-black ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>{p.qtd}x</span>
                       </div>
                     ))}
                     {produtosDoCliente.length > 5 && <div className={`flex items-center justify-center px-4 py-2 rounded-full border border-dashed ${bordaDestaque}`}><span className={`text-[11px] font-bold ${textSecundario}`}>+{produtosDoCliente.length - 5} itens</span></div>}
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {clienteResgate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${modalBackdrop}`} onClick={() => setClienteResgate(null)} />
          <div className={`relative w-full max-w-sm p-8 md:p-10 rounded-[32px] shadow-2xl border arox-scale-in flex flex-col items-center text-center ${surfaceModal} ${temaNoturno ? 'border-emerald-500/20' : 'border-emerald-500/40'}`}>
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg></div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Liberar Prêmio</h2>
            <p className={`text-[13px] mb-8 leading-relaxed font-medium ${textSecundario}`}>Confirmar o resgate de <strong className={textPrincipal}>{meta.premio}</strong> para {clienteResgate.nome}? Os pontos serão deduzidos do saldo atual.</p>
            <div className="flex flex-col gap-3 w-full relative z-10">
              <button onClick={confirmarResgatePremio} className="w-full py-3.5 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.3)] hover:bg-emerald-600 active:scale-95 transition-all">Confirmar e Descontar</button>
              <button onClick={() => setClienteResgate(null)} className={`w-full py-3.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors border border-transparent ${temaNoturno ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-zinc-600'}`}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.arox-cinematic { animation: arox-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); } .arox-scale-in { animation: arox-zoom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; } @keyframes arox-fade-up { 100% { opacity: 1; transform: translateY(0); } } @keyframes arox-zoom { 0% { transform: scale(0.97); opacity: 0; } 100% { transform: scale(1); opacity: 1; } } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}