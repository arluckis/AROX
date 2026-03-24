'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login({ getHoje, setSessao }) {
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [erro, setErro] = useState('');

  // Estados 
  const [lastLogin, setLastLogin] = useState(null);
  const [mostrarFormPadrao, setMostrarFormPadrao] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Estados Troca de Senha
  const [stepTrocaSenha, setStepTrocaSenha] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  // Validações em tempo real da senha
  const hasLength = novaSenha.length >= 8;
  const hasNumber = /\d/.test(novaSenha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha);
  const matchPasswords = novaSenha !== '' && novaSenha === confirmarNovaSenha;
  
  // Calcula o "score" da senha (de 0 a 3)
  const pwdScore = [hasLength, hasNumber, hasSpecial].filter(Boolean).length;
  // Cor da barra de progresso
  const progressColor = pwdScore === 0 ? 'bg-gray-200' : pwdScore === 1 ? 'bg-rose-500' : pwdScore === 2 ? 'bg-amber-400' : 'bg-emerald-500';

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('bessa_last_login');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          setLastLogin(parsed);
        } else {
          setMostrarFormPadrao(true);
        }
      } else {
        setMostrarFormPadrao(true);
      }
    } catch (e) {
      localStorage.removeItem('bessa_last_login');
      setMostrarFormPadrao(true);
    }
  }, []);

  const concluirAcesso = (data) => {
    const logoEmpresa = data.empresas?.logo_url || data.empresas?.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const nomeEmpresa = data.empresas?.nome || 'Painel de Gestão';

    localStorage.setItem('bessa_last_login', JSON.stringify({
      email: data.email,
      senha: data.senha,
      nome_usuario: data.nome_usuario,
      nome_empresa: nomeEmpresa,
      logo: logoEmpresa
    }));

    const sessionObj = { ...data, data: getHoje() };
    delete sessionObj.empresas; 
    
    setSessao(sessionObj);
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj));
    
    (async () => {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        await supabase.from('logs_acesso').insert([{
          usuario_id: data.id,
          empresa_id: data.empresa_id,
          email: data.email,
          ip: ipData.ip,
          navegador: navigator.userAgent
        }]);
      } catch (err) { console.log("Erro log", err); }
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
        setErro("Acesso temporariamente suspenso. Por favor, entre em contato com o suporte ou setor financeiro.");
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
      setErro("E-mail ou senha incorretos. Tente novamente."); 
      setLoadingLogin(false);
    }
  };

  const fazerLogin = (e) => {
    e.preventDefault(); 
    if (!credenciais.email || !credenciais.senha) return setErro("Por favor, preencha o e-mail e a senha.");
    processarAutenticacao(credenciais.email, credenciais.senha);
  };

  const loginComContaSalva = () => {
    if (lastLogin && lastLogin.email) {
      processarAutenticacao(lastLogin.email, lastLogin.senha);
    } else {
      setMostrarFormPadrao(true);
    }
  };

  const salvarNovaSenha = async (e) => {
    e.preventDefault();
    setErro('');

    if (pwdScore < 3) return setErro("A senha não atende a todos os critérios de segurança.");
    if (!matchPasswords) return setErro("As senhas não coincidem.");

    setLoadingLogin(true);
    
    const { error } = await supabase
      .from('usuarios')
      .update({ senha: novaSenha, primeiro_login: false })
      .eq('id', tempUser.id);

    if (error) {
      setErro("Ocorreu um erro ao atualizar sua senha.");
      setLoadingLogin(false);
    } else {
      const dataAtualizada = { ...tempUser, senha: novaSenha, primeiro_login: false };
      concluirAcesso(dataAtualizada);
    }
  };

  // Previne Hydration Mismatch renderizando um loading elegante
  if (!isMounted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* LADO ESQUERDO: Arte Abstrata  */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B0F19] overflow-hidden justify-center items-center">
        <div className="absolute top-8 left-10 flex items-center gap-3 z-20">
          <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-purple-300"><path d="M3 18h18" /><path d="M5 14c0-3.87 3.13-7 7-7s7 3.13 7 7" /><path d="M12 7V4" /><path d="M10 4h4" /></svg>
          </div>
          <span className="text-white/80 font-black tracking-widest text-sm uppercase">Comandas Bom a Bessa</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-indigo-950/40 to-purple-900/20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[150px] mix-blend-screen pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-lg p-10 mx-16 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
          <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <h3 className="text-3xl font-bold text-white mb-4 leading-tight">O controle do seu negócio na palma da mão.</h3>
          <p className="text-indigo-100/70 text-lg leading-relaxed mb-8">Acompanhe o fluxo de comandas, gerencie sua equipe e tenha uma visão clara do seu faturamento em tempo real, com total segurança e performance.</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div><span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">Tempo Real</span></div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5"><div className="w-2 h-2 rounded-full bg-blue-400"></div><span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">Nuvem Segura</span></div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </div>

      {/* LADO DIREITO: Componentes Interativos */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-white shadow-2xl z-10 relative">
        
        {/* Glow de fundo sutil no lado branco para ficar mais  */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 rounded-full blur-[100px] pointer-events-none opacity-60"></div>
        
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
          
          <div className="text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
              <div className="h-14 w-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white"><path d="M3 18h18" /><path d="M5 14c0-3.87 3.13-7 7-7s7 3.13 7 7" /><path d="M12 7V4" /><path d="M10 4h4" /></svg>
              </div>
              <div className="flex flex-col justify-center pt-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Comandas Bom a Bessa</h1>
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest mt-0.5">Painel de Gestão</p>
              </div>
            </div>
          </div>

          {stepTrocaSenha ? (
             
            <div className="mt-8 animate-in slide-in-from-right-8 duration-500">
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900 mb-2">Bem-vindo(a), {tempUser?.nome_usuario}!</h2>
                <p className="text-sm text-gray-500 leading-relaxed">Por questões de segurança, altere a senha criada pelo administrador por uma definitiva para a sua conta.</p>
              </div>

              <form onSubmit={salvarNovaSenha} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nova Senha</label>
                  <input type="password" placeholder="Digite sua senha" className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all font-medium text-gray-800" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} autoFocus />
                </div>
                
                {/* MEDIDOR DE FORÇA E REGRAS */}
                <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Força da Senha</span>
                    <span className={`text-xs font-black uppercase tracking-wider ${pwdScore === 3 ? 'text-emerald-500' : pwdScore === 2 ? 'text-amber-500' : pwdScore === 1 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {pwdScore === 3 ? 'Forte' : pwdScore === 2 ? 'Média' : pwdScore === 1 ? 'Fraca' : 'Muito Fraca'}
                    </span>
                  </div>
                  
                  {/* Barra de Progresso Animada */}
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div className={`h-full transition-all duration-500 ease-out rounded-full ${progressColor}`} style={{ width: `${(pwdScore / 3) * 100}%` }}></div>
                  </div>

                  {/* Lista de Requisitos Dinâmica */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 transition-colors duration-300">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${hasLength ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'bg-gray-200 text-transparent'}`}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className={`text-xs font-semibold transition-colors duration-300 ${hasLength ? 'text-gray-800' : 'text-gray-400'}`}>Mínimo de 8 caracteres</span>
                    </div>

                    <div className="flex items-center gap-2 transition-colors duration-300">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${hasNumber ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'bg-gray-200 text-transparent'}`}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className={`text-xs font-semibold transition-colors duration-300 ${hasNumber ? 'text-gray-800' : 'text-gray-400'}`}>Pelo menos 1 número (0-9)</span>
                    </div>

                    <div className="flex items-center gap-2 transition-colors duration-300">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${hasSpecial ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'bg-gray-200 text-transparent'}`}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className={`text-xs font-semibold transition-colors duration-300 ${hasSpecial ? 'text-gray-800' : 'text-gray-400'}`}>Pelo menos 1 caractere especial (!@#$%)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-700">Confirmar Nova Senha</label>
                    {confirmarNovaSenha.length > 0 && (
                      <span className={`text-xs font-bold ${matchPasswords ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {matchPasswords ? 'As senhas coincidem' : 'As senhas não coincidem'}
                      </span>
                    )}
                  </div>
                  <input type="password" placeholder="Repita a senha" className={`mt-1 block w-full px-4 py-3 bg-gray-50 border rounded-xl shadow-sm focus:bg-white focus:ring-2 outline-none transition-all font-medium text-gray-800 ${confirmarNovaSenha.length > 0 && !matchPasswords ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-gray-200 focus:ring-purple-600 focus:border-purple-600'}`} value={confirmarNovaSenha} onChange={e => setConfirmarNovaSenha(e.target.value)} />
                </div>

                {erro && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-red-700 font-medium">{erro}</p>
                  </div>
                )}

                <button type="submit" disabled={loadingLogin || pwdScore < 3 || !matchPasswords} className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black text-white transition-all duration-300 active:scale-[0.98] ${pwdScore === 3 && matchPasswords ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/30' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}>
                  {loadingLogin ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Salvando...</span>
                  ) : 'Salvar e Acessar'}
                </button>
              </form>
            </div>

          ) : (!mostrarFormPadrao && lastLogin) ? (
            
            <div className="mt-8 flex flex-col items-center animate-in zoom-in-95 duration-500 w-full relative">
              
              <div className="w-full relative bg-white border border-gray-100 p-8 pt-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col items-center text-center overflow-hidden z-10 group transition-all hover:shadow-[0_20px_50px_-12px_rgba(147,51,234,0.15)]">
                
                {/* Linha gradiente no topo do card */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
                
                {/* AVATAR 100% REDONDO COM BORDA */}
                <div className="relative mb-6">
                  {/* Anel de brilho pulsante atrás do avatar */}
                  <div className="absolute inset-[-4px] bg-gradient-to-tr from-purple-600 to-blue-400 rounded-full opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-500"></div>
                  
                  {/* Borda gradiente do avatar */}
                  <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-indigo-500 to-blue-500 shadow-lg">
                    {/* Imagem redonda */}
                    <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white">
                      <img src={lastLogin.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  {/* Badge de "Logado" */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{lastLogin.nome_empresa}</h2>
                <p className="text-sm font-medium text-gray-500 mb-8">Bem-vindo de volta, <span className="font-bold text-gray-800">{lastLogin.nome_usuario}</span></p>

                {erro && (
                  <div className="w-full p-3 bg-red-50 border border-red-100 rounded-xl mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-red-600 font-medium text-left leading-tight">{erro}</p>
                  </div>
                )}

                <button onClick={loginComContaSalva} disabled={loadingLogin} className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-purple-500/25 text-sm font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]">
                  {loadingLogin ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Autenticando...</span>
                  ) : (
                    <span className="flex items-center gap-2">Acessar Painel <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></span>
                  )}
                </button>
              </div>

              <button onClick={() => setMostrarFormPadrao(true)} className="mt-8 text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> Entrar com outra conta
              </button>
            </div>

          ) : (
            
             // ==========================================
             // PASSO 1: FORMULÁRIO PADRÃO
             // ==========================================
            <div className="mt-8 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-gray-800">Acesso ao Sistema</h2>
              <p className="mt-1 text-sm text-gray-500 mb-8">Insira suas credenciais para continuar.</p>
              
              <form className="space-y-6" onSubmit={fazerLogin}>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">E-mail Corporativo</label>
                    <input id="email" type="email" placeholder="seu@restaurante.com.br" className="mt-1 block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all font-medium text-gray-800" value={credenciais.email} onChange={e => setCredenciais({...credenciais, email: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                    <input id="senha" type="password" placeholder="••••••••" className="mt-1 block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all font-medium text-gray-800" value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})} />
                  </div>
                </div>

                {erro && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-red-700 font-medium">{erro}</p>
                  </div>
                )}

                <button type="submit" disabled={loadingLogin} className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-purple-500/25 text-sm font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]">
                  {loadingLogin ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Autenticando...</span>
                  ) : 'Entrar no Painel'}
                </button>
                
                {lastLogin && (
                   <div className="text-center pt-4">
                     <button type="button" onClick={() => setMostrarFormPadrao(false)} className="text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 w-full">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Voltar para {lastLogin.nome_usuario}
                     </button>
                   </div>
                )}
              </form>
            </div>
          )}
          
          <div className="pt-8 mt-8 border-t border-gray-100">
            <p className="text-xs text-center font-semibold text-gray-400">© {new Date().getFullYear()} Comandas Bom a Bessa. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}