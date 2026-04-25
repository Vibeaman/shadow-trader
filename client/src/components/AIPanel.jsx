import { useState, useEffect } from 'react';

const EXAMPLE_COMMANDS = [
  "Buy 0.5 SOL worth of JUP",
  "Sell all my BONK for SOL",
  "Buy SOL when it drops 5%",
  "Sell JUP if it goes above $1",
];

export default function AIPanel({ wallet, demoMode }) {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [activeTab, setActiveTab] = useState('command'); // command | strategies

  // Fetch user strategies
  useEffect(() => {
    if (!demoMode && wallet) {
      fetchStrategies();
    }
  }, [wallet, demoMode]);

  const fetchStrategies = async () => {
    try {
      const res = await fetch(`/api/strategies?userAddress=${wallet}`);
      const data = await res.json();
      if (data.success) {
        setStrategies(data.strategies);
      }
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    }
  };

  const handleSubmit = async () => {
    if (!command.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      if (demoMode) {
        // Demo mode - simulate parsing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const lowerCmd = command.toLowerCase();
        const isStrategy = lowerCmd.includes('when') || lowerCmd.includes('if') || 
                          lowerCmd.includes('drops') || lowerCmd.includes('rises');
        
        let parsed;
        if (isStrategy) {
          parsed = {
            isStrategy: true,
            action: lowerCmd.includes('sell') ? 'sell' : 'buy',
            targetToken: lowerCmd.includes('jup') ? 'JUP' : 'SOL',
            sourceToken: lowerCmd.includes('sell') ? (lowerCmd.includes('jup') ? 'JUP' : 'SOL') : 'USDC',
            condition: lowerCmd.includes('drops') || lowerCmd.includes('dips') ? 'price_drop_percent' : 
                      lowerCmd.includes('above') ? 'price_above' : 'price_rise_percent',
            conditionValue: 5,
            confidence: 0.88,
            explanation: `Strategy: ${command}`,
            name: `Demo Strategy`,
            strategyCreated: true,
            strategyId: 'demo_' + Date.now(),
          };
          
          // Add to demo strategies
          setStrategies(prev => [...prev, {
            id: parsed.strategyId,
            name: parsed.name,
            enabled: true,
            conditions: [{ type: parsed.condition, token: parsed.targetToken, value: parsed.conditionValue }],
            actions: [{ type: 'swap', fromToken: parsed.sourceToken, toToken: parsed.targetToken }],
            triggerCount: 0,
            createdAt: Date.now(),
          }]);
        } else {
          parsed = {
            isStrategy: false,
            action: 'swap',
            sourceToken: lowerCmd.includes('usdc') ? 'USDC' : 'SOL',
            targetToken: lowerCmd.includes('jup') ? 'JUP' : lowerCmd.includes('bonk') ? 'BONK' : 'SOL',
            confidence: 0.9,
            explanation: `Immediate: ${command}`,
          };
        }

        setResult({
          success: true,
          parsed,
          message: parsed.isStrategy 
            ? `Strategy created! Monitoring ${parsed.targetToken} for ${parsed.condition.replace(/_/g, ' ')}`
            : `Ready to execute: ${parsed.action} ${parsed.sourceToken} → ${parsed.targetToken}`,
        });
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
          message: data.isStrategy && data.strategyCreated
            ? `Strategy "${data.name}" created and monitoring!`
            : data.confidence > 0.7
              ? `Ready to execute: ${data.action} ${data.sourceToken} → ${data.targetToken}`
              : data.explanation,
        });

        // Refresh strategies if one was created
        if (data.strategyCreated) {
          fetchStrategies();
        }
      }
    } catch (error) {
      setResult({ success: false, message: error.message });
    }

    setLoading(false);
    setCommand('');
  };

  const toggleStrategy = async (strategyId, enabled) => {
    if (demoMode) {
      setStrategies(prev => prev.map(s => 
        s.id === strategyId ? { ...s, enabled } : s
      ));
      return;
    }

    try {
      await fetch(`/api/strategy/${strategyId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      fetchStrategies();
    } catch (error) {
      console.error('Failed to toggle strategy:', error);
    }
  };

  const deleteStrategy = async (strategyId) => {
    if (demoMode) {
      setStrategies(prev => prev.filter(s => s.id !== strategyId));
      return;
    }

    try {
      await fetch(`/api/strategy/${strategyId}`, { method: 'DELETE' });
      fetchStrategies();
    } catch (error) {
      console.error('Failed to delete strategy:', error);
    }
  };

  const formatCondition = (condition) => {
    switch (condition.type) {
      case 'price_drop_percent':
        return `${condition.token} drops ${condition.value}%`;
      case 'price_rise_percent':
        return `${condition.token} rises ${condition.value}%`;
      case 'price_above':
        return `${condition.token} > $${condition.value}`;
      case 'price_below':
        return `${condition.token} < $${condition.value}`;
      default:
        return condition.type;
    }
  };

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">AI Agent</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Monitoring</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('command')}
          className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'command'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-[#1f1f2e] text-gray-400'
          }`}
        >
          Command
        </button>
        <button
          onClick={() => setActiveTab('strategies')}
          className={`flex-1 py-2 rounded-xl font-medium transition-colors relative ${
            activeTab === 'strategies'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-[#1f1f2e] text-gray-400'
          }`}
        >
          Strategies
          {strategies.filter(s => s.enabled).length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center text-white">
              {strategies.filter(s => s.enabled).length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'command' ? (
        <>
          {/* Info Card */}
          <div className="card p-4 mb-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Natural Language Trading</h3>
                <p className="text-sm text-gray-400">
                  Type commands like "buy SOL when it drops 5%" and I'll create automated strategies.
                </p>
              </div>
            </div>
          </div>

          {/* Command Input */}
          <div className="card p-4 mb-4">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='Try: "Buy SOL when it drops 5%"'
              className="w-full h-20 bg-transparent text-lg outline-none resize-none placeholder-gray-600"
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
            className="w-full py-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Send Command'
            )}
          </button>

          {/* Result */}
          {result && (
            <div className={`card p-4 ${
              result.success ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-red-500/30 bg-red-500/5'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  result.success ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {result.parsed?.isStrategy ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={result.success ? 'text-cyan-400' : 'text-red-400'}>{result.message}</p>
                  {result.parsed?.isStrategy && result.parsed?.strategyCreated && (
                    <p className="text-xs text-gray-500 mt-1">
                      Strategy is now monitoring prices and will execute automatically
                    </p>
                  )}
                  {result.parsed && !result.parsed.isStrategy && result.parsed.confidence > 0.7 && (
                    <button className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors">
                      Execute Trade Privately
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Strategies List */}
          {strategies.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1f1f2e] flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-2">No active strategies</p>
              <p className="text-sm text-gray-500">Create one using natural language commands</p>
            </div>
          ) : (
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{strategy.name}</h3>
                        {strategy.encrypted && (
                          <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {strategy.conditions.map(c => formatCondition(c)).join(' AND ')}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleStrategy(strategy.id, !strategy.enabled)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        strategy.enabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        strategy.enabled ? 'left-5' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Triggered {strategy.triggerCount || 0} times</span>
                    <button
                      onClick={() => deleteStrategy(strategy.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Privacy Note */}
          <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>All strategy trades execute privately via Vanish</span>
          </div>
        </>
      )}
    </div>
  );
}
