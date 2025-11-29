
import React, { useState, useRef } from 'react';
import { GameType, UserState, BetHistoryItem } from './types';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import { Wallet, Menu, User, Zap } from 'lucide-react';
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
      case GameType.SICBO: return <SicBo onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.THIMBLES: return <Thimbles onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.CANDYSMASH: return <CandySmash onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      case GameType.STAIRCASE: return <Staircase onBet={handleBet} onWin={handleWin} onLoss={handleLoss} />;
      default:
        return (
          <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-10 text-center">
               <h2 className="text-6xl font-heading text-white mb-2 italic tracking-wide drop-shadow-lg">
                 GAME <span className="text-brand-orange">LOBBY</span>
               </h2>
               <p className="text-gray-400 font-body text-lg max-w-2xl mx-auto">
                 Experience high-energy, fair, and competitive crypto gaming. Unleash your inner player.
               </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
               {[
                 { type: GameType.CRASH, name: 'Crash', Icon: IconCrash, hot: true },
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
                   className="group relative aspect-[4/3] bg-card rounded-2xl overflow-hidden border border-slate-800 hover:border-brand-cyan transition-all hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,255,255,0.2)] flex items-center justify-center"
                 >
                   <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black group-hover:from-slate-800 group-hover:to-slate-900 transition-colors" />
                   
                   <g.Icon size={100} className="absolute text-white/5 -right-6 -bottom-6 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                   
                   <div className="relative z-10 mb-6 transform transition-transform group-hover:scale-110 duration-300">
                      <g.Icon size={56} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:text-brand-yellow group-hover:drop-shadow-[0_0_20px_rgba(255,255,51,0.6)] transition-all" />
                   </div>

                   <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                      <div className="font-heading text-xl text-white tracking-wide text-center group-hover:text-brand-cyan transition-colors">{g.name}</div>
                   </div>

                   {g.hot && (
                      <div className="absolute top-3 right-3 bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg animate-pulse">
                         <Zap size={10} fill="currentColor" /> HOT
                      </div>
                   )}
                 </button>
               ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-gray-300 font-body selection:bg-brand-orange selection:text-white">
      
      <Sidebar 
        activeGame={activeGame} 
        onNavigate={(g) => { setActiveGame(g); setIsMobileMenuOpen(false); }} 
        isMobileOpen={isMobileMenuOpen}
        toggleChat={() => setIsChatOpen(!isChatOpen)}
        history={betHistory}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 border-b border-slate-800 bg-background/95 backdrop-blur flex items-center px-6 justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 hover:bg-slate-800 rounded text-brand-orange">
               <Menu size={24} />
             </button>
             {activeGame !== GameType.NONE && (
               <h2 className="text-3xl font-heading text-white hidden md:block uppercase tracking-wide italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                 {activeGame.replace('_', ' ')}
               </h2>
             )}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-900 border border-slate-700 rounded-full px-5 py-2 flex items-center gap-3 shadow-inner hover:border-brand-cyan/50 transition-colors">
               <Wallet size={18} className="text-brand-orange" />
               <span className="font-sub text-xl text-white tracking-wide">${user.balance.toFixed(2)}</span>
               <button className="bg-brand-red hover:bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full ml-2 shadow-[0_0_10px_rgba(206,32,41,0.4)] transition-all">
                 DEPOSIT
               </button>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-white border border-slate-600 shadow-lg cursor-pointer hover:border-brand-yellow transition-colors">
               <User size={20} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background relative custom-scrollbar">
           {renderGame()}
        </main>
      </div>

      <Chat 
        user={user} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        lastGameResult={lastResult}
      />

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
