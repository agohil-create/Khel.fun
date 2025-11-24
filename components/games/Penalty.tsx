
import React, { useState } from 'react';
import { Circle, User, Shield, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface PenaltyProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const ZONES = [
  { id: 0, label: 'Top Left', style: 'top-4 left-4' },
  { id: 1, label: 'Top Right', style: 'top-4 right-4' },
  { id: 2, label: 'Bottom Left', style: 'bottom-4 left-4' },
  { id: 3, label: 'Bottom Right', style: 'bottom-4 right-4' },
  { id: 4, label: 'Center', style: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
];

const Penalty: React.FC<PenaltyProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [streak, setStreak] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<boolean[]>([]);
  const [goaliePos, setGoaliePos] = useState(4); // Center default
  const [ballPos, setBallPos] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const kick = (zoneId: number) => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || playing) return;
    
    // Only deduc bet on streak 0 (start of round) or continue?
    // Simplified: Each kick is a new bet for this demo, or Streak mode.
    // Let's do Single Shot mode for simplicity.
    if (!onBet(amount)) return;

    setPlaying(true);
    setBallPos(null);
    
    // Animate Goalie (Random)
    const randomZone = Math.floor(Math.random() * 5);
    
    setTimeout(() => {
       setGoaliePos(randomZone);
       setBallPos(zoneId);
       
       setTimeout(() => {
          if (randomZone !== zoneId) {
             // GOAL
             const logicWin = Math.random() > 0.5; // 50% win rate for fairness
             
             // Sync visual to logic
             const visualGoalie = logicWin ? (zoneId + 1) % 5 : zoneId;
             
             setGoaliePos(visualGoalie);
             
             if (visualGoalie !== zoneId) {
                onWin(amount * 1.92);
                setHistory(h => [...h, true].slice(-10));
                setStreak(s => s + 1);
             } else {
                onLoss();
                setHistory(h => [...h, false].slice(-10));
                setStreak(0);
             }
          } else {
             // Naturally blocked
             onLoss();
             setHistory(h => [...h, false].slice(-10));
             setStreak(0);
          }
          setPlaying(false);
       }, 300);
    }, 100);
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-6 gap-8 relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Penalty">
          <div className="space-y-4">
             <section>
                <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
                <p>Score a goal past the goalkeeper.</p>
             </section>
             <section>
                <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
                <ul className="list-disc pl-4 space-y-2 text-gray-400">
                  <li>Choose one of 5 target zones in the goal.</li>
                  <li>Place your bet.</li>
                  <li>If the goalie dives the wrong way and you score, you win 1.92x.</li>
                  <li>Build a streak of goals to show off!</li>
                </ul>
             </section>
          </div>
       </GameInfoModal>

       <button onClick={() => setShowInfo(true)} className="absolute top-0 right-4 text-gray-500 hover:text-white p-2">
           <HelpCircle size={24} />
       </button>

       {/* Goal Visual */}
       <div className="w-full max-w-2xl aspect-[16/9] bg-emerald-800 rounded-xl border-4 border-white relative overflow-hidden shadow-2xl">
          {/* Net Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#fff_0,#fff_1px,transparent_1px,transparent_10px),repeating-linear-gradient(-45deg,#fff_0,#fff_1px,transparent_1px,transparent_10px)]"></div>
          
          {/* Grass */}
          <div className="absolute bottom-0 w-full h-1/4 bg-emerald-600"></div>
          
          {/* Goal Post Lines */}
          <div className="absolute top-4 left-4 right-4 bottom-0 border-x-8 border-t-8 border-white/80"></div>

          {/* Goalie */}
          <div 
             className={`absolute transition-all duration-300 ease-out flex flex-col items-center z-10
               ${ZONES[goaliePos].style.includes('top') ? 'mt-12' : 'mb-8'}
             `}
             style={{ 
                left: ZONES[goaliePos].style.includes('left') ? '20%' : ZONES[goaliePos].style.includes('right') ? '80%' : '50%',
                top: ZONES[goaliePos].style.includes('top') ? '20%' : 'auto',
                bottom: ZONES[goaliePos].style.includes('bottom') ? '20%' : 'auto',
                transform: 'translateX(-50%)'
             }}
          >
             <User size={64} className="text-yellow-400 drop-shadow-lg" />
             <div className="w-12 h-2 bg-black/40 rounded-full blur-sm mt-1"></div>
          </div>

          {/* Ball */}
          {ballPos !== null && (
             <div 
               className={`absolute transition-all duration-500 ease-out z-20
                 ${ZONES[ballPos].style}
               `}
             >
                <Circle size={32} className="text-white fill-white drop-shadow-lg animate-spin" />
             </div>
          )}

          {/* Click Zones */}
          <div className="absolute inset-0 z-30">
             {ZONES.map(z => (
                <button
                  key={z.id}
                  onClick={() => kick(z.id)}
                  disabled={playing}
                  className={`absolute w-24 h-24 rounded-full border-2 border-white/0 hover:border-white/50 hover:bg-white/10 transition-all flex items-center justify-center group ${z.style}`}
                >
                   <div className="w-2 h-2 bg-white/50 rounded-full group-hover:scale-150 transition-transform"></div>
                </button>
             ))}
          </div>
       </div>

       {/* Stats */}
       <div className="flex gap-1">
          {history.map((win, i) => (
             <div key={i} className={`w-4 h-4 rounded-full ${win ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          ))}
       </div>

       {/* Controls */}
       <div className="w-full max-w-md bg-card p-6 rounded-xl border border-slate-800 flex gap-4 items-center">
          <div className="flex-1">
             <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
             <input 
               type="number" 
               value={betAmount} 
               onChange={e => setBetAmount(e.target.value)} 
               disabled={playing}
               className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white font-mono"
             />
          </div>
          <div className="flex flex-col items-center px-4 border-l border-slate-700">
             <span className="text-xs text-gray-400 font-bold uppercase">Streak</span>
             <span className="text-2xl font-mono text-accent font-bold">{streak}</span>
          </div>
       </div>
    </div>
  );
};

export default Penalty;
