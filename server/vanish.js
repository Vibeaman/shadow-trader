/**
 * Vanish API Client
 * Handles private trading via Vanish Core API
 * Docs: https://core.vanish.trade/api-reference
 */

const VANISH_API_KEY = process.env.VANISH_API_KEY || '2db74e51-8109-4695-9361-91af497f17af';
const VANISH_BASE_URL = 'https://core-api-dev.vanish.trade';

// Native SOL address for Vanish
const NATIVE_SOL = '11111111111111111111111111111111';

export class VanishClient {
  constructor() {
    this.apiKey = VANISH_API_KEY;
    this.baseUrl = VANISH_BASE_URL;
  }

  /**
   * Make authenticated request to Vanish API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log(`[Vanish] ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Vanish] API error:', data);
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  /**
   * Get deposit address for a token
   */
  async getDepositAddress(tokenAddress) {
    return this.request(`/deposit/address?token_address=${tokenAddress}`);
  }

  /**
   * Get user's Vanish balance
   */
  async getBalance(userAddress, signature, timestamp) {
    return this.request('/balance/get', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        timestamp: timestamp.toString(),
        user_signature: signature,
      }),
    });
  }

  /**
   * Get one-time wallet for a trade
   * This must be called first before creating a trade
   */
  async getOneTimeWallet(userAddress, sourceToken, targetToken) {
    return this.request('/trade/one-time-wallet', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        source_token_address: sourceToken,
        target_token_address: targetToken,
      }),
    });
  }

  /**
   * Get Jupiter swap quote
   */
  async getJupiterQuote(inputMint, outputMint, amount, slippageBps = 100) {
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to get Jupiter quote');
    }
    return response.json();
  }

  /**
   * Get Jupiter swap transaction
   */
  async getJupiterSwapTransaction(quoteResponse, userPublicKey) {
    const response = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get Jupiter swap transaction');
    }
    return response.json();
  }

  /**
   * Create a trade via Vanish
   * Full flow: get one-time wallet, build swap tx, then create trade
   */
  async createTrade(params) {
    const {
      userAddress,
      sourceToken,
      targetToken,
      amount, // in lamports/base units
      slippage = 1, // percent
      jitoTip = 1000000, // lamports (0.001 SOL)
      timestamp,
      userSignature,
      loanAdditionalSol = 12000000, // 0.012 SOL for ATAs
    } = params;

    // Step 1: Get one-time wallet
    console.log('[Vanish] Getting one-time wallet...');
    const { one_time_wallet, loan_wallet_address } = await this.getOneTimeWallet(
      userAddress,
      sourceToken,
      targetToken
    );
    console.log('[Vanish] One-time wallet:', one_time_wallet);

    // Step 2: Get Jupiter quote and swap transaction
    console.log('[Vanish] Getting Jupiter quote...');
    const slippageBps = Math.round(slippage * 100); // 1% = 100 bps
    
    // Map native SOL to wrapped SOL for Jupiter
    const jupiterInputMint = sourceToken === NATIVE_SOL 
      ? 'So11111111111111111111111111111111111111112' 
      : sourceToken;
    const jupiterOutputMint = targetToken === NATIVE_SOL 
      ? 'So11111111111111111111111111111111111111112' 
      : targetToken;

    const quote = await this.getJupiterQuote(
      jupiterInputMint,
      jupiterOutputMint,
      amount,
      slippageBps
    );
    console.log('[Vanish] Quote received, outAmount:', quote.outAmount);

    // Step 3: Get swap transaction (using one-time wallet as the signer)
    console.log('[Vanish] Building swap transaction...');
    const { swapTransaction } = await this.getJupiterSwapTransaction(quote, one_time_wallet);
    console.log('[Vanish] Swap transaction built');

    // Step 4: Create trade via Vanish
    console.log('[Vanish] Creating trade...');
    const tradeResult = await this.request('/trade/create', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        source_token_address: sourceToken,
        target_token_address: targetToken,
        amount: amount.toString(),
        jito_tip_amount: jitoTip.toString(),
        swap_transaction: swapTransaction,
        loan_wallet_address: loan_wallet_address,
        loan_additional_sol: loanAdditionalSol.toString(),
        timestamp: timestamp.toString(),
        user_signature: userSignature,
        split_repay: 1,
        one_time_wallet: one_time_wallet,
      }),
    });

    console.log('[Vanish] Trade created:', tradeResult);
    return {
      success: true,
      txId: tradeResult.tx_id,
      jitoBundleId: tradeResult.jito_bundle_id,
      outputAmount: quote.outAmount,
    };
  }

  /**
   * Withdraw from Vanish to user's wallet
   */
  async withdraw(params) {
    const {
      userAddress,
      tokenAddress,
      amount,
      additionalSol = 12000000,
      timestamp,
      userSignature,
    } = params;

    return this.request('/withdraw/create', {
      method: 'POST',
      body: JSON.stringify({
        user_address: userAddress,
        token_address: tokenAddress,
        amount: amount.toString(),
        additional_sol: additionalSol.toString(),
        timestamp: timestamp.toString(),
        user_signature: userSignature,
      }),
    });
  }

  /**
   * Check API health
   */
  async health() {
    return this.request('/health');
  }
}

// Singleton instance
export const vanishClient = new VanishClient();
