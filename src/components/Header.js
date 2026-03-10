'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({
  comandaAtiva, setIdSelecionado, setMenuMobileAberto, temaNoturno,
  caixaAtual, abaAtiva, setAbaAtiva, logoEmpresa, setTemaNoturno,
  mostrarMenuPerfil, setMostrarMenuPerfil, nomeEmpresa, sessao,
  setMostrarConfigEmpresa, setMostrarAdminUsuarios, setMostrarAdminProdutos,
  setMostrarConfigTags, setMostrarModalCaixa, fazerLogout, 
  fetchData // Recebemos a função aqui
}) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [tempNome, setTempNome] = useState('');

  const formatarDataCaixa = (data) => {
    if (!data) return "---";
    return data.substring(0, 10).split('-').reverse().join('/');
  };

  const iniciarEdicao = () => {
    setTempNome(comandaAtiva?.nome || '');
    setEditandoNome(true);
  };

  const salvarNomeComanda = async () => {
    if (!tempNome.trim() || tempNome === comandaAtiva.nome) {
      return setEditandoNome(false);
    }
    
    const { error } = await supabase
      .from('comandas')
      .update({ nome: tempNome })
      .eq('id', comandaAtiva.id);

    if (!error) {
      // ATUALIZAÇÃO INSTANTÂNEA:
      // Chamamos a função do pai para atualizar a lista sem precisar de F5
      if (fetchData) await fetchData(); 
    } else {
      alert("Erro ao atualizar nome.");
    }
    setEditandoNome(false);
  };

  return (
    <header className={`flex items-center justify-between p-3 xl:p-4 rounded-3xl shadow-sm border mb-6 sticky top-0 z-40 transition-colors duration-500 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      
      {/* --- ESQUERDA: Botão Voltar ou Caixa --- */}
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
            <div onClick={() => setMostrarModalCaixa && setMostrarModalCaixa(true)} className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer hover:scale-105 transition-transform ${temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100'}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>
                Caixa Aberto: {formatarDataCaixa(caixaAtual?.data_abertura)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* --- CENTRO: Nome da Comanda (Editável) --- */}
      <div className="flex justify-center shrink-0 max-w-[40%]">
        {!comandaAtiva ? (
          <div className={`hidden xl:flex rounded-xl p-1 text-sm border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-100/80 border-gray-200/50'}`}>
            <button onClick={() => setAbaAtiva('comandas')} className={`px-4 py-2 rounded-lg font-bold transition ${abaAtiva === 'comandas' ? (temaNoturno ? 'bg-gray-700 text-white' : 'bg-white text-purple-800 shadow-sm') : 'text-gray-500'}`}>Comandas</button>
            <button onClick={() => setAbaAtiva('fechadas')} className={`px-4 py-2 rounded-lg font-bold transition ${abaAtiva === 'fechadas' ? (temaNoturno ? 'bg-gray-700 text-white' : 'bg-white text-purple-800 shadow-sm') : 'text-gray-500'}`}>Encerradas</button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            {editandoNome ? (
              <input 
                autoFocus
                type="text"
                className={`text-center font-black text-lg p-1 rounded-lg border-2 border-purple-500 outline-none w-full max-w-[200px] ${temaNoturno ? 'bg-gray-900 text-white' : 'bg-white text-purple-900'}`}
                value={tempNome}
                onChange={(e) => setTempNome(e.target.value)}
                onBlur={salvarNomeComanda}
                onKeyDown={(e) => e.key === 'Enter' && salvarNomeComanda()}
              />
            ) : (
              <h2 
                className={`text-lg font-black truncate text-center cursor-pointer hover:opacity-70 transition flex items-center gap-2 ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`} 
                onClick={iniciarEdicao}
              >
                {comandaAtiva?.nome} <span className="text-[10px] opacity-40">✏️</span>
              </h2>
            )}
          </div>
        )}
      </div>
      
      {/* --- DIREITA --- */}
      <div className="flex flex-1 justify-end items-center gap-2 xl:gap-6">
        <button onClick={() => setTemaNoturno(!temaNoturno)} className="p-2">
          {temaNoturno ? '🌙' : '☀️'}
        </button>
        <div className={`w-10 h-10 rounded-full border-2 overflow-hidden ${temaNoturno ? 'border-gray-600' : 'border-purple-200'}`}>
           <img src={logoEmpresa} alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
}