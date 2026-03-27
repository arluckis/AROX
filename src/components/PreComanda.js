'use client';
import { useState, useEffect } from 'react';

export default function PreComanda({ 
  onFinalizarAbertura,
  isAntecipado = false,
  temaAnterior = 'dark',
  onAcessarSistema,
  temPendencia = false,
  onResolverPendencia,
  usuarioNome = 'Usuário',
  isFreshLogin = false,
  caixaAberto = false,
  onEnvUpdate 
}) {
  const estadoInicial = isFreshLogin ? 'boas-vindas' : (temPendencia ? 'pendencia' : (isAntecipado ? 'antecipado' : 'inicio'));

  const [etapa, setEtapa] = useState(estadoInicial);
  const [valorCaixa, setValorCaixa] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const [exitStage, setExitStage] = useState('none'); // 'none', 'content', 'card', 'arox'

  const exitState = temaAnterior === 'light'
    ? { light: 80.0, rotation: 25, planetY: -20, scale: 1.30, blur: 0, overlay: 0 }
    : { light: 0.0, rotation: -10, planetY: 50, scale: 0.80, blur: 20, overlay: 1 };

  // Overlay e Blur travados no 0. Luz assumindo o controle total.
  const envStates = {
    'boas-vindas': { light: 1.0, rotation: 0,  planetY: 10, scale: 0.98, blur: 0, overlay: 0 },
    pendencia:     { light: 1.5, rotation: -2, planetY: 15, scale: 0.98, blur: 0, overlay: 0 },
    antecipado:    { light: 1.5, rotation: 0,  planetY: 10, scale: 0.99, blur: 0, overlay: 0 },
    inicio:        { light: 2.0, rotation: 2,  planetY: 0,  scale: 1.00, blur: 0, overlay: 0 },
    data:          { light: 3.5, rotation: 5,  planetY: -5, scale: 1.01, blur: 0, overlay: 0 },
    valor:         { light: 5.0, rotation: 8,  planetY: -10, scale: 1.02, blur: 0, overlay: 0 },
    pronto:        { light: 8.0, rotation: 12, planetY: -15, scale: 1.05, blur: 0, overlay: 0 },
    exit:          exitState 
  };

  useEffect(() => {
    if (onEnvUpdate && envStates[etapa]) {
      onEnvUpdate(envStates[etapa]);
    }
  }, [etapa, onEnvUpdate, temaAnterior]);

  useEffect(() => {
    setIsClient(true);
    document.body.style.overflow = 'hidden'; 
    const timer = setTimeout(() => setIsMounting(false), 50);
    return () => { document.body.style.overflow = ''; clearTimeout(timer); };
  }, []);

  const dataHoje = isClient ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const goToStep = (novaEtapa) => {
    if(exitStage !== 'none' || etapa === 'pronto') return;
    setEtapa(novaEtapa);
  };

  // Arquitetura Cinematográfica de Saída Escalonada
  const handleSequenceFinal = (callback) => {
    if(exitStage !== 'none') return;
    setEtapa('pronto'); 
    
    setTimeout(() => {
      setExitStage('content'); 
      setTimeout(() => {
        setExitStage('card'); 
        setTimeout(() => {
          setExitStage('arox'); 
          setTimeout(() => {
            setEtapa('exit'); 
            callback(); // Aciona a explosão da Home
          }, 400); 
        }, 800); 
      }, 400); 
    }, 1200); 
  };

  if (!isClient) return null;

  // Matemática da Progress Bar
  const stepIndex = ['boas-vindas', 'pendencia', 'antecipado', 'inicio'].includes(etapa) ? 1 : (etapa === 'data' ? 2 : (etapa === 'valor' ? 3 : (etapa === 'pronto' ? 4 : 0)));

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex items-center justify-center z-[50]">
      
      <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center px-6 perspective-[1200px] transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isMounting ? 'opacity-0 translate-y-8 scale-95 blur-sm' : 'opacity-100 translate-y-0 scale-100 blur-0'}`}>
        
        <div className={`cockpit-wrapper w-full max-w-[440px] flex flex-col min-h-[440px] transition-all duration-[800ms] ease-out p-10 ${
            exitStage === 'card' || exitStage === 'arox' 
            ? 'bg-transparent border-white/0 shadow-none backdrop-blur-none scale-[1.05] pointer-events-none' 
            : 'bg-[#05060A]/70 backdrop-blur-[40px] border border-white/[0.05] rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)]'
        }`}>
          
          <div className={`flex flex-col items-center mb-10 shrink-0 transition-all duration-[800ms] ease-out ${exitStage === 'arox' ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
             <span className="text-[14px] font-bold tracking-[0.5em] text-white uppercase mb-1 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
               AROX
             </span>
             {/* Progress Bar Premium */}
             <div className={`mt-3 flex gap-[6px] transition-opacity duration-500 ${exitStage !== 'none' || etapa === 'pronto' ? 'opacity-0' : 'opacity-100'}`}>
               {[1, 2, 3].map(i => (
                 <div key={i} className={`h-[2px] rounded-full transition-all duration-700 ease-in-out ${stepIndex >= i ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'w-2 bg-white/20'}`} />
               ))}
             </div>
          </div>

          <div className={`relative flex-1 flex flex-col w-full overflow-hidden transition-all duration-500 ${exitStage !== 'none' ? 'opacity-0 scale-95 blur-md pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
            
            {etapa === 'boas-vindas' && (
              <div key="boas-vindas" className="flex flex-col h-full step-transition items-center justify-center">
                <div className="text-center shrink-0 w-full mt-4">
                  <h1 className="text-[24px] font-medium tracking-tight text-white mb-3">Bem-vindo, {usuarioNome}</h1>
                  <p className="text-[15px] text-zinc-400 font-light">Tudo pronto para começar.</p>
                </div>
                <div className="mt-auto pt-8 w-full shrink-0 flex flex-col gap-3">
                  <button onClick={() => {
                    if (temPendencia) goToStep('pendencia');
                    else if (caixaAberto) handleSequenceFinal(() => onAcessarSistema());
                    else goToStep(isAntecipado ? 'antecipado' : 'inicio');
                  }} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {etapa === 'pendencia' && (
              <div key="pendencia" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Conciliação Pendente</h1>
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-light">Existem registros financeiros não processados no turno anterior que requerem sua atenção.</p>
                </div>
                <div className="mt-auto pt-8 shrink-0">
                  <button onClick={() => handleSequenceFinal(() => onResolverPendencia && onResolverPendencia())} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Resolver Pendências
                  </button>
                </div>
              </div>
            )}

            {etapa === 'antecipado' && (
              <div key="antecipado" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Acesso Administrativo</h1>
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-light">O estabelecimento ainda não está no horário habitual de abertura. Deseja abrir antecipadamente ou apenas acessar o sistema?</p>
                </div>
                <div className="mt-auto pt-8 shrink-0 flex flex-col gap-3">
                  <button onClick={() => goToStep('data')} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Abrir Antecipadamente
                  </button>
                  <button onClick={() => handleSequenceFinal(() => onAcessarSistema ? onAcessarSistema() : onFinalizarAbertura(0))} className="w-full py-3.5 bg-transparent border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] text-[13px] font-medium tracking-wide rounded-xl transition-all active:scale-[0.98]">
                    Apenas Acessar
                  </button>
                </div>
              </div>
            )}

            {etapa === 'inicio' && (
              <div key="inicio" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Abertura de Caixa</h1>
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-light">O ambiente de controle está sincronizado e os módulos estão prontos para inicialização.</p>
                </div>
                <div className="mt-auto pt-8 shrink-0 flex flex-col gap-3">
                  <button onClick={() => goToStep('data')} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Configurar Abertura
                  </button>
                  <button onClick={() => handleSequenceFinal(() => onAcessarSistema())} className="w-full py-3.5 bg-transparent border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] text-[13px] font-medium tracking-wide rounded-xl transition-all active:scale-[0.98]">
                    Agora não
                  </button>
                </div>
              </div>
            )}

            {etapa === 'data' && (
              <div key="data" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Data Operacional</h1>
                  <p className="text-[14px] text-zinc-400 font-light">Confirme a data base que será registrada para os movimentos desta sessão.</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[18px] font-medium text-zinc-200 capitalize tracking-wide">{dataHoje}</p>
                </div>
                <div className="mt-auto pt-4 shrink-0 flex gap-3">
                  <button onClick={() => goToStep(temPendencia ? 'pendencia' : (isAntecipado ? 'antecipado' : 'inicio'))} className="px-6 py-4 bg-transparent text-zinc-500 hover:text-zinc-300 text-[13px] font-medium rounded-xl transition-colors">
                    Voltar
                  </button>
                  <button onClick={() => goToStep('valor')} className="flex-1 py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 active:scale-[0.98]">
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {etapa === 'valor' && (
              <div key="valor" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Fundo de Troco</h1>
                  <p className="text-[14px] text-zinc-400 font-light">Insira o saldo em espécie atualmente disponível na gaveta da operação.</p>
                </div>
                <div className="flex-1 flex items-center justify-center py-6">
                  <div className="w-full flex items-center justify-center relative">
                    <span className="text-xl font-light text-zinc-600 mr-2 pointer-events-none">R$</span>
                    <input type="number" placeholder="0,00" value={valorCaixa} onChange={(e) => setValorCaixa(e.target.value)} className="w-full bg-transparent text-[40px] tabular-nums font-light text-zinc-100 tracking-tight focus:outline-none placeholder:text-zinc-800 border-b border-zinc-800 focus:border-zinc-400 transition-colors pb-2 text-center" autoFocus />
                  </div>
                </div>
                <div className="mt-auto pt-4 shrink-0 flex gap-3">
                  <button onClick={() => goToStep('data')} className="px-6 py-4 bg-transparent text-zinc-500 hover:text-zinc-300 text-[13px] font-medium rounded-xl transition-colors">
                    Voltar
                  </button>
                  <button onClick={() => handleSequenceFinal(() => onFinalizarAbertura(valorCaixa ? parseFloat(valorCaixa) : 0))} className="flex-1 py-4 bg-emerald-500 text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98]">
                    Abrir Caixa
                  </button>
                </div>
              </div>
            )}

            {etapa === 'pronto' && (
              <div key="pronto" className="flex flex-col h-full step-transition items-center justify-center">
                <div className="text-center shrink-0 animate-pulse-slow">
                  <h1 className="text-[26px] font-medium tracking-tight text-white mb-2">Tudo pronto.</h1>
                  <p className="text-[16px] text-zinc-400 font-light">Sessão iniciada, {usuarioNome}.</p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}