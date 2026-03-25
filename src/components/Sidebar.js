// src/components/Sidebar.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Sidebar({
  menuMobileAberto, setMenuMobileAberto, temaNoturno, setTemaNoturno, logoEmpresa,
  sessao, nomeEmpresa, abaAtiva, setAbaAtiva, setMostrarConfigEmpresa,
  setMostrarAdminProdutos, setMostrarConfigTags, setMostrarAdminDelivery,
  fazerLogout
}) {
  const [planoEmpresa, setPlanoEmpresa] = useState('Starter');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const buscarPlano = async () => {
      if (sessao?.empresa_id) {
        const { data, error } = await supabase.from('empresas').select('plano').eq('id', sessao.empresa_id).single();
        if (!error && data?.plano) setPlanoEmpresa(data.plano);
      }
    };
    buscarPlano();
  }, [sessao?.empresa_id]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1280) setMenuMobileAberto(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMenuMobileAberto]);

  // Ícones UI Premium
  const iconeComandas = <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>;
  const iconeEncerradas = <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>;
  const iconeFaturamento = <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>;
  const iconeCaixa = <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  const iconeClientes = <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
  const iconeCardapio = <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>;
  const iconeDelivery = <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>;
  const iconeTags = <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>;
  
  const iconeConfig = <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const iconeTemaClaro = <svg className="w-[16px] h-[16px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
  const iconeTemaEscuro = <svg className="w-[16px] h-[16px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
  const iconeLogout = <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
  
  const iconeCollapse = <svg className="w-[16px] h-[16px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>;
  const iconeExpand = <svg className="w-[16px] h-[16px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>;

  // CRÍTICO: Definimos as larguras exatas e usamos overflow-hidden para evitar quebras
  const widthClass = isSidebarCollapsed ? 'xl:w-[80px] w-[260px]' : 'w-[260px]';

  const MenuItem = ({ id, titulo, icone, onClick, isAtivo }) => (
    <button 
      onClick={onClick} 
      title={isSidebarCollapsed ? titulo : ''}
      className={`relative w-full rounded-md font-medium transition-all duration-200 flex items-center outline-none group overflow-hidden ${
        isSidebarCollapsed ? 'h-[40px] justify-center px-0' : 'py-2 px-3 gap-3 text-[13px]'
      } ${
        isAtivo 
          ? (temaNoturno ? 'text-white bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-zinc-900 bg-black/[0.04] shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]') 
          : (temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.03]')
      }`}
    >
      <span className={`shrink-0 transition-transform duration-300 ${isAtivo ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
        {icone}
      </span>
      {!isSidebarCollapsed && <span className="truncate whitespace-nowrap min-w-0 tracking-tight">{titulo}</span>}
      
      {isAtivo && isSidebarCollapsed && (
        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] rounded-r-full ${temaNoturno ? 'bg-white' : 'bg-zinc-900'}`}></span>
      )}
    </button>
  );

  return (
    <>
      <div className={`fixed inset-0 z-[100] xl:hidden bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuMobileAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMenuMobileAberto(false)}></div>
      
      <aside className={`fixed xl:static top-0 left-0 h-full shrink-0 z-[101] flex flex-col transition-[width,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-r ${widthClass} ${menuMobileAberto ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'} ${temaNoturno ? 'bg-[#0A0A0A] border-white/[0.06]' : 'bg-[#FAFAFA] border-black/[0.06]'}`}>
         
         {/* BRAND HEADER */}
         <div className={`h-[64px] px-5 flex items-center shrink-0 relative transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'justify-center xl:px-0' : 'justify-between'}`}>
            <div className={`flex items-center shrink-0 overflow-hidden ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>
              {/* Branding elegante e minimalista: apenas escondemos o texto no desktop quando recolhido */}
              {!isSidebarCollapsed && (
                <span className="hidden xl:block font-black tracking-tighter text-[26px] leading-none whitespace-nowrap">AROX</span>
              )}
              {/* Para Mobile (sempre expandido na visão dele) */}
              <span className="xl:hidden font-black tracking-tighter text-[26px] leading-none whitespace-nowrap">AROX</span>
            </div>

            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className={`hidden xl:flex shrink-0 items-center justify-center w-7 h-7 rounded-md transition-colors duration-200 outline-none ${temaNoturno ? 'text-zinc-500 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-black/5'}`}
            >
              {isSidebarCollapsed ? iconeExpand : iconeCollapse}
            </button>
         </div>

         {/* MENUS NAV */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-6">
            
            <div className="flex flex-col gap-[2px]">
              {!isSidebarCollapsed && <p className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5 whitespace-nowrap ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Operação</p>}
              {isSidebarCollapsed && <div className="h-px w-6 mx-auto bg-current opacity-10 mb-2 mt-1"></div>}
              
              <MenuItem id="comandas" titulo="Terminal" icone={iconeComandas} isAtivo={abaAtiva === 'comandas'} onClick={() => { setAbaAtiva('comandas'); setMenuMobileAberto(false); }} />
              <MenuItem id="fechadas" titulo="Histórico" icone={iconeEncerradas} isAtivo={abaAtiva === 'fechadas'} onClick={() => { setAbaAtiva('fechadas'); setMenuMobileAberto(false); }} />
              {(sessao?.role === 'dono' || sessao?.perm_faturamento) && (
                <MenuItem id="faturamento" titulo="Métricas" icone={iconeFaturamento} isAtivo={abaAtiva === 'faturamento'} onClick={() => { setAbaAtiva('faturamento'); setMenuMobileAberto(false); }} />
              )}
            </div>

            <div className="flex flex-col gap-[2px]">
              {!isSidebarCollapsed && <p className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5 whitespace-nowrap ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Gestão</p>}
              {isSidebarCollapsed && <div className="h-px w-6 mx-auto bg-current opacity-10 mb-2 mt-1"></div>}

              <MenuItem id="caixa" titulo="Caixa" icone={iconeCaixa} isAtivo={abaAtiva === 'caixa'} onClick={() => { setAbaAtiva('caixa'); setMenuMobileAberto(false); }} />
              {(sessao?.role === 'dono' || sessao?.perm_fidelidade || sessao?.perm_estudo) && (
                <MenuItem id="fidelidade" titulo="Clientes" icone={iconeClientes} isAtivo={abaAtiva === 'fidelidade'} onClick={() => { setAbaAtiva('fidelidade'); setMenuMobileAberto(false); }} />
              )}
            </div>

            <div className="flex flex-col gap-[2px]">
              {!isSidebarCollapsed && <p className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5 whitespace-nowrap ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Sistema</p>}
              {isSidebarCollapsed && <div className="h-px w-6 mx-auto bg-current opacity-10 mb-2 mt-1"></div>}

              {(sessao?.role === 'dono' || sessao?.perm_cardapio) && (
                <MenuItem titulo="Catálogo" icone={iconeCardapio} onClick={() => { setMostrarAdminProdutos(true); setMenuMobileAberto(false); }} />
              )}
              {sessao?.role === 'dono' && (
                <MenuItem titulo="Delivery" icone={iconeDelivery} onClick={() => { setMostrarAdminDelivery(true); setMenuMobileAberto(false); }} />
              )}
              {sessao?.role === 'dono' && (
                <MenuItem titulo="Tags" icone={iconeTags} onClick={() => { setMostrarConfigTags(true); setMenuMobileAberto(false); }} />
              )}
            </div>
         </div>

         {/* ACCOUNT DOCK (SEMPRE ABERTO E FIXO NA BASE) */}
         <div className={`mt-auto border-t shrink-0 overflow-hidden transition-colors duration-300 ${temaNoturno ? 'border-white/[0.06] bg-[#0A0A0A]' : 'border-black/[0.06] bg-[#FAFAFA]'}`}>
            
            {/* Bloco de Identificação Premium */}
            <div className={`p-4 flex flex-col gap-4 ${isSidebarCollapsed ? 'items-center' : ''}`}>
               
               <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                 {/* Avatar com Status Dot Elegante */}
                 <div className="relative shrink-0">
                   <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border shadow-sm ${temaNoturno ? 'border-white/10 bg-[#141414]' : 'border-black/5 bg-white'}`}>
                     <img src={logoEmpresa || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover" />
                   </div>
                   {/* Ponto de Conta Ativa (Luxo Discreto - Esmeralda) */}
                   <span className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ${temaNoturno ? 'ring-[#0A0A0A]' : 'ring-[#FAFAFA]'}`}></span>
                 </div>

                 {!isSidebarCollapsed && (
                   <div className="flex flex-col min-w-0 flex-1 justify-center">
                      <span className={`text-[13px] font-semibold truncate leading-tight tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {sessao?.nome_usuario || 'Usuário'}
                      </span>
                      <span className={`text-[11px] font-medium truncate mt-0.5 tracking-wide ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        {nomeEmpresa || 'Estabelecimento'}
                      </span>
                   </div>
                 )}
               </div>

               {/* Badge de Plano Elegante (Separado mas próximo, estilo Vercel) */}
               {!isSidebarCollapsed && (
                 <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
                   temaNoturno
                     ? 'bg-white/[0.02] border-white/[0.05] text-zinc-400'
                     : 'bg-black/[0.02] border-black/[0.05] text-zinc-500'
                 }`}>
                   <span>Plano</span>
                   <span className={temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}>
                     {(!planoEmpresa || ['free', 'grátis', 'starter'].includes(planoEmpresa.toLowerCase()))
                       ? 'Beta Tester'
                       : `${planoEmpresa} Premium`}
                   </span>
                 </div>
               )}

            </div>

            {/* AÇÕES INFERIORES PREMIUM */}
            <div className={`px-3 pb-4 flex flex-col gap-0.5 ${isSidebarCollapsed ? 'items-center' : ''}`}>
               
               {/* 1. Botão Configurações */}
               {sessao?.role === 'dono' && (
                 <button 
                    onClick={() => { setMostrarConfigEmpresa(true); setMenuMobileAberto(false); }} 
                    title={isSidebarCollapsed ? "Ajustes do Workspace" : ""}
                    className={`flex items-center w-full rounded-md font-medium transition-all duration-200 outline-none select-none group ${isSidebarCollapsed ? 'h-9 w-9 justify-center' : 'px-2.5 py-2 gap-2.5 text-[12px]'} ${temaNoturno ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.04]'}`}
                 >
                   <span className="shrink-0 transition-transform group-active:scale-95">{iconeConfig}</span>
                   {!isSidebarCollapsed && <span className="truncate tracking-tight">Ajustes do Workspace</span>}
                 </button>
               )}
               
               {/* 2. Botão Modo Claro / Escuro (LÓGICA CORRIGIDA E VISUAL PREMIUM) */}
               <button 
                  onClick={() => setTemaNoturno(!temaNoturno)} 
                  title={isSidebarCollapsed ? (temaNoturno ? 'Modo Claro' : 'Modo Escuro') : ""}
                  className={`flex items-center w-full rounded-md font-medium transition-all duration-200 outline-none select-none group ${isSidebarCollapsed ? 'h-9 w-9 justify-center' : 'px-2.5 py-2 gap-2.5 text-[12px]'} ${temaNoturno ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.04]'}`}
               >
                 <span className="shrink-0 transition-transform group-active:scale-95">
                   {temaNoturno ? (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                     </svg>
                   ) : (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                     </svg>
                   )}
                 </span>
                 {!isSidebarCollapsed && <span className="truncate tracking-tight">{temaNoturno ? 'Modo Claro' : 'Modo Escuro'}</span>}
               </button>
               
               {/* 3. Botão Encerrar Sessão */}
               <button 
                  onClick={fazerLogout} 
                  title={isSidebarCollapsed ? "Encerrar Sessão" : ""}
                  className={`flex items-center w-full rounded-md font-medium transition-all duration-200 outline-none select-none group mt-1 ${isSidebarCollapsed ? 'h-9 w-9 justify-center' : 'px-2.5 py-2 gap-2.5 text-[12px]'} ${temaNoturno ? 'text-zinc-500 hover:text-red-400 hover:bg-red-400/10' : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'}`}
               >
                 <span className="shrink-0 transition-transform group-active:scale-95">{iconeLogout}</span>
                 {!isSidebarCollapsed && <span className="truncate tracking-tight">Encerrar Sessão</span>}
               </button>

            </div>
         </div>
      </aside>
    </>
  );
}