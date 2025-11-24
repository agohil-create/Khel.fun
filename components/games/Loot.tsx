import React, { useState, useRef } from 'react';
import { Gift, Box, Star, Sword, Shield, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface LootProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const ITEMS = [
  { id: 'trash', val: 0, color: 'text-gray-500', border: 'border-gray-700', icon: Box, label: 'Trash' },
  { id: 'common', val: 0.5, color: 'text-blue-400', border: 'border-blue-500', icon: Shield, label: 'Common' },
  { id: 'rare', val: 2, color: 'text-purple-400', border: 'border-purple-500', icon: Sword, label: 'Rare' },
  { id: 'legend', val: 10, color: 'text-yellow-400', border: 'border-yellow-500', icon: Star, label: 'Legendary' },
  { id: 'god', val: 100, color: 'text-red-500', border: 'border-red-600', icon: Gift, label: 'GODLIKE' },
];

const Loot: React.FC<LootProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [spinning, setSpinning] = useState(false);
  const [strip, setStrip] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  const generateStrip = () => {
    // Weighted random generation
    const arr = [];
    for (let i = 0; i < 100; i++) {
       const r = Math.random();
       if (r < 0.01) arr.push(ITEMS[4]); // God
       else if (r < 0.05) arr.push(ITEMS[3]); // Legend
       else if (r < 0.20) arr.push(ITEMS[2]); // Rare
       else if (r < 0.50) arr.push(ITEMS[1]); // Common
       else arr.push(ITEMS[0]); // Trash
    }
    return arr;
  };

  const spin = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || spinning) return;
    if (!onBet(amount)) return;

    const newStrip = generateStrip();
    setStrip(newStrip);
    setSpinning(true);
    
    // Reset scroll
    if (scrollRef.current) {
       scrollRef.current.style.transition = 'none';
       scrollRef.current.style.transform = 'translateX(0px)';
    }

    // Determine Winner (index 75 for visual landing)
    const winItem = newStrip[75];
    
    // Animate
    setTimeout(() => {
       if (scrollRef.current) {
          // Each item is 128px + 16px gap = 144px
          // We want index 75 to land in center of container (container width ~ 500px)
          // Center is ~250px.
          // Position = -(75 * 144) + 250 - (144/2)
          const targetX = -(75 * 144) + (scrollRef.current.parentElement?.clientWidth || 500)/2 - 72;
          
          // Add randomness to land slightly off center within the card
          const jitter = (Math.random() - 0.5) * 100;
          
          scrollRef.current.style.transition = 'transform 5s cubic-bezier(0.1, 1.05, 0.2, 1)';
          scrollRef.current.style.transform = `translateX(${targetX + jitter}px)`;
       }
    }, 50);

    setTimeout(() => {
       setSpinning(false);
       if (winItem.val >= 1) {
          onWin(amount * winItem.val);
       } else {
          onLoss();
       }
    }, 5100);
  };

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-6 gap-12 relative">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Loot">
         <div className="space-y-4">
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Open a loot box to win random items with varying multipliers.</p>
            </section>
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li>Set your <strong>Bet Amount</strong>.</li>
                 <li>Click <strong>Spin</strong> to open a box.</li>
                 <li>Items range from Trash (0x) to Godlike (100x).</li>
                 <li>The spinner will land on your item.</li>
               </ul>
            </section>
         </div>
      </GameInfoModal>

      <button onClick={() => setShowInfo(true)} className="absolute top-0 right-4 text-gray-500 hover:text-white p-2">
          <HelpCircle size={24} />
      </button>

      {/* Wheel Container */}
      <div className="w-full max-w-4xl h-64 bg-slate-900 rounded-xl border-4 border-slate-800 relative overflow-hidden shadow-2xl flex items-center">
         {/* Selection Marker */}
         <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-yellow-400 z-20 opacity-50"></div>
         <div className="absolute left-1/2 -translate-x-1/2 top-0 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-yellow-400 z-30"></div>
         <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-yellow-400 z-30"></div>
         
         {/* Fade Gradients */}
         <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
         <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>

         {/* Strip */}
         <div ref={scrollRef} className="flex items-center h-full pl-[50%]">
             {strip.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-bold text-xl uppercase tracking-widest">
                   Ready to Open
                </div>
             ) : (
                strip.map((item, i) => (
                   <div key={i} className="shrink-0 w-36 h-48 mx-2 bg-card rounded-lg border-2 border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className={`absolute inset-0 opacity-10 bg-current ${item.color}`}></div>
                      <div className={`absolute bottom-0 w-full h-1 ${item.color.replace('text', 'bg')}`}></div>
                      
                      <item.icon size={48} className={`${item.color} mb-4 drop-shadow-lg`} />
                      <span className={`font-black uppercase text-sm ${item.color}`}>{item.label}</span>
                      <span className="text-xs font-mono text-gray-400 mt-1">{item.val}x</span>
                   </div>
                ))
             )}
         </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md bg-card p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
             <label className="text-xs font-bold text-gray-400 uppercase">Bet Amount</label>
             <span className="text-xs font-bold text-gray-500 font-mono">${parseFloat(betAmount).toFixed(2)}</span>
          </div>
          
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
             <input 
               type="number" 
               value={betAmount}
               onChange={e => setBetAmount(e.target.value)}
               disabled={spinning}
               className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-8 pr-4 text-white font-mono font-bold focus:border-accent outline-none"
             />
          </div>

          <button 
            onClick={spin} 
            disabled={spinning}
            className={`w-full font-black text-xl py-4 rounded-lg shadow-lg transition-all active:scale-95 ${spinning ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-accent hover:bg-accent-hover text-background shadow-[0_0_20px_rgba(0,231,1,0.3)]'}`}
          >
            {spinning ? 'OPENING...' : 'OPEN BOX'}
          </button>
      </div>
    </div>
  );
};

export default Loot;