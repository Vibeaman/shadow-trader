import { useState } from 'react';

const EXAMPLE_COMMANDS = [
  "Buy 0.5 SOL worth of JUP",
  "Sell all my BONK for SOL",
  "Swap 100 USDC to SOL",
  "Buy SOL when price drops 5%",
];

export default function AIPanel({ wallet, demoMode }) {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleSubmit = async () => {
    if (!command.trim()) return;

    setLoading(true);
    setResult(null);

    const newEntry = { command, timestamp: new Date().toISOString(), status: 'pending' };
    setHistory(prev => [newEntry, ...prev]);

    try {
      if (demoMode) {
        // Demo mode - simulate parsing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simple mock parsing
        const lowerCmd = command.toLowerCase();
        let parsed = {
          action: 'unknown',
          confidence: 0.5,
          explanation: "Couldn't parse this command",
        };

        if (lowerCmd.includes('buy') || lowerCmd.includes('swap')) {
          parsed = {
            action: 'swap',
            sourceToken: lowerCmd.includes('usdc') ? 'USDC' : 'SOL',
            targetToken: lowerCmd.includes('jup') ? 'JUP' : lowerCmd.includes('bonk') ? 'BONK' : 'SOL',
            confidence: 0.9,
            explanation: `Understood: ${command}`,
          };
        } else if (lowerCmd.includes('sell')) {
          parsed = {
            action: 'swap',
            sourceToken: lowerCmd.includes('bonk') ? 'BONK' : 'JUP',
            targetToken: 'SOL',
            confidence: 0.85,
            explanation: `Understood: ${command}`,
          };
        }

        setResult({
          success: true,
          parsed,
          message: parsed.confidence > 0.7 
            ? `Ready to execute: ${parsed.action} ${parsed.sourceToken} → ${parsed.targetToken}`
            : 'Could not fully understand command',
        });

        setHistory(prev => prev.map((h, i) => 
          i === 0 ? { ...h, status: parsed.confidence > 0.7 ? 'ready' : 'unclear', parsed } : h
        ));
      } else {
        // Real API call
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, userAddress: wallet }),
        });
        const data = await res.json();
        
        setResult({
          success: true,
          parsed: data,
          message: data.confidence > 0.7
            ? `Ready to execute: ${data.action} ${data.sourceToken} → ${data.targetToken}`
            : data.explanation,
        });

        setHistory(prev => prev.map((h, i) => 
          i === 0 ? { ...h, status: data.confidence > 0.7 ? 'ready' : 'unclear', parsed: data } : h
        ));
      }
    } catch (error) {
      setResult({ success: false, message: error.message });
      setHistory(prev => prev.map((h, i) => 
        i === 0 ? { ...h, status: 'error' } : h
      ));
    }

    setLoading(false);
  };

  const executeFromHistory = (entry) => {
    if (entry.status === 'ready' && entry.parsed) {
      // Would execute the trade here
      alert(`Would execute: ${entry.parsed.action} ${entry.parsed.sourceToken} → ${entry.parsed.targetToken}`);
    }
  };

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">AI Commands</h1>
        <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
          Beta
        </div>
      </div>

      {/* Info Card */}
      <div className="card p-4 mb-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium mb-1">Trade with natural language</h3>
            <p className="text-sm text-gray-400">
              Type what you want to do and AI will parse it into a private trade via Vanish.
            </p>
          </div>
        </div>
      </div>

      {/* Command Input */}
      <div className="card p-4 mb-4">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g. Buy 0.5 SOL worth of JUP"
          className="w-full h-24 bg-transparent text-lg outline-none resize-none placeholder-gray-600"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      {/* Example Commands */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        {EXAMPLE_COMMANDS.map((ex, i) => (
          <button
            key={i}
            onClick={() => setCommand(ex)}
            className="pill pill-inactive whitespace-nowrap text-xs"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !command.trim()}
        className="w-full py-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Parsing...
          </span>
        ) : (
          'Parse Command'
        )}
      </button>

      {/* Result */}
      {result && (
        <div className={`card p-4 mb-6 ${
          result.success ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-red-500/30 bg-red-500/5'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              result.success ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {result.success ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className={result.success ? 'text-cyan-400' : 'text-red-400'}>{result.message}</p>
              {result.parsed && result.parsed.confidence > 0.7 && (
                <button className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors">
                  Execute Trade Privately
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">RECENT COMMANDS</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((entry, i) => (
              <div 
                key={i}
                onClick={() => executeFromHistory(entry)}
                className={`card p-3 ${entry.status === 'ready' ? 'card-hover' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    entry.status === 'ready' ? 'bg-green-400' :
                    entry.status === 'pending' ? 'bg-yellow-400 animate-pulse' :
                    entry.status === 'error' ? 'bg-red-400' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-sm truncate flex-1">{entry.command}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
