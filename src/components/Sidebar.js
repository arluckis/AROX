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

  const iconeComandas = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>;
  const iconeEncerradas = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>;
  const iconeFaturamento = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>;
  const iconeCaixa = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  const iconeClientes = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
  const iconeCardapio = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>;
  const iconeDelivery = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>;
  const iconeTags = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>;
  const iconeConfig = <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const iconeLogout = <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

  const MenuItem = ({ id, titulo, icone, onClick, isAtivo }) => (
    <button 
      onClick={onClick} 
      className={`relative w-full rounded-[10px] xl:rounded-lg font-medium transition-colors duration-200 flex items-center outline-none group overflow-hidden 
        py-3 px-3.5 gap-3.5 text-[14px] xl:py-2.5 xl:px-3 xl:gap-3 xl:text-[13px]
        ${isAtivo 
          ? (temaNoturno ? 'text-white bg-white/[0.08]' : 'text-zinc-900 bg-black/[0.04]') 
          : (temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.03]')
      }`}
    >
      <span className={`shrink-0 transition-transform duration-300 w-[20px] h-[20px] xl:w-[18px] xl:h-[18px] flex items-center justify-center ${isAtivo ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
        {icone}
      </span>
      <span className={`truncate whitespace-nowrap min-w-0 tracking-tight block
        xl:opacity-0 xl:w-0 group-hover/sidebar:xl:w-auto group-hover/sidebar:xl:opacity-100 xl:transition-opacity xl:duration-200 xl:delay-75
      `}>
        {titulo}
      </span>
      
      {isAtivo && (
        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-r-full ${temaNoturno ? 'bg-white' : 'bg-zinc-900'}`}></span>
      )}
    </button>
  );

  return (
    <>
      {/* Overlay do Mobile */}
      <div 
        className={`fixed inset-0 z-[100] xl:hidden bg-black/50 backdrop-blur-sm transition-opacity duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuMobileAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setMenuMobileAberto(false)}
      />
      
      {/* Container invisível reservando espaço estrito no layout Desktop */}
      <div className="hidden xl:block shrink-0 w-[72px]" />

      {/* Sidebar Real */}
      <aside className={`group/sidebar fixed top-0 left-0 h-full flex flex-col z-[101] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden
        ${menuMobileAberto ? 'translate-x-0 shadow-2xl' : '-translate-x-full xl:translate-x-0'}
        w-[80vw] max-w-[280px] 
        xl:w-[72px] hover:xl:w-[260px] xl:border-r hover:xl:shadow-2xl
        ${temaNoturno ? 'bg-[#09090B] border-white/[0.06]' : 'bg-[#FAFAFA] border-black/[0.06]'}
      `}>
         
         <div className={`h-[68px] xl:h-[68px] px-5 flex items-center shrink-0 justify-between
           xl:justify-center group-hover/sidebar:xl:justify-start
         `}>
            <div className={`flex items-center shrink-0 overflow-hidden ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>
              <span className={`font-black tracking-tighter text-[24px] xl:text-[20px] leading-none whitespace-nowrap ml-3
                xl:opacity-0 xl:w-0 group-hover/sidebar:xl:w-auto group-hover/sidebar:xl:opacity-100 transition-opacity duration-200 delay-75
              `}>AROX</span>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 xl:px-3 py-4 [&::-webkit-scrollbar]:hidden flex flex-col gap-6 xl:gap-5">
            
            <div className="flex flex-col gap-1">
              <p className={`px-2 xl:px-3 text-[10px] font-bold uppercase tracking-widest mb-1 whitespace-nowrap 
                ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}
                xl:opacity-0 xl:h-0 group-hover/sidebar:xl:h-auto group-hover/sidebar:xl:opacity-100 transition-all duration-200
              `}>Operação</p>
              <div className="hidden xl:block h-px w-5 mx-auto bg-current opacity-10 mb-1.5 mt-0.5 group-hover/sidebar:xl:hidden transition-opacity"></div>
              
              <MenuItem id="comandas" titulo="Terminal" icone={iconeComandas} isAtivo={abaAtiva === 'comandas'} onClick={() => { setAbaAtiva('comandas'); setMenuMobileAberto(false); }} />
              <MenuItem id="fechadas" titulo="Histórico" icone={iconeEncerradas} isAtivo={abaAtiva === 'fechadas'} onClick={() => { setAbaAtiva('fechadas'); setMenuMobileAberto(false); }} />
              {(sessao?.role === 'dono' || sessao?.perm_faturamento) && (
                <MenuItem id="faturamento" titulo="Métricas" icone={iconeFaturamento} isAtivo={abaAtiva === 'faturamento'} onClick={() => { setAbaAtiva('faturamento'); setMenuMobileAberto(false); }} />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p className={`px-2 xl:px-3 text-[10px] font-bold uppercase tracking-widest mb-1 whitespace-nowrap 
                ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}
                xl:opacity-0 xl:h-0 group-hover/sidebar:xl:h-auto group-hover/sidebar:xl:opacity-100 transition-all duration-200
              `}>Gestão</p>
              <div className="hidden xl:block h-px w-5 mx-auto bg-current opacity-10 mb-1.5 mt-0.5 group-hover/sidebar:xl:hidden transition-opacity"></div>

              <MenuItem id="caixa" titulo="Caixa Central" icone={iconeCaixa} isAtivo={abaAtiva === 'caixa'} onClick={() => { setAbaAtiva('caixa'); setMenuMobileAberto(false); }} />
              {(sessao?.role === 'dono' || sessao?.perm_fidelidade || sessao?.perm_estudo) && (
                <MenuItem id="fidelidade" titulo="Clientes" icone={iconeClientes} isAtivo={abaAtiva === 'fidelidade'} onClick={() => { setAbaAtiva('fidelidade'); setMenuMobileAberto(false); }} />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p className={`px-2 xl:px-3 text-[10px] font-bold uppercase tracking-widest mb-1 whitespace-nowrap 
                ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}
                xl:opacity-0 xl:h-0 group-hover/sidebar:xl:h-auto group-hover/sidebar:xl:opacity-100 transition-all duration-200
              `}>Sistema</p>
              <div className="hidden xl:block h-px w-5 mx-auto bg-current opacity-10 mb-1.5 mt-0.5 group-hover/sidebar:xl:hidden transition-opacity"></div>

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

         {/* Bloco Inferior */}
         <div className={`mt-auto shrink-0 overflow-hidden transition-colors duration-300 pb-4 xl:pb-3 ${temaNoturno ? 'bg-[#09090B]' : 'bg-[#FAFAFA]'}`}>
            
            <div className="px-4 xl:px-3 pt-3 flex flex-col gap-1">
               <div className={`flex items-center px-3 py-2.5 rounded-[10px] xl:rounded-lg mb-2 xl:justify-center group-hover/sidebar:xl:justify-start ${temaNoturno ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-black/[0.02] border border-black/[0.05]'}`}>
                 <div className="relative shrink-0 flex items-center justify-center w-[20px] h-[20px] xl:w-[18px] xl:h-[18px]">
                   <img src={logoEmpresa || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover rounded-full" />
                   <span className={`absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ${temaNoturno ? 'ring-[#09090B]' : 'ring-[#FAFAFA]'}`}></span>
                 </div>
                 <div className={`flex flex-col min-w-0 ml-3 xl:opacity-0 xl:w-0 group-hover/sidebar:xl:w-auto group-hover/sidebar:xl:opacity-100 transition-opacity duration-200 delay-75`}>
                    <span className={`text-[12px] font-semibold truncate leading-none tracking-tight ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      {nomeEmpresa || 'Estabelecimento'}
                    </span>
                    <span className={`text-[10px] flex items-center gap-1.5 font-medium truncate mt-1 tracking-wide ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {sessao?.nome_usuario || 'Usuário'}
                      <span className={`px-1 rounded-[3px] text-[8px] uppercase tracking-wider font-bold ${temaNoturno ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                         {(!planoEmpresa || ['free', 'grátis', 'starter'].includes(planoEmpresa.toLowerCase())) ? 'BETA' : 'PRO'}
                      </span>
                    </span>
                 </div>
               </div>

               {sessao?.role === 'dono' && (
                 <MenuItem titulo="Configurações Locais" icone={iconeConfig} onClick={() => { setMostrarConfigEmpresa(true); setMenuMobileAberto(false); }} />
               )}
               <MenuItem titulo={temaNoturno ? 'Modo Claro' : 'Modo Escuro'} icone={
                 temaNoturno ? (
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                 ) : (
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                 )
               } onClick={() => setTemaNoturno(!temaNoturno)} />
               
               <button 
                  onClick={fazerLogout} 
                  className={`relative w-full rounded-[10px] xl:rounded-lg font-medium transition-colors duration-200 flex items-center outline-none group overflow-hidden mt-1
                    py-3 px-3.5 gap-3.5 text-[14px] xl:py-2.5 xl:px-3 xl:gap-3 xl:text-[13px]
                    ${temaNoturno ? 'text-zinc-500 hover:text-red-400 hover:bg-red-400/10' : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'}
                  `}
               >
                 <span className="shrink-0 transition-transform duration-300 w-[20px] h-[20px] xl:w-[18px] xl:h-[18px] opacity-70 group-hover:opacity-100 flex items-center justify-center">{iconeLogout}</span>
                 <span className={`truncate whitespace-nowrap min-w-0 tracking-tight block
                    xl:opacity-0 xl:w-0 group-hover/sidebar:xl:w-auto group-hover/sidebar:xl:opacity-100 xl:transition-opacity xl:duration-200 xl:delay-75
                 `}>Sair da Plataforma</span>
               </button>

            </div>
         </div>
      </aside>
    </>
  );
}