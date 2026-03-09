'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CardComanda from '@/components/CardComanda';
import ModalPeso from '@/components/ModalPeso';
import ModalPagamento from '@/components/ModalPagamento';
import GraficoFaturamento from '@/components/GraficoFaturamento';
import AdminProdutos from '@/components/AdminProdutos';
import AdminUsuarios from '@/components/AdminUsuarios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CORES_PIZZA = ['#0d9488', '#4f46e5', '#059669', '#ef4444', '#f59e0b']; 

export default function Home() {
  
  // Fuso Horário Local (Brasil) Blindado
  const getHoje = () => {
    const dataBr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const d = new Date(dataBr);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };
  
  const getMesAtual = () => getHoje().substring(0, 7);
  const getAnoAtual = () => getHoje().substring(0, 4);

  const [sessao, setSessao] = useState(null); 
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState('Carregando...'); // NOVO: Nome da Empresa
  
  // ESTADO DO CAIXA (Preparando para a próxima atualização)
  const [caixaAtual, setCaixaAtual] = useState({ data_abertura: getHoje(), status: 'aberto' });

  const [comandas, setComandas] = useState([]);
  const [menuCategorias, setMenuCategorias] = useState([]);
  const [tagsGlobais, setTagsGlobais] = useState([]);
  const [configPeso, setConfigPeso] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);

  const [mostrarMenuPerfil, setMostrarMenuPerfil] = useState(false);
  const [mostrarAdminProdutos, setMostrarAdminProdutos] = useState(false);
  const [mostrarAdminUsuarios, setMostrarAdminUsuarios] = useState(false);
  const [mostrarConfigTags, setMostrarConfigTags] = useState(false);
  const [mostrarModalPeso, setMostrarModalPeso] = useState(false);
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  
  const [idSelecionado, setIdSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('comandas');
  const [abaDetalheMobile, setAbaDetalheMobile] = useState('menu');
  const [filtroCategoriaCardapio, setFiltroCategoriaCardapio] = useState('Todas');
  const [modoExclusao, setModoExclusao] = useState(false);
  const [selecionadasExclusao, setSelecionadasExclusao] = useState([]);

  const [filtroTempo, setFiltroTempo] = useState({ tipo: 'dia', valor: getHoje(), inicio: '', fim: '' });
  const comandaAtiva = comandas.find(c => c.id === idSelecionado);

  useEffect(() => {
    const sessionData = localStorage.getItem('bessa_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.data === getHoje() && parsed.empresa_id) {
          setSessao(parsed);
        } else {
          localStorage.removeItem('bessa_session');
        }
      } catch(e) {
        localStorage.removeItem('bessa_session');
      }
    }
  }, []);

  const fazerLogin = async () => {
    if (!credenciais.email || !credenciais.senha) return alert("Preencha e-mail e senha.");
    setLoadingLogin(true);
    const { data, error } = await supabase.from('usuarios').select('*').eq('email', credenciais.email.trim()).eq('senha', credenciais.senha).single();

    if (data && !error) { 
      const sessionObj = { ...data, data: getHoje() };
      setSessao(sessionObj);
      localStorage.setItem('bessa_session', JSON.stringify(sessionObj));
    } else { alert("⚠️ Credenciais inválidas."); }
    setLoadingLogin(false);
  };

  const fazerLogout = () => {
    localStorage.removeItem('bessa_session');
    setSessao(null); setCredenciais({ email: '', senha: '' }); setMostrarMenuPerfil(false); setAbaAtiva('comandas');
  };

  const fetchData = async () => {
    if (!sessao?.empresa_id) return;
    setIsLoading(true);
    
    // Busca o Nome da Empresa
    const { data: empData } = await supabase.from('empresas').select('nome').eq('id', sessao.empresa_id).single();
    if (empData) setNomeEmpresa(empData.nome);

    const { data: catData } = await supabase.from('categorias').select('*, itens:produtos(*)').eq('empresa_id', sessao.empresa_id);
    if (catData) setMenuCategorias(catData);

    const { data: comData } = await supabase.from('comandas').select('*, produtos:comanda_produtos(*), pagamentos(*)').eq('empresa_id', sessao.empresa_id);
    if (comData) setComandas(comData);

    const { data: pesoData } = await supabase.from('config_peso').select('*').eq('empresa_id', sessao.empresa_id);
    if (pesoData) setConfigPeso(pesoData.map(p => ({ id: p.id, nome: p.nome, preco: parseFloat(p.preco_kg), custo: parseFloat(p.custo_kg || 0) })));

    const { data: tagsData } = await supabase.from('tags').select('*').eq('empresa_id', sessao.empresa_id);
    if (tagsData && tagsData.length > 0) {
      setTagsGlobais(tagsData); 
    } else {
      const TAGS_INICIAIS = ['Individual', 'Casal', 'Família', 'Estudantes', 'Academia', 'Com Crianças', 'Consumo Local', 'Para Viagem', 'Fidelidade'];
      const tagsSemente = TAGS_INICIAIS.map(t => ({ nome: t, empresa_id: sessao.empresa_id }));
      const { data: tagsInseridas } = await supabase.from('tags').insert(tagsSemente).select();
      if (tagsInseridas) setTagsGlobais(tagsInseridas);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!sessao?.empresa_id) return;
    fetchData(); 
    const canalAtualizacoes = supabase
      .channel('schema-db-changes')
      .on('postgres', { event: '*', schema: 'public', table: 'comandas' }, () => { fetchData(); })
      .on('postgres', { event: '*', schema: 'public', table: 'comanda_produtos' }, () => { fetchData(); })
      .on('postgres', { event: '*', schema: 'public', table: 'pagamentos' }, () => { fetchData(); })
      .on('postgres', { event: '*', schema: 'public', table: 'tags' }, () => { fetchData(); }) 
      .subscribe();
    return () => { supabase.removeChannel(canalAtualizacoes); };
  }, [sessao]);

  // ==========================================
  // OPERAÇÕES DE CAIXA
  // ==========================================
  const adicionarComanda = async (tipo) => {
    if (modoExclusao || !sessao?.empresa_id) return;
    const qtdHoje = comandas.filter(c => c.data === getHoje()).length;
    const novaComanda = { nome: `Comanda ${qtdHoje + 1}`, tipo, data: getHoje(), status: 'aberta', tags: [], empresa_id: sessao.empresa_id };
    const { data, error } = await supabase.from('comandas').insert([novaComanda]).select().single();
    if (data && !error) setComandas([...comandas, { ...data, produtos: [], pagamentos: [] }]);
  };

  const adicionarProdutoNaComanda = async (produto) => {
    if (!sessao?.empresa_id) return;
    const payload = { comanda_id: idSelecionado, nome: produto.nome, preco: produto.preco, custo: produto.custo || 0, pago: false, observacao: '', empresa_id: sessao.empresa_id };
    const { data, error } = await supabase.from('comanda_produtos').insert([payload]).select().single();
    if (data && !error) {
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: [...c.produtos, data] } : c));
      setMostrarModalPeso(false); setAbaDetalheMobile('resumo');
    }
  };

  const editarNomeComanda = async () => {
    if (!comandaAtiva) return;
    const novoNome = prompt("Renomear comanda para:", comandaAtiva.nome);
    if (novoNome && novoNome.trim() !== "") {
      await supabase.from('comandas').update({ nome: novoNome }).eq('id', idSelecionado);
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, nome: novoNome } : c));
    }
  };

  const toggleTag = async (tagNome) => {
    const novasTags = comandaAtiva.tags.includes(tagNome) ? comandaAtiva.tags.filter(t => t !== tagNome) : [...comandaAtiva.tags, tagNome];
    await supabase.from('comandas').update({ tags: novasTags }).eq('id', idSelecionado);
    setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, tags: novasTags } : c));
  };

  const excluirProduto = async (idProduto) => {
    await supabase.from('comanda_produtos').delete().eq('id', idProduto);
    setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: c.produtos.filter(p => p.id !== idProduto) } : c));
  };

  const editarProduto = async (idProduto, obsAtual) => {
    const novaObs = prompt("Digite a observação:", obsAtual || "");
    if (novaObs !== null) {
      await supabase.from('comanda_produtos').update({ observacao: novaObs }).eq('id', idProduto);
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: c.produtos.map(p => p.id === idProduto ? { ...p, observacao: novaObs } : p) } : c));
    }
  };

  const excluirComanda = async () => {
    if (!comandaAtiva) return;
    if (comandaAtiva.pagamentos.length > 0) return alert("⚠️ BLOQUEADO! Comanda com pagamentos parciais.");
    if (confirm("Deseja excluir a comanda definitivamente?")) { 
      const idParaApagar = idSelecionado; setIdSelecionado(null); 
      await supabase.from('comandas').delete().eq('id', idParaApagar);
      setComandas(prev => prev.filter(c => c.id !== idParaApagar)); 
    }
  };

  const encerrarMesa = async () => { 
    await supabase.from('comandas').update({ status: 'fechada' }).eq('id', idSelecionado);
    setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, status: 'fechada' } : c)); 
    setIdSelecionado(null); 
  };

  const processarPagamento = async (valorFinal, formaPagamento, itensSelecionados, modoDivisao) => {
    if (!sessao?.empresa_id) return;
    let novosProdutos = [...comandaAtiva.produtos];
    let idsParaPagar = [];

    if (modoDivisao) {
      itensSelecionados.forEach(idx => { novosProdutos[idx].pago = true; idsParaPagar.push(novosProdutos[idx].id); });
    } else {
      novosProdutos = novosProdutos.map(p => ({ ...p, pago: true })); idsParaPagar = novosProdutos.map(p => p.id);
    }

    const todosPagos = novosProdutos.every(p => p.pago);
    const payloadPagamento = { comanda_id: idSelecionado, valor: valorFinal, forma: formaPagamento, data: getHoje(), empresa_id: sessao.empresa_id };
    const { data: pgData, error: errPg } = await supabase.from('pagamentos').insert([payloadPagamento]).select().single();
    
    if (!errPg) {
      if (idsParaPagar.length > 0) await supabase.from('comanda_produtos').update({ pago: true }).in('id', idsParaPagar);
      if (todosPagos) await supabase.from('comandas').update({ status: 'fechada' }).eq('id', idSelecionado);
      
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: novosProdutos, pagamentos: [...c.pagamentos, pgData], status: todosPagos ? 'fechada' : 'aberta' } : c));
      setMostrarModalPagamento(false);
    }
  };

  const confirmarExclusaoEmMassa = async () => {
    if (comandas.filter(c => selecionadasExclusao.includes(c.id)).some(c => c.pagamentos.length > 0)) return alert("⚠️ Desmarque as comandas que já possuem pagamentos.");
    if (confirm(`Excluir ${selecionadasExclusao.length} comandas do banco?`)) { 
      await supabase.from('comandas').delete().in('id', selecionadasExclusao);
      setComandas(comandas.filter(c => !selecionadasExclusao.includes(c.id))); setModoExclusao(false); setSelecionadasExclusao([]); 
    }
  };

  const toggleSelecaoExclusao = (id) => setSelecionadasExclusao(selecionadasExclusao.includes(id) ? selecionadasExclusao.filter(item => item !== id) : [...selecionadasExclusao, id]);

  const reabrirComandaFechada = async (id) => {
    if (confirm("Deseja reabrir esta comanda? Ela voltará para a aba Comandas em Aberto.")) {
      await supabase.from('comandas').update({ status: 'aberta' }).eq('id', id);
      setComandas(comandas.map(c => c.id === id ? { ...c, status: 'aberta' } : c));
    }
  };

  const excluirComandaFechada = async (id) => {
    if (confirm("ATENÇÃO: Deseja excluir esta comanda definitivamente? O faturamento e pagamentos dela serão perdidos.")) {
      await supabase.from('comandas').delete().eq('id', id);
      setComandas(comandas.filter(c => c.id !== id));
    }
  };

  // ==========================================
  // LÓGICA DE CÁLCULOS E RANKING
  // ==========================================
  const isComandaInFiltro = (dataComanda) => {
    if (!dataComanda) return false;
    if (filtroTempo.tipo === 'dia') return dataComanda === filtroTempo.valor;
    if (filtroTempo.tipo === 'mes') return dataComanda.startsWith(filtroTempo.valor);
    if (filtroTempo.tipo === 'ano') return dataComanda.startsWith(filtroTempo.valor);
    if (filtroTempo.tipo === 'periodo') return dataComanda >= filtroTempo.inicio && dataComanda <= filtroTempo.fim;
    return false;
  };

  const comandasFiltradas = comandas.filter(c => isComandaInFiltro(c.data));
  const comandasAbertas = comandas.filter(c => c.status === 'aberta');
  const comandasFechadasHoje = comandas.filter(c => c.status === 'fechada' && c.data === getHoje());

  const pagamentosFiltrados = comandasFiltradas.flatMap(c => c.pagamentos);
  const faturamentoTotal = pagamentosFiltrados.reduce((acc, p) => acc + p.valor, 0);
  const custoTotalFiltrado = comandasFiltradas.reduce((acc, c) => acc + c.produtos.filter(p => p.pago).reduce((sum, p) => sum + (p.custo || 0), 0), 0);
  const lucroEstimado = faturamentoTotal - custoTotalFiltrado;

  const pagamentosAgrupados = pagamentosFiltrados.reduce((acc, p) => {
    acc[p.forma] = (acc[p.forma] || 0) + p.valor;
    return acc;
  }, {});
  
  const dadosPizza = Object.keys(pagamentosAgrupados).map(key => ({
    name: key,
    value: pagamentosAgrupados[key]
  })).filter(d => d.value > 0);

  const contagemProdutos = {};
  comandasFiltradas.forEach(c => {
    c.produtos.filter(p => p.pago).forEach(p => {
      const nomeMin = p.nome.toLowerCase();
      const isPeso = nomeMin.includes('peso') || nomeMin.includes('balança') || nomeMin.includes('balanca');
      let nomeChave = p.nome;
      if (isPeso) { nomeChave = p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim(); }
      if (!contagemProdutos[nomeChave]) { contagemProdutos[nomeChave] = { faturamento: 0, volume: 0, isPeso: isPeso }; }
      contagemProdutos[nomeChave].faturamento += p.preco;
      if (isPeso) {
        const matchGramas = p.nome.match(/(\d+(?:\.\d+)?)\s*g/i);
        const gramas = matchGramas ? parseFloat(matchGramas[1]) : 0;
        contagemProdutos[nomeChave].volume += gramas;
      } else {
        contagemProdutos[nomeChave].volume += 1;
      }
    });
  });
  
  const rankingProdutos = Object.keys(contagemProdutos)
    .map(nome => ({ nome, valor: contagemProdutos[nome].faturamento, volume: contagemProdutos[nome].volume, isPeso: contagemProdutos[nome].isPeso }))
    .sort((a, b) => b.valor - a.valor) 
    .slice(0, 7);

  const contagemTipos = { Balcão: 0, Delivery: 0, iFood: 0 };
  const contagemTags = {};
  comandasFiltradas.forEach(c => {
    if (c.pagamentos.some(p => p.forma === 'iFood')) contagemTipos['iFood'] += 1; else contagemTipos[c.tipo] = (contagemTipos[c.tipo] || 0) + 1;
    c.tags.forEach(t => { contagemTags[t] = (contagemTags[t] || 0) + 1; });
  });

  const dadosTipos = Object.keys(contagemTipos).map(k => ({ nome: k, qtd: contagemTipos[k] })).filter(d => d.qtd > 0);
  const dadosTags = Object.keys(contagemTags).map(k => ({ nome: k, qtd: contagemTags[k] })).sort((a, b) => b.qtd - a.qtd);

  const renderCardapioComanda = () => {
    let categoriasParaRenderizar = [];
    if (filtroCategoriaCardapio === 'Favoritos') {
      const todosFavoritos = menuCategorias.flatMap(c => c.itens).filter(p => p.favorito);
      if (todosFavoritos.length > 0) categoriasParaRenderizar = [{ id: 'favs', nome: '⭐ Favoritos', itens: todosFavoritos }];
    } else if (filtroCategoriaCardapio === 'Todas') {
      categoriasParaRenderizar = menuCategorias;
    } else {
      const catEspecifica = menuCategorias.find(c => c.id === filtroCategoriaCardapio);
      if (catEspecifica) categoriasParaRenderizar = [catEspecifica];
    }

    return categoriasParaRenderizar.map(cat => (
      <div key={cat.id} className="mb-8">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{cat.nome}</h3>
        {cat.itens.length === 0 ? <p className="text-sm text-gray-300 italic">Nenhum produto encontrado.</p> : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {cat.itens.map(item => (
              <button key={item.id} onClick={() => adicionarProdutoNaComanda(item)} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-purple-600 hover:text-white transition text-left flex flex-col gap-1 active:scale-95 shadow-sm">
                <span>{item.nome}</span>
                <span className="text-green-600 font-black">R$ {item.preco.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    ));
  };

  // ==========================================
  // RENDERIZAÇÃO DA TELA
  // ==========================================
  if (!sessao) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-gray-100">
          <div className="flex justify-center mb-6"><img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Logo" className="w-24 h-24 rounded-full border-4 border-purple-50 object-cover" /></div>
          <h2 className="text-2xl font-black text-center text-purple-900 mb-2">Acesso Restrito</h2>
          <p className="text-center text-gray-400 text-sm mb-6">Identifique-se para acessar o sistema.</p>
          <div className="space-y-4">
            <input type="email" placeholder="E-mail" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition" value={credenciais.email} onChange={e => setCredenciais({...credenciais, email: e.target.value})} />
            <input type="password" placeholder="Senha" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition" value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})} onKeyDown={e => e.key === 'Enter' && fazerLogin()} />
            <button onClick={fazerLogin} disabled={loadingLogin} className="w-full bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition shadow-lg disabled:opacity-50">
              {loadingLogin ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && comandas.length === 0) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-purple-600 font-bold text-xl animate-pulse">Sincronizando Sistema...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-2 md:p-6 flex flex-col">
      <header className="flex items-center justify-between bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 sticky top-0 z-50">
        {comandaAtiva ? (
          <button onClick={() => setIdSelecionado(null)} className="flex items-center gap-2 text-purple-700 font-bold bg-purple-50 px-4 py-2 rounded-xl hover:bg-purple-100 transition"><span className="text-xl">←</span> <span className="hidden md:inline">Voltar</span></button>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 cursor-pointer" onClick={() => setMostrarMenuPerfil(!mostrarMenuPerfil)}>
              <div className="flex items-center gap-3 hover:opacity-80 transition">
                <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" className="w-10 h-10 rounded-full border-2 border-purple-100 object-cover" alt="Perfil" />
                <div className="flex flex-col text-left hidden md:flex">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{nomeEmpresa}</span>
                  <span className="font-black text-purple-900 tracking-tight leading-none text-sm">{sessao.nome_usuario}</span>
                </div>
                <span className="text-xs text-gray-300 ml-1">▼</span>
              </div>
              {mostrarMenuPerfil && (
                <div className="absolute top-14 left-0 bg-white shadow-xl rounded-2xl p-2 w-56 border border-gray-100 z-50">
                  {sessao.role === 'dono' && <button onClick={() => { setMostrarAdminUsuarios(true); setMostrarMenuPerfil(false); }} className="w-full text-left p-2.5 text-sm font-black text-purple-700 hover:bg-purple-50 rounded-xl transition">👥 Gerenciar Equipe</button>}
                  {(sessao.role === 'dono' || sessao.perm_cardapio) && <button onClick={() => { setMostrarAdminProdutos(true); setMostrarMenuPerfil(false); }} className="w-full text-left p-2.5 text-sm font-bold text-gray-700 hover:bg-purple-50 rounded-xl transition">📦 Gerenciar Cardápio</button>}
                  {sessao.role === 'dono' && <button onClick={() => { setMostrarConfigTags(true); setMostrarMenuPerfil(false); }} className="w-full text-left p-2.5 text-sm font-bold text-gray-700 hover:bg-purple-50 rounded-xl transition">🏷️ Configurar Tags</button>}
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={fazerLogout} className="w-full text-left p-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition">🚪 Sair do Sistema</button>
                </div>
              )}
            </div>
            
            {/* INDICADOR DE CAIXA (Preparando o terreno) */}
            <div className="hidden lg:flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg ml-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Caixa Aberto: {caixaAtual.data_abertura.split('-').reverse().join('/')}</span>
            </div>
          </div>
        )}

        {!comandaAtiva && (
          <div className="flex bg-gray-100/80 rounded-xl p-1 overflow-x-auto text-sm md:text-base flex-1 md:flex-none">
            <button onClick={() => setAbaAtiva('comandas')} className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'comandas' ? 'bg-white text-purple-800 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-purple-600'}`}>Comandas em Aberto</button>
            <button onClick={() => setAbaAtiva('fechadas')} className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'fechadas' ? 'bg-white text-purple-800 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-purple-600'}`}>Comandas Encerradas</button>
            {(sessao.role === 'dono' || sessao.perm_faturamento) && <button onClick={() => setAbaAtiva('faturamento')} className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'faturamento' ? 'bg-white text-purple-800 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-purple-600'}`}>Faturamento</button>}
            {(sessao.role === 'dono' || sessao.perm_estudo) && <button onClick={() => setAbaAtiva('analises')} className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'analises' ? 'bg-white text-purple-800 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-purple-600'}`}>Público-Alvo</button>}
          </div>
        )}
        
        {comandaAtiva && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="hidden md:flex flex-wrap gap-1 justify-end">
              {comandaAtiva.tags.map(t => <span key={t} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold uppercase border border-purple-100">{t}</span>)}
            </div>
            <h2 className="text-lg font-black text-purple-900 truncate max-w-[150px] md:max-w-xs text-right cursor-pointer shrink-0 hover:opacity-70 transition" onClick={editarNomeComanda}>{comandaAtiva?.nome} ✏️</h2>
          </div>
        )}
      </header>

      {!comandaAtiva ? (
        abaAtiva === 'comandas' ? (
          <div className="flex flex-col animate-in fade-in duration-300">
            {comandasAbertas.length > 0 && (
              <div className="flex justify-end mb-4">
                {!modoExclusao ? <button onClick={() => setModoExclusao(true)} className="text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl border border-red-100 hover:bg-red-100 transition">Gerenciar Exclusões</button> : (
                  <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                    <span className="text-red-700 font-bold text-sm">{selecionadasExclusao.length} selecionadas</span>
                    <button onClick={() => { setModoExclusao(false); setSelecionadasExclusao([]); }} className="text-gray-500 font-bold text-sm hover:text-gray-700">Cancelar</button>
                    <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="bg-red-500 text-white font-bold text-sm px-4 py-1.5 rounded-lg disabled:opacity-50 transition">Confirmar Exclusão</button>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-4 md:gap-6">
              <button onClick={() => adicionarComanda('Balcão')} disabled={modoExclusao} className={`w-32 h-44 border-2 border-purple-400 border-dashed rounded-3xl flex flex-col items-center justify-center font-bold text-purple-600 bg-purple-50/30 transition ${modoExclusao ? 'opacity-40 cursor-not-allowed' : 'hover:bg-purple-50 hover:scale-105 hover:border-solid cursor-pointer'}`}><span className="text-4xl mb-2 font-light">+</span><span>Balcão</span></button>
              <button onClick={() => adicionarComanda('Delivery')} disabled={modoExclusao} className={`w-32 h-44 border-2 border-orange-400 border-dashed rounded-3xl flex flex-col items-center justify-center font-bold text-orange-600 bg-orange-50/30 transition ${modoExclusao ? 'opacity-40 cursor-not-allowed' : 'hover:bg-orange-50 hover:scale-105 hover:border-solid cursor-pointer'}`}><span className="text-4xl mb-2 font-light">+</span><span>Delivery</span></button>
              {comandasAbertas.map((item) => (
                <div key={item.id} className="relative">
                  <CardComanda comanda={item} onClick={() => modoExclusao ? toggleSelecaoExclusao(item.id) : setIdSelecionado(item.id)} />
                  {modoExclusao && <div className={`absolute inset-0 rounded-3xl border-4 pointer-events-none transition ${selecionadasExclusao.includes(item.id) ? 'border-red-500 bg-red-500/20' : 'border-transparent bg-black/5'}`} />}
                </div>
              ))}
            </div>
          </div>
        ) : abaAtiva === 'fechadas' ? (
          <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">Comandas Encerradas <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Hoje ({comandasFechadasHoje.length})</span></h2>
            {comandasFechadasHoje.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-100">
                <p className="text-gray-400 font-bold text-lg mb-2">Ainda não há comandas encerradas hoje.</p>
                <p className="text-gray-300 text-sm">Quando você cobrar e encerrar uma mesa, o recibo aparecerá aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comandasFechadasHoje.map(c => {
                  const valorTotalComanda = c.pagamentos.reduce((acc, p) => acc + p.valor, 0);
                  return (
                    <div key={c.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex justify-between items-start border-b border-gray-50 pb-3 mb-3">
                        <div>
                          <h3 className="font-black text-gray-800 text-lg leading-tight flex items-center gap-2">
                            {c.nome} {c.tags.length > 0 && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded uppercase border border-purple-100">{c.tags[0]}</span>}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${c.tipo === 'Delivery' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>{c.tipo}</span>
                        </div>
                        <span className="text-green-600 font-black text-xl tracking-tight">R$ {valorTotalComanda.toFixed(2)}</span>
                      </div>
                      <div className="flex-1 mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Resumo dos Itens</p>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{c.produtos.map(p => p.nome).join(', ')}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium italic">({c.produtos.length} produtos)</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-100 mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase">Pagamento</span>
                        <div className="flex flex-wrap gap-1 justify-end">{c.pagamentos.map((p, i) => <span key={i} className="text-[10px] font-bold px-2 py-1 rounded bg-white border border-gray-200 text-gray-700 shadow-sm">{p.forma}</span>)}</div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-50">
                        <button onClick={() => reabrirComandaFechada(c.id)} className="flex-1 bg-blue-50 text-blue-600 font-bold p-2 rounded-xl text-xs hover:bg-blue-100 transition text-center">🔄 Reabrir</button>
                        <button onClick={() => excluirComandaFechada(c.id)} className="flex-1 bg-red-50 text-red-600 font-bold p-2 rounded-xl text-xs hover:bg-red-100 transition text-center">🗑️ Excluir</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : abaAtiva === 'faturamento' ? (
          <div className="max-w-6xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
            {/* Filtros Superiores */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-gray-50 p-1 rounded-xl w-full md:w-auto border border-gray-100">
                {['dia', 'mes', 'ano', 'periodo'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? 'bg-purple-900 text-white shadow-sm' : 'text-gray-500 hover:text-purple-700'}`}>{t}</button>)}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border border-gray-200 rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 bg-gray-50" />}
                {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border border-gray-200 rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 bg-gray-50" />}
                {filtroTempo.tipo === 'ano' && <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border border-gray-200 rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 bg-gray-50" />}
                {filtroTempo.tipo === 'periodo' && (
                  <><input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className="p-2 border border-gray-200 rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 bg-gray-50" /><span className="self-center font-bold text-gray-300">até</span><input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className="p-2 border border-gray-200 rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 bg-gray-50" /></>
                )}
              </div>
            </div>
            
            {/* Cards de Valores SaaS Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-start relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Faturamento Bruto</h3>
                <p className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight relative z-10">R$ {faturamentoTotal.toFixed(2)}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-start relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-green-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Lucro Bruto Estimado</h3>
                <p className="text-4xl md:text-5xl font-black text-green-500 tracking-tight relative z-10">R$ {lucroEstimado.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Seção Gráfica Analítica */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de Pizza Limpo e com Legenda */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                <h3 className="text-gray-800 text-sm font-bold uppercase mb-4">Divisão por Pagamentos</h3>
                {dadosPizza.length > 0 ? (
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosPizza} innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                          {dadosPizza.map((e, i) => <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(val) => `R$ ${val.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                   <div className="flex-1 flex items-center justify-center text-gray-300 text-sm font-bold">Sem dados de pagamento no período</div>
                )}
              </div>

              {/* Ranking Profissional */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                <h3 className="text-gray-800 text-sm font-bold uppercase mb-4">Produtos Mais Rentáveis</h3>
                {rankingProdutos.length > 0 ? (
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rankingProdutos} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 11, fontWeight: 'bold'}} width={150} />
                        
                        <RechartsTooltip 
                          cursor={{fill: '#f3f4f6'}} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-4 shadow-xl rounded-2xl border border-gray-100">
                                  <p className="text-xs font-black text-gray-800 mb-1">{data.nome}</p>
                                  <p className="text-sm font-bold text-green-600">Receita: R$ {data.valor.toFixed(2)}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 border-t pt-1">
                                    {data.isPeso ? `Volume: ${(data.volume / 1000).toFixed(3)} kg` : `Vendidos: ${data.volume} unid.`}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        
                        <Bar 
                          dataKey="valor" 
                          fill="#1e1b4b" 
                          radius={[0, 6, 6, 0]} 
                          barSize={24} 
                          label={{ 
                            position: 'right', 
                            formatter: (val) => `R$ ${val.toFixed(2)}`,
                            fill: '#6b7280', 
                            fontSize: 11, 
                            fontWeight: 'bold' 
                          }} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-300 text-sm font-bold">Sem vendas no período</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <GraficoFaturamento comandas={comandasFiltradas} />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-gray-50 p-1 rounded-xl w-full md:w-auto border border-gray-100">
                {['dia', 'mes', 'ano'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? 'bg-purple-900 text-white shadow-sm' : 'text-gray-500 hover:text-purple-700'}`}>{t}</button>)}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border border-gray-200 rounded-xl outline-none text-sm font-bold w-full bg-gray-50 focus:border-purple-500" />}
                {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border border-gray-200 rounded-xl outline-none text-sm font-bold w-full bg-gray-50 focus:border-purple-500" />}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-gray-800 text-sm font-bold uppercase mb-4 text-center">Origem Real do Pedido</h3>
                <ResponsiveContainer width="100%" height="100%"><BarChart data={dadosTipos} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nome" tickLine={false} axisLine={false} /><YAxis hide /><RechartsTooltip cursor={{fill: 'transparent'}} /><Bar dataKey="qtd" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={50} /></BarChart></ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-gray-800 text-sm font-bold uppercase mb-4 text-center">Comportamento (Tags)</h3>
                <ResponsiveContainer width="100%" height="100%"><BarChart data={dadosTags} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}><XAxis type="number" hide /><YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} /><RechartsTooltip cursor={{fill: '#f3e8ff'}} /><Bar dataKey="qtd" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={20} /></BarChart></ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col w-full h-full">
          <div className="md:hidden flex bg-gray-200 p-1 rounded-xl mb-4 w-full">
            <button onClick={() => setAbaDetalheMobile('menu')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${abaDetalheMobile === 'menu' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>Cardápio</button>
            <button onClick={() => setAbaDetalheMobile('resumo')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${abaDetalheMobile === 'resumo' ? 'bg-purple-900 text-white shadow-sm' : 'text-gray-500'}`}>Resumo</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full">
            <div className={`bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 overflow-y-auto ${abaDetalheMobile === 'menu' ? 'block' : 'hidden md:block'} pb-24 md:pb-6`}>
              
              <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
                <button onClick={() => setFiltroCategoriaCardapio('Favoritos')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === 'Favoritos' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>⭐ Favoritos</button>
                <button onClick={() => setFiltroCategoriaCardapio('Todas')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === 'Todas' ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>Todas</button>
                {menuCategorias.map(c => (
                  <button key={c.id} onClick={() => setFiltroCategoriaCardapio(c.id)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === c.id ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>{c.nome}</button>
                ))}
              </div>

              <button onClick={() => setMostrarModalPeso(true)} className="w-full p-4 mb-6 border-2 border-purple-500 rounded-2xl text-purple-700 font-bold hover:bg-purple-50 transition active:scale-95 shadow-sm bg-purple-50/50">⚖️ Açaí no Peso</button>
              
              {renderCardapioComanda()}

            </div>
            
            <div className={`bg-purple-900 text-white p-4 md:p-6 rounded-3xl shadow-2xl flex flex-col h-[calc(100vh-180px)] md:h-auto border border-purple-700 ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'}`}>
              <div className="flex-1 overflow-y-auto pr-2 pb-4">
                <div className="mb-4">
                  <p className="text-[10px] text-purple-300 uppercase font-bold mb-2">Classificação:</p>
                  
                  {/* RENDERIZA AS TAGS DA EMPRESA */}
                  <div className="flex flex-wrap gap-1.5">
                    {tagsGlobais.map(tagObj => (
                      <button key={tagObj.id} onClick={() => toggleTag(tagObj.nome)} className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${comandaAtiva?.tags.includes(tagObj.nome) ? 'bg-purple-400 text-purple-900' : 'bg-purple-800/50 text-purple-300 hover:bg-purple-700'}`}>
                        {tagObj.nome}
                      </button>
                    ))}
                  </div>

                </div>
                <div className="flex justify-between items-center bg-purple-950 p-3 rounded-xl mb-4 border border-purple-800"><span className="text-xs text-purple-400 font-bold">ITENS LANÇADOS</span></div>
                {comandaAtiva?.produtos.map((p) => (
                  <div key={p.id} className={`flex justify-between items-center border-b border-purple-800/40 py-3 text-sm transition ${p.pago ? 'opacity-40 line-through' : 'opacity-100'}`}>
                    <div className="flex flex-col"><span className="font-bold">{p.nome} {p.pago && <span className="text-[10px] bg-green-500/20 text-green-300 px-1 py-0.5 rounded ml-1 no-underline">PAGO</span>}</span>{p.observacao && <span className="text-xs text-purple-300 font-medium">↳ {p.observacao}</span>}</div>
                    <div className="flex items-center gap-2"><span className="font-black tracking-tight">R$ {p.preco.toFixed(2)}</span>{!p.pago && <div className="flex gap-1 ml-2"><button onClick={() => editarProduto(p.id, p.observacao)} className="bg-purple-800 p-1.5 rounded-lg text-xs hover:bg-purple-700 transition">✏️</button><button onClick={() => excluirProduto(p.id)} className="bg-red-500/20 text-red-400 hover:text-red-100 hover:bg-red-500 p-1.5 rounded-lg text-xs transition">🗑️</button></div>}</div>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 border-t border-purple-800 bg-purple-900 pb-2 md:pb-0">
                <div className="flex justify-between items-end mb-4 px-2">
                  <span className="text-purple-300 text-xs font-bold uppercase">Restante</span>
                  <span className="text-green-400 text-3xl font-black tracking-tighter">R$ {comandaAtiva?.produtos.filter(p => !p.pago).reduce((acc, p) => acc + p.preco, 0).toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMostrarModalPagamento(true)} disabled={comandaAtiva?.produtos.filter(p=>!p.pago).length === 0} className="flex-[2] bg-green-500 py-4 rounded-2xl font-black text-white text-lg hover:bg-green-600 transition shadow-lg disabled:opacity-50 active:scale-95">COBRAR</button>
                  <button onClick={encerrarMesa} disabled={!comandaAtiva || comandaAtiva?.produtos.length === 0 || comandaAtiva?.produtos.some(p => !p.pago)} className="flex-1 bg-purple-700 py-4 rounded-2xl font-bold text-xs uppercase text-purple-200 hover:bg-purple-600 transition disabled:opacity-30 active:scale-95">Encerrar Mesa</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZADOS APENAS SE A SESSÃO ESTIVER PRONTA E SEGURA */}
      {mostrarAdminUsuarios && sessao && <AdminUsuarios empresaId={sessao.empresa_id} usuarioAtualId={sessao.id} onFechar={() => setMostrarAdminUsuarios(false)} />}
      {mostrarAdminProdutos && sessao && <AdminProdutos empresaId={sessao.empresa_id} onFechar={() => { setMostrarAdminProdutos(false); fetchData(); }} />}
      {mostrarModalPeso && <ModalPeso opcoesPeso={configPeso} onAdicionar={adicionarProdutoNaComanda} onCancelar={() => setMostrarModalPeso(false)} />}
      {mostrarModalPagamento && <ModalPagamento comanda={comandaAtiva} onConfirmar={processarPagamento} onCancelar={() => setMostrarModalPagamento(false)} />}
      
      {/* NOVO MODAL DE CONFIGURAÇÃO DE TAGS DIRETO COM O BANCO */}
      {mostrarConfigTags && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-black text-purple-800">🏷️ Configurar Tags</h2>
              <button onClick={() => setMostrarConfigTags(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 font-bold transition">✕</button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                id="novaTagInput"
                placeholder="Nova tag (Ex: Consumo Local)" 
                className="flex-1 p-3 rounded-xl border border-purple-200 outline-none focus:border-purple-500 text-sm font-medium"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.target.value.trim() !== '') {
                    const val = e.target.value.trim();
                    if (!tagsGlobais.some(t => t.nome.toLowerCase() === val.toLowerCase())) {
                       const { data } = await supabase.from('tags').insert([{ nome: val, empresa_id: sessao.empresa_id }]).select();
                       if (data) setTagsGlobais([...tagsGlobais, data[0]]);
                    }
                    e.target.value = '';
                  }
                }}
              />
              <button 
                onClick={async () => {
                  const input = document.getElementById('novaTagInput');
                  const val = input.value.trim();
                  if (val !== '' && !tagsGlobais.some(t => t.nome.toLowerCase() === val.toLowerCase())) {
                     const { data } = await supabase.from('tags').insert([{ nome: val, empresa_id: sessao.empresa_id }]).select();
                     if (data) setTagsGlobais([...tagsGlobais, data[0]]);
                  }
                  input.value = '';
                }}
                className="bg-purple-600 text-white font-bold px-4 rounded-xl hover:bg-purple-700 transition shadow-sm"
              >
                Adicionar
              </button>
            </div>
            
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tags Atuais</p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              {tagsGlobais.map(tagObj => (
                <div key={tagObj.id} className="flex items-center gap-2 bg-purple-50 text-purple-800 px-3 py-1.5 rounded-lg border border-purple-100 text-sm font-bold">
                  {tagObj.nome}
                  <button 
                    onClick={async () => {
                      if (confirm(`Excluir a tag '${tagObj.nome}' do sistema?`)) {
                        await supabase.from('tags').delete().eq('id', tagObj.id);
                        setTagsGlobais(tagsGlobais.filter(t => t.id !== tagObj.id));
                      }
                    }} 
                    className="text-red-500 hover:text-red-700 ml-1 hover:bg-red-50 p-1 rounded transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {tagsGlobais.length === 0 && <span className="text-sm text-gray-400 italic">Nenhuma tag configurada para esta empresa.</span>}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}