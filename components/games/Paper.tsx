
import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Play, Skull, Trophy, Crown, Zap, Shield, Snowflake, Sword } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface PaperProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

// --- Constants ---
const GRID_SIZE = 45; // Slightly larger for more maneuvering
const CELL_SIZE = 14;
const BASE_TICK_RATE = 80; // Faster base speed
const PLAYERS_COUNT = 5; // Added one more bot for chaos

// Colors
const COLORS = [
  { main: '#00e701', trail: 'rgba(0, 231, 1, 0.5)', light: 'rgba(0, 231, 1, 0.2)' }, // Player (Green)
  { main: '#ef4444', trail: 'rgba(239, 68, 68, 0.5)', light: 'rgba(239, 68, 68, 0.2)' }, // Red Bot
  { main: '#3b82f6', trail: 'rgba(59, 130, 246, 0.5)', light: 'rgba(59, 130, 246, 0.2)' }, // Blue Bot
  { main: '#eab308', trail: 'rgba(234, 179, 8, 0.5)', light: 'rgba(234, 179, 8, 0.2)' }, // Yellow Bot
  { main: '#a855f7', trail: 'rgba(168, 85, 247, 0.5)', light: 'rgba(168, 85, 247, 0.2)' }, // Purple Bot
];

type Direction = 0 | 1 | 2 | 3; // 0=Up, 1=Right, 2=Down, 3=Left
type PowerUpType = 'SPEED' | 'FREEZE' | 'SHIELD';

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  spawnTime: number;
}

interface PlayerObj {
  id: number;
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  trail: { x: number; y: number }[];
  colorIdx: number;
  alive: boolean;
  isBot: boolean;
  score: number; // Territory size
  killCount: number;
  // Powerup States
  speedMult: number;
  invincible: boolean;
  frozen: boolean;
  activeEffects: PowerUpType[];
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

interface KillEvent {
  id: number;
  killer: string;
  victim: string;
  color: string;
}

const Paper: React.FC<PaperProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOverState, setGameOverState] = useState<'WIN' | 'LOSS' | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [stats, setStats] = useState({ alive: 5, kills: 0, owned: 0 });
  const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  // Game State Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize grid immediately to prevent draw() crash on mount
  const gridRef = useRef<number[][]>(
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(-1))
  );
  
  const playersRef = useRef<PlayerObj[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const loopRef = useRef<number | null>(null);
  const gameStateRef = useRef({ playing: false, ticks: 0 });

  // --- Initialization ---

  const initGame = () => {
    // 1. Init Grid
    const g = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(-1));
    gridRef.current = g;
    powerUpsRef.current = [];
    particlesRef.current = [];
    setKillFeed([]);

    // 2. Spawn Players (Scatter them)
    const players: PlayerObj[] = [];
    const starts = [
        { x: 5, y: 5, dir: 1 },
        { x: GRID_SIZE - 6, y: 5, dir: 3 },
        { x: 5, y: GRID_SIZE - 6, dir: 1 },
        { x: GRID_SIZE - 6, y: GRID_SIZE - 6, dir: 3 },
        { x: Math.floor(GRID_SIZE/2), y: Math.floor(GRID_SIZE/2), dir: 0 }
    ];

    for(let i=0; i<PLAYERS_COUNT; i++) {
        const start = starts[i];
        
        // Init Territory (3x3)
        for(let dy=-1; dy<=1; dy++) {
            for(let dx=-1; dx<=1; dx++) {
                if (start.y + dy >= 0 && start.y + dy < GRID_SIZE && start.x + dx >= 0 && start.x + dx < GRID_SIZE) {
                    g[start.y + dy][start.x + dx] = i;
                }
            }
        }

        players.push({
            id: i,
            x: start.x,
            y: start.y,
            dir: start.dir as Direction,
            nextDir: start.dir as Direction,
            trail: [],
            colorIdx: i,
            alive: true,
            isBot: i !== 0,
            score: 9,
            killCount: 0,
            speedMult: 1,
            invincible: false,
            frozen: false,
            activeEffects: []
        });
    }

    playersRef.current = players;
    setStats({ alive: PLAYERS_COUNT, kills: 0, owned: 0 });
  };

  const startGame = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    setIsPlaying(true);
    setGameOverState(null);
    setMultiplier(1);
    gameStateRef.current.playing = true;
    gameStateRef.current.ticks = 0;

    initGame();

    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = window.setInterval(gameTick, 50); // Tick rate 50ms (20fps logic)
  };

  const stopGame = (win: boolean, reason: string) => {
    gameStateRef.current.playing = false;
    setIsPlaying(false);
    if (loopRef.current) clearInterval(loopRef.current);

    if (win) {
        const amount = parseFloat(betAmount);
        const payout = amount * multiplier;
        setWinAmount(payout);
        onWin(payout);
        setGameOverState('WIN');
    } else {
        onLoss();
        setGameOverState('LOSS');
    }
  };

  // --- Game Logic ---

  const gameTick = () => {
      if (!gameStateRef.current.playing) return;
      
      gameStateRef.current.ticks++;
      const players = playersRef.current;
      const grid = gridRef.current;

      // Spawn Powerups occasionally
      if (gameStateRef.current.ticks % 100 === 0 && powerUpsRef.current.length < 3) {
          spawnPowerUp();
      }

      // Process Players
      players.forEach(p => {
          if (!p.alive) return;

          // Handle Frozen Status
          if (p.frozen) {
             // Only move every 3rd tick if frozen
             if (gameStateRef.current.ticks % 3 !== 0) return;
          } else if (p.speedMult === 1) {
             // Normal speed: move every 2nd tick (effectively BASE_TICK_RATE)
             if (gameStateRef.current.ticks % 2 !== 0) return;
          }
          // If speedMult > 1 (Fast), move every tick

          // Decrement effect timers? (Simplified: Effects last X moves or time? Let's use Time via ticks)
          if (gameStateRef.current.ticks % 200 === 0) { // Remove effects periodically
              p.speedMult = 1;
              p.invincible = false;
              p.frozen = false;
              p.activeEffects = [];
          }

          // Update Direction
          if ((p.nextDir + 2) % 4 !== p.dir) { 
             p.dir = p.nextDir;
          }

          // Bot AI
          if (p.isBot) updateBotAI(p, players, grid, powerUpsRef.current);

          // Move
          if (p.dir === 0) p.y--;
          else if (p.dir === 1) p.x++;
          else if (p.dir === 2) p.y++;
          else if (p.dir === 3) p.x--;

          // --- Collisions ---

          // 1. Wall Collision
          if (p.x < 0 || p.x >= GRID_SIZE || p.y < 0 || p.y >= GRID_SIZE) {
              killPlayer(p, null);
              return;
          }

          // 2. PowerUp Collision
          const pupIdx = powerUpsRef.current.findIndex(pup => pup.x === p.x && pup.y === p.y);
          if (pupIdx !== -1) {
              applyPowerUp(p, powerUpsRef.current[pupIdx]);
              powerUpsRef.current.splice(pupIdx, 1);
              spawnParticles(p.x, p.y, '#ffffff', 10);
          }

          // 3. Trail Collision
          for(const other of players) {
              if (!other.alive) continue;
              
              // Check if hitting 'other' trail
              const hitIndex = other.trail.findIndex(t => t.x === p.x && t.y === p.y);
              
              if (hitIndex !== -1) {
                  if (other.id === p.id) {
                      killPlayer(p, null); // Suicide
                      return;
                  } else {
                      if (!other.invincible) {
                          killPlayer(other, p); // Kill other
                      } else {
                          // Hit invincible player's trail
                          killPlayer(other, p); 
                      }
                  }
              }
              
              // Head to Head
              if (other.id !== p.id && other.x === p.x && other.y === p.y) {
                  if (p.invincible && !other.invincible) {
                      killPlayer(other, p);
                  } else if (!p.invincible && other.invincible) {
                      killPlayer(p, other);
                      return;
                  } else {
                      // Both die
                      killPlayer(p, null);
                      killPlayer(other, null);
                      return;
                  }
              }
          }
      });

      // Territory Update
      players.forEach(p => {
          if (!p.alive) return;
          const currentOwner = grid[p.y][p.x];
          
          if (currentOwner === p.id) {
              if (p.trail.length > 0) {
                  captureTerritory(p);
                  p.trail = [];
                  spawnParticles(p.x, p.y, COLORS[p.colorIdx].main, 5); // Splash effect
              }
          } else {
              p.trail.push({ x: p.x, y: p.y });
          }
      });

      // Game End Check
      const human = players[0];
      const aliveCount = players.filter(p => p.alive).length;
      
      // Stats & Mult Update
      if (human.alive) {
         const percentOwned = (human.score / (GRID_SIZE * GRID_SIZE)) * 100;
         let mult = 1.0;
         
         const botsDead = (PLAYERS_COUNT - 1) - (aliveCount - 1);
         mult += (botsDead * 1.5); 
         mult += (percentOwned / 15);
         mult += (human.killCount * 0.5);

         if (aliveCount === 1) {
             mult += 3.0; // Huge bonus for last man standing
             setMultiplier(mult);
             stopGame(true, 'Champion');
             return;
         }
         setMultiplier(mult);
         setStats({ 
             alive: aliveCount, 
             kills: human.killCount, 
             owned: Math.floor(percentOwned) 
         });
      } else {
         stopGame(false, 'Died');
         return;
      }

      draw();
  };

  // --- Helper Logics ---

  const spawnPowerUp = () => {
      const types: PowerUpType[] = ['SPEED', 'SHIELD', 'FREEZE'];
      // Find empty spot
      let x, y, tries = 0;
      do {
          x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
          y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
          tries++;
      } while (tries < 10 && powerUpsRef.current.some(p => p.x === x && p.y === y));

      powerUpsRef.current.push({
          id: Math.random(),
          x, y,
          type: types[Math.floor(Math.random() * types.length)],
          spawnTime: Date.now()
      });
  };

  const applyPowerUp = (p: PlayerObj, pup: PowerUp) => {
      if (pup.type === 'SPEED') {
          p.speedMult = 2;
          p.activeEffects.push('SPEED');
      } else if (pup.type === 'SHIELD') {
          p.invincible = true;
          p.activeEffects.push('SHIELD');
      } else if (pup.type === 'FREEZE') {
          // Freeze everyone else
          playersRef.current.forEach(other => {
              if (other.id !== p.id && other.alive) {
                  other.frozen = true;
                  other.activeEffects.push('FREEZE');
              }
          });
      }
  };

  const killPlayer = (victim: PlayerObj, killer: PlayerObj | null) => {
      if (victim.invincible && killer) return; // Shield protects from direct kills
      if (!victim.alive) return; // Already dead

      victim.alive = false;
      
      // Explosion
      spawnParticles(victim.x, victim.y, COLORS[victim.colorIdx].main, 20);

      // Clear Territory
      const grid = gridRef.current;
      for(let y=0; y<GRID_SIZE; y++) {
          for(let x=0; x<GRID_SIZE; x++) {
              if (grid[y][x] === victim.id) grid[y][x] = -1;
          }
      }

      // Log
      const vName = victim.id === 0 ? 'You' : `Bot ${victim.id}`;
      const kName = killer ? (killer.id === 0 ? 'You' : `Bot ${killer.id}`) : 'Wall/Self';
      
      setKillFeed(prev => [{
          id: Date.now(),
          killer: kName,
          victim: vName,
          color: killer ? COLORS[killer.colorIdx].main : '#fff'
      }, ...prev].slice(0, 3));

      if (killer) {
          killer.killCount++;
      }
  };

  const captureTerritory = (p: PlayerObj) => {
      const grid = gridRef.current;
      const tempGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

      // Mark bounds
      for(let y=0; y<GRID_SIZE; y++) {
          for(let x=0; x<GRID_SIZE; x++) {
              if (grid[y][x] === p.id) tempGrid[y][x] = 1;
          }
      }
      p.trail.forEach(t => {
         if(t.x >= 0 && t.x < GRID_SIZE && t.y >= 0 && t.y < GRID_SIZE) tempGrid[t.y][t.x] = 1;
      });

      // Flood fill
      const stack = [{x:0, y:0}, {x:GRID_SIZE-1, y:0}, {x:0, y:GRID_SIZE-1}, {x:GRID_SIZE-1, y:GRID_SIZE-1}];
      while(stack.length) {
          const {x, y} = stack.pop()!;
          if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
          if (tempGrid[y][x] !== 0) continue;
          tempGrid[y][x] = 2; // Outside
          stack.push({x: x+1, y}, {x: x-1, y}, {x, y: y+1}, {x, y: y-1});
      }

      // Fill
      let score = 0;
      for(let y=0; y<GRID_SIZE; y++) {
          for(let x=0; x<GRID_SIZE; x++) {
              if (tempGrid[y][x] !== 2) {
                  grid[y][x] = p.id;
                  score++;
              }
          }
      }
      p.score = score;
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          particlesRef.current.push({
              x: x * CELL_SIZE + CELL_SIZE/2,
              y: y * CELL_SIZE + CELL_SIZE/2,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 1.0,
              color,
              size: Math.random() * 4 + 2
          });
      }
  };

  const updateBotAI = (bot: PlayerObj, players: PlayerObj[], grid: number[][], powerUps: PowerUp[]) => {
      const dirs: Direction[] = [0, 1, 2, 3];
      const validDirs = dirs.filter(d => (d + 2) % 4 !== bot.dir); 

      let bestDir = bot.dir;
      let bestScore = -Infinity;

      validDirs.forEach(d => {
          let score = 0;
          let nx = bot.x + (d === 1 ? 1 : d === 3 ? -1 : 0);
          let ny = bot.y + (d === 2 ? 1 : d === 0 ? -1 : 0);

          // 1. Safety Check (Wall/Self Trail)
          if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
              score -= 99999;
          } else if (bot.trail.some(t => t.x === nx && t.y === ny)) {
              score -= 99999;
          } else {
              // 2. PowerUp Attraction
              const pup = powerUps.find(p => Math.abs(p.x - nx) + Math.abs(p.y - ny) < 5);
              if (pup) score += 50;

              // 3. Kill Opportunity (Enemy Trail)
              for (const p of players) {
                  if (!p.alive || p.id === bot.id) continue;
                  if (p.trail.some(t => t.x === nx && t.y === ny)) score += 100;
                  // Avoid head-on if they have shield
                  if (p.invincible && Math.abs(p.x - nx) + Math.abs(p.y - ny) < 2) score -= 200;
              }

              // 4. Expand
              if (grid[ny][nx] !== bot.id) score += 5;
              
              // 5. Return Base if trail long
              if (bot.trail.length > 8) {
                  if (grid[ny][nx] === bot.id) score += 150;
              }

              score += Math.random() * 10;
          }

          if (score > bestScore) {
              bestScore = score;
              bestDir = d;
          }
      });
      bot.nextDir = bestDir;
  };

  // --- Rendering ---

  const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const grid = gridRef.current;
      // Safety check for grid
      if (!grid || grid.length !== GRID_SIZE || !grid[0]) return;

      // BG
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Territory
      for(let y=0; y<GRID_SIZE; y++) {
          for(let x=0; x<GRID_SIZE; x++) {
              const pid = grid[y][x];
              if (pid !== -1 && COLORS[pid]) {
                  ctx.fillStyle = COLORS[pid].light;
                  ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
              }
          }
      }

      // 2. PowerUps
      powerUpsRef.current.forEach(p => {
          const px = p.x * CELL_SIZE + CELL_SIZE/2;
          const py = p.y * CELL_SIZE + CELL_SIZE/2;
          
          ctx.shadowBlur = 10;
          if (p.type === 'SPEED') {
              ctx.fillStyle = '#fbbf24'; // Yellow
              ctx.shadowColor = '#fbbf24';
              ctx.beginPath(); ctx.moveTo(px, py-6); ctx.lineTo(px+4, py); ctx.lineTo(px-2, py); ctx.lineTo(px, py+6); ctx.lineTo(px-4, py); ctx.lineTo(px+2, py); ctx.fill();
          } else if (p.type === 'SHIELD') {
              ctx.fillStyle = '#3b82f6'; // Blue
              ctx.shadowColor = '#3b82f6';
              ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
          } else if (p.type === 'FREEZE') {
              ctx.fillStyle = '#06b6d4'; // Cyan
              ctx.shadowColor = '#06b6d4';
              ctx.beginPath(); ctx.rect(px-4, py-4, 8, 8); ctx.fill();
          }
          ctx.shadowBlur = 0;
      });

      // 3. Players & Trails
      playersRef.current.forEach(p => {
          if (!p.alive) return;
          const colorSet = COLORS[p.colorIdx];

          // Trail
          ctx.fillStyle = colorSet.trail;
          p.trail.forEach(t => {
             ctx.fillRect(t.x * CELL_SIZE, t.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          });

          // Head
          const px = p.x * CELL_SIZE;
          const py = p.y * CELL_SIZE;
          
          ctx.fillStyle = colorSet.main;
          
          // Effect Glows
          if (p.invincible) {
             ctx.shadowColor = '#3b82f6';
             ctx.shadowBlur = 15;
          } else if (p.speedMult > 1) {
             ctx.shadowColor = '#fbbf24';
             ctx.shadowBlur = 15;
          } else {
             ctx.shadowColor = colorSet.main;
             ctx.shadowBlur = 5;
          }
          
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          ctx.shadowBlur = 0;

          // Frozen Overlay
          if (p.frozen) {
              ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
              ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          }

          // Icon
          if (!p.isBot) {
             ctx.fillStyle = 'white';
             ctx.fillRect(px+4, py+4, CELL_SIZE-8, CELL_SIZE-8);
          }
      });

      // 4. Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          if (p.life <= 0) {
              particlesRef.current.splice(i, 1);
              continue;
          }
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
      }
  };

  // --- Input ---
  const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStateRef.current.playing) return;
      const human = playersRef.current[0];
      if (!human || !human.alive) return;

      // Prevent reversing direction (0<->2, 1<->3)
      // 0=Up, 1=Right, 2=Down, 3=Left
      switch(e.key) {
          case 'ArrowUp': case 'w': case 'W':
              if (human.dir !== 2) human.nextDir = 0; break;
          case 'ArrowRight': case 'd': case 'D':
              if (human.dir !== 3) human.nextDir = 1; break;
          case 'ArrowDown': case 's': case 'S':
              if (human.dir !== 0) human.nextDir = 2; break;
          case 'ArrowLeft': case 'a': case 'A':
              if (human.dir !== 1) human.nextDir = 3; break;
      }
  };

  useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      if (canvasRef.current) {
          canvasRef.current.width = GRID_SIZE * CELL_SIZE;
          canvasRef.current.height = GRID_SIZE * CELL_SIZE;
          draw(); // Initial draw
      }
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          if (loopRef.current) clearInterval(loopRef.current);
      };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Paper.io">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Capture territory, eliminate bots, and survive to boost your multiplier.</p>
             </section>
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Power Ups</h3>
               <ul className="space-y-2 text-gray-400 text-sm">
                 <li className="flex items-center gap-2"><Zap size={16} className="text-yellow-400" /> <strong>Speed:</strong> Move 2x faster.</li>
                 <li className="flex items-center gap-2"><Snowflake size={16} className="text-cyan-400" /> <strong>Freeze:</strong> Slows opponents down.</li>
                 <li className="flex items-center gap-2"><Shield size={16} className="text-blue-400" /> <strong>Shield:</strong> Protects you from death.</li>
               </ul>
             </section>
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Mechanics</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400 text-sm">
                 <li>Crash into an enemy's trail to kill them.</li>
                 <li>Don't hit walls or your own trail.</li>
                 <li>Return to your base to capture enclosed land.</li>
               </ul>
             </section>
          </div>
       </GameInfoModal>

       <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[680px]">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 bg-card p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-white uppercase tracking-wider">Paper.io</h2>
                 <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white"><HelpCircle size={20}/></button>
              </div>

              {isPlaying && (
                <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 space-y-3 animate-in slide-in-from-left">
                   <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                      <span>Live Feed</span>
                   </div>
                   <div className="space-y-1 h-24 overflow-hidden">
                      {killFeed.length === 0 && <span className="text-gray-600 text-xs italic">Match started...</span>}
                      {killFeed.map(k => (
                         <div key={k.id} className="text-xs flex items-center gap-2 animate-in fade-in slide-in-from-left">
                             <Sword size={12} className="text-gray-500" />
                             <span style={{color: k.color}} className="font-bold">{k.killer}</span>
                             <span className="text-gray-500">killed</span>
                             <span className="text-white">{k.victim}</span>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              {isPlaying ? (
                 <div className="space-y-3">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-xs uppercase font-bold">Enemies Left</span>
                          <span className="text-red-400 font-black text-xl">{stats.alive - 1}</span>
                       </div>
                       <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${((stats.alive-1)/4)*100}%` }}></div>
                       </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 p-4 rounded-lg border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <div className="text-xs text-emerald-400 uppercase font-bold mb-1 flex justify-between">
                           <span>Multiplier</span>
                           <span>{stats.owned}% Owned</span>
                        </div>
                        <div className="text-5xl font-black text-white tracking-tighter flex items-center gap-2">
                           {multiplier.toFixed(2)}x
                           {stats.alive === 1 && <Crown size={32} className="text-yellow-400 animate-bounce" />}
                        </div>
                    </div>
                 </div>
              ) : (
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input 
                          type="number" 
                          value={betAmount}
                          onChange={e => setBetAmount(e.target.value)}
                          className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white font-mono text-lg font-bold"
                        />
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
                       onClick={() => stopGame(true, 'Cashed Out')}
                       className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl py-4 rounded-lg shadow-lg transition-all active:scale-95 flex flex-col items-center leading-none gap-1"
                     >
                       <span>CASH OUT</span>
                       <span className="text-xs opacity-90 font-mono">${(parseFloat(betAmount) * multiplier).toFixed(2)}</span>
                     </button>
                 )}
              </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-[#0f172a] rounded-xl border-4 border-slate-800 relative flex items-center justify-center overflow-hidden shadow-2xl">
              <canvas 
                 ref={canvasRef}
                 className="shadow-2xl rounded-lg rendering-pixelated"
                 style={{ imageRendering: 'pixelated' }}
              />

              {!isPlaying && !gameOverState && (
                 <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                     <div className="text-center animate-in zoom-in duration-300">
                        <div className="flex justify-center gap-4 mb-6">
                            <div className="flex flex-col items-center gap-1"><Zap className="text-yellow-400" /><span className="text-xs text-gray-400">Speed</span></div>
                            <div className="flex flex-col items-center gap-1"><Shield className="text-blue-400" /><span className="text-xs text-gray-400">Shield</span></div>
                            <div className="flex flex-col items-center gap-1"><Snowflake className="text-cyan-400" /><span className="text-xs text-gray-400">Freeze</span></div>
                        </div>
                        <h3 className="text-4xl font-black text-white mb-2 uppercase tracking-widest drop-shadow-lg">Turf War</h3>
                        <p className="text-gray-400 max-w-xs mx-auto">Use arrow keys. Capture land. Eliminate bots. Grab powerups.</p>
                     </div>
                 </div>
              )}

              {gameOverState && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-20 animate-in zoom-in fade-in duration-300">
                    <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full relative overflow-hidden">
                       {/* Background ray effect */}
                       <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>

                       {gameOverState === 'WIN' ? (
                           <>
                              <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                              <h3 className="text-3xl font-black text-white mb-2 italic uppercase">Victory!</h3>
                              <div className="text-emerald-400 font-mono text-3xl font-black mb-6 bg-emerald-900/20 py-3 rounded-xl border border-emerald-500/20">
                                +${winAmount.toFixed(2)}
                              </div>
                           </>
                       ) : (
                           <>
                              <Skull size={64} className="text-red-500 mx-auto mb-4 animate-pulse" />
                              <h3 className="text-3xl font-black text-white mb-2 italic uppercase">Eliminated</h3>
                              <p className="text-red-400 font-mono text-lg mb-6">You hit a trail.</p>
                           </>
                       )}
                       <button 
                         onClick={startGame}
                         className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-105 transition-transform shadow-lg text-lg"
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

export default Paper;
