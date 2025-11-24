
import React, { useState, useEffect } from 'react';
import { Brain, HelpCircle, Coins, Zap, Diamond } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface MemoryProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

interface Card {
  id: number;
  value: number; // Multiplier
  revealed: boolean;
  matched: boolean;
}

const Memory: React.FC<MemoryProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [isPlaying, setIsPlaying] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState('Find a match!');
  const [showInfo, setShowInfo] = useState(false);

  const initGame = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    setIsPlaying(true);
    setMessage('Pick two cards...');
    setSelected([]);

    // Multipliers: 0.5, 1, 2, 3, 5, 10, 20, 50 (High variance!)
    const mults = [0.5, 1, 2, 5, 10, 0, 0, 0]; 
    // 0 means "Skull" (Loss).
    
    const deck = [...mults, ...mults]
      .map((v, i) => ({ id: i, value: v, revealed: false, matched: false }))
      .sort(() => Math.random() - 0.5);

    setCards(deck);
  };

  const handleCardClick = (index: number) => {
    if (!isPlaying || selected.length >= 2 || cards[index].revealed || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].revealed = true;
    setCards(newCards);

    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setTimeout(() => {
        checkMatch(newSelected[0], newSelected[1]);
      }, 1000);
    }
  };

  const checkMatch = (idx1: number, idx2: number) => {
    const c1 = cards[idx1];
    const c2 = cards[idx2];

    if (c1.value === c2.value) {
      // Match!
      const updated = [...cards];
      updated[idx1].matched = true;
      updated[idx2].matched = true;
      setCards(updated);
      
      if (c1.value > 0) {
         const win = parseFloat(betAmount) * c1.value;
         onWin(win);
         setMessage(`Matched ${c1.value}x! Won $${win.toFixed(2)}`);
      } else {
         onLoss();
         setMessage('Matched Skulls... Ouch.');
      }
      setIsPlaying(false); // Game ends on first match for simplicity
    } else {
      // No match
      const updated = [...cards];
      updated[idx1].revealed = false;
      updated[idx2].revealed = false;
      setCards(updated);
      setSelected([]);
      setMessage('Try again...');
    }
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-6 gap-8 relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Memory">
          <div className="space-y-4">
             <section>
                <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
                <p>Find matching pairs of multipliers.</p>
             </section>
             <section>
                <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
                <ul className="list-disc pl-4 space-y-2 text-gray-400">
                  <li>Place your bet.</li>
                  <li>Click cards to reveal them.</li>
                  <li>Find a matching pair to win the multiplier shown (e.g., match two 10x cards to win 10x your bet).</li>
                  <li>Avoid matching the Skulls (0x)!</li>
                </ul>
             </section>
          </div>
       </GameInfoModal>

       <button onClick={() => setShowInfo(true)} className="absolute top-0 right-4 text-gray-500 hover:text-white p-2">
           <HelpCircle size={24} />
       </button>

       <div className="text-2xl font-bold text-white animate-pulse">{message}</div>

       <div className="grid grid-cols-4 gap-4">
          {cards.length > 0 ? cards.map((c, i) => (
             <button
               key={c.id}
               onClick={() => handleCardClick(i)}
               className={`
                 w-20 h-28 md:w-24 md:h-32 rounded-xl transition-all duration-500 transform-style-3d perspective-1000 relative
                 ${c.revealed ? 'rotate-y-180' : ''}
               `}
             >
                {/* Back */}
                <div className={`absolute inset-0 bg-slate-800 border-2 border-slate-700 rounded-xl flex items-center justify-center backface-hidden ${!c.revealed ? '' : 'hidden'}`}>
                   <Brain className="text-slate-600" size={32} />
                </div>

                {/* Front */}
                <div className={`absolute inset-0 bg-slate-900 border-2 ${c.value > 0 ? 'border-emerald-500' : 'border-red-500'} rounded-xl flex flex-col items-center justify-center backface-hidden ${c.revealed ? '' : 'hidden'}`}>
                   {c.value === 0 ? (
                     <Zap className="text-red-500" size={32} />
                   ) : c.value >= 10 ? (
                     <Diamond className="text-purple-400 animate-spin" size={32} />
                   ) : (
                     <Coins className="text-emerald-400" size={32} />
                   )}
                   <span className="font-black text-xl text-white mt-2">{c.value}x</span>
                </div>
             </button>
          )) : (
             // Placeholder Grid
             Array.from({length: 16}).map((_, i) => (
                <div key={i} className="w-20 h-28 md:w-24 md:h-32 bg-slate-800/50 rounded-xl border border-slate-800/50"></div>
             ))
          )}
       </div>

       <div className="w-full max-w-md bg-card p-6 rounded-xl border border-slate-800">
           <input 
             type="number" 
             value={betAmount} 
             onChange={e => setBetAmount(e.target.value)} 
             disabled={isPlaying}
             className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white font-mono mb-4"
           />
           <button 
             onClick={initGame} 
             disabled={isPlaying}
             className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-background font-bold py-4 rounded-lg"
           >
             {isPlaying ? 'Playing...' : 'Deal Cards'}
           </button>
       </div>
    </div>
  );
};

export default Memory;
