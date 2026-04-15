'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Sidebar({
  menuMobileAberto, setMenuMobileAberto, temaNoturno, setTemaNoturno, logoEmpresa,
  sessao, nomeEmpresa, abaAtiva, setAbaAtiva, setMostrarConfigEmpresa,
  fazerLogout, caixaAtual, statusPresenca
}) {
  const [planoEmpresa, setPlanoEmpresa] = useState('Starter');
  // Controle manual para expandir a barra via botão
  const [isExpanded, setIsExpanded] = useState(false);
  const [tabTravada, setTabTravada] = useState(false); 

  const isPlanetVisible = abaAtiva === 'comandas' && (!caixaAtual || caixaAtual.status !== 'aberto');
  const isDark = temaNoturno; // Modificado para respeitar sempre a preferência do usuário

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

  const iconeComandas = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>;
  const iconeEncerradas = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>;
  const iconeFaturamento = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>;
  const iconeCaixa = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  const iconeClientes = <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
  const iconeConfig = <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const iconeLogout = <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

  const MenuItem = ({ id, titulo, icone, onClick, onHover, isAtivo, hoverable }) => {
    // Determina se a barra está larga (Mobile sempre mostra, Desktop depende do botão)
    const showText = isExpanded || menuMobileAberto;

    return (
      <div className="relative group w-full flex" onMouseEnter={() => { if (hoverable && onHover) onHover(); }}>
        <button 
          onClick={(e) => {
            if (hoverable) {
              const target = e.currentTarget;
              target.classList.add('scale-[0.98]');
              setTimeout(() => target && target.classList.remove('scale-[0.98]'), 150);
            }
            onClick(e);
          }} 
          className={`relative w-full rounded-lg font-medium transition-all duration-200 flex items-center outline-none overflow-hidden 
            py-3.5 px-3 gap-3 text-[13px]
            ${isAtivo 
              ? (isDark ? 'text-zinc-100 bg-white/[0.06]' : 'text-zinc-900 bg-zinc-100/80') 
              : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/80')
          }`}
        >
          {/* Diminuído de 18px para 16px */}
          <span className={`shrink-0 transition-all duration-200 w-[16px] h-[16px] flex items-center justify-center ${isAtivo ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
            {icone}
          </span>
          <span className={`truncate whitespace-nowrap tracking-tight transition-all duration-300 ease-out ${showText ? 'w-auto opacity-100 ml-0.5' : 'w-0 opacity-0 ml-0'}`}>
            {titulo}
          </span>
          {isAtivo && <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-r-full ${isDark ? 'bg-zinc-300' : 'bg-zinc-800'}`}></span>}
        </button>

        {/* Tooltip Premium: Só aparece no Desktop quando o menu está encolhido */}
        {!showText && hoverable && (
          <div className={`hidden xl:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide whitespace-nowrap pointer-events-none opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-[99999] shadow-xl ${isDark ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>
            {titulo}
            <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2.5 h-2.5 rotate-45 rounded-[2px] ${isDark ? 'bg-white' : 'bg-zinc-900'}`} />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 z-[90] xl:hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${menuMobileAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMenuMobileAberto(false)} />
      
      {/* O Espaçador acompanha a barra para não quebrar o layout da página principal */}
      <div className={`hidden xl:block shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'w-[260px]' : 'w-[72px]'}`} />

      {/* A grande sacada: overflow-visible garante que os balões possam sair do menu */}
      <aside className={`fixed top-0 left-0 h-full flex flex-col z-[100] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] 
        ${menuMobileAberto ? 'translate-x-0 shadow-2xl' : '-translate-x-full xl:translate-x-0'}
        w-[80vw] max-w-[280px] xl:w-[72px] ${isExpanded ? 'xl:w-[260px]' : 'xl:w-[72px]'} xl:border-r 
        backdrop-blur-[40px] pt-0 xl:pt-6 
        ${isDark ? 'bg-[#09090B]/90 border-white/[0.04]' : 'bg-white/95 border-zinc-200/60'}
        ${isExpanded || menuMobileAberto ? 'overflow-hidden' : 'overflow-visible'}
      `}>
         
         <div className="xl:hidden h-[72px] px-5 flex items-center shrink-0 border-b mb-4 transition-colors duration-500 border-black/5 dark:border-white/5">
             <span className={`font-black tracking-tighter text-[16px] leading-none ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>AROX</span>
         </div>

         {/* Botão de Toggle Menu (Só aparece no Desktop, no topo, centralizado se fechado) */}
         <div className={`hidden xl:flex shrink-0 w-full mb-6 ${isExpanded ? 'px-4 justify-end' : 'justify-center'}`}>
           <button onClick={() => setIsExpanded(!isExpanded)} className={`p-2 rounded-xl transition-colors active:scale-95 ${isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-500 hover:text-black'}`}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
               <line x1="9" y1="3" x2="9" y2="21"></line>
             </svg>
           </button>
         </div>

         {/* Quando expandido o scroll nativo funciona, quando fechado o overflow some para deixar os balões voarem */}
         <div className={`flex-1 px-4 xl:px-3 [&::-webkit-scrollbar]:hidden flex flex-col gap-6 ${isExpanded || menuMobileAberto ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}>
            <div className="flex flex-col gap-2">
              <p className={`px-3 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isDark ? 'text-zinc-500' : 'text-zinc-400'} ${isExpanded || menuMobileAberto ? 'mb-1.5 h-auto opacity-100' : 'mb-0 h-0 opacity-0 overflow-hidden'}`}>Operação</p>
              
              <MenuItem id="comandas" titulo="Terminal" icone={iconeComandas} hoverable={true} isAtivo={abaAtiva === 'comandas'} onClick={() => handleClickAba('comandas')} onHover={() => handleHoverAba('comandas')} />
              <MenuItem id="fechadas" titulo="Histórico" icone={iconeEncerradas} hoverable={true} isAtivo={abaAtiva === 'fechadas'} onClick={() => handleClickAba('fechadas')} onHover={() => handleHoverAba('fechadas')} />
              {(sessao?.role === 'dono' || sessao?.perm_faturamento) && <MenuItem id="faturamento" titulo="Métricas" hoverable={true} icone={iconeFaturamento} isAtivo={abaAtiva === 'faturamento'} onClick={() => handleClickAba('faturamento')} onHover={() => handleHoverAba('faturamento')} />}
            </div>

            <div className="flex flex-col gap-2">
              <p className={`px-3 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isDark ? 'text-zinc-500' : 'text-zinc-400'} ${isExpanded || menuMobileAberto ? 'mb-1.5 h-auto opacity-100' : 'mb-0 h-0 opacity-0 overflow-hidden'}`}>Gestão</p>
              
              <MenuItem id="caixa" titulo="Caixa Central" icone={iconeCaixa} hoverable={true} isAtivo={abaAtiva === 'caixa'} onClick={() => handleClickAba('caixa')} onHover={() => handleHoverAba('caixa')} />
              {(sessao?.role === 'dono' || sessao?.perm_fidelidade || sessao?.perm_estudo) && <MenuItem id="fidelidade" titulo="Clientes" hoverable={true} icone={iconeClientes} isAtivo={abaAtiva === 'fidelidade'} onClick={() => handleClickAba('fidelidade')} onHover={() => handleHoverAba('fidelidade')} />}
            </div>
         </div>

         {/* RODAPÉ E CONFIGURAÇÕES */}
         <div className="mt-auto shrink-0 transition-colors duration-300 pb-4 xl:pb-4 pt-2">
            <div className="px-4 xl:px-3 flex flex-col gap-2">
               
               {/* Bloco de Perfil Otimizado */}
               <div className={`flex items-center rounded-lg mb-2 transition-all duration-300 ${isExpanded || menuMobileAberto ? 'px-3 py-3' : 'justify-center py-3'} ${isDark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-zinc-50 border border-zinc-100'}`}>
                 <div className="relative shrink-0 flex items-center justify-center w-[18px] h-[18px] xl:w-[16px] xl:h-[16px]">
                   <img src={logoEmpresa || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover rounded-full" />
                   <span className={`absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full transition-colors duration-300 ${statusPresenca === 'online' ? 'bg-emerald-500' : 'bg-amber-500'} ring-2 ${isDark ? 'ring-[#18181b]' : 'ring-white'}`}></span>
                 </div>
                 
                 <div className={`flex flex-col min-w-0 transition-all duration-300 ${isExpanded || menuMobileAberto ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
                    <span className={`text-[12px] font-medium truncate leading-none tracking-tight ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{nomeEmpresa || 'Estabelecimento'}</span>
                    <span className={`text-[10px] flex items-center gap-1.5 font-medium truncate mt-1 tracking-wide ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {sessao?.nome_usuario || 'Usuário'}
                      <span className={`px-1 rounded-sm text-[8px] uppercase tracking-widest font-semibold ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-zinc-200/80 text-zinc-600'}`}>{(!planoEmpresa || ['free', 'grátis', 'starter'].includes(planoEmpresa.toLowerCase())) ? 'BETA' : 'PRO'}</span>
                    </span>
                 </div>
               </div>
               
               {sessao?.role === 'dono' && (
                 <MenuItem titulo="Ajustes do Sistema" hoverable={true} icone={iconeConfig} onClick={() => { setMostrarConfigEmpresa(true); setMenuMobileAberto(false); }} />
               )}
               
               <MenuItem titulo={temaNoturno ? 'Modo Claro' : 'Modo Escuro'} hoverable={true} icone={temaNoturno ? <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} onClick={() => setTemaNoturno(!temaNoturno)} />
               
               <div className="relative group w-full mt-1">
                 <button onClick={fazerLogout} className={`relative w-full rounded-lg font-medium transition-colors duration-200 flex items-center outline-none overflow-hidden py-3.5 px-3 gap-3 text-[13px] active:scale-[0.98] ${isDark ? 'text-zinc-500 hover:text-rose-400 hover:bg-white/[0.03]' : 'text-zinc-400 hover:text-rose-600 hover:bg-zinc-50/80'}`}>
                   {/* Diminuído de 18px para 16px */}
                   <span className="shrink-0 transition-transform duration-200 w-[16px] h-[16px] opacity-70 group-hover:opacity-100 flex items-center justify-center">{iconeLogout}</span>
                   <span className={`truncate whitespace-nowrap tracking-tight transition-all duration-300 ease-out ${isExpanded || menuMobileAberto ? 'w-auto opacity-100 ml-0.5' : 'w-0 opacity-0 ml-0'}`}>Sair da Plataforma</span>
                 </button>

                 {/* Tooltip do Logout (com cor diferente) */}
                 {!(isExpanded || menuMobileAberto) && (
                    <div className={`hidden xl:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide whitespace-nowrap pointer-events-none opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-[99999] shadow-xl ${isDark ? 'bg-rose-500 text-white' : 'bg-rose-600 text-white'}`}>
                      Sair da Plataforma
                      <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2.5 h-2.5 rotate-45 rounded-[2px] ${isDark ? 'bg-rose-500' : 'bg-rose-600'}`} />
                    </div>
                 )}
               </div>

            </div>
         </div>
      </aside>
    </>
  );
}