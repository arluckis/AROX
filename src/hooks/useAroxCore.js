import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export function useAroxCore({ sessao, setSessao, router, fazerLogout, setIsDataLoaded, setTemPendencia, setIsAntecipado }) {
  const [statusPresenca, setStatusPresenca] = useState('online');
  const [nomeEmpresa, setNomeEmpresa] = useState('AROX'); 
  const [logoEmpresa, setLogoEmpresa] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  const [nomeEmpresaEdicao, setNomeEmpresaEdicao] = useState('');
  const [logoEmpresaEdicao, setLogoEmpresaEdicao] = useState('');
  const [nomeUsuarioEdicao, setNomeUsuarioEdicao] = useState('');
  const [dadosPlano, setDadosPlano] = useState({ nome: 'Free', validade: null, criado_em: null });
  const [caixaAtual, setCaixaAtual] = useState(null); 
  const [comandas, setComandas] = useState([]);
  const [menuCategorias, setMenuCategorias] = useState([]);
  const [tagsGlobais, setTagsGlobais] = useState([]);
  const [configPeso, setConfigPeso] = useState([]); 
  const [clientesFidelidade, setClientesFidelidade] = useState([]);
  const [metaFidelidade, setMetaFidelidade] = useState({ pontos_necessarios: 10, premio: '1 Açaí', valor_minimo: 0 });

  const [mostrarMenuPerfil, setMostrarMenuPerfil] = useState(false);
  const [mostrarAdminProdutos, setMostrarAdminProdutos] = useState(false);
  const [mostrarAdminUsuarios, setMostrarAdminUsuarios] = useState(false);
  const [mostrarConfigTags, setMostrarConfigTags] = useState(false);
  const [mostrarAdminDelivery, setMostrarAdminDelivery] = useState(false);
  const [mostrarModalPeso, setMostrarModalPeso] = useState(false);
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  const [mostrarConfigEmpresa, setMostrarConfigEmpresa] = useState(false);
  
  const [idSelecionado, setIdSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('comandas');
  const [avisoFechamento, setAvisoFechamento] = useState(false);
  const [abaDetalheMobile, setAbaDetalheMobile] = useState('menu');
  const [filtroCategoriaCardapio, setFiltroCategoriaCardapio] = useState('Todas');
  const [modoExclusao, setModoExclusao] = useState(false);
  const [selecionadasExclusao, setSelecionadasExclusao] = useState([]);

  const getHoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const getMesAtual = () => getHoje().substring(0, 7);
  const getAnoAtual = () => getHoje().substring(0, 4);

  const [filtroTempo, setFiltroTempo] = useState({ tipo: 'dia', valor: getHoje(), inicio: '', fim: '' });
  const [modalGlobal, setModalGlobal] = useState({ visivel: false, tipo: 'alerta', titulo: '', mensagem: '', valorInput: '', acaoConfirmar: null });

  const normalizarComandas = (listaComandas, listaCaixas) => {
    return listaComandas.map(c => {
      let cicloData = c.data;
      if (c.caixa_id) {
        const cx = listaCaixas.find(x => x.id === c.caixa_id);
        if (cx) cicloData = cx.data_abertura;
      } else {
        const timeComanda = new Date(c.hora_abertura || c.created_at).getTime();
        const cx = listaCaixas.find(x => {
          const timeAbertura = new Date(x.criado_em).getTime();
          const timeFechamento = x.data_fechamento ? new Date(x.data_fechamento).getTime() : Infinity;
          return timeAbertura <= timeComanda && timeComanda <= timeFechamento;
        });
        if (cx) cicloData = cx.data_abertura;
      }
      return { ...c, data: cicloData };
    });
  };

  const mostrarAlerta = (titulo, mensagem) => setModalGlobal({ visivel: true, tipo: 'alerta', titulo, mensagem, valorInput: '', acaoConfirmar: null });
  const mostrarConfirmacao = (titulo, mensagem, acaoConfirmar) => setModalGlobal({ visivel: true, tipo: 'confirmacao', titulo, mensagem, valorInput: '', acaoConfirmar });
  const mostrarPrompt = (titulo, mensagem, valorInicial, acaoConfirmar) => setModalGlobal({ visivel: true, tipo: 'prompt', titulo, mensagem, valorInput: valorInicial || '', acaoConfirmar });
  const fecharModalGlobal = () => setModalGlobal({ visivel: false, tipo: 'alerta', titulo: '', mensagem: '', valorInput: '', acaoConfirmar: null });

  const fetchDadosEstaticos = async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data: empData } = await supabase.from('empresas').select('*').eq('id', sessao.empresa_id).single();
      if (empData) {
        setNomeEmpresa(empData.nome || "AROX"); setNomeEmpresaEdicao(empData.nome || "");
        setDadosPlano({ nome: empData.plano || 'Starter', validade: empData.validade_plano || null, criado_em: empData.created_at });
        const urlLogo = empData.logo || empData.logo_url;
        if (urlLogo) { setLogoEmpresa(urlLogo); setLogoEmpresaEdicao(urlLogo); localStorage.setItem('arox_logo_empresa', urlLogo); }
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
    try {
      const { data: todosCaixas } = await supabase.from('caixas').select('id, data_abertura, data_fechamento, criado_em, status').eq('empresa_id', sessao.empresa_id).order('criado_em', { ascending: false }); 
      let caixasAbertos = (todosCaixas || []).filter(c => c.status === 'aberto');
      let caixaData = caixasAbertos.length > 0 ? caixasAbertos[0] : null;
      const { data: comData } = await supabase.from('comandas').select('*, produtos:comanda_produtos(*), pagamentos(*)').eq('empresa_id', sessao.empresa_id).order('id', { ascending: false }).limit(3000);
      
      let comandasMapeadas = [];
      if (comData) { comandasMapeadas = normalizarComandas(comData, todosCaixas || []).reverse(); setComandas(comandasMapeadas); }
      
      const hoje = getHoje(); let hasPendencia = false;
      
      // Correção: Pendência só ocorre se houver comandas abertas de ciclos passados (que não pertencem ao caixa aberto atual)
      if (comandasMapeadas && comandasMapeadas.filter(c => c.status === 'aberta' && c.data && c.data < hoje && (!caixaData || c.caixa_id !== caixaData.id)).length > 0) {
        hasPendencia = true;
      }

      setTemPendencia(hasPendencia);
      if (caixaData && !hasPendencia) setCaixaAtual(caixaData);
      else if (!caixaData) { setCaixaAtual(null); setIsAntecipado(new Date().getHours() < 10); } 
      else setCaixaAtual(caixaData);
      setIsDataLoaded(true);
    } catch (err) {}
  };

  const fetchApenasAtualizacoes = async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data: statusConta } = await supabase.from('empresas').select('ativo, validade_plano').eq('id', sessao.empresa_id).single();
      if (statusConta) {
        const planoExpirado = statusConta.validade_plano ? new Date(statusConta.validade_plano) < new Date() : false;
        if (statusConta.ativo === false || planoExpirado) {
          mostrarAlerta("Conta suspensa", statusConta.ativo === false ? "Sua conta foi suspensa." : "Seu plano expirou.");
          setTimeout(() => fazerLogout(true), 4000); return; 
        }
      }
      const { data: todosCaixas } = await supabase.from('caixas').select('id, data_abertura, data_fechamento, criado_em, status').eq('empresa_id', sessao.empresa_id).order('criado_em', { ascending: false }); 
      let caixaAtivo = (todosCaixas || []).filter(c => c.status === 'aberto')[0] || null;
      setCaixaAtual(caixaAtivo); 

      let queryComandas = supabase.from('comandas').select('*, produtos:comanda_produtos(*), pagamentos(*)').eq('empresa_id', sessao.empresa_id);
      if (caixaAtivo) queryComandas = queryComandas.or(`caixa_id.eq.${caixaAtivo.id},status.eq.aberta,data.eq.${getHoje()}`);
      else queryComandas = queryComandas.or(`status.eq.aberta,data.eq.${getHoje()}`);

      const { data: comDataHoje } = await queryComandas;
      if (comDataHoje) {
        const comandasNorm = normalizarComandas(comDataHoje, todosCaixas || []);
        setComandas(comandasAntigas => {
          const idsAtualizados = comandasNorm.map(c => c.id);
          const historicoIntacto = comandasAntigas.filter(c => !idsAtualizados.includes(c.id));
          return [...historicoIntacto, ...comandasNorm.reverse()].sort((a, b) => a.id - b.id);
        });
      }
    } catch (err) {}
  };

  useEffect(() => {
    const verificarHorario = () => {
       const agora = new Date(); const horas = agora.getHours(); const minutos = agora.getMinutes();
       setAvisoFechamento((horas === 22 && minutos >= 50) || horas >= 23 || horas < 4);
    };
    verificarHorario();
    const intervalo = setInterval(verificarHorario, 60000); 
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!sessao || sessao.role === 'super_admin') return;
    let timeoutInatividade;
    const atualizarBanco = async (novoStatus) => {
      setStatusPresenca(novoStatus);
      const sessionId = localStorage.getItem('arox_session_id');
      if (sessionId) await supabase.from('sessoes_acesso').update({ ultimo_heartbeat: new Date().toISOString() }).eq('id', sessionId);
      await supabase.from('usuarios').update({ ultimo_ping_at: new Date().toISOString(), status_presenca: novoStatus }).eq('id', sessao.id);
    };
    atualizarBanco('online'); 
    const heartbeatInterval = setInterval(() => atualizarBanco(document.hidden ? 'ausente' : 'online'), 60000); 
    const handleVisibilidade = () => atualizarBanco(document.hidden ? 'ausente' : 'online');
    const resetarTemporizador = () => {
      if (document.hidden) return; 
      setStatusPresenca(prev => { if (prev === 'ausente') atualizarBanco('online'); return 'online'; });
      clearTimeout(timeoutInatividade);
      timeoutInatividade = setTimeout(() => atualizarBanco('ausente'), 3 * 60 * 1000); 
    };
    document.addEventListener('visibilitychange', handleVisibilidade);
    window.addEventListener('mousemove', resetarTemporizador); window.addEventListener('keydown', resetarTemporizador); window.addEventListener('click', resetarTemporizador);
    resetarTemporizador();
    return () => { clearInterval(heartbeatInterval); clearTimeout(timeoutInatividade); document.removeEventListener('visibilitychange', handleVisibilidade); window.removeEventListener('mousemove', resetarTemporizador); window.removeEventListener('keydown', resetarTemporizador); window.removeEventListener('click', resetarTemporizador); };
  }, [sessao]);

  useEffect(() => {
    if (!sessao?.empresa_id) return;
    setNomeUsuarioEdicao(sessao.nome_usuario || '');
    const initializeSession = async () => { await fetchDadosEstaticos(); await fetchHistoricoCompleto(); };
    initializeSession();
    const intervaloPolling = setInterval(() => fetchApenasAtualizacoes(), 30000); 
    return () => clearInterval(intervaloPolling);
  }, [sessao]);

  const abrirCaixaManual = async (dadosCaixa) => {
    if (!sessao?.empresa_id) return;
    try {
      const { data, error } = await supabase.from('caixas').insert([{ empresa_id: sessao.empresa_id, data_abertura: dadosCaixa.data_abertura, saldo_inicial: dadosCaixa.saldo_inicial || 0, status: 'aberto' }]).select().single();
      if (data && !error) { setCaixaAtual(data); fetchApenasAtualizacoes(); }
    } catch (err) { mostrarAlerta("Erro", "Erro ao abrir caixa: " + err.message); }
  };

  const salvarConfigEmpresa = async () => {
    if (nomeEmpresaEdicao.trim() === '') return mostrarAlerta("Aviso", "O nome não pode estar vazio.");
    const { error: errorEmpresa } = await supabase.from('empresas').update({ nome: nomeEmpresaEdicao, logo_url: logoEmpresaEdicao }).eq('id', sessao.empresa_id);
    const { error: errorUsuario } = await supabase.from('usuarios').update({ nome_usuario: nomeUsuarioEdicao }).eq('id', sessao.id);
    if (errorEmpresa || errorUsuario) return mostrarAlerta("Erro", "Erro ao salvar.");
    setNomeEmpresa(nomeEmpresaEdicao); setLogoEmpresa(logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'); 
    const novaSessao = { ...sessao, nome_usuario: nomeUsuarioEdicao }; setSessao(novaSessao); localStorage.setItem('bessa_session', JSON.stringify(novaSessao));
    setMostrarConfigEmpresa(false); mostrarAlerta("Sucesso", "Configurações atualizadas.");
  };

  const alterarSenhaConta = async (senhaAtualInformada, novaSenhaDesejada) => {
    try { const { error } = await supabase.auth.updateUser({ password: novaSenhaDesejada }); if (error) throw error; mostrarAlerta("Segurança", "Senha atualizada."); } catch (err) { mostrarAlerta("Erro", "Falha. " + err.message); }
  };

  const deletarWorkspace = async () => {
    try { const { error } = await supabase.rpc('delete_workspace_secure', { target_empresa_id: sessao.empresa_id }); if (error) throw error; localStorage.removeItem('bessa_session'); window.location.href = '/'; } catch (err) { mostrarAlerta("Erro Crítico", "Falha ao apagar infraestrutura."); }
  };

  const adicionarComanda = async (tipo) => {
    if (modoExclusao || !sessao?.empresa_id) return;
    const dataOperacional = caixaAtual?.status === 'aberto' ? caixaAtual.data_abertura : getHoje();
    const caixaId = caixaAtual?.status === 'aberto' ? caixaAtual.id : null;
    const qtdHoje = comandas.filter(c => c.data === dataOperacional).length;
    const novaComanda = { nome: `Comanda ${qtdHoje + 1}`, tipo, data: dataOperacional, hora_abertura: new Date().toISOString(), status: 'aberta', tags: [], empresa_id: sessao.empresa_id, caixa_id: caixaId };
    const { data, error } = await supabase.from('comandas').insert([novaComanda]).select().single();
    if (data && !error) { setComandas([...comandas, { ...data, produtos: [], pagamentos: [] }]); setIdSelecionado(data.id); }
  };

  const alterarNomeComanda = (id, nomeAtual) => mostrarPrompt("Identificador", "Digite o novo nome:", nomeAtual, async (novoNome) => { if(novoNome) { await supabase.from('comandas').update({nome: novoNome}).eq('id', id); setComandas(comandas.map(c => c.id === id ? {...c, nome: novoNome} : c)); } });
  const adicionarClienteComanda = (id, nomeAtual) => mostrarPrompt("Atribuir Cliente", "Nome do cliente:", "", async (cliente) => { if(cliente) { const novoNome = `${nomeAtual} - ${cliente}`; await supabase.from('comandas').update({nome: novoNome}).eq('id', id); setComandas(comandas.map(c => c.id === id ? {...c, nome: novoNome} : c)); } });
  const alternarTipoComanda = async (id, tipoAtual) => { const novoTipo = tipoAtual === 'Balcão' ? 'Delivery' : 'Balcão'; await supabase.from('comandas').update({tipo: novoTipo}).eq('id', id); setComandas(comandas.map(c => c.id === id ? {...c, tipo: novoTipo} : c)); };

  const adicionarProdutoNaComanda = async (produto, quantidade = 1) => {
    if (!sessao?.empresa_id || !idSelecionado) return;
    const qtdValida = parseInt(quantidade); if (isNaN(qtdValida) || qtdValida === 0) return;
    if (qtdValida < 0) {
      const comanda = comandas.find(c => c.id === idSelecionado); if (!comanda) return;
      const pDel = (comanda.produtos || []).filter(p => p.nome === produto.nome && Number(p.preco) === Number(produto.preco) && !p.pago && p.id).slice(0, Math.abs(qtdValida)); 
      if (pDel.length > 0) { const ids = pDel.map(p => p.id); const { error } = await supabase.from('comanda_produtos').delete().in('id', ids); if (!error) setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).filter(p => !ids.includes(p.id)) } : c)); }
      return;
    }
    const payload = Array.from({ length: qtdValida }).map(() => ({ comanda_id: idSelecionado, nome: produto.nome, preco: produto.preco, custo: produto.custo || 0, pago: false, observacao: '', empresa_id: sessao.empresa_id }));
    const { data, error } = await supabase.from('comanda_produtos').insert(payload).select();
    if (data && !error) { setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: [...(c.produtos || []), ...data] } : c)); setMostrarModalPeso(false); setAbaDetalheMobile('resumo'); } else if (error) mostrarAlerta("Erro", "Problema ao processar o produto.");
  };

  const toggleTag = async (tagNome) => { const cAtiva = comandas.find(c => c.id === idSelecionado); const tagsAtuais = cAtiva?.tags || []; const novasTags = tagsAtuais.includes(tagNome) ? tagsAtuais.filter(t => t !== tagNome) : [...tagsAtuais, tagNome]; await supabase.from('comandas').update({ tags: novasTags }).eq('id', idSelecionado); setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, tags: novasTags } : c)); };
  const vincularClienteFidelidade = async (idComanda, cliente) => { const cAtiva = comandas.find(c => c.id === idComanda); const novasTags = (cAtiva?.tags || []).includes("Fidelidade") ? (cAtiva?.tags || []) : [...(cAtiva?.tags || []), "Fidelidade"]; await supabase.from('comandas').update({ nome: cliente.nome, tags: novasTags }).eq('id', idComanda); setComandas(comandas.map(c => c.id === idComanda ? { ...c, nome: cliente.nome, tags: novasTags } : c)); };
  const excluirGrupoProdutos = async (nome, preco) => { const c = comandas.find(c => c.id === idSelecionado); if (!c) return; const ids = (c.produtos || []).filter(p => p.nome === nome && Number(p.preco) === Number(preco) && !p.pago && p.id).map(p => p.id); if (ids.length > 0) { await supabase.from('comanda_produtos').delete().in('id', ids); setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).filter(p => !ids.includes(p.id)) } : c)); } };
  const excluirProduto = async (idProduto) => { await supabase.from('comanda_produtos').delete().eq('id', idProduto); setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).filter(p => p.id !== idProduto) } : c)); };
  const editarProduto = async (idProduto, obsAtual) => mostrarPrompt("Nota", "Adicione uma nota:", obsAtual, async (novaObs) => { await supabase.from('comanda_produtos').update({ observacao: novaObs }).eq('id', idProduto); setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).map(p => p.id === idProduto ? { ...p, observacao: novaObs } : p) } : c)); });
  const encerrarMesa = async () => { const h = new Date().toISOString(); await supabase.from('comandas').update({ status: 'fechada', hora_fechamento: h }).eq('id', idSelecionado); setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, status: 'fechada', hora_fechamento: h } : c)); setIdSelecionado(null); };
  const confirmarExclusaoEmMassa = async () => { if (comandas.filter(c => selecionadasExclusao.includes(c.id)).some(c => (c.pagamentos || []).length > 0)) return mostrarAlerta("Atenção", "Existem comandas com pagamentos na seleção."); mostrarConfirmacao("Excluir", `Remover ${selecionadasExclusao.length} registro(s)?`, async () => { await supabase.from('comandas').delete().in('id', selecionadasExclusao); setComandas(comandas.filter(c => !selecionadasExclusao.includes(c.id))); setModoExclusao(false); setSelecionadasExclusao([]); }); };
  const toggleSelecaoExclusao = (id) => setSelecionadasExclusao(selecionadasExclusao.includes(id) ? selecionadasExclusao.filter(item => item !== id) : [...selecionadasExclusao, id]);
  const reabrirComandaFechada = async (id) => mostrarConfirmacao("Restaurar", "Retornar comanda?", async () => { await supabase.from('comandas').update({ status: 'aberta', hora_fechamento: null }).eq('id', id); setComandas(comandas.map(c => c.id === id ? { ...c, status: 'aberta', hora_fechamento: null } : c)); });
  const excluirComandaFechada = async (id) => mostrarConfirmacao("Excluir", "Ação permanente. Continuar?", async () => { await supabase.from('comandas').delete().eq('id', id); setComandas(comandas.filter(c => c.id !== id)); });

  const processarPagamento = async (valorFinal, formaPagamento, itensSelecionados, modoDivisao, bairroId = null, taxaEntrega = 0, isFidelidade = false) => {
    if (!sessao?.empresa_id) return;
    const cAtiva = comandas.find(c => c.id === idSelecionado);
    let nP = [...(cAtiva?.produtos || [])]; let idsPagar = [];
    if (modoDivisao) { nP = nP.map(p => { if (itensSelecionados.includes(p.id)) { idsPagar.push(p.id); return { ...p, pago: true }; } return p; }); } 
    else { nP = nP.map(p => ({ ...p, pago: true })); idsPagar = nP.map(p => p.id); }
    const todosPagos = nP.length > 0 && nP.every(p => p.pago);
    const dataDoCiclo = caixaAtual?.status === 'aberto' ? caixaAtual.data_abertura : (cAtiva?.data || getHoje());

    let fInserir = Array.isArray(formaPagamento) ? formaPagamento.map(p => ({ comanda_id: idSelecionado, valor: isFidelidade ? 0 : p.valor, forma: String(p.forma), data: dataDoCiclo, empresa_id: sessao.empresa_id })) : [{ comanda_id: idSelecionado, valor: isFidelidade ? 0 : valorFinal, forma: String(formaPagamento || 'Dinheiro'), data: dataDoCiclo, empresa_id: sessao.empresa_id }];
    const { data: pgData, error } = await supabase.from('pagamentos').insert(fInserir).select();
    
    if (!error) {
      if (idsPagar.length > 0) await supabase.from('comanda_produtos').update({ pago: true }).in('id', idsPagar);
      const hFech = new Date().toISOString(); const cFid = clientesFidelidade.find(c => c.nome.toLowerCase() === cAtiva.nome.toLowerCase());
      if (todosPagos) {
        await supabase.from('comandas').update({ status: 'fechada', hora_fechamento: hFech }).eq('id', idSelecionado);
        if (cFid) {
          if (isFidelidade) {
            const nPts = cFid.pontos - metaFidelidade.pontos_necessarios; await supabase.from('clientes_fidelidade').update({ pontos: nPts }).eq('id', cFid.id);
            setClientesFidelidade(prev => prev.map(c => c.id === cFid.id ? { ...c, pontos: nPts } : c)); mostrarAlerta("Prêmio Resgatado", `Pontos debitados.`);
          } else {
            if (nP.reduce((acc, p) => acc + p.preco, 0) + taxaEntrega >= metaFidelidade.valor_minimo) {
              const nPts = cFid.pontos + 1; const nTot = (cFid.pontos_totais || cFid.pontos) + 1; await supabase.from('clientes_fidelidade').update({ pontos: nPts, pontos_totais: nTot }).eq('id', cFid.id);
              setClientesFidelidade(prev => prev.map(c => c.id === cFid.id ? { ...c, pontos: nPts, pontos_totais: nTot } : c));
            }
          }
        }
      }
      setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: nP, pagamentos: [...(c.pagamentos || []), ...(pgData || [])], status: todosPagos ? 'fechada' : 'aberta', hora_fechamento: todosPagos ? hFech : c.hora_fechamento, bairro_id: bairroId || c.bairro_id, taxa_entrega: taxaEntrega > 0 ? taxaEntrega : c.taxa_entrega } : c));
      setMostrarModalPagamento(false);
    }
  };

  const isComandaInFiltro = (dataComanda) => {
    if (!dataComanda || !filtroTempo?.valor) return false;
    try {
      if (filtroTempo.tipo === 'dia') return dataComanda === filtroTempo.valor;
      if (filtroTempo.tipo === '7 dias') { const d = new Date(getHoje() + 'T12:00:00'); d.setDate(d.getDate() - 6); return dataComanda >= d.toISOString().split('T')[0] && dataComanda <= getHoje(); }
      if (filtroTempo.tipo === 'mes' || filtroTempo.tipo === 'ano') return dataComanda.startsWith(filtroTempo.valor);
      if (filtroTempo.tipo === 'periodo') return dataComanda >= (filtroTempo.inicio || '') && dataComanda <= (filtroTempo.fim || '');
    } catch(e) {} return false;
  };

  const comandaAtiva = comandas.find(c => c.id === idSelecionado);
  const comandasFiltradas = comandas.filter(c => isComandaInFiltro(c.data));
  const comandasAbertas = comandas.filter(c => c.status === 'aberta');
  const faturamentoTotal = comandasFiltradas.reduce((acc, c) => acc + (c.produtos || []).reduce((sum, p) => sum + (p.preco || 0), 0), 0);
  const lucroEstimado = faturamentoTotal - comandasFiltradas.reduce((acc, c) => acc + (c.produtos || []).reduce((sum, p) => sum + (p.custo || 0), 0), 0);
  const pAgrup = comandasFiltradas.flatMap(c => c.pagamentos || []).reduce((acc, p) => { let f = Array.isArray(p.forma) ? p.forma[0]?.forma : p.forma; if(typeof f === 'string' && f.startsWith('[')) try { f = JSON.parse(f)[0]?.forma; } catch(e){} acc[f || 'Outro'] = (acc[f || 'Outro'] || 0) + p.valor; return acc; }, {});
  const dadosPizza = Object.keys(pAgrup).map(key => ({ name: key, value: pAgrup[key] })).filter(d => d.value > 0);
  
  const cProd = {}; comandasFiltradas.forEach(c => (c.produtos || []).forEach(p => { const o = String(p?.nome || ''); const isP = o.toLowerCase().includes('peso') || o.toLowerCase().includes('balança'); const d = isP ? o.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim() : o; const k = d.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim(); if (!cProd[k]) cProd[k] = { nome: d, val: 0, cust: 0, vol: 0, isP }; cProd[k].val += (p.preco || 0); cProd[k].cust += (p.custo || 0); if (isP) { const m = o.match(/(\d+(?:\.\d+)?)\s*g/i); cProd[k].vol += m ? parseFloat(m[1]) : 0; } else cProd[k].vol += 1; }));
  const rankingProdutos = Object.values(cProd).map(i => ({ nome: i.nome, valor: i.val, lucro: i.val - i.cust, volume: i.vol, isPeso: i.isP })).sort((a, b) => b.valor - a.valor);

  return {
    statusPresenca, nomeEmpresa, setNomeEmpresa, logoEmpresa, setLogoEmpresa, mostrarConfigEmpresa, setMostrarConfigEmpresa,
    nomeEmpresaEdicao, setNomeEmpresaEdicao, logoEmpresaEdicao, setLogoEmpresaEdicao, nomeUsuarioEdicao, setNomeUsuarioEdicao,
    dadosPlano, caixaAtual, comandas, menuCategorias, tagsGlobais, setTagsGlobais, configPeso, clientesFidelidade, setClientesFidelidade,
    metaFidelidade, setMetaFidelidade, mostrarMenuPerfil, setMostrarMenuPerfil, mostrarAdminProdutos, setMostrarAdminProdutos,
    mostrarAdminUsuarios, setMostrarAdminUsuarios, mostrarConfigTags, setMostrarConfigTags, mostrarAdminDelivery, setMostrarAdminDelivery,
    mostrarModalPeso, setMostrarModalPeso, mostrarModalPagamento, setMostrarModalPagamento, idSelecionado, setIdSelecionado, abaAtiva, setAbaAtiva,
    avisoFechamento, abaDetalheMobile, setAbaDetalheMobile, filtroCategoriaCardapio, setFiltroCategoriaCardapio, modoExclusao, setModoExclusao,
    selecionadasExclusao, setSelecionadasExclusao, filtroTempo, setFiltroTempo, modalGlobal, getHoje, getMesAtual, getAnoAtual, abrirCaixaManual,
    salvarConfigEmpresa, alterarSenhaConta, deletarWorkspace, adicionarComanda, alterarNomeComanda, adicionarClienteComanda, alternarTipoComanda,
    adicionarProdutoNaComanda, toggleTag, vincularClienteFidelidade, excluirGrupoProdutos, excluirProduto, editarProduto, encerrarMesa, processarPagamento,
    confirmarExclusaoEmMassa, toggleSelecaoExclusao, reabrirComandaFechada, excluirComandaFechada, fetchApenasAtualizacoes, fecharModalGlobal,
    comandaAtiva, comandasFiltradas, comandasAbertas, faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos
  };
}