import React, { useState, useEffect } from 'react';
import { AlignVerticalJustifyEnd, Skull, Diamond, Lock, Zap, HelpCircle, ShieldAlert, ArrowUpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface TowerProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const ROWS = 10;
const COLS = 4;

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const DIFFICULTIES: Record<Difficulty, { mines: number; multipliers: number[] }> = {
  'Easy': { 
    mines: 1, 
    // 3/4 chance to win. Lower risk, steady climb.
    multipliers: [1.31, 1.74, 2.32, 3.09, 4.12, 5.49, 7.32, 9.76, 13.01, 17.35]
  },
  'Medium': { 
    mines: 2, 
    // 50/50 chance. Classic doubling.
    multipliers: [1.96, 3.92, 7.84, 15.68, 31.36, 62.72, 125.44, 250.88, 501.76, 1003.52]
  },
  'Hard': { 
    mines: 3, 
    // 1/4 chance. High risk, insane rewards.
    multipliers: [3.92, 15.36, 60.21, 236.03, 925.26, 3627.01, 14217.9, 55734.1, 218477, 856432]
  }
};

const Tower: React.FC<TowerProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRow, setCurrentRow] = useState(0); // 0 is bottom
  const [grid, setGrid] = useState<number[][]>([]); // 0: safe, 1: mine
  const [revealed, setRevealed] = useState<boolean[][]>([]); // Track which specific tile was clicked
  const [gameOverState, setGameOverState] = useState<'WIN' | 'LOSS' | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Initialize Game
  const startGame = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    // Generate Grid
    const mineCount = DIFFICULTIES[difficulty].mines;
    const newGrid: number[][] = [];
    
    for (let r = 0; r < ROWS; r++) {
      const row = Array(COLS).fill(0);
      let placed = 0;
      while (placed < mineCount) {
        const c = Math.floor(Math.random() * COLS);
        if (row[c] === 0) {
          row[c] = 1;
          placed++;
        }
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setRevealed(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
    setCurrentRow(0);
    setGameOverState(null);
    setIsPlaying(true);
  };

  const handleTileClick = (col: number) => {
    if (!isPlaying || gameOverState) return;

    // Check logic
    const isMine = grid[currentRow][col] === 1;
    
    // Update revealed state for UI
    const newRevealed = [...revealed];
    const newRowRevealed = [...newRevealed[currentRow]]; // Copy row
    newRowRevealed[col] = true;
    newRevealed[currentRow] = newRowRevealed;
    setRevealed(newRevealed);

    if (isMine) {
      // Game Over: Loss
      setGameOverState('LOSS');
      setIsPlaying(false);
      onLoss();
    } else {
      // Safe
      if (currentRow === ROWS - 1) {
        // Reached Top: Auto Win
        const mult = DIFFICULTIES[difficulty].multipliers[currentRow];
        const winAmount = parseFloat(betAmount) * mult;
        onWin(winAmount);
        setGameOverState('WIN');
        setIsPlaying(false);
      } else {
        // Move up
        setCurrentRow(prev => prev + 1);
      }
    }
  };

  const autoPick = () => {
    if (!isPlaying || gameOverState) return;
    
    // Pick a random unrevealed spot (though in this game logic, we only pick 1 per row)
    const randomCol = Math.floor(Math.random() * COLS);
    handleTileClick(randomCol);
  };

  const cashOut = () => {
    if (!isPlaying || currentRow === 0 || gameOverState) return;
    
    const mult = DIFFICULTIES[difficulty].multipliers[currentRow - 1];
    const winAmount = parseFloat(betAmount) * mult;
    onWin(winAmount);
    setGameOverState('WIN');
    setIsPlaying(false);
  };

  // Helper to get current multiplier
  const getCurrentMultiplier = () => {
    if (currentRow === 0) return 0;
    return DIFFICULTIES[difficulty].multipliers[currentRow - 1];
  };
  
  const getNextMultiplier = () => {
    if (currentRow >= ROWS) return 0;
    return DIFFICULTIES[difficulty].multipliers[currentRow];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto p-4 min-h-[600px]">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Tower">
         <div className="space-y-4">
            <section>
              <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
              <p>Climb the tower row by row to increase your multiplier. Avoid the skulls!</p>
            </section>
            <section>
              <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
              <ul className="list-disc pl-4 space-y-2 text-gray-400">
                <li>Choose a <strong>Difficulty</strong> (Easy, Medium, Hard).</li>
                <li>Place your bet.</li>
                <li>Click a tile in the current row.</li>
                <li><strong>Diamond:</strong> You win and advance to the next row.</li>
                <li><strong>Skull:</strong> Game over, you lose your bet.</li>
                <li>You can <strong>Cash Out</strong> after any successful step.</li>
              </ul>
            </section>
         </div>
      </GameInfoModal>

      {/* --- Sidebar Controls --- */}
      <div className="w-full lg:w-80 bg-card p-6 rounded-xl flex flex-col gap-6 h-fit shadow-xl border border-slate-800 shrink-0">
        <div className="flex items-center justify-between text-accent mb-2">
           <div className="flex items-center gap-2">
             <AlignVerticalJustifyEnd size={20} className="fill-current" />
             <span className="text-sm font-bold uppercase tracking-wider">Tower</span>
           </div>
           <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white transition-colors">
              <HelpCircle size={20} />
           </button>
        </div>

        {/* Bet Amount */}
        <div>
           <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
           <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isPlaying}
                className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white font-mono focus:border-accent outline-none transition-colors"
              />
           </div>
        </div>

        {/* Difficulty Selector */}
        <div>
           <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Difficulty</label>
           <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  disabled={isPlaying}
                  className={`py-2 rounded text-xs font-bold transition-all ${difficulty === d ? 'bg-card text-accent shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {d}
                </button>
              ))}
           </div>
           <div className="mt-2 flex justify-between text-[10px] text-gray-500 font-mono uppercase">
             <span>{DIFFICULTIES[difficulty].mines} Mine(s)</span>
           </div>
        </div>

        {/* Game Info */}
        {isPlaying && (
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Current Profit</span>
              <span className="text-emerald-400 font-mono font-bold">
                 ${(parseFloat(betAmount) * getCurrentMultiplier()).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Next Step</span>
              <span className="text-accent font-mono font-bold">
                 {getNextMultiplier().toFixed(2)}x
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto space-y-3">
          {!isPlaying ? (
             <button 
               onClick={startGame}
               className="w-full bg-accent hover:bg-accent-hover text-background font-bold text-lg py-4 rounded-lg shadow-[0_0_20px_rgba(0,231,1,0.2)] transition-all active:scale-95"
             >
               Start Game
             </button>
          ) : (
            <>
               <button 
                 onClick={autoPick}
                 className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
               >
                 <Zap size={16} className="text-yellow-400" /> Auto Pick
               </button>
               <button 
                 onClick={cashOut}
                 disabled={currentRow === 0}
                 className={`w-full font-bold text-lg py-4 rounded-lg shadow-lg transition-all active:scale-95 border-b-4 flex flex-col items-center leading-none gap-1
                   ${currentRow > 0 
                     ? 'bg-emerald-500 border-emerald-700 hover:bg-emerald-400 hover:border-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                     : 'bg-slate-700 border-slate-800 text-gray-500 cursor-not-allowed'}
                 `}
               >
                 <span>CASH OUT</span>
                 {currentRow > 0 && (
                   <span className="text-xs opacity-90 font-mono">
                     ${(parseFloat(betAmount) * getCurrentMultiplier()).toFixed(2)}
                   </span>
                 )}
               </button>
            </>
          )}
        </div>
      </div>

      {/* --- Game Board --- */}
      <div className="flex-1 bg-[#0f212e] rounded-xl border border-slate-800 p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
         
         {/* Background Decoration */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent pointer-events-none"></div>

         <div className="flex flex-col-reverse gap-2 w-full max-w-lg z-10">
            {Array.from({ length: ROWS }).map((_, rowIndex) => {
              const isCurrentRow = rowIndex === currentRow && isPlaying;
              const isPassedRow = rowIndex < currentRow || (gameOverState === 'WIN' && rowIndex < ROWS);
              const isLockedRow = rowIndex > currentRow && isPlaying;
              const multiplier = DIFFICULTIES[difficulty].multipliers[rowIndex];

              return (
                <div 
                  key={rowIndex} 
                  className={`
                    relative flex items-center gap-4 transition-all duration-500 ease-out
                    ${isCurrentRow ? 'scale-105 my-2 opacity-100 z-20' : 'scale-100 opacity-100'}
                    ${isLockedRow ? 'opacity-30 blur-[1px] scale-95' : ''}
                  `}
                >
                   {/* Multiplier Label Left */}
                   <div className={`w-16 text-right font-mono text-sm font-bold transition-colors ${isCurrentRow ? 'text-white' : isPassedRow ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {isPassedRow ? '✓' : `${multiplier.toFixed(2)}x`}
                   </div>

                   {/* Grid Row */}
                   <div className="flex-1 grid grid-cols-4 gap-2 md:gap-3">
                      {Array.from({ length: COLS }).map((_, colIndex) => {
                         // Determine visual state of the tile
                         let tileContent = <HelpCircle size={18} className="text-slate-600 opacity-20" />;
                         let tileStyle = "bg-slate-800 border-slate-900";
                         let effect = "";

                         const isRevealed = revealed[rowIndex] && revealed[rowIndex][colIndex];
                         const isMine = grid[rowIndex] && grid[rowIndex][colIndex] === 1;
                         const showTrueState = isRevealed || (gameOverState && rowIndex === currentRow) || (gameOverState === 'LOSS' && isMine);

                         if (showTrueState) {
                             if (isMine) {
                                tileContent = <Skull size={24} className="text-white drop-shadow-md" />;
                                tileStyle = "bg-red-500 border-red-700 shadow-[0_0_25px_rgba(239,68,68,0.6)] z-10 scale-105";
                                if (isRevealed) effect = "animate-shake"; // Only shake the one we clicked
                             } else {
                                tileContent = <Diamond size={24} className="text-emerald-100 fill-emerald-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />;
                                tileStyle = "bg-emerald-500 border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]";
                                if (isRevealed) effect = "animate-bounce";
                             }
                         } else if (isCurrentRow) {
                             tileContent = <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-accent transition-colors"></div>;
                             tileStyle = "bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500 cursor-pointer hover:-translate-y-1 hover:shadow-lg group shadow-black/40 shadow-lg";
                         } else if (isPassedRow) {
                             // Dimmed safe rows below
                             tileStyle = "bg-slate-800/50 border-slate-800 opacity-40";
                             if (isRevealed) {
                                // Keep the gem visible but dimmed
                                tileContent = <Diamond size={16} className="text-emerald-500/50" />;
                                tileStyle = "bg-emerald-900/20 border-emerald-900/50";
                             }
                         } else {
                             // Locked rows above
                             tileContent = <Lock size={14} className="text-slate-700" />;
                             tileStyle = "bg-slate-800/30 border-slate-800/30";
                         }

                         return (
                           <button
                             key={colIndex}
                             disabled={!isCurrentRow}
                             onClick={() => handleTileClick(colIndex)}
                             className={`
                               relative aspect-square rounded-lg border-b-4 flex items-center justify-center transition-all duration-200
                               ${tileStyle} ${effect}
                             `}
                           >
                             {tileContent}
                           </button>
                         );
                      })}
                   </div>

                   {/* Multiplier Label Right (Mirror) */}
                   <div className={`w-16 text-left font-mono text-sm font-bold transition-colors ${isCurrentRow ? 'text-white' : isPassedRow ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {isPassedRow ? '✓' : `${multiplier.toFixed(2)}x`}
                   </div>
                </div>
              );
            })}
         </div>

         {/* Start Overlay */}
         {!isPlaying && !gameOverState && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
               <div className="text-center animate-in zoom-in fade-in duration-300">
                  <ArrowUpCircle size={64} className="mx-auto text-accent mb-4 opacity-80" />
                  <h3 className="text-2xl font-bold text-white mb-2">Ready to Climb?</h3>
                  <p className="text-gray-400 mb-6 max-w-xs mx-auto">Navigate the tower, avoid the mines, and cash out before it's too late.</p>
                  <button onClick={startGame} className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    Start Round
                  </button>
               </div>
            </div>
         )}
         
         {/* Game Over Overlay */}
         {gameOverState && (
            <div className="absolute inset-0 flex items-center justify-center z-30 animate-in fade-in duration-300 bg-black/50 backdrop-blur-sm">
               <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  
                  {gameOverState === 'WIN' ? (
                    <>
                       <div className="text-6xl mb-4 animate-bounce">💎</div>
                       <h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-wider">Victory!</h3>
                       <div className="text-emerald-400 font-mono text-2xl font-bold mb-8">
                         Won ${(parseFloat(betAmount) * getCurrentMultiplier()).toFixed(2)}
                       </div>
                    </>
                  ) : (
                    <>
                       <div className="text-6xl mb-4 animate-pulse">💀</div>
                       <h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-wider">Busted!</h3>
                       <div className="text-red-400 font-mono text-xl font-bold mb-8 opacity-80">
                         You hit a mine
                       </div>
                    </>
                  )}
                  <button 
                    onClick={startGame} 
                    className="w-full bg-accent text-background font-bold py-4 rounded-lg hover:brightness-110 transition-all shadow-lg active:scale-95"
                  >
                    Play Again
                  </button>
               </div>
            </div>
         )}

      </div>
      
      <style>{`
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default Tower;