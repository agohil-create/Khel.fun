
import React, { useState, useEffect } from 'react';
import { Trophy, Dog, Cat, Ghost, Bot, Zap, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface RaceProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const RACERS = [
  { id: 0, name: 'Doge', icon: Dog, color: 'text-yellow-400', bg: 'bg-yellow-500' },
  { id: 1, name: 'Kitty', icon: Cat, color: 'text-pink-400', bg: 'bg-pink-500' },
  { id: 2, name: 'Spooky', icon: Ghost, color: 'text-purple-400', bg: 'bg-purple-500' },
  { id: 3, name: 'Robo', icon: Bot, color: 'text-blue-400', bg: 'bg-blue-500' },
];

const Race: React.FC<RaceProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [selectedRacer, setSelectedRacer] = useState<number | null>(null);
  const [positions, setPositions] = useState<number[]>([0, 0, 0, 0]);
  const [racing, setRacing] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const startRace = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || selectedRacer === null || racing) return;
    if (!onBet(amount)) return;

    setRacing(true);
    setWinner(null);
    setPositions([0, 0, 0, 0]);

    const interval = setInterval(() => {
      setPositions(prev => {
        const next = prev.map(p => {
          // Random increment with occasional "boosts"
          const increment = Math.random() * 1.5 + (Math.random() > 0.9 ? 3 : 0);
          return Math.min(100, p + increment);
        });

        // Check for winner
        const w = next.findIndex(p => p >= 100);
        if (w !== -1) {
          clearInterval(interval);
          setWinner(w);
          setRacing(false);
          if (w === selectedRacer) {
            onWin(amount * 3.8); // 4 racers ~4x payout minus house edge
          } else {
            onLoss();
          }
        }
        return next;
      });
    }, 50);
  };

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-6 gap-8 relative">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Race">
         <div className="space-y-4">
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Bet on the racer you think will cross the finish line first.</p>
            </section>
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li>Select a racer (Doge, Kitty, Spooky, or Robo).</li>
                 <li>Set your bet amount.</li>
                 <li>Click <strong>Start Race</strong>.</li>
                 <li>If your racer wins, you get 3.8x your bet!</li>
               </ul>
            </section>
         </div>
      </GameInfoModal>

      <button onClick={() => setShowInfo(true)} className="absolute top-0 right-4 text-gray-500 hover:text-white p-2">
          <HelpCircle size={24} />
      </button>

      {/* Race Track */}
      <div className="w-full bg-slate-900 rounded-xl p-6 border border-slate-800 relative overflow-hidden">
         {/* Finish Line */}
         <div className="absolute right-10 top-0 bottom-0 w-2 bg-white/20 border-l-2 border-dashed border-white/50 z-0"></div>
         <div className="absolute right-10 top-2 text-xs text-white/30 font-bold uppercase">Finish</div>

         <div className="flex flex-col gap-6 relative z-10">
            {RACERS.map((racer, i) => (
              <div key={i} className="relative">
                 <div className="w-full h-3 bg-slate-800 rounded-full absolute top-1/2 -translate-y-1/2"></div>
                 <div 
                   className="relative transition-all duration-75 ease-linear flex items-center gap-2"
                   style={{ left: `${positions[i]}%` }}
                 >
                   <div className={`p-3 rounded-full ${racer.bg} shadow-lg ring-4 ring-black`}>
                      <racer.icon size={24} className="text-white" />
                   </div>
                   {racing && Math.random() > 0.8 && <Zap size={16} className="text-yellow-400 animate-ping absolute -right-6" />}
                   {winner === i && <Trophy size={24} className="text-yellow-400 animate-bounce" />}
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-2xl bg-card p-6 rounded-xl border border-slate-800 flex flex-col gap-6">
         <div className="grid grid-cols-4 gap-4">
            {RACERS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRacer(r.id)}
                disabled={racing}
                className={`
                  p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                  ${selectedRacer === r.id ? `border-${r.color.split('-')[1]}-500 bg-slate-700` : 'border-slate-700 hover:border-slate-600'}
                `}
              >
                <r.icon size={32} className={r.color} />
                <span className="font-bold text-white">{r.name}</span>
                <span className="text-xs text-gray-500">3.8x</span>
              </button>
            ))}
         </div>

         <div className="flex gap-4 items-end">
            <div className="flex-1">
               <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
               <input 
                 type="number" 
                 value={betAmount} 
                 onChange={e => setBetAmount(e.target.value)} 
                 disabled={racing}
                 className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white font-mono"
               />
            </div>
            <button 
              onClick={startRace} 
              disabled={racing || selectedRacer === null} 
              className="flex-[2] bg-accent hover:bg-accent-hover disabled:opacity-50 text-background font-black py-3 rounded-lg h-[50px]"
            >
              {racing ? 'RACING...' : 'START RACE'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default Race;
