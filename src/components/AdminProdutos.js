'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminProdutos({ empresaId, onFechar }) {
  const [abaConfig, setAbaConfig] = useState('produtos'); 
  const [categorias, setCategorias] = useState([]);
  const [configPeso, setConfigPeso] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos formulários
  const [novoItem, setNovoItem] = useState({ nome: '', preco: '', custo: '', idCategoria: '' });
  const [editandoItem, setEditandoItem] = useState(null);
  
  const [novaCategoria, setNovaCategoria] = useState('');
  
  const [novoPeso, setNovoPeso] = useState({ nome: '', preco: '', custo: '' });
  const [editandoPeso, setEditandoPeso] = useState(null); // NOVO: Estado para controlar a edição do peso

  const fetchDados = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('categorias').select('*, produtos(*)').eq('empresa_id', empresaId); 
    if (catData) setCategorias(catData.map(cat => ({ id: cat.id, nome: cat.nome, itens: cat.produtos || [] })));

    const { data: pesoData } = await supabase.from('config_peso').select('*').eq('empresa_id', empresaId);
    if (pesoData) setConfigPeso(pesoData);
    setLoading(false);
  };

  useEffect(() => { if (empresaId) fetchDados(); }, [empresaId]);

  // --- CATEGORIAS ---
  const adicionarCategoria = async () => {
    if (!novaCategoria) return;
    await supabase.from('categorias').insert([{ nome: novaCategoria, empresa_id: empresaId }]);
    fetchDados(); setNovaCategoria('');
  };

  const excluirCategoria = async (id) => {
    const cat = categorias.find(c => c.id === id);
    if (cat.itens.length > 0) return alert("Esta categoria possui produtos. Exclua ou mova-os primeiro.");
    if (confirm("Excluir categoria?")) { await supabase.from('categorias').delete().eq('id', id); fetchDados(); }
  };

  // --- PRODUTOS ---
  const salvarProduto = async () => {
    if (!novoItem.nome || !novoItem.preco || !novoItem.idCategoria) return alert("Preencha todos os campos!");
    const precoNum = parseFloat(novoItem.preco); const custoNum = parseFloat(novoItem.custo || 0);
    if (custoNum > precoNum) return alert("⚠️ ERRO: O Custo não pode ser maior que o Preço de Venda!");

    const payload = { categoria_id: novoItem.idCategoria, nome: novoItem.nome, preco: precoNum, custo: custoNum, favorito: editandoItem ? editandoItem.favorito : false, empresa_id: empresaId };

    if (editandoItem) await supabase.from('produtos').update(payload).eq('id', editandoItem.id);
    else await supabase.from('produtos').insert([payload]);
    
    fetchDados(); setEditandoItem(null); setNovoItem({ nome: '', preco: '', custo: '', idCategoria: categorias[0]?.id || '' });
  };

  const excluirProduto = async (idProduto) => { if (confirm("Excluir este produto?")) { await supabase.from('produtos').delete().eq('id', idProduto); fetchDados(); } };
  const toggleFavorito = async (produto) => { await supabase.from('produtos').update({ favorito: !produto.favorito }).eq('id', produto.id); fetchDados(); };
  const carregarParaEdicao = (catId, produto) => { setEditandoItem(produto); setNovoItem({ nome: produto.nome, preco: produto.preco, custo: produto.custo || '', idCategoria: catId }); setAbaConfig('produtos'); };

  // --- AÇAÍ NO PESO ---
  const salvarPeso = async () => {
    if (!novoPeso.nome || !novoPeso.preco) return alert("Preencha o nome e o preço de venda por kg.");
    
    const payload = { 
      nome: novoPeso.nome, 
      preco_kg: parseFloat(novoPeso.preco), 
      custo_kg: parseFloat(novoPeso.custo || 0), 
      empresa_id: empresaId 
    };

    if (editandoPeso) {
      // Se estiver editando, faz um UPDATE
      const { error } = await supabase.from('config_peso').update(payload).eq('id', editandoPeso.id);
      if (error) return alert("⚠️ Erro ao atualizar: " + error.message);
    } else {
      // Se não, faz um INSERT
      const { error } = await supabase.from('config_peso').insert([payload]);
      if (error) return alert("⚠️ Erro ao adicionar: " + error.message);
    }

    fetchDados(); 
    setEditandoPeso(null);
    setNovoPeso({ nome: '', preco: '', custo: '' });
  };

  const carregarParaEdicaoPeso = (pesoConfig) => {
    setEditandoPeso(pesoConfig);
    setNovoPeso({ 
      nome: pesoConfig.nome, 
      preco: pesoConfig.preco_kg, 
      custo: pesoConfig.custo_kg || '' 
    });
  };

  const excluirPeso = async (id) => {
    if (configPeso.length === 1) return alert("Você precisa ter pelo menos uma opção de peso.");
    if (confirm("Excluir esta configuração?")) { await supabase.from('config_peso').delete().eq('id', id); fetchDados(); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[55]">
      <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-black text-purple-800">📦 Gerenciar Cardápio</h2>
          <button onClick={onFechar} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 font-bold transition">✕</button>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          <button onClick={() => setAbaConfig('produtos')} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${abaConfig === 'produtos' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>Produtos</button>
          <button onClick={() => setAbaConfig('categorias')} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${abaConfig === 'categorias' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>Categorias</button>
          <button onClick={() => setAbaConfig('peso')} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${abaConfig === 'peso' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>Açaí no Peso</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><p className="text-purple-600 font-bold animate-pulse">Sincronizando...</p></div>
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
                        <thead><tr className="text-gray-400 text-[10px] uppercase"><th className="p-2">Fav.</th><th className="p-2 w-1/2">Produto</th><th className="p-2 text-center">Custo</th><th className="p-2 text-center">Venda</th><th className="p-2 text-right">Ações</th></tr></thead>
                        <tbody>
                          {cat.itens.map(p => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition text-sm">
                              <td className="p-2 cursor-pointer text-lg" onClick={() => toggleFavorito(p)}>{p.favorito ? '⭐' : '☆'}</td>
                              <td className="p-2 font-bold text-gray-700">{p.nome}</td>
                              <td className="p-2 text-center text-red-400 font-medium">R$ {(p.custo || 0).toFixed(2)}</td>
                              <td className="p-2 text-center text-green-600 font-bold">R$ {p.preco.toFixed(2)}</td>
                              <td className="p-2 text-right flex justify-end gap-2"><button onClick={() => carregarParaEdicao(cat.id, p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-md">✏️</button><button onClick={() => excluirProduto(p.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md">🗑️</button></td>
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
                  <input type="text" placeholder="Nome da Categoria (Ex: Salgados)" className="flex-1 p-3 rounded-xl border border-purple-200 outline-none" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} />
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

            {abaConfig === 'peso' && (
              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <input type="text" placeholder="Ex: Preço Normal" className="p-3 rounded-xl border border-purple-200 outline-none" value={novoPeso.nome} onChange={e => setNovoPeso({...novoPeso, nome: e.target.value})} />
                  <input type="number" placeholder="Venda /kg (R$)" className="p-3 rounded-xl border border-purple-200 outline-none" value={novoPeso.preco} onChange={e => setNovoPeso({...novoPeso, preco: e.target.value})} />
                  <input type="number" placeholder="Custo /kg (R$)" className="p-3 rounded-xl border border-purple-200 outline-none" value={novoPeso.custo} onChange={e => setNovoPeso({...novoPeso, custo: e.target.value})} />
                  
                  {/* Botões de Salvar/Cancelar atualizados para a Edição do Peso */}
                  <div className="flex gap-2">
                    <button onClick={salvarPeso} className="flex-1 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md transition">
                      {editandoPeso ? 'Salvar' : 'Adicionar'}
                    </button>
                    {editandoPeso && (
                      <button onClick={() => { setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); }} className="bg-gray-300 text-gray-700 px-3 rounded-xl font-bold">✕</button>
                    )}
                  </div>

                </div>
                <div className="flex-1 overflow-y-auto">
                  {configPeso.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50">
                      <span className="font-bold text-gray-700">{p.nome}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-red-400 font-medium">Custo: R$ {(p.custo_kg || 0).toFixed(2)}/kg</span>
                        <span className="font-black text-green-600">Venda: R$ {parseFloat(p.preco_kg).toFixed(2)}/kg</span>
                        
                        {/* Botões de Ação Atualizados */}
                        <div className="flex gap-2 ml-2">
                          <button onClick={() => carregarParaEdicaoPeso(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-md">✏️</button>
                          <button onClick={() => excluirPeso(p.id)} className="text-red-500 font-bold bg-red-50 p-1.5 rounded-md">🗑️</button>
                        </div>

                      </div>
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