
import React, { useState, useEffect } from 'react';
import { HelpCircle, Dices } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface SicBoProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

// --- 3D Dice Component ---

const DiceFace = ({ val }: { val: number }) => {
  // Standard dice dot positions (Grid 3x3)
  const dotMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const dots = dotMap[val] || [];

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 rounded-[12px] border border-gray-300 shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] flex p-1.5 box-border backface-hidden">
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dots.includes(i) && (
              <div className={`
                rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.5)]
                ${val === 1 ? 'w-5 h-5 bg-red-600' : 'w-3.5 h-3.5 bg-slate-900'}
              `}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Dice3D = ({ value, rolling, delay }: { value: number, rolling: boolean, delay: number }) => {
  // Cube dimensions: 80px
  // Translate Z must be half size (40px) for a perfect cube
  const half = 40; 

  // Standard Dice Orientation Mapping
  // We rotate the CUBE to show the correct face at front (0,0,0)
  const getTransform = (val: number) => {
    switch (val) {
      case 1: return 'rotateX(0deg) rotateY(0deg)';
      case 6: return 'rotateX(180deg) rotateY(0deg)';
      case 2: return 'rotateX(-90deg) rotateY(0deg)'; // Top
      case 5: return 'rotateX(90deg) rotateY(0deg)';  // Bottom
      case 3: return 'rotateY(90deg) rotateX(0deg)';  // Left
      case 4: return 'rotateY(-90deg) rotateX(0deg)'; // Right
      default: return 'rotateX(0deg) rotateY(0deg)';
    }
  };

  return (
    <div className="w-20 h-20 relative perspective-1000 mx-4">
      <div 
        className={`w-full h-full relative transform-style-3d transition-transform duration-[1500ms] cubic-bezier(0.15, 0.9, 0.35, 1) ${rolling ? 'animate-tumble' : ''}`}
        style={{ 
          transform: rolling 
            ? `rotateX(${720 + Math.random() * 720}deg) rotateY(${720 + Math.random() * 720}deg) rotateZ(${360 + Math.random() * 360}deg)` 
            : getTransform(value),
          animationDelay: `${delay}ms`
        }}
      >
        {/* Faces */}
        {/* 1 (Front) */}
        <div className="absolute inset-0" style={{ transform: `rotateY(0deg) translateZ(${half}px)` }}> <DiceFace val={1} /> </div>
        {/* 6 (Back) */}
        <div className="absolute inset-0" style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}> <DiceFace val={6} /> </div>
        {/* 4 (Right) */}
        <div className="absolute inset-0" style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}> <DiceFace val={4} /> </div>
        {/* 3 (Left) */}
        <div className="absolute inset-0" style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}> <DiceFace val={3} /> </div>
        {/* 2 (Top) */}
        <div className="absolute inset-0" style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}> <DiceFace val={2} /> </div>
        {/* 5 (Bottom) */}
        <div className="absolute inset-0" style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}> <DiceFace val={5} /> </div>
      </div>
    </div>
  );
};

// --- Main Game ---

const BET_TYPES = [
  { id: 'SMALL', label: 'SMALL', sub: '4-10', payout: 2 },
  { id: 'BIG', label: 'BIG', sub: '11-17', payout: 2 },
  { id: 'ODD', label: 'ODD', sub: 'Total', payout: 2 },
  { id: 'EVEN', label: 'EVEN', sub: 'Total', payout: 2 },
  { id: 'TRIPLE', label: 'ANY TRIPLE', sub: 'Any 111-666', payout: 30 },
];

const SicBo: React.FC<SicBoProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [dice, setDice] = useState([1, 2, 3]);
  const [rolling, setRolling] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [history, setHistory] = useState<{total: number, dice: number[], win: boolean}[]>([]);

  const rollDice = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || !selectedBet || rolling) return;
    if (!onBet(amount)) return;

    setRolling(true);
    setResultMessage('');

    // Determine result immediately
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    
    const finalDice = [d1, d2, d3];
    const sum = d1 + d2 + d3;
    const isTriple = d1 === d2 && d2 === d3;

    // Wait for animation
    setTimeout(() => {
      setDice(finalDice);
      setRolling(false);
      
      // Evaluate Win
      let win = false;
      if (selectedBet === 'SMALL') win = !isTriple && sum >= 4 && sum <= 10;
      else if (selectedBet === 'BIG') win = !isTriple && sum >= 11 && sum <= 17;
      else if (selectedBet === 'ODD') win = !isTriple && sum % 2 !== 0;
      else if (selectedBet === 'EVEN') win = !isTriple && sum % 2 === 0;
      else if (selectedBet === 'TRIPLE') win = isTriple;

      if (win) {
          const betInfo = BET_TYPES.find(b => b.id === selectedBet);
          onWin(amount * (betInfo?.payout || 2));
          setResultMessage(`WIN! Total ${sum}`);
      } else {
          onLoss();
          setResultMessage(`LOSS. Total ${sum}`);
      }

      setHistory(prev => [{ total: sum, dice: finalDice, win }, ...prev].slice(0, 8));

    }, 1500); 
  };

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-6 gap-8 relative">
       
       <style>{`
         .perspective-1000 { perspective: 1000px; }
         .transform-style-3d { transform-style: preserve-3d; }
         .backface-hidden { backface-visibility: hidden; }
         
         @keyframes tumble {
           0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
           25% { transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg); }
           50% { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
           75% { transform: rotateX(540deg) rotateY(270deg) rotateZ(135deg); }
           100% { transform: rotateX(720deg) rotateY(360deg) rotateZ(360deg); }
         }
         .animate-tumble { animation: tumble 0.5s linear infinite; }
       `}</style>

       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Sic Bo">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white text-lg">Objective</h3>
               <p>Bet on the outcome of three dice rolls.</p>
             </section>
             <section>
               <h3 className="font-bold text-white text-lg">Rules</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li><strong>Small:</strong> Total 4-10. (Loses on Triple)</li>
                 <li><strong>Big:</strong> Total 11-17. (Loses on Triple)</li>
                 <li><strong>Odd/Even:</strong> Total is Odd or Even. (Loses on Triple)</li>
                 <li><strong>Any Triple:</strong> All three dice show the same number.</li>
               </ul>
             </section>
          </div>
       </GameInfoModal>

       <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-2">
             <Dices className="text-accent" />
             <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Sic Bo</h2>
          </div>
          <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white p-2 bg-slate-800 rounded-full"><HelpCircle size={20}/></button>
       </div>

       {/* Dice Arena */}
       <div className="relative w-full max-w-3xl aspect-[2/1] bg-slate-900 rounded-3xl border-8 border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Felt Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#334155_0%,_#0f172a_100%)]"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
          
          {/* The Dice */}
          <div className="relative z-10 flex items-center justify-center gap-8">
             <Dice3D value={dice[0]} rolling={rolling} delay={0} />
             <Dice3D value={dice[1]} rolling={rolling} delay={100} />
             <Dice3D value={dice[2]} rolling={rolling} delay={200} />
          </div>

          {/* Result Text Overlay */}
          {!rolling && resultMessage && (
             <div className="absolute bottom-8 animate-in slide-in-from-bottom-4 fade-in duration-500 z-20">
                <div className={`px-8 py-3 rounded-full border-2 font-black text-2xl backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] ${resultMessage.includes('WIN') ? 'bg-emerald-500/30 border-emerald-500 text-emerald-400' : 'bg-red-500/30 border-red-500 text-red-400'}`}>
                   {resultMessage}
                </div>
             </div>
          )}
       </div>

       {/* History Bar */}
       <div className="flex gap-2 h-10 items-center overflow-hidden opacity-90 w-full max-w-3xl justify-center">
          {history.map((h, i) => (
             <div key={i} className={`min-w-[48px] h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold border shadow-sm transition-all animate-in zoom-in ${h.win ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <span className="text-lg leading-none">{h.total}</span>
                <div className="flex gap-0.5">
                   {h.dice.map((d, j) => <span key={j} className="w-1 h-1 rounded-full bg-current opacity-50"></span>)}
                </div>
             </div>
          ))}
       </div>

       {/* Betting Table */}
       <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {BET_TYPES.map((bet) => (
             <button
               key={bet.id}
               onClick={() => setSelectedBet(bet.id)}
               disabled={rolling}
               className={`
                 relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all group overflow-hidden h-28
                 ${selectedBet === bet.id 
                    ? 'bg-accent/10 text-white border-accent shadow-[0_0_20px_rgba(0,231,1,0.2)] scale-105 z-10' 
                    : 'bg-slate-800 text-gray-400 border-slate-700 hover:border-slate-500 hover:bg-slate-750'}
               `}
             >
                <span className="text-xl font-black uppercase tracking-wider z-10">{bet.label}</span>
                <span className={`text-xs font-mono z-10 ${selectedBet === bet.id ? 'text-accent' : 'opacity-50'}`}>{bet.sub}</span>
                <div className={`text-xs font-bold px-3 py-1 rounded-full mt-2 z-10 ${selectedBet === bet.id ? 'bg-accent text-black' : 'bg-black/30 text-gray-500'}`}>
                   1:{bet.payout}
                </div>
             </button>
          ))}
       </div>

       {/* Action Bar */}
       <div className="w-full max-w-md bg-card p-6 rounded-xl border border-slate-800 flex flex-col gap-4 shadow-xl">
           <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400 uppercase">Bet Amount</label>
              <span className="text-xs font-mono font-bold text-white">${parseFloat(betAmount).toFixed(2)}</span>
           </div>
           
           <div className="flex gap-3">
               <div className="relative flex-1">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                   <input 
                     type="number" 
                     value={betAmount} 
                     onChange={e => setBetAmount(e.target.value)} 
                     disabled={rolling}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white font-mono font-bold focus:border-accent outline-none transition-colors"
                   />
               </div>
               <button 
                 onClick={rollDice} 
                 disabled={rolling || !selectedBet}
                 className={`
                    flex-[1.5] font-black text-xl rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2
                    ${rolling || !selectedBet ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-accent hover:bg-accent-hover text-background shadow-[0_0_20px_rgba(0,231,1,0.3)]'}
                 `}
               >
                 {rolling ? 'ROLLING...' : 'ROLL'}
               </button>
           </div>
       </div>

    </div>
  );
};

export default SicBo;
