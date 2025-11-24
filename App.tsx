import React, { useState, useRef } from 'react';
import { GameType, UserState, BetHistoryItem } from './types';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import { Wallet, Menu, User } from 'lucide-react';
import {
  IconCrash,
  IconPlinko,
  IconMines,
  IconDice,
  IconLimbo,
  IconWheel,
  IconHilo,
  IconCoinFlip,
  IconTower,
  IconSlots,
  IconKeno,
  IconRoulette,
  IconBlackjack,
  IconLoot,
  IconSlither,
  IconPaper,
  IconSicBo,
  IconThimbles,
  IconCandySmash,
  IconStaircase
} from './components/GameIcons';

// Games
import Crash from './components/games/Crash';
import Mines from './components/games/Mines';
import Plinko from './components/games/Plinko';
import Dice from './components/games/Dice';
import Limbo from './components/Limbo';
import Wheel from './components/games/Wheel';
import Hilo from './components/games/Hilo';
import CoinFlip from './components/games/CoinFlip';
import Tower from './components/games/Tower';
import Slots from './components/games/Slots';
import Keno from './components/games/Keno';
import Roulette from './components/games/Roulette';
import Blackjack from './components/games/Blackjack';
import Loot from './components/games/Loot';
import Slither from './components/games/Slither';
import Paper from './components/games/Paper';
import SicBo from './components/games/SicBo';
import Thimbles from './components/games/Thimbles';
import CandySmash from './components/games/CandySmash';
import Staircase from './components/games/Staircase';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.NONE);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  
  // Track the current bet amount to link it with the result
  const lastBetAmountRef = useRef<number>(0);
  
  const [user, setUser] = useState<UserState>({
    username: 'HighRoller_99',
    balance: 1000.00
  });

  const addToHistory = (payout: number) => {
    if (activeGame === GameType.NONE) return;
    
    const newItem: BetHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      game: activeGame,
      wager: lastBetAmountRef.current,
      payout: payout,
      timestamp: Date.now()
    };

    setBetHistory(prev => [newItem, ...prev].slice(0, 5));
  };

  // Balance Handlers
  const handleBet = (amount: number): boolean => {
    if (user.balance >= amount) {
      setUser(prev => ({ ...prev, balance: prev.balance - amount }));
      lastBetAmountRef.current = amount;
      return true;
    }
    alert("Insufficient funds!");
    return false;
  };

  const handleWin = (amount: number) => {
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
    setLastResult(`User won ${amount.toFixed(2)} playing ${activeGame}!`);
    addToHistory(amount);
  };

  const handleLoss = () => {
    setLastResult(`User lost playing ${activeGame}.`);
    addToHistory(0);
  };

  // Render Active Game
  const renderGame = () => {
    switch (activeGame) {
      case GameType.CRASH: return <Crash onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.MINES: return <Mines onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.PLINKO: return <Plinko onBet={handleBet} onWin={handleWin} />;
      case GameType.DICE: return <Dice onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.LIMBO: return <Limbo onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.WHEEL: return <Wheel onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.HILO: return <Hilo onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.COINFLIP: return <CoinFlip onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.TOWER: return <Tower onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.SLOTS: return <Slots onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.KENO: return <Keno onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.ROULETTE: return <Roulette onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.BLACKJACK: return <Blackjack onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.LOOT: return <Loot onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.SLITHER: return <Slither onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.PAPER: return <Paper onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.SICBO: return <SicBo onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.THIMBLES: return <Thimbles onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.CANDYSMASH: return <CandySmash onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.STAIRCASE: return <Staircase onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      default:
        return (
          <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
               <h2 className="text-3xl font-bold text-white mb-2">Game Lobby</h2>
               <p className="text-gray-400">Fair, simple, and exciting crypto games.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
               {[
                 { type: GameType.CRASH, name: 'Crash', Icon: IconCrash },
                 { type: GameType.SLITHER, name: 'Slither', Icon: IconSlither },
                 { type: GameType.PAPER, name: 'Paper.io', Icon: IconPaper },
                 { type: GameType.PLINKO, name: 'Plinko', Icon: IconPlinko },
                 { type: GameType.MINES, name: 'Mines', Icon: IconMines },
                 { type: GameType.DICE, name: 'Dice', Icon: IconDice },
                 { type: GameType.LIMBO, name: 'Limbo', Icon: IconLimbo },
                 { type: GameType.WHEEL, name: 'Wheel', Icon: IconWheel },
                 { type: GameType.HILO, name: 'Hilo', Icon: IconHilo },
                 { type: GameType.COINFLIP, name: 'Coin Flip', Icon: IconCoinFlip },
                 { type: GameType.TOWER, name: 'Tower', Icon: IconTower },
                 { type: GameType.SLOTS, name: 'Slots', Icon: IconSlots },
                 { type: GameType.KENO, name: 'Keno', Icon: IconKeno },
                 { type: GameType.ROULETTE, name: 'Roulette', Icon: IconRoulette },
                 { type: GameType.BLACKJACK, name: 'Blackjack', Icon: IconBlackjack },
                 { type: GameType.LOOT, name: 'Loot Box', Icon: IconLoot },
                 { type: GameType.SICBO, name: 'Sic Bo', Icon: IconSicBo },
                 { type: GameType.THIMBLES, name: 'Thimbles', Icon: IconThimbles },
                 { type: GameType.CANDYSMASH, name: 'Candy Smash', Icon: IconCandySmash },
                 { type: GameType.STAIRCASE, name: 'Staircase', Icon: IconStaircase },
               ].map(g => (
                 <button 
                   key={g.type}
                   onClick={() => setActiveGame(g.type)}
                   className="group relative aspect-[4/3] bg-card rounded-xl overflow-hidden border border-slate-800 hover:border-accent transition-all hover:-translate-y-1 hover:shadow-xl flex items-center justify-center"
                 >
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80" />
                   
                   <g.Icon size={80} className="absolute text-white/5 -right-4 -bottom-4 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                   
                   <div className="relative z-10 mb-4 transform transition-transform group-hover:scale-110 duration-300">
                      <g.Icon size={48} className="text-accent drop-shadow-[0_0_15px_rgba(0,231,1,0.4)]" />
                   </div>

                   <div className="absolute bottom-4 left-4 font-bold text-lg text-white">{g.name}</div>
                   <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                         <div className="w-0 h-0 border-t-3 border-b-3 border-l-5 border-transparent border-l-background ml-1"></div>
                      </div>
                   </div>
                 </button>
               ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-gray-300 font-sans selection:bg-accent selection:text-background">
      
      <Sidebar 
        activeGame={activeGame} 
        onNavigate={(g) => { setActiveGame(g); setIsMobileMenuOpen(false); }} 
        isMobileOpen={isMobileMenuOpen}
        toggleChat={() => setIsChatOpen(!isChatOpen)}
        history={betHistory}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 bg-background/95 backdrop-blur flex items-center px-4 justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 hover:bg-slate-800 rounded">
               <Menu size={20} />
             </button>
             {activeGame !== GameType.NONE && (
               <h2 className="text-lg font-bold text-white hidden md:block uppercase tracking-wider">{activeGame}</h2>
             )}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-card border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-inner">
               <Wallet size={16} className="text-accent" />
               <span className="font-mono font-bold text-white">${user.balance.toFixed(2)}</span>
               <button className="bg-accent text-background text-xs font-bold px-3 py-1 rounded ml-2 hover:opacity-90">Wallet</button>
            </div>
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-white border border-slate-600">
               <User size={18} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0f212e] relative">
           {renderGame()}
        </main>
      </div>

      <Chat 
        user={user} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        lastGameResult={lastResult}
      />

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;