// PreComanda.js
'use client';
import { useState, useEffect, useRef } from 'react';

export default function PreComanda({ 
  onFinalizarAbertura,
  temPendenciaTurnoAnterior = false,
  mensagemPendencia = "Existem registros não finalizados do turno anterior. A conciliação é necessária para liberar o ambiente.",
  onResolverPendencia,
  isAntecipado = false,
  temaAnterior = 'dark',
  onAcessarSistema
}) {
  const estadoInicial = temPendenciaTurnoAnterior 
    ? 'pendencia' 
    : (isAntecipado ? 'antecipado' : 'inicio');

  const [etapa, setEtapa] = useState(estadoInicial);
  const [valorCaixa, setValorCaixa] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  
  // Controle estrito de saída. Se preenchido, o takeover foi encerrado e a animação roda.
  const [exitTransition, setExitTransition] = useState(null); 

  const canvasRef = useRef(null);
  const requestRef = useRef();
  
  const physics = useRef({
    mouseX: 0, targetMouseX: 0,
    mouseY: 0, targetMouseY: 0,
    light: 0, targetLight: 0,
    hue: 220, targetHue: 220,
    rotation: 0, targetRotation: 0,
    planetY: 0, targetPlanetY: 0
  });

  const envStates = {
    pendencia:  { light: 0.15, hue: 15,  rotation: -5, planetY: 20 },
    antecipado: { light: 0.25, hue: 220, rotation: 0,  planetY: 10 },
    inicio:     { light: 0.40, hue: 215, rotation: 5,  planetY: 0 },
    data:       { light: 0.60, hue: 210, rotation: 10, planetY: -10 },
    valor:      { light: 0.85, hue: 200, rotation: 15, planetY: -20 }
  };

  useEffect(() => {
    setIsClient(true);
    document.body.style.overflow = 'hidden'; 
    const timer = setTimeout(() => setIsMounting(false), 50);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const state = envStates[etapa];
    if (state) {
      physics.current.targetLight = state.light;
      physics.current.targetHue = state.hue;
      physics.current.targetRotation = state.rotation;
      physics.current.targetPlanetY = state.planetY;
    }
  }, [etapa]);

  const dataHoje = isClient 
    ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  useEffect(() => {
    if (!isClient || exitTransition) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const numStars = 1000;
    const stars = Array.from({ length: numStars }).map(() => ({
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 4000,
      z: Math.random() * 2000,
      size: Math.random() * 1.5 + 0.2,
      alphaMult: Math.random() * 0.6 + 0.1, 
    }));

    const lerp = (start, end, f) => start + (end - start) * f;

    const handleMouseMove = (e) => {
      physics.current.targetMouseX = (e.clientX / width - 0.5) * 1.0;
      physics.current.targetMouseY = (e.clientY / height - 0.5) * 1.0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    });

    const render = () => {
      const p = physics.current;

      p.mouseX = lerp(p.mouseX, p.targetMouseX, 0.008);
      p.mouseY = lerp(p.mouseY, p.targetMouseY, 0.008);
      p.light = lerp(p.light, p.targetLight, 0.02);
      p.hue = lerp(p.hue, p.targetHue, 0.02);
      p.rotation = lerp(p.rotation, p.targetRotation, 0.01);
      p.planetY = lerp(p.planetY, p.targetPlanetY, 0.01);

      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        star.z -= 0.15;
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * 4000;
          star.y = (Math.random() - 0.5) * 4000;
          star.z = 2000;
        }

        const fov = 1000; 
        const actualZ = star.z;

        const offsetX = p.mouseX * 65 * (actualZ / 2000);
        const offsetY = p.mouseY * 65 * (actualZ / 2000);

        const px = (star.x / actualZ) * fov + cx - offsetX;
        const py = (star.y / actualZ) * fov + cy - offsetY;

        const alpha = Math.min(star.alphaMult, (2000 - actualZ) / 1000);
        const size = Math.max(0.1, star.size * (fov / actualZ));

        ctx.fillStyle = `rgba(230, 240, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      document.documentElement.style.setProperty('--pr-mouse-x', p.mouseX);
      document.documentElement.style.setProperty('--pr-mouse-y', p.mouseY);
      document.documentElement.style.setProperty('--pr-light', p.light);
      document.documentElement.style.setProperty('--pr-hue', p.hue);
      document.documentElement.style.setProperty('--pr-rot', `${p.rotation}deg`);
      document.documentElement.style.setProperty('--pr-planet-y', `${p.planetY}px`);

      requestRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, [isClient, exitTransition]);


  // ==========================================
  // A) NAVEGAÇÃO INTERNA (Não encerra o Takeover)
  // ==========================================
  const goToStep = (novaEtapa) => {
    // Apenas muda o estado interno. Nenhuma animação de saída é disparada.
    setEtapa(novaEtapa);
  };


  // ==========================================
  // B) FUNÇÕES DE SAÍDA REAL (Encerram o Takeover)
  // ==========================================
  const triggerExit = (callback) => {
    // 1. Inicia o efeito visual final sobrepondo tudo
    setExitTransition(temaAnterior);
    
    // 2. Aguarda a animação dominar a tela antes de devolver o controle ao pai
    // Somente após esse timeout o componente será desmontado e o shell aparecerá.
    setTimeout(() => {
      callback();
    }, 1500); 
  };

  const exitToPendingRecords = () => {
    triggerExit(() => {
      if (onResolverPendencia) onResolverPendencia();
    });
  };

  const exitToSystemOnly = () => {
    triggerExit(() => {
      if (onAcessarSistema) onAcessarSistema();
      else onFinalizarAbertura(0);
    });
  };

  const exitAndOpenCash = () => {
    triggerExit(() => {
      onFinalizarAbertura(valorCaixa ? parseFloat(valorCaixa) : 0);
    });
  };


  if (!isClient) return null;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] z-[999999] bg-[#030305] overflow-hidden text-zinc-200 font-sans select-none">
      
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --pr-mouse-x: 0;
          --pr-mouse-y: 0;
          --pr-light: 0;
          --pr-hue: 220;
          --pr-rot: 0deg;
          --pr-planet-y: 0px;
        }

        .cinematic-entry {
          animation: cinematicFadeIn 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes cinematicFadeIn {
          0% { opacity: 0; filter: blur(15px); transform: scale(1.03); }
          100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }

        .step-transition {
          animation: elegantStepFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes elegantStepFade {
          0% { opacity: 0; transform: translateY(8px); filter: blur(3px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        .arox-core {
          width: 1000px;
          height: 1000px;
          border-radius: 50%;
          background: #050508;
          transform: 
            translate3d(calc(var(--pr-mouse-x) * -12px), calc(calc(var(--pr-mouse-y) * -12px) + var(--pr-planet-y)), 0)
            rotateZ(var(--pr-rot));
          box-shadow: 
            inset -30px -30px 100px rgba(0,0,0,0.98),
            inset 0 30px 60px hsla(var(--pr-hue), 35%, 65%, calc(0.02 + (var(--pr-light) * 0.08))),
            0 -20px 150px hsla(var(--pr-hue), 40%, 45%, calc(0.01 + (var(--pr-light) * 0.06)));
        }

        .arox-atmosphere {
          background: radial-gradient(
            circle at 50% 10%, 
            hsla(var(--pr-hue), 40%, 75%, calc(0.03 + (var(--pr-light) * 0.07))) 0%, 
            transparent 60%
          );
        }

        .cockpit-console {
          transform: 
            translate3d(calc(var(--pr-mouse-x) * 9px), calc(var(--pr-mouse-y) * 9px), 0)
            rotateX(calc(var(--pr-mouse-y) * 0.9deg))
            rotateY(calc(var(--pr-mouse-x) * -0.9deg));
        }

        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        
        /* Saída Real - Dark */
        .theme-exit-dark {
          animation: exitFadeDark 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes exitFadeDark {
          0% { opacity: 0; backdrop-filter: blur(0px); }
          100% { opacity: 1; background: #09090b; backdrop-filter: blur(30px); }
        }

        /* Saída Real - Light (Sol expandindo) */
        .theme-exit-light {
          animation: exitSolarLight 1.5s cubic-bezier(0.5, 0, 0.1, 1) forwards;
        }
        @keyframes exitSolarLight {
          0% { transform: scale(0); opacity: 0; background: #fbbf24; box-shadow: 0 0 100px #fbbf24; }
          30% { opacity: 1; background: #fef08a; box-shadow: 0 0 300px #fef08a; }
          100% { transform: scale(150); opacity: 1; background: #fafafa; box-shadow: 0 0 0 transparent; }
        }
      `}} />

      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-[3000ms] ${isMounting ? 'opacity-0 scale-102' : 'opacity-100 scale-100'}`} />

      <div className="absolute inset-0 pointer-events-none cinematic-entry overflow-hidden">
        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-[40%]">
           <div className="arox-core flex items-center justify-center">
             <div className="absolute inset-0 arox-atmosphere mix-blend-screen rounded-full"></div>
             <div className="absolute w-[120%] h-[120%] border-[0.5px] border-white/[0.015] rounded-full" style={{ transform: 'rotateX(78deg) rotateY(-5deg)' }}></div>
           </div>
        </div>
      </div>

      <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center px-6 perspective-[1200px] transition-all duration-[2000ms] delay-300 ${isMounting ? 'opacity-0 translate-y-6 blur-md' : 'opacity-100 translate-y-0 blur-0'}`}>
        
        <div className="cockpit-console w-full max-w-[460px] bg-[#030305]/70 backdrop-blur-[40px] border border-white/[0.06] rounded-3xl p-10 md:p-14 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col will-change-transform">
          
          <div className="w-full flex justify-center mb-12">
            <span className="text-[12px] font-light tracking-[0.4em] text-zinc-400 uppercase">
              Arox
            </span>
          </div>

          <div className="relative min-h-[220px] w-full flex items-center justify-center">
            
            {etapa === 'pendencia' && (
              <div key="pendencia" className="absolute inset-0 flex flex-col text-center step-transition">
                <h1 className="text-[24px] font-medium tracking-tight text-zinc-100 mb-4">
                  Conciliação Pendente
                </h1>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-10 font-light">
                  {mensagemPendencia}
                </p>
                <div className="mt-auto">
                  {/* BOTÃO DE SAÍDA REAL */}
                  <button 
                    onClick={exitToPendingRecords}
                    className="w-full py-4 bg-transparent border border-red-900/50 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 text-[13px] font-medium tracking-wide rounded-xl transition-all duration-300 active:scale-[0.98]"
                  >
                    Acessar Registros
                  </button>
                </div>
              </div>
            )}

            {etapa === 'antecipado' && (
              <div key="antecipado" className="absolute inset-0 flex flex-col text-center step-transition">
                <h1 className="text-[24px] font-medium tracking-tight text-zinc-100 mb-4">
                  Acesso Restrito
                </h1>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-10 font-light">
                  O horário operacional de abertura não foi alcançado. Deseja forçar o início do turno ou apenas acessar o sistema?
                </p>
                <div className="mt-auto flex flex-col sm:flex-row gap-4">
                  {/* BOTÃO DE SAÍDA REAL */}
                  <button 
                    onClick={exitToSystemOnly}
                    className="flex-1 py-4 bg-transparent border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-[13px] font-medium tracking-wide rounded-xl transition-all active:scale-[0.98]"
                  >
                    Apenas Acessar
                  </button>
                  {/* NAVEGAÇÃO INTERNA */}
                  <button 
                    onClick={() => goToStep('inicio')}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-950 text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-white active:scale-[0.98]"
                  >
                    Iniciar Operação
                  </button>
                </div>
              </div>
            )}

            {etapa === 'inicio' && (
              <div key="inicio" className="absolute inset-0 flex flex-col text-center step-transition">
                <h1 className="text-[24px] font-medium tracking-tight text-zinc-100 mb-4">
                  Abertura de Turno
                </h1>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-10 font-light">
                  O ambiente está sincronizado e os módulos operacionais estão prontos para a inicialização.
                </p>
                <div className="mt-auto">
                  {/* NAVEGAÇÃO INTERNA */}
                  <button 
                    onClick={() => goToStep('data')}
                    className="w-full py-4 bg-zinc-100 text-zinc-950 text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-white active:scale-[0.98]"
                  >
                    Preparar Abertura
                  </button>
                </div>
              </div>
            )}

            {etapa === 'data' && (
              <div key="data" className="absolute inset-0 flex flex-col text-center step-transition">
                <h1 className="text-[24px] font-medium tracking-tight text-zinc-100 mb-4">
                  Data de Referência
                </h1>
                <p className="text-[14px] text-zinc-400 mb-8 font-light">
                  Confirme a data calendário que será aplicada aos registros operacionais desta sessão.
                </p>
                
                <div className="w-full py-2 mb-10">
                  <p className="text-[18px] font-medium text-zinc-200 capitalize tracking-wide">
                    {dataHoje}
                  </p>
                </div>

                <div className="flex gap-4 mt-auto">
                  {/* NAVEGAÇÃO INTERNA */}
                  <button 
                    onClick={() => goToStep(isAntecipado ? 'antecipado' : 'inicio')}
                    className="px-6 py-4 bg-transparent border border-transparent hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 text-[13px] font-medium rounded-xl transition-colors"
                  >
                    Voltar
                  </button>
                  {/* NAVEGAÇÃO INTERNA */}
                  <button 
                    onClick={() => goToStep('valor')}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-950 text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-white active:scale-[0.98]"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}

            {etapa === 'valor' && (
              <div key="valor" className="absolute inset-0 flex flex-col text-center step-transition">
                <h1 className="text-[24px] font-medium tracking-tight text-zinc-100 mb-4">
                  Fundo de Caixa
                </h1>
                <p className="text-[14px] text-zinc-400 mb-8 font-light">
                  Informe o saldo em espécie atualmente disponível na gaveta.
                </p>

                <div className="w-full mb-10 flex items-center justify-center py-2 relative">
                  <span className="text-xl font-light text-zinc-600 mr-2 pointer-events-none">
                    R$
                  </span>
                  <input 
                    type="number" 
                    placeholder="0,00"
                    value={valorCaixa}
                    onChange={(e) => setValorCaixa(e.target.value)}
                    className="w-full bg-transparent text-[44px] tabular-nums font-light text-zinc-100 tracking-tight focus:outline-none placeholder:text-zinc-800 border-b border-zinc-800 focus:border-zinc-400 transition-colors pb-2 text-center"
                    autoFocus
                  />
                </div>

                <div className="flex gap-4 mt-auto">
                  {/* NAVEGAÇÃO INTERNA */}
                  <button 
                    onClick={() => goToStep('data')}
                    className="px-6 py-4 bg-transparent border border-transparent hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 text-[13px] font-medium rounded-xl transition-colors"
                  >
                    Voltar
                  </button>
                  {/* BOTÃO DE SAÍDA REAL */}
                  <button 
                    onClick={exitAndOpenCash}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-950 text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-white active:scale-[0.98]"
                  >
                    Abrir Operação
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OVERLAYS DE SAÍDA REAL */}
      {exitTransition === 'dark' && (
        <div className="fixed inset-0 z-[9999999] pointer-events-none theme-exit-dark"></div>
      )}
      {exitTransition === 'light' && (
        <div className="fixed top-1/2 left-1/2 w-4 h-4 rounded-full pointer-events-none z-[9999999] -translate-x-1/2 -translate-y-1/2 theme-exit-light"></div>
      )}

    </div>
  );
}