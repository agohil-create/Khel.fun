
import React, { useState, useEffect, useRef } from 'react';
import { Rocket, History, Trophy, AlertTriangle, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';
import { useGameSound } from '../../hooks/useGameSound';

interface CrashProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

type GamePhase = 'IDLE' | 'COUNTDOWN' | 'FLYING' | 'CRASHED';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'FLAME' | 'SMOKE' | 'SPARK' | 'DEBRIS' | 'SHOCKWAVE';
  color: string;
  size: number;
  rotation?: number;
  rotSpeed?: number;
}

interface Star {
  x: number;
  y: number;
  z: number; // Depth factor for parallax
  size: number;
  brightness: number;
}

const Crash: React.FC<CrashProps> = ({ onBet, onWin, onLoss }) => {
  // --- State ---
  const [betAmount, setBetAmount] = useState<string>('10');
  const [autoCashout, setAutoCashout] = useState<string>('2.00');
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [countdown, setCountdown] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([1.45, 2.30, 1.10, 8.50, 1.05, 3.20]);
  const [payout, setPayout] = useState<number>(0);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [shake, setShake] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const phaseRef = useRef<GamePhase>('IDLE');
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const betAmountRef = useRef<number>(0);
  const autoCashoutRef = useRef<number>(0);
  const hasCashedOutRef = useRef<boolean>(false);
  
  // Camera & Visual State
  const camRef = useRef({ x: 0, y: 0, zoomX: 8, zoomY: 2 }); // zoomX = maxSeconds, zoomY = maxMult
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  // Constants
  const GROWTH_RATE = 0.065; 
  const GAME_SPEED = 1.0;
  const HOUSE_EDGE = 0.99; // 1% Edge

  // Sounds
  const { playClick, playExplode, playWin, playPing } = useGameSound();

  // --- Initialization ---
  useEffect(() => {
    // Init Stars
    starsRef.current = Array.from({ length: 150 }, () => ({
      x: Math.random() * 3000,
      y: Math.random() * 2000,
      z: Math.random() * 2 + 0.5, // Depth
      size: Math.random() * 1.5 + 0.5,
      brightness: Math.random()
    }));

    // Handle Resize Logic
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual size in memory (scaled to account for extra pixel density)
        canvasRef.current.width = clientWidth * dpr;
        canvasRef.current.height = clientHeight * dpr;
        
        // Set visible style size
        canvasRef.current.style.width = `${clientWidth}px`;
        canvasRef.current.style.height = `${clientHeight}px`;
      }
    };

    // Initial Resize
    handleResize();
    
    // Observer for container changes
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);

    requestRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // --- Game Logic ---

  const startGame = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    playClick();
    betAmountRef.current = amount;
    autoCashoutRef.current = parseFloat(autoCashout) || 0;
    hasCashedOutRef.current = false;
    
    setHasCashedOut(false);
    setPayout(0);
    setPhase('COUNTDOWN');
    phaseRef.current = 'COUNTDOWN';
    setMultiplier(1.00);
    
    // Reset Camera
    camRef.current = { x: 0, y: 0, zoomX: 8, zoomY: 2 };
    particlesRef.current = [];

    // Countdown Logic
    let count = 3;
    setCountdown(count);
    playPing();
    
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count > 0) playPing();
      if (count <= 0) {
        clearInterval(timer);
        launch();
      }
    }, 800);
  };

  const launch = () => {
    // Determine Crash Point
    const r = Math.random();
    const crash = Math.max(1.00, Math.floor((HOUSE_EDGE / (1 - r)) * 100) / 100);
    
    crashPointRef.current = crash;
    startTimeRef.current = Date.now();
    setPhase('FLYING');
    phaseRef.current = 'FLYING';
    
    // Explosion at launch pad
    spawnParticles(0, 0, 20, 'SMOKE');
  };

  const cashOut = () => {
    if (phaseRef.current !== 'FLYING' || hasCashedOutRef.current) return;

    const currentMult = getMultiplier(Date.now());
    const win = betAmountRef.current * currentMult;
    
    playWin();
    setHasCashedOut(true);
    hasCashedOutRef.current = true;
    setPayout(win);
    onWin(win);
  };

  const crash = () => {
    setPhase('CRASHED');
    phaseRef.current = 'CRASHED';
    setMultiplier(crashPointRef.current);
    setHistory(prev => [crashPointRef.current, ...prev.slice(0, 8)]);
    
    playExplode();
    setShake(true);
    setTimeout(() => setShake(false), 400);

    if (!hasCashedOutRef.current) {
      onLoss();
    }
  };

  const getMultiplier = (now: number) => {
    const elapsed = (now - startTimeRef.current) / 1000;
    return Math.pow(Math.E, GROWTH_RATE * elapsed * GAME_SPEED);
  };

  // --- Rendering Loop ---

  const gameLoop = () => {
    const now = Date.now();
    let currentMult = 1.00;
    let elapsed = 0;

    if (phaseRef.current === 'FLYING') {
      elapsed = (now - startTimeRef.current) / 1000;
      currentMult = Math.pow(Math.E, GROWTH_RATE * elapsed * GAME_SPEED);
      setMultiplier(currentMult);

      // Auto Cashout
      if (!hasCashedOutRef.current && autoCashoutRef.current > 1.0 && currentMult >= autoCashoutRef.current) {
        cashOut();
      }

      // Check Crash
      if (currentMult >= crashPointRef.current) {
        crash();
      }
    } else if (phaseRef.current === 'CRASHED') {
      currentMult = crashPointRef.current;
      elapsed = Math.log(crashPointRef.current) / GROWTH_RATE;
    }

    draw(elapsed, currentMult);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnParticles = (x: number, y: number, count: number, type: Particle['type']) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (type === 'SHOCKWAVE' ? 2 : type === 'DEBRIS' ? 150 : 50);
      
      particlesRef.current.push({
        id: Math.random(),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        type,
        color: type === 'FLAME' ? '#f59e0b' : type === 'SMOKE' ? '#ffffff' : '#ef4444',
        size: Math.random() * 5 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }
  };

  const draw = (elapsed: number, currentMult: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    // Logical width/height (CSS pixels)
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Reset transform to scale drawing operations by DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    // Clear rect using logical dimensions
    ctx.clearRect(0, 0, w, h);

    // --- Camera Logic ---
    const targetZoomX = Math.max(8, elapsed * 1.3); 
    const targetZoomY = Math.max(2, currentMult * 1.3);
    
    camRef.current.zoomX += (targetZoomX - camRef.current.zoomX) * 0.1;
    camRef.current.zoomY += (targetZoomY - camRef.current.zoomY) * 0.1;

    const maxX = camRef.current.zoomX;
    const maxY = camRef.current.zoomY;

    // Margins
    const padL = 60;
    const padB = 40;
    const graphW = w - padL;
    const graphH = h - padB;

    // Coordinate Mappers
    const mapX = (t: number) => padL + (t / maxX) * graphW;
    const mapY = (m: number) => (h - padB) - ((m - 1) / (maxY - 1)) * graphH;

    // --- Background & Grid ---
    // Dynamic Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Vertical Lines (Time)
    let stepX = 1;
    if (maxX > 15) stepX = 2;
    if (maxX > 30) stepX = 5;
    if (maxX > 60) stepX = 10;

    for (let t = 0; t <= maxX; t += stepX) {
      const x = mapX(t);
      ctx.moveTo(x, 0); ctx.lineTo(x, h - padB);
      // Label
      if (t > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${t}s`, x, h - padB + 15);
      }
    }

    // Horizontal Lines (Mult)
    let stepY = 0.5;
    if (maxY > 5) stepY = 1;
    if (maxY > 10) stepY = 2;
    if (maxY > 50) stepY = 10;
    if (maxY > 100) stepY = 50;

    for (let m = 1; m <= maxY; m += stepY) {
      const y = mapY(m);
      if (y < 0) continue;
      ctx.moveTo(padL, y); ctx.lineTo(w, y);
      // Label
      if (m > 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${m}x`, padL - 10, y);
      }
    }
    ctx.stroke();

    // --- Stars ---
    // Ensure stars wrap around the logical size
    const starW = 3000; 
    const starH = 2000;

    starsRef.current.forEach(star => {
      // Parallax move
      const dx = (elapsed * 20) / star.z;
      const dy = (currentMult * 5) / star.z;
      
      let sx = (star.x - dx) % starW;
      let sy = (star.y + dy) % starH;
      if (sx < 0) sx += starW;
      if (sy > starH) sy -= starH;

      // Map virtual coordinates to screen if possible, or just use modulo relative to screen W/H for simple effect
      // To make it look continuous, we map the large virtual starfield to the current viewport window
      const renderX = sx % w;
      const renderY = sy % h;

      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.beginPath();
      ctx.arc(renderX, renderY, star.size, 0, Math.PI*2);
      ctx.fill();
    });

    // --- Graph Curve ---
    if (phaseRef.current !== 'IDLE' && phaseRef.current !== 'COUNTDOWN') {
      ctx.beginPath();
      ctx.moveTo(mapX(0), mapY(1));
      
      const resolution = 20; 
      const drawSteps = Math.ceil(elapsed * resolution);
      
      for (let i = 1; i <= drawSteps; i++) {
        const t = i / resolution;
        const m = Math.pow(Math.E, GROWTH_RATE * t);
        ctx.lineTo(mapX(t), mapY(m));
      }
      
      if (phaseRef.current === 'CRASHED') {
        ctx.lineTo(mapX(elapsed), mapY(crashPointRef.current));
      }

      const grad = ctx.createLinearGradient(padL, h-padB, w, 0);
      if (phaseRef.current === 'CRASHED') {
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(1, '#b91c1c');
        ctx.shadowColor = '#ef4444';
      } else {
        grad.addColorStop(0, '#10b981'); 
        grad.addColorStop(0.5, '#3b82f6'); 
        grad.addColorStop(1, '#8b5cf6'); 
        ctx.shadowColor = '#8b5cf6';
      }
      
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = grad;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Area Fill
      ctx.lineTo(mapX(elapsed), h - padB);
      ctx.lineTo(mapX(0), h - padB);
      ctx.fillStyle = phaseRef.current === 'CRASHED' 
        ? 'rgba(239, 68, 68, 0.1)' 
        : 'rgba(139, 92, 246, 0.1)';
      ctx.fill();
    }

    // --- Rocket Logic ---
    let rocketX = mapX(0);
    let rocketY = mapY(1);
    let rocketAngle = -Math.PI / 4;

    if (phaseRef.current === 'FLYING' || phaseRef.current === 'CRASHED') {
      rocketX = mapX(elapsed);
      rocketY = mapY(currentMult);
      
      const dt = 0.1;
      const nextT = elapsed + dt;
      const nextM = Math.pow(Math.E, GROWTH_RATE * nextT);
      const dx = mapX(nextT) - rocketX;
      const dy = mapY(nextM) - rocketY;
      rocketAngle = Math.atan2(dy, dx);
    }

    // --- Particle System ---
    
    if (phaseRef.current === 'FLYING') {
      for(let i=0; i<2; i++) {
        const pAngle = rocketAngle + Math.PI + (Math.random() - 0.5) * 0.5;
        const pSpeed = Math.random() * 50 + 20;
        particlesRef.current.push({
          id: Math.random(),
          x: rocketX - Math.cos(rocketAngle) * 20,
          y: rocketY - Math.sin(rocketAngle) * 20,
          vx: Math.cos(pAngle) * pSpeed,
          vy: Math.sin(pAngle) * pSpeed,
          life: 1.0,
          maxLife: 1.0,
          type: 'FLAME',
          color: `hsla(${30 + Math.random()*30}, 100%, 50%, 1)`,
          size: Math.random() * 6 + 2
        });
      }
    } else if (phaseRef.current === 'CRASHED' && particlesRef.current.length === 0) {
       spawnParticles(rocketX, rocketY, 50, 'DEBRIS');
       spawnParticles(rocketX, rocketY, 1, 'SHOCKWAVE');
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      const dt = 0.016;
      
      p.life -= dt * (p.type === 'SHOCKWAVE' ? 1.5 : 1.0);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      if (p.type === 'DEBRIS') p.vy += 9.8 * dt * 10;
      if (p.rotSpeed) p.rotation = (p.rotation || 0) + p.rotSpeed;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      
      if (p.type === 'SHOCKWAVE') {
         ctx.beginPath();
         ctx.arc(0, 0, (1 - p.life) * 100, 0, Math.PI * 2);
         ctx.strokeStyle = `rgba(255, 255, 255, ${p.life})`;
         ctx.lineWidth = 4;
         ctx.stroke();
      } else {
         ctx.rotate((p.rotation || 0) * Math.PI / 180);
         ctx.fillStyle = p.color;
         ctx.globalAlpha = p.life;
         
         if (p.type === 'FLAME') {
           ctx.shadowColor = '#f59e0b';
           ctx.shadowBlur = 10;
         }
         
         ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      }
      
      ctx.restore();
    }

    // --- Draw Rocket ---
    if (phaseRef.current !== 'CRASHED') {
      ctx.save();
      ctx.translate(rocketX, rocketY);
      ctx.rotate(rocketAngle);
      
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 15;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.ellipse(5, -3, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-25, -15);
      ctx.lineTo(-10, -5);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-25, 15);
      ctx.lineTo(-10, 5);
      ctx.fill();

      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-22, 0, 6 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };

  // --- UI Components ---

  return (
    <div className={`flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 ${shake ? 'animate-shake' : ''}`}>
       <style>{`
         @keyframes shake {
           0%, 100% { transform: translate(0, 0); }
           25% { transform: translate(-5px, 5px); }
           50% { transform: translate(5px, -5px); }
           75% { transform: translate(-5px, -5px); }
         }
         .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
       `}</style>

       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Crash">
          <div className="space-y-4 text-gray-300">
             <p>Place your bet before the round starts. Watch the rocket fly and the multiplier increase.</p>
             <p><strong>Cash Out</strong> before the rocket crashes to win your bet multiplied by the current number.</p>
             <p>If the rocket crashes before you cash out, you lose your bet.</p>
          </div>
       </GameInfoModal>

       {/* History Bar */}
       <div className="flex items-center gap-2 overflow-hidden bg-card/30 backdrop-blur-md p-2 rounded-lg border border-white/5">
          <div className="flex items-center gap-2 px-3 text-slate-400 border-r border-white/10 shrink-0">
             <History size={16} /> <span className="text-xs font-bold uppercase hidden md:inline">History</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
             {history.map((val, i) => (
               <div 
                 key={i} 
                 className={`px-3 py-1 rounded text-xs font-mono font-bold border min-w-[60px] text-center
                   ${val >= 10 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                     val >= 2 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                     'text-slate-400 border-slate-700 bg-slate-800/50'}
                 `}
               >
                 {val.toFixed(2)}x
               </div>
             ))}
          </div>
       </div>

       <div className="flex flex-col lg:flex-row gap-6 h-[650px]">
          
          {/* Controls Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 bg-card p-6 rounded-2xl border border-slate-800 shadow-xl shrink-0 z-20 h-fit">
             <div className="flex items-center justify-between text-white mb-4">
                <div className="flex items-center gap-2">
                  <Rocket size={24} className="text-accent" />
                  <span className="text-xl font-bold uppercase tracking-wider">Crash</span>
                </div>
                <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white transition-colors">
                  <HelpCircle size={20} />
                </button>
             </div>

             {/* Manual Bet */}
             <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                   <span>Bet Amount</span>
                   <span>${(parseFloat(betAmount)||0).toFixed(2)}</span>
                </div>
                <div className="relative group">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                   <input 
                     type="number" 
                     value={betAmount}
                     onChange={(e) => setBetAmount(e.target.value)}
                     disabled={phase !== 'IDLE' && phase !== 'CRASHED'}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-white font-mono font-bold text-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                   />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                   <button onClick={() => setBetAmount((parseFloat(betAmount)/2).toFixed(2))} disabled={phase !== 'IDLE' && phase !== 'CRASHED'} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2 rounded-lg text-gray-400 transition-colors">½</button>
                   <button onClick={() => setBetAmount((parseFloat(betAmount)*2).toFixed(2))} disabled={phase !== 'IDLE' && phase !== 'CRASHED'} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2 rounded-lg text-gray-400 transition-colors">2x</button>
                </div>
             </div>

             {/* Auto Cashout */}
             <div className="space-y-1 mt-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Auto Cashout</label>
                <div className="relative">
                   <input 
                      type="number" 
                      value={autoCashout}
                      onChange={(e) => setAutoCashout(e.target.value)}
                      disabled={phase !== 'IDLE' && phase !== 'CRASHED'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono font-bold focus:border-accent outline-none transition-all"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">X</span>
                </div>
             </div>

             <div className="mt-auto pt-6 border-t border-slate-800">
               {phase === 'IDLE' || phase === 'CRASHED' ? (
                 <button 
                   onClick={startGame}
                   className="w-full bg-accent hover:bg-accent-hover text-background font-black text-xl py-5 rounded-xl shadow-[0_0_30px_rgba(0,231,1,0.3)] hover:shadow-[0_0_40px_rgba(0,231,1,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                   PLACE BET
                 </button>
               ) : phase === 'COUNTDOWN' ? (
                 <button 
                   disabled
                   className="w-full bg-slate-700 text-gray-400 font-bold text-lg py-5 rounded-xl cursor-not-allowed border-2 border-slate-600 border-dashed"
                 >
                   Prepare...
                 </button>
               ) : (
                 <button 
                   onClick={cashOut}
                   disabled={hasCashedOut}
                   className={`w-full font-black text-2xl py-5 rounded-xl shadow-lg transition-all active:scale-95 flex flex-col items-center leading-none gap-1
                     ${hasCashedOut 
                       ? 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700' 
                       : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]'}
                   `}
                 >
                   <span>{hasCashedOut ? "CASHED" : "CASH OUT"}</span>
                   {!hasCashedOut && (
                     <span className="text-sm font-mono opacity-90 tracking-wide font-medium">
                       @ {multiplier.toFixed(2)}x
                     </span>
                   )}
                 </button>
               )}
             </div>
          </div>

          {/* Game Canvas Container */}
          <div ref={containerRef} className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 bg-[#0b1221] shadow-2xl group min-h-[400px]">
             <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
             
             {/* HUD Overlay */}
             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                
                {phase === 'COUNTDOWN' && (
                  <div className="text-8xl font-black text-white animate-ping-slow drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                    {countdown}
                  </div>
                )}

                {(phase === 'FLYING' || phase === 'CRASHED') && (
                   <div className="flex flex-col items-center">
                      <div className={`text-7xl md:text-9xl font-black font-mono tracking-tighter transition-colors duration-100 drop-shadow-2xl
                        ${phase === 'CRASHED' ? 'text-red-500' : multiplier > 10 ? 'text-yellow-400' : 'text-white'}
                      `}>
                        {multiplier.toFixed(2)}x
                      </div>
                      
                      {phase === 'CRASHED' && (
                        <div className="mt-4 bg-red-500/20 backdrop-blur border border-red-500 px-6 py-2 rounded-full flex items-center gap-2 animate-bounce">
                           <AlertTriangle className="text-red-500" />
                           <span className="text-red-500 font-bold uppercase tracking-widest">Crashed</span>
                        </div>
                      )}

                      {hasCashedOut && phase !== 'CRASHED' && (
                        <div className="mt-4 bg-emerald-500/20 backdrop-blur border border-emerald-500 px-8 py-3 rounded-xl flex flex-col items-center animate-in zoom-in slide-in-from-bottom-4">
                           <span className="text-emerald-400 font-bold uppercase text-xs tracking-widest mb-1">You Won</span>
                           <div className="flex items-center gap-2">
                              <Trophy size={20} className="text-emerald-400" />
                              <span className="text-white font-mono font-bold text-2xl">${payout.toFixed(2)}</span>
                           </div>
                        </div>
                      )}
                   </div>
                )}
                
                {phase === 'IDLE' && (
                  <div className="text-center space-y-2 animate-pulse">
                     <div className="inline-flex p-4 rounded-full bg-slate-800/50 border border-white/10 mb-4">
                       <Rocket size={48} className="text-slate-500" />
                     </div>
                     <h3 className="text-2xl font-bold text-white tracking-widest uppercase">Ready to Launch</h3>
                  </div>
                )}

             </div>

             {/* Network Stats (Fake) */}
             <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 backdrop-blur px-3 py-1.5 rounded-full border border-white/5 text-[10px] font-mono text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
                <span className="border-l border-white/10 pl-2 ml-1">24ms</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Crash;
