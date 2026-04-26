/**
 * Vanish API Client
 * Handles private trading via Vanish Core API
 * Docs: https://core.vanish.trade
 */

import pkg from 'tweetnacl';
const nacl = pkg;

const VANISH_URL = 'https://core-api.vanish.trade';
const JUPITER_URL = 'https://quote-api.jup.ag/v6';

// Vanish uses this for native SOL (different from wrapped SOL)
const NATIVE_SOL = '11111111111111111111111111111111';

export class VanishClient {
  constructor() {
    this.apiKey = process.env.VANISH_API_KEY;
    if (!this.apiKey) {
      console.warn('Warning: VANISH_API_KEY not set. Get one from https://discord.gg/vanishtrade');
    }
  }

  async request(path, options = {}) {
    if (!this.apiKey) {
      throw new Error('VANISH_API_KEY not configured');
    }

    const res = await fetch(`${VANISH_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vanish API error ${res.status}: ${text}`);
    }

    return res.json();
  }

  /**
   * Health check
   */
  async health() {
    const res = await fetch(`${VANISH_URL}/health`);
    return res.json();
  }

  /**
   * Generate read signature for balance/account endpoints
   * Format: "By signing, I hereby agree to Vanish's Terms of Service..."
   */
  static generateReadSignature(timestamp, secretKey) {
    const message = [
      "By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)",
      "",
      `Details: read:${timestamp}`,
    ].join('\n');
    
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return Buffer.from(signature).toString('base64');
  }

  /**
   * Generate trade signature
   * Format includes: source:target:amount:loan_sol:timestamp:jito_tip
   */
  static generateTradeSignature(sourceToken, targetToken, amount, loanSol, timestamp, jitoTip, secretKey) {
    const message = [
      "By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)",
      "",
      `Details: trade:${sourceToken}:${targetToken}:${amount}:${loanSol}:${timestamp}:${jitoTip}`,
    ].join('\n');
    
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return Buffer.from(signature).toString('base64');
  }

  /**
   * Generate withdraw signature
   */
  static generateWithdrawSignature(tokenAddress, amount, additionalSol, timestamp, secretKey) {
    const message = [
      "By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)",
      "",
      `Details: withdraw:${tokenAddress}:${amount}:${additionalSol}:${timestamp}`,
    ].join('\n');
    
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return Buffer.from(signature).toString('base64');
  }

  /**
   * Get deposit address for funding Vanish balance
   * Use NATIVE_SOL for native SOL deposits
   */
  async getDepositAddress(tokenAddress) {
    // Convert wrapped SOL to native SOL address for Vanish
    const vanishToken = tokenAddress === TOKENS.SOL ? NATIVE_SOL : tokenAddress;
    return this.request(`/deposit_address?token_address=${vanishToken}`);
  }

  /**
   * Get user's Vanish balance (requires signature)
   */
  async getBalances(userAddress, signature, timestamp) {
    return this.request('/account/balances', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        timestamp,
        signature,
      }),
    });
  }

  /**
   * Get pending actions for user
   */
  async getPendingActions(userAddress, signature, timestamp) {
    return this.request('/account/pending', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        timestamp,
        signature,
      }),
    });
  }

  /**
   * Get one-time wallet for private trading
   * MUST fetch a new one for every trade - never reuse!
   */
  async getOneTimeWallet() {
    return this.request('/trade/one-time-wallet');
  }

  /**
   * Build swap transaction via Jupiter
   * Uses one-time wallet as signer (not user wallet!)
   */
  async buildSwapTransaction(oneTimeWallet, sourceToken, targetToken, amount) {
    // Convert native SOL address for Jupiter (it uses wrapped SOL)
    const jupiterSource = sourceToken === NATIVE_SOL ? TOKENS.SOL : sourceToken;
    const jupiterTarget = targetToken === NATIVE_SOL ? TOKENS.SOL : targetToken;

    // 1. Get quote from Jupiter
    const quoteRes = await fetch(
      `${JUPITER_URL}/quote` +
      `?inputMint=${jupiterSource}` +
      `&outputMint=${jupiterTarget}` +
      `&amount=${amount}` +
      `&slippageBps=50`
    );
    const quote = await quoteRes.json();

    if (quote.error) {
      throw new Error(`Jupiter quote error: ${quote.error}`);
    }

    // 2. Get swap transaction (with one-time wallet as signer!)
    const swapRes = await fetch(`${JUPITER_URL}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: oneTimeWallet, // CRITICAL: must be one-time wallet
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
      }),
    });

    const swapData = await swapRes.json();

    if (swapData.error) {
      throw new Error(`Jupiter swap error: ${swapData.error}`);
    }

    return swapData.swapTransaction;
  }

  /**
   * Execute private trade via Vanish
   * 
   * @param {Object} params
   * @param {string} params.userAddress - User's Solana wallet address
   * @param {string} params.sourceToken - Input token mint (use NATIVE_SOL for SOL)
   * @param {string} params.targetToken - Output token mint
   * @param {string} params.amount - Amount in lamports/base units
   * @param {string} params.swapTransaction - Base64-encoded unsigned swap tx
   * @param {string} params.oneTimeWallet - Address from getOneTimeWallet()
   * @param {string} params.userSignature - Signature from generateTradeSignature()
   * @param {string} params.timestamp - Unix timestamp in milliseconds
   * @param {string} params.loanSol - Lamports for ATA creation (default: 12000000 = 0.012 SOL)
   * @param {string} params.jitoTip - Jito tip in lamports (default: 1000000 = 0.001 SOL)
   * @param {number} params.splitRepay - Number of trading accounts (1-9, default: 1)
   */
  async executeTrade({
    userAddress,
    sourceToken,
    targetToken,
    amount,
    swapTransaction,
    oneTimeWallet,
    userSignature,
    timestamp,
    loanSol = '12000000',
    jitoTip = '1000000',
    splitRepay = 1,
  }) {
    return this.request('/trade/create', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        source_token_address: sourceToken,
        target_token_address: targetToken,
        amount,
        swap_transaction: swapTransaction,
        one_time_wallet: oneTimeWallet,
        loan_additional_sol: loanSol,
        jito_tip_amount: jitoTip,
        split_repay: splitRepay,
        timestamp,
        user_signature: userSignature,
      }),
    });
  }

  /**
   * Commit a transaction (MUST call after deposit or trade)
   * 
   * Status values:
   * - completed: Success, balance updated
   * - rejected: Failed compliance/risk screening, funds will be refunded
   * - pending: Waiting for confirmation or screening
   * - failed: Transaction rejected on-chain
   * - expired: Transaction not confirmed in time
   */
  async commit(txId) {
    return this.request('/commit', {
      method: 'POST',
      body: JSON.stringify({ tx_id: txId }),
    });
  }

  /**
   * Create withdrawal request
   */
  async createWithdraw({
    userAddress,
    tokenAddress,
    amount,
    additionalSol = '0',
    timestamp,
    userSignature,
  }) {
    return this.request('/withdraw/create', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        token_address: tokenAddress,
        amount,
        additional_sol: additionalSol,
        timestamp,
        user_signature: userSignature,
      }),
    });
  }
}

// Token addresses - standard SPL tokens
export const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL (for Jupiter)
  NATIVE_SOL: '11111111111111111111111111111111', // Native SOL (for Vanish deposits)
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
};

export { NATIVE_SOL };
