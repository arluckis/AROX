'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { useAroxCore } from '@/hooks/useAroxCore';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

import { 
  SkeletonTabComandas, SkeletonTabFechadas, SkeletonTabFaturamento, 
  SkeletonTabFechamentoCaixa, SkeletonTabFidelidade, SkeletonPainelComanda 
} from '@/components/ui/Skeletons';

import Login from '@/components/Login';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PreComanda from '@/components/PreComanda'; 
import SystemLoader from '@/components/SystemLoader';
import AroxCinematicScene from '@/components/scenes/AroxCinematicScene';

const TabComandas = dynamic(() => import('@/components/TabComandas'), { ssr: false, loading: () => <SkeletonTabComandas /> });
const TabFechadas = dynamic(() => import('@/components/TabFechadas'), { ssr: false, loading: () => <SkeletonTabFechadas /> });
const TabFaturamento = dynamic(() => import('@/components/TabFaturamento'), { ssr: false, loading: () => <SkeletonTabFaturamento /> });
const PainelComanda = dynamic(() => import('@/components/PainelComanda'), { ssr: false, loading: () => <SkeletonPainelComanda /> });
const TabFechamentoCaixa = dynamic(() => import('@/components/TabFechamentoCaixa'), { ssr: false, loading: () => <SkeletonTabFechamentoCaixa /> });
const TabFidelidade = dynamic(() => import('@/components/TabFidelidade'), { ssr: false, loading: () => <SkeletonTabFidelidade /> });

const ModalConfigEmpresa = dynamic(() => import('@/components/ModalConfigEmpresa'), { ssr: false });
const ModalPeso = dynamic(() => import('@/components/ModalPeso'), { ssr: false });
const ModalPagamento = dynamic(() => import('@/components/ModalPagamento'), { ssr: false });
const AdminProdutos = dynamic(() => import('@/components/AdminProdutos'), { ssr: false });
const AdminDelivery = dynamic(() => import('@/components/AdminDelivery'), { ssr: false });

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const VERSAO_ATUAL = '1.2.0'; 
    const versaoNoNavegador = localStorage.getItem('arox_versao_sistema');
    if (versaoNoNavegador !== VERSAO_ATUAL) {
      localStorage.setItem('arox_versao_sistema', VERSAO_ATUAL);
      if (typeof window !== 'undefined') window.location.href = window.location.pathname + '?v=' + new Date().getTime();
    }
  }, []);
  
  const frasesLoading = useMemo(() => ["Autenticando sessão segura", "Sincronizando ambiente", "Estabelecendo conexão"], []);
  const [fraseCarregamento, setFraseCarregamento] = useState(frasesLoading[0]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % frasesLoading.length; setFraseCarregamento(frasesLoading[i]); }, 5000); 
    return () => clearInterval(interval);
  }, [frasesLoading]);

  const [sessao, setSessao] = useState(null); 
  const [temaNoturno, setTemaNoturno] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
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

  // Criamos o estado local para blindar erros do prompt e confirmacao
  const [modalPromptInput, setModalPromptInput] = useState('');

  const fazerLogout = (silent = false) => {
    localStorage.removeItem('bessa_session'); localStorage.removeItem('arox_session_start'); setSessao(null); 
    preComandaDispensada.current = false; isTransitioningRef.current = false; setIsSceneActive(true); 
    setAppMode('loading'); setScenePhase('ignition'); setIsDataLoaded(false); setMinLoadTimePassed(false);
    shellTransitionFired.current = false; setLoaderExitStage('none'); isFirstLoad.current = true; 
    if (silent) window.location.reload();
  };

  const isSessionExpired = () => {
    const sessionStart = localStorage.getItem('arox_session_start'); if (!sessionStart) return false; 
    const now = new Date(); const sessionDate = new Date(sessionStart);
    const limit = new Date(now); limit.setHours(5, 0, 0, 0);
    if (now >= limit && sessionDate < limit) return true;
    const limitYesterday = new Date(limit); limitYesterday.setDate(limitYesterday.getDate() - 1);
    if (now < limit && sessionDate < limitYesterday) return true;
    return false;
  };

  const core = useAroxCore({ sessao, setSessao, router, fazerLogout, setIsDataLoaded, setTemPendencia, setIsAntecipado });

  // A função fallback para mostrar os alertas com segurança se o core não tiver exportado a var
  const fecharModalGlobalSeguro = () => {
     if (core.fecharModalGlobal) core.fecharModalGlobal();
     setModalPromptInput('');
  };

  useEffect(() => {
    if (appMode !== 'loading') return;
    if (isFirstLoad.current) {
      const t1 = setTimeout(() => setScenePhase('reveal'), 300);
      const t2 = setTimeout(() => setScenePhase('sync'), 800);
      const t3 = setTimeout(() => setMinLoadTimePassed(true), 2500); 
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setScenePhase('handoff'); setLoaderExitStage('none');
      const t1 = setTimeout(() => setMinLoadTimePassed(true), 1000); 
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
    return () => { window.removeEventListener('arox-precomanda-mounted', handleMount); window.removeEventListener('arox-precomanda-unmounted', handleUnmount); window.removeEventListener('arox-env-update', handleEnvUpdate); };
  }, []);

  useEffect(() => {
    if (appMode === 'takeover' && !isSceneActive) {
      setIsSceneActive(true); setScenePhase('handoff'); setSceneCustomConfig(null); 
      setLoaderExitStage('none'); isTransitioningRef.current = false;
    }
  }, [appMode, isSceneActive]);

  useEffect(() => {
    if (isDataLoaded && minLoadTimePassed && appMode === 'loading' && !shellTransitionFired.current) {
       shellTransitionFired.current = true;
       const shouldBypassPreComanda = preComandaDispensada.current || core.caixaAtual?.status === 'aberto';
       if (shouldBypassPreComanda) { transitionToShell(false); } 
       else {
          setLoaderExitStage('content'); setTimeout(() => setLoaderExitStage('card'), 250); setTimeout(() => setLoaderExitStage('arox'), 500);
          setTimeout(() => { setScenePhase('handoff'); setAppMode('takeover'); }, 700);
       }
    }
  }, [isDataLoaded, minLoadTimePassed, appMode, core.caixaAtual]);

  useEffect(() => {
    if (appMode === 'takeover' || appMode === 'shell') return; 
    const temaSalvo = localStorage.getItem('arox_tema_noturno'); if (temaSalvo !== null) setTemaNoturno(JSON.parse(temaSalvo));
    const logoSalva = localStorage.getItem('arox_logo_empresa'); if (logoSalva) core.setLogoEmpresa(logoSalva);
    const sessionData = localStorage.getItem('bessa_session');
    
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.role === 'super_admin') { router.push('/admin'); return; }
        if (isSessionExpired()) { fazerLogout(true); return; }
        if (parsed.empresa_id) {
          if (!sessao) {
            isFirstLoad.current = false; setSessao(parsed);
            if (!localStorage.getItem('arox_session_start')) localStorage.setItem('arox_session_start', new Date().toISOString());
          }
        } else { localStorage.removeItem('bessa_session'); triggerLoginTransition(); }
      } catch(e) { localStorage.removeItem('bessa_session'); triggerLoginTransition(); }
    } else { triggerLoginTransition(); }

    function triggerLoginTransition() {
      if (appMode === 'loading' && !isTransitioningRef.current) {
         if (isFirstLoad.current) {
            isTransitioningRef.current = true; setAppMode('login'); setScenePhase('ignition'); isFirstLoad.current = false; isTransitioningRef.current = false;
         } else if (minLoadTimePassed) {
            isTransitioningRef.current = true; setLoaderExitStage('content'); setTimeout(() => setLoaderExitStage('card'), 200); setTimeout(() => setLoaderExitStage('arox'), 400);
            setTimeout(() => { setAppMode('login'); setScenePhase('ignition'); isFirstLoad.current = false; isTransitioningRef.current = false; }, 600);
         }
      }
    }
  }, [appMode, minLoadTimePassed, router, sessao]);

  useEffect(() => {
    if (appMode === 'takeover' || !sessao) return; 
    localStorage.setItem('arox_tema_noturno', JSON.stringify(temaNoturno));
    document.body.style.backgroundColor = temaNoturno ? '#09090b' : '#fafafa'; 
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) { metaThemeColor = document.createElement('meta'); metaThemeColor.name = 'theme-color'; document.head.appendChild(metaThemeColor); }
    metaThemeColor.setAttribute('content', temaNoturno ? '#09090b' : '#ffffff');
  }, [temaNoturno, appMode, sessao]);

  const transitionToShell = (fromPreComanda = false) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    if (fromPreComanda) {
      setAppMode('shell'); setIsShellEntering(true);
      setTimeout(() => setIsShellEntering(false), 800); setTimeout(() => { setIsSceneActive(false); isTransitioningRef.current = false; }, 1200);
    } else {
      setLoaderExitStage('content'); setTimeout(() => setLoaderExitStage('card'), 150); setTimeout(() => setLoaderExitStage('arox'), 350);
      setTimeout(() => {
        setScenePhase(temaNoturno ? 'bridgeDark' : 'bridgeLight');
        setTimeout(() => {
          setAppMode('shell'); setIsShellEntering(true);
          setTimeout(() => setIsShellEntering(false), 800); setTimeout(() => { setIsSceneActive(false); isTransitioningRef.current = false; }, 1200);
        }, 700);
      }, 500);
    }
  };

  const onFinalizarAbertura = (valor) => { transitionToShell(true); core.abrirCaixaManual({ data_abertura: core.getHoje(), saldo_inicial: valor }); };
  const onAcessarSistema = (forcarFaturamento = true) => { preComandaDispensada.current = true; if (forcarFaturamento) { core.setAbaAtiva('faturamento'); } transitionToShell(true); };
  const handleResolverPendencia = () => { preComandaDispensada.current = true; core.setAbaAtiva('caixa'); transitionToShell(true); };

  return (
    <>
      <div className={`fixed inset-0 z-0 transition-opacity duration-[1500ms] ease-out ${(appMode === 'shell' && !isTransitioningRef.current && !isPreComandaActiveGlobally) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <AroxCinematicScene scenePhase={scenePhase} customConfig={sceneCustomConfig} temaAnterior={temaNoturno ? 'dark' : 'light'} />
      </div>

      <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
        {(appMode === 'loading' || scenePhase === 'handoff' || scenePhase === 'bridgeDark' || scenePhase === 'bridgeLight') && !isFirstLoad.current && (
          <SystemLoader variant="full" phase={scenePhase} text={fraseCarregamento} exitStage={loaderExitStage} />
        )}
        {appMode === 'takeover' && (
          <div className="pointer-events-auto w-full h-full">
            <PreComanda onFinalizarAbertura={onFinalizarAbertura} isAntecipado={isAntecipado} temaAnterior={temaNoturno ? 'dark' : 'light'} onAcessarSistema={onAcessarSistema} temPendencia={temPendencia} onResolverPendencia={handleResolverPendencia} usuarioNome={sessao?.nome_usuario} onEnvUpdate={setSceneCustomConfig} caixaAberto={core.caixaAtual?.status === 'aberto'} isSistemaJaAcessado={preComandaDispensada.current} />
          </div>
        )}
      </div>

      {(!sessao && appMode === 'login') && (
        <div className={`fixed inset-0 z-20 pointer-events-auto overflow-y-auto transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isLoginFading ? 'opacity-0 scale-110 blur-xl pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
          <Login getHoje={core.getHoje} setSessao={(s) => { setIsLoginFading(true); setScenePhase('reveal'); setTimeout(() => { setSessao(s); setAppMode('loading'); setScenePhase('sync'); setIsDataLoaded(false); setMinLoadTimePassed(false); setLoaderExitStage('none'); shellTransitionFired.current = false; setIsLoginFading(false); }, 800); }} temaNoturno={temaNoturno} setTemaNoturno={setTemaNoturno} setScenePhase={setScenePhase} />
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

          {isShellEntering && <div className={`fixed inset-0 z-[9999999] pointer-events-none shell-enter-overlay ${temaNoturno ? 'bg-[#09090b]' : 'bg-[#fafafa]'}`}></div>}

          <main className={`relative z-20 flex h-screen w-full overflow-hidden transition-colors selection:bg-zinc-200 selection:text-zinc-900 ${isShellEntering ? 'shell-root-enter' : ''} ${temaNoturno ? 'bg-[#09090b] text-zinc-100 selection:bg-white/20 selection:text-white' : 'bg-[#fafafa] text-zinc-900'}`}>
            
            <Sidebar
              menuMobileAberto={menuMobileAberto} setMenuMobileAberto={setMenuMobileAberto} temaNoturno={temaNoturno}
              setTemaNoturno={setTemaNoturno} logoEmpresa={core.logoEmpresa} sessao={sessao} nomeEmpresa={core.nomeEmpresa}
              abaAtiva={core.abaAtiva} setAbaAtiva={core.setAbaAtiva} setMostrarConfigEmpresa={core.setMostrarConfigEmpresa}
              fazerLogout={fazerLogout} caixaAtual={core.caixaAtual} statusPresenca={core.statusPresenca}
            />

            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-transparent">
              <Header 
                comandaAtiva={core.comandaAtiva} setIdSelecionado={core.setIdSelecionado} setMenuMobileAberto={setMenuMobileAberto}
                temaNoturno={temaNoturno} caixaAtual={core.caixaAtual} abaAtiva={core.abaAtiva} setAbaAtiva={core.setAbaAtiva}
                logoEmpresa={core.logoEmpresa} setTemaNoturno={setTemaNoturno} mostrarMenuPerfil={core.mostrarMenuPerfil}
                setMostrarMenuPerfil={core.setMostrarMenuPerfil} nomeEmpresa={core.nomeEmpresa} sessao={sessao}
                setMostrarAdminDelivery={core.setMostrarAdminDelivery} setMostrarConfigEmpresa={core.setMostrarConfigEmpresa} 
                setMostrarAdminProdutos={core.setMostrarAdminProdutos} fazerLogout={fazerLogout}
                fetchData={core.fetchApenasAtualizacoes} clientesFidelidade={core.clientesFidelidade} vincularClienteFidelidade={core.vincularClienteFidelidade}
              />

              <div className="shell-content-panel flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 pt-2 md:pt-6 z-10 flex flex-col relative">
                <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col">
                  <ErrorBoundary codigoErro="ERR-CORE-SYS-101" modulo="Painel de Navegação Central" temaNoturno={temaNoturno} fallbackClassName="w-full h-full flex-1 min-h-[50vh]">
                    {core.comandaAtiva ? (
                      <PainelComanda temaNoturno={temaNoturno} comandaAtiva={core.comandaAtiva} abaDetalheMobile={core.abaDetalheMobile} setAbaDetalheMobile={core.setAbaDetalheMobile} filtroCategoriaCardapio={core.filtroCategoriaCardapio} setFiltroCategoriaCardapio={core.setFiltroCategoriaCardapio} menuCategorias={core.menuCategorias} adicionarProdutoNaComanda={core.adicionarProdutoNaComanda} excluirGrupoProdutos={core.excluirGrupoProdutos} setMostrarModalPeso={core.setMostrarModalPeso} toggleTag={core.toggleTag} editarProduto={core.editarProduto} excluirProduto={core.excluirProduto} setMostrarModalPagamento={core.setMostrarModalPagamento} encerrarMesa={core.encerrarMesa} setIdSelecionado={core.setIdSelecionado} alterarNomeComanda={core.alterarNomeComanda} adicionarClienteComanda={core.adicionarClienteComanda} alternarTipoComanda={core.alternarTipoComanda} modalAberto={core.mostrarModalPeso || core.mostrarModalPagamento} />
                    ) : core.abaAtiva === 'comandas' ? (
                      <TabComandas temaNoturno={temaNoturno} comandasAbertas={core.comandasAbertas} modoExclusao={core.modoExclusao} setModoExclusao={core.setModoExclusao} selecionadasExclusao={core.selecionadasExclusao} toggleSelecaoExclusao={core.toggleSelecaoExclusao} confirmarExclusaoEmMassa={core.confirmarExclusaoEmMassa} adicionarComanda={core.adicionarComanda} setIdSelecionado={core.setIdSelecionado} caixaAtual={core.caixaAtual} abrirCaixaManual={core.abrirCaixaManual} abaAtiva={core.abaAtiva} />
                    ) : core.abaAtiva === 'fechadas' ? (
                      <TabFechadas temaNoturno={temaNoturno} comandasFechadas={core.comandas.filter(c => c.status === 'fechada')} reabrirComandaFechada={core.reabrirComandaFechada} excluirComandaFechada={core.excluirComandaFechada} getHoje={core.getHoje} />
                    ) : core.abaAtiva === 'faturamento' ? (
                      <TabFaturamento temaNoturno={temaNoturno} filtroTempo={core.filtroTempo} setFiltroTempo={core.setFiltroTempo} getHoje={core.getHoje} getMesAtual={core.getMesAtual} getAnoAtual={core.getAnoAtual} faturamentoTotal={core.faturamentoTotal} lucroEstimado={core.lucroEstimado} dadosPizza={core.dadosPizza} rankingProdutos={core.rankingProdutos} comandasFiltradas={core.comandasFiltradas} comandas={core.comandas} caixaAtual={core.caixaAtual} />
                    ) : core.abaAtiva === 'caixa' ? (
                      <TabFechamentoCaixa temaNoturno={temaNoturno} sessao={sessao} caixaAtual={core.caixaAtual} comandas={core.comandas} fetchData={core.fetchApenasAtualizacoes} />
                    ) : core.abaAtiva === 'fidelidade' ? (
                      <TabFidelidade temaNoturno={temaNoturno} sessao={sessao} metaFidelidade={core.metaFidelidade} setMetaFidelidade={core.setMetaFidelidade} clientesFidelidade={core.clientesFidelidade} setClientesFidelidade={core.setClientesFidelidade} comandas={core.comandas} />
                    ) : null}
                  </ErrorBoundary>
                </div>
              </div>
            </div>

            {/* MODAIS (Agora Carregados Dinamicamente sob demanda) */}
            {core.mostrarAdminProdutos && sessao && <AdminProdutos empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => { core.setMostrarAdminProdutos(false); core.fetchApenasAtualizacoes(); }} />}
            {core.mostrarAdminDelivery && sessao && <AdminDelivery empresaId={sessao.empresa_id} temaNoturno={temaNoturno} onFechar={() => core.setMostrarAdminDelivery(false)} />}
            {core.mostrarModalPeso && <ModalPeso opcoesPeso={core.configPeso} temaNoturno={temaNoturno} onAdicionar={core.adicionarProdutoNaComanda} onCancelar={() => core.setMostrarModalPeso(false)} />}
            {core.mostrarModalPagamento && <ModalPagamento comanda={core.comandaAtiva} temaNoturno={temaNoturno} onConfirmar={core.processarPagamento} onCancelar={() => core.setMostrarModalPagamento(false)} clientesFidelidade={core.clientesFidelidade} metaFidelidade={core.metaFidelidade} />}
            {core.mostrarConfigEmpresa && ( <ModalConfigEmpresa temaNoturno={temaNoturno} sessao={sessao} nomeEmpresaEdicao={core.nomeEmpresaEdicao} setNomeEmpresaEdicao={core.setNomeEmpresaEdicao} logoEmpresaEdicao={core.logoEmpresaEdicao} setLogoEmpresaEdicao={core.setLogoEmpresaEdicao} nomeUsuarioEdicao={core.nomeUsuarioEdicao} setNomeUsuarioEdicao={core.setNomeUsuarioEdicao} planoUsuario={core.dadosPlano} salvarConfigEmpresa={core.salvarConfigEmpresa} setMostrarConfigEmpresa={core.setMostrarConfigEmpresa} alterarSenhaConta={core.alterarSenhaConta} /> )}

            {core.modalGlobal?.visivel && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in">
                <div className={`rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col border text-center ${temaNoturno ? 'bg-[#09090b] border-white/10' : 'bg-white border-zinc-200'}`}>
                  <h2 className={`text-lg font-semibold tracking-tight mb-2 ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>{core.modalGlobal.titulo}</h2>
                  <p className={`text-sm mb-6 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>{core.modalGlobal.mensagem}</p>
                  
                  {core.modalGlobal.tipo === 'prompt' && (
                    <input 
                      type="text" 
                      autoFocus 
                      className={`w-full p-3 rounded-lg border mb-6 outline-none font-medium text-sm transition-colors shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10 text-white focus:border-white/20' : 'bg-white border-zinc-200 focus:border-zinc-400 text-zinc-900'}`} 
                      value={modalPromptInput} 
                      onChange={e => setModalPromptInput(e.target.value)} 
                      onKeyDown={e => { 
                        if (e.key === 'Enter') { 
                          if (core.modalGlobal.acaoConfirmar) core.modalGlobal.acaoConfirmar(modalPromptInput); 
                          fecharModalGlobalSeguro(); 
                        } 
                      }} 
                    />
                  )}
                  
                  <div className="flex gap-3">
                    {(core.modalGlobal.tipo === 'confirmacao' || core.modalGlobal.tipo === 'prompt') && (
                      <button onClick={fecharModalGlobalSeguro} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${temaNoturno ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>Cancelar</button>
                    )}
                    
                    <button onClick={() => { 
                        if (core.modalGlobal.acaoConfirmar) { 
                          if (core.modalGlobal.tipo === 'prompt') core.modalGlobal.acaoConfirmar(modalPromptInput); 
                          else core.modalGlobal.acaoConfirmar(); 
                        } 
                        fecharModalGlobalSeguro(); 
                      }} 
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md active:scale-[0.98] ${core.modalGlobal.titulo.toLowerCase().includes('excluir') || core.modalGlobal.titulo.toLowerCase().includes('atenção') ? 'bg-rose-600 hover:bg-rose-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}>
                      {core.modalGlobal.tipo === 'alerta' ? 'Entendido' : 'Confirmar'}
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