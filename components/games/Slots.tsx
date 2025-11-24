import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, 
  Diamond, 
  Zap, 
  Rocket, 
  Cpu, 
  Gem, 
  Hexagon, 
  Triangle, 
  Circle,
  Settings2,
  Trophy,
  HelpCircle
} from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface SlotsProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

// --- Configuration ---

type GridSize = '3x3' | '4x3' | '4x4' | '5x3' | '5x4' | '6x4';

interface SymbolDef {
  id: number;
  icon: React.ElementType;
  color: string;
  glow: string;
  value: number; // Base multiplier for 3 matches
  isWild?: boolean;
}

const SYMBOLS: SymbolDef[] = [
  { id: 0, icon: Zap, color: 'text-yellow-400', glow: 'shadow-yellow-400', value: 0, isWild: true }, // Wild
  { id: 1, icon: Crown, color: 'text-amber-500', glow: 'shadow-amber-500', value: 50 }, // Jackpot
  { id: 2, icon: Diamond, color: 'text-cyan-400', glow: 'shadow-cyan-400', value: 25 },
  { id: 3, icon: Gem, color: 'text-pink-500', glow: 'shadow-pink-500', value: 15 },
  { id: 4, icon: Rocket, color: 'text-purple-500', glow: 'shadow-purple-500', value: 10 },
  { id: 5, icon: Cpu, color: 'text-blue-500', glow: 'shadow-blue-500', value: 8 },
  { id: 6, icon: Hexagon, color: 'text-emerald-400', glow: 'shadow-emerald-400', value: 5 },
  { id: 7, icon: Triangle, color: 'text-orange-400', glow: 'shadow-orange-400', value: 3 },
  { id: 8, icon: Circle, color: 'text-slate-400', glow: 'shadow-slate-400', value: 2 },
];

const LAYOUTS: Record<GridSize, { cols: number; rows: number; label: string }> = {
  '3x3': { cols: 3, rows: 3, label: '3 Reels' },
  '4x3': { cols: 4, rows: 3, label: '4 Reels' },
  '4x4': { cols: 4, rows: 4, label: '4x4 Grid' },
  '5x3': { cols: 5, rows: 3, label: '5 Reels' },
  '5x4': { cols: 5, rows: 4, label: '5x4 Grid' },
  '6x4': { cols: 6, rows: 4, label: '6 Reels' },
};

const Slots: React.FC<SlotsProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [layout, setLayout] = useState<GridSize>('5x3');
  const [grid, setGrid] = useState<number[][]>([]); // grid[col][row]
  const [spinning, setSpinning] = useState(false);
  const [stoppingReels, setStoppingReels] = useState<number[]>([]); // Indices of reels currently stopped
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set()); // "col,row" strings
  const [winDetails, setWinDetails] = useState<{ amount: number; text: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const { cols, rows } = LAYOUTS[layout];
  
  // Initialize Grid
  useEffect(() => {
    resetGrid();
  }, [layout]);

  const resetGrid = () => {
    const newGrid = Array.from({ length: cols }, () => 
      Array.from({ length: rows }, () => Math.floor(Math.random() * (SYMBOLS.length - 1) + 1)) // No wilds on reset
    );
    setGrid(newGrid);
    setWinningCells(new Set());
    setWinDetails(null);
    setStoppingReels(Array.from({ length: cols }, (_, i) => i)); // All stopped
  };

  const getRandomSymbolId = () => {
    const r = Math.random();
    if (r < 0.06) return 0; // 6% chance for Wild
    return Math.floor(Math.random() * (SYMBOLS.length - 1)) + 1;
  };

  const spin = async () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || spinning) return;
    if (!onBet(amount)) return;

    setSpinning(true);
    setWinningCells(new Set());
    setWinDetails(null);
    setStoppingReels([]);
    setShowSettings(false);

    // Start spinning animation logic
    const spinInterval = setInterval(() => {
      setGrid(prev => prev.map((col, colIdx) => {
        if (stoppingReels.includes(colIdx)) return col;
        return col.map(() => getRandomSymbolId());
      }));
    }, 50);

    // Determine Result
    const finalGrid: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        finalGrid[c][r] = getRandomSymbolId();
      }
    }

    // Stop reels one by one
    for (let i = 0; i < cols; i++) {
      await new Promise(resolve => setTimeout(resolve, 200 + (i * 150))); // Dynamic delay
      
      setStoppingReels(prev => [...prev, i]);
      setGrid(prev => {
        const next = [...prev];
        next[i] = finalGrid[i];
        return next;
      });
    }

    clearInterval(spinInterval);
    setSpinning(false);
    checkWin(finalGrid, amount);
  };

  const checkWin = (finalGrid: number[][], bet: number) => {
    let totalWin = 0;
    const wins = new Set<string>();

    // Logic: Check each Horizontal Line (Row)
    for (let r = 0; r < rows; r++) {
      let matchCount = 1;
      const firstSymbolId = finalGrid[0][r];
      
      // Identify the target symbol (handle starting Wilds)
      let effectiveSymbolId = firstSymbolId;

      for (let c = 1; c < cols; c++) {
        const symId = finalGrid[c][r];
        const symDef = SYMBOLS[symId];
        const isWild = symDef.isWild;
        
        // If our effective symbol is Wild (started with Wild), take the next non-wild as effective
        if (SYMBOLS[effectiveSymbolId].isWild && !isWild) {
          effectiveSymbolId = symId;
        }

        if (symId === effectiveSymbolId || isWild || SYMBOLS[effectiveSymbolId].isWild) {
          matchCount++;
        } else {
          break;
        }
      }

      // Determine Win (Min 3 matches)
      if (matchCount >= 3) {
        const targetSym = SYMBOLS[effectiveSymbolId].isWild ? SYMBOLS[1] : SYMBOLS[effectiveSymbolId]; // Max payout if all wilds
        
        // Exponential Payout for length
        // 3 matches = Base
        // 4 matches = Base * 2
        // 5 matches = Base * 4
        // 6 matches = Base * 8
        const lengthMultiplier = Math.pow(2, matchCount - 3);
        const winAmount = bet * targetSym.value * lengthMultiplier * 0.1; // 0.1 Factor to balance base bet
        
        totalWin += winAmount;

        // Highlight cells
        for (let i = 0; i < matchCount; i++) wins.add(`${i},${r}`);
      }
    }

    setWinningCells(wins);

    if (totalWin > 0) {
      setWinDetails({ amount: totalWin, text: `Big Win!` });
      onWin(totalWin);
    } else {
      onLoss();
    }
  };

  const SymbolComponent = ({ id, colIndex, rowIndex }: { id: number, colIndex: number, rowIndex: number }) => {
    const def = SYMBOLS[id];
    const Icon = def.icon;
    const isWinner = winningCells.has(`${colIndex},${rowIndex}`);
    const isMoving = spinning && !stoppingReels.includes(colIndex);
    
    // Dynamic sizing based on column count
    const iconSize = cols >= 6 ? 24 : cols >= 5 ? 32 : 40;

    return (
      <div className={`
        relative flex items-center justify-center w-full h-full rounded-lg border border-white/5 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden
        transition-all duration-300
        ${isWinner ? `border-${def.color.split('-')[1]}-500 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] scale-95 z-10` : 'scale-100'}
      `}>
         {/* Background Glow */}
         <div className={`absolute inset-0 opacity-20 bg-${def.color.split('-')[1]}-500/20 blur-xl ${isWinner ? 'animate-pulse opacity-50' : ''}`} />
         
         <div className={`relative flex flex-col items-center justify-center ${isMoving ? 'blur-[2px] scale-y-110 opacity-70' : ''}`}>
             <Icon 
               size={iconSize} 
               className={`
                 ${def.color} 
                 ${isWinner ? `drop-shadow-[0_0_10px_currentColor] animate-bounce` : 'drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]'}
                 transition-all duration-300
               `} 
               strokeWidth={def.isWild ? 3 : 2}
             />
             {def.isWild && <span className="text-[8px] font-black text-yellow-200 uppercase tracking-widest mt-1">WILD</span>}
         </div>
         
         {/* Win Frame */}
         {isWinner && (
           <div className={`absolute inset-0 border-2 border-${def.color.split('-')[1]}-400 rounded-lg animate-pulse`} />
         )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 md:p-8 gap-6">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Slots">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Spin the reels and land matching symbols on horizontal paylines.</p>
             </section>
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li>Choose your grid size (e.g., 5x3).</li>
                 <li>Place your bet.</li>
                 <li>Click <strong>Spin</strong> to start the reels.</li>
                 <li>Match 3 or more symbols consecutively from the left to win.</li>
                 <li><strong>Wild</strong> symbols substitute for any other symbol.</li>
                 <li>Longer matches and higher-value symbols yield bigger payouts.</li>
               </ul>
             </section>
          </div>
       </GameInfoModal>

       {/* --- Header --- */}
       <div className="w-full flex justify-between items-center px-4 h-12 relative">
          <div className="flex gap-2">
            <button 
              onClick={() => !spinning && setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${showSettings ? 'bg-accent text-background border-accent' : 'bg-slate-800 text-gray-400 border-slate-700 hover:border-gray-500'}`}
            >
              <Settings2 size={16} />
              <span className="text-xs font-bold uppercase">{LAYOUTS[layout].label}</span>
            </button>
            <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white px-2 transition-colors">
               <HelpCircle size={20} />
            </button>
          </div>

          {/* Config Popover */}
          {showSettings && (
            <div className="absolute top-14 left-4 z-30 bg-slate-800 border border-slate-700 p-2 rounded-xl shadow-2xl grid grid-cols-2 gap-2 w-64 animate-in zoom-in-95 slide-in-from-top-2">
               {(Object.keys(LAYOUTS) as GridSize[]).map(l => (
                 <button
                   key={l}
                   onClick={() => { setLayout(l); setShowSettings(false); }}
                   className={`
                     px-3 py-2 text-xs font-bold rounded-lg transition-colors flex flex-col items-center gap-1
                     ${layout === l ? 'bg-accent text-background shadow-lg' : 'bg-slate-900 text-gray-500 hover:bg-slate-700 hover:text-white'}
                   `}
                 >
                   <span>{LAYOUTS[l].label}</span>
                   <span className="text-[9px] opacity-70">{LAYOUTS[l].cols}x{LAYOUTS[l].rows}</span>
                 </button>
               ))}
            </div>
          )}

          {winDetails && (
             <div className="animate-in zoom-in slide-in-from-bottom duration-300">
                <div className="bg-yellow-500/10 border border-yellow-500/50 px-6 py-2 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                   <Trophy size={20} className="text-yellow-400" />
                   <span className="text-yellow-400 font-black text-xl">${winDetails.amount.toFixed(2)}</span>
                </div>
             </div>
          )}
       </div>

       {/* --- Slot Machine Cabinet --- */}
       <div className="relative p-6 bg-slate-800 rounded-3xl border-4 border-slate-700 shadow-2xl w-full max-w-5xl">
          {/* Top Metallic Bar */}
          <div className="absolute top-0 left-10 right-10 h-2 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-lg opacity-50"></div>
          
          {/* Grid Container */}
          <div 
             className="grid gap-2 bg-black/80 p-4 rounded-xl border border-slate-600/50 shadow-inner relative overflow-hidden transition-all duration-300"
             style={{
               gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
             }}
          >
             {/* Neon Line Overlay */}
             <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

             {/* Reels */}
             {grid.map((col, cIndex) => (
                <div key={cIndex} className="flex flex-col gap-2">
                   {col.map((symbolId, rIndex) => (
                      <div key={`${cIndex}-${rIndex}`} className="aspect-[3/4] md:aspect-square">
                         <SymbolComponent id={symbolId} colIndex={cIndex} rowIndex={rIndex} />
                      </div>
                   ))}
                </div>
             ))}
          </div>

          {/* Bottom Metallic Bar */}
          <div className="absolute bottom-0 left-10 right-10 h-4 bg-gradient-to-t from-slate-600 to-slate-800 rounded-t-lg opacity-50"></div>
       </div>

       {/* --- Controls --- */}
       <div className="w-full max-w-2xl bg-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-6 shadow-xl relative z-10">
           <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase">Bet Amount</label>
                <div className="flex gap-2">
                   <button onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))} disabled={spinning} className="text-[10px] bg-slate-800 px-2 rounded text-gray-400 hover:text-white transition-colors">2x</button>
                   <button onClick={() => setBetAmount('100')} disabled={spinning} className="text-[10px] bg-slate-800 px-2 rounded text-gray-400 hover:text-white transition-colors">MAX</button>
                </div>
              </div>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                 <input 
                   type="number" 
                   value={betAmount} 
                   onChange={e => setBetAmount(e.target.value)} 
                   disabled={spinning} 
                   className="w-full bg-background border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-white font-mono font-bold text-lg focus:border-accent outline-none transition-colors"
                 />
              </div>
           </div>
           
           <button 
             onClick={spin} 
             disabled={spinning} 
             className={`
               md:w-48 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed
               text-background font-black text-2xl py-4 rounded-xl shadow-[0_0_30px_rgba(0,231,1,0.3)]
               transition-all active:scale-95 flex flex-col items-center justify-center leading-none
             `}
           >
             <span>{spinning ? '...' : 'SPIN'}</span>
           </button>
       </div>
    </div>
  );
};

export default Slots;