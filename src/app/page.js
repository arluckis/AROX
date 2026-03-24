'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

import Login from '@/components/Login';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import TabComandas from '@/components/TabComandas';
import TabFechadas from '@/components/TabFechadas';
import TabFaturamento from '@/components/TabFaturamento';
import TabAnalises from '@/components/TabAnalises';
import PainelComanda from '@/components/PainelComanda';
import TabFechamentoCaixa from '@/components/TabFechamentoCaixa';
import TabFidelidade from '@/components/TabFidelidade';

import ModalConfigEmpresa from '@/components/ModalConfigEmpresa';
import ModalConfigTags from '@/components/ModalConfigTags';
import ModalPeso from '@/components/ModalPeso';
import ModalPagamento from '@/components/ModalPagamento';
import AdminProdutos from '@/components/AdminProdutos';
import AdminUsuarios from '@/components/AdminUsuarios';
import AdminDelivery from '@/components/AdminDelivery'; 
import SuperAdminPainel from '@/components/SuperAdminPainel';

export default function Home() {

  useEffect(() => {
    const VERSAO_ATUAL = '1.1.5'; 
    const versaoNoNavegador = localStorage.getItem('bessa_versao_sistema');
    if (versaoNoNavegador !== VERSAO_ATUAL) {
      localStorage.setItem('bessa_versao_sistema', VERSAO_ATUAL);
      if (typeof window !== 'undefined') {
        window.location.href = window.location.pathname + '?v=' + new Date().getTime();
      }
    }
  }, []);
  
  const getHoje = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  };

  const getMesAtual = () => getHoje().substring(0, 7);
  const getAnoAtual = () => getHoje().substring(0, 4);

  const fraseCarregamento = useMemo(() => {
    const frases = ["Iniciando conexão segura", "Carregando módulos", "Sincronizando banco de dados", "Validando criptografia", "Quase pronto"];
    return frases[Math.floor(Math.random() * frases.length)];
  }, []);

  const [sessao, setSessao] = useState(null); 
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [nomeEmpresa, setNomeEmpresa] = useState('Bom a Bessa'); // Nome genérico padrão
  const [temaNoturno, setTemaNoturno] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [mostrarConfigEmpresa, setMostrarConfigEmpresa] = useState(false);
  const [nomeEmpresaEdicao, setNomeEmpresaEdicao] = useState('');
  const [logoEmpresa, setLogoEmpresa] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  const [logoEmpresaEdicao, setLogoEmpresaEdicao] = useState('');
  const [nomeUsuarioEdicao, setNomeUsuarioEdicao] = useState('');
  
  const [dadosPlano, setDadosPlano] = useState({ nome: 'Free', validade: null });

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
  
  const [clientesFidelidade, setClientesFidelidade] = useState([]);
  const [metaFidelidade, setMetaFidelidade] = useState({ pontos_necessarios: 10, premio: '1 Açaí', valor_minimo: 0 });

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
       if ((horas === 22 && minutos >= 50) || horas >= 23 || horas < 4) setAvisoFechamento(true);
       else setAvisoFechamento(false);
    };
    verificarHorario();
    const intervalo = setInterval(verificarHorario, 60000); 
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const temaSalvo = localStorage.getItem('bessa_tema_noturno');
    if (temaSalvo !== null) setTemaNoturno(JSON.parse(temaSalvo));
    const logoSalva = localStorage.getItem('bessa_logo_empresa');
    if (logoSalva) setLogoEmpresa(logoSalva);
    const sessionData = localStorage.getItem('bessa_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.empresa_id) setSessao(parsed);
        else localStorage.removeItem('bessa_session');
      } catch(e) { localStorage.removeItem('bessa_session'); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bessa_tema_noturno', JSON.stringify(temaNoturno));
    document.body.style.backgroundColor = temaNoturno ? '#0f172a' : '#f8fafc'; 
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', temaNoturno ? '#1e293b' : '#ffffff');
  }, [temaNoturno]);

  const fazerLogout = () => {
    localStorage.removeItem('bessa_session');
    localStorage.removeItem('bessa_logo_empresa');
    setSessao(null); 
    setCredenciais({ email: '', senha: '' }); 
    setMostrarMenuPerfil(false); 
    setMenuMobileAberto(false); 
    setAbaAtiva('comandas'); 
    setNomeEmpresa('Bom a Bessa'); // Reseta para o padrão
    setLogoEmpresa('https://cdn-icons-png.flaticon.com/512/3135/3135715.png'); // Reseta para a logo padrão
  };

  const fetchDadosEstaticos = async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data: empData } = await supabase.from('empresas').select('*').eq('id', sessao.empresa_id).single();
      if (empData) {
        setNomeEmpresa(empData.nome || "Bom a Bessa");
        setNomeEmpresaEdicao(empData.nome || "");
        setDadosPlano({ nome: empData.plano || 'Free', validade: empData.validade_plano || null });
        const urlLogo = empData.logo || empData.logo_url;
        if (urlLogo) { setLogoEmpresa(urlLogo); setLogoEmpresaEdicao(urlLogo); localStorage.setItem('bessa_logo_empresa', urlLogo); }
      }

      const { data: catData } = await supabase.from('categorias').select('*, itens:produtos(*)').eq('empresa_id', sessao.empresa_id);
      if (catData) setMenuCategorias(catData);

      const { data: pesoData } = await supabase.from('config_peso').select('*').eq('empresa_id', sessao.empresa_id);
      if (pesoData) setConfigPeso(pesoData.map(p => ({ id: p.id, nome: p.nome, preco: parseFloat(p.preco_kg), custo: parseFloat(p.custo_kg || 0) })));

      const { data: tagsData } = await supabase.from('tags').select('*').eq('empresa_id', sessao.empresa_id);
      if (tagsData) setTagsGlobais(tagsData); 

      const { data: fidelidadeData } = await supabase.from('clientes_fidelidade').select('*').eq('empresa_id', sessao.empresa_id);
      if (fidelidadeData) setClientesFidelidade(fidelidadeData);

      const { data: configFid } = await supabase.from('config_fidelidade').select('*').eq('empresa_id', sessao.empresa_id).single();
      if (configFid) setMetaFidelidade(configFid);

    } catch (err) {}
  };

  const fetchHistoricoCompleto = async () => {
    if (!sessao?.empresa_id) return;
    setIsLoading(true);
    try {
      const { data: caixasAbertos } = await supabase.from('caixas').select('*').eq('empresa_id', sessao.empresa_id).eq('status', 'aberto').order('id', { ascending: false }).limit(1); 
      let caixaData = caixasAbertos && caixasAbertos.length > 0 ? caixasAbertos[0] : null;
      if (caixaData) setCaixaAtual(caixaData); else setCaixaAtual({ status: 'fechado' });
      
      const { data: comData } = await supabase.from('comandas').select('*, produtos:comanda_produtos(*), pagamentos(*)').eq('empresa_id', sessao.empresa_id).order('id', { ascending: false }).limit(3000);
      if (comData) setComandas(comData.reverse());
    } catch (err) {} finally { setIsLoading(false); }
  };

  const fetchApenasAtualizacoes = async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data: caixasAbertos } = await supabase.from('caixas').select('*').eq('empresa_id', sessao.empresa_id).eq('status', 'aberto').order('id', { ascending: false }).limit(1); 
      if (caixasAbertos && caixasAbertos.length > 0) setCaixaAtual(caixasAbertos[0]); 
      else setCaixaAtual({ status: 'fechado' });

      const { data: comDataHoje } = await supabase.from('comandas')
        .select('*, produtos:comanda_produtos(*), pagamentos(*)')
        .eq('empresa_id', sessao.empresa_id)
        .or(`status.eq.aberta,data.eq.${getHoje()}`);

      if (comDataHoje) {
        setComandas(comandasAntigas => {
          const historicoIntacto = comandasAntigas.filter(c => c.status === 'fechada' && c.data !== getHoje());
          const novoEstado = [...historicoIntacto, ...comDataHoje.reverse()];
          return novoEstado.sort((a, b) => a.id - b.id);
        });
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (!sessao?.empresa_id) return;
    setNomeUsuarioEdicao(sessao.nome_usuario || '');
    fetchDadosEstaticos();
    fetchHistoricoCompleto(); 
    const intervaloPolling = setInterval(() => { fetchApenasAtualizacoes(); }, 30000); 
    return () => clearInterval(intervaloPolling);
  }, [sessao]);

  const abrirCaixaManual = async (dadosCaixa) => {
    if (!sessao?.empresa_id) return;
    setIsLoading(true);
    try {
      const payload = { empresa_id: sessao.empresa_id, data_abertura: dadosCaixa.data_abertura, saldo_inicial: dadosCaixa.saldo_inicial || 0, status: 'aberto' };
      const { data, error } = await supabase.from('caixas').insert([payload]).select().single();
      if (error) throw error;
      if (data) { setCaixaAtual(data); mostrarAlerta("Sucesso", "Caixa aberto com sucesso!"); fetchApenasAtualizacoes(); }
    } catch (err) { mostrarAlerta("Erro", "Erro ao abrir caixa: " + err.message); } finally { setIsLoading(false); }
  };

  const salvarConfigEmpresa = async () => {
    if (nomeEmpresaEdicao.trim() === '') return mostrarAlerta("Aviso", "O nome do estabelecimento não pode estar vazio.");
    const { error: errorEmpresa } = await supabase.from('empresas').update({ nome: nomeEmpresaEdicao, logo_url: logoEmpresaEdicao }).eq('id', sessao.empresa_id);
    const { error: errorUsuario } = await supabase.from('usuarios').update({ nome_usuario: nomeUsuarioEdicao }).eq('id', sessao.id);
    if (errorEmpresa || errorUsuario) {
      return mostrarAlerta("Erro", "Erro ao salvar no banco de dados: " + (errorEmpresa?.message || errorUsuario?.message));
    }
    setNomeEmpresa(nomeEmpresaEdicao); 
    setLogoEmpresa(logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'); 
    const novaSessao = { ...sessao, nome_usuario: nomeUsuarioEdicao };
    setSessao(novaSessao);
    localStorage.setItem('bessa_session', JSON.stringify(novaSessao));
    setMostrarConfigEmpresa(false);
    mostrarAlerta("Sucesso", "Configurações atualizadas com sucesso!");
  };

  const alterarSenhaConta = async (senhaAtualInformada, novaSenhaDesejada) => {
    try {
      const { data: usuarioAuth, error: errorAuth } = await supabase.auth.updateUser({ password: novaSenhaDesejada });
      if (errorAuth) throw errorAuth;
      mostrarAlerta("Segurança", "Sua senha foi atualizada com sucesso no banco de dados.");
    } catch (err) {
      mostrarAlerta("Erro de Segurança", "Não foi possível atualizar a senha. " + err.message);
    }
  };

  const adicionarComanda = async (tipo) => {
    if (modoExclusao || !sessao?.empresa_id) return;
    const qtdHoje = comandas.filter(c => c.data === getHoje()).length;
    const novaComanda = { nome: `Comanda ${qtdHoje + 1}`, tipo, data: getHoje(), hora_abertura: new Date().toISOString(), status: 'aberta', tags: [], empresa_id: sessao.empresa_id };
    const { data, error } = await supabase.from('comandas').insert([novaComanda]).select().single();
    if (data && !error) {
       setComandas([...comandas, { ...data, produtos: [], pagamentos: [] }]);
       setIdSelecionado(data.id); 
    }
  };

  const alterarNomeComanda = (id, nomeAtual) => {
    mostrarPrompt("Alterar Nome [F4]", "Digite o novo nome ou identificador da comanda:", nomeAtual, async (novoNome) => {
      if(novoNome) {
        await supabase.from('comandas').update({nome: novoNome}).eq('id', id);
        setComandas(comandas.map(c => c.id === id ? {...c, nome: novoNome} : c));
      }
    });
  };

  const adicionarClienteComanda = (id, nomeAtual) => {
    mostrarPrompt("Atribuir Cliente [F5]", "Digite o nome do cliente:", "", async (cliente) => {
      if(cliente) {
        const novoNome = `${nomeAtual} - ${cliente}`;
        await supabase.from('comandas').update({nome: novoNome}).eq('id', id);
        setComandas(comandas.map(c => c.id === id ? {...c, nome: novoNome} : c));
      }
    });
  };

  const alternarTipoComanda = async (id, tipoAtual) => {
    const novoTipo = tipoAtual === 'Balcão' ? 'Delivery' : 'Balcão';
    await supabase.from('comandas').update({tipo: novoTipo}).eq('id', id);
    setComandas(comandas.map(c => c.id === id ? {...c, tipo: novoTipo} : c));
  };

  const adicionarProdutoNaComanda = async (produto, quantidade = 1) => {
    if (!sessao?.empresa_id || !idSelecionado) return;
    const qtdValida = parseInt(quantidade);
    if (isNaN(qtdValida) || qtdValida === 0) return;

    if (qtdValida < 0) {
      const comanda = comandas.find(c => c.id === idSelecionado);
      if (!comanda) return;
      
      const produtosParaExcluir = (comanda.produtos || [])
        .filter(p => p.nome === produto.nome && Number(p.preco) === Number(produto.preco) && !p.pago && p.id)
        .slice(0, Math.abs(qtdValida)); 

      if (produtosParaExcluir.length > 0) {
        const ids = produtosParaExcluir.map(p => p.id);
        const { error } = await supabase.from('comanda_produtos').delete().in('id', ids);
        if (!error) {
           setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).filter(p => !ids.includes(p.id)) } : c));
        }
      }
      return;
    }
    
    const payloadArray = Array.from({ length: qtdValida }).map(() => ({ 
      comanda_id: idSelecionado, 
      nome: produto.nome, 
      preco: produto.preco, 
      custo: produto.custo || 0, 
      pago: false, 
      observacao: '', 
      empresa_id: sessao.empresa_id 
    }));
    
    const { data, error } = await supabase.from('comanda_produtos').insert(payloadArray).select();
    
    if (data && !error) {
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: [...(c.produtos || []), ...data] } : c));
      setMostrarModalPeso(false); 
      setAbaDetalheMobile('resumo');
    } else if (error) {
       console.error("Erro ao inserir: ", error);
       mostrarAlerta("Erro", "Ocorreu um problema ao adicionar os produtos.");
    }
  };

  const toggleTag = async (tagNome) => {
    const tagsAtuais = comandaAtiva?.tags || [];
    const novasTags = tagsAtuais.includes(tagNome) ? tagsAtuais.filter(t => t !== tagNome) : [...tagsAtuais, tagNome];
    await supabase.from('comandas').update({ tags: novasTags }).eq('id', idSelecionado);
    setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, tags: novasTags } : c));
  };

  const vincularClienteFidelidade = async (idComanda, cliente) => {
    const novoNome = `${cliente.nome}`;
    const comandaAtual = comandas.find(c => c.id === idComanda);
    const tagsAtuais = comandaAtual?.tags || [];
    const novasTags = tagsAtuais.includes("Fidelidade") ? tagsAtuais : [...tagsAtuais, "Fidelidade"];
    const { error } = await supabase.from('comandas').update({ nome: novoNome, tags: novasTags }).eq('id', idComanda);
    if (!error) setComandas(comandas.map(c => c.id === idComanda ? { ...c, nome: novoNome, tags: novasTags } : c));
  };

  const excluirGrupoProdutos = async (nome, preco) => {
    if (!idSelecionado) return;
    const comanda = comandas.find(c => c.id === idSelecionado);
    if (!comanda) return;

    const produtosDoGrupo = (comanda.produtos || []).filter(p => p.nome === nome && Number(p.preco) === Number(preco) && !p.pago && p.id);
    const ids = produtosDoGrupo.map(p => p.id);
    
    if (ids.length > 0) {
      await supabase.from('comanda_produtos').delete().in('id', ids);
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).filter(p => !ids.includes(p.id)) } : c));
    }
  };

  const excluirProduto = async (idProduto) => {
    if (!idProduto) return;
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

  const processarPagamento = async (valorFinal, formaPagamento, itensSelecionados, modoDivisao, bairroId = null, taxaEntrega = 0, isFidelidade = false) => {
    if (!sessao?.empresa_id) return;
    let novosProdutos = [...(comandaAtiva?.produtos || [])];
    let idsParaPagar = [];
    
    if (modoDivisao) { 
      novosProdutos = novosProdutos.map(p => {
         if (itensSelecionados.includes(p.id)) { idsParaPagar.push(p.id); return { ...p, pago: true }; }
         return p;
      });
    } else { 
      novosProdutos = novosProdutos.map(p => ({ ...p, pago: true })); 
      idsParaPagar = novosProdutos.map(p => p.id); 
    }
    
    const todosPagos = novosProdutos.length > 0 && novosProdutos.every(p => p.pago);
    const valorRegistrado = isFidelidade ? 0 : valorFinal;
    const payloadPagamento = { comanda_id: idSelecionado, valor: valorRegistrado, forma: formaPagamento, data: getHoje(), empresa_id: sessao.empresa_id };
    
    const { data: pgData, error: errPg } = await supabase.from('pagamentos').insert([payloadPagamento]).select().single();
    if (!errPg) {
      if (idsParaPagar.length > 0) await supabase.from('comanda_produtos').update({ pago: true }).in('id', idsParaPagar);
      const horaFechamento = new Date().toISOString();
      const clienteFidelizado = clientesFidelidade.find(c => c.nome.toLowerCase() === comandaAtiva.nome.toLowerCase());

      if (todosPagos) {
        await supabase.from('comandas').update({ status: 'fechada', hora_fechamento: horaFechamento }).eq('id', idSelecionado);
        if (clienteFidelizado) {
          if (isFidelidade) {
            const novosPts = clienteFidelizado.pontos - metaFidelidade.pontos_necessarios;
            await supabase.from('clientes_fidelidade').update({ pontos: novosPts }).eq('id', clienteFidelizado.id);
            setClientesFidelidade(prev => prev.map(c => c.id === clienteFidelizado.id ? { ...c, pontos: novosPts } : c));
            mostrarAlerta("Prêmio Resgatado", `O prêmio foi resgatado com sucesso e os pontos foram debitados do saldo de ${clienteFidelizado.nome}.`);
          } else {
            const totalComanda = novosProdutos.reduce((acc, p) => acc + p.preco, 0) + taxaEntrega;
            if (totalComanda >= metaFidelidade.valor_minimo) {
              const novosPts = clienteFidelizado.pontos + 1;
              const novosTotais = (clienteFidelizado.pontos_totais || clienteFidelizado.pontos) + 1;
              await supabase.from('clientes_fidelidade').update({ pontos: novosPts, pontos_totais: novosTotais }).eq('id', clienteFidelizado.id);
              setClientesFidelidade(prev => prev.map(c => c.id === clienteFidelizado.id ? { ...c, pontos: novosPts, pontos_totais: novosTotais } : c));
            }
          }
        }
      }
      
      setComandas(comandas.map(c => {
        if (c.id === idSelecionado) {
           return { ...c, produtos: novosProdutos, pagamentos: [...(c.pagamentos || []), pgData], status: todosPagos ? 'fechada' : 'aberta', hora_fechamento: todosPagos ? horaFechamento : c.hora_fechamento, bairro_id: bairroId || c.bairro_id, taxa_entrega: taxaEntrega > 0 ? taxaEntrega : c.taxa_entrega };
        }
        return c;
      }));
      setMostrarModalPagamento(false);
    }
  };

  const confirmarExclusaoEmMassa = async () => {
    if (comandas.filter(c => selecionadasExclusao.includes(c.id)).some(c => (c.pagamentos || []).length > 0)) return mostrarAlerta("Atenção", "Desmarque as comandas que já possuem pagamentos.");
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
    if (!dataComanda || !filtroTempo?.valor) return false;
    try {
      if (filtroTempo.tipo === 'dia') return dataComanda === filtroTempo.valor;
      if (filtroTempo.tipo === '7 dias') {
        const dataFim = getHoje();
        const dtIn = new Date(dataFim + 'T12:00:00');
        if (isNaN(dtIn.getTime())) return false;
        dtIn.setDate(dtIn.getDate() - 6);
        const dtInStr = dtIn.toISOString().split('T')[0];
        return dataComanda >= dtInStr && dataComanda <= dataFim;
      }
      if (filtroTempo.tipo === 'mes') return dataComanda.startsWith(filtroTempo.valor);
      if (filtroTempo.tipo === 'ano') return dataComanda.startsWith(filtroTempo.valor);
      if (filtroTempo.tipo === 'periodo') return dataComanda >= (filtroTempo.inicio || '') && dataComanda <= (filtroTempo.fim || '');
    } catch(e) {}
    return false;
  };

  const comandaAtiva = comandas.find(c => c.id === idSelecionado);
  const comandasFiltradas = comandas.filter(c => isComandaInFiltro(c.data));
  const comandasAbertas = comandas.filter(c => c.status === 'aberta');
  
  const faturamentoTotal = comandasFiltradas.reduce((acc, c) => acc + (c.produtos || []).reduce((sum, p) => sum + (p.preco || 0), 0), 0);
  const custoTotalFiltrado = comandasFiltradas.reduce((acc, c) => acc + (c.produtos || []).reduce((sum, p) => sum + (p.custo || 0), 0), 0);
  const lucroEstimado = faturamentoTotal - custoTotalFiltrado;

  const pagamentosFiltrados = comandasFiltradas.flatMap(c => c.pagamentos || []);
  const pagamentosAgrupados = pagamentosFiltrados.reduce((acc, p) => { acc[p.forma] = (acc[p.forma] || 0) + p.valor; return acc; }, {});
  const dadosPizza = Object.keys(pagamentosAgrupados).map(key => ({ name: key, value: pagamentosAgrupados[key] })).filter(d => d.value > 0);

  const contagemProdutos = {};
  comandasFiltradas.forEach(c => {
    (c.produtos || []).forEach(p => {
      const nomeOriginal = String(p?.nome || '');
      const isPeso = nomeOriginal.toLowerCase().includes('peso') || nomeOriginal.toLowerCase().includes('balança');
      let nomeDisplay = isPeso ? nomeOriginal.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim() : nomeOriginal;
      const nomeChave = nomeDisplay.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

      if (!contagemProdutos[nomeChave]) { 
        contagemProdutos[nomeChave] = { nomeDisplay: nomeDisplay.toUpperCase(), faturamento: 0, volume: 0, isPeso: isPeso }; 
      }
      
      contagemProdutos[nomeChave].faturamento += (p.preco || 0);
      if (isPeso) {
        const matchGramas = nomeOriginal.match(/(\d+(?:\.\d+)?)\s*g/i);
        contagemProdutos[nomeChave].volume += matchGramas ? parseFloat(matchGramas[1]) : 0;
      } else { 
        contagemProdutos[nomeChave].volume += 1; 
      }
    });
  });
  
  const rankingProdutos = Object.values(contagemProdutos).map(item => ({ nome: item.nomeDisplay, valor: item.faturamento, volume: item.volume, isPeso: item.isPeso })).sort((a, b) => b.valor - a.valor);
  
  if (!sessao) return <Login getHoje={getHoje} setSessao={setSessao} temaNoturno={temaNoturno} setTemaNoturno={setTemaNoturno} />; 
  if (sessao.role === 'super_admin') return <SuperAdminPainel fazerLogout={fazerLogout} temaNoturno={temaNoturno} setTemaNoturno={setTemaNoturno} />;

  // --- TELA DE CARREGAMENTO PREMIUM - SOFISTICADA E SÉRIA ---
  if (isLoading && comandas.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${temaNoturno ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
        <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700 p-8">
          
          <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="absolute inset-0 w-full h-full animate-spin text-purple-600/20" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" strokeWidth="4" stroke="currentColor" strokeDasharray="301.59" strokeDashoffset="0"></circle>
            </svg>
            <svg className="absolute inset-0 w-full h-full animate-spin text-purple-600" style={{ animationDuration: '1.5s' }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" strokeWidth="4" stroke="currentColor" strokeDasharray="301.59" strokeDashoffset="226.19" strokeLinecap="round"></circle>
            </svg>
            <div className={`w-16 h-16 rounded-full overflow-hidden shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <img src={logoEmpresa} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h2 className={`text-xl font-bold tracking-tight ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>
              Preparando ambiente
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-purple-600"></span>
              <span className={`text-xs font-medium uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>
                {fraseCarregamento}...
              </span>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen flex flex-col transition-colors duration-500 ${temaNoturno ? 'bg-[#0f172a] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      <div className="w-full p-3 md:p-6 pb-0 md:pb-0 flex flex-col max-w-7xl mx-auto">
        <Header 
          comandaAtiva={comandaAtiva} setIdSelecionado={setIdSelecionado} setMenuMobileAberto={setMenuMobileAberto}
          temaNoturno={temaNoturno} caixaAtual={caixaAtual} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
          logoEmpresa={logoEmpresa} setTemaNoturno={setTemaNoturno} mostrarMenuPerfil={mostrarMenuPerfil}
          setMostrarMenuPerfil={setMostrarMenuPerfil} nomeEmpresa={nomeEmpresa} sessao={sessao}
          setMostrarAdminDelivery={setMostrarAdminDelivery}
          setMostrarConfigEmpresa={setMostrarConfigEmpresa} setMostrarAdminUsuarios={setMostrarAdminUsuarios}
          setMostrarAdminProdutos={setMostrarAdminProdutos} setMostrarConfigTags={setMostrarConfigTags} fazerLogout={fazerLogout}
          fetchData={fetchApenasAtualizacoes} clientesFidelidade={clientesFidelidade} vincularClienteFidelidade={vincularClienteFidelidade}
        />

        <div className="flex-1 w-full">
          {comandaAtiva ? (
            <PainelComanda 
              temaNoturno={temaNoturno} comandaAtiva={comandaAtiva} abaDetalheMobile={abaDetalheMobile} setAbaDetalheMobile={setAbaDetalheMobile} filtroCategoriaCardapio={filtroCategoriaCardapio} setFiltroCategoriaCardapio={setFiltroCategoriaCardapio} menuCategorias={menuCategorias} adicionarProdutoNaComanda={adicionarProdutoNaComanda} excluirGrupoProdutos={excluirGrupoProdutos} setMostrarModalPeso={setMostrarModalPeso} tagsGlobais={tagsGlobais} toggleTag={toggleTag} editarProduto={editarProduto} excluirProduto={excluirProduto} setMostrarModalPagamento={setMostrarModalPagamento} encerrarMesa={encerrarMesa} 
              setIdSelecionado={setIdSelecionado} 
              alterarNomeComanda={alterarNomeComanda} 
              adicionarClienteComanda={adicionarClienteComanda} 
              alternarTipoComanda={alternarTipoComanda}
              modalAberto={mostrarModalPeso || mostrarModalPagamento}
            />
          ) : abaAtiva === 'comandas' ? (
            <TabComandas 
              temaNoturno={temaNoturno} comandasAbertas={comandasAbertas} modoExclusao={modoExclusao} setModoExclusao={setModoExclusao} selecionadasExclusao={selecionadasExclusao} toggleSelecaoExclusao={toggleSelecaoExclusao} confirmarExclusaoEmMassa={confirmarExclusaoEmMassa} adicionarComanda={adicionarComanda} setIdSelecionado={setIdSelecionado} caixaAtual={caixaAtual} abrirCaixaManual={abrirCaixaManual}
            />
          ) : abaAtiva === 'fechadas' ? (
            <TabFechadas 
              temaNoturno={temaNoturno} comandasFechadas={comandas.filter(c => c.status === 'fechada')} reabrirComandaFechada={reabrirComandaFechada} excluirComandaFechada={excluirComandaFechada} getHoje={getHoje} 
            />
          ) : abaAtiva === 'faturamento' ? (
            <TabFaturamento 
              temaNoturno={temaNoturno} filtroTempo={filtroTempo} setFiltroTempo={setFiltroTempo} getHoje={getHoje} getMesAtual={getMesAtual} getAnoAtual={getAnoAtual} faturamentoTotal={faturamentoTotal} lucroEstimado={lucroEstimado} dadosPizza={dadosPizza} rankingProdutos={rankingProdutos} comandasFiltradas={comandasFiltradas} comandas={comandas} 
            />
          ) : abaAtiva === 'caixa' ? (
            <TabFechamentoCaixa temaNoturno={temaNoturno} sessao={sessao} caixaAtual={caixaAtual} comandas={comandas} fetchData={fetchApenasAtualizacoes} mostrarAlerta={mostrarAlerta} mostrarConfirmacao={mostrarConfirmacao} />
          ) : abaAtiva === 'fidelidade' ? (
            <TabFidelidade 
              temaNoturno={temaNoturno} sessao={sessao} mostrarAlerta={mostrarAlerta} mostrarConfirmacao={mostrarConfirmacao}
              metaFidelidade={metaFidelidade} setMetaFidelidade={setMetaFidelidade}
              clientesFidelidade={clientesFidelidade} setClientesFidelidade={setClientesFidelidade} comandas={comandas}
            />
          ) : null}
        </div>
      </div>

      <Sidebar 
        menuMobileAberto={menuMobileAberto} setMenuMobileAberto={setMenuMobileAberto} temaNoturno={temaNoturno}
        logoEmpresa={logoEmpresa} sessao={sessao} nomeEmpresa={nomeEmpresa} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
        setMostrarConfigEmpresa={setMostrarConfigEmpresa} setMostrarAdminUsuarios={setMostrarAdminUsuarios}
        setMostrarAdminProdutos={setMostrarAdminProdutos} setMostrarConfigTags={setMostrarConfigTags} fazerLogout={fazerLogout}
      />

      {mostrarAdminUsuarios && sessao && <AdminUsuarios empresaId={sessao.empresa_id} usuarioAtualId={sessao.id} temaNoturno={temaNoturno} onFechar={() => setMostrarAdminUsuarios(false)} />}
      {mostrarAdminProdutos && sessao && <AdminProdutos empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => { setMostrarAdminProdutos(false); fetchApenasAtualizacoes(); }} />}
      {mostrarAdminDelivery && sessao && <AdminDelivery empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => setMostrarAdminDelivery(false)} />}
      {mostrarModalPeso && <ModalPeso opcoesPeso={configPeso} temaNoturno={temaNoturno} onAdicionar={adicionarProdutoNaComanda} onCancelar={() => setMostrarModalPeso(false)} />}
      
      {mostrarModalPagamento && (
        <ModalPagamento 
           comanda={comandaAtiva} temaNoturno={temaNoturno} onConfirmar={processarPagamento} onCancelar={() => setMostrarModalPagamento(false)} 
           clientesFidelidade={clientesFidelidade} metaFidelidade={metaFidelidade}
        />
      )}

      {mostrarConfigEmpresa && (
        <ModalConfigEmpresa 
          temaNoturno={temaNoturno} nomeEmpresaEdicao={nomeEmpresaEdicao} setNomeEmpresaEdicao={setNomeEmpresaEdicao} 
          logoEmpresaEdicao={logoEmpresaEdicao} setLogoEmpresaEdicao={setLogoEmpresaEdicao} nomeUsuarioEdicao={nomeUsuarioEdicao} 
          setNomeUsuarioEdicao={setNomeUsuarioEdicao} planoUsuario={dadosPlano} salvarConfigEmpresa={salvarConfigEmpresa} 
          setMostrarConfigEmpresa={setMostrarConfigEmpresa} alterarSenhaConta={alterarSenhaConta} 
        />
      )}
      
      {mostrarConfigTags && <ModalConfigTags temaNoturno={temaNoturno} tagsGlobais={tagsGlobais} setTagsGlobais={setTagsGlobais} sessao={sessao} setMostrarConfigTags={setMostrarConfigTags} />}

      {modalGlobal.visivel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className={`rounded-3xl p-6 w-full max-sm shadow-2xl flex flex-col border text-center ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-black mb-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{modalGlobal.titulo}</h2>
            <p className={`text-sm mb-6 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>{modalGlobal.mensagem}</p>
            {modalGlobal.tipo === 'prompt' && (
              <input type="text" autoFocus className={`w-full p-3 rounded-xl border mb-6 outline-none font-bold text-center ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-300 focus:border-purple-500'}`} value={modalGlobal.valorInput} onChange={e => setModalGlobal({...modalGlobal, valorInput: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { if (modalGlobal.acaoConfirmar) modalGlobal.acaoConfirmar(modalGlobal.valorInput); fecharModalGlobal(); } }} />
            )}
            <div className="flex gap-3">
              {(modalGlobal.tipo === 'confirmacao' || modalGlobal.tipo === 'prompt') && (
                <button onClick={fecharModalGlobal} className={`flex-1 p-3 rounded-xl font-bold transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              )}
              <button onClick={() => { if (modalGlobal.acaoConfirmar) { if (modalGlobal.tipo === 'prompt') modalGlobal.acaoConfirmar(modalGlobal.valorInput); else modalGlobal.acaoConfirmar(); } fecharModalGlobal(); }} className={`flex-1 p-3 rounded-xl font-bold text-white transition shadow-lg ${modalGlobal.titulo.toLowerCase().includes('excluir') || modalGlobal.titulo.toLowerCase().includes('atenção') ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                {modalGlobal.tipo === 'alerta' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}