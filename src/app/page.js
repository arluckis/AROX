'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CardComanda from '@/components/CardComanda';
import ModalPeso from '@/components/ModalPeso';
import ModalPagamento from '@/components/ModalPagamento';
import GraficoFaturamento from '@/components/GraficoFaturamento';
import AdminProdutos from '@/components/AdminProdutos';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const TAGS_INICIAIS = ['Individual', 'Casal', 'Família', 'Estudantes', 'Academia', 'Com Crianças', 'Consumo Local', 'Para Viagem', 'Fidelidade'];
const CORES_PIZZA = ['#0d9488', '#4f46e5', '#059669', '#ef4444']; 

export default function Home() {
  const [autenticado, setAutenticado] = useState(false);
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  
  const [perfil, setPerfil] = useState({ nome: 'Bom a Bessa', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', mostrarFaturamento: true, mostrarPublico: true });
  
  // DADOS DO BANCO DE DADOS
  const [comandas, setComandas] = useState([]);
  const [menuCategorias, setMenuCategorias] = useState([]);
  const [tagsGlobais, setTagsGlobais] = useState(TAGS_INICIAIS);
  const [isLoading, setIsLoading] = useState(true);

  // MODAIS E MENUS
  const [mostrarMenuPerfil, setMostrarMenuPerfil] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarAdminProdutos, setMostrarAdminProdutos] = useState(false);
  const [mostrarConfigTags, setMostrarConfigTags] = useState(false);
  const [mostrarModalPeso, setMostrarModalPeso] = useState(false);
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  
  const [idSelecionado, setIdSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('comandas');
  const [abaDetalheMobile, setAbaDetalheMobile] = useState('menu');
  const [filtroCategoriaCardapio, setFiltroCategoriaCardapio] = useState('Todas');
  const [modoExclusao, setModoExclusao] = useState(false);
  const [selecionadasExclusao, setSelecionadasExclusao] = useState([]);

  // LÓGICA DE DATAS
  const getHoje = () => new Date().toISOString().split('T')[0];
  const getMesAtual = () => getHoje().substring(0, 7);
  const getAnoAtual = () => getHoje().substring(0, 4);
  const [filtroTempo, setFiltroTempo] = useState({ tipo: 'dia', valor: getHoje(), inicio: '', fim: '' });

  const comandaAtiva = comandas.find(c => c.id === idSelecionado);

  // ==========================================
  // 1. CARREGAMENTO INICIAL DO SUPABASE
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    
    // Busca o Cardápio
    const { data: catData } = await supabase.from('categorias').select('*, itens:produtos(*)');
    if (catData) setMenuCategorias(catData);

    // Busca as Comandas + Produtos + Pagamentos (Tudo aninhado e renomeado pro Front-end)
    const { data: comData } = await supabase
      .from('comandas')
      .select('*, produtos:comanda_produtos(*), pagamentos(*)');
    
    if (comData) setComandas(comData);
    setIsLoading(false);
  };

  useEffect(() => {
    if (autenticado) fetchData();
  }, [autenticado]);

  // ==========================================
  // 2. OPERAÇÕES DE CAIXA (CRUD NO SUPABASE)
  // ==========================================
  const adicionarComanda = async (tipo) => {
    if (modoExclusao) return;
    const qtdHoje = comandas.filter(c => c.data === getHoje()).length;
    const novaComanda = { nome: `Comanda ${qtdHoje + 1}`, tipo, data: getHoje(), status: 'aberta', tags: [] };
    
    // Insere no banco e recebe o UUID gerado
    const { data, error } = await supabase.from('comandas').insert([novaComanda]).select().single();
    if (data && !error) setComandas([...comandas, { ...data, produtos: [], pagamentos: [] }]);
  };

  const adicionarProdutoNaComanda = async (produto) => {
    const payload = {
      comanda_id: idSelecionado,
      nome: produto.nome,
      preco: produto.preco,
      custo: produto.custo || 0,
      pago: false,
      observacao: ''
    };
    const { data, error } = await supabase.from('comanda_produtos').insert([payload]).select().single();
    if (data && !error) {
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: [...c.produtos, data] } : c));
      setMostrarModalPeso(false);
      setAbaDetalheMobile('resumo');
    }
  };

  const editarNomeComanda = async () => {
    if (!comandaAtiva) return;
    const novoNome = prompt("Renomear comanda para:", comandaAtiva.nome);
    if (novoNome && novoNome.trim() !== "") {
      const { error } = await supabase.from('comandas').update({ nome: novoNome }).eq('id', idSelecionado);
      if (!error) setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, nome: novoNome } : c));
    }
  };

  const toggleTag = async (tag) => {
    const novasTags = comandaAtiva.tags.includes(tag) ? comandaAtiva.tags.filter(t => t !== tag) : [...comandaAtiva.tags, tag];
    const { error } = await supabase.from('comandas').update({ tags: novasTags }).eq('id', idSelecionado);
    if (!error) setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, tags: novasTags } : c));
  };

  const excluirProduto = async (idProduto) => {
    const { error } = await supabase.from('comanda_produtos').delete().eq('id', idProduto);
    if (!error) setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: c.produtos.filter(p => p.id !== idProduto) } : c));
  };

  const editarProduto = async (idProduto, obsAtual) => {
    const novaObs = prompt("Digite a observação:", obsAtual || "");
    if (novaObs !== null) {
      const { error } = await supabase.from('comanda_produtos').update({ observacao: novaObs }).eq('id', idProduto);
      if (!error) setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: c.produtos.map(p => p.id === idProduto ? { ...p, observacao: novaObs } : p) } : c));
    }
  };

  const excluirComanda = async () => {
    if (!comandaAtiva) return;
    if (comandaAtiva.pagamentos.length > 0) return alert("⚠️ BLOQUEADO! Comanda com pagamentos parciais.");
    if (confirm("Deseja excluir a comanda definitivamente?")) { 
      const idParaApagar = idSelecionado;
      setIdSelecionado(null); 
      const { error } = await supabase.from('comandas').delete().eq('id', idParaApagar);
      if (!error) setComandas(prev => prev.filter(c => c.id !== idParaApagar)); 
    }
  };

  const encerrarMesa = async () => { 
    const { error } = await supabase.from('comandas').update({ status: 'fechada' }).eq('id', idSelecionado);
    if (!error) {
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, status: 'fechada' } : c)); 
      setIdSelecionado(null); 
    }
  };

  const processarPagamento = async (valorFinal, formaPagamento, itensSelecionados, modoDivisao) => {
    let novosProdutos = [...comandaAtiva.produtos];
    let idsParaPagar = [];

    if (modoDivisao) {
      itensSelecionados.forEach(idx => { 
        novosProdutos[idx].pago = true; 
        idsParaPagar.push(novosProdutos[idx].id);
      });
    } else {
      novosProdutos = novosProdutos.map(p => ({ ...p, pago: true }));
      idsParaPagar = novosProdutos.map(p => p.id);
    }

    const todosPagos = novosProdutos.every(p => p.pago);
    
    // 1. Grava o Pagamento
    const payloadPagamento = { comanda_id: idSelecionado, valor: valorFinal, forma: formaPagamento, data: getHoje() };
    const { data: pgData, error: errPg } = await supabase.from('pagamentos').insert([payloadPagamento]).select().single();
    
    if (!errPg) {
      // 2. Atualiza os produtos para 'pago = true' no banco
      if (idsParaPagar.length > 0) {
        await supabase.from('comanda_produtos').update({ pago: true }).in('id', idsParaPagar);
      }
      // 3. Se tudo foi pago, fecha a comanda no banco
      if (todosPagos) {
        await supabase.from('comandas').update({ status: 'fechada' }).eq('id', idSelecionado);
      }
      
      // 4. Atualiza a tela
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: novosProdutos, pagamentos: [...c.pagamentos, pgData], status: todosPagos ? 'fechada' : 'aberta' } : c));
      setMostrarModalPagamento(false);
    } else {
      alert("Erro ao processar pagamento no banco de dados.");
    }
  };

  const confirmarExclusaoEmMassa = async () => {
    if (comandas.filter(c => selecionadasExclusao.includes(c.id)).some(c => c.pagamentos.length > 0)) return alert("⚠️ Desmarque as comandas que já possuem pagamentos.");
    if (confirm(`Excluir ${selecionadasExclusao.length} comandas do banco?`)) { 
      await supabase.from('comandas').delete().in('id', selecionadasExclusao);
      setComandas(comandas.filter(c => !selecionadasExclusao.includes(c.id))); 
      setModoExclusao(false); 
      setSelecionadasExclusao([]); 
    }
  };

  const toggleSelecaoExclusao = (id) => setSelecionadasExclusao(selecionadasExclusao.includes(id) ? selecionadasExclusao.filter(item => item !== id) : [...selecionadasExclusao, id]);

  // ==========================================
  // 3. LÓGICA DE CÁLCULOS E GRÁFICOS
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
  const comandasFechadasFiltradas = comandasFiltradas.filter(c => c.status === 'fechada');
  const pagamentosFiltrados = comandasFiltradas.flatMap(c => c.pagamentos);
  
  const faturamentoTotal = pagamentosFiltrados.reduce((acc, p) => acc + p.valor, 0);
  const custoTotalFiltrado = comandasFiltradas.reduce((acc, c) => acc + c.produtos.filter(p => p.pago).reduce((sum, p) => sum + (p.custo || 0), 0), 0);
  const lucroEstimado = faturamentoTotal - custoTotalFiltrado;

  const totalPix = pagamentosFiltrados.filter(p => p.forma === 'Pix').reduce((acc, p) => acc + p.valor, 0);
  const totalCartao = pagamentosFiltrados.filter(p => p.forma === 'Cartão').reduce((acc, p) => acc + p.valor, 0);
  const totalDinheiro = pagamentosFiltrados.filter(p => p.forma === 'Dinheiro').reduce((acc, p) => acc + p.valor, 0);
  const totalIfood = pagamentosFiltrados.filter(p => p.forma === 'iFood').reduce((acc, p) => acc + p.valor, 0);
  const dadosPizza = [{ name: 'Pix', value: totalPix }, { name: 'Cartão', value: totalCartao }, { name: 'Dinheiro', value: totalDinheiro }, { name: 'iFood', value: totalIfood }].filter(d => d.value > 0);

  const contagemTipos = { Balcão: 0, Delivery: 0, iFood: 0 };
  const contagemTags = {};
  comandasFiltradas.forEach(c => {
    if (c.pagamentos.some(p => p.forma === 'iFood')) contagemTipos['iFood'] += 1; else contagemTipos[c.tipo] = (contagemTipos[c.tipo] || 0) + 1;
    c.tags.forEach(t => { contagemTags[t] = (contagemTags[t] || 0) + 1; });
  });

  const dadosTipos = Object.keys(contagemTipos).map(k => ({ nome: k, qtd: contagemTipos[k] })).filter(d => d.qtd > 0);
  const dadosTags = Object.keys(contagemTags).map(k => ({ nome: k, qtd: contagemTags[k] })).sort((a, b) => b.qtd - a.qtd);

  const renderHistorico = () => {
    if (filtroTempo.tipo === 'periodo' || comandas.length === 0) return null;
    let chavesPassadas = [...new Set(comandas.map(c => filtroTempo.tipo === 'dia' ? c.data : filtroTempo.tipo === 'mes' ? c.data.substring(0, 7) : c.data.substring(0, 4)))].filter(k => k !== filtroTempo.valor).sort().reverse().slice(0, 3);
    if(chavesPassadas.length === 0) return null;
    return (
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        <div className="flex items-center text-gray-400 text-xs font-bold uppercase whitespace-nowrap">Histórico:</div>
        {chavesPassadas.map(chave => {
          let fatPassado = comandas.filter(c => c.data.startsWith(chave)).flatMap(c => c.pagamentos).reduce((acc, p) => acc + p.valor, 0);
          return <div key={chave} className="bg-gray-200/50 px-4 py-2 rounded-xl text-sm whitespace-nowrap"><span className="font-bold text-gray-500 mr-2">{chave}:</span><span className="font-black text-gray-700">R$ {fatPassado.toFixed(2)}</span></div>
        })}
      </div>
    );
  };

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
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
          <div className="flex justify-center mb-6"><img src={perfil.logo} alt="Logo" className="w-24 h-24 rounded-full border-4 border-purple-100 object-cover" /></div>
          <h2 className="text-2xl font-black text-center text-purple-800 mb-2">Acesso Restrito</h2>
          <p className="text-center text-gray-400 text-sm mb-6">Entre com suas credenciais do painel.</p>
          <div className="space-y-4">
            <input type="email" placeholder="E-mail (admin@bessa.com)" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500" value={credenciais.email} onChange={e => setCredenciais({...credenciais, email: e.target.value})} />
            <input type="password" placeholder="Senha (123456)" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500" value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})} />
            <button onClick={() => { if(credenciais.email === 'admin@bessa.com' && credenciais.senha === '123456') setAutenticado(true); else alert('Use admin@bessa.com e 123456'); }} className="w-full bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition shadow-lg">Entrar no Sistema</button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-purple-600 font-bold text-xl animate-pulse">Carregando Banco de Dados...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-2 md:p-6 flex flex-col">
      <header className="flex items-center justify-between bg-white p-3 md:p-4 rounded-2xl shadow-sm mb-4 sticky top-0 z-10">
        {comandaAtiva ? (
          <button onClick={() => setIdSelecionado(null)} className="flex items-center gap-2 text-purple-700 font-bold bg-purple-50 px-4 py-2 rounded-xl hover:bg-purple-100 transition"><span className="text-xl">←</span> <span className="hidden md:inline">Voltar</span></button>
        ) : (
          <div className="relative">
            <button onClick={() => setMostrarMenuPerfil(!mostrarMenuPerfil)} className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
              <img src={perfil.logo} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-purple-100 object-cover" alt="Perfil" />
              <span className="font-black text-purple-800 tracking-tight hidden md:inline">{perfil.nome}</span>
              <span className="text-xs text-gray-400">▼</span>
            </button>
            {mostrarMenuPerfil && (
              <div className="absolute top-12 left-0 bg-white shadow-xl rounded-xl p-2 w-56 border border-gray-100 z-50">
                <button onClick={() => { setMostrarConfig(true); setMostrarMenuPerfil(false); }} className="w-full text-left p-2 text-sm font-bold text-gray-700 hover:bg-purple-50 rounded-lg">⚙️ Configurações de Perfil</button>
                <button onClick={() => { setMostrarAdminProdutos(true); setMostrarMenuPerfil(false); }} className="w-full text-left p-2 text-sm font-bold text-gray-700 hover:bg-purple-50 rounded-lg">📦 Gerenciar Cardápio</button>
                <button onClick={() => { setMostrarConfigTags(true); setMostrarMenuPerfil(false); }} className="w-full text-left p-2 text-sm font-bold text-gray-700 hover:bg-purple-50 rounded-lg">🏷️ Configurar Tags</button>
                <div className="h-px bg-gray-100 my-1"></div>
                <button onClick={() => { setAutenticado(false); setMostrarMenuPerfil(false); }} className="w-full text-left p-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg">🚪 Sair</button>
              </div>
            )}
          </div>
        )}

        {!comandaAtiva && (
          <div className="flex bg-gray-100 rounded-xl p-1 overflow-x-auto text-sm md:text-base">
            <button onClick={() => setAbaAtiva('comandas')} className={`px-3 md:px-5 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'comandas' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-purple-600'}`}>Caixa</button>
            {perfil.mostrarFaturamento && <button onClick={() => setAbaAtiva('faturamento')} className={`px-3 md:px-5 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'faturamento' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-purple-600'}`}>Faturamento</button>}
            {perfil.mostrarPublico && <button onClick={() => setAbaAtiva('analises')} className={`px-3 md:px-5 py-2 rounded-lg font-bold transition whitespace-nowrap ${abaAtiva === 'analises' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-purple-600'}`}>Estudo de Público</button>}
          </div>
        )}
        {comandaAtiva && <h2 className="text-lg font-black text-purple-800 truncate max-w-[150px] md:max-w-xs text-right cursor-pointer" onClick={editarNomeComanda}>{comandaAtiva?.nome} ✏️</h2>}
      </header>

      {!comandaAtiva ? (
        abaAtiva === 'comandas' ? (
          <div className="flex flex-col animate-in fade-in duration-300">
            {comandasAbertas.length > 0 && (
              <div className="flex justify-end mb-4">
                {!modoExclusao ? <button onClick={() => setModoExclusao(true)} className="text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition">Excluir Múltiplas</button> : (
                  <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    <span className="text-red-700 font-bold text-sm">{selecionadasExclusao.length} selecionadas</span>
                    <button onClick={() => { setModoExclusao(false); setSelecionadasExclusao([]); }} className="text-gray-500 font-bold text-sm hover:text-gray-700">Cancelar</button>
                    <button onClick={confirmarExclusaoEmMassa} disabled={selecionadasExclusao.length === 0} className="bg-red-500 text-white font-bold text-sm px-4 py-1.5 rounded-md disabled:opacity-50 transition">Confirmar Exclusão</button>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-4 md:gap-6">
              <button onClick={() => adicionarComanda('Balcão')} disabled={modoExclusao} className={`w-32 h-44 border-2 border-purple-500 rounded-2xl flex flex-col items-center justify-center font-bold text-purple-600 bg-white transition shadow-sm ${modoExclusao ? 'opacity-40 cursor-not-allowed' : 'hover:bg-purple-50 hover:scale-105 cursor-pointer'}`}><span className="text-4xl mb-2">+</span><span>Balcão</span></button>
              <button onClick={() => adicionarComanda('Delivery')} disabled={modoExclusao} className={`w-32 h-44 border-2 border-orange-500 rounded-2xl flex flex-col items-center justify-center font-bold text-orange-600 bg-white transition shadow-sm ${modoExclusao ? 'opacity-40 cursor-not-allowed' : 'hover:bg-orange-50 hover:scale-105 cursor-pointer'}`}><span className="text-4xl mb-2">+</span><span>Delivery</span></button>
              {comandasAbertas.map((item) => (
                <div key={item.id} className="relative">
                  <CardComanda comanda={item} onClick={() => modoExclusao ? toggleSelecaoExclusao(item.id) : setIdSelecionado(item.id)} />
                  {modoExclusao && <div className={`absolute inset-0 rounded-2xl border-4 pointer-events-none transition ${selecionadasExclusao.includes(item.id) ? 'border-red-500 bg-red-500/20' : 'border-transparent bg-black/5'}`} />}
                </div>
              ))}
            </div>
          </div>
        ) : abaAtiva === 'faturamento' ? (
          <div className="max-w-5xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                {['dia', 'mes', 'ano', 'periodo'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? 'bg-purple-500 text-white' : 'text-gray-500'}`}>{t}</button>)}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border rounded-xl outline-none text-sm font-bold w-full" />}
                {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border rounded-xl outline-none text-sm font-bold w-full" />}
                {filtroTempo.tipo === 'ano' && <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border rounded-xl outline-none text-sm font-bold w-full" />}
                {filtroTempo.tipo === 'periodo' && (
                  <>
                    <input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className="p-2 border rounded-xl outline-none text-xs font-bold w-full" />
                    <span className="self-center font-bold text-gray-400">até</span>
                    <input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className="p-2 border rounded-xl outline-none text-xs font-bold w-full" />
                  </>
                )}
              </div>
            </div>
            {renderHistorico()}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-3xl shadow-md col-span-2">
                <h3 className="text-purple-100 text-xs font-bold uppercase mb-1">Venda Bruta</h3>
                <p className="text-3xl font-black">R$ {faturamentoTotal.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-3xl shadow-md col-span-2">
                <h3 className="text-green-100 text-xs font-bold uppercase mb-1">Lucro Bruto Estimado</h3>
                <p className="text-3xl font-black">R$ {lucroEstimado.toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col gap-4">
                <h3 className="text-gray-800 text-sm font-bold uppercase text-center border-b pb-2">Meios de Pagamento</h3>
                <div className="flex justify-between items-center"><span className="text-teal-600 font-bold">Pix</span><span className="font-black text-teal-800">R$ {totalPix.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="text-indigo-600 font-bold">Cartão</span><span className="font-black text-indigo-800">R$ {totalCartao.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="text-emerald-600 font-bold">Dinheiro</span><span className="font-black text-emerald-800">R$ {totalDinheiro.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="text-red-500 font-bold">iFood</span><span className="font-black text-red-700">R$ {totalIfood.toFixed(2)}</span></div>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 h-64">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dadosPizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{dadosPizza.map((e, i) => <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />)}</Pie><RechartsTooltip formatter={(val) => `R$ ${val.toFixed(2)}`} /><Legend /></PieChart></ResponsiveContainer>
              </div>
            </div>
            <GraficoFaturamento comandas={comandasFiltradas} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                {['dia', 'mes', 'ano'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? 'bg-purple-500 text-white' : 'text-gray-500'}`}>{t}</button>)}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border rounded-xl outline-none text-sm font-bold w-full" />}
                {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className="p-2 border rounded-xl outline-none text-sm font-bold w-full" />}
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
                  <div className="flex flex-wrap gap-1.5">{tagsGlobais.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${comandaAtiva?.tags.includes(tag) ? 'bg-purple-400 text-purple-900' : 'bg-purple-800/50 text-purple-300 hover:bg-purple-700'}`}>{tag}</button>)}</div>
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

      {/* MODAL CONFIGURAÇÕES E TAGS */}
      {mostrarConfig && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-purple-800 mb-6 text-center">Configurações</h2>
            <label className="block mb-2 text-sm font-bold text-gray-600">Nome do Estabelecimento</label>
            <input type="text" value={perfil.nome} onChange={e => setPerfil({...perfil, nome: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl mb-4 outline-none focus:border-purple-500" />
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2 mt-4">Módulos</h3>
            <label className="flex items-center gap-3 mb-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg"><input type="checkbox" checked={perfil.mostrarFaturamento} onChange={e => setPerfil({...perfil, mostrarFaturamento: e.target.checked})} className="w-5 h-5 accent-purple-600" /><span className="font-medium text-gray-700">Aba Faturamento</span></label>
            <label className="flex items-center gap-3 mb-6 cursor-pointer p-2 hover:bg-gray-50 rounded-lg"><input type="checkbox" checked={perfil.mostrarPublico} onChange={e => setPerfil({...perfil, mostrarPublico: e.target.checked})} className="w-5 h-5 accent-purple-600" /><span className="font-medium text-gray-700">Estudo de Público</span></label>
            <button onClick={() => setMostrarConfig(false)} className="w-full bg-purple-600 text-white font-bold p-3 rounded-xl hover:bg-purple-700 transition">Salvar</button>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR TAGS */}
      {mostrarConfigTags && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-purple-800">Tags de Comportamento</h2>
                <button onClick={() => setMostrarConfigTags(false)} className="bg-gray-100 p-2 rounded-full font-bold">✕</button>
             </div>
             <div className="flex gap-2 mb-6">
                <input type="text" id="inputNovaTag" placeholder="Nova tag (Ex: Ifood Retirada)" className="flex-1 p-3 border border-gray-200 rounded-xl outline-none" onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) { setTagsGlobais([...tagsGlobais, e.target.value]); e.target.value = ''; }
                }} />
                <button onClick={() => {
                  const input = document.getElementById('inputNovaTag');
                  if (input.value) { setTagsGlobais([...tagsGlobais, input.value]); input.value = ''; }
                }} className="bg-purple-600 text-white px-4 rounded-xl font-bold">+</button>
             </div>
             <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {tagsGlobais.map(t => (
                  <div key={t} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 flex items-center gap-2">
                    {t} <button onClick={() => setTagsGlobais(tagsGlobais.filter(tag => tag !== t))} className="text-red-500 hover:text-red-700 ml-1">✕</button>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}

      {mostrarAdminProdutos && <AdminProdutos onFechar={() => { setMostrarAdminProdutos(false); fetchData(); }} />}
      {mostrarModalPeso && <ModalPeso opcoesPeso={[{ id: '1', nome: 'Preço Normal', preco: 39.90 }]} onAdicionar={adicionarProdutoNaComanda} onCancelar={() => setMostrarModalPeso(false)} />}
      {mostrarModalPagamento && <ModalPagamento comanda={comandaAtiva} onConfirmar={processarPagamento} onCancelar={() => setMostrarModalPagamento(false)} />}
    </main>
  );
}