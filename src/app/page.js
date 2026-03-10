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
  const [nomeEmpresa, setNomeEmpresa] = useState('Carregando...'); 
  
  const [temaNoturno, setTemaNoturno] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [mostrarConfigEmpresa, setMostrarConfigEmpresa] = useState(false);
  const [nomeEmpresaEdicao, setNomeEmpresaEdicao] = useState('');
  const [logoEmpresa, setLogoEmpresa] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  const [logoEmpresaEdicao, setLogoEmpresaEdicao] = useState('');

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

  const ultimasComandas = comandas.slice(-3);
  const alertaTags = ultimasComandas.length === 3 && ultimasComandas.every(c => c.tags && c.tags.length === 0);

  useEffect(() => {
    const temaSalvo = localStorage.getItem('bessa_tema_noturno');
    if (temaSalvo !== null) { setTemaNoturno(JSON.parse(temaSalvo)); }

    const sessionData = localStorage.getItem('bessa_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.data === getHoje() && parsed.empresa_id) { setSessao(parsed); } 
        else { localStorage.removeItem('bessa_session'); }
      } catch(e) { localStorage.removeItem('bessa_session'); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bessa_tema_noturno', JSON.stringify(temaNoturno));
    const corBackground = temaNoturno ? '#111827' : '#f9fafb'; 
    const corHeader = temaNoturno ? '#1f2937' : '#ffffff';     
    document.body.style.backgroundColor = corBackground;

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', corHeader);
  }, [temaNoturno]);

  const fazerLogin = async () => {
    if (!credenciais.email || !credenciais.senha) return alert("Preencha e-mail e senha.");
    setLoadingLogin(true);
    const { data, error } = await supabase.from('usuarios').select('*').eq('email', credenciais.email.trim()).eq('senha', credenciais.senha).single();

    if (data && !error) { 
      const sessionObj = { ...data, data: getHoje() };
      setSessao(sessionObj);
      localStorage.setItem('bessa_session', JSON.stringify(sessionObj));
    } else { alert("Credenciais inválidas."); }
    setLoadingLogin(false);
  };

  const fazerLogout = () => {
    localStorage.removeItem('bessa_session');
    setSessao(null); setCredenciais({ email: '', senha: '' }); setMostrarMenuPerfil(false); setMenuMobileAberto(false); setAbaAtiva('comandas');
  };

  const fetchData = async () => {
    if (!sessao?.empresa_id) return;
    setIsLoading(true);
    
    // Atualizado para buscar a logo também
    const { data: empData } = await supabase.from('empresas').select('nome, logo_url').eq('id', sessao.empresa_id).single();
    if (empData) {
      setNomeEmpresa(empData.nome);
      setNomeEmpresaEdicao(empData.nome);
      if (empData.logo_url) {
        setLogoEmpresa(empData.logo_url);
        setLogoEmpresaEdicao(empData.logo_url);
      }
    }

    const { data: catData } = await supabase.from('categorias').select('*, itens:produtos(*)').eq('empresa_id', sessao.empresa_id);
    if (catData) setMenuCategorias(catData);

    const { data: comData } = await supabase.from('comandas').select('*, produtos:comanda_produtos(*), pagamentos(*)').eq('empresa_id', sessao.empresa_id).order('id', { ascending: true });
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

  // Função para guardar nome e url da logo
  const salvarConfigEmpresa = async () => {
    if (nomeEmpresaEdicao.trim() === '') return alert("O nome não pode estar vazio.");
    await supabase.from('empresas').update({ nome: nomeEmpresaEdicao, logo_url: logoEmpresaEdicao }).eq('id', sessao.empresa_id);
    setNomeEmpresa(nomeEmpresaEdicao);
    setLogoEmpresa(logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
    setMostrarConfigEmpresa(false);
  };

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
    if (comandaAtiva.pagamentos.length > 0) return alert("BLOQUEADO! Comanda com pagamentos parciais.");
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
    if (modoDivisao) { itensSelecionados.forEach(idx => { novosProdutos[idx].pago = true; idsParaPagar.push(novosProdutos[idx].id); }); } 
    else { novosProdutos = novosProdutos.map(p => ({ ...p, pago: true })); idsParaPagar = novosProdutos.map(p => p.id); }
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
    if (comandas.filter(c => selecionadasExclusao.includes(c.id)).some(c => c.pagamentos.length > 0)) return alert("Desmarque as comandas que já possuem pagamentos.");
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
    if (confirm("ATENÇÃO: Deseja excluir esta comanda definitivamente? O faturamento dela será perdido.")) {
      await supabase.from('comandas').delete().eq('id', id);
      setComandas(comandas.filter(c => c.id !== id));
    }
  };

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

  const pagamentosAgrupados = pagamentosFiltrados.reduce((acc, p) => { acc[p.forma] = (acc[p.forma] || 0) + p.valor; return acc; }, {});
  const dadosPizza = Object.keys(pagamentosAgrupados).map(key => ({ name: key, value: pagamentosAgrupados[key] })).filter(d => d.value > 0);

  const contagemProdutos = {};
  comandasFiltradas.forEach(c => {
    c.produtos.filter(p => p.pago).forEach(p => {
      const isPeso = p.nome.toLowerCase().includes('peso') || p.nome.toLowerCase().includes('balança');
      let nomeChave = isPeso ? p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim() : p.nome;
      if (!contagemProdutos[nomeChave]) { contagemProdutos[nomeChave] = { faturamento: 0, volume: 0, isPeso: isPeso }; }
      contagemProdutos[nomeChave].faturamento += p.preco;
      if (isPeso) {
        const matchGramas = p.nome.match(/(\d+(?:\.\d+)?)\s*g/i);
        contagemProdutos[nomeChave].volume += matchGramas ? parseFloat(matchGramas[1]) : 0;
      } else { contagemProdutos[nomeChave].volume += 1; }
    });
  });
  
  const rankingProdutos = Object.keys(contagemProdutos).map(nome => ({ nome, valor: contagemProdutos[nome].faturamento, volume: contagemProdutos[nome].volume, isPeso: contagemProdutos[nome].isPeso })).sort((a, b) => b.valor - a.valor).slice(0, 7);
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
    } else if (filtroCategoriaCardapio === 'Todas') { categoriasParaRenderizar = menuCategorias; } 
    else {
      const catEspecifica = menuCategorias.find(c => c.id === filtroCategoriaCardapio);
      if (catEspecifica) categoriasParaRenderizar = [catEspecifica];
    }
    return categoriasParaRenderizar.map(cat => (
      <div key={cat.id} className="mb-8">
        <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>{cat.nome}</h3>
        {cat.itens.length === 0 ? <p className="text-sm text-gray-400 italic">Nenhum produto encontrado.</p> : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.itens.map(item => (
              <button key={item.id} onClick={() => adicionarProdutoNaComanda(item)} className={`p-4 rounded-2xl text-xs font-bold transition text-left flex flex-col gap-1 active:scale-95 shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-100 text-gray-700 hover:bg-purple-50 hover:border-purple-200'}`}>
                <span>{item.nome}</span>
                <span className="text-green-500 font-black">R$ {item.preco.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    ));
  };

  if (!sessao) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${temaNoturno ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-8 rounded-3xl shadow-2xl w-full max-w-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-6">
             <div className="w-8 h-8"></div>
             <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Logo" className={`w-20 h-20 rounded-full border-4 object-cover ${temaNoturno ? 'border-gray-700' : 'border-purple-50'}`} />
             <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-2 rounded-full transition ${temaNoturno ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-500'}`}>{temaNoturno ? '🌙' : '☀️'}</button>
          </div>
          <h2 className={`text-2xl font-black text-center mb-2 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Área Restrita</h2>
          <p className="text-center text-gray-400 text-sm mb-6">Autentique-se para continuar</p>
          <div className="space-y-4">
            <input type="email" placeholder="E-mail" className={`w-full p-3 rounded-xl outline-none transition border ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'}`} value={credenciais.email} onChange={e => setCredenciais({...credenciais, email: e.target.value})} />
            <input type="password" placeholder="Senha" className={`w-full p-3 rounded-xl outline-none transition border ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'}`} value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})} onKeyDown={e => e.key === 'Enter' && fazerLogin()} />
            <button onClick={fazerLogin} disabled={loadingLogin} className="w-full bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition shadow-lg disabled:opacity-50">
              {loadingLogin ? 'Autenticando...' : 'Acessar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && comandas.length === 0) {
    return <div className={`min-h-screen flex items-center justify-center font-bold text-xl animate-pulse ${temaNoturno ? 'bg-gray-900 text-purple-400' : 'bg-gray-50 text-purple-600'}`}>Sincronizando Sistema...</div>;
  }

  return (
    <main className={`min-h-screen p-2 xl:p-6 flex flex-col transition-colors duration-500 ${temaNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      <header className={`flex items-center justify-between p-3 xl:p-4 rounded-3xl shadow-sm border mb-6 sticky top-0 z-40 transition-colors duration-500 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex-1 flex justify-start items-center gap-3">
          {comandaAtiva ? (
            <button onClick={() => setIdSelecionado(null)} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition ${temaNoturno ? 'bg-gray-700 text-purple-300 hover:bg-gray-600' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
              <span className="text-xl">←</span> <span className="hidden xl:inline">Voltar</span>
            </button>
          ) : (
            <>
              <button onClick={() => setMenuMobileAberto(true)} className={`xl:hidden p-2 rounded-xl border transition ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border ${temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100'}`}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>Caixa Aberto: {caixaAtual.data_abertura.split('-').reverse().join('/')}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex-[2] flex justify-center overflow-hidden px-2">
          {!comandaAtiva ? (
            <>
              <div className={`hidden xl:flex rounded-xl p-1 text-sm border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-100/80 border-gray-200/50'}`}>
                <button onClick={() => setAbaAtiva('comandas')} className={`px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'comandas' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>Comandas em Aberto</button>
                <button onClick={() => setAbaAtiva('fechadas')} className={`px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'fechadas' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>Comandas Encerradas</button>
                {(sessao.role === 'dono' || sessao.perm_faturamento) && <button onClick={() => setAbaAtiva('faturamento')} className={`px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'faturamento' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>Faturamento</button>}
                {(sessao.role === 'dono' || sessao.perm_estudo) && <button onClick={() => setAbaAtiva('analises')} className={`px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'analises' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>Público-Alvo</button>}
              </div>
              {/* O NOVO TOPO MOBILE: Apenas a Logo Centralizada, sem texto */}
              <div className="xl:hidden flex items-center justify-center">
                 <img src={logoEmpresa} alt="Logo Empresa" className={`w-10 h-10 rounded-full border shadow-sm object-cover ${temaNoturno ? 'border-gray-600' : 'border-purple-200'}`} onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
              </div>
            </>
          ) : (
            <h2 className={`text-lg font-black truncate text-center cursor-pointer hover:opacity-70 transition ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`} onClick={editarNomeComanda}>{comandaAtiva?.nome} ✏️</h2>
          )}
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-2 xl:gap-6">
          {!comandaAtiva ? (
             <>
                <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center border ${temaNoturno ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-200'}`}>
                  {temaNoturno ? ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> ) : ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> )}
                </button>
                
                <div className="hidden xl:block relative shrink-0 cursor-pointer" onClick={() => setMostrarMenuPerfil(!mostrarMenuPerfil)}>
                  <div className="flex items-center gap-3 hover:opacity-80 transition">
                    <div className="flex flex-col text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>{nomeEmpresa}</span>
                      <span className={`font-black tracking-tight leading-none text-sm ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`}>{sessao.nome_usuario}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-lg ${temaNoturno ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-purple-200 bg-purple-100 text-purple-700'}`}>
                       {sessao.nome_usuario.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs ml-1 ${temaNoturno ? 'text-gray-500' : 'text-gray-300'}`}>▼</span>
                  </div>
                  
                  {mostrarMenuPerfil && (
                    <div className={`absolute top-14 right-0 shadow-2xl rounded-2xl p-2 w-56 border z-50 transition-colors ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      {sessao.role === 'dono' && (
                        <button onClick={() => { setMostrarConfigEmpresa(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center rounded-xl transition ${temaNoturno ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Configurações da Loja
                        </button>
                      )}
                      {sessao.role === 'dono' && (
                        <button onClick={() => { setMostrarAdminUsuarios(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center rounded-xl transition ${temaNoturno ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Gerenciar Equipe
                        </button>
                      )}
                      {(sessao.role === 'dono' || sessao.perm_cardapio) && (
                        <button onClick={() => { setMostrarAdminProdutos(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center rounded-xl transition ${temaNoturno ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg> Gerenciar Cardápio
                        </button>
                      )}
                      {sessao.role === 'dono' && (
                        <button onClick={() => { setMostrarConfigTags(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center rounded-xl transition ${temaNoturno ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> Configurar Tags
                        </button>
                      )}
                      <div className={`h-px my-1 ${temaNoturno ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                      <button onClick={fazerLogout} className={`w-full text-left p-3 text-sm font-bold flex items-center rounded-xl transition ${temaNoturno ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}>
                        <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> Sair do Sistema
                      </button>
                    </div>
                  )}
                </div>
             </>
          ) : (
            <div className="hidden xl:flex flex-wrap gap-1 justify-end">
              {comandaAtiva.tags.map(t => <span key={t} className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{t}</span>)}
            </div>
          )}
        </div>
      </header>

      {!comandaAtiva && alertaTags && abaAtiva === 'comandas' && (
        <div className={`mb-6 p-4 rounded-3xl flex items-center justify-between border shadow-sm animate-in slide-in-from-top-4 ${temaNoturno ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          <div className="flex items-center gap-4">
            <span className="text-3xl drop-shadow-sm">💡</span>
            <div>
              <p className="font-black text-sm">Alimente sua Inteligência de Negócio!</p>
              <p className={`text-xs mt-0.5 font-medium leading-relaxed ${temaNoturno ? 'text-yellow-400/80' : 'text-yellow-700/80'}`}>
                Suas últimas comandas estão sem tags. Para classificar seus clientes, abra uma comanda e <b>clique nas tags abaixo do cardápio</b>. Elas se integrarão automaticamente à mesa, gerando relatórios super poderosos!
              </p>
            </div>
          </div>
        </div>
      )}

      {menuMobileAberto && (
        <div className="fixed inset-0 z-[100] flex xl:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMenuMobileAberto(false)}></div>
          
          <div className={`relative w-[80%] max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
             
             <div className={`p-6 border-b flex flex-col ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <img src={logoEmpresa} alt="Logo" className={`w-14 h-14 rounded-full border-4 shadow-sm object-cover ${temaNoturno ? 'border-gray-700 bg-gray-800' : 'border-purple-100 bg-purple-50'}`} onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
                  <button onClick={() => setMenuMobileAberto(false)} className={`p-2 rounded-full transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>✕</button>
                </div>
                <h3 className={`font-black text-xl leading-tight truncate ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{sessao.nome_usuario}</h3>
                <p className={`text-xs font-bold uppercase tracking-widest mt-1 truncate ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>{nomeEmpresa}</p>
             </div>

             <div className="flex-1 overflow-y-auto py-6">
                <p className={`px-6 text-[10px] font-bold uppercase tracking-widest mb-3 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Navegação</p>
                <nav className="flex flex-col gap-1 px-4">
                  <button onClick={() => { setAbaAtiva('comandas'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'comandas' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}>📋 Em Aberto</button>
                  <button onClick={() => { setAbaAtiva('fechadas'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'fechadas' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}>🛒 Encerradas</button>
                  {(sessao.role === 'dono' || sessao.perm_faturamento) && <button onClick={() => { setAbaAtiva('faturamento'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'faturamento' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}>💰 Faturamento</button>}
                  {(sessao.role === 'dono' || sessao.perm_estudo) && <button onClick={() => { setAbaAtiva('analises'); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${abaAtiva === 'analises' ? (temaNoturno ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}>📊 Público-Alvo</button>}
                </nav>

                <p className={`px-6 text-[10px] font-bold uppercase tracking-widest mb-3 mt-8 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Administração</p>
                <nav className="flex flex-col gap-1 px-4">
                  {sessao.role === 'dono' && <button onClick={() => { setMostrarConfigEmpresa(true); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}>⚙️ Configurações da Loja</button>}
                  {sessao.role === 'dono' && <button onClick={() => { setMostrarAdminUsuarios(true); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}>👥 Gerenciar Equipe</button>}
                  {(sessao.role === 'dono' || sessao.perm_cardapio) && <button onClick={() => { setMostrarAdminProdutos(true); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}>📦 Gerenciar Cardápio</button>}
                  {sessao.role === 'dono' && <button onClick={() => { setMostrarConfigTags(true); setMenuMobileAberto(false); }} className={`p-3 rounded-xl text-left font-bold text-sm transition flex items-center gap-3 ${temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}>🏷️ Configurar Tags</button>}
                </nav>
             </div>

             <div className={`p-4 border-t ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
               <button onClick={fazerLogout} className={`w-full text-center font-bold p-3 rounded-xl transition ${temaNoturno ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'}`}>Sair do Sistema</button>
             </div>
          </div>
        </div>
      )}

      {!comandaAtiva ? (
        abaAtiva === 'comandas' ? (
          <div className="flex flex-col animate-in fade-in duration-300">
            {comandasAbertas.length > 0 && (
              <div className="flex justify-end mb-4">
                {!modoExclusao ? <button onClick={() => setModoExclusao(true)} className={`font-bold text-sm px-4 py-2 rounded-xl border transition ${temaNoturno ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'}`}>Gerenciar Exclusões</button> : (
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${temaNoturno ? 'bg-red-900/20 border-red-900/50' : 'bg-red-50 border-red-200'}`}>
                    <span className={`font-bold text-sm ${temaNoturno ? 'text-red-400' : 'text-red-700'}`}>{selecionadasExclusao.length} selecionadas</span>
                    <button onClick={() => { setModoExclusao(false); setSelecionadasExclusao([]); }} className={`font-bold text-sm ${temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Cancelar</button>
                    <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="bg-red-500 text-white font-bold text-sm px-4 py-1.5 rounded-lg disabled:opacity-50 transition">Confirmar Exclusão</button>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-4 md:gap-6">
              <button onClick={() => adicionarComanda('Balcão')} disabled={modoExclusao} className={`w-32 h-44 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center font-bold transition ${temaNoturno ? 'border-purple-600 text-purple-400 bg-purple-900/10 hover:bg-purple-900/30' : 'border-purple-400 text-purple-600 bg-purple-50/30 hover:bg-purple-50 hover:scale-105'}`}><span className="text-4xl mb-2 font-light">+</span><span>Balcão</span></button>
              <button onClick={() => adicionarComanda('Delivery')} disabled={modoExclusao} className={`w-32 h-44 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center font-bold transition ${temaNoturno ? 'border-orange-600 text-orange-400 bg-orange-900/10 hover:bg-orange-900/30' : 'border-orange-400 text-orange-600 bg-orange-50/30 hover:bg-orange-50 hover:scale-105'}`}><span className="text-4xl mb-2 font-light">+</span><span>Delivery</span></button>
              {comandasAbertas.map((item) => (
                <div key={item.id} className="relative">
                  <CardComanda comanda={item} temaNoturno={temaNoturno} onClick={() => modoExclusao ? toggleSelecaoExclusao(item.id) : setIdSelecionado(item.id)} />
                  {modoExclusao && <div className={`absolute inset-0 rounded-3xl border-4 pointer-events-none transition ${selecionadasExclusao.includes(item.id) ? 'border-red-500 bg-red-500/20' : 'border-transparent bg-black/5'}`} />}
                </div>
              ))}
            </div>
          </div>
        ) : abaAtiva === 'fechadas' ? (
          <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300">
            <h2 className={`text-2xl font-black mb-6 flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>Comandas Encerradas <span className={`text-sm font-normal px-2 py-0.5 rounded-md ${temaNoturno ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>Hoje ({comandasFechadasHoje.length})</span></h2>
            {comandasFechadasHoje.length === 0 ? (
              <div className={`p-12 rounded-3xl text-center shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <p className="text-gray-400 font-bold text-lg mb-2">Ainda não há comandas encerradas hoje.</p>
                <p className="text-gray-500 text-sm">Quando você cobrar e encerrar uma mesa, o recibo aparecerá aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comandasFechadasHoje.map(c => {
                  const valorTotalComanda = c.pagamentos.reduce((acc, p) => acc + p.valor, 0);
                  return (
                    <div key={c.id} className={`p-5 rounded-3xl shadow-sm border flex flex-col ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className={`flex justify-between items-start border-b pb-3 mb-3 ${temaNoturno ? 'border-gray-700' : 'border-gray-50'}`}>
                        <div>
                          <h3 className={`font-black text-lg leading-tight flex items-center gap-2 ${temaNoturno ? 'text-gray-100' : 'text-gray-800'}`}>
                            {c.nome} {c.tags.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase border ${temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>{c.tags[0]}</span>}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 inline-block border ${c.tipo === 'Delivery' ? (temaNoturno ? 'bg-orange-900/30 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-700 border-orange-100') : (temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-100')}`}>{c.tipo}</span>
                        </div>
                        <span className={`font-black text-xl tracking-tight ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>R$ {valorTotalComanda.toFixed(2)}</span>
                      </div>
                      <div className="flex-1 mb-4">
                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Resumo dos Itens</p>
                        <p className={`text-sm line-clamp-2 leading-relaxed ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>{c.produtos.map(p => p.nome).join(', ')}</p>
                        <p className={`text-xs mt-1 font-medium italic ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>({c.produtos.length} produtos)</p>
                      </div>
                      <div className={`p-3 rounded-xl flex items-center justify-between border mb-3 ${temaNoturno ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                        <span className={`text-xs font-bold uppercase ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>Pagamento</span>
                        <div className="flex flex-wrap gap-1 justify-end">{c.pagamentos.map((p, i) => <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>{p.forma}</span>)}</div>
                      </div>
                      <div className={`flex gap-2 pt-3 border-t ${temaNoturno ? 'border-gray-700' : 'border-gray-50'}`}>
                        <button onClick={() => reabrirComandaFechada(c.id)} className={`flex-1 font-bold p-2 rounded-xl text-xs transition text-center ${temaNoturno ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>🔄 Reabrir</button>
                        <button onClick={() => excluirComandaFechada(c.id)} className={`flex-1 font-bold p-2 rounded-xl text-xs transition text-center ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>🗑️ Excluir</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : abaAtiva === 'faturamento' ? (
          <div className="max-w-6xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
            <div className={`p-4 rounded-3xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`flex p-1 rounded-xl w-full md:w-auto border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                {['dia', 'mes', 'ano', 'periodo'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>{t}</button>)}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
                {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
                {filtroTempo.tipo === 'ano' && <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />}
                {filtroTempo.tipo === 'periodo' && (
                  <><input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`p-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} /><span className="self-center font-bold text-gray-500">até</span><input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`p-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} /></>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 ${temaNoturno ? 'bg-purple-900/20' : 'bg-purple-50'}`}></div>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Faturamento Bruto</h3>
                <p className={`text-4xl md:text-5xl font-black tracking-tight relative z-10 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>R$ {faturamentoTotal.toFixed(2)}</p>
              </div>
              <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 ${temaNoturno ? 'bg-green-900/20' : 'bg-green-50'}`}></div>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Lucro Bruto Estimado</h3>
                <p className={`text-4xl md:text-5xl font-black tracking-tight relative z-10 ${temaNoturno ? 'text-green-400' : 'text-green-500'}`}>R$ {lucroEstimado.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[400px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-bold uppercase mb-4 ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>Divisão por Pagamentos</h3>
                {dadosPizza.length > 0 ? (
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosPizza} innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                          {dadosPizza.map((e, i) => <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(val) => `R$ ${val.toFixed(2)}`} contentStyle={{ backgroundColor: temaNoturno ? '#1f2937' : '#fff', color: temaNoturno ? '#f3f4f6' : '#111827', borderRadius: '12px', border: temaNoturno ? '1px solid #374151' : 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: temaNoturno ? '#9ca3af' : '#4b5563' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                   <div className={`flex-1 flex items-center justify-center text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-300'}`}>Sem dados de pagamento no período</div>
                )}
              </div>

              <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[400px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-bold uppercase mb-4 ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>Produtos Mais Rentáveis</h3>
                {rankingProdutos.length > 0 ? (
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rankingProdutos} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#4b5563', fontSize: 11, fontWeight: 'bold'}} width={150} />
                        <RechartsTooltip 
                          cursor={{fill: temaNoturno ? '#374151' : '#f3f4f6'}} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className={`p-4 shadow-xl rounded-2xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                  <p className={`text-xs font-black mb-1 ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{data.nome}</p>
                                  <p className={`text-sm font-bold ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>Receita: R$ {data.valor.toFixed(2)}</p>
                                  <p className={`text-[10px] font-bold uppercase mt-2 border-t pt-1 ${temaNoturno ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-100'}`}>
                                    {data.isPeso ? `Volume: ${(data.volume / 1000).toFixed(3)} kg` : `Vendidos: ${data.volume} unid.`}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="valor" fill={temaNoturno ? '#8b5cf6' : '#1e1b4b'} radius={[0, 6, 6, 0]} barSize={24} label={{ position: 'right', formatter: (val) => `R$ ${val.toFixed(2)}`, fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 11, fontWeight: 'bold' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className={`flex-1 flex items-center justify-center text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-300'}`}>Sem vendas no período</div>
                )}
              </div>
            </div>

            <GraficoFaturamento comandas={comandasFiltradas} temaNoturno={temaNoturno} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full animate-in zoom-in-95 duration-500">
             <div className={`p-4 rounded-3xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`flex p-1 rounded-xl w-full md:w-auto border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                {['dia', 'mes', 'ano'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>{t}</button>)}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
                {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-3xl shadow-sm border h-80 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-bold uppercase mb-4 text-center ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>Origem Real do Pedido</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosTipos} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={temaNoturno ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 12, fontWeight: 'bold'}} />
                    <YAxis hide />
                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: temaNoturno ? '#1f2937' : '#fff', color: temaNoturno ? '#f3f4f6' : '#111827', borderRadius: '12px', border: temaNoturno ? '1px solid #374151' : 'none' }} />
                    <Bar dataKey="qtd" fill={temaNoturno ? '#fcd34d' : '#f59e0b'} radius={[8, 8, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={`p-6 rounded-3xl shadow-sm border h-80 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-bold uppercase mb-4 text-center ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>Comportamento (Tags)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosTags} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 11, fontWeight: 'bold'}} />
                    <RechartsTooltip cursor={{fill: temaNoturno ? '#374151' : '#f3e8ff'}} contentStyle={{ backgroundColor: temaNoturno ? '#1f2937' : '#fff', color: temaNoturno ? '#f3f4f6' : '#111827', borderRadius: '12px', border: temaNoturno ? '1px solid #374151' : 'none' }} />
                    <Bar dataKey="qtd" fill={temaNoturno ? '#c084fc' : '#a855f7'} radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col w-full h-full">
          <div className={`md:hidden flex p-1 rounded-xl mb-4 w-full border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-200'}`}>
            <button onClick={() => setAbaDetalheMobile('menu')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${abaDetalheMobile === 'menu' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-400' : 'text-gray-500')}`}>Cardápio</button>
            <button onClick={() => setAbaDetalheMobile('resumo')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${abaDetalheMobile === 'resumo' ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400' : 'text-gray-500')}`}>Resumo</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full">
            <div className={`p-4 md:p-6 rounded-3xl shadow-sm border overflow-y-auto ${abaDetalheMobile === 'menu' ? 'block' : 'hidden md:block'} pb-24 md:pb-6 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
                <button onClick={() => setFiltroCategoriaCardapio('Favoritos')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === 'Favoritos' ? (temaNoturno ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700' : 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm') : (temaNoturno ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100')}`}>⭐ Favoritos</button>
                <button onClick={() => setFiltroCategoriaCardapio('Todas')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === 'Todas' ? (temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm') : (temaNoturno ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100')}`}>Todas</button>
                {menuCategorias.map(c => (
                  <button key={c.id} onClick={() => setFiltroCategoriaCardapio(c.id)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === c.id ? (temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm') : (temaNoturno ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100')}`}>{c.nome}</button>
                ))}
              </div>

              <button onClick={() => setMostrarModalPeso(true)} className={`w-full p-4 mb-6 border-2 rounded-2xl font-bold transition active:scale-95 shadow-sm ${temaNoturno ? 'border-purple-600 text-purple-300 bg-purple-900/20 hover:bg-purple-900/40' : 'border-purple-500 text-purple-700 bg-purple-50/50 hover:bg-purple-50'}`}>⚖️ Açaí no Peso</button>
              
              {renderCardapioComanda()}
            </div>
            
            <div className={`text-white p-4 md:p-6 rounded-3xl shadow-2xl flex flex-col h-[calc(100vh-180px)] md:h-auto border ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-purple-900 border-purple-700'}`}>
              <div className="flex-1 overflow-y-auto pr-2 pb-4">
                <div className="mb-4">
                  <p className={`text-[10px] uppercase font-bold mb-2 ${temaNoturno ? 'text-gray-400' : 'text-purple-300'}`}>Classificação:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tagsGlobais.map(tagObj => (
                      <button key={tagObj.id} onClick={() => toggleTag(tagObj.nome)} className={`px-2 py-1 rounded-md text-[10px] font-bold transition border ${comandaAtiva?.tags.includes(tagObj.nome) ? (temaNoturno ? 'bg-purple-600 text-white border-purple-500' : 'bg-purple-400 text-purple-900 border-purple-400') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-purple-800/50 text-purple-300 border-purple-800 hover:bg-purple-700')}`}>
                        {tagObj.nome}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-xl mb-4 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-purple-950 border-purple-800'}`}>
                  <span className={`text-xs font-bold ${temaNoturno ? 'text-gray-400' : 'text-purple-400'}`}>ITENS LANÇADOS</span>
                </div>
                {comandaAtiva?.produtos.map((p) => (
                  <div key={p.id} className={`flex justify-between items-center border-b py-3 text-sm transition ${p.pago ? 'opacity-40 line-through' : 'opacity-100'} ${temaNoturno ? 'border-gray-800' : 'border-purple-800/40'}`}>
                    <div className="flex flex-col"><span className="font-bold text-gray-100">{p.nome} {p.pago && <span className="text-[10px] bg-green-500/20 text-green-300 px-1 py-0.5 rounded ml-1 no-underline">PAGO</span>}</span>{p.observacao && <span className={`text-xs font-medium ${temaNoturno ? 'text-gray-400' : 'text-purple-300'}`}>↳ {p.observacao}</span>}</div>
                    <div className="flex items-center gap-2"><span className="font-black tracking-tight text-white">R$ {p.preco.toFixed(2)}</span>{!p.pago && <div className="flex gap-1 ml-2"><button onClick={() => editarProduto(p.id, p.observacao)} className={`p-1.5 rounded-lg text-xs transition ${temaNoturno ? 'bg-gray-700 hover:bg-gray-600' : 'bg-purple-800 hover:bg-purple-700'}`}>✏️</button><button onClick={() => excluirProduto(p.id)} className="bg-red-500/20 text-red-400 hover:text-red-100 hover:bg-red-500 p-1.5 rounded-lg text-xs transition">🗑️</button></div>}</div>
                  </div>
                ))}
              </div>
              <div className={`mt-auto pt-4 border-t pb-2 md:pb-0 ${temaNoturno ? 'border-gray-800 bg-gray-900' : 'border-purple-800 bg-purple-900'}`}>
                <div className="flex justify-between items-end mb-4 px-2">
                  <span className={`text-xs font-bold uppercase ${temaNoturno ? 'text-gray-400' : 'text-purple-300'}`}>Restante</span>
                  <span className="text-green-400 text-3xl font-black tracking-tighter">R$ {comandaAtiva?.produtos.filter(p => !p.pago).reduce((acc, p) => acc + p.preco, 0).toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMostrarModalPagamento(true)} disabled={comandaAtiva?.produtos.filter(p=>!p.pago).length === 0} className="flex-[2] bg-green-500 py-4 rounded-2xl font-black text-white text-lg hover:bg-green-600 transition shadow-lg disabled:opacity-50 active:scale-95">COBRAR</button>
                  <button onClick={encerrarMesa} disabled={!comandaAtiva || comandaAtiva?.produtos.length === 0 || comandaAtiva?.produtos.some(p => !p.pago)} className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase transition disabled:opacity-30 active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-purple-700 text-purple-200 hover:bg-purple-600'}`}>Encerrar Mesa</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarAdminUsuarios && sessao && <AdminUsuarios empresaId={sessao.empresa_id} usuarioAtualId={sessao.id} temaNoturno={temaNoturno} onFechar={() => setMostrarAdminUsuarios(false)} />}
      {mostrarAdminProdutos && sessao && <AdminProdutos empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => { setMostrarAdminProdutos(false); fetchData(); }} />}
      {mostrarModalPeso && <ModalPeso opcoesPeso={configPeso} temaNoturno={temaNoturno} onAdicionar={adicionarProdutoNaComanda} onCancelar={() => setMostrarModalPeso(false)} />}
      {mostrarModalPagamento && <ModalPagamento comanda={comandaAtiva} temaNoturno={temaNoturno} onConfirmar={processarPagamento} onCancelar={() => setMostrarModalPagamento(false)} />}
      
      {mostrarConfigEmpresa && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
          <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-4 ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-xl font-black flex items-center gap-2 ${temaNoturno ? 'text-gray-100' : 'text-gray-800'}`}>
                ⚙️ Configurações
              </h2>
              <button onClick={() => setMostrarConfigEmpresa(false)} className={`p-2 rounded-full font-bold transition ${temaNoturno ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>✕</button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Nome do Estabelecimento</label>
                <input 
                  type="text" 
                  value={nomeEmpresaEdicao}
                  onChange={e => setNomeEmpresaEdicao(e.target.value)}
                  className={`w-full p-3 rounded-xl border outline-none text-sm font-medium focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                />
              </div>
              
              {/* CAMPO DE LINK PARA A LOGO */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Link da Logo (URL)</label>
                <input 
                  type="text" 
                  placeholder="Ex: https://i.imgur.com/sua-logo.png"
                  value={logoEmpresaEdicao}
                  onChange={e => setLogoEmpresaEdicao(e.target.value)}
                  className={`w-full p-3 rounded-xl border outline-none text-sm font-medium focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                />
              </div>
              
              <div className="flex items-center justify-center mt-2">
                <img src={logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Preview" className={`w-20 h-20 rounded-full border-4 object-cover shadow-sm ${temaNoturno ? 'border-gray-700' : 'border-purple-100'}`} onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
              </div>
            </div>

            <button onClick={salvarConfigEmpresa} className={`w-full py-3 text-white font-bold rounded-xl transition shadow-sm ${temaNoturno ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-600 hover:bg-purple-700'}`}>
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {mostrarConfigTags && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
          <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-4 ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-xl font-black flex items-center gap-2 ${temaNoturno ? 'text-gray-100' : 'text-gray-800'}`}>
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                Configurar Tags
              </h2>
              <button onClick={() => setMostrarConfigTags(false)} className={`p-2 rounded-full font-bold transition ${temaNoturno ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>✕</button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <input 
                type="text" id="novaTagInput" placeholder="Nova tag (Ex: Consumo Local)" 
                className={`flex-1 p-3 rounded-xl border outline-none text-sm font-medium focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
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
                className={`text-white font-bold px-4 rounded-xl transition shadow-sm ${temaNoturno ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                Adicionar
              </button>
            </div>
            
            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Tags Atuais</p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              {tagsGlobais.map(tagObj => (
                <div key={tagObj.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${temaNoturno ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-purple-50 border-purple-100 text-purple-800'}`}>
                  {tagObj.nome}
                  <button 
                    onClick={async () => {
                      if (confirm(`Excluir a tag '${tagObj.nome}' do sistema?`)) {
                        await supabase.from('tags').delete().eq('id', tagObj.id);
                        setTagsGlobais(tagsGlobais.filter(t => t.id !== tagObj.id));
                      }
                    }} 
                    className={`ml-1 p-1 rounded transition ${temaNoturno ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {tagsGlobais.length === 0 && <span className={`text-sm italic ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Nenhuma tag configurada.</span>}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}