
import React, { useState } from 'react';
import { HandMetal, Scroll, Scissors, Bot, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface RPSProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

type Choice = 'ROCK' | 'PAPER' | 'SCISSORS';

const RPS: React.FC<RPSProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [playing, setPlaying] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [botChoice, setBotChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<'WIN' | 'LOSS' | 'TIE' | null>(null);
  const [message, setMessage] = useState('Choose your weapon!');
  const [showInfo, setShowInfo] = useState(false);

  const play = (choice: Choice) => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || playing) return;
    if (!onBet(amount)) return;

    setPlaying(true);
    setPlayerChoice(choice);
    setBotChoice(null);
    setResult(null);
    setMessage('Bot is thinking...');

    setTimeout(() => {
      const choices: Choice[] = ['ROCK', 'PAPER', 'SCISSORS'];
      const bot = choices[Math.floor(Math.random() * 3)];
      setBotChoice(bot);

      if (choice === bot) {
        setResult('TIE');
        setMessage('It\'s a draw! Bet returned.');
        onWin(amount); // Return bet
      } else if (
        (choice === 'ROCK' && bot === 'SCISSORS') ||
        (choice === 'PAPER' && bot === 'ROCK') ||
        (choice === 'SCISSORS' && bot === 'PAPER')
      ) {
        setResult('WIN');
        setMessage('You crushed it! +2x');
        onWin(amount * 2);
      } else {
        setResult('LOSS');
        setMessage('Bot wins! Better luck next time.');
        onLoss();
      }
      setPlaying(false);
    }, 1500);
  };

  const getIcon = (c: Choice) => {
    if (c === 'ROCK') return <HandMetal size={48} />;
    if (c === 'PAPER') return <Scroll size={48} />;
    return <Scissors size={48} />;
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-6 gap-12 relative">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play RPS">
         <div className="space-y-4">
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Beat the bot in Rock, Paper, Scissors.</p>
            </section>
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Rules</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li>Rock beats Scissors.</li>
                 <li>Scissors beats Paper.</li>
                 <li>Paper beats Rock.</li>
                 <li>Win: 2x payout.</li>
                 <li>Tie: Bet returned.</li>
               </ul>
            </section>
         </div>
      </GameInfoModal>

      <button onClick={() => setShowInfo(true)} className="absolute top-0 right-4 text-gray-500 hover:text-white p-2">
          <HelpCircle size={24} />
      </button>

      {/* Arena */}
      <div className="flex items-center justify-center gap-12 md:gap-24">
         {/* Player */}
         <div className={`flex flex-col items-center gap-4 ${playing ? 'animate-pulse' : ''}`}>
            <div className="w-32 h-32 rounded-full bg-blue-500/20 border-4 border-blue-500 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
               {playerChoice ? getIcon(playerChoice) : <span className="text-4xl font-bold">?</span>}
            </div>
            <span className="font-bold text-blue-400">YOU</span>
         </div>

         <div className="text-2xl font-black text-slate-600 italic">VS</div>

         {/* Bot */}
         <div className={`flex flex-col items-center gap-4 ${playing ? 'animate-bounce' : ''}`}>
            <div className="w-32 h-32 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
               {botChoice ? getIcon(botChoice) : <Bot size={48} />}
            </div>
            <span className="font-bold text-red-400">BOT</span>
         </div>
      </div>

      {/* Result Message */}
      <div className="h-16 flex items-center justify-center">
         {result && (
            <div className={`px-6 py-2 rounded-full border-2 font-bold text-xl animate-in zoom-in ${
              result === 'WIN' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
              result === 'LOSS' ? 'bg-red-500/20 border-red-500 text-red-400' :
              'bg-slate-500/20 border-slate-500 text-slate-300'
            }`}>
               {message}
            </div>
         )}
         {!result && playing && <div className="text-gray-400 animate-pulse">{message}</div>}
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg bg-card p-6 rounded-xl border border-slate-800 space-y-6">
         <input 
            type="number" 
            value={betAmount} 
            onChange={e => setBetAmount(e.target.value)} 
            disabled={playing}
            className="w-full bg-background border border-slate-700 rounded-lg py-3 px-3 text-white font-mono mb-2"
            placeholder="Bet Amount"
         />
         
         <div className="grid grid-cols-3 gap-4">
            {(['ROCK', 'PAPER', 'SCISSORS'] as Choice[]).map(c => (
               <button
                 key={c}
                 onClick={() => play(c)}
                 disabled={playing}
                 className="aspect-square bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-700 hover:border-accent transition-all active:scale-95 group"
               >
                  <div className="text-gray-400 group-hover:text-white transition-colors">
                    {c === 'ROCK' && <HandMetal size={32} />}
                    {c === 'PAPER' && <Scroll size={32} />}
                    {c === 'SCISSORS' && <Scissors size={32} />}
                  </div>
                  <span className="text-[10px] font-bold uppercase text-gray-500">{c}</span>
               </button>
            ))}
         </div>
      </div>
    </div>
  );
};

export default RPS;
