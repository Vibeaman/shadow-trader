import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { vanishClient } from './vanish.js';
import { AIAgent } from './agent.js';
import { priceMonitor } from './priceMonitor.js';
import { strategyEngine } from './strategyEngine.js';
import { arciumVault } from './arcium.js';
import { moonpayService } from './moonpay.js';

const app = express();
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ name: 'Shadow Trader API', status: 'running' });
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// vanishClient imported as singleton from vanish.js
const agent = new AIAgent();

// Start services
priceMonitor.start();
strategyEngine.start();

// ============================================
// Health & Status
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    services: {
      priceMonitor: priceMonitor.isRunning,
      strategyEngine: strategyEngine.isRunning,
      arcium: arciumVault.getStatus(),
      moonpay: moonpayService.getStatus(),
    }
  });
});

// ============================================
// Price Endpoints
// ============================================

app.get('/api/prices', (req, res) => {
  try {
    const prices = priceMonitor.getAllPrices();
    res.json({ success: true, prices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/price/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const price = priceMonitor.getPrice(symbol);
    const change5m = priceMonitor.calculateChange(symbol, 300000);
    
    if (price === null) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json({ 
      success: true, 
      symbol: symbol.toUpperCase(),
      price,
      change5m,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Wallet Balance (no signature required)
// ============================================

app.get('/api/wallet-balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate address format (basic check)
    if (!address || address.length < 32 || address.length > 44) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    // Fetch from Solana RPC (no CORS issues from backend)
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address]
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const lamports = data.result?.value || 0;
    const sol = lamports / 1e9;
    
    res.json({ 
      address,
      lamports,
      sol,
      success: true
    });
  } catch (error) {
    console.error('[WalletBalance] Error:', error.message);
    res.status(500).json({ error: error.message, success: false });
  }
});

// ============================================
// Vanish Trading Endpoints
// ============================================

app.post('/api/balance', async (req, res) => {
  try {
    const { userAddress, signature, timestamp } = req.body;
    const balance = await vanishClient.getBalances(userAddress, signature, timestamp);
    res.json(balance);
  } catch (error) {
    console.error('[Balance] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Keep GET for backwards compatibility
app.get('/api/balance', async (req, res) => {
  try {
    const { userAddress, signature, timestamp } = req.query;
    const balance = await vanishClient.getBalances(userAddress, signature, timestamp);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/deposit-address', async (req, res) => {
  try {
    const { tokenAddress } = req.query;
    const address = await vanishClient.getDepositAddress(tokenAddress || "11111111111111111111111111111111");
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trade', async (req, res) => {
  try {
    const {
      userAddress,
      sourceToken,
      targetToken,
      amount,
      slippage = 1,
      jitoTip = 0.001,
      userSignature,
      timestamp
    } = req.body;

    // Convert amount to lamports if needed
    let amountLamports = amount;
    if (typeof amount === 'string' && !amount.includes('.')) {
      amountLamports = parseInt(amount);
    } else {
      // Assume SOL amount, convert to lamports
      amountLamports = Math.round(parseFloat(amount) * 1e9);
    }

    // Convert jitoTip to lamports
    const jitoTipLamports = Math.round(parseFloat(jitoTip) * 1e9);

    // Execute trade via Vanish
    const result = await vanishClient.createTrade({
      userAddress,
      sourceToken,
      targetToken,
      amount: amountLamports,
      slippage,
      jitoTip: jitoTipLamports,
      timestamp,
      userSignature,
    });

    res.json(result);
  } catch (error) {
    console.error('[Trade] Error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/commit', async (req, res) => {
  try {
    const { txId } = req.body;
    const result = await vanishClient.commit(txId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/withdraw', async (req, res) => {
  try {
    const {
      userAddress,
      tokenAddress,
      amount,
      additionalSol,
      timestamp,
      userSignature,
    } = req.body;

    const result = await vanishClient.createWithdraw({
      userAddress,
      tokenAddress,
      amount,
      additionalSol,
      timestamp,
      userSignature,
    });

    res.json({
      success: true,
      txId: result.tx_id,
      status: result.status,
    });
  } catch (error) {
    console.error('[Withdraw] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AI Agent Endpoints
// ============================================

app.post('/api/command', async (req, res) => {
  try {
    const { command, userAddress } = req.body;
    const parsed = await agent.parseCommand(command);
    
    // If it's a strategy command, create the strategy
    if (parsed.isStrategy && parsed.confidence > 0.7) {
      const strategyConfig = strategyEngine.parseStrategyFromIntent(parsed);
      strategyConfig.userAddress = userAddress;
      
      const strategy = strategyEngine.createStrategy(strategyConfig);
      
      // Optionally encrypt and store in Arcium vault
      if (parsed.encrypt) {
        await arciumVault.storeStrategy(strategy.id, strategy);
      }
      
      parsed.strategyId = strategy.id;
      parsed.strategyCreated = true;
    }

    // If it's a funding command, generate MoonPay URL
    if (parsed.type === 'funding' && userAddress) {
      const fundingResult = await moonpayService.handleFundingRequest(
        {
          action: parsed.action,
          amount: parsed.amount,
          targetToken: parsed.targetToken,
        },
        userAddress
      );
      parsed.fundingUrl = fundingResult.url;
      parsed.fundingQuote = fundingResult.quote;
      parsed.response = fundingResult.message;
    }
    
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Strategy Endpoints
// ============================================

app.get('/api/strategies', (req, res) => {
  try {
    const { userAddress } = req.query;
    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress required' });
    }
    
    const strategies = strategyEngine.getUserStrategies(userAddress);
    res.json({ success: true, strategies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/strategy/:id', (req, res) => {
  try {
    const strategy = strategyEngine.getStrategy(req.params.id);
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json({ success: true, strategy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/strategy', async (req, res) => {
  try {
    const { userAddress, name, conditions, actions, oneTime, encrypt } = req.body;
    
    const strategy = strategyEngine.createStrategy({
      userAddress,
      name,
      conditions,
      actions,
      oneTime,
    });
    
    // Optionally encrypt
    if (encrypt) {
      await arciumVault.storeStrategy(strategy.id, strategy);
      strategy.encrypted = true;
    }
    
    res.json({ success: true, strategy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/strategy/:id', (req, res) => {
  try {
    const strategy = strategyEngine.updateStrategy(req.params.id, req.body);
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json({ success: true, strategy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/strategy/:id', (req, res) => {
  try {
    const deleted = strategyEngine.deleteStrategy(req.params.id);
    arciumVault.deleteStrategy(req.params.id); // Also delete from vault
    res.json({ success: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/strategy/:id/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const strategy = strategyEngine.setStrategyEnabled(req.params.id, enabled);
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json({ success: true, strategy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Arcium Vault Endpoints
// ============================================

app.get('/api/vault/status', (req, res) => {
  try {
    const status = arciumVault.getStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MoonPay Endpoints
// ============================================

app.get('/api/moonpay/status', (req, res) => {
  try {
    const status = moonpayService.getStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/moonpay/buy-url', async (req, res) => {
  try {
    const { walletAddress, amount, token } = req.body;
    const url = moonpayService.generateBuyUrl({
      walletAddress,
      baseCurrencyAmount: amount,
      currencyCode: token || 'sol',
    });
    const quote = await moonpayService.getBuyQuote({
      baseCurrencyAmount: amount,
      currencyCode: (token || 'sol').toLowerCase(),
    });
    res.json({ success: true, url, quote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/moonpay/sell-url', (req, res) => {
  try {
    const { walletAddress, amount, token } = req.body;
    const url = moonpayService.generateSellUrl({
      walletAddress,
      quoteCurrencyAmount: amount,
      currencyCode: token || 'sol',
    });
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/moonpay/fund', async (req, res) => {
  try {
    const { action, amount, targetToken, walletAddress } = req.body;
    const result = await moonpayService.handleFundingRequest(
      { action, amount, targetToken },
      walletAddress
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Bind to all interfaces for Railway
app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    SHADOW TRADER                          ║
║               Private AI Trading on Solana                ║
╠═══════════════════════════════════════════════════════════╣
║  API Server:     http://localhost:${PORT}                    ║
║  Price Monitor:  ${priceMonitor.isRunning ? '✓ Running' : '✗ Stopped'}                            ║
║  Strategy Engine: ${strategyEngine.isRunning ? '✓ Running' : '✗ Stopped'}                           ║
║  Arcium Vault:   ${arciumVault.isArciumEnabled ? '✓ Connected' : '○ Local Mode'}                         ║
║  MoonPay:        ${moonpayService.isEnabled ? '✓ Configured' : '○ Demo Mode'}                        ║
║  Vanish API:     ${process.env.VANISH_API_KEY ? '✓ Configured' : '○ Demo Mode'}                        ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
