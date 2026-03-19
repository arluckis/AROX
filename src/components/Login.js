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
      
      {/* LADO ESQUERDO: Imagem de Fundo (Escondida em celular, visível em telas grandes) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gray-900">
        {/* === ONDE ALTERAR A FOTO DO SISTEMA === */}
        <img 
          className="absolute inset-0 h-full w-full object-cover opacity-80" 
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
          alt="Sistema em uso no restaurante" 
        />
        
        {/* Filtro por cima da foto para dar um tom profissional e destacar o texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-transparent to-transparent opacity-80"></div>
        
        {/* Texto promocional por cima da foto */}
        <div className="absolute bottom-0 left-0 right-0 p-16 text-white">
          <h3 className="text-3xl font-bold mb-3">Gestão inteligente e rápida</h3>
          <p className="text-purple-100 text-lg max-w-lg">
            Acompanhe o fluxo de comandas, gerencie sua equipe e tenha o controle total do seu faturamento em tempo real.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: Formulário (metade da tela em PCs, tela toda em celular) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white shadow-2xl z-10">
        <div className="w-full max-w-md space-y-8">
          
          {/* Cabeçalho */}
          <div className="text-center sm:text-left">
            {/* ONDE ALTERAR O LOGO */}
            <div className="h-14 w-14 bg-purple-600 rounded-xl flex items-center justify-center mx-auto sm:mx-0 mb-6 shadow-lg">
                <span className="text-white font-black text-2xl">CB</span>
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Acesso ao Sistema
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Gerencie seus pedidos, mesas e faturamento.
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
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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