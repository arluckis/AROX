'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminUsuarios({ empresaId, usuarioAtualId, onFechar }) {
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
    const payload = { ...novoUser, empresa_id: empresaId };

    if (editando) {
      await supabase.from('usuarios').update(payload).eq('id', editando.id);
    } else {
      const { data, error } = await supabase.from('usuarios').select('id').eq('email', novoUser.email).single();
      if (data) return alert("Este e-mail já está em uso.");
      await supabase.from('usuarios').insert([payload]);
    }
    
    setEditando(null);
    setNovoUser({ email: '', senha: '', nome_usuario: '', role: 'funcionario', perm_faturamento: false, perm_estudo: false, perm_cardapio: false });
    fetchUsuarios();
  };

  const excluirUsuario = async (id) => {
    if (id === usuarioAtualId) return alert("Você não pode excluir a si mesmo.");
    if (confirm("Deseja realmente excluir este acesso?")) {
      await supabase.from('usuarios').delete().eq('id', id);
      fetchUsuarios();
    }
  };

  const carregarEdicao = (u) => {
    setEditando(u);
    setNovoUser({ email: u.email, senha: u.senha, nome_usuario: u.nome_usuario, role: u.role, perm_faturamento: u.perm_faturamento, perm_estudo: u.perm_estudo, perm_cardapio: u.perm_cardapio });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-black text-purple-800">👥 Gestão de Equipe</h2>
          <button onClick={onFechar} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 font-bold transition">✕</button>
        </div>

        <div className="bg-purple-50 p-5 rounded-2xl mb-6 border border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Nome do Funcionário" className="p-3 rounded-xl border outline-none text-sm" value={novoUser.nome_usuario} onChange={e => setNovoUser({...novoUser, nome_usuario: e.target.value})} />
          <input type="email" placeholder="E-mail de Login" className="p-3 rounded-xl border outline-none text-sm" value={novoUser.email} onChange={e => setNovoUser({...novoUser, email: e.target.value})} />
          <input type="text" placeholder="Senha de Acesso" className="p-3 rounded-xl border outline-none text-sm" value={novoUser.senha} onChange={e => setNovoUser({...novoUser, senha: e.target.value})} />
          
          <select className="p-3 rounded-xl border outline-none text-sm font-bold text-gray-700" value={novoUser.role} onChange={e => setNovoUser({...novoUser, role: e.target.value})}>
            <option value="funcionario">Perfil: Funcionário (Restrito)</option>
            <option value="dono">Perfil: Dono (Acesso Total)</option>
          </select>

          <div className="md:col-span-2 bg-white p-3 rounded-xl border flex flex-wrap gap-4 items-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Permissões Especiais:</span>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={novoUser.perm_faturamento} onChange={e => setNovoUser({...novoUser, perm_faturamento: e.target.checked})} /> Ver Faturamento</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={novoUser.perm_estudo} onChange={e => setNovoUser({...novoUser, perm_estudo: e.target.checked})} /> Ver Público-Alvo</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={novoUser.perm_cardapio} onChange={e => setNovoUser({...novoUser, perm_cardapio: e.target.checked})} /> Editar Cardápio</label>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button onClick={salvarUsuario} className="flex-1 bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition">{editando ? 'Atualizar Acesso' : 'Cadastrar Acesso'}</button>
            {editando && <button onClick={() => { setEditando(null); setNovoUser({ email: '', senha: '', nome_usuario: '', role: 'funcionario', perm_faturamento: false, perm_estudo: false, perm_cardapio: false }); }} className="bg-gray-300 text-gray-700 px-6 font-bold rounded-xl">Cancelar</button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? <p className="text-center text-purple-500">Carregando...</p> : (
            <table className="w-full text-left border-collapse">
              <thead><tr className="text-gray-400 text-xs uppercase border-b"><th className="pb-2">Nome</th><th className="pb-2">Login</th><th className="pb-2 text-center">Nível</th><th className="pb-2 text-right">Ações</th></tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition text-sm">
                    <td className="py-3 font-bold text-gray-700">{u.nome_usuario} {u.id === usuarioAtualId && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">VOCÊ</span>}</td>
                    <td className="py-3 text-gray-500">{u.email}</td>
                    <td className="py-3 text-center"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${u.role === 'dono' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                    <td className="py-3 flex justify-end gap-2">
                      <button onClick={() => carregarEdicao(u)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-md">✏️</button>
                      <button onClick={() => excluirUsuario(u.id)} disabled={u.id === usuarioAtualId} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md disabled:opacity-30">🗑️</button>
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