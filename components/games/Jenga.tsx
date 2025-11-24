
import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Bot, User, Trophy, AlertTriangle, RotateCcw } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface JengaProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

interface BlockData {
  id: string;
  layer: number;
  index: number; // 0, 1, 2
  removed: boolean;
  axis: 'X' | 'Z'; 
  offset: number; // Position offset from center (-34, 0, 34)
}

type Turn = 'PLAYER' | 'BOT';
type GameState = 'IDLE' | 'PLAYING' | 'GAMEOVER';

const LAYERS_COUNT = 12;
const BASE_STABILITY = 100;

// Block Dimensions
const BLOCK_L = 100; // Length
const BLOCK_W = 32;  // Width
const BLOCK_H = 20;  // Height
const GAP = 2;       // Spacing between blocks side-by-side

const Jenga: React.FC<JengaProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [turn, setTurn] = useState<Turn>('PLAYER');
  const [stability, setStability] = useState(BASE_STABILITY);
  const [rotation, setRotation] = useState(45); // Camera rotation
  const [showInfo, setShowInfo] = useState(false);
  const [message, setMessage] = useState('');
  const [winner, setWinner] = useState<'PLAYER' | 'BOT' | null>(null);

  // --- Initialization ---
  useEffect(() => {
    resetTower();
  }, []);

  const resetTower = () => {
    const newBlocks: BlockData[] = [];
    const offsetStep = BLOCK_W + GAP;

    for (let l = 0; l < LAYERS_COUNT; l++) {
      const axis = l % 2 === 0 ? 'X' : 'Z';
      // Center block is at 0. Side blocks at +/- offsetStep
      const offsets = [-offsetStep, 0, offsetStep];
      
      for (let i = 0; i < 3; i++) {
        newBlocks.push({
          id: `${l}-${i}`,
          layer: l,
          index: i,
          removed: false,
          axis,
          offset: offsets[i]
        });
      }
    }
    setBlocks(newBlocks);
    setStability(BASE_STABILITY);
    setWinner(null);
    setMessage('');
  };

  const startGame = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    resetTower();
    setGameState('PLAYING');
    setTurn('PLAYER');
    setMessage('Your Turn');
  };

  // --- Logic ---

  const checkFall = (currentStability: number): boolean => {
    // Risk curve: (100 - Stability)^2 / 150
    const risk = Math.pow((100 - currentStability), 2.2) / 150;
    return Math.random() * 100 < risk;
  };

  const calculateStabilityDrop = (block: BlockData, currentBlocks: BlockData[]) => {
    let drop = 2; 
    if (block.index === 1) drop += 10; // Center block is critical
    
    const layerBlocks = currentBlocks.filter(b => b.layer === block.layer && !b.removed);
    const count = layerBlocks.length; 
    
    if (count === 2) drop += 15; // Taking 2nd block
    else if (count === 1) drop += 50; // Taking last block

    drop += Math.random() * 5;
    return drop;
  };

  const handleBlockClick = (blockId: string) => {
    if (gameState !== 'PLAYING' || turn !== 'PLAYER') return;
    
    const block = blocks.find(b => b.id === blockId);
    if (!block || block.removed) return;

    processMove(block, 'PLAYER');
  };

  const processMove = async (block: BlockData, actor: Turn) => {
    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, removed: true } : b));
    
    const drop = calculateStabilityDrop(block, blocks);
    const newStability = Math.max(0, stability - drop);
    setStability(newStability);

    const didFall = checkFall(newStability);

    if (didFall) {
       endGame(actor === 'PLAYER' ? 'BOT' : 'PLAYER');
    } else {
       if (actor === 'PLAYER') {
           setTurn('BOT');
           setMessage('Bot Thinking...');
           setTimeout(botMove, 1500);
       } else {
           setTurn('PLAYER');
           setMessage('Your Turn');
       }
    }
  };

  const botMove = () => {
      if (gameState !== 'PLAYING') return;

      const available = blocks.filter(b => !b.removed);
      
      // Heuristic scoring for moves
      const scoredMoves = available.map(b => {
          let score = 0;
          if (b.index !== 1) score += 10; // Prefer sides
          
          const layerCount = available.filter(l => l.layer === b.layer).length;
          if (layerCount === 3) score += 20; 
          if (layerCount === 2) score -= 10; 
          if (layerCount === 1) score -= 999; 

          // Top layers are safer generally
          score += b.layer * 2;

          return { id: b.id, score };
      });

      scoredMoves.sort((a, b) => b.score - a.score);
      // Add randomness (Top 5)
      const chosen = scoredMoves.slice(0, 5)[Math.floor(Math.random() * Math.min(5, scoredMoves.length))];

      if (chosen) {
          const block = blocks.find(b => b.id === chosen.id)!;
          processMove(block, 'BOT');
      } else {
          endGame('PLAYER'); // Should not happen usually
      }
  };

  const endGame = (winner: 'PLAYER' | 'BOT') => {
      setGameState('GAMEOVER');
      setWinner(winner);
      if (winner === 'PLAYER') {
          onWin(parseFloat(betAmount) * 1.95);
      } else {
          onLoss();
      }
  };

  // --- 3D Block Component ---
  const Block3D: React.FC<{ data: BlockData }> = ({ data }) => {
    // Dimensions
    const w = BLOCK_L; // 100
    const h = BLOCK_H; // 20
    const d = BLOCK_W; // 32

    // Coordinates
    // Tower base center is 0,0,0
    // Layers stack up Y (negative in CSS usually means up, but we'll use positive for stack)
    // Actually CSS 3D: Y is down. So we stack upwards using negative Y.
    
    const y = - (data.layer * BLOCK_H) - (BLOCK_H / 2); // Center of block in Y
    
    let x = 0;
    let z = 0;
    let rotY = 0;

    if (data.axis === 'X') {
        // Aligned with X axis
        x = 0; // Center of block length is at 0
        z = data.offset; // Offset along Z (-34, 0, 34)
        rotY = 0;
    } else {
        // Aligned with Z axis (Rotated 90deg)
        x = data.offset; // Offset along X (-34, 0, 34)
        z = 0;
        rotY = 90;
    }

    // Colors (Simulate Wood Lighting)
    const cTop = '#e6ccb2';
    const cFront = '#ddb892';
    const cRight = '#b08968'; 
    const cBack = '#9c6644'; // Darker
    const cLeft = '#7f5539'; // Darkest
    const cBottom = '#5c4033';

    if (data.removed) return null; // Or animate out

    return (
      <div
        onClick={() => handleBlockClick(data.id)}
        className={`absolute transform-style-3d transition-transform hover:brightness-110 cursor-pointer ${gameState === 'GAMEOVER' ? 'collapse-anim' : ''}`}
        style={{
          width: w,
          height: h,
          transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) translate(-50%, -50%)`, // Center pivot
        }}
      >
        {/* Front Face (w x h) */}
        <div className="absolute border border-black/10" style={{ width: w, height: h, backgroundColor: cFront, transform: `rotateY(0deg) translateZ(${d / 2}px)` }} />
        
        {/* Back Face (w x h) */}
        <div className="absolute border border-black/10" style={{ width: w, height: h, backgroundColor: cBack, transform: `rotateY(180deg) translateZ(${d / 2}px)` }} />
        
        {/* Right Face (d x h) */}
        <div className="absolute border border-black/10" style={{ width: d, height: h, backgroundColor: cRight, transform: `rotateY(90deg) translateZ(${w / 2}px)` }} />
        
        {/* Left Face (d x h) */}
        <div className="absolute border border-black/10" style={{ width: d, height: h, backgroundColor: cLeft, transform: `rotateY(-90deg) translateZ(${w / 2}px)` }} />
        
        {/* Top Face (w x d) */}
        <div className="absolute border border-black/10" style={{ width: w, height: d, backgroundColor: cTop, transform: `rotateX(90deg) translateZ(${h / 2}px)` }} />
        
        {/* Bottom Face (w x d) */}
        <div className="absolute border border-black/10" style={{ width: w, height: d, backgroundColor: cBottom, transform: `rotateX(-90deg) translateZ(${h / 2}px)` }} />
        
        {/* Hover Highlight (Invisible hit area for better UX, or just color shift on parent) */}
        {turn === 'PLAYER' && (
           <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 pointer-events-none transform translate-z-[20px]" style={{ transform: `rotateX(90deg) translateZ(${h/2 + 1}px)`, width: w, height: d }} />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 md:p-8 gap-6 h-[800px] relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Jenga">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Compete against the Bot to remove blocks from the tower without making it fall.</p>
             </section>
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li>Place your bet.</li>
                 <li>Click a block to remove it.</li>
                 <li>Removing unsafe blocks lowers "Stability".</li>
                 <li>If the tower falls on your turn, you lose.</li>
                 <li>If the tower falls on the Bot's turn, you win!</li>
               </ul>
            </section>
          </div>
       </GameInfoModal>

       <style>{`
         .transform-style-3d { transform-style: preserve-3d; }
         .collapse-anim { animation: collapse 1s ease-in forwards; }
         @keyframes collapse {
            0% { transform: translate3d(var(--tw-translate-x), var(--tw-translate-y), var(--tw-translate-z)) rotateY(var(--tw-rotate-y)); }
            100% { transform: translate3d(calc(var(--tw-translate-x) + 50px), calc(var(--tw-translate-y) + 300px), var(--tw-translate-z)) rotateY(var(--tw-rotate-y)) rotateZ(45deg); opacity: 0; }
         }
       `}</style>

       <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
          
          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-card p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-6 h-fit shrink-0 z-20">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-white uppercase tracking-wider">Jenga 3D</h2>
                 <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white"><HelpCircle size={20}/></button>
             </div>

             {/* Status */}
             {gameState === 'PLAYING' && (
                 <div className={`p-4 rounded-lg border flex flex-col gap-2 ${turn === 'PLAYER' ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-gray-400">Turn</span>
                        <div className="flex items-center gap-2 font-bold text-white">
                           {turn === 'PLAYER' ? <User size={16} /> : <Bot size={16} />}
                           {message}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-gray-400">Stability</span>
                        <span className={`font-mono font-bold ${stability > 70 ? 'text-emerald-400' : stability > 40 ? 'text-yellow-400' : 'text-red-500'}`}>
                           {stability.toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div className={`h-full transition-all duration-500 ${stability > 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${stability}%` }}></div>
                    </div>
                 </div>
             )}

             {/* Controls */}
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                   <input 
                     type="number" 
                     value={betAmount} 
                     onChange={(e) => setBetAmount(e.target.value)}
                     disabled={gameState === 'PLAYING'}
                     className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white font-mono"
                   />
                </div>
             </div>
             
             <div className="mt-auto">
                 {gameState === 'IDLE' || gameState === 'GAMEOVER' ? (
                     <button 
                       onClick={startGame}
                       className="w-full bg-accent hover:bg-accent-hover text-background font-bold text-xl py-4 rounded-lg shadow-[0_0_20px_rgba(0,231,1,0.3)] transition-all active:scale-95"
                     >
                        {gameState === 'GAMEOVER' ? 'PLAY AGAIN' : 'START GAME'}
                     </button>
                 ) : (
                     <button disabled className="w-full bg-slate-700 text-gray-500 font-bold py-4 rounded-lg cursor-not-allowed">
                        IN PROGRESS
                     </button>
                 )}
             </div>

             {/* Rotation */}
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs text-gray-500 uppercase font-bold mb-2">
                   <span>Rotate Camera</span>
                   <RotateCcw size={12} />
                </div>
                <input 
                  type="range" 
                  min="0" max="360" 
                  value={rotation} 
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-accent h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
          </div>

          {/* 3D Viewport */}
          <div className="flex-1 bg-[#0f212e] rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner perspective-1000 cursor-move">
             
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/30 via-transparent to-transparent pointer-events-none"></div>

             {/* Scene Container */}
             <div 
                className="relative w-0 h-0 transform-style-3d transition-transform duration-300 ease-out"
                style={{ 
                    transform: `translateZ(-400px) rotateX(-25deg) rotateY(${rotation}deg)` 
                }}
             >
                 {/* Floor */}
                 <div className="absolute bg-white/5 rounded-full border-2 border-white/10 transform-style-3d"
                      style={{ width: 600, height: 600, transform: 'rotateX(90deg) translateZ(0px) translate(-50%, -50%)' }}>
                      <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#fff_0,#fff_1px,transparent_1px,transparent_20px)]"></div>
                 </div>

                 {/* Tower */}
                 <div className="absolute transform-style-3d" style={{ transform: `translateY(${LAYERS_COUNT * BLOCK_H * 0.5}px)` }}> 
                    {/* Offset Y to center tower vertically if needed, or strictly sit on floor */}
                    {blocks.map(b => (
                       <Block3D key={b.id} data={b} />
                    ))}
                 </div>
             </div>

             {/* Result Overlay */}
             {gameState === 'GAMEOVER' && winner && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in zoom-in fade-in duration-300">
                   <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-2xl text-center shadow-2xl max-w-sm">
                      {winner === 'PLAYER' ? (
                          <>
                             <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                             <h3 className="text-3xl font-black text-white mb-2">VICTORY!</h3>
                             <div className="bg-emerald-900/30 text-emerald-400 font-mono font-bold text-2xl py-3 rounded-lg border border-emerald-500/30">
                                +${(parseFloat(betAmount) * 1.95).toFixed(2)}
                             </div>
                          </>
                      ) : (
                          <>
                             <AlertTriangle size={64} className="text-red-500 mx-auto mb-4 animate-pulse" />
                             <h3 className="text-3xl font-black text-white mb-2">CRASHED!</h3>
                             <div className="bg-red-900/30 text-red-400 font-mono font-bold text-xl py-3 rounded-lg border border-red-500/30">
                                -${parseFloat(betAmount).toFixed(2)}
                             </div>
                          </>
                      )}
                      <button 
                        onClick={startGame}
                        className="w-full bg-white text-black font-bold py-3 rounded-full mt-6 hover:scale-105 transition-transform"
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

export default Jenga;
