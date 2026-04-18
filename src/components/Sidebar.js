'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Sidebar({
  menuMobileAberto, setMenuMobileAberto, temaNoturno, setTemaNoturno, logoEmpresa,
  sessao, nomeEmpresa, abaAtiva, setAbaAtiva, setMostrarConfigEmpresa,
  fazerLogout, caixaAtual, statusPresenca
}) {
  const [planoEmpresa, setPlanoEmpresa] = useState('Starter');
  const [isExpanded, setIsExpanded] = useState(false);
  const [tabTravada, setTabTravada] = useState(false); 

  const isDark = temaNoturno;

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

  const fecharPainelEMudarAba = (novaAba) => {
    setAbaAtiva(novaAba);
    setMenuMobileAberto(false);
    document.getElementById('btn-voltar-header')?.click();
  };

  const handleHoverAba = (id) => { if (!tabTravada) setAbaAtiva(id); };
  const handleClickAba = (id) => { setTabTravada(true); fecharPainelEMudarAba(id); };

  // Ícones premium em 18px
  const iconeComandas = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>;
  const iconeEncerradas = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>;
  const iconeFaturamento = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>;
  const iconeCaixa = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  const iconeClientes = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
  const iconeConfig = <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const iconeLogout = <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

  const MenuItem = ({ id, titulo, icone, onClick, onHover, isAtivo, hoverable, danger }) => {
    const showText = isExpanded || menuMobileAberto;

    // Lógica visual de luxo por estado (Linear/Stripe inspired)
    const baseClasses = "relative w-full rounded-lg transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center outline-none overflow-hidden py-3 px-3 gap-3";
    
    let stateClasses = "";
    if (isAtivo) {
      stateClasses = isDark 
        ? "bg-white/[0.08] text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/[0.05]" 
        : "bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-zinc-200/50";
    } else {
      if (danger) {
        stateClasses = isDark ? "text-zinc-500 hover:text-rose-400 hover:bg-white/[0.03]" : "text-zinc-500 hover:text-rose-600 hover:bg-zinc-100/60";
      } else {
        stateClasses = isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/60";
      }
    }

    return (
      <div className="relative group w-full flex" onMouseEnter={() => { if (hoverable && onHover) onHover(); }}>
        <button 
          onClick={(e) => {
            if (hoverable) {
              const target = e.currentTarget;
              target.classList.add('scale-[0.97]');
              setTimeout(() => target && target.classList.remove('scale-[0.97]'), 150);
            }
            if(onClick) onClick(e);
          }} 
          className={`${baseClasses} ${stateClasses}`}
        >
          <span className={`shrink-0 transition-all duration-[220ms] flex items-center justify-center ${isAtivo ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'} ${danger && 'group-hover:text-rose-500'}`}>
            {icone}
          </span>
          <span className={`text-[14px] font-medium truncate whitespace-nowrap tracking-tight transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${showText ? 'w-auto opacity-100 ml-0.5' : 'w-0 opacity-0 ml-0'}`}>
            {titulo}
          </span>
          
          {/* Indicador premium sutil quando ativo */}
          {isAtivo && (
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.4)] ${isDark ? 'bg-zinc-200' : 'bg-zinc-900'}`}></span>
          )}
        </button>

        {/* Tooltip super-rápido e premium */}
        {!showText && hoverable && (
          <div className={`hidden xl:block absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 rounded-md text-[12px] font-semibold tracking-wide whitespace-nowrap pointer-events-none opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[200ms] ease-out z-[99999] shadow-xl border ${danger ? (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 backdrop-blur-md' : 'bg-rose-50 text-rose-600 border-rose-100') : (isDark ? 'bg-[#18181B] text-zinc-200 border-white/[0.08]' : 'bg-white text-zinc-800 border-zinc-200/60')}`}>
            {titulo}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay Mobile */}
      <div className={`fixed inset-0 z-[90] xl:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuMobileAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMenuMobileAberto(false)} />
      
      {/* Spacer Estrutural para o Layout Principal */}
      <div className={`hidden xl:block shrink-0 transition-[width] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'w-[288px]' : 'w-[80px]'}`} />

      {/* Sidebar Principal */}
      <aside className={`fixed top-0 left-0 h-full flex flex-col z-[100] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] 
        ${menuMobileAberto ? 'translate-x-0 shadow-2xl' : '-translate-x-full xl:translate-x-0'}
        w-[85vw] max-w-[288px] xl:w-[80px] ${isExpanded ? 'xl:w-[288px]' : 'xl:w-[80px]'} xl:border-r 
        backdrop-blur-[20px] 
        ${isDark ? 'bg-[#09090B]/95 border-white/[0.06]' : 'bg-[#FAFAFA]/95 border-zinc-200/60'}
        ${isExpanded || menuMobileAberto ? 'overflow-hidden' : 'overflow-visible'}
      `}>
         
         {/* Cabeçalho */}
         <div className="h-[72px] px-5 flex items-center justify-between shrink-0 mb-2 mt-2 xl:mt-4">
             <span className={`font-bold tracking-tight text-[18px] leading-none transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDark ? 'text-zinc-100' : 'text-zinc-900'} ${isExpanded || menuMobileAberto ? 'opacity-100 w-auto' : 'xl:opacity-0 xl:w-0 overflow-hidden'}`}>
                AROX
             </span>
             
             {/* Botão Hardware Premium */}
             <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className={`hidden xl:flex items-center justify-center w-8 h-8 rounded-md transition-all duration-300 active:scale-95 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60'} ${!isExpanded && 'mx-auto'}`}
              >
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
                 <path d={isExpanded ? "M9 3v18" : "M15 3v18"} className="transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" />
               </svg>
             </button>
         </div>

         {/* Área de Navegação */}
         <div className={`flex-1 px-4 xl:px-4 [&::-webkit-scrollbar]:hidden flex flex-col gap-8 pt-2 ${isExpanded || menuMobileAberto ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}>
            
            {/* Bloco Operação */}
            <div className="flex flex-col gap-1.5">
              <p className={`px-3 text-[10px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDark ? 'text-zinc-500' : 'text-zinc-400'} ${isExpanded || menuMobileAberto ? 'mb-2 h-auto opacity-100' : 'mb-0 h-0 opacity-0 overflow-hidden'}`}>
                Operação
              </p>
              <MenuItem id="comandas" titulo="Terminal" icone={iconeComandas} hoverable={true} isAtivo={abaAtiva === 'comandas'} onClick={() => handleClickAba('comandas')} onHover={() => handleHoverAba('comandas')} />
              <MenuItem id="fechadas" titulo="Histórico" icone={iconeEncerradas} hoverable={true} isAtivo={abaAtiva === 'fechadas'} onClick={() => handleClickAba('fechadas')} onHover={() => handleHoverAba('fechadas')} />
              {(sessao?.role === 'dono' || sessao?.perm_faturamento) && <MenuItem id="faturamento" titulo="Métricas" hoverable={true} icone={iconeFaturamento} isAtivo={abaAtiva === 'faturamento'} onClick={() => handleClickAba('faturamento')} onHover={() => handleHoverAba('faturamento')} />}
            </div>

            {/* Bloco Gestão */}
            <div className="flex flex-col gap-1.5">
              <p className={`px-3 text-[10px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDark ? 'text-zinc-500' : 'text-zinc-400'} ${isExpanded || menuMobileAberto ? 'mb-2 h-auto opacity-100' : 'mb-0 h-0 opacity-0 overflow-hidden'}`}>
                Gestão
              </p>
              <MenuItem id="caixa" titulo="Caixa Central" icone={iconeCaixa} hoverable={true} isAtivo={abaAtiva === 'caixa'} onClick={() => handleClickAba('caixa')} onHover={() => handleHoverAba('caixa')} />
              {(sessao?.role === 'dono' || sessao?.perm_fidelidade || sessao?.perm_estudo) && <MenuItem id="fidelidade" titulo="Clientes" hoverable={true} icone={iconeClientes} isAtivo={abaAtiva === 'fidelidade'} onClick={() => handleClickAba('fidelidade')} onHover={() => handleHoverAba('fidelidade')} />}
            </div>
         </div>

         {/* Rodapé VIP e Configurações */}
         <div className="mt-auto shrink-0 pb-4 xl:pb-6 pt-4">
            <div className="px-4 xl:px-4 flex flex-col gap-1.5">
               
               {/* Card de Perfil Premium */}
               <div className={`flex items-center rounded-xl mb-3 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer
                  ${isExpanded || menuMobileAberto ? 'px-3 py-3' : 'justify-center py-2 px-0'} 
                  ${isDark ? 'bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]' : 'bg-white hover:bg-zinc-50 border border-zinc-200/80 shadow-sm'}
               `}>
                 <div className={`relative shrink-0 flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded || menuMobileAberto ? 'w-[40px] h-[40px]' : 'w-[36px] h-[36px]'}`}>
                   <img src={logoEmpresa || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover rounded-full border border-white/[0.1]" />
                   
                   {/* Status Indicator refinado */}
                   <span className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full transition-colors duration-300 ${statusPresenca === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500'} ring-[2.5px] ${isDark ? 'ring-[#111113]' : 'ring-white'}`}></span>
                 </div>
                 
                 <div className={`flex flex-col min-w-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded || menuMobileAberto ? 'w-auto opacity-100 ml-3.5' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
                    <span className={`text-[14px] font-semibold truncate leading-tight tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{nomeEmpresa || 'Estabelecimento'}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[12px] font-medium truncate tracking-wide ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{sessao?.nome_usuario || 'Usuário'}</span>
                      <span className={`px-1.5 py-[1px] rounded-[4px] text-[9px] uppercase tracking-widest font-bold ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-zinc-200/80 text-zinc-700'}`}>{planoEmpresa}</span>
                    </div>
                 </div>
               </div>
               
               {sessao?.role === 'dono' && (
                 <MenuItem titulo="Ajustes da Empresa" hoverable={true} icone={iconeConfig} onClick={() => { setMostrarConfigEmpresa(true); setMenuMobileAberto(false); }} />
               )}
               
               <MenuItem 
                 titulo={temaNoturno ? 'Modo Claro' : 'Modo Escuro'} 
                 hoverable={true} 
                 icone={temaNoturno ? <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} 
                 onClick={() => setTemaNoturno(!temaNoturno)} 
               />
               
               <MenuItem 
                 titulo="Sair da Plataforma" 
                 hoverable={true} 
                 danger={true}
                 icone={iconeLogout} 
                 onClick={fazerLogout} 
               />
            </div>
         </div>
      </aside>
    </>
  );
}