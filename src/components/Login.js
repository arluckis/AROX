'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login({ getHoje, setSessao, temaNoturno, setTemaNoturno }) {
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);

  const fazerLogin = async () => {
    if (!credenciais.email || !credenciais.senha) return alert("Preencha e-mail e senha.");
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
      // Executa de forma silenciosa, sem atrasar a tela do usuário
      (async () => {
        try {
          // Busca o IP externo de quem está acessando
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          
          // Salva no Supabase
          await supabase.from('logs_acesso').insert([{
            usuario_id: data.id,
            empresa_id: data.empresa_id,
            email: data.email,
            ip: ipData.ip,
            navegador: navigator.userAgent // Pega detalhes de se é celular, Chrome, etc
          }]);
        } catch (err) {
          console.log("Erro silencioso no log", err);
        }
      })();
      // --- FIM DO REGISTRO DE LOG ---

    } else { 
      alert("Credenciais inválidas."); 
    }
    setLoadingLogin(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${temaNoturno ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`p-8 rounded-3xl shadow-2xl w-full max-w-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex justify-between items-center mb-6">
           <div className="w-8 h-8"></div>
           <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Logo" className={`w-20 h-20 rounded-full border-4 object-cover ${temaNoturno ? 'border-gray-700' : 'border-purple-50'}`} />
           <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-2 rounded-full transition ${temaNoturno ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-500'}`}>
             {temaNoturno ? '🌙' : '☀️'}
           </button>
        </div>
        <h2 className={`text-2xl font-black text-center mb-2 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Área Restrita</h2>
        <p className="text-center text-gray-400 text-sm mb-6">Autentique-se para continuar</p>
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="E-mail" 
            className={`w-full p-3 rounded-xl outline-none transition border ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'}`} 
            value={credenciais.email} 
            onChange={e => setCredenciais({...credenciais, email: e.target.value})} 
          />
          <input 
            type="password" 
            placeholder="Senha" 
            className={`w-full p-3 rounded-xl outline-none transition border ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'}`} 
            value={credenciais.senha} 
            onChange={e => setCredenciais({...credenciais, senha: e.target.value})} 
            onKeyDown={e => e.key === 'Enter' && fazerLogin()} 
          />
          <button 
            onClick={fazerLogin} 
            disabled={loadingLogin} 
            className="w-full bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition shadow-lg disabled:opacity-50"
          >
            {loadingLogin ? 'Autenticando...' : 'Acessar'}
          </button>
        </div>
      </div>
    </div>
  );
}