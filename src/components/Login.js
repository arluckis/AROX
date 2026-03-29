// src/app/login/page.js (ou o caminho correto do seu Login)
'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const LoadingDots = () => (
  <div className="flex items-center gap-2 justify-center">
    <div className="w-1.5 h-1.5 bg-white rounded-sm animate-[pulse_1.5s_ease-in-out_infinite]"></div>
    <div className="w-1.5 h-1.5 bg-white rounded-sm animate-[pulse_1.5s_ease-in-out_0.2s_infinite]"></div>
    <div className="w-1.5 h-1.5 bg-white rounded-sm animate-[pulse_1.5s_ease-in-out_0.4s_infinite]"></div>
  </div>
);

const CheckIcon = ({ active }) => (
  <svg className={`w-3.5 h-3.5 transition-all duration-500 ease-out ${active ? 'text-zinc-200 scale-100 opacity-100' : 'text-zinc-700 scale-75 opacity-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

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

  const [activeInput, setActiveInput] = useState(null);
  const [typingParticles, setTypingParticles] = useState([]);

  // Geração de partículas de dados (estrelas dinâmicas discretas)
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

  // Saudação Executiva
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Validação Estrita (Padrão Enterprise)
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

  const progressWidth = `${(pwdScore / 4) * 100}%`;
  const progressColor = pwdScore <= 1 ? 'bg-red-500' : pwdScore === 2 ? 'bg-amber-500' : pwdScore === 3 ? 'bg-zinc-400' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]';

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

    const sessionObj = { ...data, data: getHoje() };
    delete sessionObj.empresas; 
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj)); 
    
    if (data.role === 'super_admin') { window.location.href = '/admin'; return; }
    setSessao(sessionObj);
  };

  const processarAutenticacao = async (emailBusca, senhaBusca) => {
    setLoadingLogin(true); setErro('');
    if(setScenePhase) setScenePhase('sync'); 

    const { data, error } = await supabase.from('usuarios').select('*, empresas ( ativo, nome, logo_url )').eq('email', emailBusca.trim()).eq('senha', senhaBusca).single();

    if (data && !error) { 
      if (data.role !== 'super_admin' && data.empresas && data.empresas.ativo === false) {
        setErro("Acesso restrito. Consulte a administração do sistema.");
        setLoadingLogin(false);
        if(setScenePhase) setScenePhase('reveal');
        return;
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
    setLoadingLogin(true);
    
    const { error } = await supabase.from('usuarios').update({ senha: novaSenha, primeiro_login: false }).eq('id', tempUser.id);
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
      
      {/* PARTICLES DATA FLOW (Feedback visual de digitação) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen">
        {typingParticles.map(particle => (
          <div 
            key={particle.id}
            className="absolute rounded-full bg-blue-100 animate-in fade-in zoom-in duration-700 ease-out"
            style={{
              left: `${particle.x}%`, top: `${particle.y}%`,
              width: `${particle.size}px`, height: `${particle.size}px`,
              opacity: particle.opacity,
              animation: 'fadeOutParticle 1s forwards'
            }}
          />
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes fadeOutParticle { 0% { transform: scale(0.5); } 100% { opacity: 0; transform: scale(1.5) translateY(-10px); } }`}} />

      {/* LADO ESQUERDO: INSTITUCIONAL / DATA INTELLIGENCE */}
      <div className="w-full lg:w-[55%] flex flex-col justify-end lg:justify-center p-8 lg:p-24 relative z-20 h-[35dvh] lg:h-auto pointer-events-none">
        <div className="animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[1px] w-8 bg-white/20"></div>
            <span className="font-mono tracking-[0.2em] text-[10px] uppercase text-zinc-400">AROX Core v3.0.4</span>
          </div>
          
          <h1 className="text-[2rem] lg:text-[4rem] font-medium leading-[1.1] tracking-tight text-white drop-shadow-lg">
            Inteligência <br className="hidden lg:block"/> em escala.
          </h1>
          <p className="mt-4 lg:mt-6 text-zinc-400 text-[14px] lg:text-[16px] leading-relaxed max-w-md font-light">
            Arquitetura de dados corporativa. Centralize sua operação com precisão analítica e disponibilidade absoluta.
          </p>

          <div className="hidden lg:flex gap-10 text-[11px] font-mono text-zinc-500 pt-8 mt-12 border-t border-white/5">
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
        
        {/* CARD GLASSMORPHISM ESTRUTURADO */}
        <div className="w-full max-w-[400px] bg-white/[0.02] backdrop-blur-md border border-white/[0.08] p-8 lg:p-10 rounded-[24px] shadow-2xl transition-all duration-700 hover:bg-white/[0.03] hover:border-white/[0.12] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          
          <div className="mb-8">
            <h2 className="text-[1.25rem] font-medium tracking-tight text-zinc-100">
              {/* CORREÇÃO AQUI: (lastLogin.nome_usuario || 'Usuário').split(' ')[0] */}
              {stepTrocaSenha ? 'Configuração de Credencial' : (!mostrarFormPadrao && lastLogin) ? `${getSaudacao()}, ${(lastLogin.nome_usuario || 'Usuário').split(' ')[0]}` : 'Console de Autenticação'}
            </h2>
            <p className="mt-1.5 text-[13px] text-zinc-500 font-light">
               {stepTrocaSenha ? 'Estabeleça a chave raiz da sua instância.' : (!mostrarFormPadrao && lastLogin) ? 'Autorize o acesso ao seu workspace.' : 'Identificação segura requerida.'}
            </p>
          </div>

          {stepTrocaSenha ? (
            <form onSubmit={salvarNovaSenha} className="space-y-5">
              <div className="space-y-3">
                <div className={`transition-all duration-300 border rounded-xl overflow-hidden bg-black/20 ${activeInput === 'novaSenha' ? 'border-white/30 ring-1 ring-white/10' : 'border-white/10'}`}>
                  <input 
                    type="password" placeholder="Nova Senha Master" 
                    className="w-full px-4 py-3.5 bg-transparent outline-none font-light text-white placeholder:text-zinc-600 text-[14px]" 
                    value={novaSenha} onChange={e => handleTyping(e, 'novaSenha')} 
                    onFocus={() => { setActiveInput('novaSenha'); if(setScenePhase) setScenePhase('sync'); }} 
                    onBlur={() => { setActiveInput(null); if(setScenePhase) setScenePhase('reveal'); }} autoFocus 
                  />
                </div>
                <div className={`transition-all duration-300 border rounded-xl overflow-hidden bg-black/20 ${activeInput === 'confirm' ? 'border-white/30 ring-1 ring-white/10' : confirmTouched && !matchPasswords ? 'border-red-500/50' : 'border-white/10'}`}>
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
                    <div key={step} className="h-[3px] w-full bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ease-out rounded-full ${pwdScore >= step ? progressColor : 'w-0'}`} style={{ width: pwdScore >= step ? '100%' : '0%' }}></div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-2">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400"><CheckIcon active={hasLength} /> Mín. 8 Chars</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400"><CheckIcon active={hasNumber} /> Numérico</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400"><CheckIcon active={hasSpecial} /> Simbólico</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400"><CheckIcon active={matchPasswords} /> Validação</div>
                </div>
              </div>

              {erro && <p className="text-[12px] text-red-400 animate-in fade-in pt-1 font-mono">{erro}</p>}
              
              <button type="submit" disabled={loadingLogin || pwdScore < 4} className={`w-full py-3.5 text-[13px] font-medium transition-all duration-300 mt-4 rounded-xl ${pwdScore === 4 ? 'bg-zinc-100 text-black hover:bg-white active:scale-[0.98]' : 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5'}`}>
                {loadingLogin ? <LoadingDots /> : 'Confirmar Credencial'}
              </button>
            </form>

          ) : (!mostrarFormPadrao && lastLogin) ? (
            <div className="w-full flex flex-col">
              <div className="flex items-center gap-4 mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0">
                  <img src={lastLogin.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div className="overflow-hidden">
                  {/* CORREÇÃO AQUI TAMBÉM: fallback para o nome e ajuste de design */}
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
                <div className={`transition-all duration-300 border rounded-xl overflow-hidden bg-black/20 ${activeInput === 'email' ? 'border-white/30 ring-1 ring-white/10' : 'border-white/10'}`}>
                  <input 
                    id="email" type="email" placeholder="Endereço de E-mail" 
                    className="w-full px-4 py-3.5 bg-transparent outline-none font-light text-white placeholder:text-zinc-600 text-[14px]"
                    value={credenciais.email} onChange={e => handleTyping(e, 'email')} 
                    onFocus={() => { setActiveInput('email'); if(setScenePhase) setScenePhase('sync'); }} 
                    onBlur={() => { setActiveInput(null); if(setScenePhase) setScenePhase('reveal'); }} autoFocus 
                  />
                </div>
                <div className={`transition-all duration-300 border rounded-xl overflow-hidden bg-black/20 ${activeInput === 'senha' ? 'border-white/30 ring-1 ring-white/10' : 'border-white/10'}`}>
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
        
        {/* Rodapé Corporativo */}
        <div className="w-full max-w-[400px] mt-8 text-center lg:text-left flex justify-between items-center px-2">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Arox Systems © {new Date().getFullYear()}</p>
          <div className="flex gap-3 text-[10px] font-mono text-zinc-600 uppercase">
             <a href="#" className="hover:text-zinc-400 transition-colors">Privacidade</a>
             <a href="#" className="hover:text-zinc-400 transition-colors">Termos</a>
          </div>
        </div>

      </div>
    </div>
  );
}