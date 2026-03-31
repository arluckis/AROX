'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// --- COMPONENTES AUXILIARES ---

const LoadingDots = () => (
  <div className="flex items-center gap-2 justify-center">
    <div className="w-1.5 h-1.5 bg-white rounded-sm animate-[pulse_1.5s_ease-in-out_infinite]"></div>
    <div className="w-1.5 h-1.5 bg-white rounded-sm animate-[pulse_1.5s_ease-in-out_0.2s_infinite]"></div>
    <div className="w-1.5 h-1.5 bg-white rounded-sm animate-[pulse_1.5s_ease-in-out_0.4s_infinite]"></div>
  </div>
);

const CheckIcon = ({ active }) => (
  <svg className={`w-3.5 h-3.5 transition-all duration-500 ease-out ${active ? 'text-emerald-400 scale-100 opacity-100' : 'text-zinc-700 scale-75 opacity-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const PolicyModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-zinc-100 font-medium tracking-widest uppercase text-[11px] font-mono">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>
        <div className="p-8 overflow-y-auto text-zinc-400 text-[13px] leading-relaxed font-light custom-scrollbar">
          {content}
        </div>
        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-[11px] font-mono uppercase tracking-widest transition-all">
            Compreendido
          </button>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---

export default function Login({ getHoje, setSessao, setScenePhase }) {
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
  
  // Estados para Termos e Privacidade
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalContent, setModalContent] = useState({ open: false, title: '', text: null });

  const [activeInput, setActiveInput] = useState(null);
  const [typingParticles, setTypingParticles] = useState([]);

  // Textos Jurídicos Adaptados para o Domínio do AROX (PDV/ERP)
  const policies = {
    privacidade: (
      <div className="space-y-5 font-sans">
        <div>
          <h4 className="text-white font-medium mb-1">1. Coleta e Processamento de Dados</h4>
          <p>O AROX Core processa dados operacionais inerentes à gestão do seu negócio, incluindo, mas não se limitando a: métricas de faturamento, fluxo de caixa, registros de comandas, dados de fidelidade e logs de acesso de operadores.</p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-1">2. Armazenamento e Criptografia</h4>
          <p>Todos os dados financeiros e credenciais de acesso são criptografados (AES-256) em trânsito e em repouso. A infraestrutura em nuvem garante redundância e backups automatizados diários, visando a disponibilidade contínua da operação de PDV.</p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-1">3. Acesso e Compartilhamento</h4>
          <p>Os dados pertencem exclusivamente à organização contratante. A equipe técnica da AROX não compartilha, vende ou analisa transações individuais para fins de terceiros. O suporte técnico acessa logs exclusivamente mediante autorização do administrador da instância.</p>
        </div>
      </div>
    ),
    termos: (
      <div className="space-y-5 font-sans">
        <div>
          <h4 className="text-white font-medium mb-1">1. Licenciamento Empresarial</h4>
          <p>Esta instância do AROX é licenciada exclusivamente para uso operacional da empresa contratante. A engenharia reversa, sublicenciamento ou extração automatizada de dados da plataforma é rigorosamente proibida.</p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-1">2. Responsabilidade do Operador e Auditoria</h4>
          <p>O administrador do workspace é responsável por manter o sigilo de sua credencial e gerenciar as permissões dos operadores de caixa. Recomendamos que o fechamento de caixa e alterações de produtos sejam sempre acompanhados por um gestor. Todas as ações críticas geram logs de auditoria inalteráveis.</p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-1">3. Concordância Legal</h4>
          <p>Ao estabelecer a sua "Chave Master" e acessar a plataforma, você confirma estar autorizado legalmente a operar os dados fiscais e gerenciais inseridos, isentando a AROX Systems de responsabilidades sobre a inserção incorreta de valores, impostos ou fraudes internas executadas por funcionários cadastrados.</p>
        </div>
      </div>
    )
  };

  const handleTyping = (e, field) => {
    const value = e.target.value;
    if (field === 'email' || field === 'senha') setCredenciais({ ...credenciais, [field]: value });
    else if (field === 'novaSenha') setNovaSenha(value);
    else if (field === 'confirmarNovaSenha') setConfirmarNovaSenha(value);
    
    const newParticle = {
      id: Date.now() + Math.random(),
      x: Math.random() * 100, 
      y: Math.random() * 100, 
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.2
    };
    setTypingParticles(prev => [...prev.slice(-10), newParticle]);
  };

  useEffect(() => {
    if (typingParticles.length > 0) {
      const timer = setTimeout(() => setTypingParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [typingParticles]);

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const isNotEmpty = novaSenha.length > 0;
  const hasLength = novaSenha.length >= 8;
  const hasNumber = /\d/.test(novaSenha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha);
  const matchPasswords = isNotEmpty && novaSenha === confirmarNovaSenha;
  const confirmTouched = confirmarNovaSenha.length > 0;
  
  let pwdScore = 0;
  if (hasLength) pwdScore++;
  if (hasNumber) pwdScore++;
  if (hasSpecial) pwdScore++;
  if (pwdScore === 3 && matchPasswords) pwdScore++; 

  const progressColor = pwdScore <= 1 ? 'bg-red-500' : pwdScore === 2 ? 'bg-amber-500' : pwdScore === 3 ? 'bg-blue-400' : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]';

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('arox_last_login');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) setLastLogin(parsed);
        else setMostrarFormPadrao(true);
      } else setMostrarFormPadrao(true);
    } catch (e) {
      localStorage.removeItem('arox_last_login');
      setMostrarFormPadrao(true);
    }
  }, []);

  const concluirAcesso = (data) => {
    const logoEmpresa = data.empresas?.logo_url || data.empresas?.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const nomeEmpresa = data.empresas?.nome || (data.role === 'super_admin' ? 'Console Admin' : 'AROX');

    localStorage.setItem('arox_last_login', JSON.stringify({
      email: data.email, senha: data.senha, nome_usuario: data.nome_usuario, nome_empresa: nomeEmpresa, logo: logoEmpresa
    }));

    const sessionObj = { ...data, data: getHoje ? getHoje() : new Date().toISOString() };
    delete sessionObj.empresas; 
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj)); 
    
    if (data.role === 'super_admin') { window.location.href = '/admin'; return; }
    if (setSessao) setSessao(sessionObj);
  };

  const processarAutenticacao = async (emailBusca, senhaBusca) => {
    setLoadingLogin(true); setErro('');
    if(setScenePhase) setScenePhase('sync'); 

    // ATUALIZAÇÃO: Inclusão do validade_plano na query para garantir a segurança em tempo de login
    const { data, error } = await supabase.from('usuarios').select('*, empresas ( ativo, nome, logo_url, validade_plano )').eq('email', emailBusca.trim()).eq('senha', senhaBusca).single();

    if (data && !error) { 
      if (data.role !== 'super_admin' && data.empresas) {
         const agora = new Date();
         const expirou = data.empresas.validade_plano ? new Date(data.empresas.validade_plano) < agora : false;

         if (data.empresas.ativo === false) {
            setErro("Conta temporariamente bloqueada. Consulte o suporte do sistema para mais informações.");
            setLoadingLogin(false);
            if(setScenePhase) setScenePhase('reveal');
            return;
         } else if (expirou) {
            setErro("Seu plano expirou. Regularize sua assinatura para acessar.");
            setLoadingLogin(false);
            if(setScenePhase) setScenePhase('reveal');
            return;
         }
      }

      if (data.primeiro_login === true) {
        setTempUser(data);
        setStepTrocaSenha(true);
        setLoadingLogin(false);
        return;
      }
      concluirAcesso(data);
    } else { 
      setErro("Credenciais inválidas ou não autorizadas."); 
      setLoadingLogin(false);
      if(setScenePhase) setScenePhase('reveal'); 
    }
  };

  const fazerLogin = (e) => { e.preventDefault(); if (!credenciais.email || !credenciais.senha) return setErro("Forneça suas credenciais completas."); processarAutenticacao(credenciais.email, credenciais.senha); };
  const loginComContaSalva = () => { if (lastLogin && lastLogin.email) processarAutenticacao(lastLogin.email, lastLogin.senha); else setMostrarFormPadrao(true); };

  const salvarNovaSenha = async (e) => {
    e.preventDefault(); setErro('');
    if (pwdScore < 4) return setErro("A senha não atinge os critérios de segurança corporativa.");
    if (!aceitouTermos) return setErro("É necessário aceitar as Políticas Operacionais do AROX.");
    
    setLoadingLogin(true);
    
    const { error } = await supabase.from('usuarios').update({ 
        senha: novaSenha, 
        primeiro_login: false,
        aceitou_termos_em: new Date().toISOString() 
    }).eq('id', tempUser.id);

    if (error) {
      setErro("Falha na comunicação segura. Tente novamente.");
      setLoadingLogin(false);
    } else {
      concluirAcesso({ ...tempUser, senha: novaSenha, primeiro_login: false });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row w-full font-sans selection:bg-white/20 selection:text-white relative z-10 text-white bg-transparent">
      
      {/* PARTICULAS - Feedback Visual */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen">
        {typingParticles.map(particle => (
          <div 
            key={particle.id}
            className="absolute rounded-full bg-blue-200/50 animate-in fade-in zoom-in duration-700 ease-out"
            style={{
              left: `${particle.x}%`, top: `${particle.y}%`,
              width: `${particle.size}px`, height: `${particle.size}px`,
              opacity: particle.opacity,
              animation: 'fadeOutParticle 1s forwards'
            }}
          />
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeOutParticle { 0% { transform: scale(0.5); } 100% { opacity: 0; transform: scale(1.5) translateY(-10px); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
      `}} />

      {/* LADO ESQUERDO: INSTITUCIONAL & COMERCIAL */}
      <div className="w-full lg:w-[55%] flex flex-col justify-end lg:justify-center p-8 lg:p-24 relative z-20 h-[35dvh] lg:h-auto">
        <div className="animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="flex items-center gap-3 mb-6 pointer-events-none">
            <div className="h-[1px] w-8 bg-white/20"></div>
            <span className="font-mono tracking-[0.2em] text-[10px] uppercase text-zinc-400">AROX Core v3.0.4</span>
          </div>
          
          <h1 className="text-[2rem] lg:text-[4.5rem] font-medium leading-[1.05] tracking-tight text-white drop-shadow-lg pointer-events-none">
            Domínio <br className="hidden lg:block"/> em tempo real.
          </h1>
          <p className="mt-4 lg:mt-6 text-zinc-400 text-[14px] lg:text-[16px] leading-relaxed max-w-md font-light pointer-events-none">
            Sincronia absoluta entre fluxo de vendas e inteligência financeira. O núcleo de alta performance que converte sua operação em rentabilidade máxima.</p>

          {/* NOVO BOTÃO COMERCIAL: Demonstração */}
          <div className="mt-8 flex gap-4 pointer-events-auto">
            <button 
              onClick={() => window.open('https://wa.me/5584994229126', '_blank')}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-medium text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 flex items-center gap-2 group backdrop-blur-sm"
            >
              Agendar Demonstração
              <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <div className="hidden lg:flex gap-10 text-[11px] font-mono text-zinc-500 pt-8 mt-12 border-t border-white/5 pointer-events-none">
            <div>
               <span className="block text-white/30 mb-1">STATUS</span>
               <span className="text-emerald-400/80 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Sistema Operacional</span>
            </div>
            <div>
               <span className="block text-white/30 mb-1">ENCRYPTION</span>
               <span className="text-zinc-300">AES-256 E2E</span>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: CONSOLE DE ACESSO */}
      <div className="w-full lg:w-[45%] flex flex-col justify-start lg:justify-center items-center lg:items-start p-6 lg:p-20 relative z-20 h-[65dvh] lg:h-auto">
        
        <div className="w-full max-w-[400px] bg-white/[0.02] backdrop-blur-md border border-white/[0.08] p-8 lg:p-10 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-700 hover:bg-white/[0.03] hover:border-white/[0.12] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          
          <div className="mb-8">
            <h2 className="text-[1.25rem] font-medium tracking-tight text-zinc-100">
              {stepTrocaSenha ? 'Redefina sua senha' : (!mostrarFormPadrao && lastLogin) ? `${getSaudacao()}, ${(lastLogin.nome_usuario || 'Operador').split(' ')[0]}` : 'Acesso ao Workspace'}
            </h2>
            <p className="mt-1.5 text-[13px] text-zinc-500 font-light">
               {stepTrocaSenha ? 'Crie uma nova senha para acessar sua conta AROX.' : (!mostrarFormPadrao && lastLogin) ? 'Autenticar sessão protegida.' : 'Assinatura digital exigida.'}
            </p>
          </div>

          {stepTrocaSenha ? (
            <form onSubmit={salvarNovaSenha} className="space-y-5">
              <div className="space-y-3">
                <div className={`transition-all duration-300 border rounded-xl overflow-hidden bg-black/30 ${activeInput === 'novaSenha' ? 'border-white/30 ring-1 ring-white/10' : 'border-white/10'}`}>
                  <input 
                    type="password" placeholder="Nova Senha Master" 
                    className="w-full px-4 py-3.5 bg-transparent outline-none font-light text-white placeholder:text-zinc-600 text-[14px]" 
                    value={novaSenha} onChange={e => handleTyping(e, 'novaSenha')} 
                    onFocus={() => { setActiveInput('novaSenha'); if(setScenePhase) setScenePhase('sync'); }} 
                    onBlur={() => { setActiveInput(null); if(setScenePhase) setScenePhase('reveal'); }} autoFocus 
                  />
                </div>
                <div className={`transition-all duration-300 border rounded-xl overflow-hidden bg-black/30 ${activeInput === 'confirm' ? 'border-white/30 ring-1 ring-white/10' : confirmTouched && !matchPasswords ? 'border-red-500/50' : 'border-white/10'}`}>
                  <input 
                    type="password" placeholder="Confirmar Senha Master" 
                    className="w-full px-4 py-3.5 bg-transparent outline-none font-light text-white placeholder:text-zinc-600 text-[14px]" 
                    value={confirmarNovaSenha} onChange={e => handleTyping(e, 'confirmarNovaSenha')} 
                    onFocus={() => setActiveInput('confirm')} onBlur={() => setActiveInput(null)}
                  />
                </div>
              </div>

              <div className="pt-2 bg-white/[0.02] rounded-lg p-3 border border-white/5">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="h-[3px] w-full bg-black/60 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ease-out rounded-full ${pwdScore >= step ? progressColor : 'w-0'}`} style={{ width: pwdScore >= step ? '100%' : '0%' }}></div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-2">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400"><CheckIcon active={hasLength} /> Mínimo 8 Characteres</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400"><CheckIcon active={hasNumber} /> Número(s)</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400"><CheckIcon active={hasSpecial} /> Simbolo(s)</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400"><CheckIcon active={matchPasswords} /> Senhas Iguais</div>
                </div>
              </div>

              {/* CHECKBOX DE TERMOS INTEGRADO (Refinado) */}
              <div className="flex items-start gap-3 px-1 py-1 mt-2">
                <div className="relative flex items-center mt-0.5">
                  <input 
                    type="checkbox" id="termos" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)}
                    className="peer appearance-none w-4 h-4 border border-white/20 rounded-[4px] bg-black/30 checked:bg-white checked:border-white transition-all cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100 top-0.5 left-0.5 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <label htmlFor="termos" className="text-[11.5px] text-zinc-400 font-light leading-[1.4] select-none cursor-pointer">
                  Confirmo que li e aceito as <button type="button" onClick={() => setModalContent({ open: true, title: 'Termos de Operação', text: policies.termos })} className="text-zinc-200 hover:text-white transition-colors underline underline-offset-2">Políticas Operacionais</button> e a <button type="button" onClick={() => setModalContent({ open: true, title: 'Privacidade de Dados', text: policies.privacidade })} className="text-zinc-200 hover:text-white transition-colors underline underline-offset-2">Privacidade de Dados</button>.
                </label>
              </div>

              {erro && <p className="text-[12px] text-red-400 animate-in fade-in pt-1 font-mono">{erro}</p>}
              
              <button type="submit" disabled={loadingLogin || pwdScore < 4 || !aceitouTermos} className={`w-full py-3.5 text-[13px] font-medium transition-all duration-300 mt-4 rounded-xl ${pwdScore === 4 && aceitouTermos ? 'bg-zinc-100 text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98]' : 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5'}`}>
                {loadingLogin ? <LoadingDots /> : 'Ativar Credencial'}
              </button>
            </form>

          ) : (!mostrarFormPadrao && lastLogin) ? (
            <div className="w-full flex flex-col">
              <div className="flex items-center gap-4 mb-8 bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 flex items-center justify-center border border-white/5">
                  <img src={lastLogin.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[14px] font-medium text-zinc-100 truncate">{lastLogin.nome_usuario || 'Administrador'}</p>
                  <p className="text-[12px] text-zinc-500 truncate font-mono mt-0.5">{lastLogin.nome_empresa}</p>
                </div>
              </div>
              {erro && <p className="text-[12px] text-red-400 animate-in fade-in pb-4 font-mono">{erro}</p>}
              <div className="space-y-3">
                <button onClick={loginComContaSalva} disabled={loadingLogin} className="w-full py-3.5 rounded-xl text-[13px] font-medium bg-zinc-100 text-black hover:bg-white transition-all duration-300 active:scale-[0.98] disabled:opacity-50">
                  {loadingLogin ? <LoadingDots /> : 'Acessar Instância'}
                </button>
                <button onClick={() => setMostrarFormPadrao(true)} className="w-full py-3.5 rounded-xl text-[12px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300">
                  Utilizar outra credencial
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={fazerLogin}>
              <div className="space-y-3">
                <div className={`transition-all duration-300 border rounded-xl overflow-hidden bg-black/30 ${activeInput === 'email' ? 'border-white/30 ring-1 ring-white/10' : 'border-white/10'}`}>
                  <input 
                    id="email" type="email" placeholder="Endereço de E-mail" 
                    className="w-full px-4 py-3.5 bg-transparent outline-none font-light text-white placeholder:text-zinc-600 text-[14px]"
                    value={credenciais.email} onChange={e => handleTyping(e, 'email')} 
                    onFocus={() => { setActiveInput('email'); if(setScenePhase) setScenePhase('sync'); }} 
                    onBlur={() => { setActiveInput(null); if(setScenePhase) setScenePhase('reveal'); }} autoFocus={!lastLogin}
                  />
                </div>
                <div className={`transition-all duration-300 border rounded-xl overflow-hidden bg-black/30 ${activeInput === 'senha' ? 'border-white/30 ring-1 ring-white/10' : 'border-white/10'}`}>
                  <input 
                    id="senha" type="password" placeholder="Chave de Acesso" 
                    className="w-full px-4 py-3.5 bg-transparent outline-none font-light text-white placeholder:text-zinc-600 text-[14px]"
                    value={credenciais.senha} onChange={e => handleTyping(e, 'senha')} 
                    onFocus={() => setActiveInput('senha')} onBlur={() => setActiveInput(null)}
                  />
                </div>
              </div>
              {erro && <p className="text-[12px] text-red-400 animate-in fade-in pt-1 font-mono">{erro}</p>}
              <button type="submit" disabled={loadingLogin} className="w-full py-3.5 rounded-xl text-[13px] font-medium bg-zinc-100 text-black hover:bg-white transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-2 shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.15)]">
                {loadingLogin ? <LoadingDots /> : 'Autorizar Conexão'}
              </button>
              {lastLogin && (
                 <div className="pt-4 text-center">
                   <button type="button" onClick={() => setMostrarFormPadrao(false)} className="text-[12px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-300">
                     &larr; Voltar para conta salva
                   </button>
                 </div>
              )}
            </form>
          )}
        </div>
        
        {/* Rodapé Corporativo com Modais Integrados */}
        <div className="w-full max-w-[400px] mt-8 text-center lg:text-left flex justify-between items-center px-2">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Arox Systems © {new Date().getFullYear()}</p>
          <div className="flex gap-4 text-[10px] font-mono text-zinc-500 uppercase">
             <button onClick={() => setModalContent({ open: true, title: 'Privacidade de Dados', text: policies.privacidade })} className="hover:text-zinc-300 transition-colors">Privacidade</button>
             <button onClick={() => setModalContent({ open: true, title: 'Termos de Operação', text: policies.termos })} className="hover:text-zinc-300 transition-colors">Termos</button>
          </div>
        </div>

      </div>

      {/* Renderização Externa do Modal */}
      <PolicyModal 
        isOpen={modalContent.open} 
        title={modalContent.title} 
        content={modalContent.text} 
        onClose={() => setModalContent({ ...modalContent, open: false })}
      />
    </div>
  );
}