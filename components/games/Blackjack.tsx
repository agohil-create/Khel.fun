
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HelpCircle, RefreshCcw, Hand, Plus, Divide } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface BlackjackProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

// --- Types ---
type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
type GameState = 'BETTING' | 'DEALING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'RESULT';

interface CardObj {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  isHidden: boolean;
  angle: number; // Random rotation for realism
  zIndex: number;
}

// --- Constants ---
const CHIP_VALUES = [1, 5, 10, 25, 100];

const SUIT_SYMBOLS: Record<Suit, { symbol: string; color: string }> = {
  spades: { symbol: '♠', color: 'text-slate-900' },
  hearts: { symbol: '♥', color: 'text-red-600' },
  clubs: { symbol: '♣', color: 'text-slate-900' },
  diamonds: { symbol: '♦', color: 'text-red-600' },
};

// --- Helper Components ---

// 1. Realistic Chip Component
const Chip: React.FC<{ val: number; className?: string; style?: React.CSSProperties }> = ({ val, className, style }) => {
  let colorClass = '';
  let borderClass = '';
  
  if (val === 1) { colorClass = 'bg-white text-slate-900'; borderClass = 'border-slate-300'; }
  else if (val === 5) { colorClass = 'bg-red-600 text-white'; borderClass = 'border-red-800'; }
  else if (val === 10) { colorClass = 'bg-blue-600 text-white'; borderClass = 'border-blue-800'; }
  else if (val === 25) { colorClass = 'bg-emerald-600 text-white'; borderClass = 'border-emerald-800'; }
  else if (val === 100) { colorClass = 'bg-slate-900 text-white'; borderClass = 'border-slate-700'; }

  return (
    <div 
      className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full border-[4px] border-dashed shadow-[0_4px_6px_rgba(0,0,0,0.3)] flex items-center justify-center font-black text-[10px] md:text-xs transform transition-transform hover:-translate-y-1 active:scale-95 cursor-pointer ${colorClass} ${borderClass} ${className}`}
      style={style}
    >
      <div className="absolute inset-0 rounded-full border border-white/20"></div>
      <div className="absolute inset-0.5 rounded-full border border-black/10"></div>
      <span>{val}</span>
    </div>
  );
};

// 2. Realistic Card Component
const PlayingCard: React.FC<{ card: CardObj; index: number; origin: 'DECK' | 'PLAYER' | 'DEALER' }> = ({ card, index, origin }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation frame after mount
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Starting positions (relative to container)
  // Deck is at top right (~80%, 10%)
  // Dealer Hand is top center
  // Player Hand is bottom center
  const startStyle = {
      transform: 'translate(100vw, -100vh) rotate(180deg)',
      opacity: 0
  };

  // If coming from deck, we animate FROM the shoe location
  if (!mounted && origin !== 'DECK') {
     // Initial "in-shoe" state
     return (
        <div 
          className="absolute w-20 h-28 md:w-24 md:h-36 rounded-lg shadow-xl transition-all duration-500 ease-out"
          style={{ 
             top: '-200px', 
             right: '-200px', 
             transform: 'rotate(45deg) scale(0.5)',
             zIndex: 100
          }}
        >
           <div className="w-full h-full bg-blue-900 rounded-lg border-2 border-white"></div>
        </div>
     );
  }

  const suitData = SUIT_SYMBOLS[card.suit];
  
  return (
    <div 
      className={`
        absolute w-20 h-28 md:w-24 md:h-36 transition-all duration-700 ease-out perspective-1000
      `}
      style={{
        zIndex: card.zIndex,
        transform: `rotate(${card.angle}deg) translateX(${index * 25}px)`,
        // Simple stacking logic: cards overlap horizontally
        left: index * 0 + 'px', 
      }}
    >
      <div 
        className={`w-full h-full relative transform-style-3d transition-transform duration-500 ${card.isHidden ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div className={`
          absolute inset-0 backface-hidden bg-white rounded-lg shadow-lg border border-slate-300 flex flex-col justify-between p-2 select-none
          ${suitData.color}
        `}>
           <div className="text-sm font-bold leading-none flex flex-col items-center">
              <span>{card.rank}</span>
              <span>{suitData.symbol}</span>
           </div>
           <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 pointer-events-none">
              {suitData.symbol}
           </div>
           <div className="absolute inset-0 flex items-center justify-center">
              {/* Face Card Art / Simple Rank Display */}
              <span className="text-2xl font-black">{suitData.symbol}</span>
           </div>
           <div className="text-sm font-bold leading-none flex flex-col items-center rotate-180">
              <span>{card.rank}</span>
              <span>{suitData.symbol}</span>
           </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden rounded-lg shadow-lg border-2 border-white bg-blue-900 overflow-hidden"
          style={{ transform: 'rotateY(180deg)' }}
        >
           <div className="w-full h-full opacity-40 bg-[repeating-linear-gradient(45deg,#1e3a8a_0,#1e3a8a_10px,#172554_10px,#172554_20px)]"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                 <div className="w-8 h-8 rounded-full bg-white/10"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};


const Blackjack: React.FC<BlackjackProps> = ({ onBet, onWin, onLoss }) => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [betAmount, setBetAmount] = useState(0);
  const [chips, setChips] = useState<number[]>([]); // Visual stack of chips
  const [playerHand, setPlayerHand] = useState<CardObj[]>([]);
  const [dealerHand, setDealerHand] = useState<CardObj[]>([]);
  const [resultMessage, setResultMessage] = useState('');
  const [deck, setDeck] = useState<CardObj[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  
  // Controls
  const [selectedChip, setSelectedChip] = useState(10);

  // --- Audio / Effects Refs ---
  const tableRef = useRef<HTMLDivElement>(null);

  // --- Deck Logic ---
  const createDeck = (decks = 6) => {
    const newDeck: CardObj[] = [];
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    for (let d = 0; d < decks; d++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          let value = parseInt(rank);
          if (['J', 'Q', 'K'].includes(rank)) value = 10;
          if (rank === 'A') value = 11;

          newDeck.push({
            id: `${d}-${suit}-${rank}-${Math.random()}`,
            suit,
            rank,
            value,
            isHidden: false,
            angle: (Math.random() - 0.5) * 4, // Jitter
            zIndex: 0
          });
        }
      }
    }
    // Shuffle (Fisher-Yates)
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  // Initialize Deck on Mount
  useEffect(() => {
    setDeck(createDeck());
  }, []);

  // --- Hand Logic ---
  const calculateScore = (hand: CardObj[]) => {
    let score = 0;
    let aces = 0;
    hand.forEach(c => {
      if (!c.isHidden) {
        score += c.value;
        if (c.rank === 'A') aces += 1;
      }
    });
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  // --- Actions ---

  const addChip = (val: number) => {
    if (gameState !== 'BETTING') return;
    setBetAmount(prev => prev + val);
    setChips(prev => [...prev, val]);
  };

  const clearBet = () => {
    if (gameState !== 'BETTING') return;
    setBetAmount(0);
    setChips([]);
  };

  const dealGame = async () => {
    if (betAmount <= 0) return;
    if (!onBet(betAmount)) return;

    setGameState('DEALING');
    setPlayerHand([]);
    setDealerHand([]);
    setResultMessage('');

    // Dealing Sequence with Delays for Animation
    // Need to pull cards from deck state
    const currentDeck = [...deck];
    // Check if shoe is low
    if (currentDeck.length < 20) {
        // Reshuffle visually? For now just reset
        const newShoe = createDeck();
        setDeck(newShoe);
        // Recursively call with new shoe logic if needed, but for now simplify
        return; 
    }

    const pCard1 = currentDeck.pop()!;
    const dCard1 = currentDeck.pop()!;
    const pCard2 = currentDeck.pop()!;
    const dCard2 = currentDeck.pop()!; // Hidden

    dCard2.isHidden = true;

    // We set state incrementally to trigger animations
    setDeck(currentDeck);

    // Deal P1
    await new Promise(r => setTimeout(r, 200));
    setPlayerHand([pCard1]);
    
    // Deal D1
    await new Promise(r => setTimeout(r, 400));
    setDealerHand([dCard1]);

    // Deal P2
    await new Promise(r => setTimeout(r, 400));
    setPlayerHand(prev => [...prev, pCard2]);

    // Deal D2 (Hidden)
    await new Promise(r => setTimeout(r, 400));
    setDealerHand(prev => [...prev, dCard2]);

    await new Promise(r => setTimeout(r, 500));

    // Check Blackjack
    const pScore = calculateScore([pCard1, pCard2]);
    if (pScore === 21) {
       handleBlackjack();
    } else {
       setGameState('PLAYER_TURN');
    }
  };

  const hit = () => {
    const currentDeck = [...deck];
    const card = currentDeck.pop()!;
    setDeck(currentDeck);
    
    // Animate Hit
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);

    if (calculateScore(newHand) > 21) {
      setGameState('RESULT');
      setResultMessage('BUST');
      onLoss();
    }
  };

  const doubleDown = () => {
    if (!onBet(betAmount)) return; // Deduct extra
    setBetAmount(prev => prev * 2);
    // Add visual chips (simplified, just clone existing stack)
    setChips(prev => [...prev, ...prev]);

    const currentDeck = [...deck];
    const card = currentDeck.pop()!;
    setDeck(currentDeck);

    // One card only
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);

    // Force stand logic immediately after animation
    setTimeout(() => {
        if (calculateScore(newHand) > 21) {
            setGameState('RESULT');
            setResultMessage('BUST');
            onLoss();
        } else {
            stand(newHand);
        }
    }, 800);
  };

  const stand = (finalPHand = playerHand) => {
    setGameState('DEALER_TURN');
    
    // Reveal Dealer Card
    const dHand = [...dealerHand];
    dHand[1].isHidden = false;
    setDealerHand([...dHand]);

    // Dealer Logic Loop
    let currentDHand = dHand;
    let dScore = calculateScore(currentDHand);
    
    const dealerLoop = async () => {
        const deckRef = [...deck];
        
        while (dScore < 17) {
            await new Promise(r => setTimeout(r, 800)); // Think time
            const card = deckRef.pop()!;
            currentDHand = [...currentDHand, card];
            setDealerHand(currentDHand);
            setDeck(deckRef);
            dScore = calculateScore(currentDHand);
        }

        evaluateGame(finalPHand, currentDHand);
    };

    setTimeout(dealerLoop, 600);
  };

  const handleBlackjack = () => {
    // Check if dealer also has BJ
    const dHand = [...dealerHand];
    dHand[1].isHidden = false;
    setDealerHand(dHand);
    
    if (calculateScore(dHand) === 21) {
        setGameState('RESULT');
        setResultMessage('PUSH');
        onWin(betAmount);
    } else {
        setGameState('RESULT');
        setResultMessage('BLACKJACK!');
        onWin(betAmount * 2.5);
    }
  };

  const evaluateGame = (pHand: CardObj[], dHand: CardObj[]) => {
      const pScore = calculateScore(pHand);
      const dScore = calculateScore(dHand);

      setGameState('RESULT');

      if (dScore > 21) {
          setResultMessage('DEALER BUST! YOU WIN');
          onWin(betAmount * 2);
      } else if (pScore > dScore) {
          setResultMessage('YOU WIN');
          onWin(betAmount * 2);
      } else if (dScore > pScore) {
          setResultMessage('DEALER WINS');
          onLoss();
      } else {
          setResultMessage('PUSH');
          onWin(betAmount);
      }
  };

  const resetGame = () => {
      setGameState('BETTING');
      setPlayerHand([]);
      setDealerHand([]);
      setBetAmount(0);
      setChips([]);
  };

  // --- Rendering ---
  const dealerScore = calculateScore(dealerHand);
  const playerScore = calculateScore(playerHand);

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto p-2 relative h-[calc(100vh-100px)] min-h-[600px] overflow-hidden">
       <style>{`
         .perspective-1000 { perspective: 1000px; }
         .transform-style-3d { transform-style: preserve-3d; }
         .backface-hidden { 
           backface-visibility: hidden; 
           -webkit-backface-visibility: hidden;
         }
         .rotate-y-180 { transform: rotateY(180deg); }
       `}</style>
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Blackjack">
          <div className="space-y-4">
            <section>
              <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
              <p>Beat the dealer's hand without going over 21.</p>
            </section>
            <section>
              <h3 className="font-bold text-white mb-2 text-lg">Rules</h3>
              <ul className="list-disc pl-4 space-y-2 text-gray-400">
                <li><strong>Hit:</strong> Take another card.</li>
                <li><strong>Stand:</strong> Hold your hand.</li>
                <li><strong>Double:</strong> Double bet, take exactly one more card.</li>
                <li>Dealer must stand on 17.</li>
                <li>Blackjack pays 3:2.</li>
              </ul>
            </section>
          </div>
       </GameInfoModal>

       <button onClick={() => setShowInfo(true)} className="absolute top-4 right-4 z-50 text-gray-500 hover:text-white p-2 bg-black/20 rounded-full backdrop-blur">
          <HelpCircle size={24} />
       </button>

       {/* --- The Table --- */}
       <div 
         ref={tableRef}
         className="relative w-full h-full bg-[#064e3b] rounded-[40px] border-[16px] border-[#382618] shadow-2xl overflow-hidden flex flex-col items-center justify-between py-10 perspective-1000"
       >
          {/* Table Texture */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] pointer-events-none mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>

          {/* Table Markings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] border-2 border-white/10 rounded-full opacity-30 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -translate-y-20 text-center opacity-20 pointer-events-none">
             <div className="text-4xl font-black text-yellow-500 tracking-widest uppercase">Blackjack</div>
             <div className="text-sm font-bold text-white mt-1">Dealer must stand on 17 • Blackjack pays 3 to 2</div>
          </div>

          {/* Shoe (Deck Holder) */}
          <div className="absolute -right-8 top-20 w-32 h-48 bg-black/40 rounded-lg border-4 border-slate-800 rotate-[-15deg] transform translate-x-10 shadow-2xl">
             {/* Visual cards in shoe */}
             <div className="absolute top-1 left-1 w-full h-full bg-blue-900 rounded border-l-2 border-white/20"></div>
          </div>

          {/* Discard Tray */}
          <div className="absolute -left-8 top-20 w-32 h-48 bg-black/20 rounded-lg border-4 border-slate-800/50 rotate-[15deg] transform -translate-x-10"></div>


          {/* --- Dealer Section --- */}
          <div className="relative z-10 flex flex-col items-center mt-10 min-h-[160px]">
             {dealerHand.length > 0 && (
                <div className="mb-4 bg-black/40 px-3 py-1 rounded-full text-xs font-bold text-white/80 border border-white/10">
                   DEALER {gameState === 'RESULT' || gameState === 'DEALER_TURN' ? dealerScore : ''}
                </div>
             )}
             
             <div className="relative w-24 h-36">
                {dealerHand.map((card, i) => (
                   <PlayingCard key={card.id} card={card} index={i} origin="DECK" />
                ))}
             </div>
          </div>

          {/* --- Center Info / Result --- */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
             {resultMessage && (
                <div className="animate-in zoom-in slide-in-from-bottom duration-300">
                   <div className="bg-slate-900/90 backdrop-blur-md border-2 border-yellow-500 px-8 py-4 rounded-xl shadow-2xl flex flex-col items-center">
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-wider drop-shadow-md">
                        {resultMessage}
                      </h2>
                      {(resultMessage.includes('WIN') || resultMessage.includes('BLACKJACK')) && (
                          <div className="text-emerald-400 font-mono font-bold text-xl mt-1">
                             +${(resultMessage.includes('BLACKJACK') ? betAmount * 2.5 : resultMessage.includes('PUSH') ? betAmount : betAmount * 2).toFixed(2)}
                          </div>
                      )}
                   </div>
                </div>
             )}
          </div>

          {/* --- Player Section --- */}
          <div className="relative z-10 flex flex-col items-center mb-10 w-full">
             
             {/* Betting Circle / Chips */}
             <div className="relative w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center mb-8 bg-black/10 shadow-inner">
                 {/* Placed Chips Stack */}
                 {chips.map((val, i) => (
                    <div 
                       key={i} 
                       className="absolute"
                       style={{ 
                          bottom: `${10 + i * 4}px`, 
                          zIndex: i,
                          filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))'
                       }}
                    >
                       <Chip val={val} className="w-14 h-14 md:w-16 md:h-16 text-sm" />
                    </div>
                 ))}
                 
                 {betAmount === 0 && gameState === 'BETTING' && (
                    <span className="text-white/20 font-bold text-xs uppercase text-center">Place<br/>Bet</span>
                 )}
                 {betAmount > 0 && (
                    <div className="absolute -bottom-8 bg-black/60 px-3 py-1 rounded-full text-white font-mono font-bold text-sm border border-white/10">
                       ${betAmount}
                    </div>
                 )}
             </div>

             {/* Player Hand */}
             <div className="relative min-h-[150px] flex justify-center w-full">
                {playerHand.length > 0 && (
                   <div className="absolute -top-10 bg-emerald-900/80 px-3 py-1 rounded-full text-xs font-bold text-emerald-100 border border-emerald-500/30 z-20">
                      YOU: {playerScore}
                   </div>
                )}
                
                <div className="relative w-24 h-36">
                    {playerHand.map((card, i) => (
                       <PlayingCard key={card.id} card={card} index={i} origin="DECK" />
                    ))}
                </div>
             </div>

          </div>

       </div>

       {/* --- Action Bar (Overlay) --- */}
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl z-50 flex flex-col gap-4 animate-in slide-in-from-bottom-4">
          
          {gameState === 'BETTING' && (
             <>
               <div className="flex justify-center gap-3">
                  {CHIP_VALUES.map(val => (
                     <Chip 
                        key={val} 
                        val={val} 
                        style={{ transform: selectedChip === val ? 'scale(1.1) translateY(-5px)' : '' }}
                        className={selectedChip === val ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                        // onClick requires wrapper due to Chip component prop limitation in this quick demo, 
                        // but Chip passes styling. We use a wrapping div for click.
                     />
                  ))}
                  {/* Actual click targets need to overlay or we refactor Chip. 
                      Refactoring simpler: Re-render chips as buttons here */}
                  <div className="absolute inset-0 flex justify-center gap-3 pointer-events-none">
                     {CHIP_VALUES.map(val => (
                        <button 
                           key={val}
                           onClick={() => { setSelectedChip(val); addChip(val); }}
                           className="w-10 h-10 md:w-12 md:h-12 rounded-full pointer-events-auto"
                        ></button>
                     ))}
                  </div>
               </div>
               
               <div className="flex gap-4">
                  <button onClick={clearBet} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors">CLEAR</button>
                  <button 
                    onClick={dealGame} 
                    disabled={betAmount === 0}
                    className="flex-[2] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl py-3 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                  >
                     DEAL
                  </button>
               </div>
             </>
          )}

          {gameState === 'PLAYER_TURN' && (
             <div className="flex gap-3">
                 <button onClick={hit} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-all active:scale-95 flex flex-col items-center leading-none gap-1">
                    <span>HIT</span>
                    <Plus size={16} />
                 </button>
                 <button onClick={() => stand()} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-all active:scale-95 flex flex-col items-center leading-none gap-1">
                    <span>STAND</span>
                    <Hand size={16} />
                 </button>
                 {playerHand.length === 2 && betAmount * 2 <= 5000 && ( // Assuming generic max bet
                    <button onClick={doubleDown} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-all active:scale-95 flex flex-col items-center leading-none gap-1">
                        <span>DOUBLE</span>
                        <span className="text-xs opacity-80">2x Bet</span>
                    </button>
                 )}
             </div>
          )}

          {gameState === 'RESULT' && (
             <button onClick={resetGame} className="w-full bg-accent hover:bg-accent-hover text-background font-black text-xl py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                <RefreshCcw size={24} /> NEW GAME
             </button>
          )}
       </div>

    </div>
  );
};

export default Blackjack;
