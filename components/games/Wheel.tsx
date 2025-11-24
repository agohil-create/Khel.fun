import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { History, Settings2, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import GameInfoModal from '../GameInfoModal';

interface WheelProps {
  onBet: (amount: number) => boolean;
  onWin: (amount: number) => void;
  onLoss: () => void;
}

type RiskLevel = 'Low' | 'Medium' | 'High';
type SegmentCount = 10 | 20 | 30 | 40 | 50;

interface GameHistory {
  multiplier: number;
  id: number;
}

const Wheel: React.FC<WheelProps> = ({ onBet, onWin, onLoss }) => {
  // --- State ---
  const [betAmount, setBetAmount] = useState<string>('10');
  const [risk, setRisk] = useState<RiskLevel>('Medium');
  const [segments, setSegments] = useState<SegmentCount>(10);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // --- Refs for Animation ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<number>(0); // Current rotation in radians
  const targetRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const spinDurationRef = useRef<number>(0);
  const startRotationRef = useRef<number>(0);

  // --- Configuration Generation ---
  const multipliers = useMemo(() => {
    const count = segments;
    const result: number[] = [];
    
    // Generate multipliers based on Risk & Segment count
    // This mimics typical crypto casino distributions
    for (let i = 0; i < count; i++) {
      let val = 0;
      
      if (risk === 'Low') {
        // Low Risk: Lots of small wins, few losses
        if (i % 2 === 0) val = 1.5;
        else if (i % 5 === 0) val = 0; // Loss every 5
        else val = 1.2;
      } else if (risk === 'Medium') {
        // Medium Risk: Balanced
        if (i === 0) val = 5.0; // Jackpot
        else if (i % 2 === 0) val = 2.0;
        else if (i % 3 === 0) val = 0;
        else val = 1.5; // Small win
        
        // Static pattern to keep React consistent:
        // Overwrite with a predictable pattern for the demo
        const pattern = [0, 1.9, 0, 1.5, 0, 2.0, 0, 1.5, 0, 3.0];
        val = pattern[i % pattern.length];
        if (count >= 20 && i === count - 1) val = 5.0; // High multiplier at end
      } else {
        // High Risk: High payouts, many 0s
        const pattern = [0, 0, 0, 0, 0, 0, 0, 0, 0, 9.9]; // 1 in 10 chance
        if (count === 10) val = pattern[i];
        else if (count === 20) val = (i % 20 === 0) ? 19.8 : 0;
        else if (count === 30) val = (i % 10 === 0) ? 9.9 : 0;
        else if (count === 40) val = (i % 40 === 0) ? 39.6 : 0;
        else if (count === 50) val = (i % 25 === 0) ? 24.5 : 0;
      }
      
      result.push(val);
    }
    
    return result;
  }, [risk, segments]);

  const getSegmentColor = (multiplier: number) => {
    if (multiplier === 0) return '#334155'; // Slate 700 (Loss)
    if (multiplier < 1.5) return '#3b82f6'; // Blue
    if (multiplier < 3) return '#00e701'; // Green
    if (multiplier < 10) return '#eab308'; // Yellow
    return '#ef4444'; // Red (Jackpot)
  };

  // --- Game Logic ---

  const spin = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || isSpinning) return;
    if (!onBet(amount)) return;

    setIsSpinning(true);
    setLastWin(null);

    // 1. Determine Result immediately
    // Randomly select a winning index
    const winningIndex = Math.floor(Math.random() * segments);
    const outcomeMultiplier = multipliers[winningIndex];

    // 2. Calculate Rotation
    // Standardize: Segment 0 starts at 0 rad (3 o'clock) and goes to segmentAngle.
    // The visual center of segment `i` is at `i * segmentAngle + segmentAngle/2`.
    // The pointer is at -PI/2 (12 o'clock / Top).
    // We want the wheel to rotate such that the winning segment's center ends up at -PI/2.
    // If Wheel Rotation is R, the visual center of segment i is at `center + R`.
    // We want `center + R = -PI/2`.
    // So `R = -PI/2 - center`.
    
    const segmentAngle = (2 * Math.PI) / segments;
    const winningSegmentCenter = (winningIndex * segmentAngle) + (segmentAngle / 2);
    
    // Base rotation needed to align the winning segment to the top
    const baseTargetRotation = -Math.PI / 2 - winningSegmentCenter;

    // Add Spins (Clockwise)
    // We want target > current to spin clockwise.
    const currentRot = rotationRef.current;
    const minSpins = 5;
    
    // Find next multiple of 2PI that ensures we spin at least minSpins times
    let targetRotation = baseTargetRotation;
    while (targetRotation < currentRot + (minSpins * Math.PI * 2)) {
      targetRotation += Math.PI * 2;
    }

    // Add Random Jitter
    // Reduced to 20% of segment width to ensure the pointer stays comfortably inside the segment
    // and doesn't visually overlap the line, avoiding user confusion.
    const maxJitter = segmentAngle * 0.2; 
    const jitter = (Math.random() * 2 - 1) * maxJitter;
    
    targetRotation += jitter;

    startRotationRef.current = currentRot;
    targetRotationRef.current = targetRotation;
    startTimeRef.current = Date.now();
    spinDurationRef.current = 4000; // 4 seconds

    // 3. Start Animation Loop
    requestAnimationFrame(animate);

    // 4. Handle Result after delay
    setTimeout(() => {
      setIsSpinning(false);
      if (outcomeMultiplier > 0) {
        onWin(amount * outcomeMultiplier);
        setLastWin(amount * outcomeMultiplier);
      } else {
        onLoss();
      }
      
      // Update History
      setHistory(prev => [
        { multiplier: outcomeMultiplier, id: Date.now() },
        ...prev.slice(0, 20)
      ]);
    }, spinDurationRef.current);
  };

  const animate = () => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    
    if (elapsed < spinDurationRef.current) {
      // Easing: Cubic Ease Out
      const t = elapsed / spinDurationRef.current;
      const easeOut = 1 - Math.pow(1 - t, 3);
      
      rotationRef.current = startRotationRef.current + (targetRotationRef.current - startRotationRef.current) * easeOut;
      
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Snap to final
      rotationRef.current = targetRotationRef.current;
      draw();
    }
  };

  // --- Drawing Logic ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas; // Physical dimensions
    
    // Reset transforms
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    
    // Apply DPI scaling
    ctx.scale(dpr, dpr);

    const logicalWidth = width / dpr;
    const logicalHeight = height / dpr;
    const centerX = logicalWidth / 2;
    const centerY = logicalHeight / 2;
    const radius = Math.min(centerX, centerY) - 25; 

    // Save context for wheel rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRef.current);

    // Draw Segments
    const segmentAngle = (Math.PI * 2) / segments;

    multipliers.forEach((mult, i) => {
      // Segment 0 starts at 0 radians (3 o'clock)
      const startAngle = i * segmentAngle;
      const endAngle = (i + 1) * segmentAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      const color = getSegmentColor(mult);
      ctx.fillStyle = color;
      ctx.fill();

      // Stroke
      ctx.strokeStyle = '#0f212e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Text
      ctx.save();
      // Rotate to center of segment
      const midAngle = startAngle + segmentAngle / 2;
      ctx.rotate(midAngle);
      ctx.translate(radius * 0.75, 0); 
      
      ctx.fillStyle = mult === 0 ? '#94a3b8' : '#ffffff';
      ctx.font = `bold ${Math.max(10, 24 - segments * 0.3)}px Inter`; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      
      ctx.fillText(mult === 0 ? '0.0x' : `${mult}x`, 0, 0);
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Inner Hub
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2c38';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#0f212e';
    ctx.fill();

    ctx.restore(); // Restore from wheel rotation

    // Draw Pointer (Static at top/12 o'clock)
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Pointer is at -90 degrees (Top) relative to center
    // Triangle pointing down
    ctx.beginPath();
    ctx.moveTo(0, -radius + 15); // Tip overlapping wheel
    ctx.lineTo(-12, -radius - 15);
    ctx.lineTo(12, -radius - 15);
    ctx.closePath();
    
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, -radius - 15, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
    
    ctx.restore();
  }, [segments, multipliers]);

  // Handle Resize & High DPI
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const dpr = window.devicePixelRatio || 1;
          const rect = parent.getBoundingClientRect();
          const size = Math.min(rect.width, rect.height);
          
          canvasRef.current.width = size * dpr;
          canvasRef.current.height = size * dpr;
          canvasRef.current.style.width = `${size}px`;
          canvasRef.current.style.height = `${size}px`;
          
          draw();
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 50);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]); 

  // Redraw when config changes
  useEffect(() => {
    draw();
  }, [multipliers, draw]);


  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4">
      
      <GameInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="How to Play Wheel">
         <div className="space-y-4">
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Objective</h3>
               <p>Spin the wheel and hope it lands on a high multiplier segment.</p>
            </section>
            <section>
               <h3 className="font-bold text-white mb-2 text-lg">Gameplay</h3>
               <ul className="list-disc pl-4 space-y-2 text-gray-400">
                  <li>Select your <strong>Risk Level</strong> (Low, Medium, High).</li>
                  <li>Select the <strong>Number of Segments</strong> (10-50).</li>
                  <li>High Risk mode has huge multipliers (e.g. 99x) but many losing segments (0.0x).</li>
                  <li>Low Risk mode offers smaller, more frequent wins.</li>
                  <li>Click <strong>Spin</strong> to play.</li>
               </ul>
            </section>
         </div>
      </GameInfoModal>

      {/* History Bar */}
      <div className="w-full bg-card rounded-lg p-2 flex items-center gap-2 overflow-hidden border border-slate-800 shadow-sm h-14">
        <div className="flex items-center gap-2 px-2 text-gray-500 border-r border-slate-700 shrink-0">
           <History size={16} />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar items-center h-full">
           {history.length === 0 && <span className="text-xs text-gray-600 italic pl-2">No recent games</span>}
           {history.map((h) => (
             <div 
                key={h.id}
                className={`
                  min-w-[50px] h-8 flex items-center justify-center rounded font-mono text-xs font-bold border border-white/5
                  ${h.multiplier === 0 ? 'bg-slate-700 text-gray-400' : 
                    h.multiplier >= 10 ? 'bg-gradient-to-b from-red-500 to-red-700 text-white shadow-lg shadow-red-900/20' :
                    h.multiplier >= 2 ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white' : 
                    'bg-slate-600 text-white'}
                `}
             >
               {h.multiplier}x
             </div>
           ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 bg-card p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-6 h-fit">
           <div className="flex justify-between items-center">
              <h2 className="font-bold text-white uppercase tracking-widest">Wheel</h2>
              <button onClick={() => setShowInfo(true)} className="text-gray-500 hover:text-white">
                 <HelpCircle size={20} />
              </button>
           </div>
           
           {/* Bet Amount */}
           <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Bet Amount</label>
                <span className="text-xs font-bold text-gray-500">${parseFloat(betAmount || '0').toFixed(2)}</span>
              </div>
              <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input 
                    type="number" 
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={isSpinning}
                    className="w-full bg-background border border-slate-700 rounded-lg py-3 pl-7 pr-3 text-white font-mono focus:border-accent focus:outline-none transition-colors"
                  />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => setBetAmount((parseFloat(betAmount)/2).toFixed(2))}
                    disabled={isSpinning}
                    className="bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2 rounded text-gray-400 transition-colors"
                  >
                    ½
                  </button>
                  <button 
                    onClick={() => setBetAmount((parseFloat(betAmount)*2).toFixed(2))}
                    disabled={isSpinning}
                    className="bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2 rounded text-gray-400 transition-colors"
                  >
                    2x
                  </button>
              </div>
           </div>

           {/* Risk Selector */}
           <div>
             <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Risk</label>
             <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
               {(['Low', 'Medium', 'High'] as RiskLevel[]).map((r) => (
                 <button
                   key={r}
                   onClick={() => setRisk(r)}
                   disabled={isSpinning}
                   className={`
                     py-2 rounded text-xs font-bold transition-all
                     ${risk === r ? 'bg-card text-accent shadow shadow-black/20' : 'text-gray-500 hover:text-white'}
                   `}
                 >
                   {r}
                 </button>
               ))}
             </div>
           </div>

           {/* Segments Selector */}
           <div>
             <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Segments</label>
             <div className="grid grid-cols-5 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
               {([10, 20, 30, 40, 50] as SegmentCount[]).map((s) => (
                 <button
                   key={s}
                   onClick={() => setSegments(s)}
                   disabled={isSpinning}
                   className={`
                     py-2 rounded text-[10px] font-bold transition-all
                     ${segments === s ? 'bg-card text-accent shadow shadow-black/20' : 'text-gray-500 hover:text-white'}
                   `}
                 >
                   {s}
                 </button>
               ))}
             </div>
           </div>

           <button 
             onClick={spin}
             disabled={isSpinning}
             className={`
               w-full font-bold text-lg py-4 rounded-lg shadow-lg transition-all active:scale-95 mt-4
               ${isSpinning 
                 ? 'bg-slate-700 text-gray-400 cursor-not-allowed' 
                 : 'bg-accent hover:bg-accent-hover text-background shadow-[0_0_20px_rgba(0,231,1,0.2)]'}
             `}
           >
             {isSpinning ? 'Spinning...' : 'Spin'}
           </button>

        </div>

        {/* Wheel Container */}
        <div className="flex-1 bg-[#0f212e] rounded-xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px] shadow-2xl p-8">
          
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative w-full max-w-[500px] aspect-square">
             <canvas ref={canvasRef} className="w-full h-full" />
             
             {/* Center Hub Overlay for aesthetic depth */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg border-4 border-slate-800 flex items-center justify-center z-10">
               <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_rgba(0,231,1,1)] animate-pulse" />
             </div>
          </div>

          {/* Win Notification Overlay */}
          {lastWin !== null && !isSpinning && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-in zoom-in fade-in duration-300">
              <div className="bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500/50 px-8 py-6 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col items-center text-center">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">You Won</div>
                <div className="text-4xl font-black text-white font-mono">${lastWin.toFixed(2)}</div>
                <div className="mt-2 text-sm text-gray-400 font-mono">
                  {multipliers.find(m => Math.abs(m * parseFloat(betAmount) - lastWin) < 0.01)}x Multiplier
                </div>
              </div>
            </div>
          )}

          {/* Game Stats Footer */}
          <div className="absolute bottom-4 right-4 flex gap-4 text-xs font-bold text-gray-500">
             <div className="flex items-center gap-1">
                <Settings2 size={14} />
                <span>{risk} Risk</span>
             </div>
             <div className="flex items-center gap-1">
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="hover:text-white">Sound {soundEnabled ? 'On' : 'Off'}</button>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Wheel;