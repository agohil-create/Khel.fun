
import React, { useState } from 'react';
import { Gamepad2, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface VideoPokerProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const SUITS = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const VideoPoker: React.FC<VideoPokerProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [hand, setHand] = useState<{rank: number, suit: number}[]>([]);
  const [held, setHeld] = useState<boolean[]>(Array(5).fill(false));
  const [phase, setPhase] = useState<'deal' | 'draw'>('deal');
  const [message, setMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const getRandomCard = () => ({
      rank: Math.floor(Math.random() * 13),
      suit: Math.floor(Math.random() * 4)
  });

  const deal = () => {
      const amount = parseFloat(betAmount);
      if (isNaN(amount) || amount <= 0) return;
      if (!onBet(amount)) return;

      setHand(Array(5).fill(0).map(getRandomCard));
      setHeld(Array(5).fill(false));
      setPhase('draw');
      setMessage('');
  };

  const draw = () => {
      const newHand = hand.map((card, i) => held[i] ? card : getRandomCard());
      setHand(newHand);
      
      // Evaluate (Simplified: Pairs, Flush)
      const ranks = newHand.map(c => c.rank);
      const suits = newHand.map(c => c.suit);
      
      // Count ranks
      const counts: Record<number, number> = {};
      ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
      const maxCount = Math.max(...Object.values(counts));
      const isFlush = new Set(suits).size === 1;

      let mult = 0;
      let msg = 'High Card';

      if (isFlush) { mult = 6; msg = 'Flush'; }
      else if (maxCount === 4) { mult = 25; msg = 'Four of a Kind'; }
      else if (maxCount === 3) { mult = 3; msg = 'Three of a Kind'; }
      else if (maxCount === 2) { 
          // Check two pair
          const pairs = Object.values(counts).filter(c => c === 2).length;
          if (pairs === 2) { mult = 2; msg = 'Two Pair'; }
          else { 
              // Jacks or better
              const pairRank = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 2) || '0');
              if (pairRank >= 9) { mult = 1; msg = 'Jacks or Better'; } // Rank 9 is Jack (index)
          }
      }

      if (mult > 0) {
          onWin(parseFloat(betAmount) * mult);
          setMessage(`${msg}! You won.`);
      } else {
          onLoss();
          setMessage('Game Over');
      }
      setPhase('deal');
  };

  const toggleHold = (i: number) => {
      if (phase !== 'draw') return;
      const newHeld = [...held];
      newHeld[i] = !newHeld[i];
      setHeld(newHeld);
  };

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-6 gap-8 relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Video Poker">
          <div className="space-y-4">
             <section>
                <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
                <p>Make the best poker hand possible.</p>
             </section>
             <section>
                <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
                <ul className="list-disc pl-4 space-y-2 text-gray-400">
                  <li>Place your bet and click <strong>Deal</strong>.</li>
                  <li>Click on cards you want to <strong>Hold</strong>.</li>
                  <li>Click <strong>Draw</strong> to replace the unheld cards.</li>
                  <li>Payouts are based on hand strength (Jacks or Better pair minimum).</li>
                </ul>
             </section>
          </div>
       </GameInfoModal>

       <button onClick={() => setShowInfo(true)} className="absolute top-0 right-4 text-gray-500 hover:text-white p-2">
           <HelpCircle size={24} />
       </button>

       <div className="h-12 text-2xl font-bold text-accent">{message}</div>

       <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
           {hand.length > 0 ? hand.map((c, i) => (
               <div key={i} onClick={() => toggleHold(i)} className={`relative w-20 h-28 md:w-28 md:h-40 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center cursor-pointer transition-transform border-4 ${held[i] ? 'border-accent -translate-y-4' : 'border-slate-300'}`}>
                   <div className={`text-4xl ${[1,2].includes(c.suit) ? 'text-red-500' : 'text-black'}`}>
                       {SUITS[c.suit]}
                   </div>
                   <div className="text-xl font-bold text-black">{RANKS[c.rank]}</div>
                   {held[i] && <div className="absolute top-0 w-full text-center bg-accent text-black text-xs font-bold uppercase">Held</div>}
               </div>
           )) : (
               Array(5).fill(0).map((_, i) => <div key={i} className="w-20 h-28 md:w-28 md:h-40 bg-slate-800 rounded-lg border border-slate-700"></div>)
           )}
       </div>

       <div className="w-full max-w-md bg-card p-6 rounded-xl border border-slate-800">
           <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} disabled={phase === 'draw'} className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white font-mono mb-4"/>
           <button 
             onClick={phase === 'deal' ? deal : draw} 
             className="w-full bg-accent hover:bg-accent-hover text-background font-bold py-4 rounded-lg"
           >
             {phase === 'deal' ? 'Deal' : 'Draw'}
           </button>
       </div>
    </div>
  );
};

export default VideoPoker;
