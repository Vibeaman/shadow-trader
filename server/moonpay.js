/**
 * MoonPay Integration
 * Handles fiat on/off ramps for Ghost
 * 
 * MoonPay Agents allows AI to:
 * - Create wallets
 * - Fund wallets (fiat → crypto)
 * - Cash out (crypto → fiat)
 * - Cross-chain swaps
 * 
 * Docs: https://support.moonpay.com/en/articles/586487-moonpay-agents-fund-your-ai
 */

export class MoonPayService {
  constructor() {
    this.apiKey = process.env.MOONPAY_API_KEY;
    this.secretKey = process.env.MOONPAY_SECRET_KEY;
    this.isEnabled = !!this.apiKey;
    this.baseUrl = 'https://api.moonpay.com/v3';
    
    console.log('[MoonPay] Initialized:', { enabled: this.isEnabled });
  }

  /**
   * Generate a buy widget URL for fiat onramp
   * User clicks this to buy crypto with card/bank
   */
  generateBuyUrl(params) {
    const {
      walletAddress,
      currencyCode = 'sol', // SOL, USDC, etc
      baseCurrencyAmount, // Amount in fiat (e.g., 50 for $50)
      baseCurrencyCode = 'usd',
    } = params;

    // MoonPay widget URL
    const baseUrl = 'https://buy.moonpay.com';
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey || 'pk_test_demo', // Use test key if not configured
      currencyCode: currencyCode.toLowerCase(),
      walletAddress,
      baseCurrencyCode: baseCurrencyCode.toLowerCase(),
      baseCurrencyAmount: baseCurrencyAmount?.toString() || '',
      colorCode: '00dae9', // Ghost's cyan color
      theme: 'dark',
    });

    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Generate a sell widget URL for crypto offramp
   * User clicks this to sell crypto for fiat
   */
  generateSellUrl(params) {
    const {
      walletAddress,
      currencyCode = 'sol',
      quoteCurrencyAmount, // Amount in crypto to sell
    } = params;

    const baseUrl = 'https://sell.moonpay.com';
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey || 'pk_test_demo',
      baseCurrencyCode: currencyCode.toLowerCase(),
      walletAddress,
      quoteCurrencyAmount: quoteCurrencyAmount?.toString() || '',
      colorCode: '00dae9',
      theme: 'dark',
    });

    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies() {
    if (!this.isEnabled) {
      // Return default Solana tokens
      return [
        { code: 'sol', name: 'Solana', type: 'crypto' },
        { code: 'usdc_sol', name: 'USDC (Solana)', type: 'crypto' },
      ];
    }

    try {
      const response = await fetch(`${this.baseUrl}/currencies`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('[MoonPay] Failed to fetch currencies:', error);
      return [];
    }
  }

  /**
   * Get a price quote for buying crypto
   */
  async getBuyQuote(params) {
    const {
      currencyCode = 'sol',
      baseCurrencyCode = 'usd',
      baseCurrencyAmount = 50,
    } = params;

    if (!this.isEnabled) {
      // Return mock quote
      const mockRates = { sol: 85, usdc: 1 };
      const rate = mockRates[currencyCode.toLowerCase()] || 1;
      return {
        quoteCurrencyAmount: baseCurrencyAmount / rate,
        quoteCurrencyCode: currencyCode,
        baseCurrencyAmount,
        baseCurrencyCode,
        feeAmount: baseCurrencyAmount * 0.035, // ~3.5% fee estimate
        networkFeeAmount: 0.01,
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/currencies/${currencyCode}/buy_quote?baseCurrencyCode=${baseCurrencyCode}&baseCurrencyAmount=${baseCurrencyAmount}`,
        {
          headers: {
            'Authorization': `Api-Key ${this.apiKey}`,
          },
        }
      );
      return await response.json();
    } catch (error) {
      console.error('[MoonPay] Failed to get quote:', error);
      return null;
    }
  }

  /**
   * Handle funding request from AI agent
   */
  async handleFundingRequest(params, walletAddress) {
    const { action, amount, targetToken = 'SOL' } = params;

    if (action === 'onramp') {
      // User wants to add money
      const buyUrl = this.generateBuyUrl({
        walletAddress,
        currencyCode: targetToken,
        baseCurrencyAmount: parseFloat(amount) || 50,
      });

      const quote = await this.getBuyQuote({
        currencyCode: targetToken.toLowerCase(),
        baseCurrencyAmount: parseFloat(amount) || 50,
      });

      return {
        success: true,
        action: 'onramp',
        message: `Ready to fund your wallet with $${amount} of ${targetToken}. Click the link to complete purchase via MoonPay.`,
        url: buyUrl,
        quote,
      };
    }

    if (action === 'offramp') {
      // User wants to cash out
      const sellUrl = this.generateSellUrl({
        walletAddress,
        currencyCode: targetToken,
        quoteCurrencyAmount: parseFloat(amount) || 1,
      });

      return {
        success: true,
        action: 'offramp',
        message: `Ready to cash out ${amount} ${targetToken}. Click the link to sell via MoonPay.`,
        url: sellUrl,
      };
    }

    return {
      success: false,
      message: 'Unknown funding action',
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      features: ['onramp', 'offramp', 'quotes'],
      supportedTokens: ['SOL', 'USDC'],
    };
  }
}

// Singleton instance
export const moonpayService = new MoonPayService();
