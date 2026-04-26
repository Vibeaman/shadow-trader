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
  }

  /**
   * Parse natural language command into trade or strategy parameters
   */
  async parseCommand(command) {
    const systemPrompt = `You are a trading command parser for Ghost, a privacy-focused Solana trading bot. Parse the user's trading intent into structured parameters.

Available tokens: SOL, USDC, USDT, JUP, BONK, WIF, RAY, ORCA

Determine if this is:
1. An IMMEDIATE trade (execute now)
2. A STRATEGY/CONDITIONAL trade (execute when conditions are met)
3. A QUESTION (asking about prices, info, etc.)

Return JSON with these fields:

For IMMEDIATE trades:
{
  "type": "trade",
  "action": "swap" | "buy" | "sell",
  "sourceToken": "token being sold",
  "targetToken": "token being bought", 
  "amount": "amount in readable format",
  "confidence": 0-1,
  "response": "friendly confirmation message"
}

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
        console.error('[AIAgent] API error:', data.error);
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
