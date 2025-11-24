import React, { useState } from 'react';
import { IndianRupee, Landmark, Star, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface CoinFlipProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

const CoinFlip: React.FC<CoinFlipProps> = ({ onBet, onWin, onLoss }) => {
  const [betAmount, setBetAmount] = useState('10');
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wobble, setWobble] = useState({ x: 0, z: 0 });
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const flip = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || flipping) return;
    if (!onBet(amount)) return;

    setFlipping(true);
    setResult(null);

    // Random wobble for realism (tilting the coin slightly as it spins)
    setWobble({
        x: Math.random() * 40 - 20, // +/- 20deg tilt X
        z: Math.random() * 20 - 10  // +/- 10deg tilt Z
    });

    // Determine outcome immediately
    const isHeads = Math.random() > 0.5;
    const outcome = isHeads ? 'heads' : 'tails';
    
    // Calculate rotation
    // Base spins: 5-8 rotations (1800+ degrees)
    const currentRot = rotation;
    const spins = 1800 + (Math.floor(Math.random() * 4) * 360);
    let nextRot = currentRot + spins;
    
    // Normalize target to ensure we land on the correct face
    const targetMod = isHeads ? 0 : 180;
    const currentMod = nextRot % 360;
    
    let adjustment = targetMod - currentMod;
    if (adjustment < 0) adjustment += 360; 
    
    nextRot += adjustment;

    setRotation(nextRot);

    // Animation duration matches CSS (2000ms)
    setTimeout(() => {
        setFlipping(false);
        setResult(outcome);
        // Reset wobble for landing state (optional, but keeps it clean)
        setWobble({ x: 0, z: 0 });

        if (outcome === choice) {
            onWin(amount * 1.96);
        } else {
            onLoss();
        }
    }, 2000);
  };

  // --- Visual Styles ---
  
  // "Antique Brass" Gradient
  const metallicGradient = "bg-gradient-to-br from-[#d4af37] via-[#f9e5b0] to-[#8b6c42]";
  
  // Reeded Edge Texture (Repeating Gradient)
  const rimTexture = {
      backgroundImage: 'repeating-linear-gradient(90deg, #8b6c42 0px, #8b6c42 1px, #5c3a13 1px, #5c3a13 2px)',
      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)'
  };
  
  // Helper to render the face content
  const CoinFace = ({ side }: { side: 'heads' | 'tails' }) => (
    <div className={`w-full h-full rounded-full border-[2px] border-[#7a5224]/60 flex items-center justify-center flex-col relative shadow-[inset_0_0_15px_rgba(0,0,0,0.4)] ${metallicGradient}`}>
        {/* Weathering Texture Overlay */}
        <div className="absolute inset-0 rounded-full bg-[url('https://www.transparenttextures.com/patterns/stucco.png')] opacity-20 mix-blend-multiply"></div>
        
        {/* Static Specular Highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-50 pointer-events-none"></div>

        {/* Engraved Rings */}
        <div className="absolute inset-1 rounded-full border border-dashed border-[#7a5224]/60"></div>
        <div className="absolute inset-3 rounded-full border-[1.5px] border-[#f3dcb5]/50"></div>

        {side === 'heads' ? (
            <>
              {/* Heads: Ashoka Pillar Style */}
              <div className="absolute top-5 text-[8px] font-bold text-[#4a2c0f] tracking-[0.2em] uppercase font-serif drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">Bharat India</div>
              <div className="relative z-10 flex flex-col items-center justify-center mt-1 transform translate-y-1">
                  <Landmark size={56} className="text-[#4a2c0f] drop-shadow-[0_1px_0_rgba(255,255,255,0.3)] fill-[#4a2c0f]/10" strokeWidth={1.5} />
                  <div className="text-[7px] font-serif font-bold text-[#4a2c0f] mt-2 tracking-widest opacity-80">SATYAMEVA JAYATE</div>
              </div>
              <div className="absolute bottom-6 flex gap-2">
                 <Star size={8} className="text-[#4a2c0f] fill-[#4a2c0f]" />
                 <Star size={8} className="text-[#4a2c0f] fill-[#4a2c0f]" />
              </div>
            </>
        ) : (
            <>
              {/* Tails: Value */}
              <div className="absolute top-5 text-[8px] font-bold text-[#4a2c0f] tracking-[0.2em] uppercase font-serif drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">Rupaya</div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1 transform translate-x-[-2px]">
                      <IndianRupee size={38} className="text-[#4a2c0f] drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]" strokeWidth={2.5} />
                      <span className="text-5xl font-serif font-black text-[#4a2c0f] drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">10</span>
                  </div>
                  <div className="w-8 h-[1px] bg-[#4a2c0f]/40 my-1"></div>
                  <div className="text-[9px] font-serif font-bold text-[#4a2c0f] tracking-widest">RUPEES</div>
                  <div className="text-[7px] font-mono font-bold text-[#4a2c0f]/60 mt-0.5">2024</div>
              </div>
              {/* Decorative Wheat sides */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 h-24 w-4 border-l-2 border-double border-[#4a2c0f]/20 rounded-l-full"></div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 h-24 w-4 border-r-2 border-double border-[#4a2c0f]/20 rounded-r-full"></div>
            </>
        )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 gap-16 min-h-[600px] justify-center relative">
       
       <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Coin Flip">
          <div className="space-y-4">
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Guess whether the coin will land on Heads or Tails.</p>
             </section>
             <section>
               <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                 <li>Select <strong>Heads</strong> or <strong>Tails</strong>.</li>
                 <li>Place your bet.</li>
                 <li>The coin will flip. If it lands on your choice, you win 1.96x your bet.</li>
               </ul>
             </section>
          </div>
       </GameInfoModal>

       <div className="absolute top-0 right-4">
          <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white p-2">
             <HelpCircle size={24} />
          </button>
       </div>

       <style>{`
         .perspective-1000 { perspective: 1000px; }
         .transform-style-3d { transform-style: preserve-3d; }
         .backface-hidden { 
            backface-visibility: hidden; 
            -webkit-backface-visibility: hidden;
         }
         
         /* Parabolic Toss Animation */
         @keyframes toss {
           0% { transform: translateY(0) scale(1); }
           50% { transform: translateY(-250px) scale(1.15); }
           100% { transform: translateY(0) scale(1); }
         }
         .animate-toss {
           animation: toss 2s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
         }

         /* Shadow Size Animation */
         @keyframes shadowScale {
           0% { opacity: 0.4; transform: translate(-50%, 0) scale(1); }
           50% { opacity: 0.1; transform: translate(-50%, 40px) scale(0.5); }
           100% { opacity: 0.4; transform: translate(-50%, 0) scale(1); }
         }
         .animate-shadow {
            animation: shadowScale 2s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
         }
       `}</style>

       {/* 3D Coin Container */}
       <div className="relative w-64 h-64 perspective-1000">
          {/* Wrapper handles the Vertical Jump (Toss) */}
          <div className={`w-full h-full relative z-20 ${flipping ? 'animate-toss' : ''}`}>
              
              {/* Inner Wrapper handles the Rotation */}
              <div 
                 className="w-full h-full transform-style-3d transition-transform duration-[2000ms] ease-in-out"
                 style={{ 
                    transform: `rotateY(${rotation}deg) rotateX(${flipping ? wobble.x : 0}deg) rotateZ(${flipping ? wobble.z : 0}deg)`
                 }}
              >
                 {/* 
                    Create Thickness by stacking multiple layers.
                    Using 16 layers for smoother looking edges.
                 */}
                 {[...Array(16)].map((_, i) => (
                     <div 
                        key={i}
                        className="absolute inset-0 rounded-full"
                        style={{ 
                            transform: `translateZ(${i - 8}px)`,
                            ...rimTexture
                        }}
                     />
                 ))}

                 {/* HEADS (Front Face) */}
                 <div 
                    className="absolute inset-0 backface-hidden rounded-full"
                    style={{ transform: 'translateZ(9px)' }} // Slightly proud of the rim
                 >
                     <CoinFace side="heads" />
                     {/* Dynamic Shine Effect */}
                     <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 animate-pulse mix-blend-overlay"></div>
                 </div>

                 {/* TAILS (Back Face) */}
                 <div 
                    className="absolute inset-0 backface-hidden rounded-full"
                    style={{ transform: 'translateZ(-9px) rotateY(180deg)' }}
                 >
                     <CoinFace side="tails" />
                 </div>
              </div>
          </div>
          
          {/* Dynamic Shadow */}
          <div className={`absolute -bottom-16 left-1/2 w-40 h-8 bg-black/40 blur-xl rounded-[100%] transition-all ${flipping ? 'animate-shadow' : '-translate-x-1/2'}`}></div>
       </div>

       {/* Controls */}
       <div className="bg-card p-6 rounded-xl border border-slate-800 w-full max-w-md space-y-6 shadow-2xl relative z-10">
          <div className="flex bg-slate-900 p-1 rounded-lg">
             <button 
               onClick={() => setChoice('heads')} 
               disabled={flipping}
               className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${choice === 'heads' ? 'bg-[#d4af37] text-[#4a2c0f] shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                <Landmark size={16} />
                Heads
             </button>
             <button 
               onClick={() => setChoice('tails')} 
               disabled={flipping}
               className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${choice === 'tails' ? 'bg-[#d4af37] text-[#4a2c0f] shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                <IndianRupee size={16} />
                Tails
             </button>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Bet Amount</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input 
                    type="number" 
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={flipping}
                    className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white font-mono focus:border-[#d4af37] outline-none transition-colors"
                />
            </div>
          </div>

          <button 
            onClick={flip}
            disabled={flipping}
            className={`w-full font-bold text-lg py-4 rounded-lg shadow-lg transition-all active:scale-95 ${flipping ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-accent hover:bg-accent-hover text-background shadow-[0_0_20px_rgba(0,231,1,0.2)]'}`}
          >
            {flipping ? 'Flipping...' : `Flip for ${(parseFloat(betAmount) * 1.96).toFixed(2)}`}
          </button>
       </div>
    </div>
  );
};

export default CoinFlip;