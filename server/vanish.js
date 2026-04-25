/**
 * Vanish API Client
 * Handles private trading via Vanish Core API
 * Docs: https://core.vanish.trade
 */

const VANISH_URL = 'https://core-api.vanish.trade';
const JUPITER_URL = 'https://quote-api.jup.ag/v6';

export class VanishClient {
  constructor() {
    this.apiKey = process.env.VANISH_API_KEY;
    if (!this.apiKey) {
      console.warn('Warning: VANISH_API_KEY not set. Get one from https://discord.gg/vanishtrade');
    }
  }

  async request(path, options = {}) {
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
   * Get deposit address for funding Vanish balance
   */
  async getDepositAddress(tokenAddress) {
    return this.request(`/deposit_address?token_address=${tokenAddress}`);
  }

  /**
   * Get user's Vanish balance (requires signature)
   */
  async getBalance(userAddress, signature, timestamp) {
    return this.request('/balance', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        timestamp,
        user_signature: signature,
      }),
    });
  }

  /**
   * Get one-time wallet for private trading
   * MUST fetch a new one for every trade
   */
  async getOneTimeWallet() {
    return this.request('/trade/one-time-wallet');
  }

  /**
   * Build swap transaction via Jupiter
   * Uses one-time wallet as signer (not user wallet!)
   */
  async buildSwapTransaction(oneTimeWallet, sourceToken, targetToken, amount) {
    // 1. Get quote from Jupiter
    const quoteRes = await fetch(
      `${JUPITER_URL}/quote` +
      `?inputMint=${sourceToken}` +
      `&outputMint=${targetToken}` +
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
        split_repay: 1,
        timestamp,
        user_signature: userSignature,
      }),
    });
  }

  /**
   * Commit a transaction (MUST call after every trade)
   */
  async commit(txId) {
    return this.request('/commit', {
      method: 'POST',
      body: JSON.stringify({ tx_id: txId }),
    });
  }

  /**
   * Withdraw from Vanish balance back to user wallet
   */
  async withdraw(userAddress, tokenAddress, amount, signature, timestamp) {
    return this.request('/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        token_address: tokenAddress,
        amount,
        timestamp,
        user_signature: signature,
      }),
    });
  }
}

// Token addresses
export const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  // Add more as needed
};
