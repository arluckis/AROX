'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import PreComanda from '@/components/PreComanda'; 
import SystemLoader from '@/components/SystemLoader';
import AroxCinematicScene from '@/components/scenes/AroxCinematicScene';

import ModalConfigEmpresa from '@/components/ModalConfigEmpresa';
import ModalConfigTags from '@/components/ModalConfigTags';
import ModalPeso from '@/components/ModalPeso';
import ModalPagamento from '@/components/ModalPagamento';
import AdminProdutos from '@/components/AdminProdutos';
import AdminDelivery from '@/components/AdminDelivery'; 

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const VERSAO_ATUAL = '1.2.0'; 
    const versaoNoNavegador = localStorage.getItem('arox_versao_sistema');
    if (versaoNoNavegador !== VERSAO_ATUAL) {
      localStorage.setItem('arox_versao_sistema', VERSAO_ATUAL);
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

  const frasesLoading = useMemo(() => [
    "Autenticando sessão segura", 
    "Sincronizando ambiente", 
    "Estabelecendo conexão", 
    "Aferindo módulos operacionais",
    "Preparando cockpit"
  ], []);

  const [fraseCarregamento, setFraseCarregamento] = useState(frasesLoading[0]);

  useEffect(() => {
    let indiceAtual = 0;
    const interval = setInterval(() => {
      indiceAtual = (indiceAtual + 1) % frasesLoading.length;
      setFraseCarregamento(frasesLoading[indiceAtual]);
    }, 3000); 

    return () => clearInterval(interval);
  }, [frasesLoading]);

  const [sessao, setSessao] = useState(null); 
  const [statusPresenca, setStatusPresenca] = useState('online');
  const [nomeEmpresa, setNomeEmpresa] = useState('AROX'); 
  const [temaNoturno, setTemaNoturno] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [mostrarConfigEmpresa, setMostrarConfigEmpresa] = useState(false);
  const [nomeEmpresaEdicao, setNomeEmpresaEdicao] = useState('');
  const [logoEmpresa, setLogoEmpresa] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  const [logoEmpresaEdicao, setLogoEmpresaEdicao] = useState('');
  const [nomeUsuarioEdicao, setNomeUsuarioEdicao] = useState('');
  
  const [dadosPlano, setDadosPlano] = useState({ nome: 'Free', validade: null, criado_em: null });

  const [caixaAtual, setCaixaAtual] = useState(null); 
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

  const [appMode, setAppMode] = useState('loading'); 
  const [scenePhase, setScenePhase] = useState('ignition');
  const [sceneCustomConfig, setSceneCustomConfig] = useState(null); 
  const [isSceneActive, setIsSceneActive] = useState(true); 
  const [isPreComandaActiveGlobally, setIsPreComandaActiveGlobally] = useState(false); 
  
  const [isAntecipado, setIsAntecipado] = useState(false);
  const [temPendencia, setTemPendencia] = useState(false);
  const [isShellEntering, setIsShellEntering] = useState(false);
  const [isLoginFading, setIsLoginFading] = useState(false); 

  const preComandaDispensada = useRef(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);
  const shellTransitionFired = useRef(false);
  const isTransitioningRef = useRef(false);
  const [loaderExitStage, setLoaderExitStage] = useState('none');
  
  const isFirstLoad = useRef(true);

  // --- MOTOR DE NORMALIZAÇÃO DE CICLOS (RETROATIVO E ATUAL) ---
  const normalizarComandas = (listaComandas, listaCaixas) => {
    return listaComandas.map(c => {
      let cicloData = c.data;
      
      // 1. Se a comanda já tem a marcação do caixa atualizado
      if (c.caixa_id) {
        const cx = listaCaixas.find(x => x.id === c.caixa_id);
        if (cx) cicloData = cx.data_abertura;
      } 
      // 2. Lógica Retroativa: Descobre o ciclo pela hora que a comanda nasceu!
      else {
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

  useEffect(() => {
    if (appMode !== 'loading') return;
    
    if (isFirstLoad.current) {
      const t1 = setTimeout(() => { setScenePhase('reveal'); }, 300);
      const t2 = setTimeout(() => { setScenePhase('sync'); }, 800);
      const t3 = setTimeout(() => { setMinLoadTimePassed(true); }, 2500); 
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setScenePhase('handoff');
      setLoaderExitStage('none');
      const t1 = setTimeout(() => { setMinLoadTimePassed(true); }, 1000); 
      return () => clearTimeout(t1);
    }
  }, [appMode]);

  useEffect(() => {
    const handleMount = () => setIsPreComandaActiveGlobally(true);
    const handleUnmount = () => setIsPreComandaActiveGlobally(false);
    const handleEnvUpdate = (e) => setSceneCustomConfig(e.detail);

    window.addEventListener('arox-precomanda-mounted', handleMount);
    window.addEventListener('arox-precomanda-unmounted', handleUnmount);
    window.addEventListener('arox-env-update', handleEnvUpdate);

    return () => {
       window.removeEventListener('arox-precomanda-mounted', handleMount);
       window.removeEventListener('arox-precomanda-unmounted', handleUnmount);
       window.removeEventListener('arox-env-update', handleEnvUpdate);
    };
  }, []);

  useEffect(() => {
    if (appMode === 'takeover' && !isSceneActive) {
      setIsSceneActive(true);
      setScenePhase('handoff');
      setSceneCustomConfig(null); 
      setLoaderExitStage('none'); 
      isTransitioningRef.current = false;
    }
  }, [appMode, isSceneActive]);

  useEffect(() => {
    if (isDataLoaded && minLoadTimePassed && appMode === 'loading' && !shellTransitionFired.current) {
       shellTransitionFired.current = true;
       
       const shouldBypassPreComanda = preComandaDispensada.current || caixaAtual?.status === 'aberto';

       if (shouldBypassPreComanda) {
          transitionToShell(false); 
       } else {
          setLoaderExitStage('content');
          setTimeout(() => setLoaderExitStage('card'), 250);
          setTimeout(() => setLoaderExitStage('arox'), 500);
          setTimeout(() => {
             setScenePhase('handoff');
             setAppMode('takeover');
          }, 700);
       }
    }
  }, [isDataLoaded, minLoadTimePassed, appMode, caixaAtual]);

  const mostrarAlerta = (titulo, mensagem) => setModalGlobal({ visivel: true, tipo: 'alerta', titulo, mensagem, valorInput: '', acaoConfirmar: null });
  const mostrarConfirmacao = (titulo, mensagem, acaoConfirmar) => setModalGlobal({ visivel: true, tipo: 'confirmacao', titulo, mensagem, valorInput: '', acaoConfirmar });
  const mostrarPrompt = (titulo, mensagem, valorInicial, acaoConfirmar) => setModalGlobal({ visivel: true, tipo: 'prompt', titulo, mensagem, valorInput: valorInicial || '', acaoConfirmar });
  const fecharModalGlobal = () => setModalGlobal({ visivel: false, tipo: 'alerta', titulo: '', mensagem: '', valorInput: '', acaoConfirmar: null });

  const isSessionExpired = () => {
    const sessionStart = localStorage.getItem('arox_session_start');
    if (!sessionStart) return false; 
    
    const now = new Date();
    const sessionDate = new Date(sessionStart);
    
    const limit = new Date(now);
    limit.setHours(5, 0, 0, 0);
    
    if (now >= limit && sessionDate < limit) return true;
    
    const limitYesterday = new Date(limit);
    limitYesterday.setDate(limitYesterday.getDate() - 1);
    if (now < limit && sessionDate < limitYesterday) return true;
    
    return false;
  };

  useEffect(() => {
    if (appMode === 'takeover' || appMode === 'shell') return; 
    
    const temaSalvo = localStorage.getItem('arox_tema_noturno');
    if (temaSalvo !== null) setTemaNoturno(JSON.parse(temaSalvo));
    const logoSalva = localStorage.getItem('arox_logo_empresa');
    if (logoSalva) setLogoEmpresa(logoSalva);
    
    const sessionData = localStorage.getItem('bessa_session');
    
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.role === 'super_admin') {
          router.push('/admin');
          return;
        }

        if (isSessionExpired()) {
          fazerLogout(true);
          return;
        }

        if (parsed.empresa_id) {
          if (!sessao) {
            isFirstLoad.current = false;
            setSessao(parsed);
            if (!localStorage.getItem('arox_session_start')) {
              localStorage.setItem('arox_session_start', new Date().toISOString());
            }
          }
        } else {
          localStorage.removeItem('bessa_session');
          triggerLoginTransition();
        }
      } catch(e) { 
        localStorage.removeItem('bessa_session'); 
        triggerLoginTransition();
      }
    } else {
      triggerLoginTransition();
    }

    function triggerLoginTransition() {
      if (appMode === 'loading' && !isTransitioningRef.current) {
         if (isFirstLoad.current) {
            isTransitioningRef.current = true;
            setAppMode('login'); 
            setScenePhase('ignition');
            isFirstLoad.current = false;
            isTransitioningRef.current = false;
         } else if (minLoadTimePassed) {
            isTransitioningRef.current = true;
            setLoaderExitStage('content');
            setTimeout(() => setLoaderExitStage('card'), 200);
            setTimeout(() => setLoaderExitStage('arox'), 400);
            setTimeout(() => {
               setAppMode('login'); 
               setScenePhase('ignition');
               isFirstLoad.current = false;
               isTransitioningRef.current = false;
            }, 600);
         }
      }
    }
  }, [appMode, minLoadTimePassed, router, sessao]);

  useEffect(() => {
    const verificarHorario = () => {
       const agora = new Date();
       const horas = agora.getHours();
       const minutos = agora.getMinutes();
       if ((horas === 22 && minutos >= 50) || horas >= 23 || horas < 4) setAvisoFechamento(true);
       else setAvisoFechamento(false);

       if (sessao && isSessionExpired()) fazerLogout(true);
    };
    verificarHorario();
    const intervalo = setInterval(verificarHorario, 60000); 
    return () => clearInterval(intervalo);
  }, [sessao]);

  useEffect(() => {
    if (!sessao || sessao.role === 'super_admin') return;
    
    let timeoutInatividade;
    
    const atualizarBanco = async (novoStatus) => {
      setStatusPresenca(novoStatus);
      
      const sessionId = localStorage.getItem('arox_session_id');
      const now = new Date().toISOString();
      
      if (sessionId) {
        await supabase.from('sessoes_acesso').update({ ultimo_heartbeat: now }).eq('id', sessionId);
      }
      await supabase.from('usuarios').update({ ultimo_ping_at: now, status_presenca: novoStatus }).eq('id', sessao.id);
    };

    atualizarBanco('online'); 
    const heartbeatInterval = setInterval(() => {
       atualizarBanco(document.hidden ? 'ausente' : 'online');
    }, 60000); 

    const handleVisibilidade = () => {
      atualizarBanco(document.hidden ? 'ausente' : 'online');
    };

    const resetarTemporizador = () => {
      if (document.hidden) return; 
      
      setStatusPresenca((prev) => {
        if (prev === 'ausente') atualizarBanco('online');
        return 'online';
      });

      clearTimeout(timeoutInatividade);
      timeoutInatividade = setTimeout(() => {
         atualizarBanco('ausente');
      }, 3 * 60 * 1000); 
    };

    document.addEventListener('visibilitychange', handleVisibilidade);
    window.addEventListener('mousemove', resetarTemporizador);
    window.addEventListener('keydown', resetarTemporizador);
    window.addEventListener('click', resetarTemporizador);
    resetarTemporizador();

    return () => {
      clearInterval(heartbeatInterval);
      clearTimeout(timeoutInatividade);
      document.removeEventListener('visibilitychange', handleVisibilidade);
      window.removeEventListener('mousemove', resetarTemporizador);
      window.removeEventListener('keydown', resetarTemporizador);
      window.removeEventListener('click', resetarTemporizador);
    };
  }, [sessao]);

  useEffect(() => {
    if (appMode === 'takeover' || !sessao) return; 
    localStorage.setItem('arox_tema_noturno', JSON.stringify(temaNoturno));
    document.body.style.backgroundColor = temaNoturno ? '#09090b' : '#fafafa'; 
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', temaNoturno ? '#09090b' : '#ffffff');
  }, [temaNoturno, appMode, sessao]);

  const fazerLogout = async (silent = false) => {
    const sessionId = localStorage.getItem('arox_session_id');
    const now = new Date().toISOString();
    
    if (sessionId) {
      await supabase.from('sessoes_acesso').update({ fim_sessao: now }).eq('id', sessionId);
    }
    if (sessao?.id) {
      await supabase.from('usuarios').update({ status_presenca: 'offline' }).eq('id', sessao.id);
    }

    localStorage.removeItem('bessa_session');
    localStorage.removeItem('arox_logo_empresa');
    localStorage.removeItem('arox_session_id');
    localStorage.removeItem('arox_session_start');
    
    setSessao(null); 
    setMostrarMenuPerfil(false); 
    setMenuMobileAberto(false); 
    setAbaAtiva('comandas'); 
    setNomeEmpresa('AROX');
    setLogoEmpresa('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
    
    preComandaDispensada.current = false; 
    isTransitioningRef.current = false;
    setIsSceneActive(true); 
    setAppMode('loading');
    setScenePhase('ignition');
    setIsDataLoaded(false);
    setMinLoadTimePassed(false);
    shellTransitionFired.current = false;
    setLoaderExitStage('none');
    isFirstLoad.current = true; 

    if (silent) window.location.reload();
  };

  const fetchDadosEstaticos = async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data: empData } = await supabase.from('empresas').select('*').eq('id', sessao.empresa_id).single();
      if (empData) {
        setNomeEmpresa(empData.nome || "AROX");
        setNomeEmpresaEdicao(empData.nome || "");
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
    setIsLoading(true);
    try {
      const { data: todosCaixas } = await supabase.from('caixas')
        .select('id, data_abertura, data_fechamento, criado_em, status')
        .eq('empresa_id', sessao.empresa_id)
        .order('criado_em', { ascending: false }); 
        
      let caixasAbertos = (todosCaixas || []).filter(c => c.status === 'aberto');
      let caixaData = caixasAbertos.length > 0 ? caixasAbertos[0] : null;
      
      const { data: comData } = await supabase.from('comandas').select('*, produtos:comanda_produtos(*), pagamentos(*)').eq('empresa_id', sessao.empresa_id).order('id', { ascending: false }).limit(3000);
      
      let comandasMapeadas = [];
      if (comData) {
          // NORMALIZA TODAS AS COMANDAS DO BANCO PARA SUA DATA DE CICLO
          comandasMapeadas = normalizarComandas(comData, todosCaixas || []).reverse();
          setComandas(comandasMapeadas);
      }

      const hoje = getHoje();
      let hasPendencia = false;

      if (caixaData && caixaData.data_abertura && caixaData.data_abertura < hoje) {
        hasPendencia = true;
      }
      
      const comandasPendentes = comandasMapeadas ? comandasMapeadas.filter(c => c.status === 'aberta' && c.data && c.data < hoje) : [];
      if (comandasPendentes.length > 0) {
        hasPendencia = true;
      }

      setTemPendencia(hasPendencia);

      if (caixaData && !hasPendencia) {
        setCaixaAtual(caixaData);
      } else if (!caixaData) {
        setCaixaAtual(null);
        const horaAtual = new Date().getHours();
        setIsAntecipado(horaAtual < 10); 
      } else {
         setCaixaAtual(caixaData);
      }
      
      setIsDataLoaded(true);

    } catch (err) {} finally { setIsLoading(false); }
  };

  const fetchApenasAtualizacoes = async () => {
    if (!sessao?.empresa_id) return;
    try {
      const { data: statusConta } = await supabase.from('empresas').select('ativo, validade_plano').eq('id', sessao.empresa_id).single();
      if (statusConta) {
        const agora = new Date();
        const planoExpirado = statusConta.validade_plano ? new Date(statusConta.validade_plano) < agora : false;
        if (statusConta.ativo === false || planoExpirado) {
          mostrarAlerta("Conta suspensa", statusConta.ativo === false ? "Sua conta foi temporariamente suspensa pelo administrador." : "Seu plano expirou. Regularize sua assinatura.");
          setTimeout(() => { fazerLogout(true); }, 4000);
          return; 
        }
      }

      const { data: todosCaixas } = await supabase.from('caixas')
        .select('id, data_abertura, data_fechamento, criado_em, status')
        .eq('empresa_id', sessao.empresa_id)
        .order('criado_em', { ascending: false }); 
        
      let caixasAbertos = (todosCaixas || []).filter(c => c.status === 'aberto');
      let caixaAtivo = caixasAbertos.length > 0 ? caixasAbertos[0] : null;
      setCaixaAtual(caixaAtivo); 

      let queryComandas = supabase.from('comandas')
          .select('*, produtos:comanda_produtos(*), pagamentos(*)')
          .eq('empresa_id', sessao.empresa_id);

      if (caixaAtivo) {
          queryComandas = queryComandas.or(`caixa_id.eq.${caixaAtivo.id},status.eq.aberta,data.eq.${getHoje()}`);
      } else {
          queryComandas = queryComandas.or(`status.eq.aberta,data.eq.${getHoje()}`);
      }

      const { data: comDataHoje } = await queryComandas;

      if (comDataHoje) {
        // NORMALIZA OS DADOS NOVOS ANTES DE JOGAR NO STATE
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
    if (!sessao?.empresa_id) return;
    setNomeUsuarioEdicao(sessao.nome_usuario || '');
    
    const initializeSession = async () => {
      await fetchDadosEstaticos();
      await fetchHistoricoCompleto(); 
    };
    
    initializeSession();
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
      if (data) { 
        setCaixaAtual(data); 
        fetchApenasAtualizacoes(); 
      }
    } catch (err) { mostrarAlerta("Erro", "Erro ao abrir caixa: " + err.message); } finally { setIsLoading(false); }
  };

  const transitionToShell = (fromPreComanda = false) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    if (fromPreComanda) {
      setAppMode('shell');
      setIsShellEntering(true);
      setTimeout(() => setIsShellEntering(false), 800);
      setTimeout(() => {
          setIsSceneActive(false);
          isTransitioningRef.current = false;
      }, 1200);
    } else {
      setLoaderExitStage('content');
      setTimeout(() => setLoaderExitStage('card'), 150);
      setTimeout(() => setLoaderExitStage('arox'), 350);
      setTimeout(() => {
        setScenePhase(temaNoturno ? 'bridgeDark' : 'bridgeLight');
        setTimeout(() => {
          setAppMode('shell');
          setIsShellEntering(true);
          setTimeout(() => setIsShellEntering(false), 800);
          setTimeout(() => {
              setIsSceneActive(false);
              isTransitioningRef.current = false;
          }, 1200);
        }, 700);
      }, 500);
    }
  };

  const onFinalizarAbertura = (valor) => {
    transitionToShell(true);
    abrirCaixaManual({ data_abertura: getHoje(), saldo_inicial: valor });
  };
  
  const onAcessarSistema = (forcarFaturamento = true) => {
    preComandaDispensada.current = true;
    if (forcarFaturamento) {
      setAbaAtiva('faturamento');
    }
    transitionToShell(true);
  };

  const handleResolverPendencia = () => {
    preComandaDispensada.current = true;
    setAbaAtiva('caixa'); 
    transitionToShell(true);
  };

  const salvarConfigEmpresa = async () => {
    if (nomeEmpresaEdicao.trim() === '') return mostrarAlerta("Aviso", "O nome do estabelecimento não pode estar vazio.");
    const { error: errorEmpresa } = await supabase.from('empresas').update({ nome: nomeEmpresaEdicao, logo_url: logoEmpresaEdicao }).eq('id', sessao.empresa_id);
    const { error: errorUsuario } = await supabase.from('usuarios').update({ nome_usuario: nomeUsuarioEdicao }).eq('id', sessao.id);
    if (errorEmpresa || errorUsuario) return mostrarAlerta("Erro", "Erro ao salvar no banco de dados.");
    setNomeEmpresa(nomeEmpresaEdicao); 
    setLogoEmpresa(logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'); 
    const novaSessao = { ...sessao, nome_usuario: nomeUsuarioEdicao };
    setSessao(novaSessao);
    localStorage.setItem('bessa_session', JSON.stringify(novaSessao));
    setMostrarConfigEmpresa(false);
    mostrarAlerta("Sucesso", "Configurações atualizadas.");
  };

  const alterarSenhaConta = async (senhaAtualInformada, novaSenhaDesejada) => {
    try {
      const { data: usuarioAuth, error: errorAuth } = await supabase.auth.updateUser({ password: novaSenhaDesejada });
      if (errorAuth) throw errorAuth;
      mostrarAlerta("Segurança", "Senha atualizada com sucesso.");
    } catch (err) { mostrarAlerta("Erro", "Não foi possível atualizar a senha. " + err.message); }
  };

  const deletarWorkspace = async () => {
    try {
      const { error } = await supabase.rpc('delete_workspace_secure', { target_empresa_id: sessao.empresa_id });
      if (error) throw error;
      
      localStorage.removeItem('bessa_session');
      window.location.href = '/';
    } catch (err) {
      mostrarAlerta("Erro Crítico", "Falha ao apagar infraestrutura. Contate o suporte.");
    }
  };

  const adicionarComanda = async (tipo) => {
    if (modoExclusao || !sessao?.empresa_id) return;
    
    const dataOperacional = caixaAtual?.status === 'aberto' ? caixaAtual.data_abertura : getHoje();
    const caixaId = caixaAtual?.status === 'aberto' ? caixaAtual.id : null;

    const qtdHoje = comandas.filter(c => c.data === dataOperacional).length;
    const novaComanda = { 
       nome: `Comanda ${qtdHoje + 1}`, 
       tipo, 
       data: dataOperacional, // Salvando direto no dia do ciclo!
       hora_abertura: new Date().toISOString(), 
       status: 'aberta', 
       tags: [], 
       empresa_id: sessao.empresa_id,
       caixa_id: caixaId
    };
    
    const { data, error } = await supabase.from('comandas').insert([novaComanda]).select().single();
    if (data && !error) { setComandas([...comandas, { ...data, produtos: [], pagamentos: [] }]); setIdSelecionado(data.id); }
  };

  const alterarNomeComanda = (id, nomeAtual) => {
    mostrarPrompt("Identificador", "Digite o novo nome:", nomeAtual, async (novoNome) => {
      if(novoNome) {
        await supabase.from('comandas').update({nome: novoNome}).eq('id', id);
        setComandas(comandas.map(c => c.id === id ? {...c, nome: novoNome} : c));
      }
    });
  };

  const adicionarClienteComanda = (id, nomeAtual) => {
    mostrarPrompt("Atribuir Cliente", "Nome do cliente:", "", async (cliente) => {
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
      const produtosParaExcluir = (comanda.produtos || []).filter(p => p.nome === produto.nome && Number(p.preco) === Number(produto.preco) && !p.pago && p.id).slice(0, Math.abs(qtdValida)); 
      if (produtosParaExcluir.length > 0) {
        const ids = produtosParaExcluir.map(p => p.id);
        const { error } = await supabase.from('comanda_produtos').delete().in('id', ids);
        if (!error) setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: (c.produtos || []).filter(p => !ids.includes(p.id)) } : c));
      }
      return;
    }
    
    const payloadArray = Array.from({ length: qtdValida }).map(() => ({ 
      comanda_id: idSelecionado, nome: produto.nome, preco: produto.preco, custo: produto.custo || 0, pago: false, observacao: '', empresa_id: sessao.empresa_id 
    }));
    
    const { data, error } = await supabase.from('comanda_produtos').insert(payloadArray).select();
    if (data && !error) { setComandas(comandas.map(c => c.id === idSelecionado ? { ...c, produtos: [...(c.produtos || []), ...data] } : c)); setMostrarModalPeso(false); setAbaDetalheMobile('resumo'); } 
    else if (error) mostrarAlerta("Erro", "Problema ao processar o produto.");
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
    mostrarPrompt("Nota", "Adicione uma nota para este item:", obsAtual, async (novaObs) => {
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
      novosProdutos = novosProdutos.map(p => { if (itensSelecionados.includes(p.id)) { idsParaPagar.push(p.id); return { ...p, pago: true }; } return p; });
    } else { 
      novosProdutos = novosProdutos.map(p => ({ ...p, pago: true })); idsParaPagar = novosProdutos.map(p => p.id); 
    }
    
    const todosPagos = novosProdutos.length > 0 && novosProdutos.every(p => p.pago);

    const dataDoCiclo = caixaAtual?.status === 'aberto' ? caixaAtual.data_abertura : (comandaAtiva?.data || getHoje());

    let formasParaInserir = Array.isArray(formaPagamento) 
      ? formaPagamento.map(p => ({ comanda_id: idSelecionado, valor: isFidelidade ? 0 : p.valor, forma: String(p.forma), data: dataDoCiclo, empresa_id: sessao.empresa_id })) 
      : [{ comanda_id: idSelecionado, valor: isFidelidade ? 0 : valorFinal, forma: String(formaPagamento || 'Dinheiro'), data: dataDoCiclo, empresa_id: sessao.empresa_id }];
    
    const { data: pgDataArray, error: errPg } = await supabase.from('pagamentos').insert(formasParaInserir).select();
    
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
            mostrarAlerta("Prêmio Resgatado", `O resgate foi processado e os pontos foram debitados.`);
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
           return { ...c, produtos: novosProdutos, pagamentos: [...(c.pagamentos || []), ...(pgDataArray || [])], status: todosPagos ? 'fechada' : 'aberta', hora_fechamento: todosPagos ? horaFechamento : c.hora_fechamento, bairro_id: bairroId || c.bairro_id, taxa_entrega: taxaEntrega > 0 ? taxaEntrega : c.taxa_entrega };
        }
        return c;
      }));
      setMostrarModalPagamento(false);
    }
  };

  const confirmarExclusaoEmMassa = async () => {
    if (comandas.filter(c => selecionadasExclusao.includes(c.id)).some(c => (c.pagamentos || []).length > 0)) return mostrarAlerta("Atenção", "Existem comandas com pagamentos na seleção.");
    mostrarConfirmacao("Excluir", `Remover ${selecionadasExclusao.length} registro(s)?`, async () => {
      await supabase.from('comandas').delete().in('id', selecionadasExclusao);
      setComandas(comandas.filter(c => !selecionadasExclusao.includes(c.id))); setModoExclusao(false); setSelecionadasExclusao([]); 
    });
  };

  const toggleSelecaoExclusao = (id) => setSelecionadasExclusao(selecionadasExclusao.includes(id) ? selecionadasExclusao.filter(item => item !== id) : [...selecionadasExclusao, id]);
  
  const reabrirComandaFechada = async (id) => {
    mostrarConfirmacao("Restaurar", "Retornar esta comanda para em andamento?", async () => {
      await supabase.from('comandas').update({ status: 'aberta', hora_fechamento: null }).eq('id', id);
      setComandas(comandas.map(c => c.id === id ? { ...c, status: 'aberta', hora_fechamento: null } : c));
    });
  };

  const excluirComandaFechada = async (id) => {
    mostrarConfirmacao("Excluir Permanente", "Esta ação não pode ser desfeita e afeta o faturamento. Continuar?", async () => {
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
  const pagamentosAgrupados = pagamentosFiltrados.reduce((acc, p) => { 
      let forma = p.forma;
      if (Array.isArray(forma)) forma = forma[0]?.forma || 'Outro';
      else if (typeof forma === 'string' && forma.startsWith('[')) { try { const parsed = JSON.parse(forma); forma = parsed[0]?.forma || 'Outro'; } catch(e) { forma = 'Outro'; } }
      if(!forma) forma = 'Outro';
      acc[forma] = (acc[forma] || 0) + p.valor; return acc; 
  }, {});
  
  const dadosPizza = Object.keys(pagamentosAgrupados).map(key => ({ name: key, value: pagamentosAgrupados[key] })).filter(d => d.value > 0);

  const contagemProdutos = {};
  comandasFiltradas.forEach(c => {
    (c.produtos || []).forEach(p => {
      const nomeOriginal = String(p?.nome || '');
      const isPeso = nomeOriginal.toLowerCase().includes('peso') || nomeOriginal.toLowerCase().includes('balança');
      let nomeDisplay = isPeso ? nomeOriginal.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim() : nomeOriginal;
      const nomeChave = nomeDisplay.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

      if (!contagemProdutos[nomeChave]) { contagemProdutos[nomeChave] = { nomeDisplay: nomeDisplay, faturamento: 0, custoTotal: 0, volume: 0, isPeso: isPeso }; }
      
      contagemProdutos[nomeChave].faturamento += (p.preco || 0);
      contagemProdutos[nomeChave].custoTotal += (p.custo || 0); 
      if (isPeso) { const matchGramas = nomeOriginal.match(/(\d+(?:\.\d+)?)\s*g/i); contagemProdutos[nomeChave].volume += matchGramas ? parseFloat(matchGramas[1]) : 0; } 
      else { contagemProdutos[nomeChave].volume += 1; }
    });
  });
  
  const rankingProdutos = Object.values(contagemProdutos).map(item => ({ nome: item.nomeDisplay, valor: item.faturamento, lucro: item.faturamento - item.custoTotal, volume: item.volume, isPeso: item.isPeso })).sort((a, b) => b.valor - a.valor);

  return (
    <>
      <div className="arox-boot-setup">
        <style dangerouslySetInnerHTML={{__html: `
          .arox-boot-setup {
            position: fixed; inset: 0; z-index: 9999999; pointer-events: none;
            background-color: #ffffff;
            animation: premiumFadeOut 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes premiumFadeOut { 
            0% { background-color: #ffffff; opacity: 1; }
            40% { background-color: #030406; opacity: 1; }
            100% { background-color: #030406; opacity: 0; visibility: hidden; }
          }
        `}} />
      </div>

      <div className={`fixed inset-0 z-0 transition-opacity duration-[1500ms] ease-out ${(appMode === 'shell' && !isTransitioningRef.current && !isPreComandaActiveGlobally) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <AroxCinematicScene scenePhase={scenePhase} customConfig={sceneCustomConfig} temaAnterior={temaNoturno ? 'dark' : 'light'} />
      </div>

      <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
        {(appMode === 'loading' || scenePhase === 'handoff' || scenePhase === 'bridgeDark' || scenePhase === 'bridgeLight') && !isFirstLoad.current && (
          <SystemLoader variant="full" phase={scenePhase} text={fraseCarregamento} exitStage={loaderExitStage} />
        )}

        {appMode === 'takeover' && (
          <div className="pointer-events-auto w-full h-full">
            <PreComanda 
              onFinalizarAbertura={onFinalizarAbertura} 
              isAntecipado={isAntecipado} 
              temaAnterior={temaNoturno ? 'dark' : 'light'} 
              onAcessarSistema={onAcessarSistema}
              temPendencia={temPendencia}
              onResolverPendencia={handleResolverPendencia}
              usuarioNome={sessao?.nome_usuario}
              onEnvUpdate={setSceneCustomConfig}
              caixaAberto={caixaAtual?.status === 'aberto'}
              isSistemaJaAcessado={preComandaDispensada.current}
            />
          </div>
        )}
      </div>

      {(!sessao && appMode === 'login') && (
        <div className={`fixed inset-0 z-20 pointer-events-auto overflow-y-auto transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isLoginFading ? 'opacity-0 scale-110 blur-xl pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
          <Login 
            getHoje={getHoje} 
            setSessao={(s) => {
              setIsLoginFading(true);
              setScenePhase('reveal');
              
              setTimeout(() => {
                setSessao(s);
                setAppMode('loading');
                setScenePhase('sync'); 
                setIsDataLoaded(false); 
                setMinLoadTimePassed(false);
                setLoaderExitStage('none'); 
                shellTransitionFired.current = false;
                setIsLoginFading(false);
              }, 800);
            }} 
            temaNoturno={temaNoturno} 
            setTemaNoturno={setTemaNoturno} 
            setScenePhase={setScenePhase} 
          />
        </div>
      )}

      {appMode === 'shell' && sessao && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeOutBridge { 0% { opacity: 1; } 100% { opacity: 0; visibility: hidden; } }
            .shell-enter-overlay { animation: fadeOutBridge 1.0s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            @keyframes shellEnterMain { 0% { opacity: 0; transform: scale(0.98); } 100% { opacity: 1; transform: scale(1); } }
            @keyframes shellEnterSide { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
            @keyframes shellEnterTop { 0% { opacity: 0; transform: translateY(-15px); } 100% { opacity: 1; transform: translateY(0); } }
            .shell-root-enter { animation: shellEnterMain 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
            .shell-root-enter aside { animation: shellEnterSide 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both; }
            .shell-root-enter header { animation: shellEnterTop 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both; }
            .shell-root-enter .shell-content-panel { animation: shellEnterTop 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s both; }
          `}} />

          {isShellEntering && (
            <div className={`fixed inset-0 z-[9999999] pointer-events-none shell-enter-overlay ${temaNoturno ? 'bg-[#09090b]' : 'bg-[#fafafa]'}`}></div>
          )}

          <main className={`relative z-20 flex h-screen w-full overflow-hidden transition-colors selection:bg-zinc-200 selection:text-zinc-900 
            ${isShellEntering ? 'shell-root-enter' : ''} 
            ${temaNoturno ? 'bg-[#09090b] text-zinc-100 selection:bg-white/20 selection:text-white' : 'bg-[#fafafa] text-zinc-900'}
          `}>
            
            <Sidebar
              menuMobileAberto={menuMobileAberto} setMenuMobileAberto={setMenuMobileAberto} temaNoturno={temaNoturno}
              setTemaNoturno={setTemaNoturno} logoEmpresa={logoEmpresa} sessao={sessao} nomeEmpresa={nomeEmpresa}
              abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} setMostrarConfigEmpresa={setMostrarConfigEmpresa}
              setMostrarAdminProdutos={setMostrarAdminProdutos} setMostrarConfigTags={setMostrarConfigTags}
              setMostrarAdminDelivery={setMostrarAdminDelivery} fazerLogout={fazerLogout}
              caixaAtual={caixaAtual} statusPresenca={statusPresenca}
            />

            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-transparent">
              <Header 
                comandaAtiva={comandaAtiva} setIdSelecionado={setIdSelecionado} setMenuMobileAberto={setMenuMobileAberto}
                temaNoturno={temaNoturno} caixaAtual={caixaAtual} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
                logoEmpresa={logoEmpresa} setTemaNoturno={setTemaNoturno} mostrarMenuPerfil={mostrarMenuPerfil}
                setMostrarMenuPerfil={setMostrarMenuPerfil} nomeEmpresa={nomeEmpresa} sessao={sessao}
                setMostrarAdminDelivery={setMostrarAdminDelivery} setMostrarConfigEmpresa={setMostrarConfigEmpresa} 
                setMostrarAdminUsuarios={setMostrarAdminUsuarios} setMostrarAdminProdutos={setMostrarAdminProdutos} 
                setMostrarConfigTags={setMostrarConfigTags} fazerLogout={fazerLogout}
                fetchData={fetchApenasAtualizacoes} clientesFidelidade={clientesFidelidade} vincularClienteFidelidade={vincularClienteFidelidade}
              />

              <div className="shell-content-panel flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 pt-2 md:pt-6 z-10 flex flex-col relative">
                <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col">
                  {comandaAtiva ? (
                    <PainelComanda temaNoturno={temaNoturno} comandaAtiva={comandaAtiva} abaDetalheMobile={abaDetalheMobile} setAbaDetalheMobile={setAbaDetalheMobile} filtroCategoriaCardapio={filtroCategoriaCardapio} setFiltroCategoriaCardapio={setFiltroCategoriaCardapio} menuCategorias={menuCategorias} adicionarProdutoNaComanda={adicionarProdutoNaComanda} excluirGrupoProdutos={excluirGrupoProdutos} setMostrarModalPeso={setMostrarModalPeso} tagsGlobais={tagsGlobais} toggleTag={toggleTag} editarProduto={editarProduto} excluirProduto={excluirProduto} setMostrarModalPagamento={setMostrarModalPagamento} encerrarMesa={encerrarMesa} setIdSelecionado={setIdSelecionado} alterarNomeComanda={alterarNomeComanda} adicionarClienteComanda={adicionarClienteComanda} alternarTipoComanda={alternarTipoComanda} modalAberto={mostrarModalPeso || mostrarModalPagamento} />
                  ) : abaAtiva === 'comandas' ? (
                    <TabComandas temaNoturno={temaNoturno} comandasAbertas={comandasAbertas} modoExclusao={modoExclusao} setModoExclusao={setModoExclusao} selecionadasExclusao={selecionadasExclusao} toggleSelecaoExclusao={toggleSelecaoExclusao} confirmarExclusaoEmMassa={confirmarExclusaoEmMassa} adicionarComanda={adicionarComanda} setIdSelecionado={setIdSelecionado} caixaAtual={caixaAtual} abrirCaixaManual={abrirCaixaManual} abaAtiva={abaAtiva} />
                  ) : abaAtiva === 'fechadas' ? (
                    <TabFechadas temaNoturno={temaNoturno} comandasFechadas={comandas.filter(c => c.status === 'fechada')} reabrirComandaFechada={reabrirComandaFechada} excluirComandaFechada={excluirComandaFechada} getHoje={getHoje} />
                  ) : abaAtiva === 'faturamento' ? (
                    <TabFaturamento temaNoturno={temaNoturno} filtroTempo={filtroTempo} setFiltroTempo={setFiltroTempo} getHoje={getHoje} getMesAtual={getMesAtual} getAnoAtual={getAnoAtual} faturamentoTotal={faturamentoTotal} lucroEstimado={lucroEstimado} dadosPizza={dadosPizza} rankingProdutos={rankingProdutos} comandasFiltradas={comandasFiltradas} comandas={comandas} caixaAtual={caixaAtual} />
                  ) : abaAtiva === 'caixa' ? (
                    <TabFechamentoCaixa temaNoturno={temaNoturno} sessao={sessao} caixaAtual={caixaAtual} comandas={comandas} fetchData={fetchApenasAtualizacoes} mostrarAlerta={mostrarAlerta} mostrarConfirmacao={mostrarConfirmacao} />
                  ) : abaAtiva === 'fidelidade' ? (
                    <TabFidelidade temaNoturno={temaNoturno} sessao={sessao} mostrarAlerta={mostrarAlerta} mostrarConfirmacao={mostrarConfirmacao} metaFidelidade={metaFidelidade} setMetaFidelidade={setMetaFidelidade} clientesFidelidade={clientesFidelidade} setClientesFidelidade={setClientesFidelidade} comandas={comandas} />
                  ) : null}
                </div>
              </div>
            </div>

            {mostrarAdminUsuarios && sessao && <AdminUsuarios empresaId={sessao.empresa_id} usuarioAtualId={sessao.id} temaNoturno={temaNoturno} onFechar={() => setMostrarAdminUsuarios(false)} />}
            {mostrarAdminProdutos && sessao && <AdminProdutos empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => { setMostrarAdminProdutos(false); fetchApenasAtualizacoes(); }} />}
            {mostrarAdminDelivery && sessao && <AdminDelivery empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => setMostrarAdminDelivery(false)} />}
            {mostrarModalPeso && <ModalPeso opcoesPeso={configPeso} temaNoturno={temaNoturno} onAdicionar={adicionarProdutoNaComanda} onCancelar={() => setMostrarModalPeso(false)} />}
            {mostrarModalPagamento && <ModalPagamento comanda={comandaAtiva} temaNoturno={temaNoturno} onConfirmar={processarPagamento} onCancelar={() => setMostrarModalPagamento(false)} clientesFidelidade={clientesFidelidade} metaFidelidade={metaFidelidade} />}
            {mostrarConfigEmpresa && ( <ModalConfigEmpresa temaNoturno={temaNoturno} sessao={sessao} tagsGlobais={tagsGlobais} setTagsGlobais={setTagsGlobais} nomeEmpresaEdicao={nomeEmpresaEdicao} setNomeEmpresaEdicao={setNomeEmpresaEdicao} logoEmpresaEdicao={logoEmpresaEdicao} setLogoEmpresaEdicao={setLogoEmpresaEdicao} nomeUsuarioEdicao={nomeUsuarioEdicao} setNomeUsuarioEdicao={setNomeUsuarioEdicao} planoUsuario={dadosPlano} salvarConfigEmpresa={salvarConfigEmpresa} setMostrarConfigEmpresa={setMostrarConfigEmpresa} alterarSenhaConta={alterarSenhaConta} deletarWorkspace={deletarWorkspace} /> )}
            {mostrarConfigTags && <ModalConfigTags temaNoturno={temaNoturno} tagsGlobais={tagsGlobais} setTagsGlobais={setTagsGlobais} sessao={sessao} setMostrarConfigTags={setMostrarConfigTags} />}

            {modalGlobal.visivel && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in">
                <div className={`rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col border text-center ${temaNoturno ? 'bg-[#09090b] border-white/10' : 'bg-white border-zinc-200'}`}>
                  <h2 className={`text-lg font-semibold tracking-tight mb-2 ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>{modalGlobal.titulo}</h2>
                  <p className={`text-sm mb-6 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>{modalGlobal.mensagem}</p>
                  {modalGlobal.tipo === 'prompt' && <input type="text" autoFocus className={`w-full p-3 rounded-lg border mb-6 outline-none font-medium text-sm transition-colors shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10 text-white focus:border-white/20' : 'bg-white border-zinc-200 focus:border-zinc-400'}`} value={modalGlobal.valorInput} onChange={e => setModalGlobal({...modalGlobal, valorInput: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { if (modalGlobal.acaoConfirmar) modalGlobal.acaoConfirmar(modalGlobal.valorInput); fecharModalGlobal(); } }} />}
                  <div className="flex gap-3">
                    {(modalGlobal.tipo === 'confirmacao' || modalGlobal.tipo === 'prompt') && <button onClick={fecharModalGlobal} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${temaNoturno ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>Cancelar</button>}
                    <button onClick={() => { if (modalGlobal.acaoConfirmar) { if (modalGlobal.tipo === 'prompt') modalGlobal.acaoConfirmar(modalGlobal.valorInput); else modalGlobal.acaoConfirmar(); } fecharModalGlobal(); }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md active:scale-[0.98] ${modalGlobal.titulo.toLowerCase().includes('excluir') || modalGlobal.titulo.toLowerCase().includes('atenção') ? 'bg-rose-600 hover:bg-rose-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}>
                      {modalGlobal.tipo === 'alerta' ? 'Entendido' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </>
  );
}