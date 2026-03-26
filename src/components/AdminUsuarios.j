'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminUsuarios({ empresaId, usuarioAtualId, onFechar, temaNoturno }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoUser, setNovoUser] = useState({ email: '', senha: '', nome_usuario: '', role: 'funcionario', perm_faturamento: false, perm_estudo: false, perm_cardapio: false });
  const [editando, setEditando] = useState(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data } = await supabase.from('usuarios').select('*').eq('empresa_id', empresaId).order('role', { ascending: true });
    if (data) setUsuarios(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, [empresaId]);

  const salvarUsuario = async () => {
    if (!novoUser.email || !novoUser.senha || !novoUser.nome_usuario) return alert("Preencha e-mail, senha e nome.");
    
    // Se for dono, força todas as permissões
    let payload = { ...novoUser, empresa_id: empresaId };
    if (payload.role === 'dono') {
      payload.perm_faturamento = true; payload.perm_estudo = true; payload.perm_cardapio = true;
    }

    if (editando) {
      await supabase.from('usuarios').update(payload).eq('id', editando.id);
    } else {
      const { data } = await supabase.from('usuarios').select('id').eq('email', novoUser.email).single();
      if (data) return alert("Este e-mail já está em uso.");
      // MÁGICA: Inserimos o garçom no banco já configurado para resetar a senha
      await supabase.from('usuarios').insert([{ ...payload, primeiro_login: true }]);
    }
    
    setEditando(null);
    setNovoUser({ email: '', senha: '', nome_usuario: '', role: 'funcionario', perm_faturamento: false, perm_estudo: false, perm_cardapio: false });
    fetchUsuarios();
  };

  const excluirUsuario = async (id, role) => {
    if (id === usuarioAtualId) return alert("Você não pode excluir a si mesmo.");
    if (role === 'dono') return alert("O dono do estabelecimento não pode ser excluído.");
    if (confirm("Deseja realmente excluir este acesso?")) {
      await supabase.from('usuarios').delete().eq('id', id);
      fetchUsuarios();
    }
  };

  const carregarEdicao = (u) => {
    setEditando(u);
    setNovoUser({ email: u.email, senha: u.senha, nome_usuario: u.nome_usuario, role: u.role, perm_faturamento: u.perm_faturamento, perm_estudo: u.perm_estudo, perm_cardapio: u.perm_cardapio });
  };

  const isBloqueadoDono = novoUser.role === 'dono';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
      <div className={`rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] border ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className={`flex justify-between items-center mb-6 border-b pb-4 ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-xl lg:text-2xl font-black ${temaNoturno ? 'text-white' : 'text-purple-800'}`}>Gestão de Equipe</h2>
          <button onClick={onFechar} className={`p-3 rounded-full font-bold transition ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200'}`}>✕</button>
        </div>

        <div className={`p-5 rounded-2xl mb-6 border grid grid-cols-1 md:grid-cols-2 gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-purple-100'}`}>
          <input type="text" placeholder="Nome do Funcionário" className={`p-3 rounded-xl border outline-none text-sm focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`} value={novoUser.nome_usuario} onChange={e => setNovoUser({...novoUser, nome_usuario: e.target.value})} />
          <input type="email" placeholder="E-mail de Login" className={`p-3 rounded-xl border outline-none text-sm focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`} value={novoUser.email} onChange={e => setNovoUser({...novoUser, email: e.target.value})} />
          <input type="text" placeholder="Senha Provisória" className={`p-3 rounded-xl border outline-none text-sm focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`} value={novoUser.senha} onChange={e => setNovoUser({...novoUser, senha: e.target.value})} />
          
          <select className={`p-3 rounded-xl border outline-none text-sm font-bold transition disabled:opacity-50 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-700'}`} value={novoUser.role} onChange={e => setNovoUser({...novoUser, role: e.target.value})} disabled={editando && editando.role === 'dono' && editando.id !== usuarioAtualId}>
            <option value="funcionario">Perfil: Funcionário (Restrito)</option>
            <option value="dono">Perfil: Dono (Acesso Total)</option>
          </select>

          <div className={`md:col-span-2 p-3 rounded-xl border flex flex-wrap gap-4 items-center transition ${isBloqueadoDono ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${temaNoturno ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-200'}`}>
            <span className="text-xs font-bold uppercase">Permissões Especiais:</span>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isBloqueadoDono ? true : novoUser.perm_faturamento} disabled={isBloqueadoDono} onChange={e => setNovoUser({...novoUser, perm_faturamento: e.target.checked})} className="accent-purple-600" /> Ver Faturamento</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isBloqueadoDono ? true : novoUser.perm_estudo} disabled={isBloqueadoDono} onChange={e => setNovoUser({...novoUser, perm_estudo: e.target.checked})} className="accent-purple-600" /> Ver Público-Alvo</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isBloqueadoDono ? true : novoUser.perm_cardapio} disabled={isBloqueadoDono} onChange={e => setNovoUser({...novoUser, perm_cardapio: e.target.checked})} className="accent-purple-600" /> Editar Cardápio</label>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button onClick={salvarUsuario} className="flex-1 bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition shadow-sm">{editando ? 'Atualizar Acesso' : 'Cadastrar Acesso'}</button>
            {editando && <button onClick={() => { setEditando(null); setNovoUser({ email: '', senha: '', nome_usuario: '', role: 'funcionario', perm_faturamento: false, perm_estudo: false, perm_cardapio: false }); }} className={`px-6 font-bold rounded-xl transition ${temaNoturno ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-300 text-gray-700'}`}>Cancelar</button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? <p className="text-center text-purple-500 font-bold">Carregando equipe...</p> : (
            <table className="w-full text-left border-collapse">
              <thead><tr className={`text-xs uppercase border-b ${temaNoturno ? 'text-gray-500 border-gray-800' : 'text-gray-400'}`}><th className="pb-2">Nome</th><th className="pb-2 hidden sm:table-cell">Login</th><th className="pb-2 text-center">Nível</th><th className="pb-2 text-right">Ações</th></tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className={`border-b transition text-sm ${temaNoturno ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                    <td className={`py-3 font-bold ${temaNoturno ? 'text-gray-200' : 'text-gray-700'}`}>{u.nome_usuario} {u.id === usuarioAtualId && <span className={`text-[9px] px-1.5 py-0.5 rounded ml-2 ${temaNoturno ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>VOCÊ</span>}</td>
                    <td className={`py-3 hidden sm:table-cell ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{u.email}</td>
                    <td className="py-3 text-center"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${u.role === 'dono' ? (temaNoturno ? 'bg-purple-900/30 border-purple-800 text-purple-400' : 'bg-purple-50 border-purple-100 text-purple-700') : (temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600')}`}>{u.role}</span></td>
                    <td className="py-3 flex justify-end gap-2">
                      <button onClick={() => carregarEdicao(u)} className={`p-1.5 rounded-md transition ${temaNoturno ? 'bg-blue-900/20 hover:bg-blue-900/40 text-blue-400' : 'text-blue-500 hover:text-blue-700 bg-blue-50'}`}>✏️</button>
                      <button onClick={() => excluirUsuario(u.id, u.role)} disabled={u.id === usuarioAtualId || u.role === 'dono'} className={`p-1.5 rounded-md transition disabled:opacity-20 disabled:cursor-not-allowed ${temaNoturno ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400' : 'text-red-500 hover:text-red-700 bg-red-50'}`}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}