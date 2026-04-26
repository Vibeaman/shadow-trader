import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { VanishClient, TOKENS } from './vanish.js';
import { AIAgent } from './agent.js';
import { priceMonitor } from './priceMonitor.js';
import { strategyEngine } from './strategyEngine.js';
import { arciumVault } from './arcium.js';

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

const vanish = new VanishClient();
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
// Vanish Trading Endpoints
// ============================================

app.get('/api/balance', async (req, res) => {
  try {
    const { userAddress, signature, timestamp } = req.query;
    const balance = await vanish.getBalance(userAddress, signature, timestamp);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/deposit-address', async (req, res) => {
  try {
    const { tokenAddress } = req.query;
    const address = await vanish.getDepositAddress(tokenAddress || TOKENS.SOL);
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
      userSignature,
      timestamp
    } = req.body;

    // 1. Get one-time wallet
    const { address: oneTimeWallet } = await vanish.getOneTimeWallet();

    // 2. Build swap transaction via Jupiter
    const swapTx = await vanish.buildSwapTransaction(
      oneTimeWallet,
      sourceToken,
      targetToken,
      amount
    );

    // 3. Execute private trade
    const trade = await vanish.executeTrade({
      userAddress,
      sourceToken,
      targetToken,
      amount,
      swapTransaction: swapTx,
      oneTimeWallet,
      userSignature,
      timestamp
    });

    // 4. Commit the trade
    const result = await vanish.commit(trade.tx_id);

    res.json({
      success: true,
      txId: trade.tx_id,
      status: result.status,
      balanceChanges: result.balance_changes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/commit', async (req, res) => {
  try {
    const { txId } = req.body;
    const result = await vanish.commit(txId);
    res.json(result);
  } catch (error) {
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
║  Vanish API:     ${process.env.VANISH_API_KEY ? '✓ Configured' : '○ Demo Mode'}                        ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
