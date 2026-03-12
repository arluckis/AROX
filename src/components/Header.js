'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({
  comandaAtiva, setIdSelecionado, setMenuMobileAberto, temaNoturno,
  caixaAtual, abaAtiva, setAbaAtiva, logoEmpresa, setTemaNoturno,
  mostrarMenuPerfil, setMostrarMenuPerfil, nomeEmpresa, sessao,
  setMostrarConfigEmpresa, setMostrarAdminUsuarios, setMostrarAdminProdutos,
  setMostrarConfigTags, setMostrarModalCaixa, setMostrarAdminDelivery, fazerLogout, fetchData
}) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [tempNome, setTempNome] = useState('');

  const formatarDataCaixa = (data) => {
    if (!data) return "---";
    return data.substring(0, 10).split('-').reverse().join('/');
  };

  const salvarNome = async () => {
    if (!tempNome.trim() || tempNome === comandaAtiva.nome) {
      setEditandoNome(false);
      return;
    }
    const { error } = await supabase.from('comandas').update({ nome: tempNome }).eq('id', comandaAtiva.id);
    if (!error && fetchData) await fetchData();
    setEditandoNome(false);
  };

  // Nova função para alternar o tipo da comanda
  const alternarTipoComanda = async () => {
    if (!comandaAtiva) return;
    const novoTipo = comandaAtiva.tipo === 'Balcão' ? 'Delivery' : 'Balcão';
    const { error } = await supabase.from('comandas').update({ tipo: novoTipo }).eq('id', comandaAtiva.id);
    if (!error && fetchData) await fetchData();
  };

  return (
    <header className={`flex items-center justify-between p-3 xl:p-4 rounded-3xl shadow-sm border mb-6 sticky top-0 z-40 transition-colors duration-500 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      
      {/* --- ESQUERDA: Botão Voltar ou Caixa Aberto --- */}
      <div className="flex flex-1 justify-start items-center gap-3">
        {comandaAtiva ? (
          <button onClick={() => { setIdSelecionado(null); setEditandoNome(false); }} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition ${temaNoturno ? 'bg-gray-700 text-purple-300 hover:bg-gray-600' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
            <span className="text-xl">←</span> <span className="hidden sm:inline">Voltar</span>
          </button>
        ) : (
          <>
            <button onClick={() => setMenuMobileAberto(true)} className={`xl:hidden p-2 rounded-xl border transition ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div onClick={() => setMostrarModalCaixa?.(true)} className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer hover:scale-105 transition ${temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100'}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>Caixa Aberto: {formatarDataCaixa(caixaAtual?.data_abertura)}</span>
            </div>
          </>
        )}
      </div>

      {/* --- CENTRO: Navegação Principal ou Nome da Comanda --- */}
      <div className="flex justify-center shrink-0">
        {!comandaAtiva ? (
          <>
            <div className={`hidden xl:flex rounded-xl p-1 text-sm border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-100/80 border-gray-200/50'}`}>
              <button onClick={() => setAbaAtiva('comandas')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'comandas' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Comandas
              </button>
              
              <button onClick={() => setAbaAtiva('fechadas')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'fechadas' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Encerradas
              </button>

              {(sessao.role === 'dono' || sessao.perm_faturamento) && (
                <button onClick={() => setAbaAtiva('faturamento')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'faturamento' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Faturamento
                </button>
              )}

              <button onClick={() => setAbaAtiva('caixa')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'caixa' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg> Fechamento
              </button>

              {(sessao.role === 'dono' || sessao.perm_estudo) && (
                <button onClick={() => setAbaAtiva('analises')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'analises' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg> Público-Alvo
                </button>
              )}
            </div>

            <div onClick={() => setMostrarModalCaixa?.(true)} className={`xl:hidden flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer ${temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100'}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>{formatarDataCaixa(caixaAtual?.data_abertura)}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-3">
            {editandoNome ? (
              <input 
                autoFocus
                className={`text-center font-black text-lg p-1 rounded-lg border-2 border-purple-500 outline-none w-full max-w-[200px] uppercase ${temaNoturno ? 'bg-gray-900 text-white' : 'bg-white text-purple-900'}`}
                value={tempNome}
                onChange={e => setTempNome(e.target.value)}
                onBlur={salvarNome}
                onKeyDown={e => e.key === 'Enter' && salvarNome()}
              />
            ) : (
              <h2 onClick={() => { setTempNome(comandaAtiva.nome); setEditandoNome(true); }} className={`text-lg font-black truncate text-center cursor-pointer hover:opacity-70 transition uppercase ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`}>
                {comandaAtiva?.nome} ✏️
              </h2>
            )}

            {/* BOTÃO DE ALTERNAR TIPO */}
            <button 
              onClick={alternarTipoComanda}
              title={`Mudar para ${comandaAtiva.tipo === 'Balcão' ? 'Delivery' : 'Balcão'}`}
              className={`flex items-center gap-1.5 px-2 py-1 xl:px-3 xl:py-1.5 rounded-lg text-xs font-bold transition border active:scale-95 ${
                comandaAtiva.tipo === 'Delivery' 
                  ? (temaNoturno ? 'bg-orange-900/30 text-orange-400 border-orange-800/50 hover:bg-orange-900/50' : 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100') 
                  : (temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800/50 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100')
              }`}
            >
              {comandaAtiva.tipo === 'Delivery' ? (
                <>
                  <svg className="w-5 h-5 xl:w-4 xl:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l3 5v6H8m12-11v11M8 7V5a2 2 0 00-2-2H3v14h1m4-12v12m0 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m16 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m-8-2h4"></path></svg>
                  <span className="hidden xl:inline">Delivery</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 xl:w-4 xl:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  <span className="hidden xl:inline">Balcão</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* --- DIREITA: Tema e Perfil --- */}
      <div className="flex flex-1 justify-end items-center gap-2 xl:gap-6">
        <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-2 rounded-full border transition ${temaNoturno ? 'bg-gray-700 border-gray-600 text-yellow-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
          {temaNoturno ? '🌙' : '☀️'}
        </button>
        
        <div className="hidden xl:block relative shrink-0 cursor-pointer" onClick={() => setMostrarMenuPerfil(!mostrarMenuPerfil)}>
          <div className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">{nomeEmpresa}</span>
              <span className={`font-black text-sm leading-none ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`}>{sessao.nome_usuario}</span>
            </div>
            <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shrink-0 ${temaNoturno ? 'border-gray-600 bg-gray-700' : 'border-purple-200 bg-purple-50'}`}>
               <img src={logoEmpresa} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={`text-xs ml-1 ${temaNoturno ? 'text-gray-500' : 'text-gray-300'}`}>▼</span>
          </div>
          
          {mostrarMenuPerfil && (
            <div className={`absolute top-14 right-0 shadow-2xl rounded-2xl p-2 w-56 border z-50 transition-colors ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              {sessao.role === 'dono' && (
                <button onClick={() => { setMostrarConfigEmpresa(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Configurar Loja</button>
              )}
              {sessao.role === 'dono' && (
                <button onClick={() => { setMostrarAdminUsuarios(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Equipe</button>
              )}
              {(sessao.role === 'dono' || sessao.perm_cardapio) && (
                <button onClick={() => { setMostrarAdminProdutos(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Cardápio</button>
              )}
              {sessao.role === 'dono' && (
                <button onClick={() => { setMostrarConfigTags(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Tags</button>
              )}
              {sessao.role === 'dono' && (
                <button onClick={() => { setMostrarAdminDelivery(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Delivery</button>
              )}
              <div className="h-px my-1 bg-gray-500/10"></div>
              <button onClick={fazerLogout} className="w-full text-left p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl">Sair do Sistema</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}