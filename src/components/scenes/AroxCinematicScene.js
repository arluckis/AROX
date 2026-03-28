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
    ignition:    { light: 0.00, rotation: -2,   planetY: isMobile ? -10 : 60, scale: 0.85, blur: 0,   overlay: 0 },
    reveal:      { light: 0.05, rotation: -1,   planetY: isMobile ? -30 : 20, scale: 0.95, blur: 0,   overlay: 0 },
    sync:        { light: 0.15, rotation: 0.5,  planetY: isMobile ? -40 : 5,  scale: 0.98, blur: 2,   overlay: 0.1 },
    handoff:     { light: 0.40, rotation: 1.5,  planetY: -10, scale: 1.00, blur: 4,   overlay: 0.2 },
    bridgeLight: { light: 80.0, rotation: 25.0, planetY: -20, scale: 1.30, blur: 0,   overlay: 0 },
    bridgeDark:  { light: 0.00, rotation: -10.0,planetY: 50,  scale: 0.80, blur: 20,  overlay: 1 } 
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
    const ctx = canvas.getContext('2d', { alpha: false });
    let width = window.innerWidth; 
    let height = window.innerHeight;
    canvas.width = width; 
    canvas.height = height;

    const starsLayer1 = Array.from({ length: 800 }).map(() => ({ 
      x: (Math.random() - 0.5) * 6000, y: (Math.random() - 0.5) * 6000,
      baseZ: Math.random() * 2000 + 1500, size: Math.random() * 0.4 + 0.1, alphaMult: Math.random() * 0.2 + 0.1, twinkle: false, timeOffset: 0
    }));
    
    const starsLayer2 = Array.from({ length: 250 }).map(() => ({ 
      x: (Math.random() - 0.5) * 5000, y: (Math.random() - 0.5) * 5000,
      baseZ: Math.random() * 800 + 700, size: Math.random() * 0.8 + 0.4, alphaMult: Math.random() * 0.4 + 0.2, twinkle: Math.random() > 0.5, timeOffset: Math.random() * Math.PI * 2
    }));

    const starsLayer3 = Array.from({ length: 50 }).map(() => ({ 
      x: (Math.random() - 0.5) * 4000, y: (Math.random() - 0.5) * 4000,
      baseZ: Math.random() * 400 + 200, size: Math.random() * 1.5 + 1.0, alphaMult: Math.random() * 0.6 + 0.4, twinkle: true, timeOffset: Math.random() * Math.PI * 2, hasHalo: true
    }));

    const stars = [...starsLayer1, ...starsLayer2, ...starsLayer3];
    const lerp = (start, end, f) => start + (end - start) * f;

    const handleMouseMove = (e) => {
      physics.current.targetMouseX = (e.clientX / width - 0.5) * 0.6;
      physics.current.targetMouseY = (e.clientY / height - 0.5) * 0.6;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    });

    let time = 0;

    const render = () => {
      time += 0.012; 
      const p = physics.current;
      
      p.mouseX = lerp(p.mouseX, p.targetMouseX, 0.04); 
      p.mouseY = lerp(p.mouseY, p.targetMouseY, 0.04);
      p.light = lerp(p.light, p.targetLight, p.targetLight > 5 ? 0.09 : 0.015); 
      p.rotation = lerp(p.rotation, p.targetRotation, 0.01); 
      p.planetY = lerp(p.planetY, p.targetPlanetY, scenePhase === 'reveal' ? 0.03 : 0.015);
      p.scale = lerp(p.scale, p.targetScale, p.targetLight > 5 ? 0.02 : 0.01);

      ctx.fillStyle = '#030406';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2; const cy = height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]; 
        const actualZ = star.baseZ / p.scale; 
        
        const fov = 1000;
        const offsetX = p.mouseX * 120 * (1000 / actualZ); 
        const offsetY = p.mouseY * 120 * (1000 / actualZ);
        
        const px = (star.x / actualZ) * fov + cx - offsetX; 
        const py = (star.y / actualZ) * fov + cy - offsetY;
        
        let currentAlpha = star.alphaMult;
        if (star.twinkle) {
          currentAlpha *= (0.6 + Math.sin(time + star.timeOffset) * 0.4);
        }
        
        const alpha = Math.min(currentAlpha, (3000 - actualZ) / 1000); 
        
        const dimFactor = Math.max(0, 1 - (p.light * 0.08));
        const size = Math.max(0.1, star.size * (fov / actualZ));
        
        if (px > 0 && px < width && py > 0 && py < height && alpha > 0 && dimFactor > 0) {
           ctx.fillStyle = `rgba(220, 235, 255, ${alpha * dimFactor})`; 
           ctx.beginPath(); 
           ctx.arc(px, py, size, 0, Math.PI * 2); 
           ctx.fill();

           if (star.hasHalo && size > 1.2) {
             ctx.fillStyle = `rgba(160, 200, 255, ${alpha * 0.25 * dimFactor})`;
             ctx.beginPath();
             ctx.arc(px, py, size * 3, 0, Math.PI * 2);
             ctx.fill();
           }
        }
      }

      if (containerRef.current) {
        containerRef.current.style.setProperty('--pr-mouse-x', p.mouseX);
        containerRef.current.style.setProperty('--pr-mouse-y', p.mouseY);
        containerRef.current.style.setProperty('--pr-light', p.light);
        containerRef.current.style.setProperty('--pr-rot', `${p.rotation}deg`);
        containerRef.current.style.setProperty('--pr-planet-y', `${p.planetY}px`);
        containerRef.current.style.setProperty('--pr-scale', p.scale);
      }
      
      requestRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { 
      window.removeEventListener('mousemove', handleMouseMove); 
      cancelAnimationFrame(requestRef.current); 
    };
  }, [isClient, scenePhase]);

  if (!isClient) return null;

  const isLight = temaAnterior === 'light';
  const orbitalCoreColor = isLight ? 'rgba(255, 255, 255, 1)' : 'rgba(180, 210, 255, 0.15)';
  const orbitalSpreadColor = isLight ? '#fafafa' : 'transparent';
  const overlayColor = isLight ? '250, 250, 250' : '9, 9, 11';

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-[100dvh] z-0 overflow-hidden text-zinc-200 font-sans select-none bg-[#030406]">
      
      <style dangerouslySetInnerHTML={{__html: `
        .cinematic-entry { animation: cinematicFadeIn 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes cinematicFadeIn { 
          0% { opacity: 0; transform: translate(-50%, -30%) scale(0.9); filter: blur(20px); } 
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); } 
        }

        .orbital-backlight {
          position: absolute; top: 50%; left: 50%;
          width: 80vmax; height: 80vmax;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(calc(0.01 + var(--pr-light, 0) * 0.08));
          background: radial-gradient(circle at center, ${orbitalCoreColor} 0%, ${orbitalSpreadColor} 40%, transparent 70%);
          opacity: calc(var(--pr-light, 0) * 1.5);
          z-index: 0; 
          pointer-events: none;
          will-change: transform, opacity;
        }

        .arox-planet-container {
          position: absolute; top: 50%; left: 50%;
          width: clamp(320px, 50vw, 600px); height: clamp(320px, 50vw, 600px);
          pointer-events: none; z-index: 1;
          transform: translate(-50%, -50%) translate3d(calc(var(--pr-mouse-x, 0) * -12px), calc(var(--pr-mouse-y, 0) * -12px + var(--pr-planet-y, 0px)), 0) rotate(var(--pr-rot, 0deg)) scale(var(--pr-scale, 1));
          will-change: transform;
        }

        .arox-planet {
          width: 100%; height: 100%; border-radius: 50%;
          background: radial-gradient(circle at 65% 35%, #151c24 0%, #0a0d14 40%, #040508 80%, #000000 100%);
          position: relative;
          box-shadow: 
            inset -30px -30px 60px rgba(0,0,0,0.9), 
            inset 0 0 clamp(0px, calc(var(--pr-light, 0) * 4px), 60px) ${isLight ? 'rgba(255,255,255,0.8)' : 'rgba(200,225,255,0.3)'},
            inset 0 0 clamp(0px, calc((var(--pr-light, 0) - 5) * 35px), 1000px) ${orbitalSpreadColor};
          opacity: clamp(0, 1 - (var(--pr-light, 0) - 15) * 0.05, 1);
        }

        .arox-planet::after {
          content: ''; position: absolute; inset: -5px; border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(255,255,255,calc(var(--pr-light,0)*0.02)) 100%);
          filter: blur(8px); z-index: 2;
        }
      `}} />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Renderizado incondicionalmente para o rim light funcionar nos dois temas */}
      <div className="orbital-backlight"></div>

      <div className="arox-planet-container cinematic-entry">
         <div className="arox-planet"></div>
      </div>

      <div 
        className="absolute inset-0 z-[5] pointer-events-none transition-[backdrop-filter,background-color] duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
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