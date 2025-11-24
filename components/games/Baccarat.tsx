
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface BaccaratProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const Baccarat: React.FC<BaccaratProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [betTarget, setBetTarget] = useState<'PLAYER' | 'BANKER' | 'TIE' | null>(null);
  const [pScore, setPScore] = useState(0);
  const [bScore, setBScore] = useState(0);
  const [result, setResult] = useState('');
  const [playing, setPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const deal = () => {
      const amount = parseFloat(betAmount);
      if (isNaN(amount) || amount <= 0 || !betTarget) return;
      if (!onBet(amount)) return;

      setPlaying(true);
      setResult('');

      setTimeout(() => {
          const p1 = Math.floor(Math.random() * 10);
          const p2 = Math.floor(Math.random() * 10);
          const b1 = Math.floor(Math.random() * 10);
          const b2 = Math.floor(Math.random() * 10);
          
          const pFinal = (p1 + p2) % 10;
          const bFinal = (b1 + b2) % 10;
          
          setPScore(pFinal);
          setBScore(bFinal);

          let winner = 'TIE';
          if (pFinal > bFinal) winner = 'PLAYER';
          if (bFinal > pFinal) winner = 'BANKER';

          if (winner === betTarget) {
              const mult = winner === 'TIE' ? 8 : 1.95;
              onWin(amount * mult);
              setResult(`WIN! ${winner} wins.`);
          } else {
              onLoss();
              setResult(`LOSS. ${winner} wins.`);
          }
          setPlaying(false);
      }, 1000);
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-6 gap-8 relative">
        
        <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Baccarat">
          <div className="space-y-4">
             <section>
                <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
                <p>Bet on which hand (Player or Banker) will have a point value closer to 9.</p>
             </section>
             <section>
                <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
                <ul className="list-disc pl-4 space-y-2 text-gray-400">
                  <li>Bet on <strong>Player</strong> (1:1 payout).</li>
                  <li>Bet on <strong>Banker</strong> (1:1 payout minus 5% commission = 0.95:1).</li>
                  <li>Bet on <strong>Tie</strong> (8:1 payout).</li>
                  <li>Cards are dealt and scores are calculated by taking the last digit of the sum (e.g., 15 = 5).</li>
                </ul>
             </section>
          </div>
       </GameInfoModal>

       <button onClick={() => setShowInfo(true)} className="absolute top-0 right-4 text-gray-500 hover:text-white p-2">
           <HelpCircle size={24} />
       </button>

        <div className="flex gap-10 md:gap-20">
            <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">PLAYER</div>
                <div className="w-24 h-32 bg-blue-900/50 border-2 border-blue-500 rounded-lg flex items-center justify-center text-4xl font-bold text-white">
                    {playing ? '...' : pScore}
                </div>
            </div>
            <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">BANKER</div>
                <div className="w-24 h-32 bg-red-900/50 border-2 border-red-500 rounded-lg flex items-center justify-center text-4xl font-bold text-white">
                    {playing ? '...' : bScore}
                </div>
            </div>
        </div>
        
        {result && <div className="text-xl font-bold text-white animate-bounce">{result}</div>}

        <div className="w-full max-w-md bg-card p-6 rounded-xl border border-slate-800 space-y-4">
            <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} disabled={playing} className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white font-mono"/>
            
            <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setBetTarget('PLAYER')} className={`py-4 rounded border-2 font-bold ${betTarget === 'PLAYER' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-slate-700 text-gray-400'}`}>Player</button>
                <button onClick={() => setBetTarget('TIE')} className={`py-4 rounded border-2 font-bold ${betTarget === 'TIE' ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400' : 'border-slate-700 text-gray-400'}`}>Tie (8x)</button>
                <button onClick={() => setBetTarget('BANKER')} className={`py-4 rounded border-2 font-bold ${betTarget === 'BANKER' ? 'border-red-500 bg-red-900/20 text-red-400' : 'border-slate-700 text-gray-400'}`}>Banker</button>
            </div>

            <button onClick={deal} disabled={playing || !betTarget} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-background font-bold py-4 rounded-lg">Deal</button>
        </div>
    </div>
  );
};

export default Baccarat;
