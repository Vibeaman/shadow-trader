/**
 * AI Agent for parsing natural language trading commands
 * Uses OpenRouter for AI (works with multiple models)
 */

import { TOKENS } from './vanish.js';

export class AIAgent {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    this.baseUrl = process.env.OPENROUTER_API_KEY 
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1';
    
    console.log('[AIAgent] Initialized with:', {
      hasKey: !!this.apiKey,
      keyPrefix: this.apiKey ? this.apiKey.slice(0, 15) + '...' : 'none',
      baseUrl: this.baseUrl
    });
  }

  /**
   * Parse natural language command into trade or strategy parameters
   */
  async parseCommand(command) {
    const systemPrompt = `You are a trading command parser for Ghost, a privacy-focused Solana trading bot. Parse the user's trading intent into structured parameters.

Available tokens: SOL, USDC, USDT, JUP, BONK, WIF, RAY, ORCA

Determine if this is:
1. An IMMEDIATE trade (execute now) - swapping one crypto for another
2. A STRATEGY/CONDITIONAL trade (execute when conditions are met)
3. A QUESTION (asking about prices, info, etc.)
4. A FUNDING request (adding fiat money OR cashing out to bank/fiat)

IMPORTANT: "Cash out to bank", "withdraw to my bank", "fund my wallet with $X", "add money", "buy crypto with card" are FUNDING requests, not trades.

Return JSON with these fields:

For IMMEDIATE trades:
{
  "type": "trade",
  "action": "swap" | "buy" | "sell",
  "sourceToken": "token being SOLD/spent",
  "targetToken": "token being BOUGHT/received", 
  "amount": "numeric amount only (no symbols)",
  "confidence": 0-1,
  "response": "friendly confirmation message"
}

IMPORTANT parsing rules:
- "Buy X worth of Y" or "Buy Y with X" = sourceToken is X (being sold), targetToken is Y (being bought)
- "Buy 0.5 SOL worth of JUP" = sell 0.5 SOL to buy JUP, so sourceToken=SOL, targetToken=JUP, amount=0.5
- "Swap X for Y" = sourceToken is X, targetToken is Y
- "Sell X for Y" = sourceToken is X, targetToken is Y

For STRATEGY/CONDITIONAL trades:
{
  "type": "strategy",
  "action": "buy" | "sell",
  "sourceToken": "token to sell when triggered",
  "targetToken": "token to buy when triggered",
  "amount": "amount",
  "condition": "price_drop_percent" | "price_rise_percent" | "price_below" | "price_above",
  "conditionValue": number,
  "triggerToken": "token to monitor",
  "confidence": 0-1,
  "response": "friendly confirmation that strategy is set up"
}

For QUESTIONS:
{
  "type": "question",
  "topic": "price" | "info" | "help" | "other",
  "tokens": ["tokens mentioned"],
  "response": "helpful answer"
}

For FUNDING requests (fiat on/off ramp via MoonPay):
- "fund my wallet", "add $50", "buy SOL with card" = onramp (fiat -> crypto)
- "cash out to bank", "withdraw to fiat", "sell to my bank" = offramp (crypto -> fiat)
{
  "type": "funding",
  "action": "onramp" | "offramp",
  "amount": "amount (dollar amount for onramp, crypto amount for offramp)",
  "currency": "USD" | "EUR" | etc,
  "targetToken": "SOL" or "USDC" (what to buy),
  "response": "confirmation about funding via MoonPay"
}

For UNCLEAR requests:
{
  "type": "unclear",
  "response": "ask for clarification or suggest what they can do"
}

Be conversational and helpful in your responses. Keep them short but friendly.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...(process.env.OPENROUTER_API_KEY && {
            'HTTP-Referer': 'https://ghost.trade',
            'X-Title': 'Ghost Trading'
          })
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: command },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('[AIAgent] API error:', JSON.stringify(data.error));
        return {
          type: 'error',
          response: "Sorry, I'm having trouble understanding that. Try something like 'Buy SOL when it drops 5%'",
          debug: data.error
        };
      }

      if (!data.choices || !data.choices[0]) {
        console.error('[AIAgent] No choices in response:', JSON.stringify(data));
        return {
          type: 'error',
          response: "Sorry, I'm having trouble understanding that. Try something like 'Buy SOL when it drops 5%'"
        };
      }

      const parsed = JSON.parse(data.choices[0].message.content);

      // Map token names to addresses
      if (parsed.sourceToken && TOKENS[parsed.sourceToken]) {
        parsed.sourceTokenAddress = TOKENS[parsed.sourceToken];
      }
      if (parsed.targetToken && TOKENS[parsed.targetToken]) {
        parsed.targetTokenAddress = TOKENS[parsed.targetToken];
      }
      if (parsed.triggerToken && TOKENS[parsed.triggerToken]) {
        parsed.triggerTokenAddress = TOKENS[parsed.triggerToken];
      }

      return parsed;
    } catch (error) {
      console.error('[AIAgent] Parse error:', error);
      return {
        type: 'error',
        response: "Something went wrong. Please try again."
      };
    }
  }

  /**
   * Generate a conversational response
   */
  async chat(message, context = []) {
    const systemPrompt = `You are Ghost, a friendly AI assistant for a private trading bot on Solana. You help users:
- Execute trades privately (via Vanish protocol)
- Set up automated trading strategies
- Check token prices
- Understand how private trading works

Keep responses SHORT and conversational. Use emojis occasionally. Be helpful but not verbose.

Available tokens: SOL, USDC, USDT, JUP, BONK, WIF, RAY, ORCA

Current prices (approximate):
- SOL: ~$148
- JUP: ~$0.89
- BONK: ~$0.0000234
- WIF: ~$2.34`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...(process.env.OPENROUTER_API_KEY && {
            'HTTP-Referer': 'https://ghost.trade',
            'X-Title': 'Ghost Trading'
          })
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...context,
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        return "Sorry, I'm having trouble right now. Try again in a moment.";
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('[AIAgent] Chat error:', error);
      return "Something went wrong. Please try again.";
    }
  }
}
