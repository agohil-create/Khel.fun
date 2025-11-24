import React, { useState, useEffect, useCallback } from 'react';
import { Bomb, Diamond, HelpCircle } from 'lucide-react';
import { BetResult } from '../../types';
import GameInfoModal from '../GameInfoModal';
import { useGameSound } from '../../hooks/useGameSound';

interface MinesProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const Mines: React.FC<MinesProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState<string>('10');
  const [mineCount, setMineCount] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<number[]>(Array(25).fill(0)); // 0: hidden, 1: gem, 2: mine
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [mineIndices, setMineIndices] = useState<Set<number>>(new Set());
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  const { playClick, playPop, playExplode, playWin, playPing } = useGameSound();

  // Calculate multiplier based on remaining safe spots
  const calculateMultiplier = (mines: number, revealedCount: number) => {
    // Simplified nCr based probability logic for demo
    let multiplier = 1;
    const totalCells = 25;
    for (let i = 0; i < revealedCount; i++) {
      multiplier *= (totalCells - i) / (totalCells - mines - i);
    }
    // House edge 1%
    return Math.max(1, multiplier * 0.99);
  };

  const startGame = () => {
    playClick();
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    if (!onBet(amount)) return; // Insufficient funds

    // Generate mines
    const newMines = new Set<number>();
    while (newMines.size < mineCount) {
      newMines.add(Math.floor(Math.random() * 25));
    }

    setMineIndices(newMines);
    setRevealed(Array(25).fill(false));
    setGrid(Array(25).fill(0));
    setIsPlaying(true);
    setIsGameOver(false);
    setCurrentMultiplier(1);
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying || revealed[index] || isGameOver) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (mineIndices.has(index)) {
      // Hit a mine
      playExplode();
      endGame(false);
    } else {
      // Found a gem
      playPing();
      const revealedCount = newRevealed.filter(r => r).length;
      const nextMult = calculateMultiplier(mineCount, revealedCount);
      setCurrentMultiplier(nextMult);
    }
  };

  const endGame = (won: boolean) => {
    setIsPlaying(false);
    setIsGameOver(true);
    
    // Reveal all mines
    const finalRevealed = Array(25).fill(true);
    setRevealed(finalRevealed);

    if (won) {
      playWin();
      const amount = parseFloat(betAmount);
      onWin(amount * currentMultiplier);
    } else {
      onLoss();
    }
  };

  const cashOut = () => {
    if (!isPlaying) return;
    playClick();
    endGame(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl mx-auto p-4">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Mines">
        <div className="space-y-4">
           <section>
             <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
             <p>Reveal tiles on the grid to find Gems and increase your multiplier. Avoid the Mines!</p>
           </section>
           <section>
             <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
             <ul className="list-disc pl-4 space-y-2 text-gray-400">
               <li>Set your <strong>Bet Amount</strong> and the number of <strong>Mines</strong> (1-24).</li>
               <li>More mines mean higher multipliers for each Gem found, but a higher risk of losing.</li>
               <li>Click <strong>Bet</strong> to start.</li>
               <li>Click on grid tiles to reveal them.</li>
               <li><strong>Gem:</strong> Your multiplier increases. You can continue or cash out.</li>
               <li><strong>Mine:</strong> The game ends and you lose your bet.</li>
               <li>Click <strong>Cash Out</strong> at any time to claim your winnings.</li>
             </ul>
           </section>
        </div>
      </GameInfoModal>

      {/* Controls */}
      <div className="w-full lg:w-80 bg-card p-6 rounded-xl flex flex-col gap-6 h-fit shadow-xl">
        <div className="flex justify-between items-center">
           <h2 className="text-xl font-bold text-white">Controls</h2>
           <button onClick={() => setShowInfo(true)} className="text-gray-400 hover:text-white transition-colors">
              <HelpCircle size={20} />
           </button>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Bet Amount</label>
          <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
             <input 
               type="number" 
               value={betAmount}
               onChange={(e) => setBetAmount(e.target.value)}
               disabled={isPlaying}
               className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white focus:border-accent focus:outline-none transition-colors font-mono"
             />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Mines</label>
          <select 
            value={mineCount} 
            onChange={(e) => setMineCount(Number(e.target.value))}
            disabled={isPlaying}
            className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white focus:border-accent focus:outline-none cursor-pointer"
          >
            {[1, 3, 5, 10, 24].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        {!isPlaying ? (
          <button 
            onClick={startGame}
            className="w-full bg-accent hover:bg-accent-hover text-background font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(0,231,1,0.3)] transition-all active:scale-95 mt-auto"
          >
            Bet
          </button>
        ) : (
          <button 
            onClick={cashOut}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-lg shadow-lg transition-all active:scale-95 mt-auto flex flex-col items-center leading-tight"
          >
            <span>CASH OUT</span>
            <span className="text-sm opacity-90">
              ${(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
            </span>
          </button>
        )}
      </div>

      {/* Game Board */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background/50 rounded-xl p-6 md:p-10 border border-slate-800 relative overflow-hidden">
        {isPlaying && (
           <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-600">
             <span className="text-2xl font-bold text-accent font-mono">x{currentMultiplier.toFixed(2)}</span>
           </div>
        )}

        <div className="grid grid-cols-5 gap-3 md:gap-4 w-full max-w-[500px] aspect-square">
          {Array.from({ length: 25 }).map((_, i) => {
            const isRevealed = revealed[i];
            const isMine = mineIndices.has(i);
            const showMine = isRevealed && isMine;
            const showGem = isRevealed && !isMine;

            return (
              <button
                key={i}
                onClick={() => handleTileClick(i)}
                disabled={!isPlaying || isRevealed}
                className={`
                  relative rounded-lg transition-all duration-300 transform overflow-hidden group
                  ${!isRevealed 
                    ? 'bg-card hover:-translate-y-1 hover:shadow-lg hover:bg-slate-600' 
                    : showMine ? 'bg-slate-900 border-2 border-danger' : 'bg-slate-900 border-2 border-emerald-500'}
                `}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {showMine && <Bomb className="w-1/2 h-1/2 text-danger animate-pulse-fast" />}
                  {showGem && <Diamond className="w-1/2 h-1/2 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                </div>
                {!isRevealed && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Mines;