import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ghost_demo_balances';

// Default demo balances
const DEFAULT_BALANCES = {
  SOL: 5.0,
  USDC: 500.0,
  JUP: 0,
  BONK: 0,
  WIF: 0,
  RAY: 0,
  ORCA: 0,
};

// Approximate prices for demo calculations
const DEMO_PRICES = {
  SOL: 148,
  USDC: 1,
  USDT: 1,
  JUP: 0.89,
  BONK: 0.0000234,
  WIF: 2.34,
  RAY: 5.67,
  ORCA: 4.12,
};

export function useDemoBalance() {
  const [balances, setBalances] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_BALANCES;
    } catch {
      return DEFAULT_BALANCES;
    }
  });

  // Save to localStorage whenever balances change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(balances));
  }, [balances]);

  // Get balance for a token
  const getBalance = (symbol) => {
    return balances[symbol] || 0;
  };

  // Get price for a token
  const getPrice = (symbol) => {
    return DEMO_PRICES[symbol] || 0;
  };

  // Execute a demo swap
  const executeSwap = (fromSymbol, toSymbol, fromAmount) => {
    const fromPrice = getPrice(fromSymbol);
    const toPrice = getPrice(toSymbol);
    
    if (fromPrice === 0 || toPrice === 0) {
      return { success: false, error: 'Unknown token' };
    }

    const currentFromBalance = getBalance(fromSymbol);
    if (currentFromBalance < fromAmount) {
      return { success: false, error: `Insufficient ${fromSymbol} balance` };
    }

    // Calculate output amount
    const valueInUSD = fromAmount * fromPrice;
    const toAmount = valueInUSD / toPrice;

    // Update balances
    setBalances(prev => ({
      ...prev,
      [fromSymbol]: (prev[fromSymbol] || 0) - fromAmount,
      [toSymbol]: (prev[toSymbol] || 0) + toAmount,
    }));

    return {
      success: true,
      fromAmount,
      toAmount,
      fromSymbol,
      toSymbol,
      txId: 'demo_' + Math.random().toString(36).slice(2, 10),
    };
  };

  // Get all holdings with values
  const getHoldings = () => {
    return Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .map(([symbol, balance]) => ({
        symbol,
        name: getTokenName(symbol),
        balance,
        value: balance * getPrice(symbol),
        price: getPrice(symbol),
        change: (Math.random() * 10 - 5).toFixed(1), // Random change for demo
        image: getTokenImage(symbol),
      }));
  };

  // Get total portfolio value
  const getTotalValue = () => {
    return Object.entries(balances).reduce((total, [symbol, balance]) => {
      return total + (balance * getPrice(symbol));
    }, 0);
  };

  // Reset to default balances
  const resetBalances = () => {
    setBalances(DEFAULT_BALANCES);
  };

  // Add funds (for demo deposit)
  const deposit = (symbol, amount) => {
    setBalances(prev => ({
      ...prev,
      [symbol]: (prev[symbol] || 0) + amount,
    }));
  };

  return {
    balances,
    getBalance,
    getPrice,
    executeSwap,
    getHoldings,
    getTotalValue,
    resetBalances,
    deposit,
    DEMO_PRICES,
  };
}

// Helper functions
function getTokenName(symbol) {
  const names = {
    SOL: 'Solana',
    USDC: 'USD Coin',
    USDT: 'Tether',
    JUP: 'Jupiter',
    BONK: 'Bonk',
    WIF: 'dogwifhat',
    RAY: 'Raydium',
    ORCA: 'Orca',
  };
  return names[symbol] || symbol;
}

function getTokenImage(symbol) {
  const images = {
    SOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    USDC: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    USDT: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    JUP: 'https://static.jup.ag/jup/icon.png',
    BONK: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    WIF: 'https://bafkreibk3covs5ltyqxa272uodhber6lsmv6klxq3e6f6v7wzq3wmxgwii.ipfs.nftstorage.link/',
    RAY: 'https://raw.githubusercontent.com/raydium-io/media-assets/master/logo.png',
    ORCA: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
  };
  return images[symbol] || `https://ui-avatars.com/api/?name=${symbol}&background=1f1f2e&color=fff&size=40`;
}

export { DEMO_PRICES, getTokenName, getTokenImage };
