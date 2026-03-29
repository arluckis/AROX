'use client';
import { useState, useEffect, useRef } from 'react';

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
  isSistemaJaAcessado = false,
  onEnvUpdate 
}) {
  const estadoInicial = (isFreshLogin || caixaAberto) ? 'boas-vindas' : (isSistemaJaAcessado ? 'inicio' : (isAntecipado ? 'antecipado' : 'inicio'));

  const [etapa, setEtapa] = useState(estadoInicial);
  const [valorCaixa, setValorCaixa] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const [exitStage, setExitStage] = useState('none'); 
  const isProcessingRef = useRef(false);
  const [saudacaoText, setSaudacaoText] = useState('Bem-vindo');

  // Removido o brilho do Dark Mode. Mantendo escuridão total no Dark e luz no Light.
  const exitState = temaAnterior === 'light'
    ? { light: 600.0, rotation: 12, planetY: 0, scale: 1.02, blur: 15, overlay: 1 }
    : { light: 0.0, rotation: 12, planetY: 0, scale: 1.00, blur: 20, overlay: 1 };

  const envStates = {
    'boas-vindas': { light: 1.0, rotation: 0,  planetY: 0, scale: 0.98, blur: 0, overlay: 0 },
    antecipado:    { light: 1.5, rotation: 0,  planetY: 0, scale: 0.99, blur: 0, overlay: 0 },
    inicio:        { light: 2.0, rotation: 2,  planetY: 0,  scale: 1.00, blur: 0, overlay: 0 },
    data:          { light: 3.5, rotation: 5,  planetY: 0, scale: 1.01, blur: 0, overlay: 0 },
    valor:         { light: 5.0, rotation: 8,  planetY: 0, scale: 1.02, blur: 0, overlay: 0 },
    pronto:        { light: 8.0, rotation: 12, planetY: 0, scale: 1.05, blur: 0, overlay: 0 },
    exit:          exitState 
  };

  useEffect(() => {
    setIsClient(true);
    document.body.style.overflow = 'hidden'; 

    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) setSaudacaoText('Bom dia');
    else if (hora >= 12 && hora < 18) setSaudacaoText('Boa tarde');
    else setSaudacaoText('Boa noite');

    window.dispatchEvent(new CustomEvent('arox-precomanda-mounted'));

    const timer = setTimeout(() => setIsMounting(false), 50);
    return () => { 
      document.body.style.overflow = ''; 
      clearTimeout(timer); 
      window.dispatchEvent(new CustomEvent('arox-precomanda-unmounted'));
    };
  }, []);

  useEffect(() => {
    const cenaConfig = envStates[etapa];
    if (cenaConfig) {
      if (typeof onEnvUpdate === 'function') {
        onEnvUpdate(cenaConfig);
      }
      
      window.dispatchEvent(new CustomEvent('arox-env-update', { detail: cenaConfig }));
      
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('arox-env-update', { detail: cenaConfig }));
      }, 50);
      
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, onEnvUpdate, temaAnterior]);

  useEffect(() => {
    if (etapa === 'exit' || exitStage !== 'none' || etapa === 'pronto' || isProcessingRef.current) {
      return; 
    }

    const estadoCorreto = (isFreshLogin || caixaAberto) ? 'boas-vindas' : (isSistemaJaAcessado ? 'inicio' : (isAntecipado ? 'antecipado' : 'inicio'));
    
    if (etapa !== estadoCorreto && ['boas-vindas', 'inicio', 'antecipado'].includes(etapa)) {
      setEtapa(estadoCorreto);
      const cenaCorreta = envStates[estadoCorreto];
      if (typeof onEnvUpdate === 'function') onEnvUpdate(cenaCorreta);
      window.dispatchEvent(new CustomEvent('arox-env-update', { detail: cenaCorreta }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSistemaJaAcessado, isFreshLogin, isAntecipado, caixaAberto]);

  const dataHoje = isClient ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const goToStep = (novaEtapa) => {
    if(exitStage !== 'none' || etapa === 'pronto' || etapa === 'exit' || isProcessingRef.current) return;
    setEtapa(novaEtapa);
  };

  const handleSequenceFinal = (callback) => {
    if(isProcessingRef.current || exitStage !== 'none' || etapa === 'exit') return;
    isProcessingRef.current = true; 
    setEtapa('pronto'); 
    
    setTimeout(() => {
      setExitStage('content'); 
      setTimeout(() => {
        setExitStage('card'); 
        setTimeout(() => {
          setExitStage('arox'); 
          setTimeout(() => {
            setEtapa('exit'); 
            
            setTimeout(() => {
              callback(); 
            }, 1300);
          }, 250); 
        }, 300); 
      }, 150); 
    }, 300); 
  };

  if (!isClient) return null;

  const stepIndex = ['boas-vindas', 'antecipado', 'inicio'].includes(etapa) ? 1 : (etapa === 'data' ? 2 : (etapa === 'valor' ? 3 : (etapa === 'pronto' ? 4 : 0)));

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center z-[50] ${isProcessingRef.current ? 'pointer-events-none' : ''}`}>
      <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center px-6 perspective-[1200px] transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isMounting ? 'opacity-0 translate-y-8 scale-95 blur-sm' : 'opacity-100 translate-y-0 scale-100 blur-0'}`}>
        
        <div className={`cockpit-wrapper w-full max-w-[440px] flex flex-col min-h-[440px] transition-all duration-[400ms] ease-out p-10 ${
            exitStage === 'card' || exitStage === 'arox' 
            ? 'bg-transparent border-white/0 shadow-none backdrop-blur-none scale-[1.05] pointer-events-none' 
            : 'bg-[#05060A]/70 backdrop-blur-[40px] border border-white/[0.05] rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)]'
        }`}>
          
          <div className={`flex flex-col items-center mb-10 shrink-0 transition-all duration-[300ms] ease-out ${exitStage === 'arox' ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
             <span className="text-[14px] font-bold tracking-[0.5em] text-white uppercase mb-1 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">AROX</span>
             <div className={`mt-3 flex gap-[6px] transition-opacity duration-200 ${exitStage !== 'none' || etapa === 'pronto' ? 'opacity-0' : 'opacity-100'}`}>
               {[1, 2, 3].map(i => (
                 <div key={i} className={`h-[2px] rounded-full transition-all duration-500 ease-in-out ${stepIndex >= i ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'w-2 bg-white/20'}`} />
               ))}
             </div>
          </div>

          <div className={`relative flex-1 flex flex-col w-full overflow-hidden transition-all duration-300 ${exitStage !== 'none' ? 'opacity-0 scale-95 blur-md pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
            
            {etapa === 'boas-vindas' && (
              <div key="boas-vindas" className="flex flex-col h-full step-transition items-center justify-center">
                <div className="text-center shrink-0 w-full mt-4">
                  <h1 className="text-[24px] font-medium tracking-tight text-white mb-3">{saudacaoText}, {usuarioNome}</h1>
                  <p className="text-[15px] text-zinc-400 font-light">Tudo pronto para começar.</p>
                </div>
                <div className="mt-auto pt-8 w-full shrink-0 flex flex-col gap-3">
                  <button onClick={() => {
                    if (caixaAberto) {
                      handleSequenceFinal(() => {
                         if (typeof onAcessarSistema === 'function') onAcessarSistema(false);
                      });
                    }
                    else goToStep(isAntecipado ? 'antecipado' : 'inicio');
                  }} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {etapa === 'antecipado' && (
              <div key="antecipado" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Acesso Antecipado</h1>
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-light">
                    O horário habitual de operação ainda não iniciou. Deseja abrir o caixa antecipadamente?
                  </p>
                </div>
                <div className="mt-auto pt-8 shrink-0 flex flex-col gap-3">
                  <button onClick={() => goToStep('data')} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Iniciar Turno Agora
                  </button>
                  {typeof onAcessarSistema === 'function' && (
                    <button onClick={() => handleSequenceFinal(() => onAcessarSistema(!isSistemaJaAcessado))} className="w-full py-3.5 bg-transparent border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] text-[13px] font-medium tracking-wide rounded-xl transition-all active:scale-[0.98]">
                      {isSistemaJaAcessado ? 'Cancelar Abertura' : 'Acessar Faturamento'}
                    </button>
                  )}
                  {!isSistemaJaAcessado && (
                    <p className="text-[11px] text-zinc-600 text-center mt-2 font-light">
                      Nota: Você pode ajustar o horário padrão nas configurações.
                    </p>
                  )}
                </div>
              </div>
            )}

            {etapa === 'inicio' && (
              <div key="inicio" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Abertura de Caixa</h1>
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-light">Os módulos do sistema estão sincronizados. Deseja iniciar a operação financeira agora?</p>
                </div>
                <div className="mt-auto pt-8 shrink-0 flex flex-col gap-3">
                  <button onClick={() => goToStep('data')} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Configurar Abertura
                  </button>
                  {typeof onAcessarSistema === 'function' && (
                    <button onClick={() => handleSequenceFinal(() => onAcessarSistema(!isSistemaJaAcessado))} className="w-full py-3.5 bg-transparent border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] text-[13px] font-medium tracking-wide rounded-xl transition-all active:scale-[0.98]">
                      {isSistemaJaAcessado ? 'Cancelar Abertura' : 'Acessar Faturamento'}
                    </button>
                  )}
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
                  <button onClick={() => goToStep(isAntecipado ? 'antecipado' : 'inicio')} className="px-6 py-4 bg-transparent text-zinc-500 hover:text-zinc-300 text-[13px] font-medium rounded-xl transition-colors">
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
                  <button onClick={() => handleSequenceFinal(() => {
                    if (typeof onFinalizarAbertura === 'function') onFinalizarAbertura(valorCaixa ? parseFloat(valorCaixa) : 0)
                  })} className="flex-1 py-4 bg-emerald-500 text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98]">
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