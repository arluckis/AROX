'use client';
import { useEffect, useRef, useState } from 'react';

export default function AroxCinematicScene({
  scenePhase = 'ignition', 
  customConfig = null,
  temaAnterior = 'dark',
  children
}) {
  const [isClient, setIsClient] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const phaseConfig = {
    ignition:    { light: 0.00, rotation: -2,   planetY: isMobile ? -240 : 60, scale: isMobile ? 0.90 : 0.85, blur: 0,   overlay: 0 },
    reveal:      { light: 0.02, rotation: -1.5, planetY: isMobile ? -260 : 40, scale: isMobile ? 0.95 : 0.90, blur: 0,   overlay: 0 },
    sync:        { light: 0.10, rotation: 0.0,  planetY: isMobile ? -280 : 15, scale: isMobile ? 1.05 : 0.98, blur: isMobile ? 0 : 2, overlay: isMobile ? 0 : 0.05 },
    handoff:     { light: 0.30, rotation: 1.5,  planetY: isMobile ? -200 : -10, scale: 1.00, blur: 4,   overlay: 0.15 },
    bridgeLight: { light: 150.0, rotation: 1.5, planetY: isMobile ? -200 : -10, scale: 1.00, blur: 12,  overlay: 1 }, 
    bridgeDark:  { light: 0.00,  rotation: 1.5, planetY: isMobile ? -200 : -10, scale: 1.00, blur: 16,  overlay: 1 } 
  };

  const activeConfig = customConfig || phaseConfig[scenePhase] || phaseConfig.ignition;

  const physics = useRef({
    mouseX: 0, targetMouseX: 0, 
    mouseY: 0, targetMouseY: 0,
    light: activeConfig.light, targetLight: activeConfig.light, 
    rotation: activeConfig.rotation, targetRotation: activeConfig.rotation, 
    planetY: activeConfig.planetY, targetPlanetY: activeConfig.planetY,
    scale: activeConfig.scale, targetScale: activeConfig.scale
  });

  useEffect(() => {
    physics.current.targetLight = activeConfig.light;
    physics.current.targetRotation = activeConfig.rotation;
    physics.current.targetPlanetY = activeConfig.planetY;
    physics.current.targetScale = activeConfig.scale;
  }, [activeConfig]);

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    let width = window.innerWidth; 
    let height = window.innerHeight;
    canvas.width = width; 
    canvas.height = height;

    const densityMult = isMobile ? 0.3 : 0.8; 
    const PI2 = Math.PI * 2; 

    const starsLayer1 = Array.from({ length: Math.floor(800 * densityMult) }).map(() => ({ 
      x: (Math.random() - 0.5) * 6000, y: (Math.random() - 0.5) * 6000,
      baseZ: Math.random() * 2000 + 1500, size: Math.random() * 0.4 + 0.1, alphaMult: Math.random() * 0.2 + 0.1, twinkle: false, timeOffset: 0
    }));
    
    const starsLayer2 = Array.from({ length: Math.floor(250 * densityMult) }).map(() => ({ 
      x: (Math.random() - 0.5) * 5000, y: (Math.random() - 0.5) * 5000,
      baseZ: Math.random() * 800 + 700, size: Math.random() * 0.8 + 0.4, alphaMult: Math.random() * 0.4 + 0.2, twinkle: Math.random() > 0.5, timeOffset: Math.random() * PI2
    }));

    const starsLayer3 = Array.from({ length: Math.floor(50 * densityMult) }).map(() => ({ 
      x: (Math.random() - 0.5) * 4000, y: (Math.random() - 0.5) * 4000,
      baseZ: Math.random() * 400 + 200, size: Math.random() * 1.5 + 1.0, alphaMult: Math.random() * 0.6 + 0.4, twinkle: true, timeOffset: Math.random() * PI2, hasHalo: true
    }));

    const stars = [...starsLayer1, ...starsLayer2, ...starsLayer3];
    const lerp = (start, end, f) => start + (end - start) * f;
    const fov = 1000;

    const handleMouseMove = (e) => {
      if (scenePhase === 'bridgeLight' || scenePhase === 'bridgeDark') return;
      physics.current.targetMouseX = (e.clientX / width - 0.5) * 0.6;
      physics.current.targetMouseY = (e.clientY / height - 0.5) * 0.6;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    }, { passive: true });

    let time = 0;

    const render = () => {
      time += 0.012; 
      const p = physics.current;
      
      const isBridge = scenePhase === 'bridgeLight' || scenePhase === 'bridgeDark' || activeConfig.overlay === 1;
      
      const isExploding = p.targetLight > 50;  
      const isImploding = p.targetScale <= 0.5; 
      const isReturning = p.targetScale < p.scale && !isImploding; 

      const speedScale = isExploding ? 0.018 : (isImploding ? 0.012 : (isReturning ? 0.010 : 0.035));
      const speedPos   = isExploding ? 0.015 : (isImploding ? 0.010 : (isReturning ? 0.015 : 0.030));
      
      if (isBridge) {
        p.scale = lerp(p.scale, p.targetScale, 0.02); 
        p.rotation = lerp(p.rotation, p.targetRotation, 0.02);
        p.planetY = lerp(p.planetY, p.targetPlanetY, 0.02);
        p.mouseX = lerp(p.mouseX, 0, 0.02); 
        p.mouseY = lerp(p.mouseY, 0, 0.02);
      } else {
        p.scale = lerp(p.scale, p.targetScale, speedScale);
        p.rotation = lerp(p.rotation, p.targetRotation, speedPos * 0.8); 
        p.planetY = lerp(p.planetY, p.targetPlanetY, speedPos);
        p.mouseX = lerp(p.mouseX, p.targetMouseX, 0.04); 
        p.mouseY = lerp(p.mouseY, p.targetMouseY, 0.04);
      }

      let speedLight = 0.040;
      if (isBridge && temaAnterior === 'light') {
        const progress = Math.min(p.light / p.targetLight, 1);
        speedLight = 0.002 + (progress * progress * 0.06); 
      } else if (isBridge && temaAnterior === 'dark') {
        speedLight = 0.015; 
      } else {
        // Interpolação super leve e lenta (0.004) para que o "clarão" desperte de forma ultra suave
        const isEarlyPhase = p.targetLight <= 0.30;
        speedLight = isExploding ? 0.025 : (isImploding ? 0.030 : (isReturning ? 0.015 : (isEarlyPhase ? 0.004 : 0.040)));
      }
      p.light = lerp(p.light, p.targetLight, speedLight); 

      ctx.fillStyle = '#030406';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2; 
      const cy = (height / 2) + p.planetY; 
      
      const dimFactor = Math.max(0, 1 - (p.light * 0.08));

      if (dimFactor > 0.01) {
        const currentScale = p.scale;
        const parallaxX = p.mouseX * 120;
        const parallaxY = p.mouseY * 120;

        for (let i = 0; i < stars.length; i++) {
          const star = stars[i]; 
          const actualZ = star.baseZ / currentScale; 
          const zRatio = fov / actualZ; 
          
          const px = (star.x * zRatio) + cx - (parallaxX * zRatio); 
          const py = (star.y * zRatio) + cy - (parallaxY * zRatio);
          
          const size = Math.max(0.1, star.size * zRatio);

          if (px < -size || px > width + size || py < -size || py > height + size) continue;

          let currentAlpha = star.alphaMult;
          if (star.twinkle) {
            currentAlpha *= (0.6 + Math.sin(time + star.timeOffset) * 0.4);
          }
          
          const alpha = Math.min(currentAlpha, (3000 - actualZ) / 1000); 
          
          if (alpha > 0) {
             ctx.fillStyle = `rgba(220, 235, 255, ${alpha * dimFactor})`; 
             
             if (size <= 1.2 && !star.hasHalo) {
               ctx.fillRect(px - size, py - size, size * 2, size * 2);
             } else {
               ctx.beginPath(); 
               ctx.arc(px, py, size, 0, PI2); 
               ctx.fill();

               if (star.hasHalo) {
                 ctx.fillStyle = `rgba(160, 200, 255, ${alpha * 0.25 * dimFactor})`;
                 ctx.beginPath();
                 ctx.arc(px, py, size * 3, 0, PI2);
                 ctx.fill();
               }
             }
          }
        }
      }

      if (containerRef.current) {
        containerRef.current.style.cssText = `
          --pr-mouse-x: ${p.mouseX};
          --pr-mouse-y: ${p.mouseY};
          --pr-light: ${p.light};
          --pr-rot: ${p.rotation}deg;
          --pr-planet-y: ${p.planetY}px;
          --pr-scale: ${p.scale};
        `;
      }
      
      requestRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { 
      window.removeEventListener('mousemove', handleMouseMove); 
      cancelAnimationFrame(requestRef.current); 
    };
  }, [isClient, scenePhase, temaAnterior, activeConfig.overlay]);

  if (!isClient) return null;

  const isLight = temaAnterior === 'light';
  
  const orbitalCoreColor = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(160, 190, 255, 0.1)';
  const orbitalSpreadColor = isLight ? 'rgba(250, 250, 250, 0.6)' : 'transparent';
  
  const overlayColor = isLight ? '255, 255, 255' : '3, 4, 6'; 
  const isExiting = activeConfig.overlay === 1;

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-[100dvh] z-0 overflow-hidden text-zinc-200 font-sans select-none bg-[#030406]">
      
      <style dangerouslySetInnerHTML={{__html: `
        .cinematic-entry { 
          animation: cinematicFadeIn 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        @keyframes cinematicFadeIn { 
          0% { opacity: 0; filter: blur(12px); } 
          100% { opacity: 1; filter: blur(0); } 
        }

        .orbital-backlight {
          position: absolute; top: 50%; left: 50%;
          width: 90vmax; height: 90vmax;
          border-radius: 50%;
          transform: translate(-50%, -50%) translateY(var(--pr-planet-y, 0px)) scale(calc(0.5 + var(--pr-light, 0) * 0.035)) translateZ(0);
          background: radial-gradient(circle at center, ${orbitalCoreColor} 0%, ${orbitalSpreadColor} 35%, transparent 65%);
          opacity: calc(min(1, var(--pr-light, 0) * 0.4));
          z-index: 0; 
          pointer-events: none;
          will-change: transform, opacity;
          mix-blend-mode: screen;
          transition: opacity 3s cubic-bezier(0.2, 0.8, 0.2, 1); /* Amortece opacidade garantindo que o brilho surja organicamente */
        }

        .arox-planet-system {
          position: absolute; top: 50%; left: 50%;
          width: clamp(320px, 50vw, 600px); height: clamp(320px, 50vw, 600px);
          pointer-events: none; z-index: 1;
          transform: 
            translate(-50%, -50%) 
            translateY(var(--pr-planet-y, 0px)) 
            scale(var(--pr-scale, 1))
            rotate(var(--pr-rot, 0deg))
            translateZ(0);
          will-change: transform;
        }

        .arox-planet {
          position: absolute; inset: 0; border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, #06080b 0%, #020304 60%, #000000 100%);
          box-shadow: inset 0 0 40px rgba(0,0,0,1);
          transform: translate3d(
            calc(var(--pr-mouse-x, 0) * -20px), 
            calc(var(--pr-mouse-y, 0) * -20px), 
            0
          );
          z-index: 20;
          will-change: transform;
        }

        .arox-planet::before {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: radial-gradient(circle at 50% 100%, rgba(255,255,255,calc(min(0.15, var(--pr-light, 0) * 0.012))) 0%, transparent 60%);
          z-index: 21;
        }

        .arox-ring-main {
          position: absolute; top: 50%; left: 50%;
          width: 120%; height: 120%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          transform: 
            translate(-50%, -50%) 
            translate3d(calc(var(--pr-mouse-x, 0) * -30px), calc(var(--pr-mouse-y, 0) * -30px), 0); 
          will-change: transform;
          z-index: 10;
        }

        .arox-ring-thin-group {
          position: absolute; top: 50%; left: 50%;
          width: 140%; height: 140%;
          transform: 
            translate(-50%, -50%) 
            translate3d(calc(var(--pr-mouse-x, 0) * -16px), calc(var(--pr-mouse-y, 0) * -16px), 0); 
          will-change: transform;
          z-index: 5;
        }
        
        .arox-ring-thin {
          position: absolute; top: 50%; left: 50%;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .arox-ring-thin:nth-child(1) { width: 100%; height: 100%; border-color: rgba(255,255,255,0.06); }
        .arox-ring-thin:nth-child(2) { width: 92%; height: 92%; }
        .arox-ring-thin:nth-child(3) { width: 84%; height: 84%; }
        .arox-ring-thin:nth-child(4) { width: 76%; height: 76%; }

        .arox-flare {
          position: absolute;
          width: 160px; height: 160px;
          z-index: 40;
          will-change: transform;
        }
        
        .flare-bl { 
          bottom: 10%; left: -2%; 
          transform: translate3d(calc(var(--pr-mouse-x, 0) * -50px), calc(var(--pr-mouse-y, 0) * -50px), 0) rotate(20deg); 
        }
        .flare-tr { 
          top: 10%; right: -2%; 
          transform: translate3d(calc(var(--pr-mouse-x, 0) * -50px), calc(var(--pr-mouse-y, 0) * -50px), 0) rotate(20deg); 
        }

        .flare-core {
          position: absolute; top: 50%; left: 50%;
          width: 2px; height: 2px; background: rgba(255, 255, 255, 0.9); border-radius: 50%;
          box-shadow: 0 0 6px 1px rgba(255,255,255,0.4);
          transform: translate(-50%, -50%);
        }
        .flare-beam {
          position: absolute; top: 50%; left: 50%;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 60%);
          transform: translate(-50%, -50%);
        }
        .flare-beam.h { width: 80%; height: 1px; }
        .flare-beam.v { width: 80%; height: 1px; transform: translate(-50%, -50%) rotate(90deg); }
        .flare-beam.diag { 
          width: 120%; height: 1px; 
          transform: translate(-50%, -50%) rotate(30deg); 
          opacity: 0.4; 
        }
      `}} />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="orbital-backlight"></div>

      <div className="arox-planet-system cinematic-entry">
         
         <div className="arox-ring-main"></div>
         
         <div className="arox-ring-thin-group">
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
         </div>

         <div className="arox-planet"></div>

         <div className="arox-flare flare-bl">
            <div className="flare-core"></div>
            <div className="flare-beam h"></div>
            <div className="flare-beam v"></div>
            <div className="flare-beam diag"></div>
         </div>
         
         <div className="arox-flare flare-tr">
            <div className="flare-core"></div>
            <div className="flare-beam h"></div>
            <div className="flare-beam v"></div>
            <div className="flare-beam diag"></div>
         </div>
      </div>

      <div 
        className={`absolute inset-0 z-[50] pointer-events-none transition-all ${
          isExiting 
            ? 'duration-[800ms] ease-in' 
            : 'duration-[2000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]'
        }`}
        style={{
          backdropFilter: `blur(${activeConfig.blur}px)`,
          WebkitBackdropFilter: `blur(${activeConfig.blur}px)`,
          backgroundColor: `rgba(${overlayColor}, ${activeConfig.overlay})`
        }}
      />

      <div className="relative z-[20] w-full h-full">
        {children}
      </div>
    </div>
  );
}