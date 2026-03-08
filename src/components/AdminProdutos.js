'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Importando nosso conector!

export default function AdminProdutos({ onFechar }) {
  const [abaConfig, setAbaConfig] = useState('produtos'); 
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos formulários
  const [novoItem, setNovoItem] = useState({ nome: '', preco: '', custo: '', idCategoria: '' });
  const [editandoItem, setEditandoItem] = useState(null);
  const [novaCategoria, setNovaCategoria] = useState('');

  // 1. CARREGAR DADOS DO SUPABASE
  const fetchCategoriasEProdutos = async () => {
    setLoading(true);
    // O Supabase permite trazer a Categoria e todos os Produtos dela de uma vez só!
    const { data, error } = await supabase
      .from('categorias')
      .select('*, produtos(*)'); 
    
    if (error) {
      console.error(error);
      alert("Erro ao buscar dados do banco.");
    } else {
      // Formata pro padrão que o nosso front-end já entende
      const formatado = data.map(cat => ({
        id: cat.id,
        nome: cat.nome,
        itens: cat.produtos || []
      }));
      setCategorias(formatado);
      if (formatado.length > 0 && !novoItem.idCategoria) {
        setNovoItem(prev => ({ ...prev, idCategoria: formatado[0].id }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategoriasEProdutos();
  }, []);

  // 2. LÓGICA DE CATEGORIAS (NUVEM)
  const adicionarCategoria = async () => {
    if (!novaCategoria) return;
    const { data, error } = await supabase.from('categorias').insert([{ nome: novaCategoria }]).select();
    if (!error) {
      setCategorias([...categorias, { id: data[0].id, nome: data[0].nome, itens: [] }]);
      setNovaCategoria('');
      if (!novoItem.idCategoria) setNovoItem(prev => ({ ...prev, idCategoria: data[0].id }));
    }
  };

  const excluirCategoria = async (id) => {
    const cat = categorias.find(c => c.id === id);
    if (cat.itens.length > 0) return alert("Esta categoria possui produtos. Exclua ou mova-os primeiro.");
    if (confirm("Excluir esta categoria do banco de dados?")) {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (!error) setCategorias(categorias.filter(c => c.id !== id));
    }
  };

  // 3. LÓGICA DE PRODUTOS (NUVEM)
  const salvarProduto = async () => {
    if (!novoItem.nome || !novoItem.preco || !novoItem.idCategoria) return alert("Preencha todos os campos!");
    
    const precoNum = parseFloat(novoItem.preco);
    const custoNum = parseFloat(novoItem.custo || 0);
    if (custoNum > precoNum) return alert("⚠️ ERRO: O Custo não pode ser maior que o Preço de Venda!");

    const payload = {
      categoria_id: novoItem.idCategoria,
      nome: novoItem.nome,
      preco: precoNum,
      custo: custoNum,
      favorito: editandoItem ? editandoItem.favorito : false
    };

    if (editandoItem) {
      // UPDATE
      const { error } = await supabase.from('produtos').update(payload).eq('id', editandoItem.id);
      if (!error) fetchCategoriasEProdutos(); // Recarrega para garantir sincronia
      setEditandoItem(null);
    } else {
      // INSERT
      const { error } = await supabase.from('produtos').insert([payload]);
      if (!error) fetchCategoriasEProdutos();
    }
    setNovoItem({ nome: '', preco: '', custo: '', idCategoria: categorias[0]?.id || '' });
  };

  const excluirProduto = async (idProduto) => {
    if (confirm("Excluir este produto do banco de dados?")) {
      const { error } = await supabase.from('produtos').delete().eq('id', idProduto);
      if (!error) fetchCategoriasEProdutos();
    }
  };

  const toggleFavorito = async (produto) => {
    const novoStatus = !produto.favorito;
    const { error } = await supabase.from('produtos').update({ favorito: novoStatus }).eq('id', produto.id);
    if (!error) fetchCategoriasEProdutos();
  };

  const carregarParaEdicao = (catId, produto) => {
    setEditandoItem(produto);
    setNovoItem({ nome: produto.nome, preco: produto.preco, custo: produto.custo || '', idCategoria: catId });
    setAbaConfig('produtos');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-purple-800">Gerenciar Cardápio <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">Online</span></h2>
          <button onClick={onFechar} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 font-bold transition">✕</button>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          <button onClick={() => setAbaConfig('produtos')} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${abaConfig === 'produtos' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>Produtos</button>
          <button onClick={() => setAbaConfig('categorias')} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${abaConfig === 'categorias' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>Categorias</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><p className="text-purple-600 font-bold animate-pulse">Sincronizando com o banco...</p></div>
        ) : (
          <>
            {abaConfig === 'produtos' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <select className="p-3 rounded-xl border border-purple-200 outline-none focus:border-purple-500 text-sm" value={novoItem.idCategoria} onChange={e => setNovoItem({...novoItem, idCategoria: e.target.value})}>
                    {categorias.length === 0 && <option value="">Crie uma categoria primeiro</option>}
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                  </select>
                  <input type="text" placeholder="Nome do Produto" className="p-3 rounded-xl border border-purple-200 outline-none focus:border-purple-500 text-sm" value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} />
                  <input type="number" placeholder="Venda (R$)" className="p-3 rounded-xl border border-purple-200 outline-none focus:border-purple-500 text-sm" value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: e.target.value})} />
                  <input type="number" placeholder="Custo (R$)" className="p-3 rounded-xl border border-purple-200 outline-none focus:border-purple-500 text-sm" value={novoItem.custo} onChange={e => setNovoItem({...novoItem, custo: e.target.value})} />
                  <div className="flex gap-2">
                    <button onClick={salvarProduto} disabled={categorias.length === 0} className="flex-1 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow-md disabled:opacity-50">{editandoItem ? 'Salvar' : 'Adicionar'}</button>
                    {editandoItem && <button onClick={() => { setEditandoItem(null); setNovoItem({ nome: '', preco: '', custo: '', idCategoria: categorias[0]?.id || '' }); }} className="bg-gray-300 text-gray-700 px-3 rounded-xl font-bold">✕</button>}
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 pr-2">
                  {categorias.map(cat => (
                    <div key={cat.id} className="mb-6">
                      <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">{cat.nome}</h3>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-gray-400 text-[10px] uppercase">
                            <th className="p-2">Fav.</th><th className="p-2 w-1/2">Produto</th><th className="p-2 text-center">Custo</th><th className="p-2 text-center">Venda</th><th className="p-2 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.itens.map(p => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition text-sm">
                              <td className="p-2 cursor-pointer text-lg" onClick={() => toggleFavorito(p)} title="Favoritar Produto">{p.favorito ? '⭐' : '☆'}</td>
                              <td className="p-2 font-bold text-gray-700">{p.nome}</td>
                              <td className="p-2 text-center text-red-400 font-medium">R$ {(p.custo || 0).toFixed(2)}</td>
                              <td className="p-2 text-center text-green-600 font-bold">R$ {p.preco.toFixed(2)}</td>
                              <td className="p-2 text-right flex justify-end gap-2">
                                <button onClick={() => carregarParaEdicao(cat.id, p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-md">✏️</button>
                                <button onClick={() => excluirProduto(p.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md">🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </>
            )}

            {abaConfig === 'categorias' && (
              <div className="flex-1 flex flex-col">
                <div className="flex gap-3 mb-6 bg-purple-50 p-4 rounded-2xl">
                  <input type="text" placeholder="Nome da Nova Categoria (Ex: Salgados)" className="flex-1 p-3 rounded-xl border border-purple-200 outline-none" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} />
                  <button onClick={adicionarCategoria} className="bg-purple-600 text-white font-bold px-6 rounded-xl hover:bg-purple-700">+ Add Categoria</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {categorias.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50">
                      <span className="font-bold text-gray-700">{cat.nome} <span className="text-xs text-gray-400 font-normal ml-2">({cat.itens.length} produtos)</span></span>
                      <button onClick={() => excluirCategoria(cat.id)} className="text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}