import { useState, useEffect, useContext } from 'react';
import { api, API_BASE } from '../config/api';
import { DemoBalanceContext } from '../App';

const SUGGESTIONS = [
  "Buy 0.5 SOL worth of JUP",
  "Sell all my BONK for SOL",
  "Buy SOL when it drops 5%",
  "Sell JUP if it goes above $1",
  "What's the price of SOL?",
  "Show me trending tokens",
  "Buy $50 worth of BONK",
  "Set alert when WIF pumps 10%",
];

// OpenRouter key - only used as fallback if backend is down
// In production, AI calls should go through the backend
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export default function AIPanel({ wallet, demoMode }) {
  const shortWallet = wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : '';
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const demoBalance = useContext(DemoBalanceContext);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ghost_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ghost_chat_history', JSON.stringify(messages.slice(-50))); // Keep last 50
    }
  }, [messages]);

  const callAI = async (userMessage) => {
    // First try the backend (which has proper API keys)
    try {
      const backendRes = await api.command(userMessage, wallet);
      
      // Handle immediate trade commands in demo mode
      if (demoMode && backendRes.type === 'trade' && backendRes.action) {
        const fromSymbol = backendRes.sourceToken || 'SOL';
        const toSymbol = backendRes.targetToken || 'USDC';
        const amount = parseFloat(backendRes.amount) || 1;
        
        const swapResult = demoBalance.executeSwap(fromSymbol, toSymbol, amount);
        if (swapResult.success) {
          return `Done! Swapped ${swapResult.fromAmount.toFixed(4)} ${fromSymbol} for ${swapResult.toAmount.toFixed(4)} ${toSymbol} privately. Check your holdings! 👻`;
        } else {
          return `Couldn't complete the trade: ${swapResult.error}`;
        }
      }
      
      if (backendRes.response) {
        return backendRes.response;
      }
      
      // If backend returned a strategy result
      if (backendRes.strategyCreated) {
        return `Got it! I've set up your strategy. I'll monitor prices and execute privately when conditions are met. 👻`;
      }
    } catch (backendError) {
      console.log('Backend unavailable, falling back to direct AI call');
    }

    // Fallback: direct OpenRouter call (only if backend is down)
    if (!OPENROUTER_KEY) {
      return "I can't connect to my brain right now. Make sure the backend server is running!";
    }

    const systemPrompt = `You are Ghost, a friendly AI assistant for a private trading bot on Solana. You help users:
- Execute trades privately (via Vanish protocol)
- Set up automated trading strategies  
- Check token prices
- Understand how private trading works

Keep responses SHORT (1-3 sentences max). Be helpful and conversational. Use emojis occasionally.

Available tokens: SOL, USDC, USDT, JUP, BONK, WIF, RAY, ORCA

When users want to trade:
- Confirm what they want to do
- Mention it will execute privately via Vanish

When users set up strategies (like "buy when X drops Y%"):
- Confirm the strategy is set up
- Explain you're monitoring prices
- Say it will auto-execute when conditions are met`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://ghost.trade',
          'X-Title': 'Ghost Trading'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('AI error:', data.error);
        return "Sorry, I'm having trouble right now. Try again in a moment.";
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI call failed:', error);
      return "Something went wrong. Please try again.";
    }
  };

  const handleSubmit = async (command) => {
    const text = command || input;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await callAI(text);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Something went wrong. Please try again.' 
      }]);
    }

    setLoading(false);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSubmit(suggestion);
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('ghost_chat_history');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[#1f1f2e]">
        <div className="flex items-center gap-3">
          <img src="/ghost-logo.png" alt="Ghost" className="w-8 h-8 object-contain" />
          <span className="text-lg font-light tracking-[0.2em] text-white">GHOST</span>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button 
              onClick={clearHistory}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Clear
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-400">{shortWallet}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          /* Suggestions when no messages */
          <div className="space-y-3">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block text-left text-white underline underline-offset-4 decoration-gray-600 hover:decoration-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : (
          /* Chat messages */
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-cyan-500/20 text-white' 
                    : 'bg-[#1a1a24] text-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block px-4 py-3 bg-[#1a1a24] rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#1f1f2e]">
        <div className="flex items-center gap-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
            disabled={loading}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !input.trim()}
            className="text-cyan-400 disabled:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Quick suggestions when chatting */}
        {messages.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {['Buy SOL', 'Sell all', 'Check prices', 'New strategy'].map((quick, i) => (
              <button
                key={i}
                onClick={() => setInput(quick)}
                className="px-3 py-1.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-full text-xs text-gray-400 whitespace-nowrap hover:text-white hover:border-gray-600 transition-colors"
              >
                {quick}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
