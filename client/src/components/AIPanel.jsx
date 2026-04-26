import { useState } from 'react';

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

export default function AIPanel({ wallet, demoMode }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (command) => {
    const text = command || input;
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      if (demoMode) {
        // Demo response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let response = "I understand you want to ";
        if (text.toLowerCase().includes('buy')) {
          response = "Got it! I'll set up that buy order for you. In live mode, this would execute privately via Vanish.";
        } else if (text.toLowerCase().includes('sell')) {
          response = "Understood! I'll prepare that sell order. Trades execute privately with no trace onchain.";
        } else if (text.toLowerCase().includes('when') || text.toLowerCase().includes('if')) {
          response = "Strategy created! I'm now monitoring prices and will execute automatically when conditions are met.";
        } else if (text.toLowerCase().includes('price')) {
          response = "SOL: $148.52 (+5.2%)\nJUP: $0.89 (-2.1%)\nBONK: $0.0000234 (+12.4%)";
        } else {
          response = "I can help you trade privately. Try commands like 'Buy SOL when it drops 5%' or 'Sell all my BONK'.";
        }

        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        // Real API call
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: text, userAddress: wallet }),
        });
        const data = await res.json();
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.explanation || 'Command processed.',
          data 
        }]);
      }
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[#1f1f2e]">
        <div className="flex items-center gap-3">
          <img src="/ghost-logo.png" alt="Ghost" className="w-8 h-8 object-contain" />
          <span className="text-lg font-light tracking-[0.2em] text-white">GHOST</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">AI Active</span>
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
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
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
