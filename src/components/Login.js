'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login({ getHoje, setSessao }) {
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [erro, setErro] = useState('');

  const fazerLogin = async (e) => {
    e.preventDefault(); 
    setErro('');

    if (!credenciais.email || !credenciais.senha) {
      setErro("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setLoadingLogin(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', credenciais.email.trim())
      .eq('senha', credenciais.senha)
      .single();

    if (data && !error) { 
      const sessionObj = { ...data, data: getHoje() };
      setSessao(sessionObj);
      localStorage.setItem('bessa_session', JSON.stringify(sessionObj));

      // --- INÍCIO DO REGISTRO INVISÍVEL DE LOG ---
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
        } catch (err) {
          console.log("Erro silencioso no log", err);
        }
      })();
      // --- FIM DO REGISTRO DE LOG ---

    } else { 
      setErro("E-mail ou senha incorretos. Tente novamente."); 
    }
    setLoadingLogin(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* LADO ESQUERDO: Arte Abstrata Moderna em CSS (SaaS Premium) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B0F19] overflow-hidden justify-center items-center">
        
        {/* Marca no topo esquerdo da arte com Ícone SVG */}
        <div className="absolute top-8 left-10 flex items-center gap-3 z-20">
          <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-purple-300">
              <path d="M3 18h18" />
              <path d="M5 14c0-3.87 3.13-7 7-7s7 3.13 7 7" />
              <path d="M12 7V4" />
              <path d="M10 4h4" />
            </svg>
          </div>
          <span className="text-white/80 font-black tracking-widest text-sm uppercase">Comandas Bom a Bessa</span>
        </div>

        {/* Fundo com Gradiente Profundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-indigo-950/40 to-purple-900/20"></div>

        {/* Grid Sutil (Efeito de malha digital) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Orbes de Luz (Glow Effects para volume) */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[150px] mix-blend-screen pointer-events-none"></div>

        {/* Card Promocional com Glassmorphism (Vidro) */}
        <div className="relative z-10 w-full max-w-lg p-10 mx-16 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
          <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-white mb-4 leading-tight">
            O controle do seu negócio na palma da mão.
          </h3>
          <p className="text-indigo-100/70 text-lg leading-relaxed mb-8">
            Acompanhe o fluxo de comandas, gerencie sua equipe e tenha uma visão clara do seu faturamento em tempo real, com total segurança e performance.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">Tempo Real</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">Nuvem Segura</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </div>

      {/* LADO DIREITO: Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white shadow-2xl z-10">
        <div className="w-full max-w-md space-y-8">
          
          {/* Cabeçalho com o Logo em SVG */}
          <div className="text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
              
              {/* ÍCONE PRINCIPAL AQUI */}
              <div className="h-14 w-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                  <path d="M3 18h18" />
                  <path d="M5 14c0-3.87 3.13-7 7-7s7 3.13 7 7" />
                  <path d="M12 7V4" />
                  <path d="M10 4h4" />
                </svg>
              </div>

              <div className="flex flex-col justify-center pt-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Comandas Bom a Bessa
                </h1>
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest mt-0.5">
                  Painel de Gestão
                </p>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mt-8">
              Acesso ao Sistema
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Insira suas credenciais para continuar.
            </p>
          </div>

          {/* Formulário */}
          <form className="mt-8 space-y-6" onSubmit={fazerLogin}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                  E-mail Corporativo
                </label>
                <input 
                  id="email"
                  type="email" 
                  placeholder="seu@restaurante.com.br"
                  className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                  value={credenciais.email} 
                  onChange={e => setCredenciais({...credenciais, email: e.target.value})} 
                />
              </div>
              
              <div>
                <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 mb-1">
                  Senha
                </label>
                <input 
                  id="senha"
                  type="password" 
                  placeholder="••••••••"
                  className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                  value={credenciais.senha} 
                  onChange={e => setCredenciais({...credenciais, senha: e.target.value})} 
                />
              </div>
            </div>

            {/* Notificação de Erro Elegante */}
            {erro && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600 font-medium text-center">{erro}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loadingLogin} 
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loadingLogin ? 'Autenticando...' : 'Entrar no Painel'}
            </button>
          </form>
          
          <div className="pt-8 mt-8 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              © {new Date().getFullYear()} Comandas Bom a Bessa.<br/>Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}