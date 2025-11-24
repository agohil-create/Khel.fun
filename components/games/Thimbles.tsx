
import React, { useState, useEffect, useMemo } from 'react';
import { HelpCircle, MousePointerClick, Trophy, Settings2, Box, Circle, Disc } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface ThimblesProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const Thimbles: React.FC<ThimblesProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [cupCount, setCupCount] = useState(3);
  const [ballCount, setBallCount] = useState(1);
  
  // Game States
  const [gameState, setGameState] = useState<'IDLE' | 'REVEAL_START' | 'SHUFFLING' | 'PICKING' | 'REVEAL_END'>('IDLE');
  
  // Logic State
  const [positions, setPositions] = useState<number[]>([0, 1, 2]); // visual slot index for each cup ID
  const [ballOwners, setBallOwners] = useState<number[]>([]); // List of Cup IDs that have a ball
  const [selectedCup, setSelectedCup] = useState<number | null>(null); 
  const [resultMessage, setResultMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  // Calculate Multiplier (4% House Edge)
  const multiplier = useMemo(() => {
    if (ballCount >= cupCount) return 1;
    // Probability of winning = ballCount / cupCount
    // Fair Payout = cupCount / ballCount
    // House Edge adjusted = Fair * 0.96
    const raw = cupCount / ballCount;
    return Math.max(1.01, Math.floor(raw * 0.96 * 100) / 100);
  }, [cupCount, ballCount]);

  // Reset positions when cup count changes
  useEffect(() => {
    setPositions(Array.from({ length: cupCount }, (_, i) => i));
    // Ensure ball count is valid for new cup count
    if (ballCount >= cupCount) setBallCount(cupCount - 1);
  }, [cupCount]);

  const startGame = async () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    setResultMessage('');
    setSelectedCup(null);
    setBallOwners([]);

    // 1. Assign balls to cups
    const cupIds = Array.from({ length: cupCount }, (_, i) => i);
    const shuffledIds = [...cupIds].sort(() => Math.random() - 0.5);
    const newBallOwners = shuffledIds.slice(0, ballCount);
    setBallOwners(newBallOwners);
    
    // 2. Reveal Phase (Lift cups to show balls)
    setGameState('REVEAL_START');
    await new Promise(r => setTimeout(r, 1000));

    // 3. Hide (Lower cups)
    setGameState('SHUFFLING');
    await new Promise(r => setTimeout(r, 400)); 

    // 4. Shuffle Animation
    await performShuffle();

    // 5. Pick Phase
    setGameState('PICKING');
  };

  const performShuffle = async () => {
    const moves = 5 + cupCount; // More cups = slightly more shuffles
    const speed = 280; 
    
    let currentPositions = [...positions];

    for (let i = 0; i < moves; i++) {
        // Pick two distinct visual slots to swap
        const slotA = Math.floor(Math.random() * cupCount);
        let slotB = Math.floor(Math.random() * cupCount);
        while (slotB === slotA) slotB = Math.floor(Math.random() * cupCount);

        // Find which Cup ID is at these slots
        const cupA = currentPositions.findIndex(slot => slot === slotA);
        const cupB = currentPositions.findIndex(slot => slot === slotB);

        // Swap the visual slots
        const newPositions = [...currentPositions];
        newPositions[cupA] = slotB;
        newPositions[cupB] = slotA;

        setPositions(newPositions);
        currentPositions = newPositions;

        await new Promise(r => setTimeout(r, speed));
    }
  };

  const pickCup = (cupId: number) => {
      if (gameState !== 'PICKING') return;
      
      setSelectedCup(cupId);
      setGameState('REVEAL_END');

      const won = ballOwners.includes(cupId);
      if (won) {
          const winAmt = parseFloat(betAmount) * multiplier;
          onWin(winAmt);
          setResultMessage(`WON $${winAmt.toFixed(2)}`);
      } else {
          onLoss();
          setResultMessage('Try Again');
      }

      setTimeout(() => {
          setGameState('IDLE');
          setResultMessage('');
          setSelectedCup(null);
          // Reset visual order to default 0,1,2... for cleanliness
          setPositions(Array.from({ length: cupCount }, (_, i) => i)); 
      }, 3500);
  };

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-4 md:p-8 gap-8 min-h-[600px]">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Thimbles">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white text-lg">Objective</h3>
               <p>A glowing energy orb is hidden under one of the containment units. Keep your eye on the unit as they shuffle!</p>
             </section>
             <section>
               <h3 className="font-bold text-white text-lg">Difficulty</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li><strong>Units:</strong> Increase cups (3-5) for higher difficulty.</li>
                 <li><strong>Orbs:</strong> Fewer balls = higher multiplier.</li>
               </ul>
             </section>
          </div>
       </GameInfoModal>

       <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
             <div className="bg-accent/20 p-2 rounded-lg border border-accent/50 shadow-[0_0_10px_rgba(0,231,1,0.2)]">
                <Disc className="text-accent animate-spin-slow" size={24} />
             </div>
             <h2 className="text-2xl font-bold text-white uppercase tracking-wider font-mono">Thimbles<span className="text-accent">.exe</span></h2>
          </div>
          <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white p-2 bg-slate-800/50 rounded-full"><HelpCircle size={20}/></button>
       </div>

       {/* --- Game Area --- */}
       <div className="w-full max-w-3xl aspect-[2/1] md:aspect-[2.5/1] bg-[#0a0f14] rounded-xl border-2 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col group">
           
           {/* Cyberpunk Grid Floor */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(0,231,1,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,231,1,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [perspective:1000px] [transform-style:preserve-3d] opacity-50"></div>
           <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none"></div>

           {/* Game Zone */}
           <div className="flex-1 relative z-10 mx-4 md:mx-12 mb-4 md:mb-12 flex items-end">
               {/* Cups Layer */}
               {Array.from({ length: cupCount }).map((_, cupId) => {
                   const slotIndex = positions[cupId];
                   const hasBall = ballOwners.includes(cupId);
                   
                   // Reveal Logic
                   const isRevealedStart = gameState === 'REVEAL_START';
                   const isRevealedEnd = gameState === 'REVEAL_END' && (selectedCup === cupId || (hasBall && selectedCup !== null));
                   const isRaised = isRevealedStart || isRevealedEnd;
                   
                   // Calculate width based on cup count (with gaps)
                   const widthPct = 100 / cupCount;
                   const leftPct = slotIndex * widthPct;

                   return (
                       <div 
                         key={cupId}
                         className={`absolute bottom-8 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                         style={{ 
                             width: `${widthPct}%`, 
                             left: `${leftPct}%`,
                             zIndex: isRaised ? 30 : 20 
                         }}
                       >
                           <div 
                             onClick={() => pickCup(cupId)}
                             className={`
                               relative w-full h-full flex flex-col items-center justify-end pb-4
                               ${gameState === 'PICKING' ? 'cursor-pointer' : ''}
                             `}
                           >
                               {/* The Ball (Rendered Behind Cup) */}
                               {/* Strict opacity control: Only visible when raised to prevent glow bleed */}
                               <div className={`
                                   absolute bottom-2 w-8 h-8 md:w-10 md:h-10 rounded-full 
                                   bg-accent shadow-[0_0_25px_#00e701,inset_0_0_10px_white]
                                   z-0 transition-all duration-300
                                   ${hasBall && isRaised ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                               `}></div>

                               {/* The "Cup" (Containment Unit) */}
                               <div 
                                 className={`
                                    relative w-[70%] aspect-[4/5] max-w-[100px] z-10 transition-transform duration-500 ease-in-out
                                    ${isRaised ? '-translate-y-24 md:-translate-y-28' : 'translate-y-0'}
                                    ${gameState === 'PICKING' ? 'hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(0,231,1,0.3)]' : ''}
                                 `}
                               >
                                  {/* Cup Body SVG */}
                                  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl filter">
                                      <defs>
                                          <linearGradient id="cupGrad" x1="0" y1="0" x2="1" y2="1">
                                              <stop offset="0%" stopColor="#334155" />
                                              <stop offset="50%" stopColor="#1e293b" />
                                              <stop offset="100%" stopColor="#0f172a" />
                                          </linearGradient>
                                          <linearGradient id="cupRim" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#94a3b8" />
                                              <stop offset="100%" stopColor="#475569" />
                                          </linearGradient>
                                      </defs>
                                      
                                      {/* Main Body */}
                                      <path d="M15 10 L85 10 L95 110 L5 110 Z" fill="url(#cupGrad)" stroke="#475569" strokeWidth="1" />
                                      
                                      {/* Tech Lines */}
                                      <rect x="20" y="30" width="60" height="2" fill="#00e701" fillOpacity="0.3" />
                                      <rect x="25" y="40" width="50" height="1" fill="#00e701" fillOpacity="0.2" />
                                      
                                      {/* Top Handle/Lid */}
                                      <path d="M15 10 L25 0 L75 0 L85 10 Z" fill="#334155" />
                                      
                                      {/* Selection Glow Ring */}
                                      {selectedCup === cupId && (
                                          <rect x="5" y="5" width="90" height="110" fill="none" stroke="#00e701" strokeWidth="2" className="animate-pulse" rx="5" />
                                      )}
                                  </svg>
                                  
                                  {/* Floor Shadow */}
                                  <div className="absolute -bottom-2 left-[10%] w-[80%] h-3 bg-black/60 blur-md rounded-full"></div>
                               </div>
                           </div>
                       </div>
                   );
               })}
           </div>

           {/* Messages Layer */}
           <div className="absolute top-8 left-0 w-full flex justify-center pointer-events-none z-40">
               {gameState === 'PICKING' && (
                   <div className="bg-black/50 backdrop-blur border border-accent/30 text-accent font-bold px-6 py-2 rounded-full animate-bounce flex items-center gap-2">
                       <MousePointerClick size={16} />
                       SELECT UNIT
                   </div>
               )}
               {resultMessage && (
                   <div className={`flex flex-col items-center gap-2 animate-in zoom-in duration-300`}>
                       {resultMessage.includes('WON') && <Trophy size={48} className="text-yellow-400 drop-shadow-lg animate-bounce" />}
                       <div className={`px-10 py-4 rounded-xl font-black text-2xl shadow-2xl border-2 backdrop-blur-md ${resultMessage.includes('WON') ? 'bg-emerald-900/80 border-emerald-500 text-white' : 'bg-red-900/80 border-red-500 text-white'}`}>
                           {resultMessage}
                       </div>
                   </div>
               )}
           </div>
       </div>

       {/* --- Controls --- */}
       <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl">
           
           {/* Settings Panel */}
           <div className="flex-1 bg-card border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
               <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-2">
                   <Settings2 size={14} /> Configuration
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                   {/* Cup Selector */}
                   <div>
                       <label className="text-xs text-gray-500 font-bold mb-1 block">Cups</label>
                       <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                           {[3, 4, 5].map(n => (
                               <button
                                 key={n}
                                 onClick={() => setCupCount(n)}
                                 disabled={gameState !== 'IDLE'}
                                 className={`flex-1 py-2 text-xs font-bold rounded transition-all ${cupCount === n ? 'bg-slate-700 text-accent shadow' : 'text-gray-500 hover:text-gray-300'}`}
                               >
                                   {n}
                               </button>
                           ))}
                       </div>
                   </div>

                   {/* Ball Selector */}
                   <div>
                       <label className="text-xs text-gray-500 font-bold mb-1 block">Orbs</label>
                       <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                           {[1, 2, 3, 4].slice(0, cupCount - 1).map(n => (
                               <button
                                 key={n}
                                 onClick={() => setBallCount(n)}
                                 disabled={gameState !== 'IDLE'}
                                 className={`flex-1 py-2 text-xs font-bold rounded transition-all ${ballCount === n ? 'bg-slate-700 text-accent shadow' : 'text-gray-500 hover:text-gray-300'}`}
                               >
                                   {n}
                               </button>
                           ))}
                       </div>
                   </div>
               </div>
           </div>

           {/* Bet Panel */}
           <div className="flex-[1.5] bg-card border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
               <div className="flex justify-between items-center mb-4">
                   <div>
                       <div className="text-xs text-gray-500 font-bold uppercase">Multiplier</div>
                       <div className="text-2xl font-black text-accent drop-shadow-sm font-mono">{multiplier.toFixed(2)}x</div>
                   </div>
                   <div>
                       <div className="text-xs text-gray-500 font-bold uppercase text-right">Win Chance</div>
                       <div className="text-xl font-bold text-white text-right font-mono">{Math.round((ballCount/cupCount)*100)}%</div>
                   </div>
               </div>

               <div className="flex gap-3">
                   <div className="flex-1 relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                       <input 
                         type="number" 
                         value={betAmount} 
                         onChange={e => setBetAmount(e.target.value)} 
                         disabled={gameState !== 'IDLE'}
                         className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-white font-mono font-bold focus:border-accent outline-none transition-colors"
                       />
                   </div>
                   <button 
                     onClick={startGame} 
                     disabled={gameState !== 'IDLE'}
                     className={`
                        px-8 rounded-xl font-black text-lg transition-all active:scale-95 shadow-lg flex items-center gap-2
                        ${gameState !== 'IDLE' ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-accent hover:bg-accent-hover text-background shadow-[0_0_20px_rgba(0,231,1,0.2)]'}
                     `}
                   >
                     {gameState === 'IDLE' ? 'BET' : '...'}
                   </button>
               </div>
           </div>

       </div>

    </div>
  );
};

export default Thimbles;
