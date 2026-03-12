'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminProdutos({ empresaId, onFechar, temaNoturno }) {
  const [abaConfig, setAbaConfig] = useState('produtos'); 
  const [categorias, setCategorias] = useState([]);
  const [configPeso, setConfigPeso] = useState([]);
  const [loading, setLoading] = useState(true);

  const [novoItem, setNovoItem] = useState({ nome: '', preco: '', custo: '', idCategoria: '' });
  const [editandoItem, setEditandoItem] = useState(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  
  const [novoPeso, setNovoPeso] = useState({ nome: '', preco: '', custo: '' });
  const [editandoPeso, setEditandoPeso] = useState(null);

  // Estados para Importação em Massa
  const [textoImportacao, setTextoImportacao] = useState('');
  const [importando, setImportando] = useState(false);

  const fetchDados = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('categorias').select('*, produtos(*)').eq('empresa_id', empresaId); 
    if (catData) setCategorias(catData);
    
    const { data: pesoData } = await supabase.from('config_peso').select('*').eq('empresa_id', empresaId);
    if (pesoData) setConfigPeso(pesoData);
    
    setLoading(false);
  };

  useEffect(() => { fetchDados(); }, [empresaId]);

  const salvarCategoria = async () => {
    if (novaCategoria.trim() === '') return alert("Digite um nome.");
    await supabase.from('categorias').insert([{ nome: novaCategoria, empresa_id: empresaId }]);
    setNovaCategoria(''); fetchDados();
  };

  const excluirCategoria = async (id) => {
    if (confirm("Excluir esta categoria apagará TODOS os produtos dentro dela. Deseja continuar?")) {
      await supabase.from('categorias').delete().eq('id', id);
      fetchDados();
    }
  };

  const salvarProduto = async () => {
    if (!novoItem.nome || !novoItem.preco || !novoItem.idCategoria) return alert("Preencha nome, preço e categoria.");
    const payload = { 
      nome: novoItem.nome, 
      preco: parseFloat(novoItem.preco.toString().replace(',', '.')), 
      custo: novoItem.custo ? parseFloat(novoItem.custo.toString().replace(',', '.')) : 0,
      categoria_id: novoItem.idCategoria,
      empresa_id: empresaId 
    };

    if (editandoItem) {
      await supabase.from('produtos').update(payload).eq('id', editandoItem.id);
    } else {
      await supabase.from('produtos').insert([payload]);
    }
    
    setEditandoItem(null);
    setNovoItem({ nome: '', preco: '', custo: '', idCategoria: novoItem.idCategoria });
    fetchDados();
  };

  const toggleFavorito = async (id, statusAtual) => {
    await supabase.from('produtos').update({ favorito: !statusAtual }).eq('id', id);
    fetchDados();
  };

  const excluirProduto = async (id) => {
    if (confirm("Excluir este produto?")) {
      await supabase.from('produtos').delete().eq('id', id);
      fetchDados();
    }
  };

  const carregarEdicaoProduto = (prod) => {
    setEditandoItem(prod);
    setNovoItem({ nome: prod.nome, preco: prod.preco, custo: prod.custo, idCategoria: prod.categoria_id });
  };

  const salvarPeso = async () => {
    if (!novoPeso.nome || !novoPeso.preco) return alert("Preencha nome e preço por KG.");
    const payload = { 
      nome: novoPeso.nome, 
      preco_kg: parseFloat(novoPeso.preco.toString().replace(',', '.')),
      custo_kg: novoPeso.custo ? parseFloat(novoPeso.custo.toString().replace(',', '.')) : 0,
      empresa_id: empresaId
    };

    if (editandoPeso) {
      await supabase.from('config_peso').update(payload).eq('id', editandoPeso.id);
    } else {
      await supabase.from('config_peso').insert([payload]);
    }
    
    setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); fetchDados();
  };

  const carregarEdicaoPeso = (peso) => {
    setEditandoPeso(peso); setNovoPeso({ nome: peso.nome, preco: peso.preco_kg, custo: peso.custo_kg });
  };

  const excluirPeso = async (id) => {
    if (confirm("Remover esta opção de peso?")) {
      await supabase.from('config_peso').delete().eq('id', id); fetchDados();
    }
  };

  // --- LÓGICA DE IMPORTAÇÃO EM MASSA ---
  const processarImportacaoMassa = async () => {
    if (!textoImportacao.trim()) return alert("Cole o texto com o cardápio para importar.");
    setImportando(true);

    const linhas = textoImportacao.split('\n');
    let categoriaAtual = '';
    const mapaCategorias = {}; 

    // 1. Interpretar o texto digitado
    for (let linha of linhas) {
      linha = linha.trim();
      if (!linha) continue;

      if (linha.startsWith('#')) {
        categoriaAtual = linha.replace('#', '').trim();
        if (!mapaCategorias[categoriaAtual]) mapaCategorias[categoriaAtual] = [];
      } else {
        if (!categoriaAtual) {
          categoriaAtual = 'Geral';
          if (!mapaCategorias[categoriaAtual]) mapaCategorias[categoriaAtual] = [];
        }
        
        const partes = linha.split('|').map(p => p.trim());
        const nome = partes[0];
        const preco = parseFloat((partes[1] || '0').replace(',', '.'));
        const custo = parseFloat((partes[2] || '0').replace(',', '.'));

        if (nome && !isNaN(preco)) {
          mapaCategorias[categoriaAtual].push({ nome, preco, custo });
        }
      }
    }

    try {
      // 2. Mapear Categorias Existentes
      const categoriasExistentes = [...categorias];
      const mapCatIds = {}; 
      categoriasExistentes.forEach(c => mapCatIds[c.nome.toLowerCase()] = c.id);

      let totalAdicionados = 0;

      // 3. Processar Criação de Categorias e Produtos
      for (const catNome of Object.keys(mapaCategorias)) {
        let catId = mapCatIds[catNome.toLowerCase()];
        
        // Se a categoria não existe, cria ela agora
        if (!catId) {
           const { data: novaCat, error } = await supabase.from('categorias').insert([{ nome: catNome, empresa_id: empresaId }]).select().single();
           if (novaCat) {
             catId = novaCat.id;
             mapCatIds[catNome.toLowerCase()] = catId;
           }
        }

        // Prepara os produtos dessa categoria para inserir tudo de uma vez
        if (catId) {
          const produtosParaInserir = mapaCategorias[catNome].map(p => ({
            nome: p.nome,
            preco: p.preco,
            custo: p.custo,
            categoria_id: catId,
            empresa_id: empresaId
          }));

          if (produtosParaInserir.length > 0) {
            const { error } = await supabase.from('produtos').insert(produtosParaInserir);
            if (!error) totalAdicionados += produtosParaInserir.length;
          }
        }
      }

      alert(`Importação concluída! ${totalAdicionados} produtos adicionados com sucesso.`);
      setTextoImportacao('');
      setAbaConfig('produtos');
      fetchDados();

    } catch (e) {
      console.error(e);
      alert("Ocorreu um erro durante a importação. Verifique o formato do texto.");
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[55]">
      <div className={`rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] border ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        
        <div className={`flex justify-between items-center mb-6 border-b pb-4 ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-xl md:text-2xl font-black ${temaNoturno ? 'text-white' : 'text-purple-800'}`}>Gerenciar Cardápio</h2>
          <button onClick={onFechar} className={`p-3 rounded-full font-bold transition ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200'}`}>✕</button>
        </div>

        <div className={`flex gap-2 p-1 rounded-xl mb-6 overflow-x-auto border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <button onClick={() => setAbaConfig('produtos')} className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap ${abaConfig === 'produtos' ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-400' : 'text-gray-500')}`}>Cardápio Padrão</button>
          <button onClick={() => setAbaConfig('peso')} className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap flex items-center gap-2 ${abaConfig === 'peso' ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-400' : 'text-gray-500')}`}>⚖️ Venda no Peso</button>
          <button onClick={() => setAbaConfig('categorias')} className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap ${abaConfig === 'categorias' ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-400' : 'text-gray-500')}`}>Categorias</button>
          <button onClick={() => setAbaConfig('importacao')} className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap flex items-center gap-2 ${abaConfig === 'importacao' ? (temaNoturno ? 'bg-green-600 text-white shadow-sm' : 'bg-green-500 text-white shadow-sm') : (temaNoturno ? 'text-green-500' : 'text-green-600')}`}>⚡ Importação em Massa</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
          {loading ? <p className="text-center text-purple-500 font-bold">A carregar...</p> : (
            <>
              {/* ABA PRODUTOS */}
              {abaConfig === 'produtos' && (
                <div>
                   <div className={`p-5 rounded-2xl mb-6 border grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-purple-100'}`}>
                    <select className={`p-3 rounded-xl border outline-none text-sm font-bold md:col-span-4 transition ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-700'}`} value={novoItem.idCategoria} onChange={e => setNovoItem({...novoItem, idCategoria: e.target.value})}>
                      <option value="">Selecione a Categoria</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    
                    <input type="text" placeholder="Nome do Produto" className={`p-3 rounded-xl border outline-none text-sm md:col-span-2 transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200'}`} value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} />
                    <input type="number" placeholder="Preço de Venda (R$)" className={`p-3 rounded-xl border outline-none text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200'}`} value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: e.target.value})} />
                    <input type="number" placeholder="Custo Bruto (Opcional)" className={`p-3 rounded-xl border outline-none text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200'}`} value={novoItem.custo} onChange={e => setNovoItem({...novoItem, custo: e.target.value})} />
                    
                    <div className="md:col-span-4 flex gap-2">
                      <button onClick={salvarProduto} className="flex-1 bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition">{editandoItem ? 'Atualizar Produto' : 'Cadastrar Produto'}</button>
                      {editandoItem && <button onClick={() => { setEditandoItem(null); setNovoItem({ nome: '', preco: '', custo: '', idCategoria: novoItem.idCategoria }); }} className={`px-6 font-bold rounded-xl transition ${temaNoturno ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-300 text-gray-700'}`}>Cancelar</button>}
                    </div>
                  </div>

                  {categorias.map(cat => (
                    <div key={cat.id} className="mb-6">
                      <h3 className={`text-sm font-black uppercase mb-3 px-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-800'}`}>{cat.nome}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cat.produtos?.map(p => (
                           <div key={p.id} className={`p-3 rounded-2xl border flex flex-col justify-between shadow-sm transition ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-purple-200'}`}>
                             <div className="flex justify-between items-start mb-2">
                               <span className={`font-bold text-sm truncate pr-2 ${temaNoturno ? 'text-gray-200' : 'text-gray-700'}`}>{p.nome}</span>
                               <button onClick={() => toggleFavorito(p.id, p.favorito)} className={`text-lg transition-transform hover:scale-110 ${p.favorito ? '' : 'grayscale opacity-30 hover:grayscale-0 hover:opacity-100'}`}>⭐</button>
                             </div>
                             <div className="flex justify-between items-end mt-2">
                               <div className="flex flex-col">
                                 <span className="text-green-500 font-black tracking-tight leading-none mb-1">R$ {p.preco.toFixed(2)}</span>
                                 <span className={`text-[10px] font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Custo: R$ {(p.custo||0).toFixed(2)}</span>
                               </div>
                               <div className="flex gap-1">
                                 <button onClick={() => carregarEdicaoProduto(p)} className={`p-1.5 rounded-lg transition ${temaNoturno ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>✏️</button>
                                 <button onClick={() => excluirProduto(p.id)} className={`p-1.5 rounded-lg transition ${temaNoturno ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>🗑️</button>
                               </div>
                             </div>
                           </div>
                        ))}
                        {(!cat.produtos || cat.produtos.length === 0) && <p className={`text-xs italic px-2 col-span-full ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Vazio</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ABA PESO */}
              {abaConfig === 'peso' && (
                <div>
                   <div className={`p-5 rounded-2xl mb-6 border grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-purple-100'}`}>
                    <input type="text" placeholder="Nome (Ex: Açaí Tradicional)" className={`p-3 rounded-xl border outline-none text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200'}`} value={novoPeso.nome} onChange={e => setNovoPeso({...novoPeso, nome: e.target.value})} />
                    <input type="number" placeholder="Preço do KG (Ex: 49.90)" className={`p-3 rounded-xl border outline-none text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200'}`} value={novoPeso.preco} onChange={e => setNovoPeso({...novoPeso, preco: e.target.value})} />
                    <input type="number" placeholder="Custo do KG (Opcional)" className={`p-3 rounded-xl border outline-none text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200'}`} value={novoPeso.custo} onChange={e => setNovoPeso({...novoPeso, custo: e.target.value})} />
                    <div className="md:col-span-3 flex gap-2">
                       <button onClick={salvarPeso} className="flex-1 bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition shadow-sm">{editandoPeso ? 'Atualizar KG' : 'Cadastrar KG'}</button>
                       {editandoPeso && <button onClick={() => { setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); }} className={`px-6 font-bold rounded-xl transition ${temaNoturno ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-300 text-gray-700'}`}>Cancelar</button>}
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse mt-4">
                    <thead><tr className={`text-xs uppercase border-b ${temaNoturno ? 'text-gray-500 border-gray-800' : 'text-gray-400'}`}><th className="pb-2">Nome na Balança</th><th className="pb-2 text-right">Preço KG</th><th className="pb-2 text-right">Custo KG</th><th className="pb-2 text-right">Ações</th></tr></thead>
                    <tbody>
                      {configPeso.map(p => (
                        <tr key={p.id} className={`border-b transition text-sm ${temaNoturno ? 'border-gray-800 hover:bg-gray-800/50 text-gray-200' : 'border-gray-50 hover:bg-gray-50 text-gray-700'}`}>
                          <td className="py-3 font-bold">{p.nome}</td>
                          <td className="py-3 text-right text-green-500 font-black">R$ {parseFloat(p.preco_kg).toFixed(2)}</td>
                          <td className={`py-3 text-right ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>R$ {parseFloat(p.custo_kg || 0).toFixed(2)}</td>
                          <td className="py-3 flex justify-end gap-2">
                            <button onClick={() => carregarEdicaoPeso(p)} className={`p-1.5 rounded-md transition ${temaNoturno ? 'bg-blue-900/20 hover:bg-blue-900/40 text-blue-400' : 'text-blue-500 hover:text-blue-700 bg-blue-50'}`}>✏️</button>
                            <button onClick={() => excluirPeso(p.id)} className={`p-1.5 rounded-md transition ${temaNoturno ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400' : 'text-red-500 hover:text-red-700 bg-red-50'}`}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {configPeso.length === 0 && <p className={`text-center text-sm mt-8 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum preço de balança configurado.</p>}
                </div>
              )}

              {/* ABA CATEGORIAS */}
              {abaConfig === 'categorias' && (
                <div className="max-w-xl mx-auto">
                  <div className="flex gap-2 mb-6">
                    <input type="text" placeholder="Nova Categoria (Ex: Bebidas)" className={`flex-1 p-3 rounded-xl border outline-none text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`} value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarCategoria()} />
                    <button onClick={salvarCategoria} className="bg-purple-600 text-white font-bold px-6 rounded-xl hover:bg-purple-700 transition shadow-sm">Adicionar</button>
                  </div>
                  <ul className="space-y-2">
                    {categorias.map(cat => (
                      <li key={cat.id} className={`flex justify-between items-center p-4 rounded-xl border transition ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                        <span className="font-bold">{cat.nome}</span>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] uppercase font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>{cat.produtos?.length || 0} itens</span>
                          <button onClick={() => excluirCategoria(cat.id)} className={`p-1.5 rounded-md transition ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>🗑️</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ABA IMPORTAÇÃO EM MASSA */}
              {abaConfig === 'importacao' && (
                <div className="flex flex-col gap-4">
                  <div className={`p-4 rounded-2xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-100'}`}>
                    <h3 className={`font-black mb-2 flex items-center gap-2 ${temaNoturno ? 'text-blue-400' : 'text-blue-700'}`}>
                      Instruções de Importação
                    </h3>
                    <p className={`text-sm mb-3 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>
                      Copie e cole o cardápio abaixo. Para criar categorias, inicie a linha com o símbolo <b>#</b>. Para os produtos, separe o nome, o preço e o custo (opcional) usando uma barra vertical (<b>|</b>).
                    </p>
                    <div className={`p-3 rounded-lg text-xs font-mono whitespace-pre-wrap ${temaNoturno ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'}`}>
{`# Bebidas
Coca-Cola Lata | 6.50 | 3.00
Suco de Laranja | 8.00

# Lanches
X-Tudo | 25.00 | 12.00
Cachorro Quente | 15.00`}
                    </div>
                    <p className={`text-xs mt-3 italic ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>
                      Dica: Você pode pedir para uma Inteligência Artificial formatar o PDF do seu cliente neste formato!
                    </p>
                  </div>

                  <textarea 
                    className={`w-full h-64 p-4 rounded-xl border outline-none font-mono text-sm resize-y transition focus:border-green-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                    placeholder="Cole seu cardápio aqui..."
                    value={textoImportacao}
                    onChange={(e) => setTextoImportacao(e.target.value)}
                  ></textarea>

                  <button 
                    onClick={processarImportacaoMassa}
                    disabled={importando}
                    className={`w-full py-4 font-black text-lg rounded-xl transition shadow-lg ${importando ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    {importando ? 'A processar itens...' : 'Processar e Salvar Cardápio'}
                  </button>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}