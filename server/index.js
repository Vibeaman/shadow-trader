import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { VanishClient } from './vanish.js';
import { AIAgent } from './agent.js';

const app = express();
app.use(cors());
app.use(express.json());

const vanish = new VanishClient();
const agent = new AIAgent();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get Vanish balance
app.get('/api/balance', async (req, res) => {
  try {
    const { userAddress, signature, timestamp } = req.query;
    const balance = await vanish.getBalance(userAddress, signature, timestamp);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get deposit address
app.get('/api/deposit-address', async (req, res) => {
  try {
    const { tokenAddress } = req.query;
    const address = await vanish.getDepositAddress(tokenAddress || 'So11111111111111111111111111111111111111112');
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute private trade
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

// AI command parsing
app.post('/api/command', async (req, res) => {
  try {
    const { command, userAddress } = req.body;
    const parsed = await agent.parseCommand(command);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Commit transaction
app.post('/api/commit', async (req, res) => {
  try {
    const { txId } = req.body;
    const result = await vanish.commit(txId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Shadow Trader API running on port ${PORT}`);
});
