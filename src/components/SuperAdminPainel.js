'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from './AdminSidebar';
import AdminWorkspaceDrawer from './AdminWorkspaceDrawer';

const CICLOS_PREMIUM = [
  { id: 'mensal', nome: 'Mensal', precoMes: 97 },
  { id: 'bimestral', nome: 'Bimestral', precoMes: 92 },
  { id: 'trimestral', nome: 'Trimestral', precoMes: 87 },
  { id: 'semestral', nome: 'Semestral', precoMes: 77 },
  { id: 'anual', nome: 'Anual', precoMes: 67 },
];

export default function SuperAdminPainel({ fazerLogout, temaNoturno, setTemaNoturno, sessaoAdmin }) {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [empresas, setEmpresas] = useState([]);
  const [logsAuditoria, setLogsAuditoria] = useState([]);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  
  // Auditoria / Whitelist Controls
  const [meuIp, setMeuIp] = useState('');
  const [trustedIps, setTrustedIps] = useState([]);
  const [esconderMeuIp, setEsconderMeuIp] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [novoIpInput, setNovoIpInput] = useState('');
  const [novoIpLabel, setNovoIpLabel] = useState('');

  const [workspaceSelecionado, setWorkspaceSelecionado] = useState(null);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ id: null, status: null, nome: '', acao: 'status' });
  const [toast, setToast] = useState({ visivel: false, texto: '', tipo: 'info' });

  // Wizard e Provisionamento
  const [etapaWizard, setEtapaWizard] = useState(1);
  const [cinematicText, setCinematicText] = useState('');
  const [progressoCinematic, setProgressoCinematic] = useState(0);
  const [dadosEdicao, setDadosEdicao] = useState({ nomeRestaurante: '', nomeDono: '', email: '', novaSenhaTemporaria: '', usuarioId: null, plano: 'free', data_inicio_plano: '', validade_plano: '' });
  const [formData, setFormData] = useState({ 
    nomeRestaurante: '', nomeDono: '', email: '', senha: '', tipoPlano: 'free', ciclo: 'mensal', cidade: '', abertura: '', fechamento: '', tipoOperacao: 'hibrido', codigoIntegracao: ''
  });

  const mostrarNotificacao = (texto, tipo = 'info') => {
    setToast({ visivel: true, texto, tipo });
    setTimeout(() => setToast(prev => ({ ...prev, visivel: false })), 4000);
  };

  const getHoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

  useEffect(() => { 
    carregarEcossistema(); 
    descobrirIpAdmin();
    carregarTrustedIps();
  }, []);

  useEffect(() => {
    if (abaAtiva === 'auditoria') carregarLogsAcessoGlobal();
  }, [abaAtiva, esconderMeuIp, trustedIps]);

  const descobrirIpAdmin = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      if(data?.ip) setMeuIp(data.ip);
    } catch(e) { console.warn("Não foi possível resolver o IP"); }
  };

  const carregarTrustedIps = async () => {
    const { data } = await supabase.from('admin_trusted_ips').select('*');
    if (data) setTrustedIps(data);
  };

  const adicionarTrustedIp = async (e) => {
    e.preventDefault();
    if (!novoIpInput || !novoIpLabel) return mostrarNotificacao("Preencha IP e Label", "erro");
    const { data, error } = await supabase.from('admin_trusted_ips').insert([{ ip_address: novoIpInput, label: novoIpLabel }]).select();
    if (!error && data) {
      setTrustedIps([...trustedIps, ...data]);
      setNovoIpInput('');
      setNovoIpLabel('');
      mostrarNotificacao("IP adicionado à whitelist.", "sucesso");
    } else {
      mostrarNotificacao("Erro ao adicionar IP. Verifique duplicidade.", "erro");
    }
  };

  const removerTrustedIp = async (id) => {
    await supabase.from('admin_trusted_ips').delete().eq('id', id);
    setTrustedIps(trustedIps.filter(ip => ip.id !== id));
  };

  // --- MOTOR DE TELEMETRIA: CLASSIFICAÇÃO DE STATUS ---
  const classificarStatusOperacional = (empresa, dono) => {
    if (!dono || !dono.ultimo_ping_at) return { nivel: 'abandonado', tag: 'Abandonado', corBg: 'bg-zinc-500/10', corTxt: 'text-zinc-500', dot: 'bg-zinc-500 opacity-40' };
    
    const diffMinutos = (Date.now() - new Date(dono.ultimo_ping_at).getTime()) / 60000;
    const temAtividade = empresa.uso_registros > 0;
    
    if (diffMinutos < 5 && dono.status_presenca !== 'offline' && temAtividade) return { nivel: 'operando', tag: 'Operando Agora', corBg: 'bg-emerald-500/10', corTxt: 'text-emerald-500', dot: 'bg-emerald-500 animate-pulse' };
    if (diffMinutos < 30) return { nivel: 'ocioso', tag: 'Online Ocioso', corBg: 'bg-amber-500/10', corTxt: 'text-amber-500', dot: 'bg-amber-500' };
    if (diffMinutos < 60 * 24 * 3) return { nivel: 'parado', tag: 'Parado', corBg: 'bg-rose-500/10', corTxt: 'text-rose-500', dot: 'bg-rose-500' };
    return { nivel: 'abandonado', tag: 'Fantasma', corBg: 'bg-zinc-500/10', corTxt: 'text-zinc-500', dot: 'bg-zinc-600' };
  };

  // --- MOTOR DE TELEMETRIA: HEALTH SCORE ---
  const calcularHealthScore = (empresa, dono) => {
    let score = 30; 
    if (empresa.ativo === false) return { nota: 0, label: 'Bloqueado', cor: 'text-rose-600' };
    
    if (empresa.uso_registros > 500) score += 30;
    else if (empresa.uso_registros > 100) score += 20;
    else if (empresa.uso_registros > 0) score += 10;

    if (dono?.ultimo_ping_at) {
      const diasUltimoAcesso = (Date.now() - new Date(dono.ultimo_ping_at).getTime()) / (1000 * 3600 * 24);
      if (diasUltimoAcesso < 1) score += 20;
      else if (diasUltimoAcesso < 3) score += 10;
      else score -= 15; 
    }

    if (empresa.plano !== 'free' && empresa.plano) score += 20;

    score = Math.min(Math.max(score, 0), 100);

    if (score >= 80) return { nota: score, label: 'Elite', cor: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (score >= 60) return { nota: score, label: 'Saudável', cor: 'text-indigo-500', bg: 'bg-indigo-500/10' };
    if (score >= 40) return { nota: score, label: 'Atenção', cor: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { nota: score, label: 'Risco Crítico', cor: 'text-rose-500', bg: 'bg-rose-500/10' };
  };

  const carregarEcossistema = async () => {
    setLoading(true);
    try {
      const { data: emps, error: errEmp } = await supabase.from('empresas').select('*').order('created_at', { ascending: false });
      if (errEmp) throw errEmp;

      const { data: usrs, error: errUsr } = await supabase.from('usuarios').select('id, empresa_id, nome_usuario, email, role, ultimo_ping_at, status_presenca').eq('role', 'dono');
      if (errUsr) throw errUsr;
      
      const { data: comandasData } = await supabase.from('comandas').select('empresa_id');
      
      if (emps) {
        const empresasMapeadas = emps.map(emp => {
          const uso = comandasData ? comandasData.filter(c => c.empresa_id === emp.id).length : 0;
          const dono = usrs ? usrs.find(u => u.empresa_id === emp.id) : null;
          const statusOp = classificarStatusOperacional(emp, dono);
          const health = calcularHealthScore(emp, dono);
          return { ...emp, uso_registros: uso, usuarios: usrs ? usrs.filter(u => u.empresa_id === emp.id) : [], statusOp, health };
        });
        setEmpresas(empresasMapeadas);
      }
    } catch (err) { mostrarNotificacao(err.message, 'erro'); } 
    finally { setLoading(false); }
  };

  const carregarLogsAcessoGlobal = async () => {
    setLoadingLogs(true);
    try {
      let query = supabase.from('logs_acesso').select('*').order('criado_em', { ascending: false }).limit(200);
      
      if (esconderMeuIp && trustedIps.length > 0) {
         const ipsArray = trustedIps.map(t => t.ip_address);
         if(meuIp && !ipsArray.includes(meuIp)) ipsArray.push(meuIp);
         query = query.not('ip', 'in', `(${ipsArray.map(ip => `"${ip}"`).join(',')})`);
      } else if (esconderMeuIp && meuIp) {
         query = query.neq('ip', meuIp);
      }
      
      const { data: logs, error } = await query;
      if (error) throw error;
      setLogsAuditoria(logs || []);
    } catch (err) {
      mostrarNotificacao("Erro ao buscar log de acessos.", 'erro');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleChangeEdicao = (e) => setDadosEdicao({ ...dadosEdicao, [e.target.name]: e.target.value });

  useEffect(() => {
    if (etapaWizard === 4 && !formData.codigoIntegracao) {
      const prefix = formData.nomeRestaurante ? formData.nomeRestaurante.replace(/\s+/g, '').substring(0, 5).toUpperCase() : 'WKS';
      const code = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, codigoIntegracao: `${prefix}-${code}` }));
    }
  }, [etapaWizard, formData.nomeRestaurante]);

  const avancarWizard = () => {
    if (etapaWizard === 1) { formData.tipoPlano === 'free' ? setEtapaWizard(3) : setEtapaWizard(2); } 
    else if (etapaWizard === 2) { setEtapaWizard(3); } 
    else if (etapaWizard === 3) { setEtapaWizard(4); }
  };

  const voltarWizard = () => {
    if (etapaWizard === 3 && formData.tipoPlano === 'free') setEtapaWizard(1);
    else setEtapaWizard(etapaWizard - 1);
  };

  // Função para calcular Validade Automaticamente
  const calcularValidade = (planoId) => {
    if (planoId === 'free') {
       const d = new Date(); d.setDate(d.getDate() + 7); // 7 dias de trial padrão
       return d.toISOString();
    }
    const ciclo = CICLOS_PREMIUM.find(c => c.id === planoId);
    if (ciclo) {
       const d = new Date(); 
       const meses = ciclo.id === 'mensal' ? 1 : ciclo.id === 'bimestral' ? 2 : ciclo.id === 'trimestral' ? 3 : ciclo.id === 'semestral' ? 6 : ciclo.id === 'anual' ? 12 : 1;
       d.setMonth(d.getMonth() + meses);
       return d.toISOString();
    }
    return null;
  };

  // --- PROVISIONAMENTO CINEMATOGRÁFICO ---
  const iniciarProvisionamento = (e) => {
    e.preventDefault();
    setEtapaWizard(5);
    const stepsText = [
      "Estabelecendo handshake seguro...",
      "Alocando shard de dados isolado no cluster...",
      "Provisionando identidade do workspace...",
      "Sincronizando telemetria operacional...",
      "Ativando módulos de inteligência..."
    ];
    let current = 0;
    setCinematicText(stepsText[0]);
    setProgressoCinematic(10);
    
    const interval = setInterval(() => {
      current++;
      if (current < stepsText.length) { 
        setCinematicText(stepsText[current]); 
        setProgressoCinematic((current / stepsText.length) * 100);
      } else { 
        clearInterval(interval); 
        setProgressoCinematic(100);
        setTimeout(executarCriacaoSupabase, 800); 
      }
    }, 1200); 
  };

  const executarCriacaoSupabase = async () => {
    try {
      const planoFinal = formData.tipoPlano === 'free' ? 'free' : formData.ciclo;
      const dataHoje = new Date().toISOString();
      const validade = calcularValidade(planoFinal);

      const payloadEmpresa = { 
        nome: formData.nomeRestaurante, ativo: true, plano: planoFinal, cidade: formData.cidade,
        horario_abertura: formData.abertura || '08:00:00', horario_fechamento: formData.fechamento || '23:00:00', 
        tipo_operacao: formData.tipoOperacao, codigo_integracao: formData.codigoIntegracao,
        data_inicio_plano: dataHoje, validade_plano: validade
      };

      const { data: novaEmpresa, error: errEmp } = await supabase.from('empresas').insert([payloadEmpresa]).select().single();
      if (errEmp) throw new Error(`Erro ao criar workspace: ${errEmp.message}`);

      const { error: errUsr } = await supabase.from('usuarios').insert([{ empresa_id: novaEmpresa.id, nome_usuario: formData.nomeDono, email: formData.email, senha: formData.senha, role: 'dono', primeiro_login: true }]);
      if (errUsr) throw new Error(`Erro ao criar credencial: ${errUsr.message}`);

      await supabase.from('config_fidelidade').insert([{ empresa_id: novaEmpresa.id }]);

      mostrarNotificacao('Ambiente provisionado com sucesso.', 'sucesso');
      setFormData({ nomeRestaurante: '', nomeDono: '', email: '', senha: '', tipoPlano: 'free', ciclo: 'mensal', cidade: '', abertura: '', fechamento: '', tipoOperacao: 'hibrido', codigoIntegracao: '' });
      setEtapaWizard(1); 
      carregarEcossistema();
      setTimeout(() => setAbaAtiva('clientes'), 1000);
    } catch (error) { 
      mostrarNotificacao(error.message, 'erro'); 
      setEtapaWizard(4); 
    } 
  };

  const formatForInput = (isoString) => isoString ? new Date(isoString).toISOString().split('T')[0] : '';

  const abrirModalEdicao = (empresa, dono) => {
    setEmpresaEditando(empresa.id);
    setDadosEdicao({ 
      nomeRestaurante: empresa.nome, 
      plano: empresa.plano || 'free', 
      nomeDono: dono?.nome_usuario || '', 
      email: dono?.email || '', 
      novaSenhaTemporaria: '', 
      usuarioId: dono?.id || null,
      data_inicio_plano: formatForInput(empresa.data_inicio_plano),
      validade_plano: formatForInput(empresa.validade_plano)
    });
    setModalEdicaoAberto(true);
  };

  const salvarEdicao = async () => {
    setLoading(true);
    try {
      const payloadEmpresa = { 
        nome: dadosEdicao.nomeRestaurante, 
        plano: dadosEdicao.plano,
        data_inicio_plano: dadosEdicao.data_inicio_plano ? new Date(dadosEdicao.data_inicio_plano + 'T12:00:00Z').toISOString() : null,
        validade_plano: dadosEdicao.validade_plano ? new Date(dadosEdicao.validade_plano + 'T12:00:00Z').toISOString() : null
      };

      const { error: errE } = await supabase.from('empresas').update(payloadEmpresa).eq('id', empresaEditando);
      if (errE) throw new Error("Erro ao atualizar workspace.");
      
      if (dadosEdicao.usuarioId) {
        let updatePayload = { nome_usuario: dadosEdicao.nomeDono, email: dadosEdicao.email };
        if (dadosEdicao.novaSenhaTemporaria.trim() !== '') { updatePayload.senha = dadosEdicao.novaSenhaTemporaria; updatePayload.primeiro_login = true; }
        const { error: errU } = await supabase.from('usuarios').update(updatePayload).eq('id', dadosEdicao.usuarioId);
        if (errU) throw new Error(`Erro ao atualizar credenciais: ${errU.message}`);
      }

      setModalEdicaoAberto(false);
      carregarEcossistema();
      mostrarNotificacao('Configurações aplicadas.', 'sucesso');
    } catch (err) { mostrarNotificacao(err.message, 'erro'); } 
    finally { setLoading(false); }
  };

  const alternarStatusEmpresa = async () => {
    setConfirmModalOpen(false);
    try {
      const novoStatus = !confirmConfig.status;
      const { error } = await supabase.from('empresas').update({ ativo: novoStatus }).eq('id', confirmConfig.id);
      if (error) throw new Error("Erro ao atualizar status da conta.");
      carregarEcossistema();
      mostrarNotificacao(`Workspace ${novoStatus ? 'reativado' : 'suspenso'}.`, 'sucesso');
    } catch (err) { mostrarNotificacao(err.message, 'erro'); }
  };

  // --- EXCLUSÃO SEGURA EXTREMA ---
  const confirmarExclusaoExtrema = async () => {
    setConfirmModalOpen(false);
    mostrarNotificacao('Iniciando desintegração do ambiente...', 'info');
    try {
      const { error } = await supabase.rpc('excluir_workspace_seguro', { p_empresa_id: confirmConfig.id });
      if (error) throw error;
      
      carregarEcossistema();
      mostrarNotificacao(`Workspace e todas as dependências vaporizados.`, 'sucesso');
    } catch (err) { mostrarNotificacao(`Falha na exclusão: ${err.message}`, 'erro'); }
  };

  const entrarComoCliente = (dono) => {
    if (!dono || !dono.empresa_id) return mostrarNotificacao("Gestor não localizado para este workspace.", 'erro');
    const sessionObj = { ...dono, data: getHoje() };
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj));
    window.location.href = '/'; 
  };

  const empresasFiltradas = useMemo(() => {
    if (!termoPesquisa) return empresas;
    const termo = termoPesquisa.toLowerCase();
    return empresas.filter(emp => emp.nome.toLowerCase().includes(termo) || (emp.usuarios?.[0]?.nome_usuario || '').toLowerCase().includes(termo));
  }, [empresas, termoPesquisa]);

  const stats = useMemo(() => {
    const ativos = empresas.filter(e => e.ativo !== false);
    const mrr = ativos.filter(e => e.plano !== 'free').reduce((acc, emp) => acc + (CICLOS_PREMIUM.find(c => c.id === emp.plano)?.precoMes || 0), 0);
    const scoreMedio = ativos.reduce((acc, emp) => acc + emp.health.nota, 0) / (ativos.length || 1);
    const emRisco = ativos.filter(e => e.health.nota < 50).length;

    return { total: empresas.length, ativos: ativos.length, receitaEstimada: mrr, scoreMedio: scoreMedio.toFixed(0), emRisco };
  }, [empresas]);

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors ${temaNoturno ? 'bg-[#09090b] text-zinc-100' : 'bg-[#FAFAFA] text-zinc-900'}`}>
      <AdminSidebar menuMobileAberto={menuMobileAberto} setMenuMobileAberto={setMenuMobileAberto} temaNoturno={temaNoturno} setTemaNoturno={setTemaNoturno} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} fazerLogout={fazerLogout} sessaoAdmin={sessaoAdmin} />

      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-transparent">
        <header className={`xl:hidden flex items-center justify-between p-4 border-b z-40 ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/10'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuMobileAberto(true)} className="p-2 -ml-2 rounded-xl text-current opacity-70 hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold tracking-tight">AROX Admin</span>
          </div>
        </header>

        <AdminWorkspaceDrawer workspace={workspaceSelecionado} temaNoturno={temaNoturno} onClose={() => setWorkspaceSelecionado(null)} onRefresh={carregarEcossistema} />

        {toast.visivel && (
          <div className="fixed bottom-6 right-6 z-[300] max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
            <div className={`px-5 py-4 rounded-xl shadow-2xl border font-medium text-[13px] ${toast.tipo === 'erro' ? 'bg-rose-950 text-rose-200 border-rose-900' : 'bg-zinc-900 text-white border-zinc-700'}`}>
              {toast.texto}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 pt-6 z-10 flex flex-col relative">
          <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col space-y-10">
            
            {/* DASHBOARD RESTAURADO COM TELEMETRIA */}
            {abaAtiva === 'dashboard' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8 border-b pb-6 border-black/5 dark:border-white/5">
                  <h2 className="text-[32px] font-bold tracking-tight">Centro de Inteligência</h2>
                  <p className="text-[14px] mt-1 text-zinc-500 font-medium">Telemetria de performance e estado global da operação.</p>
                </header>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
                  <div className={`p-6 rounded-[20px] border shadow-sm ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">MRR Projetado</p>
                    <h3 className="text-[28px] font-black tracking-tighter">R$ {stats.receitaEstimada.toFixed(2)}</h3>
                  </div>
                  <div className={`p-6 rounded-[20px] border shadow-sm ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Health Score Médio</p>
                    <h3 className={`text-[28px] font-black tracking-tighter ${stats.scoreMedio >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{stats.scoreMedio}/100</h3>
                  </div>
                  <div className={`p-6 rounded-[20px] border shadow-sm ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Clientes Operando</p>
                    <h3 className="text-[28px] font-black tracking-tighter text-indigo-500">{stats.ativos}</h3>
                  </div>
                  <div className={`p-6 rounded-[20px] border shadow-sm ${temaNoturno ? 'bg-[#111] border-rose-500/20' : 'bg-rose-50/50 border-rose-200'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mb-2">Risco de Churn</p>
                    <h3 className="text-[28px] font-black tracking-tighter text-rose-500">{stats.emRisco} <span className="text-sm font-medium opacity-70">contas</span></h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
                  {/* Monitor de Banco Mantido */}
                  <div className={`lg:col-span-2 p-6 md:p-8 rounded-[24px] border flex flex-col items-center justify-center text-center ${temaNoturno ? 'bg-[#111111]/80 border-white/[0.04]' : 'bg-white border-black/[0.04]'}`}>
                     <svg className={`w-12 h-12 mb-4 ${temaNoturno ? 'text-zinc-700' : 'text-zinc-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                     <h4 className={`text-[15px] font-bold ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Monitoramento de Banco de Dados</h4>
                     <p className={`text-[12px] font-medium mt-1 max-w-sm ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Aguardando permissão de root role para cálculo real de tamanho em disco.</p>
                  </div>

                  <div className={`p-6 rounded-[24px] border flex flex-col ${temaNoturno ? 'bg-[#111111]/80 border-white/[0.04]' : 'bg-white border-black/[0.04]'}`}>
                    <h4 className={`text-[13px] font-bold uppercase tracking-widest mb-6 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Ranking Operacional</h4>
                    <div className="flex flex-col gap-4 flex-1">
                      {empresas.sort((a,b) => b.uso_registros - a.uso_registros).slice(0,5).map((emp, i) => (
                        emp.uso_registros > 0 && (
                          <div key={emp.id} className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] ${i === 0 ? (temaNoturno ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (temaNoturno ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-600')}`}>#{i+1}</div>
                             <div className="flex-1 min-w-0">
                               <div className={`text-[13px] font-semibold truncate ${temaNoturno ? 'text-zinc-200' : 'text-slate-800'}`}>{emp.nome}</div>
                               <div className={`text-[11px] font-medium mt-0.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{emp.uso_registros} comandas cadastradas</div>
                             </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACES COM SCORE E STATUS LIVE */}
            {abaAtiva === 'clientes' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-black/5 dark:border-white/5">
                  <div>
                    <h2 className="text-[32px] font-bold tracking-tight">Workspaces</h2>
                    <p className="text-[14px] mt-1 text-zinc-500 font-medium">Gestão de acessos, telemetria e controle.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                     <div className={`relative flex-1 flex items-center p-1 rounded-xl border transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 ${temaNoturno ? 'bg-[#111111] border-white/10' : 'bg-white border-black/10'}`}>
                       <svg className={`w-4 h-4 ml-3 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                       <input type="text" value={termoPesquisa} onChange={e => setTermoPesquisa(e.target.value)} placeholder="Pesquisar..." className={`w-full py-2 px-3 bg-transparent outline-none font-medium text-[13px] ${temaNoturno ? 'text-white placeholder-zinc-600' : 'text-slate-900 placeholder-zinc-400'}`} />
                     </div>
                     <button onClick={carregarEcossistema} disabled={loading} className={`px-5 py-2.5 rounded-xl text-[13px] font-bold border transition-colors ${temaNoturno ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-black/5 border-black/10 hover:bg-black/10 text-black'}`}>
                       {loading ? 'Sincronizando...' : 'Forçar Sync'}
                     </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {empresasFiltradas.map(emp => {
                    const dono = emp.usuarios?.find(u => u.role === 'dono');
                    
                    return (
                      <div key={emp.id} onClick={() => setWorkspaceSelecionado(emp)} className={`cursor-pointer group relative p-5 rounded-[20px] border transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col ${temaNoturno ? 'bg-[#111] border-white/5 hover:border-white/20' : 'bg-white border-black/5 hover:border-black/10 shadow-sm'}`}>
                        {/* Cabeçalho do Card */}
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                             <div className="relative w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                                {emp.logo_url && <img src={emp.logo_url} alt="Logo" className="w-full h-full object-cover absolute inset-0 z-10" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.style.display = 'none'} />}
                                <div className={`absolute inset-0 z-0 flex items-center justify-center font-black ${temaNoturno ? 'bg-[#222] text-zinc-400' : 'bg-zinc-200 text-zinc-500'}`}>{emp.nome.charAt(0).toUpperCase()}</div>
                             </div>
                             <div>
                               <h3 className="font-bold text-[16px] truncate tracking-tight">{emp.nome}</h3>
                               <div className="flex items-center gap-1.5 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${emp.statusOp?.dot || 'bg-zinc-500'}`}></div>
                                  <span className={`text-[11px] font-semibold ${emp.statusOp?.corTxt || 'text-zinc-500'}`}>{emp.statusOp?.tag || 'Desconhecido'}</span>
                               </div>
                             </div>
                           </div>
                        </div>

                        {/* Inteligência Derivada */}
                        <div className={`mt-2 p-3 rounded-xl border flex justify-between items-center ${temaNoturno ? 'bg-[#1A1A1A] border-white/5' : 'bg-[#FAFAFA] border-black/5'}`}>
                           <div>
                             <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Health Score</p>
                             <p className={`text-[14px] font-black mt-0.5 ${emp.health?.cor || 'text-zinc-500'}`}>{emp.health?.nota || 0} <span className="text-[10px] font-medium opacity-70">({emp.health?.label || 'N/A'})</span></p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Comandas</p>
                             <p className="text-[14px] font-black mt-0.5 dark:text-white">{emp.uso_registros}</p>
                           </div>
                        </div>

                        {/* Ações Integradas com Delete Seguro */}
                        <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 grid grid-cols-4 gap-2">
                           <button onClick={(e) => { e.stopPropagation(); abrirModalEdicao(emp, dono); }} className={`p-2 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center ${temaNoturno ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`} title="Editar">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); entrarComoCliente(dono); }} className={`p-2 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center ${temaNoturno ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`} title="Acessar Console">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setConfirmConfig({ id: emp.id, acao: 'status', status: emp.ativo, nome: emp.nome }); setConfirmModalOpen(true); }} className={`p-2 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center ${temaNoturno ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`} title={emp.ativo ? 'Suspender' : 'Reativar'}>
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setConfirmConfig({ id: emp.id, acao: 'excluir', nome: emp.nome }); setConfirmModalOpen(true); }} className={`p-2 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center ${temaNoturno ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`} title="Destruir Workspace">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AUDITORIA RESTAURADA INTACTA */}
            {abaAtiva === 'auditoria' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
                <header className="mb-8 border-b pb-6 border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                    <h2 className="text-[32px] font-bold tracking-tight">Logs de Acesso</h2>
                    <p className="text-[14px] mt-1 text-zinc-500 font-medium">Histórico autêntico da tabela <code className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded">logs_acesso</code>.</p>
                  </div>
                  
                  <div className={`p-4 rounded-xl border flex flex-col gap-3 ${temaNoturno ? 'bg-[#111] border-white/10' : 'bg-white border-black/10'}`}>
                    <div className="flex items-center justify-between gap-6 border-b pb-3 border-black/5 dark:border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">IP Atual (Sua Rede)</span>
                        <span className="text-[14px] font-mono font-bold text-indigo-500">{meuIp || 'Analisando...'}</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={esconderMeuIp} onChange={() => setEsconderMeuIp(!esconderMeuIp)} />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${esconderMeuIp ? 'bg-indigo-500' : (temaNoturno ? 'bg-zinc-700' : 'bg-zinc-300')}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${esconderMeuIp ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-[12px] font-semibold">Ocultar IPs Confiáveis</span>
                      </label>
                    </div>

                    <form onSubmit={adicionarTrustedIp} className="flex gap-2">
                       <input type="text" value={novoIpLabel} onChange={e => setNovoIpLabel(e.target.value)} placeholder="Nome (Ex: Casa)" className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg border text-[12px] font-semibold outline-none focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} />
                       <input type="text" value={novoIpInput} onChange={e => setNovoIpInput(e.target.value)} placeholder="0.0.0.0" className={`w-[140px] px-3 py-2 rounded-lg border text-[12px] font-mono font-semibold outline-none focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} />
                       <button type="submit" className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${temaNoturno ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`}>Add IP</button>
                    </form>

                    {trustedIps.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {trustedIps.map(ip => (
                          <div key={ip.id} className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold ${temaNoturno ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/5'}`}>
                             <span className={temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}>{ip.label}</span>
                             <span className="font-mono">{ip.ip_address}</span>
                             <button onClick={() => removerTrustedIp(ip.id)} className="text-rose-500 hover:text-rose-400 ml-1">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </header>
                
                <div className={`rounded-[20px] border overflow-hidden ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                   {loadingLogs ? (
                     <div className="p-10 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>
                   ) : logsAuditoria.length === 0 ? (
                     <div className="p-10 text-center text-zinc-500 text-sm font-medium">Nenhum log encontrado para os critérios atuais.</div>
                   ) : (
                     <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead className={`text-[10px] uppercase font-bold tracking-widest ${temaNoturno ? 'bg-[#1A1A1A] text-zinc-500 border-b border-white/[0.04]' : 'bg-[#FAFAFA] text-zinc-400 border-b border-black/[0.04]'}`}>
                            <tr>
                              <th className="px-6 py-4 font-semibold">Data/Hora</th>
                              <th className="px-6 py-4 font-semibold">E-mail (Credencial)</th>
                              <th className="px-6 py-4 font-semibold">IP Origem</th>
                              <th className="px-6 py-4 font-semibold">Navegador</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y text-[13px] font-medium ${temaNoturno ? 'divide-white/[0.02] text-zinc-300' : 'divide-black/[0.03] text-zinc-700'}`}>
                            {logsAuditoria.map(log => (
                              <tr key={log.id} className={`${temaNoturno ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'} transition-colors`}>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.criado_em).toLocaleString('pt-BR')}</td>
                                <td className="px-6 py-4 truncate max-w-[200px]">{log.email || 'N/A'}</td>
                                <td className="px-6 py-4 font-mono text-[11px]">{log.ip || '---'}</td>
                                <td className="px-6 py-4 truncate max-w-[250px]" title={log.navegador}>{log.navegador || '---'}</td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                     </div>
                   )}
                </div>
              </div>
            )}

            {/* WIZARD NOVO WORKSPACE COM PROVISIONAMENTO CINEMATOGRÁFICO */}
            {abaAtiva === 'novo' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-10">
                {etapaWizard < 5 && (
                  <>
                    <header className="mb-10">
                      <h2 className={`text-[32px] font-bold tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Novo Workspace</h2>
                      <p className={`text-[14px] mt-1 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Configuração de cliente, limites de licença e credenciais.</p>
                    </header>
                    <div className="flex items-center gap-2 mb-10 overflow-hidden">
                      {[1,2,3,4].map(step => (
                        <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${etapaWizard >= step ? (temaNoturno ? 'bg-indigo-500' : 'bg-indigo-600') : (temaNoturno ? 'bg-white/10' : 'bg-black/10')}`}></div>
                      ))}
                    </div>
                  </>
                )}

                <div className={`rounded-[24px] border relative transition-all duration-700 min-h-[500px] flex flex-col overflow-hidden ${etapaWizard === 5 ? (temaNoturno ? 'bg-black border-white/10 shadow-[0_0_50px_rgba(99,102,241,0.1)]' : 'bg-slate-900 border-black shadow-2xl') : (temaNoturno ? 'bg-[#111111] border-white/5' : 'bg-white border-black/5')}`}>
                  {etapaWizard < 5 ? (
                    <form onSubmit={iniciarProvisionamento} className="relative z-10 p-6 md:p-10 flex flex-col flex-1">
                      
                      <div className="flex-1">
                        {etapaWizard === 1 && (
                          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className={`text-xl font-bold mb-6 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Nível do Plano</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <label className={`relative flex flex-col p-6 rounded-[20px] border cursor-pointer transition-all ${formData.tipoPlano === 'free' ? (temaNoturno ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-indigo-500 bg-indigo-50 shadow-md') : (temaNoturno ? 'border-white/5 hover:border-white/10 bg-[#1A1A1A]' : 'border-black/5 hover:border-black/10 bg-[#FAFAFA]')}`}>
                                <input type="radio" name="tipoPlano" value="free" checked={formData.tipoPlano === 'free'} onChange={handleChange} className="sr-only" />
                                <span className={`font-bold text-[18px] mb-1.5 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Trial Degustação</span>
                                <span className={`text-[13px] font-medium leading-relaxed ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Período de avaliação sem cobrança.</span>
                              </label>
                              <label className={`relative flex flex-col p-6 rounded-[20px] border cursor-pointer transition-all ${formData.tipoPlano === 'premium' ? (temaNoturno ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-indigo-500 bg-indigo-50 shadow-md') : (temaNoturno ? 'border-white/5 hover:border-white/10 bg-[#1A1A1A]' : 'border-black/5 hover:border-black/10 bg-[#FAFAFA]')}`}>
                                <input type="radio" name="tipoPlano" value="premium" checked={formData.tipoPlano === 'premium'} onChange={handleChange} className="sr-only" />
                                <span className={`font-bold text-[18px] mb-1.5 tracking-tight ${temaNoturno ? 'text-indigo-400' : 'text-indigo-600'}`}>Plano Pago</span>
                                <span className={`text-[13px] font-medium leading-relaxed ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Cliente com contrato ativo.</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {etapaWizard === 2 && (
                          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className={`text-xl font-bold mb-6 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Recorrência</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {CICLOS_PREMIUM.map(ciclo => {
                                const isSelected = formData.ciclo === ciclo.id;
                                return (
                                  <label key={ciclo.id} className={`relative flex flex-col p-5 rounded-[20px] border cursor-pointer transition-all ${isSelected ? (temaNoturno ? 'border-indigo-500 bg-indigo-500/5 shadow-md' : 'border-indigo-500 bg-indigo-50 shadow-sm') : (temaNoturno ? 'border-white/5 hover:border-white/10 bg-[#1A1A1A]' : 'border-black/5 hover:border-black/10 bg-[#FAFAFA]')}`}>
                                    <input type="radio" name="ciclo" value={ciclo.id} checked={isSelected} onChange={handleChange} className="sr-only" />
                                    <h4 className={`font-bold text-[15px] mb-3 ${isSelected ? (temaNoturno ? 'text-indigo-400' : 'text-indigo-600') : (temaNoturno ? 'text-white' : 'text-slate-900')}`}>{ciclo.nome}</h4>
                                    <div className="flex items-baseline gap-1 mb-2">
                                      <span className={`text-[13px] font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                                      <span className={`text-3xl font-black tabular-nums tracking-tighter ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{ciclo.precoMes}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {etapaWizard === 3 && (
                          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
                            <h3 className={`text-xl font-bold mb-6 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Metadados do Lojista</h3>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                   <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Localização (Cidade/UF)</label>
                                   <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="Ex: Natal, RN" />
                                 </div>
                                 <div>
                                   <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Modalidade Operacional</label>
                                   <select name="tipoOperacao" value={formData.tipoOperacao} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`}>
                                      <option value="hibrido">Híbrido (Salão + Delivery)</option>
                                      <option value="delivery">Apenas Delivery (Dark Kitchen)</option>
                                      <option value="salao">Apenas Salão</option>
                                   </select>
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                   <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Horário Abertura</label>
                                   <input type="time" name="abertura" value={formData.abertura} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} />
                                 </div>
                                 <div>
                                   <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Horário Fechamento</label>
                                   <input type="time" name="fechamento" value={formData.fechamento} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} />
                                 </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {etapaWizard === 4 && (
                          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-4">
                              <h3 className={`text-xl font-bold mb-6 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Acesso Inicial</h3>
                              <input required type="text" name="nomeRestaurante" value={formData.nomeRestaurante} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="Nome do Restaurante / Workspace" />
                              <input required type="text" name="nomeDono" value={formData.nomeDono} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="Nome do Gestor" />
                              <input required type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="E-mail de Login" />
                              <input required type="text" name="senha" value={formData.senha} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="Senha Temporária (1º acesso)" />
                            </div>
                            <div className={`flex-[0.8] p-6 rounded-[24px] border flex flex-col items-center justify-center text-center ${temaNoturno ? 'bg-[#1A1A1A]/80 border-white/5' : 'bg-[#FAFAFA] border-black/5'}`}>
                               <div className={`py-3 px-6 rounded-xl border font-mono text-2xl font-black tracking-widest mb-4 ${temaNoturno ? 'bg-[#0A0A0A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`}>
                                 {formData.codigoIntegracao || '---'}
                               </div>
                               <p className={`text-[12px] font-medium leading-relaxed max-w-[200px] ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>ID único do sistema (Integração POS).</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-3 pt-6 border-t mt-auto ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
                         {etapaWizard > 1 && (
                           <button type="button" onClick={voltarWizard} className={`px-5 py-3 rounded-xl font-semibold text-[13px] transition-colors ${temaNoturno ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-900'}`}>Voltar</button>
                         )}
                         <div className="flex-1"></div>
                         {etapaWizard < 4 ? (
                           <button type="button" onClick={avancarWizard} className={`px-8 py-3 rounded-xl font-semibold text-[13px] transition-colors ${temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'}`}>Próximo</button>
                         ) : (
                           <button type="submit" disabled={loading} className={`px-8 py-3 rounded-xl font-semibold text-[13px] transition-colors shadow-lg ${temaNoturno ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>Compilar e Provisionar</button>
                         )}
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-16 md:p-24 text-center flex-1 relative z-20 animate-in fade-in duration-700">
                       <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                       
                       <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
                         <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
                         <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-indigo-500 animate-[spin_1s_linear_infinite]"></div>
                         <div className="absolute inset-2 rounded-full border-b-2 border-r-2 border-blue-400 animate-[spin_2s_linear_infinite_reverse]"></div>
                         <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
                       </div>

                       <h3 className="text-[24px] font-bold tracking-tight mb-4 text-white">Infraestrutura em Deploy</h3>
                       
                       <div className="w-full max-w-md bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-left mb-8 shadow-inner">
                          <p className="text-[13px] text-emerald-400 mb-2">{'>'} _ {cinematicText}</p>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progressoCinematic}%` }}></div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAIS RESTAURADOS E EXPANDIDOS */}
      {modalEdicaoAberto && (
        <div className="fixed inset-0 z-[400] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setModalEdicaoAberto(false)}></div>
          <div className={`relative w-[90vw] max-w-[400px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${temaNoturno ? 'bg-[#0A0A0A] border-l border-white/10' : 'bg-[#FAFAFA]'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
              <h3 className={`text-[16px] font-bold tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Configurações da Conta</h3>
              <button onClick={() => setModalEdicaoAberto(false)} className={`p-2 rounded-lg transition-colors ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Plano Comercial</label>
                <select name="plano" value={dadosEdicao.plano} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`}>
                  <option value="free">Trial / Degustação</option>
                  {CICLOS_PREMIUM.map(c => <option key={c.id} value={c.id}>Premium - {c.nome}</option>)}
                </select>
              </div>

              {/* CONTROLE DE VALIDADE E PLANO */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Início do Plano</label>
                   <input type="date" name="data_inicio_plano" value={dadosEdicao.data_inicio_plano} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
                 </div>
                 <div>
                   <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Expira em</label>
                   <input type="date" name="validade_plano" value={dadosEdicao.validade_plano} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
                 </div>
              </div>

              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Nome do Restaurante</label>
                <input type="text" name="nomeRestaurante" value={dadosEdicao.nomeRestaurante} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
              </div>
              
              <div className={`mt-6 pt-6 border-t ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
                 <h4 className={`text-[12px] font-bold uppercase tracking-widest mb-4 ${temaNoturno ? 'text-zinc-400' : 'text-slate-600'}`}>Acesso do Lojista</h4>
                 <div className="space-y-4">
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Gestor Master</label>
                      <input type="text" name="nomeDono" value={dadosEdicao.nomeDono} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>E-mail de Login</label>
                      <input type="email" name="email" value={dadosEdicao.email} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-rose-500' : 'text-rose-600'}`}>Forçar Nova Senha</label>
                      <input type="text" name="novaSenhaTemporaria" value={dadosEdicao.novaSenhaTemporaria} onChange={handleChangeEdicao} placeholder="Deixe em branco para manter" className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-rose-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
                    </div>
                 </div>
              </div>
            </div>
            <div className={`p-6 border-t ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
              <button onClick={salvarEdicao} disabled={loading} className={`w-full py-3.5 rounded-xl font-semibold text-[13px] transition-colors shadow-sm flex justify-center items-center ${temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                {loading ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO SEGURO (MÚLTIPLO USO) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[400] animate-in fade-in">
           <div className={`rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col text-center border ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/5'}`}>
             <h2 className={`text-lg font-bold tracking-tight mb-2 ${confirmConfig.acao === 'excluir' ? 'text-red-500' : (temaNoturno ? 'text-white' : 'text-slate-900')}`}>
               {confirmConfig.acao === 'excluir' ? 'Atenção Crítica: Exclusão' : 'Alterar Status'}
             </h2>
             <p className={`text-sm font-medium mb-6 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>
               {confirmConfig.acao === 'excluir' 
                 ? `Você está prestes a DESTRUIR completamente os dados de "${confirmConfig.nome}". Essa ação é irreversível e apagará comandas, usuários e finanças.`
                 : `Deseja ${confirmConfig.status ? 'suspender' : 'restaurar'} o acesso de "${confirmConfig.nome}"?`
               }
             </p>
             <div className="flex gap-3">
               <button onClick={() => setConfirmModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-all">Cancelar</button>
               <button onClick={confirmConfig.acao === 'excluir' ? confirmarExclusaoExtrema : alternarStatusEmpresa} className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md ${confirmConfig.acao === 'excluir' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                 Executar
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}