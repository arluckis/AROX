'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// Componentes Modularizados
import Login from '@/components/Login';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import TabComandas from '@/components/TabComandas';
import TabFechadas from '@/components/TabFechadas';
import TabFaturamento from '@/components/TabFaturamento';
import TabAnalises from '@/components/TabAnalises';
import PainelComanda from '@/components/PainelComanda';
import TabFechamentoCaixa from '@/components/TabFechamentoCaixa';

// Modais
import ModalConfigEmpresa from '@/components/ModalConfigEmpresa';
import ModalConfigTags from '@/components/ModalConfigTags';
import ModalPeso from '@/components/ModalPeso';
import ModalPagamento from '@/components/ModalPagamento';
import AdminProdutos from '@/components/AdminProdutos';
import AdminUsuarios from '@/components/AdminUsuarios';
import AdminDelivery from '@/components/AdminDelivery'; 

export default function Home() {

  // --- SISTEMA DE FORÇAR LIMPEZA DE CACHE ---
  useEffect(() => {
    // TODA VEZ QUE VOCÊ SUBIR UMA ATUALIZAÇÃO PARA O CLIENTE, MUDE ESTE NÚMERO
    // Ex: mude para '1.0.2', depois '1.0.3', etc.
    const VERSAO_ATUAL = '1.0.1'; 
    const versaoNoNavegador = localStorage.getItem('bessa_versao_sistema');

    if (versaoNoNavegador !== VERSAO_ATUAL) {
      console.log("Versão antiga detectada. Forçando atualização...");
      
      // Atualiza a versão no navegador do cliente
      localStorage.setItem('bessa_versao_sistema', VERSAO_ATUAL);
      
      // Um truque para forçar o navegador a recarregar ignorando o cache
      if (typeof window !== 'undefined') {
        window.location.href = window.location.pathname + '?v=' + new Date().getTime();
      }
    }
  }, []);
  // ------------------------------------------
  
  const getHoje = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  };

  const getMesAtual = () => getHoje().substring(0, 7);
  const getAnoAtual = () => getHoje().substring(0, 4);

  const fraseCarregamento = useMemo(() => {
    const frases = [
      "Carregando",
      "Organizando as comandas",
      "Quase tudo pronto",
      "Adicionando feitiço para trazer clientes",
      "Falta só mais isso aqui"
    ];
    return frases[Math.floor(Math.random() * frases.length)];
  }, []);

  const [sessao, setSessao] = useState(null); 
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [nomeEmpresa, setNomeEmpresa] = useState('A Carregar...'); 
  const [temaNoturno, setTemaNoturno] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [mostrarConfigEmpresa, setMostrarConfigEmpresa] = useState(false);
  const [nomeEmpresaEdicao, setNomeEmpresaEdicao] = useState('');
  const [logoEmpresa, setLogoEmpresa] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  const [logoEmpresaEdicao, setLogoEmpresaEdicao] = useState('');

  const [ignorarAvisoAntigas, setIgnorarAvisoAntigas] = useState(false);
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
  const [mostrarAdminDelivery, setMostrarAdminDelivery] = useState(false);
  const [mostrarModalPeso, setMostrarModalPeso] = useState(false);
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  
  const [idSelecionado, setIdSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('comandas');
  const [avisoFechamento, setAvisoFechamento] = useState(false);

  const [abaDetalheMobile, setAbaDetalheMobile] = useState('menu');
  const [filtroCategoriaCardapio, setFiltroCategoriaCardapio] = useState('Todas');
  const [modoExclusao, setModoExclusao] = useState(false);
  const [selecionadasExclusao, setSelecionadasExclusao] = useState([]);

  const [filtroTempo, setFiltroTempo] = useState({ tipo: 'dia', valor: getHoje(), inicio: '', fim: '' });

  const [modalGlobal, setModalGlobal] = useState({ visivel: false, tipo: 'alerta', titulo: '', mensagem: '', valorInput: '', acaoConfirmar: null });

  const mostrarAlerta = (titulo, mensagem) => setModalGlobal({ visivel: true, tipo: 'alerta', titulo, mensagem, valorInput: '', acaoConfirmar: null });
  const mostrarConfirmacao = (titulo, mensagem, acaoConfirmar) => setModalGlobal({ visivel: true, tipo: 'confirmacao', titulo, mensagem, valorInput: '', acaoConfirmar });
  const mostrarPrompt = (titulo, mensagem, valorInicial, acaoConfirmar) => setModalGlobal({ visivel: true, tipo: 'prompt', titulo, mensagem, valorInput: valorInicial || '', acaoConfirmar });
  const fecharModalGlobal = () => setModalGlobal({ visivel: false, tipo: 'alerta', titulo: '', mensagem: '', valorInput: '', acaoConfirmar: null });

  useEffect(() => {
    const verificarHorario = () => {
       const agora = new Date();
       const horas = agora.getHours();
       const minutos = agora.getMinutes();
       if ((horas === 22 && minutos >= 50) || horas >= 23 || horas < 4) {
          setAvisoFechamento(true);
       } else {
          setAvisoFechamento(false);
       }
    };
    
    verificarHorario();
    const intervalo = setInterval(verificarHorario, 60000); 
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const temaSalvo = localStorage.getItem('bessa_tema_noturno');
    if (temaSalvo !== null) { setTemaNoturno(JSON.parse(temaSalvo)); }

    const logoSalva = localStorage.getItem('bessa_logo_empresa');
    if (logoSalva) setLogoEmpresa(logoSalva);
    
    const sessionData = localStorage.getItem('bessa_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.empresa_id) { setSessao(parsed); } 
        else { localStorage.removeItem('bessa_session'); }
      } catch(e) { localStorage.removeItem('bessa_session'); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bessa_tema_noturno', JSON.stringify(temaNoturno));
    document.body.style.backgroundColor = temaNoturno ? '#111827' : '#f9fafb'; 
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', temaNoturno ? '#1f2937' : '#ffffff');
  }, [temaNoturno]);

  const fazerLogout = () => {
    localStorage.removeItem('bessa_session');
    localStorage.removeItem('bessa_logo_empresa');
    setSessao(null); 
    setCredenciais({ email: '', senha: '' }); 
    setMostrarMenuPerfil(false); 
    setMenuMobileAberto(false); 
    setAbaAtiva('comandas');
    setLogoEmpresa('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  };

  // Modificado para aceitar isBackground e não piscar a tela
  const fetchData = async (isBackground = false) => {
    if (!sessao?.empresa_id) return;
    if (!isBackground) setIsLoading(true);
    
    try {
      const { data: empData, error: empError } = await supabase.from('empresas').select('*').eq('id', sessao.empresa_id).single();
      if (empError) {
        console.warn("Aviso ao buscar empresa:", empError.message);
        if(!isBackground) setNomeEmpresa("A Minha Loja"); 
      } else if (empData) {
        if(!isBackground) setNomeEmpresa(empData.nome || "A Minha Loja");
        if(!isBackground) setNomeEmpresaEdicao(empData.nome || "");
        const urlLogo = empData.logo || empData.logo_url;
        if (urlLogo) {
          if(!isBackground) setLogoEmpresa(urlLogo); 
          if(!isBackground) setLogoEmpresaEdicao(urlLogo); 
          localStorage.setItem('bessa_logo_empresa', urlLogo); 
        }
      }

      const { data: catData } = await supabase.from('categorias').select('*, itens:produtos(*)').eq('empresa_id', sessao.empresa_id);
      if (catData) setMenuCategorias(catData);

      const { data: caixasAbertos } = await supabase.from('caixas').select('*').eq('empresa_id', sessao.empresa_id).eq('status', 'aberto').order('id', { ascending: false }).limit(1); 
      let caixaData = caixasAbertos && caixasAbertos.length > 0 ? caixasAbertos[0] : null;
      
      if (caixaData) {
        setCaixaAtual(caixaData);
      } else {
        setCaixaAtual({ status: 'fechado' });
      }
      
      const { data: comData } = await supabase.from('comandas').select('*, produtos:comanda_produtos(*), pagamentos(*)').eq('empresa_id', sessao.empresa_id).order('id', { ascending: true });
      if (comData) setComandas(comData);

      const { data: pesoData } = await supabase.from('config_peso').select('*').eq('empresa_id', sessao.empresa_id);
      if (pesoData) setConfigPeso(pesoData.map(p => ({ id: p.id, nome: p.nome, preco: parseFloat(p.preco_kg), custo: parseFloat(p.custo_kg || 0) })));

      const { data: tagsData } = await supabase.from('tags').select('*').eq('empresa_id', sessao.empresa_id);
      if (tagsData && tagsData.length > 0) {
        setTagsGlobais(tagsData); 
      } else {
        if (!isBackground) {
           const TAGS_INICIAIS = ['Individual', 'Casal', 'Família', 'Estudantes', 'Academia', 'Com Crianças', 'Consumo Local', 'Para Viagem', 'Fidelidade'];
           const tagsSemente = TAGS_INICIAIS.map(t => ({ nome: t, empresa_id: sessao.empresa_id }));
           const { data: tagsInseridas } = await supabase.from('tags').insert(tagsSemente).select();
           if (tagsInseridas) setTagsGlobais(tagsInseridas);
        }
      }
    } catch (err) {
      console.error("Erro inesperado no fetch:", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  // --- O "FALSO REALTIME" (Polling sem Supabase Realtime) ---
  useEffect(() => {
    if (!sessao?.empresa_id) return;
    
    fetchData(); // Carregamento inicial

    // Busca atualizações no banco a cada 10 segundos invisivelmente
    const intervaloPolling = setInterval(() => {
       fetchData(true); 
    }, 10000); 

    return () => clearInterval(intervaloPolling);
  }, [sessao]);
  // ------------------------------------

  const abrirCaixaManual = async (dadosCaixa) => {
    if (!sessao?.empresa_id) return;
    setIsLoading(true);
    try {
      const payload = {
        empresa_id: sessao.empresa_id,
        data_abertura: dadosCaixa.data_abertura,
        saldo_inicial: dadosCaixa.saldo_inicial || 0,
        status: 'aberto'
      };
      
      const { data, error } = await supabase.from('caixas').insert([payload]).select().single();
      if (error) throw error;
      
      if (data) {
        setCaixaAtual(data);
        mostrarAlerta("Sucesso", "Caixa aberto com sucesso!");
        fetchData();
      }
    } catch (err) {
      mostrarAlerta("Erro", "Erro ao abrir caixa: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const salvarConfigEmpresa = async () => {
    if (nomeEmpresaEdicao.trim() === '') return mostrarAlerta("Aviso", "O nome não pode estar vazio.");
    const { error } = await supabase.from('empresas').update({ nome: nomeEmpresaEdicao, logo_url: logoEmpresaEdicao }).eq('id', sessao.empresa_id);
    if (error) return mostrarAlerta("Erro", "Erro ao salvar no banco de dados: " + error.message);
    setNomeEmpresa(nomeEmpresaEdicao); setLogoEmpresa(logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'); setMostrarConfigEmpresa(false);
  };

  const adicionarComanda = async (tipo) => {
    if (modoExclusao || !sessao?.empresa_id) return;
    const qtdHoje = comandas.filter(c => c.data === getHoje()).length;
    const novaComanda = { 
      nome: `Comanda ${qtdHoje + 1}`, 
      tipo, 
      data: getHoje(), 
      hora_abertura: new Date().toISOString(), 
      status: 'aberta', 
      tags: [], 
      empresa_id: sessao.empresa_id 
    };
    const { data, error } = await supabase.from('comandas').insert([novaComanda]).select().single();
    if (data && !error) setComandas([...comandas, { ...data, produtos: [], pagamentos: [] }]);
  };

  const adicionarProdutoNaComanda = async (produto) => {
    if (!sessao?.empresa_id) return;
    const payload = { comanda_id: idSelecionado, nome: produto.nome, preco: produto.preco, custo: produto.custo || 0, pago: false, observacao: '', empresa_id: sessao.empresa_id };
    const { data, error } = await supabase.from('comanda_produtos').insert([payload]).select().single();
    if (data && !error) {
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: [...(c.produtos || []), data] } : c));
      setMostrarModalPeso(false); setAbaDetalheMobile('resumo');
    }
  };

  const toggleTag = async (tagNome) => {
    const tagsAtuais = comandaAtiva?.tags || [];
    const novasTags = tagsAtuais.includes(tagNome) ? tagsAtuais.filter(t => t !== tagNome) : [...tagsAtuais, tagNome];
    await supabase.from('comandas').update({ tags: novasTags }).eq('id', idSelecionado);
    setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, tags: novasTags } : c));
  };

  const excluirProduto = async (idProduto) => {
    await supabase.from('comanda_produtos').delete().eq('id', idProduto);
    setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).filter(p => p.id !== idProduto) } : c));
  };

  const editarProduto = async (idProduto, obsAtual) => {
    mostrarPrompt("Editar Observação", "Digite a observação para este item:", obsAtual, async (novaObs) => {
      await supabase.from('comanda_produtos').update({ observacao: novaObs }).eq('id', idProduto);
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).map(p => p.id === idProduto ? { ...p, observacao: novaObs } : p) } : c));
    });
  };

  const encerrarMesa = async () => { 
    const horaFechamento = new Date().toISOString();
    await supabase.from('comandas').update({ status: 'fechada', hora_fechamento: horaFechamento }).eq('id', idSelecionado);
    setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, status: 'fechada', hora_fechamento: horaFechamento } : c)); 
    setIdSelecionado(null); 
  };

  const processarPagamento = async (valorFinal, formaPagamento, itensSelecionados, modoDivisao, bairroId = null, taxaEntrega = 0) => {
    if (!sessao?.empresa_id) return;
    let novosProdutos = [...(comandaAtiva?.produtos || [])];
    let idsParaPagar = [];
    if (modoDivisao) { itensSelecionados.forEach(idx => { novosProdutos[idx].pago = true; idsParaPagar.push(novosProdutos[idx].id); }); } 
    else { novosProdutos = novosProdutos.map(p => ({ ...p, pago: true })); idsParaPagar = novosProdutos.map(p => p.id); }
    const todosPagos = novosProdutos.length > 0 && novosProdutos.every(p => p.pago);
    const payloadPagamento = { comanda_id: idSelecionado, valor: valorFinal, forma: formaPagamento, data: getHoje(), empresa_id: sessao.empresa_id };
    
    const { data: pgData, error: errPg } = await supabase.from('pagamentos').insert([payloadPagamento]).select().single();
    if (!errPg) {
      if (idsParaPagar.length > 0) await supabase.from('comanda_produtos').update({ pago: true }).in('id', idsParaPagar);
      const horaFechamento = new Date().toISOString();
      if (todosPagos) await supabase.from('comandas').update({ status: 'fechada', hora_fechamento: horaFechamento }).eq('id', idSelecionado);
      
      setComandas(comandas.map(c => {
        if (c.id === idSelecionado) {
           return {
              ...c,
              produtos: novosProdutos,
              pagamentos: [...(c.pagamentos || []), pgData],
              status: todosPagos ? 'fechada' : 'aberta',
              hora_fechamento: todosPagos ? horaFechamento : c.hora_fechamento,
              bairro_id: bairroId || c.bairro_id,
              taxa_entrega: taxaEntrega > 0 ? taxaEntrega : c.taxa_entrega
           };
        }
        return c;
      }));
      setMostrarModalPagamento(false);
    }
  };

  const confirmarExclusaoEmMassa = async () => {
    if (comandas.filter(c => selecionadasExclusao.includes(c.id)).some(c => (c.pagamentos || []).length > 0)) {
      return mostrarAlerta("Atenção", "Desmarque as comandas que já possuem pagamentos.");
    }
    mostrarConfirmacao("Excluir Comandas", `Excluir ${selecionadasExclusao.length} comandas do banco?`, async () => {
      await supabase.from('comandas').delete().in('id', selecionadasExclusao);
      setComandas(comandas.filter(c => !selecionadasExclusao.includes(c.id))); setModoExclusao(false); setSelecionadasExclusao([]); 
    });
  };

  const toggleSelecaoExclusao = (id) => setSelecionadasExclusao(selecionadasExclusao.includes(id) ? selecionadasExclusao.filter(item => item !== id) : [...selecionadasExclusao, id]);
  
  const reabrirComandaFechada = async (id) => {
    mostrarConfirmacao("Reabrir Comanda", "Deseja reabrir esta comanda? Ela voltará para a aba Comandas em Aberto.", async () => {
      await supabase.from('comandas').update({ status: 'aberta', hora_fechamento: null }).eq('id', id);
      setComandas(comandas.map(c => c.id === id ? { ...c, status: 'aberta', hora_fechamento: null } : c));
    });
  };

  const excluirComandaFechada = async (id) => {
    mostrarConfirmacao("Excluir Comanda", "ATENÇÃO: Deseja excluir esta comanda definitivamente? O faturamento dela será perdido.", async () => {
      await supabase.from('comandas').delete().eq('id', id);
      setComandas(comandas.filter(c => c.id !== id));
    });
  };

  const isComandaInFiltro = (dataComanda) => {
    if (!dataComanda) return false;
    if (filtroTempo.tipo === 'dia') return dataComanda === filtroTempo.valor;
    if (filtroTempo.tipo === '7 dias') {
      const dataFim = getHoje();
      const dtIn = new Date(dataFim + 'T12:00:00');
      dtIn.setDate(dtIn.getDate() - 6);
      const dataInicio = dtIn.toISOString().split('T')[0];
      return dataComanda >= dataInicio && dataComanda <= dataFim;
    }
    if (filtroTempo.tipo === 'mes') return dataComanda.startsWith(filtroTempo.valor);
    if (filtroTempo.tipo === 'ano') return dataComanda.startsWith(filtroTempo.valor);
    if (filtroTempo.tipo === 'periodo') return dataComanda >= filtroTempo.inicio && dataComanda <= filtroTempo.fim;
    return false;
  };

  const comandaAtiva = comandas.find(c => c.id === idSelecionado);
  const alertaTags = comandas.filter(c => c.status === 'aberta').length >= 3 && comandas.filter(c => c.status === 'aberta').every(c => !(c.tags || []).length);

  const comandasFiltradas = comandas.filter(c => isComandaInFiltro(c.data));
  const comandasAbertas = comandas.filter(c => c.status === 'aberta');
  const comandasFechadasHoje = comandas.filter(c => c.status === 'fechada' && c.data === getHoje());
  const comandasAntigasAbertas = comandas.filter(c => c.status === 'aberta' && caixaAtual?.data_abertura && c.data && c.data.substring(0,10) !== caixaAtual.data_abertura.substring(0,10));

  const faturamentoTotal = comandasFiltradas.reduce((acc, c) => acc + (c.produtos || []).reduce((sum, p) => sum + (p.preco || 0), 0), 0);
  const custoTotalFiltrado = comandasFiltradas.reduce((acc, c) => acc + (c.produtos || []).reduce((sum, p) => sum + (p.custo || 0), 0), 0);
  const lucroEstimado = faturamentoTotal - custoTotalFiltrado;

  const pagamentosFiltrados = comandasFiltradas.flatMap(c => c.pagamentos || []);
  const pagamentosAgrupados = pagamentosFiltrados.reduce((acc, p) => { acc[p.forma] = (acc[p.forma] || 0) + p.valor; return acc; }, {});
  const dadosPizza = Object.keys(pagamentosAgrupados).map(key => ({ name: key, value: pagamentosAgrupados[key] })).filter(d => d.value > 0);

  const contagemProdutos = {};
  comandasFiltradas.forEach(c => {
    (c.produtos || []).forEach(p => {
      const isPeso = p.nome.toLowerCase().includes('peso') || p.nome.toLowerCase().includes('balança');
      let nomeChave = isPeso ? p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim() : p.nome;
      if (!contagemProdutos[nomeChave]) { contagemProdutos[nomeChave] = { faturamento: 0, volume: 0, isPeso: isPeso }; }
      contagemProdutos[nomeChave].faturamento += (p.preco || 0);
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
    if ((c.pagamentos || []).some(p => p.forma === 'iFood')) contagemTipos['iFood'] += 1; else contagemTipos[c.tipo] = (contagemTipos[c.tipo] || 0) + 1;
    (c.tags || []).forEach(t => { contagemTags[t] = (contagemTags[t] || 0) + 1; });
  });

  const dadosTipos = Object.keys(contagemTipos).map(k => ({ nome: k, qtd: contagemTipos[k] })).filter(d => d.qtd > 0);
  const dadosTags = Object.keys(contagemTags).map(k => ({ nome: k, qtd: contagemTags[k] })).sort((a, b) => b.qtd - a.qtd);

  if (!sessao) { return <Login getHoje={getHoje} setSessao={setSessao} temaNoturno={temaNoturno} setTemaNoturno={setTemaNoturno} />; }

  if (isLoading && comandas.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-8 ${temaNoturno ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="relative">
          <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 animate-pulse ${temaNoturno ? 'bg-purple-500' : 'bg-purple-600'}`}></div>
          <div className={`relative w-32 h-32 rounded-full border-4 overflow-hidden shadow-2xl animate-in zoom-in duration-500 ${temaNoturno ? 'border-gray-800 bg-gray-800' : 'border-white bg-white'}`}>
            <img src={logoEmpresa} alt="A carregar" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
          <p className={`font-black text-sm uppercase tracking-[0.2em] mb-3 text-center ${temaNoturno ? 'text-gray-500' : 'text-purple-400'}`}>{fraseCarregamento}</p>
          <div className="flex gap-1.5 items-center justify-center h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen p-2 xl:p-6 flex flex-col transition-colors duration-500 ${temaNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      <Header 
        comandaAtiva={comandaAtiva} setIdSelecionado={setIdSelecionado} setMenuMobileAberto={setMenuMobileAberto}
        temaNoturno={temaNoturno} caixaAtual={caixaAtual} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
        logoEmpresa={logoEmpresa} setTemaNoturno={setTemaNoturno} mostrarMenuPerfil={mostrarMenuPerfil}
        setMostrarMenuPerfil={setMostrarMenuPerfil} nomeEmpresa={nomeEmpresa} sessao={sessao}
        setMostrarAdminDelivery={setMostrarAdminDelivery}
        setMostrarConfigEmpresa={setMostrarConfigEmpresa} setMostrarAdminUsuarios={setMostrarAdminUsuarios}
        setMostrarAdminProdutos={setMostrarAdminProdutos} setMostrarConfigTags={setMostrarConfigTags} fazerLogout={fazerLogout}
        fetchData={fetchData}
      />

      <div className="max-w-7xl mx-auto w-full flex flex-col gap-3 mb-6 px-4 xl:px-0">
        {avisoFechamento && !comandaAtiva && (
          <div className={`p-4 rounded-3xl flex items-center gap-4 border shadow-sm transition-colors duration-300 ${temaNoturno ? 'bg-red-900/10 border-red-800/30 text-red-400' : 'bg-red-50 border-red-100 text-red-800'}`}>
            <div className={`p-2.5 rounded-full shrink-0 ${temaNoturno ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Lembrete de Fechamento</p>
              <p className={`text-sm mt-0.5 font-medium leading-relaxed ${temaNoturno ? 'text-red-400/70' : 'text-red-700/80'}`}>Já passou das 22h50. Recomendamos realizar o fechamento do caixa ao final do expediente para evitar a mistura de turnos.</p>
            </div>
          </div>
        )}

        {comandasAntigasAbertas.length > 0 && !ignorarAvisoAntigas && !comandaAtiva && abaAtiva === 'comandas' && (
          <div className={`p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm transition-colors duration-300 ${temaNoturno ? 'bg-orange-900/10 border-orange-800/30 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-800'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-full shrink-0 ${temaNoturno ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest">Comandas Pendentes</p>
                <p className={`text-sm mt-0.5 font-medium leading-relaxed ${temaNoturno ? 'text-orange-400/70' : 'text-orange-700/80'}`}>Tem <b>{comandasAntigasAbertas.length} comanda(s)</b> de turnos passados abertas. Deseja encerrá-las ou mantê-las ativas?</p>
              </div>
            </div>
            <button onClick={() => setIgnorarAvisoAntigas(true)} className={`shrink-0 px-5 py-2.5 text-xs font-bold rounded-xl transition ${temaNoturno ? 'bg-orange-900/40 hover:bg-orange-900/60 text-orange-300' : 'bg-orange-200/50 hover:bg-orange-200 text-orange-800'}`}>Manter Abertas</button>
          </div>
        )}

        {!comandaAtiva && alertaTags && abaAtiva === 'comandas' && (
          <div className={`p-4 rounded-3xl flex items-center justify-between border shadow-sm transition-colors duration-300 ${temaNoturno ? 'bg-yellow-900/10 border-yellow-800/30 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-full shrink-0 ${temaNoturno ? 'bg-yellow-900/30 text-yellow-500' : 'bg-yellow-100 text-yellow-600'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest">Inteligência de Negócio</p>
                <p className={`text-sm mt-0.5 font-medium leading-relaxed ${temaNoturno ? 'text-yellow-500/70' : 'text-yellow-800/80'}`}>As suas últimas comandas estão sem tags. <b>Clique nas tags pré-configuradas</b> para classificar o perfil dos seus clientes.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Sidebar 
        menuMobileAberto={menuMobileAberto} setMenuMobileAberto={setMenuMobileAberto} temaNoturno={temaNoturno}
        logoEmpresa={logoEmpresa} sessao={sessao} nomeEmpresa={nomeEmpresa} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
        setMostrarConfigEmpresa={setMostrarConfigEmpresa} setMostrarAdminUsuarios={setMostrarAdminUsuarios}
        setMostrarAdminProdutos={setMostrarAdminProdutos} setMostrarConfigTags={setMostrarConfigTags} fazerLogout={fazerLogout}
      />

      <div className="flex-1">
        {comandaAtiva ? (
          <PainelComanda 
            temaNoturno={temaNoturno} comandaAtiva={comandaAtiva} abaDetalheMobile={abaDetalheMobile} 
            setAbaDetalheMobile={setAbaDetalheMobile} filtroCategoriaCardapio={filtroCategoriaCardapio} 
            setFiltroCategoriaCardapio={setFiltroCategoriaCardapio} menuCategorias={menuCategorias} 
            adicionarProdutoNaComanda={adicionarProdutoNaComanda} setMostrarModalPeso={setMostrarModalPeso} 
            tagsGlobais={tagsGlobais} toggleTag={toggleTag} editarProduto={editarProduto} 
            excluirProduto={excluirProduto} setMostrarModalPagamento={setMostrarModalPagamento} encerrarMesa={encerrarMesa} 
          />
        ) : abaAtiva === 'comandas' ? (
          <TabComandas 
            temaNoturno={temaNoturno} comandasAbertas={comandasAbertas} modoExclusao={modoExclusao} 
            setModoExclusao={setModoExclusao} selecionadasExclusao={selecionadasExclusao} 
            toggleSelecaoExclusao={toggleSelecaoExclusao} confirmarExclusaoEmMassa={confirmarExclusaoEmMassa} 
            adicionarComanda={adicionarComanda} setIdSelecionado={setIdSelecionado} 
            caixaAtual={caixaAtual} abrirCaixaManual={abrirCaixaManual} mostrarAlerta={mostrarAlerta}
          />
        ) : abaAtiva === 'fechadas' ? (
          <TabFechadas 
            temaNoturno={temaNoturno} comandasFechadasHoje={comandasFechadasHoje} 
            reabrirComandaFechada={reabrirComandaFechada} excluirComandaFechada={excluirComandaFechada} 
          />
        ) : abaAtiva === 'faturamento' ? (
          <TabFaturamento 
            temaNoturno={temaNoturno} filtroTempo={filtroTempo} setFiltroTempo={setFiltroTempo} 
            getHoje={getHoje} getMesAtual={getMesAtual} getAnoAtual={getAnoAtual} 
            faturamentoTotal={faturamentoTotal} lucroEstimado={lucroEstimado} 
            dadosPizza={dadosPizza} rankingProdutos={rankingProdutos} comandasFiltradas={comandasFiltradas} 
            comandas={comandas} 
          />
        ) : abaAtiva === 'analises' ? (
          <TabAnalises 
            temaNoturno={temaNoturno} filtroTempo={filtroTempo} setFiltroTempo={setFiltroTempo} 
            getHoje={getHoje} getMesAtual={getMesAtual} getAnoAtual={getAnoAtual} 
            dadosTipos={dadosTipos} dadosTags={dadosTags} 
          />
        ) : abaAtiva === 'caixa' ? (
          <TabFechamentoCaixa 
            temaNoturno={temaNoturno} sessao={sessao} caixaAtual={caixaAtual} comandas={comandas} fetchData={fetchData} 
            mostrarAlerta={mostrarAlerta} mostrarConfirmacao={mostrarConfirmacao}
          />
        ) : null}
      </div>

      {mostrarAdminUsuarios && sessao && <AdminUsuarios empresaId={sessao.empresa_id} usuarioAtualId={sessao.id} temaNoturno={temaNoturno} onFechar={() => setMostrarAdminUsuarios(false)} />}
      {mostrarAdminProdutos && sessao && <AdminProdutos empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => { setMostrarAdminProdutos(false); fetchData(); }} />}
      {mostrarAdminDelivery && sessao && <AdminDelivery empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => setMostrarAdminDelivery(false)} />}
      {mostrarModalPeso && <ModalPeso opcoesPeso={configPeso} temaNoturno={temaNoturno} onAdicionar={adicionarProdutoNaComanda} onCancelar={() => setMostrarModalPeso(false)} />}
      {mostrarModalPagamento && <ModalPagamento comanda={comandaAtiva} temaNoturno={temaNoturno} onConfirmar={processarPagamento} onCancelar={() => setMostrarModalPagamento(false)} />}
      {mostrarConfigEmpresa && <ModalConfigEmpresa temaNoturno={temaNoturno} nomeEmpresaEdicao={nomeEmpresaEdicao} setNomeEmpresaEdicao={setNomeEmpresaEdicao} logoEmpresaEdicao={logoEmpresaEdicao} setLogoEmpresaEdicao={setLogoEmpresaEdicao} salvarConfigEmpresa={salvarConfigEmpresa} setMostrarConfigEmpresa={setMostrarConfigEmpresa} />}
      {mostrarConfigTags && <ModalConfigTags temaNoturno={temaNoturno} tagsGlobais={tagsGlobais} setTagsGlobais={setTagsGlobais} sessao={sessao} setMostrarConfigTags={setMostrarConfigTags} />}

      {modalGlobal.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col border text-center ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${temaNoturno ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
               {modalGlobal.tipo === 'alerta' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               ) : modalGlobal.tipo === 'confirmacao' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
               )}
            </div>

            <h2 className={`text-xl font-black mb-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{modalGlobal.titulo}</h2>
            <p className={`text-sm mb-6 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>{modalGlobal.mensagem}</p>
            
            {modalGlobal.tipo === 'prompt' && (
              <input 
                type="text" 
                autoFocus
                className={`w-full p-3 rounded-xl border mb-6 outline-none font-bold text-center ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-300 focus:border-purple-500'}`} 
                value={modalGlobal.valorInput} 
                onChange={e => setModalGlobal({...modalGlobal, valorInput: e.target.value})} 
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (modalGlobal.acaoConfirmar) modalGlobal.acaoConfirmar(modalGlobal.valorInput);
                    fecharModalGlobal();
                  }
                }}
              />
            )}

            <div className="flex gap-3">
              {(modalGlobal.tipo === 'confirmacao' || modalGlobal.tipo === 'prompt') && (
                <button onClick={fecharModalGlobal} className={`flex-1 p-3 rounded-xl font-bold transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              )}
              
              <button 
                onClick={() => {
                  if (modalGlobal.acaoConfirmar) {
                    if (modalGlobal.tipo === 'prompt') modalGlobal.acaoConfirmar(modalGlobal.valorInput);
                    else modalGlobal.acaoConfirmar();
                  }
                  fecharModalGlobal();
                }} 
                className={`flex-1 p-3 rounded-xl font-bold text-white transition shadow-lg ${modalGlobal.titulo.toLowerCase().includes('excluir') || modalGlobal.titulo.toLowerCase().includes('atenção') ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {modalGlobal.tipo === 'alerta' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}