'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { api } from '@/lib/api';

type Message = { id: string; text: string; sender: 'user' | 'bot' };

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Namaskaram! 🙏 I am your Namma Guruvayoor assistant. How can I help you today?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }]);
    setIsTyping(true);

    try {
      const res = await api.post<{ reply: string }>('/api/chat', { message: userMsg }, false);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: res.reply, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Sorry, I am having trouble connecting right now.', sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-temple-200 overflow-hidden flex flex-col h-[500px] max-h-[80vh] animate-in slide-in-from-bottom-10 fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-temple-600 to-temple-700 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛕</span>
              <div>
                <h3 className="font-bold">Namma Assistant</h3>
                <p className="text-xs text-temple-100">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded-full transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-temple-50 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'user' ? 'bg-gold-500 text-temple-900 rounded-tr-sm' : 'bg-white border border-temple-100 text-temple-800 rounded-tl-sm shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-temple-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-temple-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-temple-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-temple-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-temple-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-temple-50 border border-temple-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gold-500"
            />
            <button type="submit" disabled={!input.trim() || isTyping} className="bg-temple-600 text-white p-2 rounded-full hover:bg-temple-700 disabled:opacity-50 transition">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-temple-600 hover:bg-temple-700 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center animate-bounce"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}
    </div>
  );
}
