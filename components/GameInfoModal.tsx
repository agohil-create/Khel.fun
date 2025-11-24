import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface GameInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const GameInfoModal: React.FC<GameInfoModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a2c38] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50 rounded-t-xl">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
             <HelpCircle size={20} className="text-accent" />
             <span>{title}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-gray-300 space-y-4 leading-relaxed custom-scrollbar text-sm">
           {children}
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default GameInfoModal;