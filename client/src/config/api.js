// API Configuration
// In development, calls go to localhost:3001
// In production, calls go to the Railway backend

const isDev = import.meta.env.DEV;

// Railway backend URL - hardcoded for reliability
const RAILWAY_URL = 'https://shadow-trader-production-222e.up.railway.app';

export const API_BASE = isDev 
  ? 'http://localhost:3001'
  : RAILWAY_URL;

console.log('[API] Base URL:', API_BASE);

// Helper to safely fetch and parse JSON
const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(`[API] HTTP error ${response.status} for ${url}`);
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API] Fetch failed for ${url}:`, error.message);
    throw error;
  }
};

export const api = {
  // Health
  health: () => safeFetch(`${API_BASE}/api/health`),
  
  // Prices
  getPrices: () => safeFetch(`${API_BASE}/api/prices`),
  getPrice: (symbol) => safeFetch(`${API_BASE}/api/price/${symbol}`),
  
  // Trading
  getBalance: (userAddress, signature, timestamp) => 
    safeFetch(`${API_BASE}/api/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAddress, signature, timestamp }),
    }),
  
  getDepositAddress: (tokenAddress) =>
    safeFetch(`${API_BASE}/api/deposit-address?tokenAddress=${tokenAddress}`),
  
  trade: (params) =>
    safeFetch(`${API_BASE}/api/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
  
  withdraw: (params) =>
    safeFetch(`${API_BASE}/api/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
  
  // AI Commands
  command: (command, userAddress) =>
    safeFetch(`${API_BASE}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, userAddress }),
    }),
  
  // Strategies
  getStrategies: (userAddress) =>
    safeFetch(`${API_BASE}/api/strategies?userAddress=${userAddress}`),
  
  createStrategy: (params) =>
    safeFetch(`${API_BASE}/api/strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
  
  toggleStrategy: (id, enabled) =>
    safeFetch(`${API_BASE}/api/strategy/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }),
  
  deleteStrategy: (id) =>
    safeFetch(`${API_BASE}/api/strategy/${id}`, { method: 'DELETE' }),
  
  // Vault
  vaultStatus: () => safeFetch(`${API_BASE}/api/vault/status`),
};

export default api;
