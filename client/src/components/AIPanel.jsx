import { useState, useEffect, useContext } from 'react';
import { api, API_BASE } from '../config/api';
import { DemoBalanceContext } from '../App';
import { useSettings } from '../hooks/useSettings';

const SUGGESTIONS = [
  "Buy 0.5 SOL worth of JUP",
  "Sell all my BONK for SOL",
  "Buy SOL when it drops 5%",
  "What's the price of SOL?",
  "Fund my wallet with $50",
  "Show me trending tokens",
  "Cash out 1 SOL to my bank",
  "Set alert when WIF pumps 10%",
];

// OpenRouter key - only used as fallback if backend is down
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

// Helper component to render messages with clickable links
function MessageContent({ content }) {
  // Parse markdown-style links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    // Add the link as a button
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg transition-colors"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // If no links found, just return the text
  if (parts.length === 0) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, i) => (
        typeof part === 'string' ? <span key={i}>{part}</span> : part
      ))}
    </div>
  );
}

export default function AIPanel({ wallet, demoMode }) {
  const shortWallet = wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : '';
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingTrade, setPendingTrade] = useState(null);
  const demoBalance = useContext(DemoBalanceContext);
  const { settings, checkTradeLimit, getTradeParams } = useSettings();

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
      localStorage.setItem('ghost_chat_history', JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  // Check if AI is enabled
  const isAIEnabled = settings?.aiEnabled !== false;

  const executeTrade = async (fromSymbol, toSymbol, amount) => {
    // Check trade limit
    const limitCheck = checkTradeLimit(amount);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.reason };
    }

    if (demoMode && demoBalance) {
      const swapResult = demoBalance.executeSwap(fromSymbol, toSymbol, amount);
      return swapResult;
    }

    // Real trade - need wallet signature, return pending
    return { 
      success: false, 
      pending: true,
      error: 'Real trades require wallet confirmation. Use the Trade tab to execute with Phantom signing.',
      fromSymbol,
      toSymbol,
      amount
    };
  };

  const callAI = async (userMessage) => {
    // First try the backend
    try {
      const backendRes = await api.command(userMessage, wallet);
      
      // Handle immediate trade commands
      if (backendRes.type === 'trade' && backendRes.action) {
        const fromSymbol = backendRes.sourceToken || 'SOL';
        const toSymbol = backendRes.targetToken || 'USDC';
        const amount = parseFloat(backendRes.amount) || 1;
        
        // Check max trade size
        const limitCheck = checkTradeLimit(amount);
        if (!limitCheck.allowed) {
          return `Can't execute that trade: ${limitCheck.reason}. You can increase this in Settings > AI.`;
        }

        // Check if confirmation required
        if (settings?.requireConfirmation) {
          setPendingTrade({ fromSymbol, toSymbol, amount, response: backendRes });
          return `Ready to swap ${amount} ${fromSymbol} for ${toSymbol} privately. Confirm to execute or cancel.`;
        }

        // Execute immediately
        const swapResult = await executeTrade(fromSymbol, toSymbol, amount);
        if (swapResult.success) {
          return `Done! Swapped ${swapResult.fromAmount?.toFixed(4) || amount} ${fromSymbol} for ${swapResult.toAmount?.toFixed(4) || 'some'} ${toSymbol} privately. Check your holdings! 👻`;
        } else if (swapResult.pending) {
          return `Ready to swap ${amount} ${fromSymbol} for ${toSymbol}. 👉 Go to the **Trade** tab and tap ${toSymbol} to execute with your wallet.`;
        } else {
          return `Couldn't complete the trade: ${swapResult.error}`;
        }
      }
      
      // Handle funding commands (MoonPay) - check BEFORE generic response
      if (backendRes.type === 'funding') {
        if (backendRes.fundingUrl) {
          // Try to open MoonPay in new tab (may be blocked on mobile)
          const opened = window.open(backendRes.fundingUrl, '_blank');
          const testModeNote = "\n\n⚠️ Demo mode - MoonPay API keys required for live transactions.";
          if (opened) {
            return (backendRes.response || "Opening MoonPay...") + " I've opened MoonPay in a new tab. 💰" + testModeNote;
          } else {
            // Popup blocked - return URL in message
            return (backendRes.response || "Ready!") + `\n\n👉 [Open MoonPay](${backendRes.fundingUrl})` + testModeNote;
          }
        } else {
          return backendRes.response || "Couldn't set up the funding request. Try again?";
        }
      }

      if (backendRes.response) {
        return backendRes.response;
      }
      
      if (backendRes.strategyCreated) {
        return `Got it! I've set up your strategy. I'll monitor prices and execute privately when conditions are met. 👻`;
      }
    } catch (backendError) {
      console.log('Backend unavailable, falling back to direct AI call');
    }

    // Fallback: direct OpenRouter call
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

    // Check if AI is enabled
    if (!isAIEnabled) {
      setMessages(prev => [...prev, 
        { role: 'user', content: text },
        { role: 'assistant', content: 'AI trading is currently disabled. Enable it in Settings > AI to use commands.' }
      ]);
      setInput('');
      return;
    }

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

  const confirmPendingTrade = async () => {
    if (!pendingTrade) return;

    setLoading(true);
    const { fromSymbol, toSymbol, amount } = pendingTrade;
    
    const swapResult = await executeTrade(fromSymbol, toSymbol, amount);
    
    if (swapResult.success) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Executed! Swapped ${swapResult.fromAmount?.toFixed(4) || amount} ${fromSymbol} for ${swapResult.toAmount?.toFixed(4) || 'some'} ${toSymbol} privately. 👻` 
      }]);
    } else if (swapResult.pending) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Ready to swap ${amount} ${fromSymbol} for ${toSymbol}. Go to the Trade tab and tap ${toSymbol} to execute with your wallet.` 
      }]);
    } else {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Trade failed: ${swapResult.error}` 
      }]);
    }

    setPendingTrade(null);
    setLoading(false);
  };

  const cancelPendingTrade = () => {
    setPendingTrade(null);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: 'Trade cancelled.' 
    }]);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSubmit(suggestion);
  };

  const clearHistory = () => {
    setMessages([]);
    setPendingTrade(null);
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
          {!isAIEnabled && (
            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">AI Off</span>
          )}
          {messages.length > 0 && (
            <button 
              onClick={clearHistory}
              className="text-xs px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
            >
              Clear Chat
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAIEnabled ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-xs text-gray-400">{shortWallet}</span>
          </div>
        </div>
      </div>

      {/* AI Disabled Banner */}
      {!isAIEnabled && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-center">
          <span className="text-xs text-yellow-400">AI trading is disabled. Enable in Settings to use commands.</span>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={!isAIEnabled}
                className={`block text-left underline underline-offset-4 decoration-gray-600 transition-colors ${
                  isAIEnabled 
                    ? 'text-white hover:decoration-white' 
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-cyan-500/20 text-white' 
                    : 'bg-[#1a1a24] text-gray-200'
                }`}>
                  <MessageContent content={msg.content} />
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

      {/* Pending Trade Confirmation */}
      {pendingTrade && (
        <div className="px-4 py-3 bg-[#1a1a24] border-t border-[#2a2a3a]">
          <div className="flex gap-3">
            <button
              onClick={confirmPendingTrade}
              disabled={loading}
              className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Confirm Trade
            </button>
            <button
              onClick={cancelPendingTrade}
              disabled={loading}
              className="flex-1 py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-[#1f1f2e]">
        <div className="flex items-center gap-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
            placeholder={isAIEnabled ? "Type a command..." : "AI disabled - enable in Settings"}
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
            disabled={loading || !isAIEnabled}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !input.trim() || !isAIEnabled}
            className="text-cyan-400 disabled:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Max trade size indicator */}
        {isAIEnabled && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Max trade: {settings?.maxTradeSize || '1'} SOL | 
            {settings?.requireConfirmation ? ' Confirmation required' : ' Auto-execute'}
          </div>
        )}
        
        {messages.length > 0 && isAIEnabled && (
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
