import React, { useState, useEffect, useRef } from 'react';
import { UserState, ChatMessage } from '../types';
import { generateAiResponse } from '../services/geminiService';
import { Send, X, Bot } from 'lucide-react';

interface ChatProps {
  user: UserState;
  isOpen: boolean;
  onClose: () => void;
  lastGameResult?: string;
}

const Chat: React.FC<ChatProps> = ({ user, isOpen, onClose, lastGameResult }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'System', message: 'Welcome to NexusBet! 🚀', timestamp: Date.now(), isSystem: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trigger AI comment when user finishes a game with a big win/loss
  useEffect(() => {
    if (lastGameResult) {
       // Drastically reduced chance (10%) for random AI comment on game result to save quota (Fixing 429s)
       if (Math.random() > 0.9) {
         handleAiResponse(lastGameResult);
       }
    }
  }, [lastGameResult]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: user.username,
      message: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // Trigger AI response
    await handleAiResponse();
  };

  const handleAiResponse = async (gameCtx?: string) => {
    setIsTyping(true);
    // Convert chat history for AI context
    const history = messages.slice(-5).map(m => ({ user: m.user, message: m.message }));
    
    const aiText = await generateAiResponse(history, gameCtx);
    
    setIsTyping(false);

    if (!aiText) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'NexusBot',
      message: aiText,
      isAi: true,
      timestamp: Date.now()
    }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-sidebar border-l border-slate-800 z-50 flex flex-col shadow-2xl">
       <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-white">Global Chat</span>
         </div>
         <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}>
               {msg.isSystem ? (
                 <span className="text-xs text-gray-500 bg-slate-800 px-2 py-1 rounded-full">{msg.message}</span>
               ) : (
                 <div className={`bg-card p-3 rounded-lg max-w-[90%] border border-slate-700 ${msg.isAi ? 'border-accent/30' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                       {msg.isAi && <Bot size={14} className="text-accent" />}
                       <span className={`text-xs font-bold ${msg.isAi ? 'text-accent' : 'text-gray-400'}`}>
                         {msg.user}
                       </span>
                       <span className="text-[10px] text-slate-600 ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed break-words">{msg.message}</p>
                 </div>
               )}
            </div>
          ))}
          {isTyping && <div className="text-xs text-gray-500 animate-pulse pl-2">NexusBot is typing...</div>}
          <div ref={chatEndRef} />
       </div>

       <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
          <button type="submit" className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-accent transition-colors">
             <Send size={18} />
          </button>
       </form>
    </div>
  );
};

export default Chat;