'use client';
import { useState, useEffect } from 'react';
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

// Modais
import ModalConfigEmpresa from '@/components/ModalConfigEmpresa';
import ModalConfigTags from '@/components/ModalConfigTags';
import ModalPeso from '@/components/ModalPeso';
import ModalPagamento from '@/components/ModalPagamento';
import AdminProdutos from '@/components/AdminProdutos';
import AdminUsuarios from '@/components/AdminUsuarios';

export default function Home() {
  const getHoje = () => {
    const dataBr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const d = new Date(dataBr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const getMesAtual = () => getHoje().substring(0, 7);
  const getAnoAtual = () => getHoje().substring(0, 4);

  const [sessao, setSessao] = useState(null); 
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
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
    setSessao(null); setCredenciais({ email: '', senha: '' }); setMostrarMenuPerfil(false); setMenuMobileAberto(false); setAbaAtiva('comandas');
  };

  const fetchData = async () => {
    if (!sessao?.empresa_id) return;
    setIsLoading(true);
    
    try {
      // Trazemos tudo (*) para evitar erros se a coluna se chamar "logo" ou "logo_url"
      const { data: empData, error: empError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', sessao.empresa_id)
        .single();
        
      if (empError) {
        console.warn("Aviso ao buscar empresa:", empError.message);
        setNomeEmpresa("A Minha Loja"); 
      } else if (empData) {
        setNomeEmpresa(empData.nome || "A Minha Loja");
        setNomeEmpresaEdicao(empData.nome || "");
        
        // Tenta achar a logo, não importa se a coluna se chama 'logo' ou 'logo_url'
        const urlLogo = empData.logo || empData.logo_url;
        if (urlLogo) {
          setLogoEmpresa(urlLogo);
          setLogoEmpresaEdicao(urlLogo);
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
    } catch (err) {
      console.error("Erro inesperado no fetch:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!sessao?.empresa_id) return;
    fetchData(); 
    const canalAtualizacoes = supabase.channel('schema-db-changes')
      .on('postgres', { event: '*', schema: 'public', table: 'comandas' }, () => { fetchData(); })
      .on('postgres', { event: '*', schema: 'public', table: 'comanda_produtos' }, () => { fetchData(); })
      .on('postgres', { event: '*', schema: 'public', table: 'pagamentos' }, () => { fetchData(); })
      .on('postgres', { event: '*', schema: 'public', table: 'tags' }, () => { fetchData(); }) 
      .subscribe();
    return () => { supabase.removeChannel(canalAtualizacoes); };
  }, [sessao]);

  const salvarConfigEmpresa = async () => {
    if (nomeEmpresaEdicao.trim() === '') return alert("O nome não pode estar vazio.");
    
    // Atualiza o nome e o link da logo na coluna logo_url que acabou de criar!
    const { error } = await supabase
      .from('empresas')
      .update({ 
        nome: nomeEmpresaEdicao, 
        logo_url: logoEmpresaEdicao 
      })
      .eq('id', sessao.empresa_id);
      
    if (error) {
      alert("❌ Erro ao salvar no banco de dados: " + error.message);
      return; // Se der erro, pára aqui e não fecha a janela
    }
    
    // Se deu sucesso, atualiza a tela e fecha o modal
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

  if (!sessao) {
    return <Login getHoje={getHoje} setSessao={setSessao} temaNoturno={temaNoturno} setTemaNoturno={setTemaNoturno} />;
  }

  if (isLoading && comandas.length === 0) {
    return <div className={`min-h-screen flex items-center justify-center font-bold text-xl animate-pulse ${temaNoturno ? 'bg-gray-900 text-purple-400' : 'bg-gray-50 text-purple-600'}`}>A Sincronizar Sistema...</div>;
  }

  return (
    <main className={`min-h-screen p-2 xl:p-6 flex flex-col transition-colors duration-500 ${temaNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      <Header 
        comandaAtiva={comandaAtiva} setIdSelecionado={setIdSelecionado} setMenuMobileAberto={setMenuMobileAberto}
        temaNoturno={temaNoturno} caixaAtual={caixaAtual} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
        logoEmpresa={logoEmpresa} setTemaNoturno={setTemaNoturno} mostrarMenuPerfil={mostrarMenuPerfil}
        setMostrarMenuPerfil={setMostrarMenuPerfil} nomeEmpresa={nomeEmpresa} sessao={sessao}
        setMostrarConfigEmpresa={setMostrarConfigEmpresa} setMostrarAdminUsuarios={setMostrarAdminUsuarios}
        setMostrarAdminProdutos={setMostrarAdminProdutos} setMostrarConfigTags={setMostrarConfigTags} fazerLogout={fazerLogout}
      />

      {!comandaAtiva && alertaTags && abaAtiva === 'comandas' && (
        <div className={`mb-6 p-4 rounded-3xl flex items-center justify-between border shadow-sm animate-in slide-in-from-top-4 ${temaNoturno ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          <div className="flex items-center gap-4">
            <span className="text-3xl drop-shadow-sm">💡</span>
            <div>
              <p className="font-black text-sm">Alimente a sua Inteligência de Negócio!</p>
              <p className={`text-xs mt-0.5 font-medium leading-relaxed ${temaNoturno ? 'text-yellow-400/80' : 'text-yellow-700/80'}`}>
                As suas últimas comandas estão sem tags. Para classificar os seus clientes, abra uma comanda e <b>clique nas tags abaixo do cardápio</b>.
              </p>
            </div>
          </div>
        </div>
      )}

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
          />
        ) : abaAtiva === 'analises' ? (
          <TabAnalises 
            temaNoturno={temaNoturno} filtroTempo={filtroTempo} setFiltroTempo={setFiltroTempo} 
            getHoje={getHoje} getMesAtual={getMesAtual} getAnoAtual={getAnoAtual} 
            dadosTipos={dadosTipos} dadosTags={dadosTags} 
          />
        ) : null}
      </div>

      {mostrarAdminUsuarios && sessao && <AdminUsuarios empresaId={sessao.empresa_id} usuarioAtualId={sessao.id} temaNoturno={temaNoturno} onFechar={() => setMostrarAdminUsuarios(false)} />}
      {mostrarAdminProdutos && sessao && <AdminProdutos empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => { setMostrarAdminProdutos(false); fetchData(); }} />}
      {mostrarModalPeso && <ModalPeso opcoesPeso={configPeso} temaNoturno={temaNoturno} onAdicionar={adicionarProdutoNaComanda} onCancelar={() => setMostrarModalPeso(false)} />}
      {mostrarModalPagamento && <ModalPagamento comanda={comandaAtiva} temaNoturno={temaNoturno} onConfirmar={processarPagamento} onCancelar={() => setMostrarModalPagamento(false)} />}
      
      {mostrarConfigEmpresa && (
        <ModalConfigEmpresa
          temaNoturno={temaNoturno} nomeEmpresaEdicao={nomeEmpresaEdicao} setNomeEmpresaEdicao={setNomeEmpresaEdicao}
          logoEmpresaEdicao={logoEmpresaEdicao} setLogoEmpresaEdicao={setLogoEmpresaEdicao}
          salvarConfigEmpresa={salvarConfigEmpresa} setMostrarConfigEmpresa={setMostrarConfigEmpresa}
        />
      )}

      {mostrarConfigTags && (
        <ModalConfigTags
          temaNoturno={temaNoturno} tagsGlobais={tagsGlobais} setTagsGlobais={setTagsGlobais}
          sessao={sessao} setMostrarConfigTags={setMostrarConfigTags}
        />
      )}
    </main>
  );
}