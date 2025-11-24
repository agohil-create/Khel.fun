import React, { useState } from 'react';
import { Grid2X2, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface KenoProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const Keno: React.FC<KenoProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [selected, setSelected] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastHits, setLastHits] = useState<number>(0);
  const [showInfo, setShowInfo] = useState(false);

  const toggleNumber = (num: number) => {
    if (isPlaying) return;
    if (selected.includes(num)) {
      setSelected(selected.filter(n => n !== num));
    } else if (selected.length < 10) {
      setSelected([...selected, num]);
    }
  };

  const calculatePayout = (hits: number, selectedCount: number) => {
    if (hits === 0) return 0;
    // Simplified payout table
    const baseMult = 1 + (hits / selectedCount) * 3;
    return Math.floor(baseMult * 100) / 100;
  };

  const handleBet = async () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || selected.length === 0) return;
    if (!onBet(amount)) return;

    setIsPlaying(true);
    setDrawn([]);
    setLastHits(0);

    // Animate drawing
    const newDrawn: number[] = [];
    const available = Array.from({length: 40}, (_, i) => i + 1);
    
    for(let i=0; i<10; i++) {
        await new Promise(r => setTimeout(r, 200));
        const idx = Math.floor(Math.random() * available.length);
        newDrawn.push(available[idx]);
        available.splice(idx, 1);
        setDrawn([...newDrawn]);
    }

    const hits = newDrawn.filter(n => selected.includes(n)).length;
    setLastHits(hits);
    
    // Basic Keno payout logic: Hits needs to be significant
    // For demo: 0 hits = loss, > 1/3 hits = win
    let multiplier = 0;
    if (hits >= Math.ceil(selected.length / 3)) {
        multiplier = 1 + Math.pow(hits, 1.5) * 0.5;
    }

    if (multiplier > 0) {
        onWin(amount * multiplier);
    } else {
        onLoss();
    }
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto p-4">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Keno">
         <div className="space-y-4">
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Pick numbers and hope they match the numbers drawn by the game.</p>
            </section>
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                  <li>Select up to 10 numbers on the grid (1-40).</li>
                  <li>Place your bet.</li>
                  <li>10 numbers are drawn randomly.</li>
                  <li>The more numbers you match (Hits), the higher your payout.</li>
               </ul>
            </section>
         </div>
      </GameInfoModal>

      <div className="w-full lg:w-80 bg-card p-6 rounded-xl flex flex-col gap-6 h-fit shadow-xl">
        <div className="flex justify-between items-center">
           <h2 className="text-xl font-bold text-white">Controls</h2>
           <button onClick={() => setShowInfo(true)} className="text-gray-400 hover:text-white transition-colors">
              <HelpCircle size={20} />
           </button>
        </div>

        <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isPlaying}
              className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white font-mono"
            />
        </div>
        <div className="text-center p-4 bg-slate-900 rounded-lg">
           <div className="text-gray-400 text-xs uppercase">Selected</div>
           <div className="text-xl font-bold text-white">{selected.length} / 10</div>
        </div>
        <button 
          onClick={handleBet}
          disabled={isPlaying || selected.length === 0}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-background font-bold py-4 rounded-lg transition-all"
        >
          {isPlaying ? 'Drawing...' : 'Bet'}
        </button>
      </div>

      <div className="flex-1 bg-background p-6 rounded-xl border border-slate-800">
         <div className="grid grid-cols-8 gap-2 md:gap-3">
            {Array.from({length: 40}, (_, i) => i + 1).map(num => {
                const isSelected = selected.includes(num);
                const isDrawn = drawn.includes(num);
                const isHit = isSelected && isDrawn;
                
                let bgClass = 'bg-slate-800 hover:bg-slate-700 text-gray-400';
                if (isHit) bgClass = 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110 z-10';
                else if (isDrawn) bgClass = 'bg-red-500 text-white';
                else if (isSelected) bgClass = 'bg-accent text-background font-bold';

                return (
                    <button
                      key={num}
                      onClick={() => toggleNumber(num)}
                      className={`aspect-square rounded-lg font-mono font-bold text-sm md:text-lg transition-all duration-300 ${bgClass}`}
                    >
                        {num}
                    </button>
                );
            })}
         </div>
      </div>
    </div>
  );
};

export default Keno;