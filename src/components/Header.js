// src/components/Header.js
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

  const mapAbaTitulo = {
    comandas: 'Painel Operacional',
    fechadas: 'Contas Encerradas',
    faturamento: 'Controle Financeiro',
    caixa: 'Gestão de Caixa',
    fidelidade: 'Base de Clientes'
  };

  return (
    <header className={`flex items-center justify-between px-4 md:px-8 py-3.5 border-b relative z-40 transition-colors duration-500 backdrop-blur-md sticky top-0 ${temaNoturno ? 'bg-[#0f1115]/90 border-white/[0.04]' : 'bg-white/90 border-zinc-200'}`}>
      
      {/* SEÇÃO ESQUERDA: Ações de Retorno ou Título */}
      <div className="flex flex-1 justify-start items-center gap-3 min-w-0">
        <button onClick={() => setMenuMobileAberto(true)} className={`xl:hidden p-2 rounded-lg border shrink-0 transition active:scale-95 ${temaNoturno ? 'bg-[#161a20] border-white/10 text-zinc-300 hover:bg-white/5' : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 shadow-sm'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        {comandaAtiva ? (
          <button onClick={() => { setIdSelecionado(null); setEditandoNome(false); }} className={`flex items-center shrink-0 gap-2 font-medium px-3 py-1.5 rounded-lg transition active:scale-[0.98] text-sm border ${temaNoturno ? 'bg-[#161a20] text-zinc-300 border-white/[0.06] hover:bg-white/5 hover:text-white shadow-sm' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            <span className="hidden sm:inline">Voltar</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className={`text-[15px] font-semibold tracking-tight hidden md:block ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {mapAbaTitulo[abaAtiva] || 'Overview'}
            </h1>
          </div>
        )}
      </div>

      {/* SEÇÃO CENTRAL: Ações da Conta (Elegante) */}
      <div className="flex justify-center items-center shrink min-w-0">
        {comandaAtiva && (
          <div className="flex items-center justify-center gap-2 relative w-full max-w-lg">
            
            {editandoNome ? (
              <input 
                autoFocus
                className={`text-center font-medium text-sm px-4 py-1.5 rounded-lg outline-none w-full transition-all shadow-sm focus:ring-2 focus:ring-offset-0 ${temaNoturno ? 'bg-[#161a20] text-white border border-white/10 focus:border-white/20 focus:ring-white/5' : 'bg-white text-zinc-900 border border-zinc-300 focus:ring-zinc-100'}`}
                value={tempNome} onChange={e => setTempNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => e.key === 'Enter' && salvarNome()}
              />
            ) : (
              <h2 onClick={() => { setTempNome(comandaAtiva?.nome || ''); setEditandoNome(true); }} className={`text-[15px] font-semibold truncate text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${temaNoturno ? 'text-zinc-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-950'}`}>
                {comandaAtiva?.nome || 'Conta sem nome'} 
                <svg className="w-3 h-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </h2>
            )}

            {/* Busca Fidelidade (Nativa/Sutil) */}
            <button 
              onClick={() => setBuscaMobileAberta(!buscaMobileAberta)}
              className={`sm:hidden flex items-center shrink-0 justify-center p-1.5 rounded-lg transition-all active:scale-[0.98] ml-1 ${buscaMobileAberta ? (temaNoturno ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-900') : (temaNoturno ? 'bg-transparent text-zinc-400 hover:bg-white/5' : 'bg-transparent text-zinc-500 hover:bg-zinc-100')}`}
            >
              <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </button>

            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 sm:mt-0 sm:translate-x-0 sm:relative sm:top-auto sm:left-auto sm:block z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${buscaMobileAberta ? 'block w-64' : 'hidden'}`}>
              <div className="flex items-center relative ml-3">
                <svg className={`absolute left-2.5 w-3.5 h-3.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <input 
                  type="text" placeholder="Vincular cliente..." value={buscaFidelidade} onChange={(e) => { setBuscaFidelidade(e.target.value); setMostrarResultadosFidelidade(true); }} onFocus={() => setMostrarResultadosFidelidade(true)}
                  className={`pl-8 pr-3 py-1.5 text-[13px] font-medium rounded-lg border transition-colors outline-none w-full sm:w-44 shadow-sm ${temaNoturno ? 'bg-[#161a20] border-white/[0.06] text-white focus:border-white/20' : 'bg-white border-zinc-200 focus:border-zinc-300 text-zinc-900 placeholder:text-zinc-400'}`}
                />
              </div>
              
              {mostrarResultadosFidelidade && buscaFidelidade.length > 0 && (
                <div className={`absolute top-full mt-2 left-0 w-full sm:w-64 max-h-48 overflow-y-auto rounded-xl border shadow-xl z-[60] animate-in fade-in zoom-in-95 duration-200 ${temaNoturno ? 'bg-[#1c2128] border-white/10' : 'bg-white border-zinc-200'}`}>
                  {(clientesFidelidade || []).filter(c => c.nome.toLowerCase().includes(buscaFidelidade.toLowerCase())).length === 0 ? (
                    <div className={`p-3 text-[13px] font-medium text-center ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Não encontrado.</div>
                  ) : (
                    (clientesFidelidade || []).filter(c => c.nome.toLowerCase().includes(buscaFidelidade.toLowerCase())).map(cliente => (
                      <div 
                        key={cliente.id} onClick={() => { if(vincularClienteFidelidade) vincularClienteFidelidade(comandaAtiva.id, cliente); setBuscaFidelidade(''); setMostrarResultadosFidelidade(false); setBuscaMobileAberta(false); }}
                        className={`p-3 sm:p-2 cursor-pointer border-b last:border-0 flex justify-between items-center transition-colors ${temaNoturno ? 'border-white/5 hover:bg-white/5' : 'border-zinc-100 hover:bg-zinc-50'}`}
                      >
                        <div>
                          <p className={`text-[13px] font-medium ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>{cliente.nome}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{cliente.pontos} pontos</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${temaNoturno ? 'text-zinc-400 bg-white/5' : 'text-zinc-600 bg-zinc-100'}`}>+</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Alternar Modalidade */}
            <button 
              onClick={alternarTipoComanda}
              title={`Mudar para ${comandaAtiva?.tipo === 'Balcão' ? 'Delivery' : 'Balcão'}`}
              className={`flex items-center shrink-0 gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border active:scale-[0.98] ml-2 shadow-sm ${
                comandaAtiva?.tipo === 'Delivery' 
                  ? (temaNoturno ? 'bg-[#161a20] text-zinc-200 border-white/[0.08] hover:bg-[#1c2128]' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50')
                  : (temaNoturno ? 'bg-transparent text-zinc-400 border-transparent hover:bg-white/5 hover:text-zinc-200' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-100 hover:text-zinc-800')
              }`}
            >
              {comandaAtiva?.tipo === 'Delivery' ? (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l3 5v6H8m12-11v11M8 7V5a2 2 0 00-2-2H3v14h1m4-12v12m0 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m16 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m-8-2h4"></path></svg>
                  <span className="hidden xl:inline">Delivery</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  <span className="hidden xl:inline">Balcão</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* SEÇÃO DIREITA: Status e Perfil */}
      <div className="flex flex-1 justify-end items-center gap-3 xl:gap-4 min-w-0">
        
        {/* Status Caixa Mínimo (Elegante) */}
        {!comandaAtiva && (
          <div onClick={() => { setAbaAtiva('caixa'); setIdSelecionado(null); }} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all active:scale-[0.98] ${
            statusCaixa === 'aberto' ? (temaNoturno ? 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-400' : 'bg-emerald-50/50 border-emerald-200/80 text-emerald-700') : 
            statusCaixa === 'esquecido' ? (temaNoturno ? 'bg-amber-500/[0.04] border-amber-500/20 text-amber-400' : 'bg-amber-50/50 border-amber-200/80 text-amber-700') : 
            (temaNoturno ? 'bg-[#161a20] border-white/5 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500')
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCaixa === 'aberto' ? 'bg-emerald-500 animate-pulse' : statusCaixa === 'esquecido' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-500'}`}></span>
            <span className="text-[11px] font-medium tracking-wide hidden lg:inline">
              {statusCaixa === 'aberto' ? 'Operação ativa' : statusCaixa === 'esquecido' ? 'Pendência' : 'Caixa fechado'}
            </span>
          </div>
        )}

        <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-1.5 rounded-lg border transition-all duration-200 active:scale-[0.98] ${temaNoturno ? 'bg-[#161a20] border-white/[0.06] text-zinc-400 hover:text-white shadow-sm' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800 shadow-sm'}`}>
          {temaNoturno ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          )}
        </button>
        
        <div className="relative shrink-0 cursor-pointer" onClick={() => setMostrarMenuPerfil(!mostrarMenuPerfil)}>
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full">
            <div className={`w-8 h-8 rounded-full border overflow-hidden shrink-0 flex items-center justify-center shadow-sm ${temaNoturno ? 'border-white/10 bg-[#161a20]' : 'border-zinc-200 bg-white'}`}>
               <img src={logoEmpresa} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:flex flex-col text-left min-w-0">
              <span className={`font-medium text-[13px] leading-none truncate ${temaNoturno ? 'text-zinc-200' : 'text-zinc-900'}`}>{sessao?.nome_usuario || 'Usuário'}</span>
            </div>
          </div>
          
          {mostrarMenuPerfil && (
            <div className={`absolute top-12 right-0 shadow-2xl rounded-xl p-1.5 w-56 border z-50 animate-in slide-in-from-top-2 fade-in duration-200 backdrop-blur-xl ${temaNoturno ? 'bg-[#111318]/95 border-white/10' : 'bg-white/95 border-zinc-200'}`}>
              {sessao?.role === 'dono' && <button onClick={() => { setMostrarConfigEmpresa(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-2.5 text-[13px] font-medium transition-colors rounded-lg ${temaNoturno ? 'text-zinc-300 hover:bg-white/5 hover:text-white' : 'text-zinc-700 hover:bg-zinc-50'}`}>Ajustes do Sistema</button>}
              <div className={`h-px my-1 ${temaNoturno ? 'bg-white/5' : 'bg-zinc-100'}`}></div>
              <button onClick={fazerLogout} className="w-full text-left p-2.5 text-[13px] font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> Encerrar sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}