
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HelpCircle, Skull, Trophy, Play } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface SlitherProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

// --- Game Constants ---
const WORLD_SIZE = 3000;
const INITIAL_LENGTH = 40; // Segments
const SNAKE_WIDTH = 12; // Radius
const SPEED = 4;
const ORB_RADIUS = 6;
const ORB_VALUE = 2; // Growth per orb
const ORB_COUNT = 400;
const BOT_COUNT = 20;
const TURN_SPEED = 0.08;

// --- Types ---
interface Point {
  x: number;
  y: number;
}

interface SnakeEntity {
  id: string;
  body: Point[];
  angle: number;
  targetLength: number; 
  color: string;
  strokeColor: string;
  isBot: boolean;
  dead: boolean;
}

interface Orb {
  x: number;
  y: number;
  color: string;
  id: number;
}

const Slither: React.FC<SlitherProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [isPlaying, setIsPlaying] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [lengthScore, setLengthScore] = useState(INITIAL_LENGTH);

  // --- Refs (Mutable Game State) ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const playingRef = useRef(false); // Sync ref for loop
  const mouseRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef({ x: 0, y: 0 });
  
  // Entities
  const playerRef = useRef<SnakeEntity | null>(null);
  const botsRef = useRef<SnakeEntity[]>([]);
  const orbsRef = useRef<Orb[]>([]);

  // --- Helpers ---
  const getRandomColor = () => {
    const sets = [
      { fill: '#ef4444', stroke: '#b91c1c' }, // Red
      { fill: '#3b82f6', stroke: '#1d4ed8' }, // Blue
      { fill: '#eab308', stroke: '#a16207' }, // Yellow
      { fill: '#a855f7', stroke: '#7e22ce' }, // Purple
      { fill: '#ec4899', stroke: '#be185d' }, // Pink
      { fill: '#14b8a6', stroke: '#0f766e' }, // Teal
    ];
    return sets[Math.floor(Math.random() * sets.length)];
  };

  const createSnake = (isBot: boolean, id: string): SnakeEntity => {
    const padding = 200;
    const startX = Math.random() * (WORLD_SIZE - padding * 2) + padding;
    const startY = Math.random() * (WORLD_SIZE - padding * 2) + padding;
    
    // Create initial body segments
    const body: Point[] = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
       body.push({ x: startX, y: startY });
    }

    const colors = isBot ? getRandomColor() : { fill: '#00e701', stroke: '#00a301' };

    return {
      id,
      body,
      angle: Math.random() * Math.PI * 2,
      targetLength: INITIAL_LENGTH,
      color: colors.fill,
      strokeColor: colors.stroke,
      isBot,
      dead: false
    };
  };

  const spawnOrb = (): Orb => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
    return {
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      color: colors[Math.floor(Math.random() * colors.length)],
      id: Math.random()
    };
  };

  // --- Game Mechanics ---

  const initGame = () => {
    playerRef.current = createSnake(false, 'player');
    botsRef.current = Array.from({ length: BOT_COUNT }).map((_, i) => createSnake(true, `bot_${i}`));
    orbsRef.current = Array.from({ length: ORB_COUNT }).map(spawnOrb);
    
    // Reset Mouse to center to prevent instant turn
    if (canvasRef.current) {
        mouseRef.current = { 
            x: canvasRef.current.width / 2, 
            y: canvasRef.current.height / 2 
        };
    }
  };

  const startGame = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    setIsPlaying(true);
    setGameOver(false);
    setMultiplier(1);
    setWinAmount(0);
    setLengthScore(INITIAL_LENGTH);
    playingRef.current = true;

    initGame();
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const stopGame = (won: boolean) => {
    playingRef.current = false;
    setIsPlaying(false);
    setGameOver(true);
    cancelAnimationFrame(requestRef.current);

    if (won) {
        const amount = parseFloat(betAmount);
        const win = amount * multiplier;
        setWinAmount(win);
        onWin(win);
    } else {
        onLoss();
    }
  };

  const updateSnake = (snake: SnakeEntity, targetX: number, targetY: number) => {
     const head = snake.body[0];
     
     // Angle to target
     const dx = targetX - head.x;
     const dy = targetY - head.y;
     const targetAngle = Math.atan2(dy, dx);

     // Smooth Turn
     let delta = targetAngle - snake.angle;
     while (delta <= -Math.PI) delta += Math.PI * 2;
     while (delta > Math.PI) delta -= Math.PI * 2;
     snake.angle += delta * TURN_SPEED;

     // Move
     const newHead = {
         x: head.x + Math.cos(snake.angle) * SPEED,
         y: head.y + Math.sin(snake.angle) * SPEED
     };

     // World Bounds
     if (newHead.x < 0 || newHead.x > WORLD_SIZE || newHead.y < 0 || newHead.y > WORLD_SIZE) {
         snake.dead = true;
         return;
     }

     snake.body.unshift(newHead);

     // Growth logic: If actual length < targetLength, don't pop tail (grow)
     if (snake.body.length > snake.targetLength) {
         snake.body.pop();
     }
  };

  const checkCollisions = () => {
     const player = playerRef.current;
     if (!player || player.dead) return;

     const pHead = player.body[0];

     // 1. Orbs
     for (let i = orbsRef.current.length - 1; i >= 0; i--) {
        const orb = orbsRef.current[i];
        // Simple distance check
        if (Math.abs(pHead.x - orb.x) < SNAKE_WIDTH + ORB_RADIUS && Math.abs(pHead.y - orb.y) < SNAKE_WIDTH + ORB_RADIUS) {
            orbsRef.current.splice(i, 1);
            player.targetLength += ORB_VALUE;
            orbsRef.current.push(spawnOrb()); // Respawn elsewhere
        }
     }

     // 2. Bots (Body Collision)
     for (const bot of botsRef.current) {
        if (bot.dead) continue;
        // Check if Player hits Bot
        for (let i = 0; i < bot.body.length; i += 2) { // Optimization: check every 2nd point
            const seg = bot.body[i];
            const distSq = (pHead.x - seg.x) ** 2 + (pHead.y - seg.y) ** 2;
            if (distSq < (SNAKE_WIDTH * 2) ** 2) {
                player.dead = true;
                stopGame(false);
                return;
            }
        }
     }
  };

  const updateBots = () => {
      botsRef.current.forEach(bot => {
          if (bot.dead) return;
          
          const head = bot.body[0];
          
          // AI: Move forward, turn randomly, avoid walls
          let targetX = head.x + Math.cos(bot.angle) * 100;
          let targetY = head.y + Math.sin(bot.angle) * 100;

          // Avoid Walls
          if (head.x < 100) targetX += 300;
          if (head.x > WORLD_SIZE - 100) targetX -= 300;
          if (head.y < 100) targetY += 300;
          if (head.y > WORLD_SIZE - 100) targetY -= 300;

          // Random Wiggle
          if (Math.random() < 0.05) bot.angle += (Math.random() - 0.5);

          updateSnake(bot, targetX, targetY);
      });
  };

  // --- Render Loop ---
  const gameLoop = useCallback(() => {
     if (!playingRef.current || !canvasRef.current || !playerRef.current) return;
     
     const ctx = canvasRef.current.getContext('2d');
     if (!ctx) return;
     const canvas = canvasRef.current;

     // 1. Logic Updates
     const player = playerRef.current;
     
     // Mouse steering relative to center
     const centerX = canvas.width / 2;
     const centerY = canvas.height / 2;
     
     // Target is offset from head by mouse vector
     const targetX = player.body[0].x + (mouseRef.current.x - centerX);
     const targetY = player.body[0].y + (mouseRef.current.y - centerY);

     updateSnake(player, targetX, targetY);
     updateBots();
     checkCollisions();

     // Update React UI Stats occasionally
     if (player.dead) return; // stopped in checkCollisions

     const currentLen = player.targetLength;
     // Multiplier calc: 1 + (growth / 50)
     const mult = 1 + ((currentLen - INITIAL_LENGTH) / 50);
     setMultiplier(mult);
     setLengthScore(Math.floor(currentLen));

     // 2. Rendering
     ctx.fillStyle = '#0f212e';
     ctx.fillRect(0, 0, canvas.width, canvas.height);

     // Camera Follow
     cameraRef.current.x = player.body[0].x - centerX;
     cameraRef.current.y = player.body[0].y - centerY;

     ctx.save();
     ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

     // Draw Grid
     ctx.strokeStyle = '#1e293b';
     ctx.lineWidth = 2;
     ctx.beginPath();
     for (let x = 0; x <= WORLD_SIZE; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_SIZE); }
     for (let y = 0; y <= WORLD_SIZE; y += 100) { ctx.moveTo(0, y); ctx.lineTo(WORLD_SIZE, y); }
     ctx.stroke();

     // Draw Borders
     ctx.strokeStyle = '#ef4444';
     ctx.lineWidth = 10;
     ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

     // Draw Orbs
     // Optimization: Only draw onscreen
     const cam = cameraRef.current;
     orbsRef.current.forEach(orb => {
        if (orb.x < cam.x - 20 || orb.x > cam.x + canvas.width + 20) return;
        if (orb.y < cam.y - 20 || orb.y > cam.y + canvas.height + 20) return;
        
        ctx.fillStyle = orb.color;
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
     });

     // Draw Snakes
     const allSnakes = [...botsRef.current, player];
     // Sort by length to draw big snakes on top? No, z-index usually standard.
     
     allSnakes.forEach(snake => {
        if (snake.dead) return;
        
        // Culling Check (Head onscreen?)
        // const head = snake.body[0];
        // if (head.x < cam.x - 200 || head.x > cam.x + canvas.width + 200) return;

        // Draw Body
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = SNAKE_WIDTH * 2;
        ctx.strokeStyle = snake.strokeColor;
        
        ctx.beginPath();
        if (snake.body.length > 0) {
            ctx.moveTo(snake.body[0].x, snake.body[0].y);
            // Draw points with stride to simplify geometry
            for (let i = 1; i < snake.body.length; i+=1) {
                 ctx.lineTo(snake.body[i].x, snake.body[i].y);
            }
        }
        ctx.stroke();
        
        // Inner color
        ctx.lineWidth = (SNAKE_WIDTH * 2) - 4;
        ctx.strokeStyle = snake.color;
        ctx.stroke();

        // Eyes (Head is index 0)
        const h = snake.body[0];
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(snake.angle);
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(6, -6, 4, 0, Math.PI*2);
        ctx.arc(6, 6, 4, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(7, -6, 2, 0, Math.PI*2);
        ctx.arc(7, 6, 2, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();

        // Name Tag
        if (snake.id !== 'player') {
           ctx.fillStyle = 'rgba(255,255,255,0.5)';
           ctx.font = '10px Arial';
           ctx.fillText(`Bot`, h.x + 15, h.y);
        }
     });

     ctx.restore();

     requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
     if (!canvasRef.current) return;
     const rect = canvasRef.current.getBoundingClientRect();
     mouseRef.current = {
         x: e.clientX - rect.left,
         y: e.clientY - rect.top
     };
  };

  useEffect(() => {
     // Resize observer
     const handleResize = () => {
         if (canvasRef.current && canvasRef.current.parentElement) {
             canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
             canvasRef.current.height = 600;
         }
     };
     window.addEventListener('resize', handleResize);
     handleResize();
     
     // Cleanup
     return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(requestRef.current);
        playingRef.current = false;
     };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Slither">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Navigate your snake, eat orbs to grow, and survive. The longer you survive, the higher your multiplier.</p>
             </section>
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Controls</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li>Your snake follows your mouse cursor.</li>
                 <li>Avoid running into walls (Red Borders).</li>
                 <li>Avoid running into other snakes (Bots).</li>
               </ul>
             </section>
          </div>
       </GameInfoModal>

       <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 bg-card p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-white uppercase tracking-wider">Slither</h2>
                 <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white"><HelpCircle size={20}/></button>
              </div>

              {/* Bet Controls */}
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
                 <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input 
                      type="number" 
                      value={betAmount}
                      onChange={e => setBetAmount(e.target.value)}
                      disabled={isPlaying}
                      className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white font-mono"
                    />
                 </div>
              </div>

              {/* Stats Panel */}
              {isPlaying && !gameOver && (
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-2 animate-in fade-in">
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Length</span>
                        <span className="text-white font-bold">{lengthScore}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Current Win</span>
                        <span className="text-emerald-400 font-bold font-mono">${(parseFloat(betAmount) * multiplier).toFixed(2)}</span>
                     </div>
                     <div className="text-center text-4xl font-black text-accent mt-2 drop-shadow-[0_0_10px_rgba(0,231,1,0.5)]">
                        {multiplier.toFixed(2)}x
                     </div>
                  </div>
              )}

              <div className="mt-auto">
                 {!isPlaying ? (
                     <button 
                       onClick={startGame}
                       className="w-full bg-accent hover:bg-accent-hover text-background font-bold text-xl py-4 rounded-lg shadow-[0_0_20px_rgba(0,231,1,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                       <Play size={24} fill="currentColor" /> PLAY
                     </button>
                 ) : (
                     <button 
                       onClick={() => stopGame(true)}
                       className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl py-4 rounded-lg shadow-lg transition-all active:scale-95 flex flex-col items-center leading-none gap-1"
                     >
                       <span>CASH OUT</span>
                       <span className="text-xs opacity-90 font-mono">${(parseFloat(betAmount) * multiplier).toFixed(2)}</span>
                     </button>
                 )}
              </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-black rounded-xl border-4 border-slate-800 relative overflow-hidden cursor-crosshair shadow-2xl group">
              <canvas 
                 ref={canvasRef}
                 onMouseMove={handleMouseMove}
                 className="w-full h-full block"
              />

              {/* Start Overlay */}
              {!isPlaying && !gameOver && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                     <div className="text-center">
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-500 mb-2 drop-shadow-lg">
                           NEON SLITHER
                        </div>
                        <p className="text-gray-400">Move mouse to steer. Eat to grow.</p>
                     </div>
                 </div>
              )}

              {/* Game Over Overlay */}
              {gameOver && (
                 <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-20 animate-in zoom-in fade-in duration-300">
                    <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full">
                       {winAmount > 0 ? (
                           <>
                              <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                              <h3 className="text-3xl font-black text-white mb-2 italic">CASHED OUT!</h3>
                              <div className="text-emerald-400 font-mono text-2xl font-bold mb-6 bg-emerald-900/20 py-2 rounded-lg">
                                +${winAmount.toFixed(2)}
                              </div>
                           </>
                       ) : (
                           <>
                              <Skull size={64} className="text-red-500 mx-auto mb-4 animate-pulse" />
                              <h3 className="text-3xl font-black text-white mb-2 italic">CRASHED!</h3>
                              <p className="text-red-400 font-mono text-lg mb-6">You hit an obstacle.</p>
                           </>
                       )}
                       <button 
                         onClick={startGame}
                         className="w-full bg-white text-black font-bold py-3 rounded-full hover:scale-105 transition-transform shadow-lg"
                       >
                         Play Again
                       </button>
                    </div>
                 </div>
              )}
          </div>
       </div>
    </div>
  );
};

export default Slither;
