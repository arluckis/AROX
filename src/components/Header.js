'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({
  comandaAtiva, setIdSelecionado, setMenuMobileAberto, temaNoturno,
  caixaAtual, abaAtiva, setAbaAtiva, logoEmpresa, setTemaNoturno,
  mostrarMenuPerfil, setMostrarMenuPerfil, nomeEmpresa, sessao,
  setMostrarConfigEmpresa, setMostrarAdminUsuarios, setMostrarAdminProdutos,
  setMostrarConfigTags, setMostrarAdminDelivery, fazerLogout, fetchData,
  clientesFidelidade, vincularClienteFidelidade
}) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [tempNome, setTempNome] = useState('');
  
  const [buscaFidelidade, setBuscaFidelidade] = useState('');
  const [mostrarResultadosFidelidade, setMostrarResultadosFidelidade] = useState(false);
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);

  const formatarDataCaixa = (data) => {
    if (!data) return "---";
    return String(data).substring(0, 10).split('-').reverse().join('/');
  };

  const salvarNome = async () => {
    if (!tempNome || !tempNome.trim() || tempNome === comandaAtiva?.nome) {
      setEditandoNome(false);
      return;
    }
    const { error } = await supabase.from('comandas').update({ nome: tempNome }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
    setEditandoNome(false);
  };

  const alternarTipoComanda = async () => {
    if (!comandaAtiva) return;
    const novoTipo = comandaAtiva?.tipo === 'Balcão' ? 'Delivery' : 'Balcão';
    const { error } = await supabase.from('comandas').update({ tipo: novoTipo }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
  };

  const isCaixaAberto = caixaAtual?.status === 'aberto';
  let statusCaixa = isCaixaAberto ? 'aberto' : 'fechado';
  if (isCaixaAberto && caixaAtual?.data_abertura) {
    const dataAberturaDB = String(caixaAtual.data_abertura).substring(0, 10);
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    if (dataAberturaDB < `${ano}-${mes}-${dia}` && agora.getHours() >= 5) {
      statusCaixa = 'esquecido';
    }
  }

  const irParaAberturaDeCaixa = () => {
    setAbaAtiva('caixa');
    setIdSelecionado(null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  return (
    <header className={`flex items-center justify-between gap-4 p-3 xl:p-4 rounded-t-3xl border border-b-0 relative z-40 transition-colors duration-500 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      
      {/* SEÇÃO ESQUERDA */}
      <div className="flex flex-1 justify-start items-center gap-3 min-w-0">
        {comandaAtiva ? (
          <button onClick={() => { setIdSelecionado(null); setEditandoNome(false); }} className={`flex items-center shrink-0 gap-2 font-bold px-3 py-2 xl:px-4 xl:py-2 rounded-xl transition active:scale-95 ${temaNoturno ? 'bg-gray-700 text-purple-300 hover:bg-gray-600' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            <span className="hidden sm:inline text-sm">Voltar</span>
          </button>
        ) : (
          <>
            <button onClick={() => setMenuMobileAberto(true)} className={`xl:hidden p-2 rounded-xl border shrink-0 transition active:scale-95 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div onClick={irParaAberturaDeCaixa} className={`hidden xl:flex items-center shrink-0 gap-2 px-3 py-1.5 rounded-xl border cursor-pointer hover:scale-105 transition active:scale-95 ${
              statusCaixa === 'aberto' ? (temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100') : 
              statusCaixa === 'esquecido' ? (temaNoturno ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-100') : 
              (temaNoturno ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-100')
            }`}>
              <span className={`w-2 h-2 rounded-full ${statusCaixa === 'aberto' ? 'bg-green-500 animate-pulse' : statusCaixa === 'esquecido' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${statusCaixa === 'aberto' ? (temaNoturno ? 'text-green-400' : 'text-green-700') : statusCaixa === 'esquecido' ? (temaNoturno ? 'text-orange-400' : 'text-orange-700') : (temaNoturno ? 'text-red-400' : 'text-red-700')}`}>
                {statusCaixa === 'aberto' ? `Caixa Aberto: ${formatarDataCaixa(caixaAtual?.data_abertura)}` : statusCaixa === 'esquecido' ? 'CAIXA PENDENTE' : 'CAIXA FECHADO'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* SEÇÃO CENTRAL */}
      <div className="flex justify-center items-center shrink min-w-0">
        {!comandaAtiva ? (
          <>
            <div className={`hidden xl:flex rounded-xl p-1 border overflow-x-auto scrollbar-hide max-w-full ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-100/80 border-gray-200/50'}`}>
              <button onClick={() => setAbaAtiva('comandas')} className={`px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-lg text-xs 2xl:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 2xl:gap-2 active:scale-95 shrink-0 ${abaAtiva === 'comandas' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Comandas
              </button>
              
              <button onClick={() => setAbaAtiva('fechadas')} className={`px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-lg text-xs 2xl:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 2xl:gap-2 active:scale-95 shrink-0 ${abaAtiva === 'fechadas' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Encerradas
              </button>

              {(sessao?.role === 'dono' || sessao?.perm_faturamento) && (
                <button onClick={() => setAbaAtiva('faturamento')} className={`px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-lg text-xs 2xl:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 2xl:gap-2 active:scale-95 shrink-0 ${abaAtiva === 'faturamento' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Faturamento
                </button>
              )}

              <button onClick={() => setAbaAtiva('caixa')} className={`px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-lg text-xs 2xl:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 2xl:gap-2 active:scale-95 shrink-0 ${abaAtiva === 'caixa' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Fechamento
              </button>

              {(sessao?.role === 'dono' || sessao?.perm_fidelidade || sessao?.perm_estudo) && (
                <button onClick={() => setAbaAtiva('fidelidade')} className={`px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-lg text-xs 2xl:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 2xl:gap-2 active:scale-95 shrink-0 ${abaAtiva === 'fidelidade' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                  <svg className={`w-4 h-4 shrink-0 ${abaAtiva === 'fidelidade' ? 'text-purple-400' : 'opacity-70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Clientes
                </button>
              )}
            </div>

            <div onClick={irParaAberturaDeCaixa} className={`xl:hidden flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer active:scale-95 transition shrink-0 ${
              statusCaixa === 'aberto' ? (temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100') : 
              statusCaixa === 'esquecido' ? (temaNoturno ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-100') : 
              (temaNoturno ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-100')
            }`}>
              <span className={`w-2 h-2 rounded-full ${statusCaixa === 'aberto' ? 'bg-green-500 animate-pulse' : statusCaixa === 'esquecido' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${statusCaixa === 'aberto' ? (temaNoturno ? 'text-green-400' : 'text-green-700') : statusCaixa === 'esquecido' ? (temaNoturno ? 'text-orange-400' : 'text-orange-700') : (temaNoturno ? 'text-red-400' : 'text-red-700')}`}>
                {statusCaixa === 'aberto' ? formatarDataCaixa(caixaAtual?.data_abertura) : statusCaixa === 'esquecido' ? 'TURNO PENDENTE' : 'FECHADO'}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 relative w-full max-w-md">
            {editandoNome ? (
              <input 
                autoFocus
                className={`text-center font-black text-lg p-1 rounded-lg border-2 border-purple-500 outline-none w-full uppercase animate-in fade-in zoom-in-95 duration-200 ${temaNoturno ? 'bg-gray-900 text-white' : 'bg-white text-purple-900'}`}
                value={tempNome} onChange={e => setTempNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => e.key === 'Enter' && salvarNome()}
              />
            ) : (
              <h2 onClick={() => { setTempNome(comandaAtiva?.nome || ''); setEditandoNome(true); }} className={`text-lg font-black truncate text-center cursor-pointer hover:opacity-70 transition uppercase w-full ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`}>
                {comandaAtiva?.nome || 'Comanda'} ✏️
              </h2>
            )}

            <button 
              onClick={() => setBuscaMobileAberta(!buscaMobileAberta)}
              className={`sm:hidden flex items-center shrink-0 justify-center p-2 rounded-lg transition-all active:scale-95 shadow-sm ml-1 border ${buscaMobileAberta ? (temaNoturno ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' : 'bg-purple-50 text-purple-600 border-purple-200') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200')}`}
            >
              <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </button>

            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 sm:mt-0 sm:translate-x-0 sm:relative sm:top-auto sm:left-auto sm:block z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${buscaMobileAberta ? 'block w-64' : 'hidden'}`}>
              <div className="flex items-center relative">
                <svg className={`absolute left-3 w-4 h-4 ${temaNoturno ? 'text-gray-400' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <input 
                  type="text" placeholder="Vincular Cliente..." value={buscaFidelidade} onChange={(e) => { setBuscaFidelidade(e.target.value); setMostrarResultadosFidelidade(true); }} onFocus={() => setMostrarResultadosFidelidade(true)}
                  className={`pl-9 pr-3 py-2.5 sm:py-1.5 text-sm sm:text-xs font-bold rounded-xl sm:rounded-lg border transition outline-none w-full sm:w-48 shadow-lg sm:shadow-none ${temaNoturno ? 'bg-gray-800 border-gray-600 text-white focus:border-purple-500' : 'bg-white sm:bg-gray-50 border-gray-200 focus:border-purple-500'}`}
                />
              </div>
              
              {mostrarResultadosFidelidade && buscaFidelidade.length > 0 && (
                <div className={`absolute top-full mt-2 sm:mt-1 left-0 w-full sm:w-64 max-h-48 overflow-y-auto rounded-xl border shadow-2xl z-[60] animate-in fade-in zoom-in-95 duration-200 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {(clientesFidelidade || []).filter(c => c.nome.toLowerCase().includes(buscaFidelidade.toLowerCase())).length === 0 ? (
                    <div className={`p-3 text-xs font-bold text-center ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Cliente não encontrado.</div>
                  ) : (
                    (clientesFidelidade || []).filter(c => c.nome.toLowerCase().includes(buscaFidelidade.toLowerCase())).map(cliente => (
                      <div 
                        key={cliente.id} onClick={() => { if(vincularClienteFidelidade) vincularClienteFidelidade(comandaAtiva.id, cliente); setBuscaFidelidade(''); setMostrarResultadosFidelidade(false); setBuscaMobileAberta(false); }}
                        className={`p-3 sm:p-2 cursor-pointer border-b last:border-0 flex justify-between items-center transition ${temaNoturno ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <div>
                          <p className={`text-sm sm:text-xs font-bold ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{cliente.nome}</p>
                          <p className="text-[10px] text-gray-500 font-bold mt-0.5">{cliente.pontos} pontos acumulados</p>
                        </div>
                        <span className={`text-sm sm:text-xs font-black px-2 py-1 rounded-md ${temaNoturno ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'}`}>+</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={alternarTipoComanda}
              title={`Mudar para ${comandaAtiva?.tipo === 'Balcão' ? 'Delivery' : 'Balcão'}`}
              className={`flex items-center shrink-0 gap-1.5 px-2 py-1 xl:px-3 xl:py-1.5 rounded-lg text-xs font-bold transition border active:scale-95 ml-2 ${
                comandaAtiva?.tipo === 'Delivery' 
                  ? (temaNoturno ? 'bg-orange-900/30 text-orange-400 border-orange-800/50 hover:bg-orange-900/50' : 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100') 
                  : (temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800/50 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100')
              }`}
            >
              {comandaAtiva?.tipo === 'Delivery' ? (
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
      
      {/* SEÇÃO DIREITA */}
      <div className="flex flex-1 justify-end items-center gap-3 xl:gap-5 min-w-0">
        <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-2 rounded-full shrink-0 border transition-all duration-500 hover:scale-110 active:scale-95 ${temaNoturno ? 'bg-gray-800 border-gray-600 text-purple-400 rotate-0' : 'bg-gray-50 border-gray-200 text-yellow-500 rotate-[360deg]'}`}>
          {temaNoturno ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          )}
        </button>
        
        <div className="hidden xl:block relative shrink-0 cursor-pointer max-w-[200px]" onClick={() => setMostrarMenuPerfil(!mostrarMenuPerfil)}>
          <div className="flex items-center gap-3 hover:opacity-80 transition w-full">
            <div className="flex flex-col text-right min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1 truncate">{nomeEmpresa}</span>
              <span className={`font-black text-xs 2xl:text-sm leading-none truncate ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`}>{sessao?.nome_usuario || 'Usuário'}</span>
            </div>
            <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center ${temaNoturno ? 'border-gray-600 bg-gray-700' : 'border-purple-200 bg-purple-50'}`}>
               <img src={logoEmpresa} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={`text-xs ml-0.5 shrink-0 transition-transform duration-300 ${mostrarMenuPerfil ? 'rotate-180' : ''} ${temaNoturno ? 'text-gray-500' : 'text-gray-300'}`}>▼</span>
          </div>
          
          {mostrarMenuPerfil && (
            <div className={`absolute top-14 right-0 shadow-2xl rounded-2xl p-2 w-56 border z-50 animate-in slide-in-from-top-2 fade-in duration-200 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              {sessao?.role === 'dono' && <button onClick={() => { setMostrarConfigEmpresa(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold transition rounded-xl ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Configurar Loja</button>}
              {sessao?.role === 'dono' && <button onClick={() => { setMostrarAdminUsuarios(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold transition rounded-xl ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Equipe</button>}
              {(sessao?.role === 'dono' || sessao?.perm_cardapio) && <button onClick={() => { setMostrarAdminProdutos(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold transition rounded-xl ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Cardápio</button>}
              {sessao?.role === 'dono' && <button onClick={() => { setMostrarConfigTags(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold transition rounded-xl ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Tags</button>}
              {sessao?.role === 'dono' && <button onClick={() => { setMostrarAdminDelivery(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold transition rounded-xl ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>Delivery</button>}
              <div className="h-px my-1 bg-gray-500/10"></div>
              <button onClick={fazerLogout} className="w-full text-left p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition">Sair do Sistema</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}