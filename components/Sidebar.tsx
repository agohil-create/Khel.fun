import React from 'react';
import { GameType, BetHistoryItem } from '../types';
import { MessageSquare, History } from 'lucide-react';
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
  IconSlither,
  IconPaper,
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
    { id: GameType.SLITHER, label: 'Slither', icon: IconSlither },
    { id: GameType.PAPER, label: 'Paper.io', icon: IconPaper },
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
      <div className="p-6 flex items-center justify-center border-b border-slate-800 h-20">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-1">
          <span className="text-accent">khel</span>.fun
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${activeGame === item.id 
                ? 'bg-card text-white shadow-lg shadow-black/20' 
                : 'text-gray-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            <item.icon size={20} className={`
              ${activeGame === item.id ? 'text-accent' : 'text-gray-500 group-hover:text-white'}
            `} />
            <span className="font-medium">{item.label}</span>
            {activeGame === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(0,231,1,0.8)]"></div>
            )}
          </button>
        ))}

        {history.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800/50 px-2 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-2 mb-3 px-1">
                <History size={14} className="text-accent" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Bets</span>
             </div>
             <div className="space-y-2">
                {history.map((bet) => (
                  <div key={bet.id} className="bg-slate-800/40 rounded-lg p-3 border border-slate-800 hover:border-slate-700 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-200 text-xs capitalize flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${bet.payout > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                           {bet.game.toLowerCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(bet.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900/50 rounded px-2 py-1 flex flex-col">
                             <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Wager</span>
                             <span className="font-mono text-gray-300">${bet.wager.toFixed(2)}</span>
                          </div>
                          <div className={`bg-slate-900/50 rounded px-2 py-1 flex flex-col items-end ${bet.payout > 0 ? 'bg-emerald-900/10' : ''}`}>
                             <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Payout</span>
                             <span className={`font-mono font-bold ${bet.payout > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                ${bet.payout.toFixed(2)}
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
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors font-medium text-sm"
        >
          <MessageSquare size={16} />
          Live Chat
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;