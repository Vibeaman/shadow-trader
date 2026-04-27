import { useState, useEffect } from 'react';
import SwapModal from './SwapModal';
import { api } from '../config/api';

// Build: 2026-04-27T12:50

// Token metadata - prices will be fetched from API
const TOKEN_METADATA = [
  { symbol: 'SOL', name: 'Solana', mcap: '68.2B', age: '5y', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', address: 'So11111111111111111111111111111111111111112' },
  { symbol: 'JUP', name: 'Jupiter', mcap: '1.2B', age: '1y', image: 'https://static.jup.ag/jup/icon.png', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
  { symbol: 'BONK', name: 'Bonk', mcap: '1.8B', age: '2y', image: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { symbol: 'WIF', name: 'dogwifhat', mcap: '2.3B', age: '1y', image: 'https://bafkreibk3covs5ltyqxa272uodhber6lsmv6klxq3e6f6v7wzq3wmxgwii.ipfs.nftstorage.link/', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
  { symbol: 'PYTH', name: 'Pyth Network', mcap: '1.5B', age: '1y', image: 'https://pyth.network/token.png', address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3' },
  { symbol: 'RAY', name: 'Raydium', mcap: '780M', age: '3y', image: 'https://raw.githubusercontent.com/raydium-io/media-assets/master/logo.png', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
  { symbol: 'ORCA', name: 'Orca', mcap: '420M', age: '3y', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png', address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE' },
  { symbol: 'RENDER', name: 'Render', mcap: '3.1B', age: '2y', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5690.png', address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof' },
];

const FILTERS = ['All', 'Hot', 'New', 'Gainers', 'Losers'];

export default function Trade({ wallet, demoMode }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);

  // Fetch live prices from backend
  useEffect(() => {
    const fetchPrices = async () => {
      console.log('[Trade] Fetching prices...');
      try {
        const data = await api.getPrices();
        console.log('[Trade] Price data received:', data);
        if (data.success && data.prices) {
          // Merge metadata with live prices
          const updatedTokens = TOKEN_METADATA.map(token => {
            const livePrice = data.prices[token.symbol];
            console.log(`[Trade] ${token.symbol}: $${livePrice?.price}`);
            return {
              ...token,
              price: livePrice?.price || 0,
              change: livePrice?.change24h || 0,
            };
          });
          setTokens(updatedTokens);
          console.log('[Trade] Tokens updated with live prices');
        } else {
          console.warn('[Trade] No prices in response, using fallback');
          // Fallback - show tokens with 0 price
          setTokens(TOKEN_METADATA.map(t => ({ ...t, price: 0, change: 0 })));
        }
      } catch (error) {
        console.error('[Trade] Price fetch error:', error);
        setApiError(error.message);
        // Fallback
        setTokens(TOKEN_METADATA.map(t => ({ ...t, price: 0, change: 0 })));
      }
      setLoading(false);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  // Filter tokens
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'Hot':
        return Math.abs(token.change) > 5;
      case 'Gainers':
        return token.change > 0;
      case 'Losers':
        return token.change < 0;
      case 'New':
        return token.age.includes('y') === false;
      default:
        return true;
    }
  });

  const handleTokenClick = (token) => {
    setSelectedToken(token);
    setShowSwapModal(true);
  };

  const formatPrice = (price) => {
    if (price < 0.0001) return price.toExponential(2);
    if (price < 1) return price.toFixed(6);
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="px-4 pt-4">
      {/* API Error Banner */}
      {apiError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400">
          API Error: {apiError}
        </div>
      )}

      {/* Header - Trojan style */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img 
            src="/ghost-logo.png" 
            alt="Ghost" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-lg font-light tracking-[0.2em] text-white">GHOST</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">
            {wallet.slice(0, 4)}...{wallet.slice(-4)}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#12121a] border border-[#1f1f2e] rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pill whitespace-nowrap ${filter === f ? 'pill-active' : 'pill-inactive'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Privacy Badge */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
        <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-cyan-400">All trades routed privately via Vanish</span>
      </div>

      {/* Token List */}
      <div className="space-y-2">
        {filteredTokens.map((token) => (
          <div
            key={token.symbol}
            onClick={() => handleTokenClick(token)}
            className="card card-hover token-row p-4 flex items-center gap-3"
          >
            {/* Token Image */}
            <img
              src={token.image}
              alt={token.symbol}
              className="w-10 h-10 rounded-full bg-[#1f1f2e]"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=1f1f2e&color=fff&size=40`;
              }}
            />

            {/* Token Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{token.symbol}</span>
                <span className="text-xs text-gray-500">{token.age}</span>
              </div>
              <div className="text-sm text-gray-400 truncate">{token.name}</div>
            </div>

            {/* Price & Change */}
            <div className="text-right">
              <div className="font-medium">${formatPrice(token.price)}</div>
              <div className={`text-sm ${token.change >= 0 ? 'price-up' : 'price-down'}`}>
                {token.change >= 0 ? '+' : ''}{token.change.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTokens.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tokens found
        </div>
      )}

      {/* Swap Modal */}
      {showSwapModal && selectedToken && (
        <SwapModal
          token={selectedToken}
          wallet={wallet}
          demoMode={demoMode}
          onClose={() => setShowSwapModal(false)}
        />
      )}
    </div>
  );
}
