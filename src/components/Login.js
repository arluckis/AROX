'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const LoadingDots = () => (
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2.5 h-2.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2.5 h-2.5 bg-current rounded-full animate-bounce"></div>
  </div>
);

export default function Login({ getHoje, setSessao }) {
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

  const hasLength = novaSenha.length >= 8;
  const hasNumber = /\d/.test(novaSenha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha);
  const matchPasswords = novaSenha !== '' && novaSenha === confirmarNovaSenha;
  const pwdScore = [hasLength, hasNumber, hasSpecial].filter(Boolean).length;
  const progressColor = pwdScore === 0 ? 'bg-zinc-200' : pwdScore === 1 ? 'bg-rose-500' : pwdScore === 2 ? 'bg-amber-400' : 'bg-emerald-500';

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
    // Nome dinâmico para não ficar "AROX" no avatar do Super Admin
    const nomeEmpresa = data.empresas?.nome || (data.role === 'super_admin' ? 'Console Admin' : 'AROX');

    localStorage.setItem('arox_last_login', JSON.stringify({
      email: data.email, senha: data.senha, nome_usuario: data.nome_usuario, nome_empresa: nomeEmpresa, logo: logoEmpresa
    }));

    const sessionObj = { ...data, data: getHoje() };
    delete sessionObj.empresas; 
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj)); 
    
    // CORREÇÃO CRÍTICA: Intercepta o Super Admin imediatamente
    if (data.role === 'super_admin') {
      window.location.href = '/admin';
      return;
    }

    // A partir daqui, executa apenas para Lojistas comuns
    setSessao(sessionObj);
    
    // SISTEMA DE SESSÃO REAL E AUDITORIA
    (async () => {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const ip = ipData.ip;
        const ua = navigator.userAgent;

        // 1. Log Simples de Evento
        await supabase.from('logs_acesso').insert([{
          usuario_id: data.id, empresa_id: data.empresa_id, email: data.email, ip: ip, navegador: ua
        }]);

        // 2. Abertura de Sessão Operacional
        const { data: sessaoDb, error: errSessao } = await supabase.from('sessoes_acesso').insert([{
          usuario_id: data.id, empresa_id: data.empresa_id, ip_origem: ip, user_agent: ua
        }]).select().single();

        if (sessaoDb) {
           localStorage.setItem('arox_session_id', sessaoDb.id);
        }

        // 3. Atualiza Presença
        await supabase.from('usuarios').update({ 
          status_presenca: 'online', 
          ultimo_ping_at: new Date().toISOString() 
        }).eq('id', data.id);

      } catch (err) { console.log("Erro log/sessão", err); }
    })();
  };

  const processarAutenticacao = async (emailBusca, senhaBusca) => {
    setLoadingLogin(true);
    setErro('');

    const { data, error } = await supabase
      .from('usuarios')
      .select('*, empresas ( ativo, nome, logo_url )')
      .eq('email', emailBusca.trim())
      .eq('senha', senhaBusca)
      .single();

    if (data && !error) { 
      if (data.role !== 'super_admin' && data.empresas && data.empresas.ativo === false) {
        setErro("Acesso suspenso. Contate o suporte.");
        setLoadingLogin(false);
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
      setErro("Credenciais incorretas."); 
      setLoadingLogin(false);
    }
  };

  const fazerLogin = (e) => {
    e.preventDefault(); 
    if (!credenciais.email || !credenciais.senha) return setErro("Preencha email e senha.");
    processarAutenticacao(credenciais.email, credenciais.senha);
  };

  const loginComContaSalva = () => {
    if (lastLogin && lastLogin.email) processarAutenticacao(lastLogin.email, lastLogin.senha);
    else setMostrarFormPadrao(true);
  };

  const salvarNovaSenha = async (e) => {
    e.preventDefault();
    setErro('');
    if (pwdScore < 3) return setErro("A senha não atende aos requisitos mínimos.");
    if (!matchPasswords) return setErro("As senhas não coincidem.");
    setLoadingLogin(true);
    
    const { error } = await supabase.from('usuarios').update({ senha: novaSenha, primeiro_login: false }).eq('id', tempUser.id);
    if (error) {
      setErro("Erro ao atualizar senha.");
      setLoadingLogin(false);
    } else {
      const dataAtualizada = { ...tempUser, senha: novaSenha, primeiro_login: false };
      concluirAcesso(dataAtualizada);
    }
  };

  if (!isMounted) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-zinc-900 scale-125"><LoadingDots /></div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-zinc-50 font-sans selection:bg-purple-200 selection:text-purple-900">
      
      <div className="hidden lg:flex lg:w-[55%] relative bg-[#09090b] overflow-hidden flex-col justify-between px-20 py-16">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#09090b] to-[#120a1f] pointer-events-none"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen animate-[spin_60s_linear_infinite] [transform-origin:100%_100%] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[150px] mix-blend-screen animate-[spin_50s_linear_infinite_reverse] [transform-origin:0%_0%] pointer-events-none"></div>

        <div className="relative z-20"><span className="text-white font-black tracking-tighter text-3xl">AROX</span></div>
        
        <div className="relative z-20 w-full max-w-lg mt-8">
          <div className="mb-12 w-full h-40 flex items-end justify-between gap-3 p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
            {[35, 60, 45, 80, 55, 100, 75].map((height, i) => (
              <div key={i} className="w-full bg-gradient-to-t from-purple-600/60 to-indigo-500/80 rounded-t-sm transition-all duration-1000 ease-out" style={{ height: `${height}%`, opacity: 0.8 + (i * 0.03) }}></div>
            ))}
          </div>
          <h1 className="text-[3.25rem] font-bold text-white leading-[1.05] tracking-tight mb-6">Domine sua operação.</h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md font-medium">Controle absoluto, métricas em tempo real e confiabilidade máxima para escalar seu negócio.</p>
        </div>

        <div className="relative z-20 grid grid-cols-2 gap-x-12 gap-y-6 text-sm font-medium text-zinc-400 max-w-md border-t border-white/10 pt-8 mt-12">
          <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white"></div><span>Workspaces Seguros</span></div>
          <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div><span className="text-zinc-300">99.9% Uptime</span></div>
          <div className="flex items-center gap-3"><svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg><span>Criptografia Ativa</span></div>
           <div className="flex items-center gap-3"><svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg><span>Alta Performance</span></div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative bg-white">
        <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          
          <div className="lg:hidden mb-12"><span className="text-zinc-950 font-black tracking-tighter text-3xl">AROX</span></div>

          {stepTrocaSenha ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-zinc-900 mb-2 tracking-tight">Crie sua senha</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">Defina uma nova senha para <span className="font-medium text-zinc-800">{tempUser?.nome_usuario}</span>.</p>
              </div>

              <form onSubmit={salvarNovaSenha} className="space-y-6">
                <div>
                  <input type="password" placeholder="Nova senha" className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-0 outline-none transition-colors font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} autoFocus />
                  <div className="mt-3">
                    <div className="h-[3px] w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ease-out rounded-full ${progressColor}`} style={{ width: `${(pwdScore / 3) * 100}%` }}></div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 ${hasLength ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        <svg className={`w-3.5 h-3.5 transition-colors ${hasLength ? 'text-emerald-500' : 'text-zinc-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        8+ caracteres
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 ${hasNumber ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        <svg className={`w-3.5 h-3.5 transition-colors ${hasNumber ? 'text-emerald-500' : 'text-zinc-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Número
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 ${hasSpecial ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        <svg className={`w-3.5 h-3.5 transition-colors ${hasSpecial ? 'text-emerald-500' : 'text-zinc-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Especial
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <input type="password" placeholder="Confirmar senha" className={`w-full px-4 py-3 bg-white border rounded-lg focus:ring-0 outline-none transition-colors font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm ${confirmarNovaSenha.length > 0 && !matchPasswords ? 'border-rose-300 focus:border-rose-400 text-rose-900' : 'border-zinc-200 focus:border-zinc-400'}`} value={confirmarNovaSenha} onChange={e => setConfirmarNovaSenha(e.target.value)} />
                </div>
                {erro && <div className="text-sm text-rose-600 font-medium animate-in fade-in">{erro}</div>}
                <button type="submit" disabled={loadingLogin || pwdScore < 3 || !matchPasswords} className={`w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${pwdScore === 3 && matchPasswords ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md active:scale-[0.98]' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                  {loadingLogin ? <LoadingDots /> : 'Confirmar e acessar'}
                </button>
              </form>
            </div>
          ) : (!mostrarFormPadrao && lastLogin) ? (
            <div className="animate-in fade-in duration-500 w-full">
              <div className="mb-10 text-center sm:text-left">
                <h2 className="text-[1.75rem] font-semibold text-zinc-900 tracking-tight">Bem-vindo de volta</h2>
                <p className="mt-1 text-zinc-500 text-sm">Acesse seu ambiente de trabalho.</p>
              </div>

              <div className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-zinc-300 transition-colors mb-6 group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-100 shadow-sm bg-zinc-50 flex items-center justify-center">
                    <img src={lastLogin.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900">{lastLogin.nome_usuario}</span>
                    <span className="text-xs font-medium text-zinc-500">{lastLogin.nome_empresa}</span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>

              {erro && <div className="text-sm text-rose-600 font-medium animate-in fade-in mb-6">{erro}</div>}

              <div className="space-y-3">
                <button onClick={loginComContaSalva} disabled={loadingLogin} className="w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                  {loadingLogin ? <LoadingDots /> : 'Continuar'}
                </button>
                <button onClick={() => setMostrarFormPadrao(true)} className="w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all">
                  Entrar com outra conta
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="mb-10">
                <h2 className="text-[1.75rem] font-semibold text-zinc-900 tracking-tight">Acessar conta</h2>
                <p className="mt-2 text-sm text-zinc-500">Digite seus dados para entrar na sua conta AROX.</p>
              </div>
              
              <form className="space-y-5" onSubmit={fazerLogin}>
                <div className="space-y-4">
                  <div>
                    <input id="email" type="email" placeholder="E-mail corporativo" className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-0 outline-none transition-colors font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm" value={credenciais.email} onChange={e => setCredenciais({...credenciais, email: e.target.value})} autoFocus />
                  </div>
                  <div>
                    <input id="senha" type="password" placeholder="Senha" className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-0 outline-none transition-colors font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm" value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})} />
                  </div>
                </div>

                {erro && <div className="text-sm text-rose-600 font-medium animate-in fade-in pt-1">{erro}</div>}

                <button type="submit" disabled={loadingLogin} className="w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                  {loadingLogin ? <LoadingDots /> : 'Entrar'}
                </button>
                
                {lastLogin && (
                   <div className="text-center pt-4">
                     <button type="button" onClick={() => setMostrarFormPadrao(false)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                       ← Voltar para {lastLogin.nome_usuario}
                     </button>
                   </div>
                )}
              </form>
            </div>
          )}
          
          <div className="mt-16 text-left">
            <p className="text-xs font-medium text-zinc-400">© {new Date().getFullYear()} AROX.</p>
          </div>
        </div>
      </div>
    </div>
  );
}