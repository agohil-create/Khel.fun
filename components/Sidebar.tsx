import React from 'react';
import { GameType, BetHistoryItem } from '../types';
import { MessageSquare, History, Gamepad2, Flame } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';
import {
  IconHome,
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
} from './GameIcons';

interface SidebarProps {
  activeGame: GameType;
  onNavigate: (game: GameType) => void;
  isMobileOpen: boolean;
  toggleChat: () => void;
  history?: BetHistoryItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeGame, onNavigate, isMobileOpen, toggleChat, history = [] }) => {
  const { playClick } = useGameSound();

  const handleNav = (game: GameType) => {
    playClick();
    onNavigate(game);
  };

  const navItems = [
    { id: GameType.NONE, label: 'Lobby', icon: IconHome },
    { id: GameType.CRASH, label: 'Crash', icon: IconCrash },
    { id: GameType.PLINKO, label: 'Plinko', icon: IconPlinko },
    { id: GameType.MINES, label: 'Mines', icon: IconMines },
    { id: GameType.DICE, label: 'Dice', icon: IconDice },
    { id: GameType.LIMBO, label: 'Limbo', icon: IconLimbo },
    { id: GameType.WHEEL, label: 'Wheel', icon: IconWheel },
    { id: GameType.HILO, label: 'Hilo', icon: IconHilo },
    { id: GameType.COINFLIP, label: 'Coin Flip', icon: IconCoinFlip },
    { id: GameType.TOWER, label: 'Tower', icon: IconTower },
    { id: GameType.SLOTS, label: 'Slots', icon: IconSlots },
    { id: GameType.KENO, label: 'Keno', icon: IconKeno },
    { id: GameType.ROULETTE, label: 'Roulette', icon: IconRoulette },
    { id: GameType.BLACKJACK, label: 'Blackjack', icon: IconBlackjack },
    { id: GameType.LOOT, label: 'Loot Box', icon: IconLoot },
    { id: GameType.SICBO, label: 'Sic Bo', icon: IconSicBo },
    { id: GameType.THIMBLES, label: 'Thimbles', icon: IconThimbles },
    { id: GameType.CANDYSMASH, label: 'Candy Smash', icon: IconCandySmash },
    { id: GameType.STAIRCASE, label: 'Staircase', icon: IconStaircase },
  ];

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-sidebar z-40 transition-transform duration-300 ease-in-out
      w-64 flex flex-col border-r border-slate-800
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:shrink-0
    `}>
      {/* Brand Logo Header - Khel.fun Custom Implementation */}
      <div 
        className="p-6 flex flex-col items-center justify-center border-b border-slate-800 h-28 relative overflow-visible group cursor-pointer" 
        onClick={() => handleNav(GameType.NONE)}
      >
        <div className="relative z-10 transform transition-transform duration-300 hover:scale-105">
            {/* Background Decoration (Flames & Speed) */}
            <div className="absolute -right-8 -top-6 text-brand-orange opacity-100 transform rotate-12 scale-150 animate-pulse-fast pointer-events-none">
                <Flame size={40} fill="#FFA500" stroke="#CE2029" strokeWidth={2} />
            </div>
            <div className="absolute -right-4 -top-2 text-brand-red opacity-100 transform rotate-[25deg] scale-125 pointer-events-none">
                <Flame size={32} fill="#CE2029" stroke="none" />
            </div>
            
            {/* Speed Lines */}
            <div className="absolute top-2 -left-12 w-20 h-1 bg-gradient-to-r from-transparent to-brand-cyan opacity-60 transform -skew-x-[45deg]"></div>
            <div className="absolute bottom-2 -left-8 w-12 h-1 bg-gradient-to-r from-transparent to-brand-yellow opacity-60 transform -skew-x-[45deg]"></div>

            {/* Joystick Icon (Custom CSS Construction) */}
            <div className="absolute -top-6 right-2 w-12 h-10 bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] rounded-lg border-b-4 border-[#075985] transform rotate-[15deg] shadow-lg z-20 flex items-center justify-center">
                {/* Stick */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-slate-400 rounded-full"></div>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-brand-red rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.3)]"></div>
                {/* Buttons */}
                <div className="flex gap-1 mt-1">
                    <div className="w-2 h-2 bg-brand-yellow rounded-full shadow-sm"></div>
                    <div className="w-2 h-2 bg-brand-yellow rounded-full shadow-sm"></div>
                </div>
            </div>

            {/* Main Text Logo */}
            <div className="relative z-10 flex flex-col items-center">
               <div className="font-heading text-5xl italic tracking-wide leading-none transform -skew-x-[10deg]"
                    style={{ 
                        color: 'white',
                        textShadow: `
                            1px 1px 0 #020617,
                            -1px -1px 0 #020617,
                            1px -1px 0 #020617,
                            -1px 1px 0 #020617,
                            0px 4px 0 #0f172a,
                            0px 5px 2px rgba(0,0,0,0.5)
                        `
                    }}>
                  Khel<span className="text-white">.fun</span>
               </div>
            </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden
              ${activeGame === item.id 
                ? 'text-white bg-gradient-to-r from-brand-red/10 to-transparent border-l-4 border-brand-orange shadow-[inset_0_0_20px_rgba(206,32,41,0.1)]' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            <item.icon size={20} className={`
              z-10 transition-colors duration-200
              ${activeGame === item.id ? 'text-brand-yellow drop-shadow-[0_0_5px_rgba(255,255,51,0.5)]' : 'text-gray-500 group-hover:text-brand-cyan'}
            `} />
            <span className={`z-10 font-bold tracking-wide ${activeGame === item.id ? 'font-heading text-xl pt-0.5' : 'text-sm font-body'}`}>
              {item.label}
            </span>
            
            {/* Active Glow */}
            {activeGame === item.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/20 to-transparent opacity-50"></div>
            )}
          </button>
        ))}

        {history.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800/50 px-2 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-2 mb-3 px-2">
                <History size={14} className="text-brand-orange" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-heading text-lg">Live Bets</span>
             </div>
             <div className="space-y-2">
                {history.map((bet) => (
                  <div key={bet.id} className="bg-black/40 rounded-lg p-2.5 border-l-2 border-slate-700 hover:border-brand-cyan transition-all group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-heading text-gray-300 text-sm capitalize flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${bet.payout > 0 ? 'bg-brand-yellow shadow-[0_0_8px_#ffff33]' : 'bg-slate-600'}`}></div>
                           {bet.game.toLowerCase()}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">{new Date(bet.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      
                      <div className="flex justify-between items-end text-xs">
                          <div className="flex flex-col">
                             <span className="font-mono text-gray-400">${bet.wager.toFixed(2)}</span>
                          </div>
                          <div className={`flex flex-col items-end`}>
                             <span className={`font-sub text-sm ${bet.payout > 0 ? 'text-brand-yellow' : 'text-gray-600'}`}>
                                {bet.payout > 0 ? `+${bet.payout.toFixed(2)}` : '-'}
                             </span>
                          </div>
                      </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={() => { playClick(); toggleChat(); }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white py-3 rounded-lg transition-all font-bold text-sm border border-slate-700 hover:border-brand-cyan/50 group"
        >
          <MessageSquare size={16} className="text-brand-cyan group-hover:drop-shadow-[0_0_5px_cyan]" />
          <span className="font-heading tracking-wide text-xl pt-1">Live Chat</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;