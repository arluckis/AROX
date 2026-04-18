// AdminProdutos.jsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminProdutos({ empresaId, temaNoturno }) {
  const [painelAtivo, setPainelAtivo] = useState('lista'); 
  const [loading, setLoading] = useState(true);
  
  const [notificacao, setNotificacao] = useState({ show: false, tipo: '', mensagem: '' });
  const [categorias, setCategorias] = useState([]);
  const [configPeso, setConfigPeso] = useState([]);
  
  const [buscaProduto, setBuscaProduto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [novoItem, setNovoItem] = useState({ nome: '', preco: '', custo: '', idCategoria: '', codigo: '' });
  
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [isModalEdicaoAberto, setIsModalEdicaoAberto] = useState(false);

  const [novaCategoria, setNovaCategoria] = useState('');
  const [editandoCategoriaId, setEditandoCategoriaId] = useState(null);
  const [nomeCategoriaEditando, setNomeCategoriaEditando] = useState('');
  const [novoPeso, setNovoPeso] = useState({ nome: '', preco: '', custo: '' });
  const [editandoPeso, setEditandoPeso] = useState(null);

  const fetchDados = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('categorias').select('*, produtos(*)').eq('empresa_id', empresaId).order('nome'); 
    if (catData) setCategorias(catData);
    const { data: pesoData } = await supabase.from('config_peso').select('*').eq('empresa_id', empresaId).order('nome');
    if (pesoData) setConfigPeso(pesoData);
    setLoading(false);
  };

  useEffect(() => { if(empresaId) fetchDados(); }, [empresaId]);

  const mostrarAviso = (mensagem, tipo = 'erro') => {
    setNotificacao({ show: true, tipo, mensagem });
    setTimeout(() => setNotificacao({ show: false, tipo: '', mensagem: '' }), 4000);
  };

  const gerarMenorCodigoDisponivel = () => {
    const codigosExistentes = categorias.flatMap(cat => cat.produtos || []).map(p => parseInt(p.codigo)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    let candidato = 1;
    for (let i = 0; i < codigosExistentes.length; i++) {
      if (codigosExistentes[i] === candidato) candidato++;
      else if (codigosExistentes[i] > candidato) break;
    }
    return candidato.toString();
  };

  const calcularProgressoProduto = () => {
    let p = 0;
    if (novoItem.idCategoria) p += 25;
    if (novoItem.nome.trim().length > 2) p += 25;
    if (novoItem.preco && parseFloat(novoItem.preco) > 0) p += 25;
    if (novoItem.custo && parseFloat(novoItem.custo) > 0) p += 25;
    return p;
  };

  const salvarProdutoNovo = async () => {
    if (calcularProgressoProduto() < 100) return mostrarAviso("Preencha os campos essenciais.");
    const precoNum = parseFloat(novoItem.preco.toString().replace(',', '.'));
    const custoNum = parseFloat((novoItem.custo || 0).toString().replace(',', '.'));
    if (custoNum > 0 && custoNum < precoNum * 0.10) return mostrarAviso("Alerta de precificação: Custo inferior a 10%.");

    const payload = { nome: novoItem.nome, preco: precoNum, custo: custoNum, categoria_id: novoItem.idCategoria, empresa_id: empresaId, codigo: novoItem.codigo || gerarMenorCodigoDisponivel() };
    await supabase.from('produtos').insert([payload]); 
    mostrarAviso("Registro efetuado com sucesso.", "sucesso");
    setNovoItem({ nome: '', preco: '', custo: '', idCategoria: novoItem.idCategoria, codigo: '' }); 
    setPainelAtivo('lista'); 
    fetchDados();
  };

  const salvarEdicaoProduto = async () => {
    if (!produtoEditando?.nome || !produtoEditando?.preco || !produtoEditando?.categoria_id) return mostrarAviso("Informações incompletas.");
    const precoNum = parseFloat(produtoEditando.preco.toString().replace(',', '.'));
    const custoNum = parseFloat((produtoEditando.custo || 0).toString().replace(',', '.'));
    const payload = { nome: produtoEditando.nome, preco: precoNum, custo: custoNum, categoria_id: produtoEditando.categoria_id, codigo: produtoEditando.codigo };
    
    await supabase.from('produtos').update(payload).eq('id', produtoEditando.id); 
    mostrarAviso("Alterações aplicadas.", "sucesso");
    fecharModalEdicao();
    fetchDados();
  };

  const abrirModalEdicao = (prod) => {
    setProdutoEditando({ ...prod, custo: prod.custo || '' });
    setIsModalEdicaoAberto(true);
  };

  const fecharModalEdicao = () => {
    setIsModalEdicaoAberto(false);
    setTimeout(() => setProdutoEditando(null), 200); 
  };

  const excluirProduto = async (id) => { 
    if (confirm("Deseja remover este registro permanentemente?")) { 
      await supabase.from('produtos').delete().eq('id', id); 
      fetchDados(); 
      mostrarAviso("Registro excluído.", "sucesso"); 
    } 
  };

  const salvarCategoria = async () => { if (novaCategoria.trim() === '') return mostrarAviso("Insira a nomenclatura do setor."); await supabase.from('categorias').insert([{ nome: novaCategoria, empresa_id: empresaId }]); setNovaCategoria(''); fetchDados(); mostrarAviso("Setor mapeado.", "sucesso"); };
  const salvarEdicaoCategoria = async (id) => { if (!nomeCategoriaEditando.trim()) return; await supabase.from('categorias').update({ nome: nomeCategoriaEditando }).eq('id', id); setEditandoCategoriaId(null); fetchDados(); };
  const excluirCategoria = async (id) => { if (confirm("ATENÇÃO: A deleção do setor removerá TODOS os itens vinculados. Prosseguir?")) { await supabase.from('categorias').delete().eq('id', id); fetchDados(); } };
  
  const salvarPeso = async () => {
    if (!novoPeso.nome || !novoPeso.preco || !novoPeso.custo) return mostrarAviso("Defina os parâmetros do granel.");
    const payload = { nome: novoPeso.nome, preco_kg: parseFloat(novoPeso.preco.toString().replace(',', '.')), custo_kg: parseFloat(novoPeso.custo.toString().replace(',', '.')), empresa_id: empresaId };
    if (editandoPeso) { await supabase.from('config_peso').update(payload).eq('id', editandoPeso.id); } 
    else { await supabase.from('config_peso').insert([payload]); }
    setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); fetchDados(); 
  };

  const categoriasFiltradas = categorias.map(cat => ({ ...cat, produtos: (cat.produtos || []).filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase())) })).filter(cat => (filtroCategoria === '' || cat.id === filtroCategoria) && (buscaProduto === '' || cat.produtos.length > 0));

  // --- DESIGN SYSTEM PREMIUM ---
  const isDark = temaNoturno;
  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const borderSubtle = isDark ? 'border-white/5' : 'border-zinc-200/60';
  const borderFocus = isDark ? 'focus:border-zinc-500 focus:ring-zinc-500/20' : 'focus:border-zinc-400 focus:ring-zinc-400/20';
  
  const labelArox = `block text-[11px] font-semibold tracking-wide uppercase mb-1.5 ${textSecondary}`;
  const inputArox = `w-full h-10 px-3 rounded-lg border text-[13px] font-medium transition-all outline-none bg-transparent ${borderSubtle} ${borderFocus} ${textPrimary} shadow-sm`;
  const btnPrimary = `h-10 px-4 rounded-lg text-[13px] font-semibold transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 ${isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`;
  const btnSecondary = `h-10 px-4 rounded-lg text-[13px] font-medium transition-all shadow-sm border active:scale-[0.98] flex items-center justify-center gap-2 ${isDark ? 'bg-transparent border-white/10 text-white hover:bg-white/5' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`;
  const cardPanel = `p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${isDark ? 'bg-[#121214] border-white/5 shadow-2xl' : 'bg-white border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'} flex flex-col w-full relative`;

  const navTabClass = "px-4 py-2 rounded-lg text-[12px] font-semibold tracking-wide transition-all outline-none shrink-0 whitespace-nowrap";
  const navTabActive = `${navTabClass} shadow-sm ${isDark ? 'bg-[#27272A] text-white' : 'bg-white text-zinc-900 ring-1 ring-black/5'}`;
  const navTabInactive = `${navTabClass} ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`;

  return (
    <div className={`max-w-[800px] mx-auto w-full px-5 sm:px-8 py-10 flex flex-col h-full relative animate-in fade-in duration-500 font-sans pb-32`}>
      
      {notificacao.show && (
        <div className={`fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl text-[13px] font-medium shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-2 border ${notificacao.tipo === 'erro' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900/50 dark:text-rose-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-900/50 dark:text-emerald-200'}`}>
          {notificacao.mensagem}
        </div>
      )}

      {/* HEADER DA SEÇÃO */}
      <div className="w-full flex flex-col gap-6 mb-8">
        <div>
          <h2 className={`text-[24px] font-bold tracking-tight leading-none ${textPrimary}`}>Gestão de Cardápio</h2>
          <p className={`text-[13px] mt-1.5 ${textSecondary}`}>Estruture e precifique seu catálogo de vendas.</p>
        </div>
        
        <div className="overflow-x-auto scrollbar-hide pb-2 -mb-2">
          <div className={`inline-flex items-center p-1 rounded-xl self-start ${isDark ? 'bg-[#18181B] ring-1 ring-white/5' : 'bg-zinc-100/80 ring-1 ring-zinc-200/50'}`}>
            <button onClick={() => setPainelAtivo('lista')} className={painelAtivo === 'lista' ? navTabActive : navTabInactive}>Catálogo Ativo</button>
            <button onClick={() => { setNovoItem({ nome: '', preco: '', custo: '', idCategoria: '', codigo: gerarMenorCodigoDisponivel() }); setPainelAtivo('novo_produto'); }} className={painelAtivo === 'novo_produto' ? navTabActive : navTabInactive}>Novo Produto</button>
            <button onClick={() => setPainelAtivo('categorias')} className={painelAtivo === 'categorias' ? navTabActive : navTabInactive}>Mapear Setores</button>
            <button onClick={() => setPainelAtivo('peso')} className={painelAtivo === 'peso' ? navTabActive : navTabInactive}>Venda por Peso</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center w-full py-20 gap-3 animate-in fade-in">
          <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-zinc-400' : 'border-zinc-600'}`}></div>
          <p className={`text-[11px] font-bold tracking-widest uppercase ${textSecondary}`}>Sincronizando base de dados...</p>
        </div>
      ) : (
        <div className="w-full h-full relative">
          
          {painelAtivo === 'lista' && (
            <div className="animate-in fade-in duration-300 ease-out">
              
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                  <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input type="text" placeholder="Buscar produto ou referência (ID)..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} className={`${inputArox} pl-10`} />
                </div>
                <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className={`${inputArox} md:w-56 cursor-pointer appearance-none`}>
                  <option value="">Todos os Setores</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              {categoriasFiltradas.length === 0 && (
                <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed transition-all ${isDark ? 'border-white/10 bg-white/[0.01]' : 'border-zinc-300 bg-zinc-50/50'}`}>
                  <p className={`text-[13px] font-medium ${textSecondary}`}>Nenhum registro localizado nos parâmetros atuais.</p>
                </div>
              )}

              {categoriasFiltradas.map((cat) => (
                <div key={cat.id} className="mb-10">
                  <div className={`flex items-center justify-between pb-3 mb-5 border-b ${borderSubtle}`}>
                    <h3 className={`text-[14px] font-bold tracking-wide uppercase ${textPrimary}`}>{cat.nome}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-600'}`}>{cat.produtos.length} Itens</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cat.produtos.map((p, i) => (
                      <div key={p.id} className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-in slide-in-from-bottom-2 fade-in fill-mode-both ${isDark ? 'bg-[#121214] border-white/5 hover:border-white/10 shadow-black/50' : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'}`} style={{animationDelay: `${Math.min(i * 30, 300)}ms`}}>
                        
                        <div className="flex justify-between items-start mb-4">
                          {p.codigo ? (
                            <span className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold tracking-widest ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
                              ID {p.codigo}
                            </span>
                          ) : <div/>}
                          
                          <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => abrirModalEdicao(p)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`} title="Editar">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button onClick={() => excluirProduto(p.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-100 text-rose-600'}`} title="Excluir">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </div>

                        <span className={`font-semibold text-[15px] leading-tight mb-5 line-clamp-2 ${textPrimary}`}>{p.nome}</span>
                        
                        <div className={`flex justify-between items-end mt-auto pt-4 border-t transition-colors ${isDark ? 'border-white/5 group-hover:border-white/10' : 'border-zinc-100 group-hover:border-zinc-200'}`}>
                          <div className="flex flex-col">
                            <span className={`font-black text-[18px] tracking-tight leading-none ${textPrimary}`}>
                              <span className="text-[12px] font-bold text-zinc-500 mr-0.5">R$</span>
                              {p.preco.toFixed(2)}
                            </span>
                          </div>
                          {p.custo > 0 && (
                             <span className={`text-[11px] font-semibold ${textSecondary}`}>Custo: R$ {p.custo.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {painelAtivo === 'novo_produto' && (
            <div className="w-full animate-in fade-in duration-300 pb-10">
              
              <div className="w-full mb-6">
                <div className={`h-1.5 w-full rounded-full overflow-hidden shadow-inner ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`}>
                  <div className={`h-full transition-all duration-700 ease-out rounded-full ${calcularProgressoProduto() === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${calcularProgressoProduto()}%` }}></div>
                </div>
                <div className="flex justify-between mt-2.5">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${textSecondary}`}>Registro Sistêmico</span>
                  <span className={`text-[11px] font-bold ${calcularProgressoProduto() === 100 ? 'text-emerald-500' : textSecondary}`}>{calcularProgressoProduto()}% Completo</span>
                </div>
              </div>

              <div className={cardPanel}>
                <div className={`pb-3 mb-6 border-b ${borderSubtle}`}>
                  <h3 className={`text-[14px] font-semibold tracking-wide uppercase ${textPrimary}`}>Parâmetros do Produto</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className={labelArox}>Nomenclatura do Registro *</label>
                    <input type="text" placeholder="Ex: Hambúrguer Artesanal Smash" className={inputArox} value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} autoFocus />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelArox}>Setor de Venda *</label>
                      <select className={`${inputArox} cursor-pointer appearance-none text-zinc-500`} value={novoItem.idCategoria} onChange={e => setNovoItem({...novoItem, idCategoria: e.target.value})}>
                        <option value="" disabled hidden>Selecione um setor...</option>
                        {categorias.map(c => <option key={c.id} value={c.id} className="text-zinc-900 dark:text-white">{c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelArox}>Gerador de ID (Automático)</label>
                      <input type="text" readOnly className={`${inputArox} opacity-50 cursor-not-allowed`} value={`# ${novoItem.codigo || 'Sistêmico'}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div>
                      <label className={labelArox}>Valor de Mercado (R$) *</label>
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium ${textSecondary}`}>R$</span>
                        <input type="number" step="0.01" placeholder="0.00" className={`${inputArox} pl-8`} value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className={labelArox}>Custo Operacional (R$)</label>
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium ${textSecondary}`}>R$</span>
                        <input type="number" step="0.01" placeholder="0.00" className={`${inputArox} pl-8`} value={novoItem.custo} onChange={e => setNovoItem({...novoItem, custo: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`mt-8 pt-6 border-t flex justify-end ${borderSubtle}`}>
                  <button 
                    disabled={calcularProgressoProduto() < 100} 
                    onClick={salvarProdutoNovo} 
                    className={`${btnPrimary} ${calcularProgressoProduto() < 100 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Confirmar Registro
                  </button>
                </div>
              </div>
            </div>
          )}

          {isModalEdicaoAberto && produtoEditando && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300`} onClick={fecharModalEdicao}></div>
              
              <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 ease-out flex flex-col border ${isDark ? 'bg-[#18181B] border-white/10' : 'bg-white border-zinc-200'}`}>
                
                <div className={`px-6 py-5 flex items-center justify-between border-b ${borderSubtle}`}>
                  <div>
                    <h3 className={`text-[16px] font-bold tracking-tight ${textPrimary}`}>Edição de Parâmetros</h3>
                    <p className={`text-[11px] font-mono mt-1 ${textSecondary}`}>Ref: ID {produtoEditando.codigo}</p>
                  </div>
                  <button onClick={fecharModalEdicao} className={`p-2 rounded-lg transition-colors outline-none ${isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-900'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className={labelArox}>Nomenclatura</label>
                    <input type="text" className={inputArox} value={produtoEditando.nome} onChange={e => setProdutoEditando({...produtoEditando, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelArox}>Alocação de Setor</label>
                    <select className={`${inputArox} cursor-pointer appearance-none text-zinc-500`} value={produtoEditando.categoria_id} onChange={e => setProdutoEditando({...produtoEditando, categoria_id: e.target.value})}>
                      {categorias.map(c => <option key={c.id} value={c.id} className="text-zinc-900 dark:text-white">{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-5 pt-1">
                     <div>
                       <label className={labelArox}>Valor (R$)</label>
                       <input type="number" step="0.01" className={inputArox} value={produtoEditando.preco} onChange={e => setProdutoEditando({...produtoEditando, preco: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelArox}>Custo (R$)</label>
                       <input type="number" step="0.01" className={inputArox} value={produtoEditando.custo} onChange={e => setProdutoEditando({...produtoEditando, custo: e.target.value})} />
                     </div>
                  </div>
                </div>

                <div className={`px-6 py-5 flex items-center justify-end gap-3 border-t ${borderSubtle} ${isDark ? 'bg-[#121214]' : 'bg-zinc-50'}`}>
                  <button onClick={fecharModalEdicao} className={btnSecondary}>Descartar</button>
                  <button onClick={salvarEdicaoProduto} className={btnPrimary}>Atualizar Sistema</button>
                </div>
              </div>
            </div>
          )}

          {painelAtivo === 'categorias' && (
             <div className="w-full animate-in fade-in duration-300 ease-out">
               <div className={cardPanel}>
                 <div className={`pb-3 mb-5 border-b ${borderSubtle}`}>
                   <h3 className={`text-[14px] font-semibold tracking-wide uppercase ${textPrimary}`}>Mapeamento de Novo Setor</h3>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-4">
                   <input type="text" placeholder="Ex: Cervejas Artesanais..." value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarCategoria()} className={inputArox} />
                   <button onClick={salvarCategoria} className={`${btnPrimary} w-full sm:w-auto shrink-0`}>Registrar Alocação</button>
                 </div>
               </div>

               <div className="space-y-3 mt-6">
                 {categorias.map((cat) => (
                   <div key={cat.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isDark ? 'bg-[#121214] border-white/5 hover:border-white/10' : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-sm'}`}>
                     {editandoCategoriaId === cat.id ? (
                        <div className="flex flex-1 items-center gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                          <input autoFocus type="text" className={inputArox} value={nomeCategoriaEditando} onChange={(e) => setNomeCategoriaEditando(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCategoria(cat.id)} />
                          <button onClick={() => salvarEdicaoCategoria(cat.id)} className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-lg transition-colors shrink-0 shadow-sm active:scale-95">Salvar</button>
                          <button onClick={() => setEditandoCategoriaId(null)} className={btnSecondary}>Sair</button>
                        </div>
                     ) : (
                       <>
                         <div className="flex items-center gap-3">
                           <span className={`font-semibold text-[15px] ${textPrimary}`}>{cat.nome}</span>
                           <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase shadow-sm ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-600'}`}>{cat.produtos?.length || 0} Itens</span>
                         </div>
                         <div className="flex gap-1">
                           <button onClick={() => { setEditandoCategoriaId(cat.id); setNomeCategoriaEditando(cat.nome); }} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                           <button onClick={() => excluirCategoria(cat.id)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                         </div>
                       </>
                     )}
                   </div>
                 ))}
               </div>
             </div>
          )}

          {painelAtivo === 'peso' && (
             <div className="w-full animate-in fade-in duration-300 ease-out pb-20">
               <div className={cardPanel}>
                 <div className={`pb-3 mb-5 border-b ${borderSubtle}`}>
                   <h3 className={`text-[14px] font-semibold tracking-wide uppercase ${textPrimary}`}>{editandoPeso ? 'Atualizar Medida Base' : 'Nova Referência de Venda por KG'}</h3>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                   <div>
                     <label className={labelArox}>Nomenclatura</label>
                     <input type="text" placeholder="Ex: Açaí, Sorvete..." className={inputArox} value={novoPeso.nome} onChange={e => setNovoPeso({...novoPeso, nome: e.target.value})} />
                   </div>
                   <div>
                     <label className={labelArox}>Valor/KG (R$)</label>
                     <div className="relative">
                       <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium ${textSecondary}`}>R$</span>
                       <input type="number" step="0.01" placeholder="0.00" className={`${inputArox} pl-8`} value={novoPeso.preco} onChange={e => setNovoPeso({...novoPeso, preco: e.target.value})} />
                     </div>
                   </div>
                   <div>
                     <label className={labelArox}>Custo/KG (R$)</label>
                     <div className="relative">
                       <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium ${textSecondary}`}>R$</span>
                       <input type="number" step="0.01" placeholder="0.00" className={`${inputArox} pl-8`} value={novoPeso.custo} onChange={e => setNovoPeso({...novoPeso, custo: e.target.value})} />
                     </div>
                   </div>
                 </div>
                 <div className={`flex gap-3 mt-6 pt-5 justify-end border-t ${borderSubtle}`}>
                    {editandoPeso && <button onClick={() => { setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); }} className={btnSecondary}>Cancelar</button>}
                    <button onClick={salvarPeso} className={btnPrimary}>Gravar Medida</button>
                 </div>
               </div>
               
               <div className="space-y-3 mt-6">
                 {configPeso.map((p) => (
                   <div key={p.id} className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md ${isDark ? 'bg-[#121214] border-white/5 hover:border-white/10' : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-sm'}`}>
                      <span className={`font-semibold text-[15px] ${textPrimary}`}>{p.nome}</span>
                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex flex-col text-right">
                          <span className={`font-bold text-[15px] tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>R$ {parseFloat(p.preco_kg).toFixed(2)}/kg</span>
                          <span className={`text-[12px] font-semibold ${textSecondary}`}>Custo: R$ {(p.custo_kg||0).toFixed(2)}</span>
                        </div>
                        <div className={`flex gap-1 border-l pl-5 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
                          <button onClick={() => {setEditandoPeso(p); setNovoPeso({ nome: p.nome, preco: p.preco_kg, custo: p.custo_kg || '' }); window.scrollTo({top: 0, behavior: 'smooth'});}} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                          <button onClick={async () => { if(confirm("Confirmar remoção?")) { await supabase.from('config_peso').delete().eq('id', p.id); fetchDados(); } }} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

        </div>
      )}
    </div>
  );
}