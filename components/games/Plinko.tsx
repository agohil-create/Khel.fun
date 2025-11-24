import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Zap, HelpCircle, Lock } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface PlinkoProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  path: number[]; // 0 = Left, 1 = Right
  currentRow: number; // Tracks which row decision we are currently processing
  finished: boolean;
  trail: {x: number, y: number}[];
  wager: number;
  // Animation states
  isInBucket?: boolean;
  bucketIndex?: number;
  opacity?: number;
}

const Plinko: React.FC<PlinkoProps> = ({ onBet, onWin }) => {
  const [betAmount, setBetAmount] = useState<string>('10');
  const [risk, setRisk] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [rows, setRows] = useState<number>(16);
  const [lastMulti, setLastMulti] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const bucketHitTimes = useRef<Map<number, number>>(new Map());

  // --- Configuration ---
  const COLORS = {
    background: '#0f212e',
    peg: '#e2e8f0',
    pegActive: '#00e701',
    ball: '#00e701',
    text: '#ffffff',
  };

  // Physics Config (Pixels per Second)
  const PHYSICS = {
    gravity: 800, 
    restitution: 0.5, // Bounciness (0-1)
    frictionAir: 0.98, // Air resistance per second approx
    guidanceForce: 15, // How strongly we push the ball to the correct side of the peg
  };

  // --- Multiplier Logic ---
  const multipliers = useMemo(() => {
    const count = rows + 1;
    const result = [];
    const center = Math.floor(count / 2);
    
    // Tightened profiles for higher difficulty/house edge
    // Curve increased to make high multipliers rarer
    // Center values reduced to < 1.0 to ensure house edge on most drops
    const profiles = {
      Low: { center: 0.5, edge: 5, curve: 3.0 }, // Was 2.6
      Medium: { center: 0.2, edge: 15, curve: 4.5 }, // Was 4.0
      High: { center: 0.0, edge: 100, curve: 6.0 } // Was 5.5
    };
    
    const conf = profiles[risk];

    for (let i = 0; i < count; i++) {
      const dist = Math.abs(i - center);
      const normalizedDist = dist / center; // 0 to 1
      
      let val;
      if (dist === 0) val = conf.center;
      else {
         val = conf.center + (conf.edge - conf.center) * Math.pow(normalizedDist, conf.curve);
      }

      if (val < 1) val = Math.floor(val * 10) / 10;
      else if (val < 10) val = Math.floor(val * 10) / 10;
      else val = Math.floor(val);
      
      // Prevent negative zero or weird float issues
      if (val < 0) val = 0;

      result.push(val);
    }
    return result;
  }, [rows, risk]);

  const getBucketColor = (mult: number) => {
    if (mult >= 50) return '#ef4444';
    if (mult >= 10) return '#f97316';
    if (mult >= 3) return '#eab308';
    if (mult >= 1.5) return '#3b82f6';
    return '#1a2c38';
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 50;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 2 + 1
      });
    }
  };

  // --- Path Generation (Weighted) ---
  const generateWeightedPath = useCallback((targetRows: number, currentMultipliers: number[]) => {
      // 1. Calculate Weights (Inverse of multiplier)
      // We want high multipliers to be rare, but not impossible.
      // Weight = 1 / multiplier. 
      const weights = currentMultipliers.map(m => 1 / Math.max(m, 0.01));
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      // 2. Select Target Bucket based on weights
      let r = Math.random() * totalWeight;
      let targetBucket = 0;
      for (let i = 0; i < weights.length; i++) {
          r -= weights[i];
          if (r <= 0) {
              targetBucket = i;
              break;
          }
      }

      // 3. Generate Path to reach Target Bucket
      // A bucket index K in an N-row game corresponds to exactly K "Right" turns.
      const rightTurns = targetBucket;
      const leftTurns = targetRows - rightTurns;
      
      const path = [
          ...Array(rightTurns).fill(1), // 1 = Right
          ...Array(leftTurns).fill(0)   // 0 = Left
      ];

      // Shuffle the path to make the route random, while guaranteeing the destination
      for (let i = path.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [path[i], path[j]] = [path[j], path[i]];
      }

      return path;
  }, []);

  // --- Game Loop ---
  const update = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1); // Delta time in seconds, capped at 100ms
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Dimensions ---
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    // Gap calculation
    const paddingTop = 40;
    const paddingBottom = 40; 
    const availableH = height - paddingTop - paddingBottom;
    const gap = Math.min(width / (rows + 5), availableH / (rows + 2));
    const pegRadius = Math.max(2, gap * 0.12);
    const ballRadius = gap * 0.22; 
    const startY = paddingTop;
    const centerX = width / 2;
    const bucketY = startY + rows * gap + 25;
    const bucketW = gap * 0.95;
    const bucketH = 24;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Pegs
    ctx.fillStyle = COLORS.peg;
    for (let r = 0; r < rows; r++) {
       const pegsInRow = r + 3; 
       for (let i = 0; i < pegsInRow; i++) {
           const px = centerX + (i - (pegsInRow - 1) / 2) * gap;
           const py = startY + r * gap;
           ctx.beginPath();
           ctx.arc(px, py, pegRadius, 0, Math.PI * 2);
           ctx.fill();
       }
    }

    // 2. Draw Buckets
    const totalBuckets = multipliers.length; 
    multipliers.forEach((mult, i) => {
       const offsetFromCenter = i - (totalBuckets - 1) / 2;
       const bx = centerX + offsetFromCenter * gap;
       
       const lastHit = bucketHitTimes.current.get(i);
       let offsetY = 0;
       let isHit = false;
       if (lastHit) {
           const age = Date.now() - lastHit;
           if (age < 300) {
               isHit = true;
               offsetY = Math.sin((age / 300) * Math.PI) * 8; 
           }
       }
       
       const currentBucketY = bucketY + offsetY;
       const color = getBucketColor(mult);

       ctx.fillStyle = isHit ? '#ffffff' : '#1a2c38';
       ctx.beginPath();
       ctx.roundRect(bx - bucketW/2, currentBucketY, bucketW, bucketH, 4);
       ctx.fill();

       ctx.fillStyle = color;
       ctx.globalAlpha = isHit ? 1 : 0.3;
       if (isHit) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
       }
       ctx.beginPath();
       ctx.roundRect(bx - bucketW/2 + 1, currentBucketY + 1, bucketW - 2, bucketH - 2, 3);
       ctx.fill();
       ctx.shadowBlur = 0;
       ctx.globalAlpha = 1;

       ctx.fillStyle = '#fff';
       ctx.font = `bold ${Math.min(11, gap * 0.35)}px "Inter"`;
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillText(`${mult}x`, bx, currentBucketY + bucketH / 2);
    });

    // 3. Update & Draw Balls
    const activeBalls: Ball[] = [];

    ballsRef.current.forEach((ball) => {
       if (ball.finished) return;

       if (ball.isInBucket) {
           // Capture Animation
           const bucketIdx = ball.bucketIndex!;
           const offsetFromCenter = bucketIdx - (multipliers.length - 1) / 2;
           const targetX = centerX + offsetFromCenter * gap;
           const targetY = bucketY + bucketH / 2; 

           ball.x += (targetX - ball.x) * 10 * dt;
           ball.y += (targetY - ball.y) * 10 * dt;
           ball.opacity = (ball.opacity ?? 1) - 2 * dt;
           
           if ((ball.opacity ?? 1) <= 0) ball.finished = true;
           activeBalls.push(ball);

       } else {
           // --- REACTIVE PHYSICS UPDATE ---
           
           // 1. Gravity
           ball.vy += PHYSICS.gravity * dt;
           
           // 2. Air Resistance (Simple drag)
           // ball.vx *= Math.pow(PHYSICS.frictionAir, dt * 60); // approximate frame scaling
           // ball.vy *= Math.pow(PHYSICS.frictionAir, dt * 60);

           // 3. Move
           ball.x += ball.vx * dt;
           ball.y += ball.vy * dt;

           // 4. Boundary Walls (Funnel)
           // Keep ball roughly within the pyramid bounds + 1 gap margin
           const estimatedRow = (ball.y - startY) / gap;
           const rowWidth = (estimatedRow + 3) * gap;
           const leftBound = centerX - rowWidth/2 - gap;
           const rightBound = centerX + rowWidth/2 + gap;

           if (ball.x < leftBound) {
               ball.x = leftBound;
               ball.vx *= -0.5;
               ball.vx += 50; // push back in
           } else if (ball.x > rightBound) {
               ball.x = rightBound;
               ball.vx *= -0.5;
               ball.vx -= 50;
           }

           // 5. Collision with Pegs
           // We check the "current row" pegs and the "next row" pegs
           const checkRow = Math.round(estimatedRow);
           if (checkRow >= 0 && checkRow < rows) {
               const pegsInRow = checkRow + 3;
               const py = startY + checkRow * gap;

               // Iterate pegs in this row
               for (let i = 0; i < pegsInRow; i++) {
                   const px = centerX + (i - (pegsInRow - 1) / 2) * gap;
                   
                   // Distance check
                   const dx = ball.x - px;
                   const dy = ball.y - py;
                   const dist = Math.sqrt(dx*dx + dy*dy);
                   const minDist = pegRadius + ballRadius;

                   if (dist < minDist) {
                       // COLLISION RESOLUTION
                       
                       // A. Position Correction (Push out)
                       // Normalized collision vector
                       const nx = dx / dist;
                       const ny = dy / dist;
                       const overlap = minDist - dist;
                       
                       ball.x += nx * overlap;
                       ball.y += ny * overlap;

                       // B. Velocity Reflection
                       // v' = v - 2 * (v . n) * n
                       const dot = ball.vx * nx + ball.vy * ny;
                       ball.vx = (ball.vx - 2 * dot * nx) * PHYSICS.restitution;
                       ball.vy = (ball.vy - 2 * dot * ny) * PHYSICS.restitution;

                       // C. Guidance / Railroading
                       // If this is the "decision peg" for this row step, we nudge it.
                       // The ball's path array determines if it should go Left or Right of the peg.
                       // However, physically, the ball is usually falling ONTO a peg from the row above.
                       // So the decision happens when it hits the peg.
                       
                       // We map the row index to the path step.
                       // Since collision can happen multiple times per row, we only guide if velocity is low or decision needed.
                       if (checkRow < ball.path.length) {
                           const desiredDirection = ball.path[checkRow] === 1 ? 1 : -1; // 1 = Right, -1 = Left
                           
                           // Add a guidance force
                           // If desired is Right, we want positive Vx.
                           // We add impulse in desired direction + random jitter
                           const jitter = (Math.random() - 0.5) * 50;
                           ball.vx += (desiredDirection * 150 + jitter) * dt * 5; 
                           
                           // Subtle white sparkle instead of full opacity white
                           spawnParticles(px, py, 'rgba(255, 255, 255, 0.3)', 1);
                       }
                   }
               }
           }

           // Trail
           ball.trail.push({x: ball.x, y: ball.y});
           if (ball.trail.length > 8) ball.trail.shift();

           // 6. Win Detection
           const hitY = bucketY - bucketH * 0.5;
           if (ball.y > hitY) {
               ball.isInBucket = true;
               
               // Calculate actual bucket based on X position to be visually accurate
               // (Even though path was pre-calculated, physics might have drifted slightly, 
               // but guidance forces should keep it close. We snap to nearest bucket.)
               const relativeX = ball.x - centerX;
               const bucketIndexRaw = Math.round(relativeX / gap) + (totalBuckets - 1) / 2;
               const bucketIndex = Math.max(0, Math.min(bucketIndexRaw, totalBuckets - 1));

               ball.bucketIndex = bucketIndex;
               bucketHitTimes.current.set(bucketIndex, Date.now());

               const mult = multipliers[bucketIndex];
               setLastMulti(mult);
               
               if (mult > 0) {
                   onWin(ball.wager * mult);
               }
               // Note: If multiplier is 0, we don't call onWin, effectively a loss.
               
               spawnParticles(ball.x, bucketY, getBucketColor(mult), 12);
           }
           
           activeBalls.push(ball);
       }

       // Render Ball
       ctx.globalAlpha = ball.opacity ?? 1;
       if (ball.trail.length > 1) {
           ctx.beginPath();
           ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
           for (let t=1; t<ball.trail.length; t++) ctx.lineTo(ball.trail[t].x, ball.trail[t].y);
           ctx.strokeStyle = COLORS.ball;
           ctx.lineWidth = ballRadius * 0.8;
           ctx.lineCap = 'round';
           ctx.globalAlpha = (ball.opacity ?? 1) * 0.4;
           ctx.stroke();
       }
       ctx.globalAlpha = ball.opacity ?? 1;
       ctx.fillStyle = COLORS.ball;
       ctx.shadowColor = COLORS.ball;
       ctx.shadowBlur = 10;
       ctx.beginPath();
       ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
       ctx.fill();
       ctx.shadowBlur = 0;
       ctx.globalAlpha = 1;
    });

    ballsRef.current = activeBalls;
    setIsDropping(activeBalls.length > 0);

    // 4. Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
       const p = particlesRef.current[i];
       p.life -= 2 * dt;
       p.x += p.vx * dt;
       p.y += p.vy * dt;
       
       if (p.life <= 0) {
           particlesRef.current.splice(i, 1);
           continue;
       }
       ctx.fillStyle = p.color;
       ctx.globalAlpha = p.life;
       ctx.beginPath();
       ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
       ctx.fill();
       ctx.globalAlpha = 1;
    }

    animationRef.current = requestAnimationFrame(update);
  };

  // Resize Handler
  useEffect(() => {
     const handleResize = () => {
        if (containerRef.current && canvasRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            const dpr = window.devicePixelRatio || 1;
            canvasRef.current.width = clientWidth * dpr;
            canvasRef.current.height = clientHeight * dpr;
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);
            canvasRef.current.style.width = `${clientWidth}px`;
            canvasRef.current.style.height = `${clientHeight}px`;
        }
     };
     window.addEventListener('resize', handleResize);
     handleResize();
     return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    bucketHitTimes.current.clear();
    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationRef.current);
  }, [rows, risk]); 

  const dropBall = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    // Use weighted path generation
    const path = generateWeightedPath(rows, multipliers);

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas ? canvas.width / dpr : 800;
    const centerX = logicalWidth / 2;
    
    // Slight random offset at spawn
    const rOffset = (Math.random() - 0.5) * 4; 

    ballsRef.current.push({
        id: Date.now(),
        x: centerX + rOffset,
        y: 20,
        vx: 0,
        vy: 0, // Starts with 0 vertical velocity
        radius: 6, 
        path,
        currentRow: -1,
        finished: false,
        trail: [],
        wager: amount,
        isInBucket: false,
        opacity: 1
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 h-[calc(100vh-100px)] min-h-[600px]">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Plinko">
         <div className="space-y-4">
           <section>
             <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
             <p>Drop a ball from the top of the pyramid and watch it bounce down to the multipliers at the bottom.</p>
           </section>
           <section>
             <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
             <ul className="list-disc pl-4 space-y-2 text-gray-400">
               <li>Select your <strong>Bet Amount</strong>.</li>
               <li>Choose a <strong>Risk Level</strong> (Low, Medium, High).</li>
               <li>Choose the <strong>Number of Rows</strong> (8-16).</li>
               <li>Click <strong>Bet</strong> to drop a ball.</li>
             </ul>
           </section>
         </div>
      </GameInfoModal>

      {/* Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-card p-6 rounded-xl flex flex-col gap-6 shadow-xl border border-slate-800/50 overflow-y-auto">
        <div className="flex items-center justify-between text-accent mb-2">
           <div className="flex items-center gap-2">
             <Zap size={20} className="fill-current" />
             <span className="text-sm font-bold uppercase tracking-wider">Plinko</span>
           </div>
           <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white transition-colors">
              <HelpCircle size={18} />
           </button>
        </div>

        {/* Bet Amount */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
            <label>Bet Amount</label>
            <span>${parseFloat(betAmount || '0').toFixed(2)}</span>
          </div>
          <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</div>
             <input 
               type="number" 
               value={betAmount}
               onChange={(e) => setBetAmount(e.target.value)}
               className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white font-mono focus:border-accent outline-none transition-colors"
             />
          </div>
          <div className="grid grid-cols-2 gap-2">
             <button onClick={() => setBetAmount((parseFloat(betAmount)/2).toFixed(2))} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2 rounded text-gray-400 transition-colors">½</button>
             <button onClick={() => setBetAmount((parseFloat(betAmount)*2).toFixed(2))} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2 rounded text-gray-400 transition-colors">2x</button>
          </div>
        </div>

        {/* Risk Level */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Risk</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
             {['Low', 'Medium', 'High'].map(r => (
               <button
                 key={r}
                 onClick={() => setRisk(r as any)}
                 disabled={isDropping} // Lock risk while playing
                 className={`py-2 rounded text-xs font-bold transition-all 
                   ${risk === r ? 'bg-card text-accent shadow shadow-black/20' : 'text-gray-500 hover:text-white'}
                   ${isDropping ? 'opacity-50 cursor-not-allowed' : ''}
                 `}
               >
                 {r}
               </button>
             ))}
          </div>
        </div>

        {/* Row Count */}
        <div>
           <div className="flex justify-between mb-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Rows</label>
              <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                 {rows}
                 {isDropping && <Lock size={10} className="text-gray-400" />}
              </span>
           </div>
           <input 
             type="range" 
             min="8" max="16" step="1"
             value={rows}
             onChange={(e) => setRows(Number(e.target.value))}
             disabled={isDropping}
             className={`w-full accent-accent h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${isDropping ? 'opacity-50 cursor-not-allowed' : ''}`}
           />
           <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
             <span>8</span>
             <span>12</span>
             <span>16</span>
           </div>
        </div>

        {/* Bet Button */}
        <button 
            onClick={dropBall}
            className="w-full bg-accent hover:bg-accent-hover text-background font-bold text-lg py-4 rounded-lg shadow-[0_0_20px_rgba(0,231,1,0.2)] transition-all active:scale-95 mt-auto flex items-center justify-center gap-2"
          >
            <span>Bet</span>
        </button>
      </div>

      {/* Game Canvas Area */}
      <div ref={containerRef} className="flex-1 bg-[#0f212e] rounded-xl border border-slate-800 relative overflow-hidden shadow-2xl flex items-center justify-center">
         <canvas ref={canvasRef} className="block w-full h-full" />
         
         {lastMulti !== null && (
            <div 
              key={Date.now()}
              className="absolute top-8 right-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none"
            >
              <div className="bg-slate-800/90 backdrop-blur border border-slate-600 px-5 py-3 rounded-xl shadow-2xl flex flex-col items-center gap-1">
                 <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Win</span>
                 <div className={`text-2xl font-black ${lastMulti >= 1 ? 'text-emerald-400' : 'text-gray-400'}`}>
                   {lastMulti}x
                 </div>
              </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Plinko;