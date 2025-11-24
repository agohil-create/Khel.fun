import React, { useState } from 'react';
import { Target, HelpCircle } from 'lucide-react';
import GameInfoModal from './GameInfoModal';

interface LimboProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const Limbo: React.FC<LimboProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [targetMult, setTargetMult] = useState('2.00');
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleBet = () => {
    const amount = parseFloat(betAmount);
    const target = parseFloat(targetMult);
    
    if (isNaN(amount) || amount <= 0 || isNaN(target) || target < 1.01) return;
    if (!onBet(amount)) return;

    // Generate Result
    // Logic: 0.99 / (1 - random)
    const r = Math.random();
    const outcome = Math.max(1.00, 0.99 / (1 - r));
    
    setResult(outcome);
    
    if (outcome >= target) {
       setWin(true);
       onWin(amount * target);
    } else {
       setWin(false);
       onLoss();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center gap-10 pt-10 relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Limbo">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Set a payout target and bet that the result will be higher.</p>
             </section>
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li>Enter a <strong>Target Multiplier</strong>. This is your potential payout.</li>
                 <li>Place your bet.</li>
                 <li>A random number is generated.</li>
                 <li>If the result is <strong>higher or equal</strong> to your target, you win!</li>
                 <li>If the result is lower, you lose the bet.</li>
                 <li>Payout = Bet Amount × Target Multiplier.</li>
               </ul>
             </section>
          </div>
       </GameInfoModal>

       <button onClick={() => setShowInfo(true)} className="absolute top-0 right-4 text-gray-500 hover:text-white p-2">
          <HelpCircle size={24} />
       </button>

       <div className="relative">
          <div className={`text-8xl md:text-9xl font-black font-mono tracking-tighter transition-colors duration-300 ${win ? 'text-emerald-400' : result !== null ? 'text-danger' : 'text-slate-600'}`}>
             {result ? result.toFixed(2) + 'x' : '1.00x'}
          </div>
          <Target className="absolute -top-10 -right-10 text-slate-800 w-32 h-32 -z-10" />
       </div>

       <div className="w-full max-w-md bg-card p-6 rounded-xl border border-slate-800 space-y-6 shadow-2xl">
          <div className="grid grid-cols-2 gap-4">
             <div>
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
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Target Multiplier</label>
                <div className="relative">
                    <input 
                      type="number" 
                      value={targetMult}
                      onChange={(e) => setTargetMult(e.target.value)}
                      className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">x</span>
                  </div>
             </div>
          </div>

          <button 
            onClick={handleBet}
            className="w-full bg-accent hover:bg-accent-hover text-background font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(0,231,1,0.3)] transition-transform active:scale-95"
          >
            Bet
          </button>
       </div>
    </div>
  );
};

export default Limbo;