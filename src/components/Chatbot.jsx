import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader, Bot } from 'lucide-react';
import axiosInstance from '../services/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am your Influence Analyst. How can I help you understand trends and simulations today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/chat/', { message: userMessage });
      setMessages(prev => [...prev, { role: 'ai', content: response.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error connecting to the intelligence engine.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 z-50 hover:scale-110 ${isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`}
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.5)'
        }}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 z-50 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-violet-400" />
            <h3 className="font-semibold text-white">Influence Analyst</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-3 flex gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/20">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about trends..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-1.5 text-violet-400 hover:text-violet-300 disabled:opacity-50 disabled:hover:text-violet-400 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
