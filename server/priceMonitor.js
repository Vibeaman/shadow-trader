/**
 * Price Monitor Service
 * Fetches real-time prices from CoinGecko and tracks price changes
 */

// Token symbol to CoinGecko ID mapping
const COINGECKO_IDS = {
  SOL: 'solana',
  JUP: 'jupiter-exchange-solana',
  BONK: 'bonk',
  WIF: 'dogwifcoin',
  RAY: 'raydium',
  ORCA: 'orca',
  PYTH: 'pyth-network',
  RENDER: 'render-token',
  USDC: 'usd-coin',
  USDT: 'tether',
};

// Token addresses (for reference)
export const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
};

export class PriceMonitor {
  constructor() {
    this.prices = new Map(); // symbol -> { price, change24h, timestamp, history }
    this.subscribers = new Map(); // symbol -> Set of callbacks
    this.isRunning = false;
    this.pollInterval = 30000; // 30 seconds (CoinGecko rate limits)
    this.historyLength = 60; // Keep 60 data points
  }

  /**
   * Start monitoring prices
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[PriceMonitor] Starting price monitoring...');
    this.poll();
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isRunning = false;
    console.log('[PriceMonitor] Stopped price monitoring');
  }

  /**
   * Poll prices
   */
  async poll() {
    if (!this.isRunning) return;

    try {
      await this.fetchPrices();
    } catch (error) {
      console.error('[PriceMonitor] Error fetching prices:', error.message);
    }

    // Schedule next poll
    setTimeout(() => this.poll(), this.pollInterval);
  }

  /**
   * Fetch prices from CoinGecko
   */
  async fetchPrices() {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();
    const now = Date.now();

    // Map CoinGecko data back to our symbols
    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      const priceData = data[geckoId];
      if (!priceData) continue;

      const price = priceData.usd;
      const change24h = priceData.usd_24h_change || 0;

      // Get or create price entry
      let entry = this.prices.get(symbol);
      if (!entry) {
        entry = { price: 0, change24h: 0, timestamp: 0, history: [] };
        this.prices.set(symbol, entry);
      }

      // Calculate short-term change from history
      const previousPrice = entry.price;
      const changePercent = previousPrice > 0 
        ? ((price - previousPrice) / previousPrice) * 100 
        : 0;

      // Update entry
      entry.price = price;
      entry.change24h = change24h;
      entry.timestamp = now;
      entry.history.push({ price, timestamp: now });

      // Trim history
      if (entry.history.length > this.historyLength) {
        entry.history.shift();
      }

      // Notify subscribers if price changed significantly (> 0.5%)
      if (Math.abs(changePercent) > 0.5) {
        this.notifySubscribers(symbol, {
          symbol,
          price,
          previousPrice,
          changePercent,
          change24h,
          timestamp: now,
        });
      }
    }

    console.log(`[PriceMonitor] Updated ${this.prices.size} prices`);
  }

  /**
   * Get current price for a token
   */
  getPrice(symbol) {
    const entry = this.prices.get(symbol.toUpperCase());
    return entry ? entry.price : null;
  }

  /**
   * Get all current prices
   */
  getAllPrices() {
    const result = {};
    for (const [symbol, entry] of this.prices) {
      result[symbol] = {
        price: entry.price,
        timestamp: entry.timestamp,
        change24h: entry.change24h,
        change5m: this.calculateChange(symbol, 300000), // 5 min
      };
    }
    return result;
  }

  /**
   * Calculate price change over a time period
   */
  calculateChange(symbol, periodMs) {
    const entry = this.prices.get(symbol.toUpperCase());
    if (!entry || entry.history.length < 2) return entry?.change24h || 0;

    const now = Date.now();
    const cutoff = now - periodMs;

    // Find the oldest price within the period
    const oldEntry = entry.history.find(h => h.timestamp >= cutoff);
    if (!oldEntry) return entry.change24h || 0;

    return ((entry.price - oldEntry.price) / oldEntry.price) * 100;
  }

  /**
   * Subscribe to price updates for a token
   */
  subscribe(symbol, callback) {
    const key = symbol.toUpperCase();
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * Notify all subscribers for a token
   */
  notifySubscribers(symbol, data) {
    const callbacks = this.subscribers.get(symbol.toUpperCase());
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(data);
        } catch (error) {
          console.error('[PriceMonitor] Subscriber error:', error);
        }
      }
    }
  }

  /**
   * Check if a condition is met
   * Used by the strategy engine
   */
  checkCondition(condition) {
    const { type, token, value } = condition;
    const currentPrice = this.getPrice(token);

    if (!currentPrice) return false;

    switch (type) {
      case 'price_above':
        return currentPrice > value;

      case 'price_below':
        return currentPrice < value;

      case 'price_drop_percent': {
        const change = this.calculateChange(token, condition.periodMs || 300000);
        return change <= -Math.abs(value);
      }

      case 'price_rise_percent': {
        const change = this.calculateChange(token, condition.periodMs || 300000);
        return change >= Math.abs(value);
      }

      default:
        return false;
    }
  }
}

// Singleton instance
export const priceMonitor = new PriceMonitor();
