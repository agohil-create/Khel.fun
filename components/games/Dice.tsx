import React, { useState } from 'react';
import { ArrowRightLeft, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface DiceProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const Dice: React.FC<DiceProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [target, setTarget] = useState(50);
  const [rollType, setRollType] = useState<'over' | 'under'>('over');
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Calculate Multiplier
  // Win Chance = if Over 50, chance is 50%. if Under 20, chance is 20%.
  // House edge 1%
  const winChance = rollType === 'over' ? 100 - target : target;
  const multiplier = 99 / winChance; // 99 instead of 100 for 1% house edge

  const handleRoll = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    // Animate roll (mock)
    const result = Math.random() * 100;
    setLastRoll(result);

    const won = rollType === 'over' ? result > target : result < target;
    setIsWin(won);

    if (won) {
      onWin(amount * multiplier);
    } else {
      onLoss();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-8 relative">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Dice">
        <div className="space-y-4">
           <section>
             <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
             <p>Predict whether the result of the dice roll will be higher or lower than the selected number.</p>
           </section>
           <section>
             <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
             <ul className="list-disc pl-4 space-y-2 text-gray-400">
               <li>Choose <strong>Roll Over</strong> or <strong>Roll Under</strong>.</li>
               <li>Adjust the slider to change the target number (2-98).</li>
               <li>The <strong>Win Chance</strong> and <strong>Multiplier</strong> update automatically based on your target.</li>
               <li>Lower win chance = Higher payout multiplier.</li>
               <li>Click <strong>Roll Dice</strong> to generate a random number between 0.00 and 100.00.</li>
             </ul>
           </section>
        </div>
      </GameInfoModal>

      {/* Header with Help */}
      <div className="absolute top-0 right-4 z-10">
        <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white transition-colors p-2">
          <HelpCircle size={24} />
        </button>
      </div>

      {/* Result Display */}
      <div className="w-full h-48 bg-card rounded-2xl border border-slate-700 relative flex items-center justify-center overflow-hidden shadow-2xl">
         <div className="absolute inset-0 flex items-center px-10">
            {/* Slider Track visual */}
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden relative">
              <div 
                 className={`h-full absolute transition-all duration-300 ${rollType === 'over' ? 'right-0 bg-accent' : 'left-0 bg-accent'}`}
                 style={{ width: `${winChance}%` }}
              />
              {/* Result Indicator */}
              {lastRoll !== null && (
                 <div 
                   className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-white border-2 border-gray-400 rounded z-10 transition-all duration-500 ease-out"
                   style={{ left: `${lastRoll}%` }}
                 />
              )}
            </div>
         </div>
         
         {lastRoll !== null && (
           <div className={`
             absolute top-6 text-4xl font-black font-mono 
             ${isWin ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-gray-500'}
           `}>
             {lastRoll.toFixed(2)}
           </div>
         )}
      </div>

      {/* Controls */}
      <div className="bg-card p-8 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-8">
         <div className="flex-1 space-y-6">
            <div className="flex gap-4">
               <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input 
                      type="number" 
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white font-mono"
                    />
                  </div>
               </div>
               <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Multiplier</label>
                  <div className="bg-slate-800 rounded-lg py-3 px-4 text-white font-mono text-center border border-slate-700">
                    x{multiplier.toFixed(4)}
                  </div>
               </div>
            </div>

             <button 
                onClick={handleRoll}
                className="w-full bg-accent hover:bg-accent-hover text-background font-bold text-xl py-5 rounded-lg shadow-[0_0_20px_rgba(0,231,1,0.3)] transition-transform active:scale-95"
              >
                Roll Dice
            </button>
         </div>

         <div className="flex-1 space-y-6 bg-background/50 p-6 rounded-xl border border-slate-800/50">
            <div className="flex justify-between items-center text-sm font-medium text-gray-400">
               <span>Roll {rollType === 'over' ? 'Over' : 'Under'}</span>
               <button 
                 onClick={() => setRollType(prev => prev === 'over' ? 'under' : 'over')} 
                 className="flex items-center gap-1 text-accent hover:text-white transition-colors"
               >
                 <ArrowRightLeft size={14} /> Swap
               </button>
            </div>
            
            <div className="text-center">
               <span className="text-6xl font-bold text-white font-mono">{target}</span>
            </div>

            <input 
              type="range" 
              min="2" 
              max="98" 
              value={target} 
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full accent-accent h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex justify-between text-xs text-gray-500 font-mono">
              <span>2</span>
              <span>98</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dice;