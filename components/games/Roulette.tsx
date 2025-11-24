
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Undo2, Trash2, RotateCcw, History, HelpCircle, Trophy, Volume2, VolumeX } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface RouletteProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

// --- Constants ---

// European Roulette Sequence (Clockwise starting from 0)
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const BLACK_NUMBERS = new Set([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]);

const CHIP_VALUES = [1, 5, 10, 25, 100, 500];

// --- Physics Constants ---
const FRICTION_WHEEL = 0.996; // Very low friction for long spin
const FRICTION_BALL = 0.991;  // Low air resistance
const RIM_RADIUS = 185;       // Radius where ball spins initially
const POCKET_RADIUS = 135;    // Radius of the number pockets
const DROP_THRESHOLD = 0.05;  // Velocity at which ball starts dropping from rim

// --- Helper Functions ---

const getNumberColor = (num: number) => {
  if (num === 0) return '#10b981'; // Emerald
  return RED_NUMBERS.has(num) ? '#ef4444' : '#1e293b'; // Red : Slate
};

const getChipColor = (val: number) => {
  if (val === 1) return 'bg-slate-300 border-slate-400 text-slate-800';
  if (val === 5) return 'bg-red-500 border-red-600 text-white';
  if (val === 10) return 'bg-blue-500 border-blue-600 text-white';
  if (val === 25) return 'bg-emerald-500 border-emerald-600 text-white';
  if (val === 100) return 'bg-slate-900 border-slate-700 text-white';
  return 'bg-purple-500 border-purple-600 text-white';
};

const ChipStack = ({ amount }: { amount: number }) => {
  if (amount === 0) return null;
  const chips: number[] = [];
  let rem = amount;
  // Greedy chip breakdown
  [500, 100, 25, 10, 5, 1].forEach(val => {
     while(rem >= val && chips.length < 5) { 
        chips.push(val);
        rem -= val;
     }
  });

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col-reverse items-center justify-center pointer-events-none z-10 filter drop-shadow-lg">
       {chips.map((val, i) => (
          <div 
            key={i}
            className={`
              w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-dashed flex items-center justify-center text-[8px] md:text-[10px] font-bold shadow-sm
              ${getChipColor(val)}
              transition-transform
            `}
            style={{ marginBottom: i > 0 ? '-18px' : '0', transform: `translateY(${i * -2}px)` }}
          >
             {i === chips.length - 1 && <span>{amount >= 1000 ? (amount/1000).toFixed(1)+'k' : amount}</span>}
          </div>
       ))}
    </div>
  );
};

const Roulette: React.FC<RouletteProps> = ({ onBet, onWin, onLoss }) => {
  // --- Game State ---
  const [bets, setBets] = useState<Record<string, number>>({});
  const [lastBets, setLastBets] = useState<Record<string, number>>({}); 
  const [selectedChip, setSelectedChip] = useState<number>(10);
  const [gameState, setGameState] = useState<'IDLE' | 'SPINNING' | 'SETTLING' | 'RESULT'>('IDLE');
  const [lastWinNumber, setLastWinNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [winningAmount, setWinningAmount] = useState<number>(0);
  const [showInfo, setShowInfo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Refs for loop access to prevent stale closures
  const gameStateRef = useRef(gameState);
  const betsRef = useRef(bets);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { betsRef.current = bets; }, [bets]);
  
  // Physics State (Mutable for performance loop)
  const physics = useRef({
    wheelAngle: 0,
    wheelVelocity: 0,
    ballAngle: 0,
    ballVelocity: 0,
    ballRadius: RIM_RADIUS,
    ballHeight: 0, // Z-axis for bouncing
    ballState: 'RIM' as 'RIM' | 'DROPPING' | 'POCKET',
  });

  // --- Drawing Layers ---

  const drawBase = (ctx: CanvasRenderingContext2D) => {
    // 1. Outer Bowl (Static)
    const rimGrad = ctx.createRadialGradient(0, 0, 180, 0, 0, 220);
    rimGrad.addColorStop(0, '#271a0c'); // Dark Wood
    rimGrad.addColorStop(0.5, '#5c3a13'); // Mid Wood
    rimGrad.addColorStop(1, '#1a0f05'); // Edge
    
    ctx.beginPath();
    ctx.arc(0, 0, 220, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // 2. Ball Track (Static Metal/Wood mix)
    ctx.beginPath();
    ctx.arc(0, 0, RIM_RADIUS + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b18';
    ctx.fill();
    
    // Metallic Rim Accent
    ctx.beginPath();
    ctx.arc(0, 0, RIM_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawSpinner = (ctx: CanvasRenderingContext2D, angle: number) => {
    ctx.save();
    ctx.rotate(angle);

    // 1. Pocket Ring Background
    ctx.beginPath();
    ctx.arc(0, 0, RIM_RADIUS - 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a'; // Dark slate backing
    ctx.fill();

    // 2. Pockets & Numbers
    const segmentAngle = (Math.PI * 2) / 37;
    
    WHEEL_NUMBERS.forEach((num, i) => {
      const startAngle = i * segmentAngle;
      const endAngle = (i + 1) * segmentAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, RIM_RADIUS - 10, startAngle, endAngle);
      ctx.fillStyle = getNumberColor(num);
      ctx.fill();

      // Divider Lines (Frets)
      ctx.beginPath();
      const divAngle = startAngle;
      ctx.moveTo(Math.cos(divAngle) * POCKET_RADIUS, Math.sin(divAngle) * POCKET_RADIUS);
      ctx.lineTo(Math.cos(divAngle) * (RIM_RADIUS - 10), Math.sin(divAngle) * (RIM_RADIUS - 10));
      ctx.strokeStyle = '#e2e8f0'; // Silver Frets
      ctx.lineWidth = 1;
      ctx.stroke();

      // Numbers
      ctx.save();
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.translate(RIM_RADIUS - 25, 0);
      ctx.rotate(Math.PI / 2); // Orient text inward
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), 0, 0);
      ctx.restore();
    });

    // 3. Center Turret (Spinner)
    // Metallic Gradient
    const turretGrad = ctx.createRadialGradient(-20, -20, 0, 0, 0, 80);
    turretGrad.addColorStop(0, '#fcd34d'); // Gold Highlight
    turretGrad.addColorStop(0.5, '#b45309'); // Dark Gold
    turretGrad.addColorStop(1, '#78350f'); // Bronze

    ctx.beginPath();
    ctx.arc(0, 0, POCKET_RADIUS - 5, 0, Math.PI * 2);
    ctx.fillStyle = turretGrad;
    ctx.fill();

    // Turret Details (Handles)
    const handleCount = 4;
    for(let i=0; i<handleCount; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / handleCount) * i);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(80, 20); ctx.lineTo(80, -20);
        ctx.fill();
        ctx.restore();
    }
    
    // Center Cap
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#27272a';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  };

  const drawBall = (ctx: CanvasRenderingContext2D, p: any) => {
    const x = Math.cos(p.ballAngle) * p.ballRadius;
    const y = Math.sin(p.ballAngle) * p.ballRadius;
    const ballSize = 6;

    // Shadow (Offset based on height)
    ctx.beginPath();
    // Shadow moves away from light/ball center as ball jumps
    const shadowOffset = 2 + p.ballHeight * 0.5;
    ctx.arc(x + shadowOffset, y + shadowOffset, ballSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.1, 0.4 - p.ballHeight/10)})`;
    ctx.fill();

    // Ball
    // Simple 3D shading
    const ballGrad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, ballSize);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(1, '#d1d5db');
    
    ctx.beginPath();
    // Ball appears larger/closer when it bounces up (z-axis simulation)
    const visualSize = ballSize + p.ballHeight * 0.2;
    ctx.arc(x, y - p.ballHeight, visualSize, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();
  };

  // --- Physics Loop ---

  const updatePhysics = () => {
    const p = physics.current;
    
    // 1. Wheel Physics
    p.wheelAngle += p.wheelVelocity;
    p.wheelVelocity *= FRICTION_WHEEL; // Decay

    // 2. Ball Physics
    p.ballAngle += p.ballVelocity;
    p.ballVelocity *= FRICTION_BALL; // Decay

    // 3. State Machine
    if (p.ballState === 'RIM') {
        // Drop logic: When velocity drops, gravity pulls ball inward
        if (Math.abs(p.ballVelocity) < DROP_THRESHOLD) {
            p.ballState = 'DROPPING';
        }
    } else if (p.ballState === 'DROPPING') {
        // Spiral inward
        p.ballRadius -= 0.4; // Smoother drop rate
        
        // Random Noise (Wobble)
        p.ballRadius += (Math.random() - 0.5) * 0.8;

        // Collision with pockets?
        if (p.ballRadius <= POCKET_RADIUS + 8) {
            p.ballState = 'POCKET';
            // Initial impact bounce
            p.ballHeight = 4 + Math.random() * 3;
            p.ballVelocity *= 0.8; // Dampen velocity on impact
        }
    } else if (p.ballState === 'POCKET') {
        // Relative velocity between ball and wheel pockets
        const relVel = p.ballVelocity - p.wheelVelocity;

        // If ball is moving relative to wheel, it's bouncing over pockets
        if (Math.abs(relVel) > 0.003 || p.ballHeight > 0.01) {
            
            // Decelerate relative velocity (friction with frets/pockets)
            // Lower drag = more skidding/bouncing over numbers
            const drag = 0.02; 
            p.ballVelocity -= relVel * drag;

            // Bouncing Logic
            if (p.ballHeight <= 0) {
                // If moving fast relative to wheel, chance to hit a fret and bounce up
                // The faster it moves, the more likely to bounce
                if (Math.random() < Math.abs(relVel) * 15) {
                    p.ballHeight = Math.random() * 2.5 + 1;
                    p.ballVelocity *= 0.85; // Loss of momentum on bounce
                }
            } else {
                // Gravity
                p.ballHeight = Math.max(0, p.ballHeight - 0.25); 
            }
        } else {
            // Locked in
            p.ballVelocity = p.wheelVelocity;
            p.ballHeight = 0;
            
            // Optional: Snap slowly to center of nearest pocket for visual perfection
            // This is handled implicitly by the relative velocity reaching 0
        }
    }
  };

  const renderLoop = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resizing / DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Check if canvas physical size matches visual size * dpr
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);
    
    if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
    }

    const width = rect.width;
    const height = rect.height;

    // Reset Transform & Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity (physical pixels)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply DPI Scale
    ctx.scale(dpr, dpr);

    // Center & Fit
    ctx.translate(width / 2, height / 2);
    
    // Scale to fit: Base drawing is ~220 radius (440 diameter)
    // Add some padding (e.g. 20px)
    const availableSize = Math.min(width, height) - 20;
    const scale = availableSize / 440;
    ctx.scale(scale, scale);

    // Update Logic (using Refs for fresh state)
    const currentState = gameStateRef.current;
    
    if (currentState === 'SPINNING' || currentState === 'SETTLING') {
        updatePhysics();
        
        const p = physics.current;
        // Check for end of spin
        // Ball must be in pocket, relative velocity zero, and wheel stopped
        if (p.ballState === 'POCKET' && 
            Math.abs(p.ballVelocity - p.wheelVelocity) < 0.001 && 
            Math.abs(p.wheelVelocity) < 0.001 &&
            currentState === 'SPINNING') {
                determineResult();
        }
    }

    // Render using logical 0,0 center (due to translate)
    drawBase(ctx);
    drawSpinner(ctx, physics.current.wheelAngle);
    drawBall(ctx, physics.current);

    // Gloss Overlay (Reflection)
    const grad = ctx.createLinearGradient(-200, -200, 200, 200);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.02)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.02)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(0, 0, 210, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();

    animationRef.current = requestAnimationFrame(renderLoop);
  };

  // --- Betting Logic ---

  const spin = () => {
    const totalBet = Object.values(bets).reduce((a: number, b: number) => a + b, 0);
    if (totalBet === 0 || gameState !== 'IDLE') return;
    if (!onBet(totalBet)) return;

    setLastBets(bets);
    setWinningAmount(0);
    setLastWinNumber(null);
    setGameState('SPINNING');

    // Init Physics for Spin
    const dir = Math.random() > 0.5 ? 1 : -1;
    // Increased initial velocities for longer spin duration
    physics.current.wheelVelocity = (0.08 + Math.random() * 0.04) * dir; // Wheel spins one way
    physics.current.ballVelocity = (0.35 + Math.random() * 0.1) * -dir; // Ball thrown hard opposite
    physics.current.ballRadius = RIM_RADIUS;
    physics.current.ballHeight = 0;
    physics.current.ballState = 'RIM';
  };

  const determineResult = () => {
    setGameState('RESULT');
    
    // Calculate winning number based on angles
    const p = physics.current;
    // Normalize angles to 0-2PI
    let ballA = p.ballAngle % (Math.PI * 2);
    let wheelA = p.wheelAngle % (Math.PI * 2);
    if (ballA < 0) ballA += Math.PI * 2;
    if (wheelA < 0) wheelA += Math.PI * 2;

    // The wheel numbers start at 0 radians and go clockwise.
    // The relative angle of the ball on the wheel:
    let relAngle = (ballA - wheelA) % (Math.PI * 2);
    if (relAngle < 0) relAngle += Math.PI * 2;

    // Segment size
    const seg = (Math.PI * 2) / 37;
    // Index
    const index = Math.floor(relAngle / seg);
    const winNum = WHEEL_NUMBERS[index];

    setLastWinNumber(winNum);
    setHistory(prev => [winNum, ...prev].slice(0, 10));
    checkWin(winNum);

    // Reset after delay
    setTimeout(() => {
        setBets({});
        setGameState('IDLE');
    }, 4000);
  };

  const checkWin = (num: number) => {
     let winTotal = 0;
     const currentBets = betsRef.current; // Use Ref to ensure we have latest bets

     Object.entries(currentBets).forEach(([key, amount]) => {
         let won = false;
         let multiplier = 0;

         if (!isNaN(Number(key))) { // Straight
             if (Number(key) === num) { won = true; multiplier = 35; }
         } else if (key === 'RED') {
             if (RED_NUMBERS.has(num)) { won = true; multiplier = 1; }
         } else if (key === 'BLACK') {
             if (BLACK_NUMBERS.has(num)) { won = true; multiplier = 1; }
         } else if (key === 'EVEN') {
             if (num !== 0 && num % 2 === 0) { won = true; multiplier = 1; }
         } else if (key === 'ODD') {
             if (num !== 0 && num % 2 !== 0) { won = true; multiplier = 1; }
         } else if (key === '1-18') {
             if (num >= 1 && num <= 18) { won = true; multiplier = 1; }
         } else if (key === '19-36') {
             if (num >= 19 && num <= 36) { won = true; multiplier = 1; }
         } else if (key === '1st12') {
             if (num >= 1 && num <= 12) { won = true; multiplier = 2; }
         } else if (key === '2nd12') {
             if (num >= 13 && num <= 24) { won = true; multiplier = 2; }
         } else if (key === '3rd12') {
             if (num >= 25 && num <= 36) { won = true; multiplier = 2; }
         } else if (key === '2to1_1') { 
             if (num !== 0 && num % 3 === 0) { won = true; multiplier = 2; }
         } else if (key === '2to1_2') { 
             if (num !== 0 && num % 3 === 2) { won = true; multiplier = 2; }
         } else if (key === '2to1_3') { 
             if (num !== 0 && num % 3 === 1) { won = true; multiplier = 2; }
         }

         if (won) {
             winTotal += (amount as number) * (multiplier + 1);
         }
     });

     if (winTotal > 0) {
         setWinningAmount(winTotal);
         onWin(winTotal);
     } else {
         onLoss();
     }
  };

  const placeBet = (zone: string) => {
    if (gameState !== 'IDLE') return;
    setBets(prev => ({
      ...prev,
      [zone]: (prev[zone] || 0) + selectedChip
    }));
  };

  // --- Initialize Loop ---
  useEffect(() => {
    animationRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // --- Helper Components for Table ---

  const BetZone: React.FC<{ id: string, label: React.ReactNode, className?: string, style?: React.CSSProperties }> = ({ id, label, className, style }) => (
      <button 
        onClick={() => placeBet(id)}
        className={`relative flex items-center justify-center transition-all hover:bg-white/20 group ${className}`}
        style={style}
      >
         <div className="absolute inset-0 border border-white/10 pointer-events-none"></div>
         <span className="font-bold text-white drop-shadow-md z-0 group-hover:scale-110 transition-transform select-none">{label}</span>
         {bets[id] > 0 && <ChipStack amount={bets[id]} />}
      </button>
  );

  const renderNumberCell = (num: number) => {
      const color = getNumberColor(num);
      return (
          <BetZone 
            key={num}
            id={num.toString()} 
            label={num} 
            className={`${color === '#ef4444' ? 'bg-red-600/80 hover:bg-red-500' : color === '#1e293b' ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-emerald-600/80 hover:bg-emerald-500'} h-12 md:h-16`}
          />
      );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto p-2 md:p-6 gap-8">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Roulette">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white">How to Play</h3>
               <p>Place bets on the table layout by clicking the zones. Select your chip value at the bottom. Press Spin to release the ball.</p>
               <ul className="list-disc pl-4 text-gray-400 text-sm mt-2">
                 <li>Inside Bets: Specific numbers (35:1)</li>
                 <li>Outside Bets: Red/Black, Odd/Even, etc. (1:1)</li>
                 <li>Dozens/Columns (2:1)</li>
               </ul>
             </section>
          </div>
       </GameInfoModal>

       {/* --- Top Section: Wheel & Info --- */}
       <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full">
           
           {/* History */}
           <div className="hidden lg:flex flex-col gap-2 w-16 items-center bg-slate-900/50 p-2 rounded-xl border border-white/5 h-[400px]">
               <div className="text-xs text-gray-500 font-bold uppercase mb-2">History</div>
               <div className="flex flex-col gap-2 overflow-hidden w-full items-center">
                 {history.map((n, i) => (
                     <div key={i} className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg animate-in fade-in slide-in-from-top-4 ${getNumberColor(n) === '#ef4444' ? 'bg-red-500' : getNumberColor(n) === '#10b981' ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                         {n}
                     </div>
                 ))}
               </div>
           </div>

           {/* 3D Wheel Render */}
           <div className="relative flex-1 flex justify-center">
              <div className="relative w-[340px] h-[340px] md:w-[480px] md:h-[480px]">
                  {/* Wheel Container */}
                  <div className="absolute inset-0 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] bg-[#1a0f05]">
                      <canvas ref={canvasRef} className="w-full h-full rounded-full" />
                  </div>
                  
                  {/* Winning Overlay */}
                  {gameState === 'RESULT' && lastWinNumber !== null && (
                     <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-in zoom-in duration-500">
                         <div className="bg-black/80 backdrop-blur-md border border-white/20 px-10 py-6 rounded-2xl text-center shadow-2xl transform scale-125">
                             <div className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Winner</div>
                             <div className={`text-7xl font-black ${getNumberColor(lastWinNumber) === '#ef4444' ? 'text-red-500' : getNumberColor(lastWinNumber) === '#10b981' ? 'text-emerald-500' : 'text-white'}`}>
                                 {lastWinNumber}
                             </div>
                             {winningAmount > 0 && (
                               <div className="text-yellow-400 font-bold text-xl mt-2 animate-bounce bg-yellow-400/10 px-4 py-1 rounded-full border border-yellow-400/20">
                                 +${winningAmount.toFixed(2)}
                               </div>
                             )}
                         </div>
                     </div>
                  )}
              </div>
           </div>
       </div>

       {/* --- Table Layout --- */}
       <div className="w-full max-w-5xl perspective-1000">
          <div className="relative bg-[#064e3b] rounded-xl border-[16px] border-[#382618] shadow-2xl overflow-hidden p-3 md:p-8 transform-style-3d rotate-x-12 origin-bottom">
             {/* Realistic Felt Texture */}
             <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] pointer-events-none mix-blend-overlay"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>

             {/* Grid Container */}
             <div className="grid grid-cols-[40px_1fr_40px] md:grid-cols-[60px_1fr_60px] gap-1 relative z-10 select-none">
                 
                 {/* Zero (Left) */}
                 <div className="row-span-3">
                     <BetZone id="0" label={<div className="h-full flex items-center justify-center text-lg rotate-[-90deg]">0</div>} className="h-full bg-emerald-600/80 rounded-l-md" />
                 </div>

                 {/* Numbers (Center) */}
                 <div className="grid grid-cols-12 gap-1">
                     {/* Rows are reversed in standard layout: 3,6,9... on top */}
                     {[3,6,9,12,15,18,21,24,27,30,33,36].map(renderNumberCell)}
                     {[2,5,8,11,14,17,20,23,26,29,32,35].map(renderNumberCell)}
                     {[1,4,7,10,13,16,19,22,25,28,31,34].map(renderNumberCell)}
                 </div>

                 {/* 2 to 1 (Right) */}
                 <div className="grid grid-rows-3 gap-1">
                     <BetZone id="2to1_1" label={<span className="rotate-90 text-xs">2 to 1</span>} className="bg-transparent border-white/20 text-xs font-bold" />
                     <BetZone id="2to1_2" label={<span className="rotate-90 text-xs">2 to 1</span>} className="bg-transparent border-white/20 text-xs font-bold" />
                     <BetZone id="2to1_3" label={<span className="rotate-90 text-xs">2 to 1</span>} className="bg-transparent border-white/20 text-xs font-bold" />
                 </div>
                 
                 {/* Bottom Section (Dozens & Even Money) */}
                 <div className="col-start-2 grid grid-rows-2 gap-1 mt-2">
                     {/* Dozens */}
                     <div className="grid grid-cols-3 gap-1 h-12">
                         <BetZone id="1st12" label="1st 12" className="bg-transparent border-white/20 text-xs font-bold uppercase" />
                         <BetZone id="2nd12" label="2nd 12" className="bg-transparent border-white/20 text-xs font-bold uppercase" />
                         <BetZone id="3rd12" label="3rd 12" className="bg-transparent border-white/20 text-xs font-bold uppercase" />
                     </div>
                     {/* Even Money */}
                     <div className="grid grid-cols-6 gap-1 h-12">
                         <BetZone id="1-18" label="1-18" className="bg-transparent border-white/20 text-[10px] font-bold" />
                         <BetZone id="EVEN" label="EVEN" className="bg-transparent border-white/20 text-[10px] font-bold" />
                         <BetZone id="RED" label={<div className="w-8 h-8 bg-red-600 rounded-sm rotate-45 transform scale-50 shadow-sm"></div>} className="bg-transparent border-white/20" />
                         <BetZone id="BLACK" label={<div className="w-8 h-8 bg-slate-900 rounded-sm rotate-45 transform scale-50 border border-white/30 shadow-sm"></div>} className="bg-transparent border-white/20" />
                         <BetZone id="ODD" label="ODD" className="bg-transparent border-white/20 text-[10px] font-bold" />
                         <BetZone id="19-36" label="19-36" className="bg-transparent border-white/20 text-[10px] font-bold" />
                     </div>
                 </div>

             </div>
          </div>
       </div>

       {/* --- Controls --- */}
       <div className="w-full max-w-4xl bg-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-6 shadow-xl z-20">
           {/* Chip Selector */}
           <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-center no-scrollbar">
               {CHIP_VALUES.map(val => (
                   <button
                     key={val}
                     onClick={() => setSelectedChip(val)}
                     className={`
                       w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center font-bold shadow-lg transition-transform active:scale-95 shrink-0
                       ${selectedChip === val ? '-translate-y-2 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                       ${getChipColor(val)}
                     `}
                   >
                       <span className="text-[10px] md:text-xs">{val}</span>
                   </button>
               ))}
           </div>

           <div className="h-8 w-[1px] bg-slate-700 hidden md:block"></div>

           {/* Actions */}
           <div className="flex gap-2 w-full md:w-auto justify-center">
               <button onClick={() => setBets({})} disabled={gameState !== 'IDLE'} className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 disabled:opacity-50" title="Clear Bets"><Trash2 size={20} /></button>
               <button onClick={() => setBets(lastBets)} disabled={gameState !== 'IDLE' || Object.keys(lastBets).length === 0} className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 disabled:opacity-50" title="Repeat Bet"><RotateCcw size={20} /></button>
               <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400" title="Toggle Sound">
                  {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
               </button>
           </div>

           <div className="flex-1 w-full">
               <button 
                 onClick={spin} 
                 disabled={gameState !== 'IDLE' || Object.keys(bets).length === 0}
                 className={`
                   w-full py-4 rounded-xl font-black text-xl shadow-lg transition-all active:scale-95
                   ${gameState !== 'IDLE' ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-accent hover:bg-accent-hover text-background shadow-[0_0_20px_rgba(0,231,1,0.3)]'}
                 `}
               >
                 {gameState !== 'IDLE' ? 'SPINNING...' : 'SPIN'}
               </button>
           </div>
       </div>

    </div>
  );
};

export default Roulette;
