// src/components/Sidebar.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Sidebar({
  menuMobileAberto, setMenuMobileAberto, temaNoturno, logoEmpresa,
  sessao, nomeEmpresa, abaAtiva, setAbaAtiva, setMostrarConfigEmpresa,
  setMostrarAdminProdutos, setMostrarConfigTags, setMostrarAdminDelivery,
  fazerLogout
}) {
  const [planoEmpresa, setPlanoEmpresa] = useState('Starter');

  useEffect(() => {
    const buscarPlano = async () => {
      if (sessao?.empresa_id) {
        const { data, error } = await supabase
          .from('empresas')
          .select('plano')
          .eq('id', sessao.empresa_id)
          .single();
          
        if (!error && data?.plano) {
          setPlanoEmpresa(data.plano);
        }
      }
    };
    buscarPlano();
  }, [sessao?.empresa_id]);

  // Ícones Stroke 1.5, Minimalistas
  const iconeComandas = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>;
  const iconeEncerradas = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;
  const iconeFaturamento = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  const iconeCaixa = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>;
  const iconeClientes = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>;
  const iconeCardapio = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>;
  const iconeTags = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>;
  const iconeDelivery = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>;

  // Componente Reutilizável de Menu
  const MenuItem = ({ id, titulo, icone, onClick, isAtivo }) => (
    <button 
      onClick={onClick} 
      className={`w-full px-3 py-2 rounded-lg text-left font-medium text-sm transition-all duration-200 flex items-center gap-3 relative group ${
        isAtivo 
          ? (temaNoturno 
              ? 'bg-white/10 text-white shadow-sm' 
              : 'bg-zinc-200/50 text-zinc-900 shadow-sm') 
          : (temaNoturno 
              ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200' 
              : 'text-zinc-500 hover:bg-zinc-100/60 hover:text-zinc-900')
      }`}
    >
      <span className={`transition-transform duration-300 ${isAtivo ? 'scale-105' : 'group-hover:scale-105'}`}>
        {icone}
      </span>
      {titulo}
    </button>
  );

  return (
    <>
      {/* OVERLAY PARA MOBILE */}
      <div 
        className={`fixed inset-0 z-[100] xl:hidden bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${menuMobileAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setMenuMobileAberto(false)}
      ></div>
      
      {/* SIDEBAR CONTAINER */}
      <aside className={`fixed xl:static top-0 left-0 h-full w-[250px] shrink-0 z-[101] transform transition-transform duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] flex flex-col overflow-hidden border-r ${menuMobileAberto ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'} ${temaNoturno ? 'bg-[#09090b] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
         
         {/* BRAND HEADER */}
         <div className="p-5 flex items-center gap-3 relative shrink-0">
            <div className={`w-7 h-7 rounded-md shadow-sm overflow-hidden border flex items-center justify-center shrink-0 ${temaNoturno ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}><path d="M3 18h18" /><path d="M5 14c0-3.87 3.13-7 7-7s7 3.13 7 7" /><path d="M12 7V4" /><path d="M10 4h4" /></svg>
            </div>
            <div className="flex flex-col min-w-0 pt-0.5">
              <h3 className={`font-semibold text-[13px] leading-none truncate tracking-tight ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>{nomeEmpresa}</h3>
            </div>
         </div>

         {/* MENUS E NAVEGAÇÃO */}
         <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide relative z-10 flex flex-col gap-6">
            
            {/* GRUPO: Visão Geral */}
            <div>
              <p className={`px-3 text-xs font-semibold mb-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Workspace</p>
              <nav className="flex flex-col gap-1">
                <MenuItem id="comandas" titulo="Comandas" icone={iconeComandas} isAtivo={abaAtiva === 'comandas'} onClick={() => { setAbaAtiva('comandas'); setMenuMobileAberto(false); }} />
                <MenuItem id="fechadas" titulo="Encerradas" icone={iconeEncerradas} isAtivo={abaAtiva === 'fechadas'} onClick={() => { setAbaAtiva('fechadas'); setMenuMobileAberto(false); }} />
                
                {(sessao?.role === 'dono' || sessao?.perm_faturamento) && (
                  <MenuItem id="faturamento" titulo="Faturamento" icone={iconeFaturamento} isAtivo={abaAtiva === 'faturamento'} onClick={() => { setAbaAtiva('faturamento'); setMenuMobileAberto(false); }} />
                )}
                
                <MenuItem id="caixa" titulo="Caixa" icone={iconeCaixa} isAtivo={abaAtiva === 'caixa'} onClick={() => { setAbaAtiva('caixa'); setMenuMobileAberto(false); }} />
                
                {(sessao?.role === 'dono' || sessao?.perm_fidelidade || sessao?.perm_estudo) && (
                  <MenuItem id="fidelidade" titulo="Clientes" icone={iconeClientes} isAtivo={abaAtiva === 'fidelidade'} onClick={() => { setAbaAtiva('fidelidade'); setMenuMobileAberto(false); }} />
                )}
              </nav>
            </div>

            {/* GRUPO: Configurações */}
            <div>
              <p className={`px-3 text-xs font-semibold mb-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Ajustes</p>
              <nav className="flex flex-col gap-1">
                {(sessao?.role === 'dono' || sessao?.perm_cardapio) && (
                  <MenuItem titulo="Catálogo" icone={iconeCardapio} onClick={() => { setMostrarAdminProdutos(true); setMenuMobileAberto(false); }} />
                )}
                {sessao?.role === 'dono' && (
                  <MenuItem titulo="Delivery" icone={iconeDelivery} onClick={() => { setMostrarAdminDelivery(true); setMenuMobileAberto(false); }} />
                )}
                {sessao?.role === 'dono' && (
                  <MenuItem titulo="Tags" icone={iconeTags} onClick={() => { setMostrarConfigTags(true); setMenuMobileAberto(false); }} />
                )}
              </nav>
            </div>
         </div>

         {/* PLANO / STATUS DO SISTEMA */}
         <div className={`p-4 relative shrink-0 border-t ${temaNoturno ? 'border-white/5 bg-[#09090b]' : 'border-zinc-200 bg-zinc-50'}`}>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className={`w-1.5 h-1.5 rounded-full ${temaNoturno ? 'bg-emerald-400' : 'bg-emerald-500'} animate-pulse`}></div>
              <span className={`text-xs font-medium ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>Sistema Online</span>
            </div>
            <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-lg border ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
              <span className={`text-[11px] font-semibold ${temaNoturno ? 'text-zinc-300' : 'text-zinc-700'}`}>Plano {planoEmpresa}</span>
              <svg className={`w-3.5 h-3.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
         </div>
      </aside>
    </>
  );
}