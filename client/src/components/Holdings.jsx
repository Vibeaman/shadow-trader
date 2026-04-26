import { useState, useEffect } from 'react';
import { api } from '../config/api';

// Mock holdings data
const MOCK_HOLDINGS = [
  { symbol: 'SOL', name: 'Solana', balance: 2.45, value: 363.37, change: 5.2, image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
  { symbol: 'USDC', name: 'USD Coin', balance: 150.00, value: 150.00, change: 0, image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
];

export default function Holdings({ wallet, demoMode }) {
  const [holdings, setHoldings] = useState(demoMode ? MOCK_HOLDINGS : []);
  const [loading, setLoading] = useState(false);

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  const fetchHoldings = async () => {
    if (demoMode) {
      setHoldings(MOCK_HOLDINGS);
      return;
    }

    setLoading(true);
    try {
      // Real API call would go here
      const data = await api.getBalance(wallet, '', '');
      // Transform data...
    } catch (error) {
      console.error('Failed to fetch holdings:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHoldings();
  }, [wallet, demoMode]);

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Holdings</h1>
        <button
          onClick={fetchHoldings}
          className="p-2 rounded-lg bg-[#1f1f2e] hover:bg-[#2a2a3a] transition-colors"
        >
          <svg className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Total Value Card */}
      <div className="card p-6 mb-6 text-center">
        <p className="text-gray-400 text-sm mb-1">Vanish Balance</p>
        <h2 className="text-4xl font-bold mb-2">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-cyan-400">Private balance - not visible onchain</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button className="py-3 rounded-xl bg-green-500/20 text-green-400 font-medium hover:bg-green-500/30 transition-colors">
          Deposit
        </button>
        <button className="py-3 rounded-xl bg-purple-500/20 text-purple-400 font-medium hover:bg-purple-500/30 transition-colors">
          Withdraw
        </button>
      </div>

      {/* Holdings List */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">ASSETS</h3>
        <div className="space-y-2">
          {holdings.map((holding) => (
            <div key={holding.symbol} className="card p-4 flex items-center gap-3">
              <img
                src={holding.image}
                alt={holding.symbol}
                className="w-10 h-10 rounded-full bg-[#1f1f2e]"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=1f1f2e&color=fff&size=40`;
                }}
              />
              <div className="flex-1">
                <div className="font-medium">{holding.symbol}</div>
                <div className="text-sm text-gray-400">{holding.balance.toLocaleString()} {holding.symbol}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                {holding.change !== 0 && (
                  <div className={`text-sm ${holding.change >= 0 ? 'price-up' : 'price-down'}`}>
                    {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {holdings.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1f1f2e] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-400 mb-4">No holdings yet</p>
          <p className="text-sm text-gray-500">Deposit SOL or USDC to start trading privately</p>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">RECENT ACTIVITY</h3>
        <div className="card p-4 text-center text-gray-500 text-sm">
          {demoMode ? 'Demo mode - no real transactions' : 'No recent activity'}
        </div>
      </div>
    </div>
  );
}
