'use client';
import { useEffect } from 'react';

export default function AdminSidebar({
  menuMobileAberto, setMenuMobileAberto, temaNoturno, setTemaNoturno,
  abaAtiva, setAbaAtiva, fazerLogout, sessaoAdmin
}) {

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1280) setMenuMobileAberto(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMenuMobileAberto]);

  const iconeDashboard = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>;
  const iconeWorkspaces = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>;
  const iconeAuditoria = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  const iconeNovo = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>;
  const iconeBugs = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 10a2 2 0 00-2 2m4 0a2 2 0 00-2-2m0 0V6m0 4v4m-5.657 1.657l1.414-1.414m8.486 0l1.414 1.414M4 12h2m12 0h2m-6.657 4.657l-1.414-1.414m-2.828 0L7.757 15.243M12 21v-2"></path></svg>;
  const iconeLogout = <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

  const MenuItem = ({ id, titulo, icone, onClick, isAtivo }) => (
    <button onClick={onClick} className={`relative w-full rounded-[10px] xl:rounded-lg font-medium transition-colors duration-200 flex items-center outline-none group overflow-hidden py-3 px-3.5 gap-3.5 text-[14px] xl:py-2.5 xl:px-3 xl:gap-3 xl:text-[13px] ${isAtivo ? (temaNoturno ? 'text-white bg-white/[0.08]' : 'text-zinc-900 bg-black/[0.04]') : (temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.03]')}`}>
      <span className={`shrink-0 transition-transform duration-300 w-[20px] h-[20px] xl:w-[18px] xl:h-[18px] flex items-center justify-center ${isAtivo ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{icone}</span>
      <span className={`truncate whitespace-nowrap min-w-0 tracking-tight block xl:opacity-0 xl:w-0 group-hover/sidebar:xl:w-auto group-hover/sidebar:xl:opacity-100 xl:transition-opacity xl:duration-200 xl:delay-75`}>{titulo}</span>
      {isAtivo && <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-r-full ${temaNoturno ? 'bg-white' : 'bg-zinc-900'}`}></span>}
    </button>
  );

  return (
    <>
      <div className={`fixed inset-0 z-[100] xl:hidden bg-black/50 backdrop-blur-sm transition-opacity duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuMobileAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMenuMobileAberto(false)} />
      <div className="hidden xl:block shrink-0 w-[72px]" />

      <aside className={`group/sidebar fixed top-0 left-0 h-full flex flex-col z-[101] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${menuMobileAberto ? 'translate-x-0 shadow-2xl' : '-translate-x-full xl:translate-x-0'} w-[80vw] max-w-[280px] xl:w-[72px] hover:xl:w-[260px] xl:border-r hover:xl:shadow-2xl ${temaNoturno ? 'bg-[#0A0A0A] border-white/[0.06]' : 'bg-[#FAFAFA] border-black/[0.06]'}`}>
         
         <div className={`h-[72px] xl:h-[64px] px-5 flex items-center shrink-0 justify-between xl:justify-center group-hover/sidebar:xl:justify-start`}>
            <div className={`flex items-center shrink-0 overflow-hidden ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 dark:bg-white shadow-md flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white dark:text-black"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </div>
              <span className={`font-black tracking-tighter text-[20px] leading-none whitespace-nowrap ml-3 xl:opacity-0 xl:w-0 group-hover/sidebar:xl:w-auto group-hover/sidebar:xl:opacity-100 transition-opacity duration-200 delay-75`}>AROX Admin</span>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 xl:px-3 py-4 [&::-webkit-scrollbar]:hidden flex flex-col gap-6 xl:gap-5">
            <div className="flex flex-col gap-1">
              <p className={`px-2 xl:px-3 text-[10px] font-bold uppercase tracking-widest mb-1 whitespace-nowrap ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'} xl:opacity-0 xl:h-0 group-hover/sidebar:xl:h-auto group-hover/sidebar:xl:opacity-100 transition-all duration-200`}>Telemetria</p>
              <div className="hidden xl:block h-px w-5 mx-auto bg-current opacity-10 mb-1.5 mt-0.5 group-hover/sidebar:xl:hidden transition-opacity"></div>
              <MenuItem id="dashboard" titulo="Dashboard" icone={iconeDashboard} isAtivo={abaAtiva === 'dashboard'} onClick={() => { setAbaAtiva('dashboard'); setMenuMobileAberto(false); }} />
              <MenuItem id="auditoria" titulo="Acessos & Logs" icone={iconeAuditoria} isAtivo={abaAtiva === 'auditoria'} onClick={() => { setAbaAtiva('auditoria'); setMenuMobileAberto(false); }} />
              <MenuItem id="erros" titulo="Central de Bugs" icone={iconeBugs} isAtivo={abaAtiva === 'erros'} onClick={() => { setAbaAtiva('erros'); setMenuMobileAberto(false); }} />
            </div>

            <div className="flex flex-col gap-1">
              <p className={`px-2 xl:px-3 text-[10px] font-bold uppercase tracking-widest mb-1 whitespace-nowrap ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'} xl:opacity-0 xl:h-0 group-hover/sidebar:xl:h-auto group-hover/sidebar:xl:opacity-100 transition-all duration-200`}>Tenancy</p>
              <div className="hidden xl:block h-px w-5 mx-auto bg-current opacity-10 mb-1.5 mt-0.5 group-hover/sidebar:xl:hidden transition-opacity"></div>
              <MenuItem id="clientes" titulo="Workspaces" icone={iconeWorkspaces} isAtivo={abaAtiva === 'clientes'} onClick={() => { setAbaAtiva('clientes'); setMenuMobileAberto(false); }} />
              <MenuItem id="novo" titulo="Novo Workspace" icone={iconeNovo} isAtivo={abaAtiva === 'novo'} onClick={() => { setAbaAtiva('novo'); setMenuMobileAberto(false); }} />
            </div>
         </div>

         <div className={`mt-auto shrink-0 overflow-hidden transition-colors duration-300 pb-4 xl:pb-3 ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
            <div className="px-4 xl:px-3 pt-3 flex flex-col gap-1">
               <div className={`flex items-center px-3 py-2.5 rounded-[10px] xl:rounded-lg mb-2 xl:justify-center group-hover/sidebar:xl:justify-start ${temaNoturno ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-black/[0.02] border border-black/[0.05]'}`}>
                 <div className="relative shrink-0 flex items-center justify-center w-[20px] h-[20px] xl:w-[18px] xl:h-[18px] bg-indigo-500 rounded-full text-white font-bold text-[10px]">
                    SA
                 </div>
                 <div className={`flex flex-col min-w-0 ml-3 xl:opacity-0 xl:w-0 group-hover/sidebar:xl:w-auto group-hover/sidebar:xl:opacity-100 transition-opacity duration-200 delay-75`}>
                    <span className={`text-[12px] font-semibold truncate leading-none tracking-tight ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>SuperUser</span>
                    <span className={`text-[10px] font-medium truncate mt-1 tracking-wide ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{sessaoAdmin?.email || 'admin@arox.com'}</span>
                 </div>
               </div>
               <MenuItem titulo={temaNoturno ? 'Modo Claro' : 'Modo Escuro'} icone={
                 temaNoturno ? <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
               } onClick={() => setTemaNoturno(!temaNoturno)} />
               
               <button onClick={fazerLogout} className={`relative w-full rounded-[10px] xl:rounded-lg font-medium transition-colors duration-200 flex items-center outline-none group overflow-hidden mt-1 py-3 px-3.5 gap-3.5 text-[14px] xl:py-2.5 xl:px-3 xl:gap-3 xl:text-[13px] ${temaNoturno ? 'text-zinc-500 hover:text-red-400 hover:bg-red-400/10' : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'}`}>
                 <span className="shrink-0 transition-transform duration-300 w-[20px] h-[20px] xl:w-[18px] xl:h-[18px] opacity-70 group-hover:opacity-100 flex items-center justify-center">{iconeLogout}</span>
                 <span className={`truncate whitespace-nowrap min-w-0 tracking-tight block xl:opacity-0 xl:w-0 group-hover/sidebar:xl:w-auto group-hover/sidebar:xl:opacity-100 xl:transition-opacity xl:duration-200 xl:delay-75`}>Sair do Painel</span>
               </button>
            </div>
         </div>
      </aside>
    </>
  );
}