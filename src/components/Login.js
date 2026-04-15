'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const LoadingDots = ({ isLight }) => (
  <div className="flex items-center gap-2 justify-center">
    <div className={`w-1.5 h-1.5 rounded-sm animate-[pulse_1.5s_ease-in-out_infinite] ${isLight ? 'bg-white' : 'bg-zinc-900'}`}></div>
    <div className={`w-1.5 h-1.5 rounded-sm animate-[pulse_1.5s_ease-in-out_0.2s_infinite] ${isLight ? 'bg-white' : 'bg-zinc-900'}`}></div>
    <div className={`w-1.5 h-1.5 rounded-sm animate-[pulse_1.5s_ease-in-out_0.4s_infinite] ${isLight ? 'bg-white' : 'bg-zinc-900'}`}></div>
  </div>
);

const CheckIcon = ({ active }) => (
  <svg className={`w-3.5 h-3.5 transition-all duration-500 ease-out ${active ? 'text-emerald-500 scale-100 opacity-100' : 'text-zinc-400 scale-75 opacity-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const PolicyModal = ({ isOpen, onClose, title, content, isLight }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
      <div className={`absolute inset-0 backdrop-blur-md ${isLight ? 'bg-black/20' : 'bg-black/80'}`} onClick={onClose} />
      <div className={`relative w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl border ${isLight ? 'bg-white border-black/10' : 'bg-[#0a0a0a] border-white/10'}`}>
        <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-black/5 bg-zinc-50' : 'border-white/5 bg-white/[0.02]'}`}>
          <h3 className={`font-bold tracking-widest uppercase text-[11px] font-mono ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>{title}</h3>
          <button onClick={onClose} className={`text-2xl leading-none transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}>&times;</button>
        </div>
        <div className={`p-8 overflow-y-auto text-[13px] leading-relaxed font-medium custom-scrollbar ${isLight ? 'text-zinc-600' : 'text-zinc-400 font-light'}`}>
          {content}
        </div>
        <div className={`p-4 border-t flex justify-end ${isLight ? 'border-black/5 bg-zinc-50' : 'border-white/5 bg-white/[0.01]'}`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${isLight ? 'bg-black/5 hover:bg-black/10 text-zinc-800' : 'bg-white/5 hover:bg-white/10 text-zinc-300 font-mono'}`}>
            Compreendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Login({ getHoje, setSessao, setScenePhase, temaNoturno }) {
  const isLight = !temaNoturno;
  
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [erro, setErro] = useState('');

  const [lastLogin, setLastLogin] = useState(null);
  const [mostrarFormPadrao, setMostrarFormPadrao] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [stepTrocaSenha, setStepTrocaSenha] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalContent, setModalContent] = useState({ open: false, title: '', text: null });

  const [activeInput, setActiveInput] = useState(null);

  const policies = {
    privacidade: (
      <div className="space-y-5 font-sans">
        <div><h4 className={`font-bold mb-1 ${isLight ? 'text-zinc-900' : 'text-white font-medium'}`}>1. Coleta e Processamento de Dados</h4><p>O AROX Core processa dados operacionais inerentes à gestão do seu negócio, incluindo métricas de faturamento, fluxo de caixa, registros de comandas, fidelidade e logs.</p></div>
        <div><h4 className={`font-bold mb-1 ${isLight ? 'text-zinc-900' : 'text-white font-medium'}`}>2. Armazenamento e Criptografia</h4><p>Todos os dados são criptografados (AES-256) em trânsito e em repouso. A infraestrutura garante redundância e backups visando a disponibilidade contínua.</p></div>
        <div><h4 className={`font-bold mb-1 ${isLight ? 'text-zinc-900' : 'text-white font-medium'}`}>3. Acesso e Compartilhamento</h4><p>Os dados pertencem exclusivamente à organização contratante. A AROX não compartilha ou vende transações. O suporte acessa logs exclusivamente com autorização.</p></div>
      </div>
    ),
    termos: (
      <div className="space-y-5 font-sans">
        <div><h4 className={`font-bold mb-1 ${isLight ? 'text-zinc-900' : 'text-white font-medium'}`}>1. Licenciamento Empresarial</h4><p>Esta instância é licenciada exclusivamente para uso operacional. Engenharia reversa, sublicenciamento ou extração automatizada de dados é proibida.</p></div>
        <div><h4 className={`font-bold mb-1 ${isLight ? 'text-zinc-900' : 'text-white font-medium'}`}>2. Responsabilidade e Auditoria</h4><p>O administrador do workspace deve manter o sigilo de sua credencial. Todas as ações críticas geram logs de auditoria inalteráveis.</p></div>
        <div><h4 className={`font-bold mb-1 ${isLight ? 'text-zinc-900' : 'text-white font-medium'}`}>3. Concordância Legal</h4><p>Ao operar a plataforma, você confirma estar autorizado legalmente a operar os dados fiscais, isentando a AROX Systems de responsabilidades por inserções incorretas ou fraudes internas.</p></div>
      </div>
    )
  };

  const handleTyping = (e, field) => {
    const value = e.target.value;
    if (field === 'email' || field === 'senha') setCredenciais({ ...credenciais, [field]: value });
    else if (field === 'novaSenha') setNovaSenha(value);
    else if (field === 'confirmarNovaSenha') setConfirmarNovaSenha(value);
  };

  const getSaudacao = () => { const h = new Date().getHours(); if (h >= 5 && h < 12) return 'Bom dia'; if (h >= 12 && h < 18) return 'Boa tarde'; return 'Boa noite'; };

  const isNotEmpty = novaSenha.length > 0;
  const hasLength = novaSenha.length >= 8;
  const hasNumber = /\d/.test(novaSenha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha);
  const matchPasswords = isNotEmpty && novaSenha === confirmarNovaSenha;
  const confirmTouched = confirmarNovaSenha.length > 0;
  
  let pwdScore = 0;
  if (hasLength) pwdScore++; if (hasNumber) pwdScore++; if (hasSpecial) pwdScore++; if (pwdScore === 3 && matchPasswords) pwdScore++; 
  const progressColor = pwdScore <= 1 ? 'bg-red-500' : pwdScore === 2 ? 'bg-amber-500' : pwdScore === 3 ? 'bg-blue-400' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('arox_last_login');
      if (saved) { const parsed = JSON.parse(saved); if (parsed && parsed.email) setLastLogin(parsed); else setMostrarFormPadrao(true); } else setMostrarFormPadrao(true);
    } catch (e) { localStorage.removeItem('arox_last_login'); setMostrarFormPadrao(true); }
  }, []);

  const concluirAcesso = (data) => {
    const logoEmpresa = data.empresas?.logo_url || data.empresas?.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const nomeEmpresa = data.empresas?.nome || (data.role === 'super_admin' ? 'Console Admin' : 'AROX');
    localStorage.setItem('arox_last_login', JSON.stringify({ email: data.email, senha: data.senha, nome_usuario: data.nome_usuario, nome_empresa: nomeEmpresa, logo: logoEmpresa }));
    const sessionObj = { ...data, data: getHoje ? getHoje() : new Date().toISOString() };
    delete sessionObj.empresas; 
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj)); 
    if (data.role === 'super_admin') { window.location.href = '/admin'; return; }
    if (setSessao) setSessao(sessionObj);
  };

  const processarAutenticacao = async (emailBusca, senhaBusca) => {
    setLoadingLogin(true); setErro('');
    if(setScenePhase) setScenePhase('sync'); 

    const { data, error } = await supabase.from('usuarios').select('*, empresas ( ativo, nome, logo_url, validade_plano )').eq('email', emailBusca.trim()).eq('senha', senhaBusca).single();

    if (data && !error) { 
      if (data.role !== 'super_admin' && data.empresas) {
         const agora = new Date(); const expirou = data.empresas.validade_plano ? new Date(data.empresas.validade_plano) < agora : false;
         if (data.empresas.ativo === false) { setErro("Conta suspensa pelo administrador."); setLoadingLogin(false); if(setScenePhase) setScenePhase('reveal'); return; } 
         else if (expirou) { setErro("Plano expirado. Regularize sua assinatura."); setLoadingLogin(false); if(setScenePhase) setScenePhase('reveal'); return; }
      }
      if (data.primeiro_login === true) { setTempUser(data); setStepTrocaSenha(true); setLoadingLogin(false); return; }
      concluirAcesso(data);
    } else { setErro("Credenciais inválidas ou não autorizadas."); setLoadingLogin(false); if(setScenePhase) setScenePhase('reveal'); }
  };

  const fazerLogin = (e) => { e.preventDefault(); if (!credenciais.email || !credenciais.senha) return setErro("Forneça suas credenciais completas."); processarAutenticacao(credenciais.email, credenciais.senha); };
  const loginComContaSalva = () => { if (lastLogin && lastLogin.email) processarAutenticacao(lastLogin.email, lastLogin.senha); else setMostrarFormPadrao(true); };

  const salvarNovaSenha = async (e) => {
    e.preventDefault(); setErro('');
    if (pwdScore < 4) return setErro("A senha não atinge os critérios de segurança corporativa.");
    if (!aceitouTermos) return setErro("É necessário aceitar as Políticas Operacionais do AROX.");
    setLoadingLogin(true);
    
    const { error } = await supabase.from('usuarios').update({ senha: novaSenha, primeiro_login: false, aceitou_termos_em: new Date().toISOString() }).eq('id', tempUser.id);
    if (error) { setErro("Falha na comunicação segura. Tente novamente."); setLoadingLogin(false); } 
    else concluirAcesso({ ...tempUser, senha: novaSenha, primeiro_login: false });
  };

  if (!isMounted) return null;

  const cardStyle = isLight ? 'bg-white/95 backdrop-blur-2xl border-black/[0.04] shadow-[0_40px_80px_rgba(0,0,0,0.06)]' : 'bg-white/[0.015] backdrop-blur-md border-white/[0.06] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]';
  const inputStyle = isLight ? 'bg-black/[0.02] text-zinc-950 placeholder:text-zinc-400 focus:bg-white focus:border-black/10 focus:ring-4 ring-black/5 border-transparent' : 'bg-black/30 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-1 focus:ring-white/5 border-white/5';
  const labelStyle = isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500 font-medium';

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row w-full font-sans selection:bg-black/10 selection:text-black relative z-10 bg-transparent">
      
      {/* LADO ESQUERDO: INSTITUCIONAL & COMERCIAL (EDITORIAL HIGH-TICKET) */}
      <div className="w-full lg:w-[55%] flex flex-col justify-end lg:justify-center p-8 lg:p-24 relative z-20 h-[35dvh] lg:h-auto">
        <div className="animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="flex items-center gap-3 mb-6 pointer-events-none">
            <div className={`h-[1px] w-8 ${isLight ? 'bg-zinc-200' : 'bg-white/10'}`}></div>
            <span className={`font-mono tracking-[0.3em] text-[9px] uppercase font-bold ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>AROX Core Protocol v3.0.4</span>
          </div>
          
          <h1 className={`text-[2.2rem] lg:text-[4.8rem] font-bold leading-[1.02] tracking-tight pointer-events-none ${isLight ? 'text-zinc-950' : 'text-white'}`}>
            Domínio <br className="hidden lg:block"/> operacional.
          </h1>
          <p className={`mt-5 lg:mt-8 text-[15px] lg:text-[17px] leading-relaxed max-w-md pointer-events-none ${isLight ? 'text-zinc-600 font-medium' : 'text-zinc-400 font-light'}`}>
            Sincronia absoluta entre fluxo de vendas e inteligência financeira. O núcleo de alta performance que converte sua operação em rentabilidade máxima.</p>

          <div className="mt-10 flex gap-4 pointer-events-auto">
            <button onClick={() => window.open('https://wa.me/5584994229126', '_blank')} className={`px-7 py-3.5 border rounded-full text-[12px] font-black uppercase tracking-wider flex items-center gap-2.5 group backdrop-blur-sm transition-all duration-300 ${isLight ? 'bg-zinc-950 border-zinc-950 text-white hover:bg-black hover:border-black shadow-lg shadow-black/10' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/15 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]'}`}>
              Agendar Demonstração Privada
              <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>

          <div className={`hidden lg:flex gap-12 text-[10px] font-mono pt-10 mt-16 border-t pointer-events-none ${isLight ? 'text-zinc-400 border-black/[0.03]' : 'text-zinc-600 border-white/5'}`}>
            <div>
               <span className={`block font-bold mb-1.5 ${isLight ? 'text-zinc-300' : 'text-white/20'}`}>STATUS DO SISTEMA</span>
               <span className="text-emerald-500 flex items-center gap-2.5 font-bold"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Operacional</span>
            </div>
            <div>
               <span className={`block font-bold mb-1.5 ${isLight ? 'text-zinc-300' : 'text-white/20'}`}>PROTOCOLO DE SEGURANÇA</span>
               <span className={`font-bold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>AES-256 END-TO-END</span>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: CONSOLE DE ACESSO (O PORTAL) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-start lg:justify-center items-center lg:items-start p-6 lg:p-20 relative z-20 h-[65dvh] lg:h-auto">
        
        <div className={`w-full max-w-[420px] border p-9 lg:p-12 rounded-[36px] transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 delay-100 ${cardStyle}`}>
          
          <div className="mb-10">
            <h2 className={`text-[1.35rem] font-bold tracking-tight ${isLight ? 'text-zinc-950' : 'text-zinc-100 font-medium'}`}>
              {stepTrocaSenha ? 'Redefina sua senha Master' : (!mostrarFormPadrao && lastLogin) ? `${getSaudacao()}, ${(lastLogin.nome_usuario || 'Operador').split(' ')[0]}` : 'Acesso ao Núcleo Operacional'}
            </h2>
            <p className={`mt-2 text-[13.5px] leading-relaxed ${isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500 font-light'}`}>
               {stepTrocaSenha ? 'Crie uma nova chave de segurança para validar seu acesso.' : (!mostrarFormPadrao && lastLogin) ? 'Autenticar sessão protegida para sua instância.' : 'Autenticação de Ambiente Financeiro Protegido.'}
            </p>
          </div>

          {stepTrocaSenha ? (
            <form onSubmit={salvarNovaSenha} className="space-y-6">
              <div className="space-y-3.5">
                <input type="password" placeholder="Nova Chave de Segurança" className={`w-full px-5 py-4 outline-none text-[14px] font-bold rounded-xl transition-all duration-300 border ${inputStyle}`} value={novaSenha} onChange={e => handleTyping(e, 'novaSenha')} onFocus={() => { if(setScenePhase) setScenePhase('sync'); }} onBlur={() => { if(setScenePhase) setScenePhase('reveal'); }} autoFocus />
                <input type="password" placeholder="Confirmar Nova Chave" className={`w-full px-5 py-4 outline-none text-[14px] font-bold rounded-xl transition-all duration-300 border ${inputStyle} ${confirmTouched && !matchPasswords && !isLight ? '!border-red-500/50' : ''} ${confirmTouched && !matchPasswords && isLight ? '!border-red-500 !ring-red-100' : ''}`} value={confirmarNovaSenha} onChange={e => handleTyping(e, 'confirmarNovaSenha')} />
              </div>

              <div className={`pt-4 rounded-2xl p-5 border ${isLight ? 'bg-zinc-50 border-black/5' : 'bg-black/40 border-white/5'}`}>
                <div className="flex gap-1.5 mb-4.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`h-[4px] w-full rounded-full overflow-hidden ${isLight ? 'bg-black/10' : 'bg-black/60'}`}>
                      <div className={`h-full transition-all duration-500 ease-out rounded-full ${pwdScore >= step ? progressColor : 'w-0'}`} style={{ width: pwdScore >= step ? '100%' : '0%' }}></div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                  <div className={`flex items-center gap-2.5 text-[11px] font-bold ${isLight ? 'text-zinc-600' : 'font-mono text-zinc-400'}`}><CheckIcon active={hasLength} /> Mínimo 8 Carac.</div>
                  <div className={`flex items-center gap-2.5 text-[11px] font-bold ${isLight ? 'text-zinc-600' : 'font-mono text-zinc-400'}`}><CheckIcon active={hasNumber} /> Número(s)</div>
                  <div className={`flex items-center gap-2.5 text-[11px] font-bold ${isLight ? 'text-zinc-600' : 'font-mono text-zinc-400'}`}><CheckIcon active={hasSpecial} /> Símbolo(s)</div>
                  <div className={`flex items-center gap-2.5 text-[11px] font-bold ${isLight ? 'text-zinc-600' : 'font-mono text-zinc-400'}`}><CheckIcon active={matchPasswords} /> Chaves Iguais</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 px-1 py-1 mt-2">
                <div className="relative flex items-center mt-1">
                  <input type="checkbox" id="termos" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)} className={`peer appearance-none w-4.5 h-4.5 border rounded-md transition-all cursor-pointer ${isLight ? 'border-black/20 bg-black/5 checked:bg-zinc-950 checked:border-zinc-950' : 'border-white/15 bg-black/40 checked:bg-white checked:border-white'}`} />
                  <svg className={`absolute w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 top-1 left-1 transition-opacity ${isLight ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                </div>
                <label htmlFor="termos" className={`text-[12px] font-medium leading-[1.45] select-none cursor-pointer ${isLight ? 'text-zinc-700' : 'text-zinc-400 font-light'}`}>
                  Confirmo que li e aceito as <button type="button" onClick={() => setModalContent({ open: true, title: 'Termos de Operação', text: policies.termos })} className={`transition-colors underline underline-offset-2 font-bold ${isLight ? 'text-zinc-950' : 'text-zinc-200 hover:text-white'}`}>Políticas Operacionais</button> e a <button type="button" onClick={() => setModalContent({ open: true, title: 'Privacidade de Dados', text: policies.privacidade })} className={`transition-colors underline underline-offset-2 font-bold ${isLight ? 'text-zinc-950' : 'text-zinc-200 hover:text-white'}`}>Privacidade de Dados</button>.
                </label>
              </div>

              {erro && <p className="text-[12px] text-red-500 font-bold animate-in fade-in pt-1">{erro}</p>}
              
              <button type="submit" disabled={loadingLogin || pwdScore < 4 || !aceitouTermos} className={`w-full py-4.5 text-[12px] font-black uppercase tracking-widest transition-all duration-300 mt-5 rounded-xl active:scale-[0.985] ${pwdScore === 4 && aceitouTermos ? (isLight ? 'bg-zinc-950 text-white hover:bg-black shadow-lg shadow-black/15' : 'bg-zinc-100 text-black hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]') : (isLight ? 'bg-black/5 text-zinc-400 cursor-not-allowed' : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5')}`}>
                {loadingLogin ? <LoadingDots isLight={!isLight} /> : 'Ativar Credencial e Acessar'}
              </button>
            </form>

          ) : (!mostrarFormPadrao && lastLogin) ? (
            <div className="w-full flex flex-col">
              <div className={`flex items-center gap-5 mb-10 p-5 rounded-2xl border ${isLight ? 'bg-white shadow-sm border-black/[0.03]' : 'bg-black/30 border-white/5'}`}>
                <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border ${isLight ? 'bg-zinc-50 border-black/[0.04]' : 'bg-zinc-900 border-white/5'}`}>
                  <img src={lastLogin.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div className="overflow-hidden">
                  <p className={`text-[15px] font-bold truncate ${isLight ? 'text-zinc-950' : 'text-zinc-100 font-medium'}`}>{lastLogin.nome_usuario || 'Administrador'}</p>
                  <p className={`text-[12.5px] truncate mt-0.5 ${isLight ? 'text-zinc-600 font-bold' : 'text-zinc-500 font-mono'}`}>{lastLogin.nome_empresa}</p>
                </div>
              </div>
              {erro && <p className="text-[12px] text-red-500 font-bold animate-in fade-in pb-5">{erro}</p>}
              <div className="space-y-3.5">
                <button onClick={loginComContaSalva} disabled={loadingLogin} className={`w-full py-4.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.985] disabled:opacity-50 ${isLight ? 'bg-zinc-950 text-white shadow-lg shadow-black/15' : 'bg-zinc-100 text-black hover:bg-white'}`}>
                  {loadingLogin ? <LoadingDots isLight={!isLight} /> : 'Autorizar Acesso'}
                </button>
                <button onClick={() => setMostrarFormPadrao(true)} className={`w-full py-4 rounded-xl text-[12px] font-bold transition-all duration-300 ${isLight ? 'text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent hover:border-white/10'}`}>
                  Utilizar outra identidade corporativa
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={fazerLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className={`block text-[10px] uppercase tracking-widest mb-2.5 ml-1 ${labelStyle}`}>Chave de Identificação Corporativa</label>
                  <input id="email" type="email" placeholder="identidade@empresa.com" className={`w-full px-5 py-4 rounded-2xl outline-none border transition-all duration-300 font-bold text-[14px] ${inputStyle}`} value={credenciais.email} onChange={e => handleTyping(e, 'email')} onFocus={() => { if(setScenePhase) setScenePhase('sync'); }} onBlur={() => { if(setScenePhase) setScenePhase('reveal'); }} autoFocus={!lastLogin} />
                </div>
                <div>
                  <label htmlFor="senha" className={`block text-[10px] uppercase tracking-widest mb-2.5 ml-1 mt-5 ${labelStyle}`}>Chave de Segurança</label>
                  <input id="senha" type="password" placeholder="••••••••" className={`w-full px-5 py-4 rounded-2xl outline-none border transition-all duration-300 font-bold text-[14px] ${inputStyle}`} value={credenciais.senha} onChange={e => handleTyping(e, 'senha')} />
                </div>
              </div>
              {erro && <p className="text-[12px] text-red-500 font-bold animate-in fade-in pt-1">{erro}</p>}
              <button type="submit" disabled={loadingLogin} className={`w-full py-4.5 mt-5 rounded-xl text-[12px] font-black uppercase tracking-[0.25em] transition-all duration-500 active:scale-[0.985] disabled:opacity-50 ${isLight ? 'bg-zinc-950 text-white hover:bg-black shadow-[0_15px_35px_rgba(0,0,0,0.18)]' : 'bg-zinc-100 text-black hover:bg-white shadow-[0_4px_20px_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.2)]'}`}>
                {loadingLogin ? <LoadingDots isLight={!isLight} /> : 'Validar e Sincronizar'}
              </button>
              {lastLogin && (
                 <div className="pt-5 text-center">
                   <button type="button" onClick={() => setMostrarFormPadrao(false)} className={`text-[12px] font-bold transition-colors duration-300 ${isLight ? 'text-zinc-400 hover:text-zinc-800' : 'text-zinc-600 hover:text-zinc-300 font-medium'}`}>
                     &larr; Voltar para conta identificada
                   </button>
                 </div>
              )}
            </form>
          )}
        </div>
        
        {/* Rodapé Corporativo (Editorial) */}
        <div className="w-full max-w-[420px] mt-10 text-center lg:text-left flex justify-between items-center px-3">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-zinc-400' : 'font-mono text-zinc-700'}`}>Arox Systems © {new Date().getFullYear()}</p>
          <div className={`flex gap-5 text-[10px] font-bold uppercase ${isLight ? 'text-zinc-400' : 'font-mono text-zinc-600'}`}>
             <button onClick={() => setModalContent({ open: true, title: 'Privacidade de Dados', text: policies.privacidade })} className={`transition-colors ${isLight ? 'hover:text-zinc-900' : 'hover:text-zinc-300'}`}>Privacidade</button>
             <button onClick={() => setModalContent({ open: true, title: 'Termos de Operação', text: policies.termos })} className={`transition-colors ${isLight ? 'hover:text-zinc-900' : 'hover:text-zinc-300'}`}>Termos</button>
          </div>
        </div>

      </div>

      <PolicyModal isOpen={modalContent.open} title={modalContent.title} content={modalContent.text} onClose={() => setModalContent({ ...modalContent, open: false })} isLight={isLight} />
    </div>
  );
}