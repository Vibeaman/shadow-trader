import { useState } from 'react';

export default function SwapModal({ token, wallet, demoMode, onClose }) {
  const [amount, setAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState('buy'); // buy or sell
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSwap = async () => {
    if (!amount) return;
    
    setLoading(true);
    setResult(null);

    try {
      if (demoMode) {
        // Simulate swap in demo mode
        await new Promise(resolve => setTimeout(resolve, 2000));
        setResult({
          success: true,
          message: `Demo: Would ${swapDirection} ${amount} SOL worth of ${token.symbol} privately`,
          txId: 'demo_' + Math.random().toString(36).slice(2, 10),
        });
      } else {
        // Real swap via API
        const res = await fetch('/api/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: wallet,
            sourceToken: swapDirection === 'buy' 
              ? 'So11111111111111111111111111111111111111112' 
              : token.address,
            targetToken: swapDirection === 'buy' 
              ? token.address 
              : 'So11111111111111111111111111111111111111112',
            amount: (parseFloat(amount) * 1e9).toString(),
            // Note: In production, signature would come from wallet
          }),
        });
        const data = await res.json();
        setResult({
          success: data.success,
          message: data.success 
            ? `Swapped privately! TX: ${data.txId.slice(0, 8)}...`
            : data.error,
          txId: data.txId,
        });
      }
    } catch (error) {
      setResult({ success: false, message: error.message });
    }

    setLoading(false);
  };

  const estimatedOutput = amount ? (
    swapDirection === 'buy'
      ? (parseFloat(amount) / token.price).toFixed(4)
      : (parseFloat(amount) * token.price).toFixed(2)
  ) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#12121a] border-t border-[#1f1f2e] rounded-t-3xl p-6 animate-slide-up">
        {/* Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-full" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <img
            src={token.image}
            alt={token.symbol}
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=1f1f2e&color=fff&size=48`;
            }}
          />
          <div>
            <h2 className="text-xl font-bold">{token.symbol}</h2>
            <p className="text-gray-400 text-sm">{token.name}</p>
          </div>
          <div className="ml-auto text-right">
            <div className="font-medium">${token.price < 0.01 ? token.price.toExponential(2) : token.price.toFixed(2)}</div>
            <div className={`text-sm ${token.change >= 0 ? 'price-up' : 'price-down'}`}>
              {token.change >= 0 ? '+' : ''}{token.change.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Buy/Sell Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSwapDirection('buy')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              swapDirection === 'buy'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-[#1f1f2e] text-gray-400'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSwapDirection('sell')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              swapDirection === 'sell'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-[#1f1f2e] text-gray-400'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div className="bg-[#0a0a0f] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">
              {swapDirection === 'buy' ? 'You pay' : 'You sell'}
            </span>
            <span className="text-gray-500 text-sm">Balance: --</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-medium outline-none"
            />
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1f1f2e] rounded-lg">
              <img
                src={swapDirection === 'buy' 
                  ? 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                  : token.image
                }
                alt=""
                className="w-5 h-5 rounded-full"
              />
              <span className="font-medium">{swapDirection === 'buy' ? 'SOL' : token.symbol}</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="w-10 h-10 bg-[#1f1f2e] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Output */}
        <div className="bg-[#0a0a0f] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-2xl font-medium text-gray-400">
              ~{estimatedOutput}
            </span>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1f1f2e] rounded-lg">
              <img
                src={swapDirection === 'sell' 
                  ? 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                  : token.image
                }
                alt=""
                className="w-5 h-5 rounded-full"
              />
              <span className="font-medium">{swapDirection === 'sell' ? 'SOL' : token.symbol}</span>
            </div>
          </div>
        </div>

        {/* Privacy Indicator */}
        <div className="flex items-center gap-2 mb-4 text-xs text-cyan-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>This trade will be routed privately via Vanish</span>
        </div>

        {/* Result */}
        {result && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${
            result.success 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {result.message}
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={loading || !amount}
          className={`w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            swapDirection === 'buy'
              ? 'bg-green-500 hover:bg-green-400 text-white'
              : 'bg-red-500 hover:bg-red-400 text-white'
          }`}
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
            `${swapDirection === 'buy' ? 'Buy' : 'Sell'} ${token.symbol} Privately`
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 mt-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
