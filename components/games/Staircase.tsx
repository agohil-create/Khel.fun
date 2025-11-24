import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HelpCircle, Trophy, AlertTriangle, RefreshCcw } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';
import { useGameSound } from '../../hooks/useGameSound';

interface StaircaseProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const TOTAL_STEPS = 13;
// Multipliers for standard difficulty curve
const MULTS = [1.18, 1.50, 1.92, 2.49, 3.28, 4.39, 5.99, 8.38, 12.07, 17.95, 27.92, 45.37, 78.56];

// --- Glass Shatter Effect ---
const GlassShatter = () => {
  // Generate random shards
  const shards = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      left: 20 + Math.random() * 60, // Center cluster
      top: 20 + Math.random() * 60,
      width: Math.random() * 20 + 10,
      height: Math.random() * 20 + 10,
      clip: i % 2 === 0 ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'polygon(0% 0%, 100% 0%, 50% 100%)', // Triangles
      tx: (Math.random() - 0.5) * 300, // Explode outward X
      ty: Math.random() * 400 + 100,   // Fall down Y
      rot: (Math.random() - 0.5) * 720, // Spin
      delay: Math.random() * 0.1
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none z-50">
      {shards.map((s) => (
        <div
          key={s.id}
          className="absolute bg-white/40 backdrop-blur-sm border border-white/60 animate-shard-fall"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.width}px`,
            height: `${s.height}px`,
            clipPath: s.clip,
            '--tx': `${s.tx}px`,
            '--ty': `${s.ty}px`,
            '--rot': `${s.rot}deg`,
            animationDelay: `${s.delay}s`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// --- Mascot Component ---
const ElephantMascot = ({ state }: { state: 'IDLE' | 'JUMP' | 'FALL' | 'WIN' }) => {
  const animClass = 
    state === 'JUMP' ? 'animate-jump-up' : 
    state === 'FALL' ? 'animate-fall-realistic' : 
    state === 'WIN' ? 'animate-bounce' : 'animate-breath';

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 bottom-8 w-28 h-28 z-30 transition-all duration-300 ${animClass} pointer-events-none`}>
       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl filter overflow-visible">
          {/* HUGE Ears (Dumbo Style) */}
          {/* Left Ear - Flails up when falling */}
          <path 
            d="M 40 55 C 5 30, -20 80, 35 75" 
            fill="#94a3b8" stroke="#64748b" strokeWidth="1" 
            className={`origin-center ${state === 'FALL' ? 'animate-[ear-flail_0.2s_ease-in-out_infinite]' : 'animate-[wave_3s_ease-in-out_infinite]'}`}
          />
          {/* Right Ear */}
          <path 
            d="M 60 55 C 95 30, 120 80, 65 75" 
            fill="#94a3b8" stroke="#64748b" strokeWidth="1" 
            className={`origin-center ${state === 'FALL' ? 'animate-[ear-flail_0.2s_ease-in-out_infinite_reverse]' : 'animate-[wave_3s_ease-in-out_infinite_reverse]'}`}
          />
          
          {/* Inner Ear Details */}
          <path d="M 40 58 C 15 45, 0 75, 35 70" fill="#fbcfe8" opacity="0.5" />
          <path d="M 60 58 C 85 45, 100 75, 65 70" fill="#fbcfe8" opacity="0.5" />

          {/* Body */}
          <ellipse cx="50" cy="82" rx="22" ry="16" fill="#cbd5e1" />
          
          {/* Legs - Flail when falling */}
          <g className={state === 'FALL' ? 'animate-[leg-flail_0.1s_ease-in-out_infinite]' : ''}>
             <path d="M 40 92 L 40 98 A 3 3 0 0 0 46 98 L 46 92" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
             <path d="M 54 92 L 54 98 A 3 3 0 0 0 60 98 L 60 92" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
          </g>

          {/* Head */}
          <circle cx="50" cy="55" r="20" fill="#cbd5e1" />
          
          {/* Face Expression */}
          {state === 'FALL' ? (
             // Panicked Face
             <g>
                {/* Eyes Wide/X */}
                <line x1="40" y1="50" x2="46" y2="56" stroke="#1e293b" strokeWidth="2" />
                <line x1="46" y1="50" x2="40" y2="56" stroke="#1e293b" strokeWidth="2" />
                <line x1="54" y1="50" x2="60" y2="56" stroke="#1e293b" strokeWidth="2" />
                <line x1="60" y1="50" x2="54" y2="56" stroke="#1e293b" strokeWidth="2" />
                
                {/* Mouth Open Scream */}
                <circle cx="50" cy="68" r="4" fill="#1e293b" />
                
                {/* Trunk Straight Up Screaming */}
                <path d="M 50 60 Q 50 40 50 30" stroke="#cbd5e1" strokeWidth="5" fill="none" strokeLinecap="round" className="animate-[shake_0.1s_infinite]" />
                
                {/* Sweat Drops */}
                <circle cx="30" cy="40" r="2" fill="#38bdf8" className="animate-ping" />
                <circle cx="70" cy="45" r="2" fill="#38bdf8" className="animate-ping delay-75" />
             </g>
          ) : (
             // Normal Cute Face
             <g>
                <circle cx="43" cy="52" r="2.5" fill="#1e293b" />
                <circle cx="57" cy="52" r="2.5" fill="#1e293b" />
                <circle cx="44" cy="51" r="1" fill="white" />
                <circle cx="58" cy="51" r="1" fill="white" />
                {/* Trunk Curled */}
                <path d="M 50 65 Q 50 85 62 70" stroke="#cbd5e1" strokeWidth="5" fill="none" strokeLinecap="round" />
                {/* Blush */}
                <circle cx="38" cy="60" r="2.5" fill="#fecaca" opacity="0.5" />
                <circle cx="62" cy="60" r="2.5" fill="#fecaca" opacity="0.5" />
             </g>
          )}
       </svg>
    </div>
  );
};

// --- Styles ---
const styles = `
  @keyframes jump-up {
    0% { transform: translate(-50%, 100%) scale(0.8); opacity: 0; }
    40% { transform: translate(-50%, -60%) scale(1.1); opacity: 1; }
    70% { transform: translate(-50%, 10%) scale(0.95); }
    100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
  }
  @keyframes fall-realistic {
    0% { transform: translate(-50%, 0) rotate(0deg); animation-timing-function: ease-out; }
    20% { transform: translate(-50%, -30px) rotate(-10deg); animation-timing-function: ease-in; } /* Momentary hang in air */
    100% { transform: translate(-50%, 500px) rotate(45deg) scale(0.8); opacity: 0; }
  }
  @keyframes shard-fall {
    0% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.5); opacity: 0; }
  }
  @keyframes ear-flail {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }
  @keyframes leg-flail {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px) scaleY(0.8); }
  }
  @keyframes breath {
    0%, 100% { transform: translate(-50%, 0) scale(1); }
    50% { transform: translate(-50%, -3px) scale(1.02); }
  }
  @keyframes wave {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(2deg); }
  }
  
  .animate-jump-up { animation: jump-up 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  .animate-fall-realistic { animation: fall-realistic 0.7s forwards; }
  .animate-shard-fall { animation: shard-fall 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
  .animate-breath { animation: breath 3s infinite ease-in-out; }
  
  .glass-panel {
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%);
    backdrop-filter: blur(4px);
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), inset 0 0 20px rgba(255,255,255,0.05);
  }
`;

const Staircase: React.FC<StaircaseProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [currentStep, setCurrentStep] = useState(-1); // -1 = Not started, 0 = Base
  const [mines, setMines] = useState(3); 
  const [playing, setPlaying] = useState(false);
  const [dead, setDead] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playJump, playGlass, playWin, playLoss: playFail, playClick } = useGameSound();

  // Auto scroll to elephant
  useEffect(() => {
    if (scrollRef.current && currentStep > 3) {
       // Auto-scroll logic if needed, currently using CSS flex-reverse which keeps bottom anchored
    }
  }, [currentStep]);

  const startGame = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!onBet(amount)) return;

    playClick();
    setPlaying(true);
    setCurrentStep(0); // Start at first step (base)
    setDead(false);
  };

  const climb = () => {
      if (!playing || dead) return;

      // Difficulty Logic
      const winChance = (12 - mines) / 12;
      
      if (Math.random() < winChance) {
          playJump();
          const nextStep = currentStep + 1;
          if (nextStep >= TOTAL_STEPS) {
              cashOut(nextStep); 
          } else {
              setCurrentStep(nextStep);
          }
      } else {
          playGlass();
          playFail();
          setDead(true);
          onLoss();
          setTimeout(() => {
              setPlaying(false);
              setCurrentStep(-1);
          }, 2500);
      }
  };

  const cashOut = (stepIndex = currentStep) => {
      if (!playing || stepIndex <= 0) return;
      playWin();
      const amount = parseFloat(betAmount);
      const mult = MULTS[stepIndex - 1];
      onWin(amount * mult);
      setPlaying(false);
      setCurrentStep(-1);
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-6 gap-8 h-[850px] relative">
       <style>{styles}</style>
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Staircase">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white text-lg">Objective</h3>
               <p>Help Jumbo the baby elephant climb the glass staircase. Each step increases your multiplier.</p>
             </section>
             <section>
                <h3 className="font-bold text-white text-lg">Glass Panels</h3>
                <p className="text-gray-400">The glass is fragile! If a panel breaks, Jumbo falls. Higher difficulty means thinner glass!</p>
             </section>
             <section>
                <h3 className="font-bold text-white text-lg">Difficulty</h3>
                <p className="text-gray-400">Adjust the number of mines to increase the multiplier.</p>
             </section>
          </div>
       </GameInfoModal>

       {/* Header */}
       <div className="flex justify-between w-full items-center z-10">
          <div className="flex items-center gap-2">
             <Trophy className="text-accent" />
             <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Staircase</h2>
          </div>
          <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white p-2 bg-slate-800 rounded-full"><HelpCircle size={20}/></button>
       </div>

       {/* Game Area */}
       <div className="flex-1 w-full max-w-md bg-[#0f172a] rounded-2xl border-4 border-slate-800 relative overflow-hidden shadow-2xl">
           {/* Background Effects */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_#1e293b_0%,_#020617_100%)]"></div>
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           
           {/* Ambient Glow */}
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-accent/5 blur-[100px] pointer-events-none"></div>

           {/* Stairs Container */}
           <div ref={scrollRef} className="absolute inset-0 flex flex-col-reverse justify-start overflow-y-auto hide-scrollbar scroll-smooth pb-20 pt-[200px]">
               {/* Start Platform */}
               <div className="shrink-0 h-32 w-full flex items-center justify-center relative mt-4">
                   <div className="w-[90%] h-6 bg-slate-700 rounded-full absolute bottom-8 blur-sm opacity-50"></div>
                   <div className="w-[85%] h-3 bg-slate-600 rounded-full absolute bottom-10"></div>
               </div>

               {/* Steps */}
               {MULTS.map((m, i) => {
                   const isCurrent = i === currentStep && playing;
                   const isPassed = i < currentStep;
                   const isDeadStep = i === currentStep && dead;
                   const isFuture = i > currentStep;

                   return (
                       <div 
                         key={i} 
                         className={`
                            shrink-0 h-32 w-full flex items-center justify-center relative transition-all duration-500
                            ${isCurrent ? 'z-20 scale-100' : 'z-10 scale-95'}
                            ${isFuture ? 'opacity-50 blur-[0.5px]' : 'opacity-100'}
                         `}
                       >
                           {/* Glass Panel Container */}
                           <div className={`
                               relative w-[94%] h-24 rounded-xl flex items-center justify-between px-6 
                               transition-all duration-300
                               ${!isDeadStep ? 'glass-panel' : ''}
                               ${isCurrent && !dead ? 'border-accent/40 shadow-[0_0_25px_rgba(0,231,1,0.1)] bg-accent/5 ring-1 ring-accent/20' : ''}
                               ${isPassed ? 'bg-emerald-500/5 border-emerald-500/20' : ''}
                           `}>
                               {/* Shatter Effect replaces background if dead */}
                               {isDeadStep && <GlassShatter />}

                               {/* Step Number Label */}
                               <div className={`
                                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold z-10
                                  ${isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}
                                  ${isDeadStep ? 'opacity-0 transition-opacity duration-200' : ''}
                               `}>
                                 {i + 1}
                               </div>

                               {/* Multiplier */}
                               <span className={`font-mono font-bold text-2xl tracking-wider z-10 ${isPassed ? 'text-emerald-400' : isDeadStep ? 'opacity-0' : 'text-white'}`}>
                                   {m.toFixed(2)}x
                               </span>
                           </div>

                           {/* Connector visual */}
                           {i > 0 && <div className={`absolute bottom-[-16px] w-px h-8 bg-gradient-to-b from-white/10 to-transparent ${isDeadStep ? 'opacity-0' : ''}`}></div>}

                           {/* Mascot Logic */}
                           {isCurrent && (
                               <ElephantMascot state={dead ? 'FALL' : 'JUMP'} />
                           )}
                       </div>
                   );
               })}
           </div>
       </div>

       {/* Controls */}
       <div className="w-full max-w-md bg-card p-5 rounded-xl border border-slate-800 shadow-xl z-20">
           {!playing ? (
               <div className="space-y-5">
                   <div>
                       <div className="flex justify-between items-center mb-2">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mines (Difficulty)</label>
                           <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded text-sm border border-slate-700">{mines}</span>
                       </div>
                       <input 
                         type="range" min="1" max="7" value={mines} onChange={e => setMines(Number(e.target.value))}
                         className="w-full accent-accent h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                       />
                       <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2 uppercase font-bold">
                           <span>Safe</span>
                           <span className="text-red-500">Deadly</span>
                       </div>
                   </div>
                   
                   <div className="flex gap-3">
                       <div className="relative flex-1">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                           <input 
                             type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} 
                             className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-white font-mono font-bold text-lg focus:border-accent outline-none"
                           />
                       </div>
                       <button 
                         onClick={startGame} 
                         className="flex-[1.2] bg-accent hover:bg-accent-hover text-background font-black text-xl rounded-xl shadow-[0_0_20px_rgba(0,231,1,0.2)] transition-all active:scale-95 uppercase tracking-wide"
                       >
                         Start Climb
                       </button>
                   </div>
               </div>
           ) : (
               <div className="flex gap-3">
                   <button 
                     onClick={climb} 
                     disabled={dead} 
                     className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-2xl py-4 rounded-xl shadow-lg transition-all active:scale-95 flex flex-col items-center leading-none gap-1"
                   >
                       <span>JUMP</span>
                       <span className="text-[10px] opacity-80 font-normal tracking-wider uppercase">Next: {MULTS[currentStep]?.toFixed(2)}x</span>
                   </button>
                   
                   <button 
                     onClick={() => cashOut()} 
                     disabled={currentStep <= 0 || dead} 
                     className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex flex-col items-center leading-none border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 justify-center"
                   >
                       <span className="text-xs font-bold uppercase mb-1">Take</span>
                       <span className="text-lg font-mono">
                           ${(parseFloat(betAmount) * (currentStep > 0 ? MULTS[currentStep-1] : 1)).toFixed(2)}
                       </span>
                   </button>
               </div>
           )}
       </div>

    </div>
  );
};

export default Staircase;