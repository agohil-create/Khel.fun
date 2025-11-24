import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowUp, ArrowDown, Bot, Trophy, RotateCcw, Play, History, AlertTriangle, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface HiloProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

// --- Types & Constants ---
type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type CardStatus = 'DECK' | 'NEXT_HIDDEN' | 'NEXT_REVEALED' | 'CURRENT' | 'DISCARD' | 'HISTORY';

interface CardObj {
  id: string;
  rank: number; // 0-12 (2 through Ace)
  suit: Suit;
  status: CardStatus;
  zIndex: number;
}

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS: { type: Suit; symbol: string; color: string }[] = [
  { type: 'spades', symbol: '♠', color: '#1e293b' },
  { type: 'hearts', symbol: '♥', color: '#ef4444' },
  { type: 'diamonds', symbol: '♦', color: '#ef4444' },
  { type: 'clubs', symbol: '♣', color: '#1e293b' },
];

// --- Helper Components ---

const DealerMascot: React.FC<{ mood: 'IDLE' | 'DEALING' | 'WIN' | 'LOSS'; message: string }> = ({ mood, message }) => {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 z-40 flex flex-col items-center transition-all duration-500">
       {/* Speech Bubble */}
       <div className={`
          mb-4 relative bg-white text-slate-900 px-6 py-3 rounded-2xl shadow-xl font-bold text-sm min-w-[140px] text-center transform transition-all duration-300
          ${mood === 'WIN' ? 'scale-110 border-2 border-accent' : 'scale-100'}
          ${mood === 'LOSS' ? 'shake-animation border-2 border-red-500' : ''}
       `}>
          {message}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45 border-b-4 border-r-4 border-transparent shadow-sm"></div>
       </div>

       {/* Robot Body */}
       <div className={`
         relative w-24 h-24 bg-gradient-to-b from-slate-700 to-slate-900 rounded-2xl border-2 border-slate-600 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500
         ${mood === 'DEALING' ? 'translate-y-2' : 'hover:-translate-y-1'}
         ${mood === 'WIN' ? 'shadow-[0_0_40px_rgba(0,231,1,0.4)] border-accent' : ''}
         ${mood === 'LOSS' ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)] border-red-500' : ''}
       `}>
          {/* Antenna */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-slate-500"></div>
          <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-colors duration-300 ${mood === 'DEALING' ? 'bg-yellow-400 animate-pulse' : mood === 'WIN' ? 'bg-accent shadow-[0_0_10px_#00e701]' : mood === 'LOSS' ? 'bg-red-500' : 'bg-slate-400'}`}></div>

          {/* Face Screen */}
          <div className="w-20 h-16 bg-black rounded-lg relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,231,1,0.1)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
             
             {/* Eyes */}
             <div className="flex gap-4 relative z-10 transition-all duration-300">
                {mood === 'WIN' ? (
                  <>
                    <div className="text-accent text-2xl font-black">^</div>
                    <div className="text-accent text-2xl font-black">^</div>
                  </>
                ) : mood === 'LOSS' ? (
                  <>
                    <div className="text-red-500 text-xl font-bold">X</div>
                    <div className="text-red-500 text-xl font-bold">X</div>
                  </>
                ) : mood === 'DEALING' ? (
                   <>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce delay-75"></div>
                   </>
                ) : (
                   <>
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse delay-100"></div>
                   </>
                )}
             </div>
             
             {/* Mouth */}
             {mood === 'WIN' && <div className="absolute bottom-3 w-6 h-3 border-b-2 border-accent rounded-full"></div>}
          </div>
       </div>
       
       {/* Hands (Cosmetic) */}
       <div className={`absolute top-10 -left-4 w-6 h-6 rounded-full bg-slate-600 transition-all duration-300 ${mood === 'DEALING' ? '-translate-x-4 rotate-12' : ''}`}></div>
       <div className={`absolute top-10 -right-4 w-6 h-6 rounded-full bg-slate-600 transition-all duration-300 ${mood === 'DEALING' ? 'translate-x-4 -rotate-12' : ''}`}></div>
    </div>
  );
};

const CardView: React.FC<{ card: CardObj }> = ({ card }) => {
  const suitInfo = SUITS.find(s => s.type === card.suit)!;
  
  // Animation Styles based on status
  // We use fixed transformations relative to the container center
  let transform = '';
  let opacity = 1;
  let rotateY = 0; // 0 = Front, 180 = Back
  let shadow = 'shadow-lg';

  switch (card.status) {
    case 'DECK':
      transform = 'translate(220px, 0) scale(0.8) rotate(5deg)';
      rotateY = 180;
      opacity = 0;
      break;
    case 'NEXT_HIDDEN':
      transform = 'translate(80px, 0) scale(1) rotate(0deg)'; // Target position for next card (Right Slot)
      rotateY = 180; // Still face down flying in
      shadow = 'shadow-2xl';
      break;
    case 'NEXT_REVEALED':
      transform = 'translate(80px, 0) scale(1) rotate(0deg)'; // Same position
      rotateY = 0; // Flip up
      shadow = 'shadow-xl';
      break;
    case 'CURRENT':
      transform = 'translate(-80px, 0) scale(1) rotate(0deg)'; // Move to center-left (Current Slot)
      rotateY = 0;
      break;
    case 'DISCARD':
      transform = 'translate(-250px, 0) scale(0.8) rotate(-10deg)'; // Fly out left
      rotateY = 0;
      opacity = 0;
      break;
    case 'HISTORY': // Small cards at bottom
      // Handled by separate component, this view is only for the main table
      return null;
  }

  return (
    <div 
      className="absolute top-1/2 left-1/2 w-32 h-48 -ml-16 -mt-24 transition-all duration-500 ease-in-out perspective-1000"
      style={{ 
        transform, 
        opacity,
        zIndex: card.zIndex
      }}
    >
      <div 
        className="w-full h-full relative transform-style-3d transition-transform duration-500"
        style={{ transform: `rotateY(${rotateY}deg)` }}
      >
        {/* Front */}
        <div className={`absolute inset-0 backface-hidden bg-white rounded-xl border border-slate-300 ${shadow} flex flex-col justify-between p-3 select-none`}>
            <div className={`text-2xl font-black leading-none ${suitInfo.color} text-left`}>
              <div>{RANKS[card.rank]}</div>
              <div className="text-xl">{suitInfo.symbol}</div>
            </div>
            
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl ${suitInfo.color}`}>
              {suitInfo.symbol}
            </div>

            <div className={`text-2xl font-black leading-none ${suitInfo.color} text-right rotate-180`}>
              <div>{RANKS[card.rank]}</div>
              <div className="text-xl">{suitInfo.symbol}</div>
            </div>
        </div>

        {/* Back */}
        <div 
          className={`absolute inset-0 backface-hidden bg-red-600 rounded-xl border-4 border-white ${shadow} overflow-hidden`}
          style={{ transform: 'rotateY(180deg)' }}
        >
           <div className="w-full h-full opacity-50 bg-[repeating-linear-gradient(45deg,#991b1b_0,#991b1b_10px,#b91c1c_10px,#b91c1c_20px)]"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Bot className="text-white w-12 h-12 opacity-80" />
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Game Component ---

const Hilo: React.FC<HiloProps> = ({ onBet, onWin, onLoss }) => {
  const [cards, setCards] = useState<CardObj[]>([]);
  const [history, setHistory] = useState<CardObj[]>([]); // Finished cards
  const [betAmount, setBetAmount] = useState('10');
  const [isPlaying, setIsPlaying] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [showInfo, setShowInfo] = useState(false);
  
  // Dealer State
  const [dealerMood, setDealerMood] = useState<'IDLE' | 'DEALING' | 'WIN' | 'LOSS'>('IDLE');
  const [dealerMsg, setDealerMsg] = useState("Place your bet!");
  const [actionLocked, setActionLocked] = useState(false);

  // Probabilities
  const currentCard = useMemo(() => cards.find(c => c.status === 'CURRENT' || c.status === 'NEXT_REVEALED'), [cards]);
  const currentRank = currentCard ? currentCard.rank : 6; // Default to 7ish for visual calc if null
  
  // Hi: >= Rank. Lo: <= Rank. Total 13.
  // We use Infinite Deck logic (standard for crypto hilo).
  // Same value is usually a WIN for the user in simplified crypto hilo (Higher OR Same).
  // Probability = (Target Cards) / 13.
  // House Edge = 1%. Multiplier = 99 / Probability.
  
  const probLower = ((currentRank + 1) / 13) * 100;
  const probHigher = ((13 - currentRank) / 13) * 100;
  
  const multLower = 99 / probLower;
  const multHigher = 99 / probHigher;

  // --- Game Functions ---

  const generateCard = (forceRank?: number): CardObj => {
    return {
      id: Math.random().toString(36),
      rank: forceRank ?? Math.floor(Math.random() * 13),
      suit: SUITS[Math.floor(Math.random() * 4)].type as Suit,
      status: 'DECK',
      zIndex: 10
    };
  };

  const startGame = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    // Reset
    setCards([]);
    setHistory([]);
    setMultiplier(1);
    setGameState('PLAYING');
    setIsPlaying(true);
    setActionLocked(true);
    
    setDealerMood('DEALING');
    setDealerMsg("Dealing first card...");

    // Deal Initial Card
    const firstCard = generateCard();
    setCards([firstCard]);

    // Animation Sequence
    setTimeout(() => {
       updateCardStatus(firstCard.id, 'NEXT_HIDDEN'); // Fly in
       
       setTimeout(() => {
         updateCardStatus(firstCard.id, 'NEXT_REVEALED'); // Flip
         
         setTimeout(() => {
            updateCardStatus(firstCard.id, 'CURRENT'); // Slide to center
            setDealerMood('IDLE');
            setDealerMsg("Higher or Lower?");
            setActionLocked(false);
         }, 600); // Wait for flip to complete
       }, 600); // Wait for fly in to complete
    }, 100);
  };

  const guess = (dir: 'HI' | 'LO') => {
    if (actionLocked || !currentCard) return;
    setActionLocked(true);
    setDealerMood('DEALING');
    setDealerMsg(dir === 'HI' ? "Going High..." : "Going Low...");

    const nextCard = generateCard();
    // Ensure new card renders on top
    nextCard.zIndex = currentCard.zIndex + 1;
    setCards(prev => [...prev, nextCard]);

    // 1. Fly In
    setTimeout(() => {
      updateCardStatus(nextCard.id, 'NEXT_HIDDEN');

      // 2. Flip & Evaluate
      setTimeout(() => {
        updateCardStatus(nextCard.id, 'NEXT_REVEALED');
        
        // Check Result
        const won = dir === 'HI' ? nextCard.rank >= currentCard.rank : nextCard.rank <= currentCard.rank;
        
        setTimeout(() => {
            if (won) {
               handleWinRound(nextCard, dir === 'HI' ? multHigher : multLower);
            } else {
               handleLossRound();
            }
        }, 800); // Wait for user to process the flip
      }, 500);
    }, 50);
  };

  const handleWinRound = (winningCard: CardObj, roundMult: number) => {
    setDealerMood('WIN');
    const msgs = ["Nice hit!", "Keep it going!", "Correct!", "Easy money!"];
    setDealerMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setMultiplier(m => m * roundMult); // Compounding multiplier

    // 1. Move old current to discard
    const oldCurrent = cards.find(c => c.status === 'CURRENT');
    if (oldCurrent) {
      updateCardStatus(oldCurrent.id, 'DISCARD');
      // Add to history list for UI
      setHistory(prev => [oldCurrent, ...prev].slice(0, 8));
    }

    // 2. Move new card to current
    updateCardStatus(winningCard.id, 'CURRENT');

    // 3. Cleanup cards array after animation
    setTimeout(() => {
      setCards(prev => prev.filter(c => c.status !== 'DISCARD')); // Remove discarded from main view
      setActionLocked(false);
      setDealerMood('IDLE');
    }, 500);
  };

  const handleLossRound = () => {
    setDealerMood('LOSS');
    setDealerMsg("Busted!");
    onLoss();
    setGameState('GAMEOVER');
    setIsPlaying(false);
    setActionLocked(false);
  };

  const cashOut = () => {
    if (actionLocked || !isPlaying) return;
    onWin(parseFloat(betAmount) * multiplier);
    setDealerMood('WIN');
    setDealerMsg(`Cashed out $${(parseFloat(betAmount) * multiplier).toFixed(2)}!`);
    setGameState('IDLE');
    setIsPlaying(false);
    
    // Clear board
    setCards([]);
  };

  const updateCardStatus = (id: string, status: CardStatus) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6 mt-16 relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Hilo">
          <div className="space-y-4">
            <section>
              <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
              <p>Predict if the next card drawn will be higher or lower than the current card.</p>
            </section>
            <section>
              <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
              <ul className="list-disc pl-4 space-y-2 text-gray-400">
                <li>Cards are ranked from 2 (lowest) to Ace (highest).</li>
                <li>Place your bet to deal the first card.</li>
                <li>Choose <strong>Higher</strong> or <strong>Lower</strong>.</li>
                <li>If you guess correctly, your multiplier increases. Ties (same rank) count as a win.</li>
                <li>You can <strong>Cash Out</strong> after any winning round.</li>
                <li>A wrong guess loses the entire bet.</li>
              </ul>
            </section>
          </div>
       </GameInfoModal>

       {/* Help Button Absolute */}
       <div className="absolute -top-14 right-0 z-50">
          <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white p-2">
             <HelpCircle size={24} />
          </button>
       </div>
       
       <DealerMascot mood={dealerMood} message={dealerMsg} />

       {/* Game Board */}
       <div className="w-full h-[500px] bg-[#0f212e] rounded-[3rem] border-[12px] border-[#1e293b] relative shadow-2xl overflow-hidden flex flex-col">
          
          {/* Felt Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)] opacity-100"></div>
          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
          
          {/* Deck Visuals */}
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-32 h-48 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
             <span className="text-white/10 font-bold uppercase tracking-widest">Deck</span>
             {/* Stack effect */}
             <div className="absolute top-0 left-0 w-full h-full bg-red-900 rounded-xl border border-red-700 transform translate-x-1 -translate-y-1"></div>
             <div className="absolute top-0 left-0 w-full h-full bg-red-800 rounded-xl border border-red-600 transform translate-x-2 -translate-y-2"></div>
          </div>

          {/* Current Card Slot Marker */}
          <div className="absolute left-[calc(50%-80px)] top-1/2 -translate-y-1/2 w-32 h-48 border-2 border-white/5 rounded-xl -ml-16 -mt-24 pointer-events-none transform -translate-x-20"></div>

          {/* Active Cards Layer */}
          <div className="absolute inset-0 z-10 pointer-events-none">
             {cards.map(c => <CardView key={c.id} card={c} />)}
          </div>

          {/* Probabilities Overlay */}
          {isPlaying && currentCard && !actionLocked && (
             <div className="absolute bottom-12 left-0 w-full flex justify-center gap-32 z-20 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center">
                   <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Lower ({probLower.toFixed(0)}%)</div>
                   <div className="text-xl font-mono font-bold text-red-400">{multLower.toFixed(2)}x</div>
                </div>
                <div className="text-center">
                   <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Higher ({probHigher.toFixed(0)}%)</div>
                   <div className="text-xl font-mono font-bold text-emerald-400">{multHigher.toFixed(2)}x</div>
                </div>
             </div>
          )}

          {/* History Strip */}
          <div className="absolute bottom-4 left-4 right-4 h-16 flex items-center gap-2 overflow-hidden opacity-50">
             <History size={16} className="text-slate-500 mr-2" />
             {history.map((c, i) => (
                <div key={c.id} className="w-8 h-12 bg-white rounded border border-slate-400 flex items-center justify-center text-xs font-bold relative animate-in slide-in-from-right fade-in">
                   <span style={{ color: SUITS.find(s => s.type === c.suit)!.color }}>{RANKS[c.rank]}</span>
                   <div className="absolute bottom-0.5 right-0.5 text-[8px]" style={{ color: SUITS.find(s => s.type === c.suit)!.color }}>{SUITS.find(s => s.type === c.suit)!.symbol}</div>
                </div>
             ))}
          </div>

          {/* Game Over Overlay */}
          {gameState === 'GAMEOVER' && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4 animate-in zoom-in fade-in">
                <AlertTriangle size={64} className="text-red-500 mb-2" />
                <div className="text-4xl font-black text-white">ROUND OVER</div>
                <div className="text-gray-400">Total Win: <span className="text-white font-mono">$0.00</span></div>
                <button 
                  onClick={startGame} 
                  className="bg-accent hover:bg-accent-hover text-background font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(0,231,1,0.4)] transition-transform active:scale-95"
                >
                  Try Again
                </button>
             </div>
          )}
       </div>

       {/* Controls */}
       <div className="bg-card border border-slate-800 p-6 rounded-2xl shadow-xl">
         {!isPlaying ? (
           <div className="flex items-end gap-4">
              <div className="flex-1">
                 <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                   <input 
                     type="number" 
                     value={betAmount} 
                     onChange={(e) => setBetAmount(e.target.value)}
                     className="w-full bg-background border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-white font-mono font-bold text-lg focus:border-accent outline-none" 
                   />
                 </div>
              </div>
              <button 
                onClick={startGame} 
                className="flex-[2] bg-accent hover:bg-accent-hover text-background font-black text-xl py-4 rounded-xl shadow-[0_0_20px_rgba(0,231,1,0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play fill="currentColor" /> START GAME
              </button>
           </div>
         ) : (
           <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                  {/* Lower Button */}
                  <button
                    onClick={() => guess('LO')}
                    disabled={actionLocked}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-slate-900 rounded-xl p-4 flex flex-col items-center group transition-all active:border-b-0 active:translate-y-1"
                  >
                     <div className="bg-slate-900 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <ArrowDown className="text-red-500" />
                     </div>
                     <div className="font-black text-white text-lg">LOWER</div>
                     <div className="text-xs font-mono text-gray-400">Same or Lower</div>
                  </button>

                  {/* Higher Button */}
                  <button
                    onClick={() => guess('HI')}
                    disabled={actionLocked}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-slate-900 rounded-xl p-4 flex flex-col items-center group transition-all active:border-b-0 active:translate-y-1"
                  >
                     <div className="bg-slate-900 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <ArrowUp className="text-emerald-500" />
                     </div>
                     <div className="font-black text-white text-lg">HIGHER</div>
                     <div className="text-xs font-mono text-gray-400">Same or Higher</div>
                  </button>
              </div>

              {/* Status Bar */}
              <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-slate-800">
                  <div className="flex flex-col">
                     <span className="text-xs text-gray-500 font-bold uppercase">Current Payout</span>
                     <span className="text-2xl font-mono font-bold text-accent">${(parseFloat(betAmount) * multiplier).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="bg-slate-800 px-3 py-1 rounded text-sm font-mono text-white">
                        {multiplier.toFixed(2)}x
                     </div>
                     <button 
                       onClick={cashOut}
                       disabled={actionLocked || multiplier <= 1}
                       className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-lg shadow-[0_4px_0_#047857] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                     >
                       CASH OUT
                     </button>
                  </div>
              </div>
           </div>
         )}
       </div>

       <style>{`
         .perspective-1000 { perspective: 1000px; }
         .transform-style-3d { transform-style: preserve-3d; }
         .backface-hidden { 
           backface-visibility: hidden; 
           -webkit-backface-visibility: hidden;
         }
         .shake-animation { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
         @keyframes shake {
           10%, 90% { transform: translate3d(-1px, 0, 0); }
           20%, 80% { transform: translate3d(2px, 0, 0); }
           30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
           40%, 60% { transform: translate3d(4px, 0, 0); }
         }
       `}</style>
    </div>
  );
};

export default Hilo;