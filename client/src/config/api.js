// API Configuration
// In development, calls go to localhost:3001
// In production, calls go to the Railway backend

const isDev = import.meta.env.DEV;

// Set this to your Railway backend URL after deployment
export const API_BASE = isDev 
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_API_URL || 'https://shadow-trader-production.up.railway.app');

export const api = {
  // Health
  health: () => fetch(`${API_BASE}/api/health`).then(r => r.json()),
  
  // Prices
  getPrices: () => fetch(`${API_BASE}/api/prices`).then(r => r.json()),
  getPrice: (symbol) => fetch(`${API_BASE}/api/price/${symbol}`).then(r => r.json()),
  
  // Trading
  getBalance: (userAddress, signature, timestamp) => 
    fetch(`${API_BASE}/api/balance?userAddress=${userAddress}&signature=${signature}&timestamp=${timestamp}`)
      .then(r => r.json()),
  
  getDepositAddress: (tokenAddress) =>
    fetch(`${API_BASE}/api/deposit-address?tokenAddress=${tokenAddress}`)
      .then(r => r.json()),
  
  trade: (params) =>
    fetch(`${API_BASE}/api/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).then(r => r.json()),
  
  // AI Commands
  command: (command, userAddress) =>
    fetch(`${API_BASE}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, userAddress }),
    }).then(r => r.json()),
  
  // Strategies
  getStrategies: (userAddress) =>
    fetch(`${API_BASE}/api/strategies?userAddress=${userAddress}`)
      .then(r => r.json()),
  
  createStrategy: (params) =>
    fetch(`${API_BASE}/api/strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).then(r => r.json()),
  
  toggleStrategy: (id, enabled) =>
    fetch(`${API_BASE}/api/strategy/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then(r => r.json()),
  
  deleteStrategy: (id) =>
    fetch(`${API_BASE}/api/strategy/${id}`, { method: 'DELETE' })
      .then(r => r.json()),
  
  // Vault
  vaultStatus: () => fetch(`${API_BASE}/api/vault/status`).then(r => r.json()),
};

export default api;
