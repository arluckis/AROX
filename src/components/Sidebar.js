'use client';

export default function Sidebar({
  menuMobileAberto, setMenuMobileAberto, temaNoturno, logoEmpresa,
  sessao, nomeEmpresa, abaAtiva, setAbaAtiva, setMostrarConfigEmpresa,
  setMostrarAdminUsuarios, setMostrarAdminProdutos, setMostrarConfigTags,
  fazerLogout
}) {
  if (!menuMobileAberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex xl:hidden">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMenuMobileAberto(false)}></div>
      
      <div className={`relative w-[80%] max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
         
         <div className={`p-6 border-b flex flex-col ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <img src={logoEmpresa} alt="Logo" className={`w-14 h-14 rounded-full border-4 shadow-sm object-cover ${temaNoturno ? 'border-gray-700 bg-gray-800' : 'border-purple-100 bg-purple-50'}`} onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
              <button onClick={() => setMenuMobileAberto(false)} className={`p-2 rounded-full transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>✕</button>
            </div>
            <h3 className={`font-black text-xl leading-tight truncate ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{sessao.nome_usuario}</h3>
            <p className={`text-xs font-bold uppercase tracking-widest mt-1 truncate ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>{nomeEmpresa}</p>
         </div>

         <div className="flex-1 overflow-y-auto py-6">
            <p className={`px-6 text-[10px] font-bold uppercase tracking-widest mb-3 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Navegação</p>
            <nav className="flex flex-col gap-1 px-4">
              <button onClick={() => { setAbaAtiva('comandas'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'comandas' ? (temaNoturno ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600')}`}>
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Comandas em Aberto
              </button>
              <button onClick={() => { setAbaAtiva('fechadas'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'fechadas' ? (temaNoturno ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600')}`}>
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Comandas Encerradas
              </button>
              {(sessao.role === 'dono' || sessao.perm_faturamento) && <button onClick={() => { setAbaAtiva('faturamento'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'faturamento' ? (temaNoturno ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600')}`}>
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Faturamento
              </button>}
              {/* NOVO BOTÃO DE CAIXA */}
<button onClick={() => { setAbaAtiva('caixa'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'caixa' ? (temaNoturno ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600')}`}>
  <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
  </svg> 
  Fechamento de Caixa
</button>
              {(sessao.role === 'dono' || sessao.perm_estudo) && <button onClick={() => { setAbaAtiva('analises'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'analises' ? (temaNoturno ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600')}`}>
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg> Público-Alvo
              </button>}
            </nav>

            <p className={`px-6 text-[10px] font-bold uppercase tracking-widest mb-3 mt-8 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Administração</p>
            <nav className="flex flex-col gap-1 px-4">
              {sessao.role === 'dono' && <button onClick={() => { setMostrarConfigEmpresa(true); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600'}`}>
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Configurações da Loja
              </button>}
              {sessao.role === 'dono' && <button onClick={() => { setMostrarAdminUsuarios(true); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600'}`}>
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Gerenciar Equipe
              </button>}
              {(sessao.role === 'dono' || sessao.perm_cardapio) && <button onClick={() => { setMostrarAdminProdutos(true); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600'}`}>
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg> Gerenciar Cardápio
              </button>}
              
              {sessao.role === 'dono' && <button onClick={() => { setMostrarConfigTags(true); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600'}`}>
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> Configurar Tags
              </button>}
              {sessao.role === 'dono' && (
            <button onClick={() => { setMostrarAdminDelivery(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>Delivery 
             </button>
                )}
            </nav>
         </div>

         <div className={`p-4 border-t ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
           <button onClick={fazerLogout} className={`w-full text-center font-bold p-3 rounded-xl transition flex justify-center items-center gap-2 ${temaNoturno ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}>
             <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> Sair do Sistema
           </button>
         </div>
      </div>
    </div>
  );
}