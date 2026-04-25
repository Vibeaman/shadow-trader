/**
 * AI Agent for parsing natural language trading commands
 * Now supports both immediate trades AND automated strategies
 */

import OpenAI from 'openai';
import { TOKENS } from './vanish.js';

export class AIAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Parse natural language command into trade or strategy parameters
   * Examples:
   * Immediate: "Buy 100 USDC worth of SOL"
   * Strategy: "Buy SOL when price drops 5%"
   */
  async parseCommand(command) {
    const systemPrompt = `You are a trading command parser for a privacy-focused Solana trading bot. Parse the user's trading intent into structured parameters.

Available tokens: SOL, USDC, USDT, JUP, BONK, WIF, RAY, ORCA

Determine if this is:
1. An IMMEDIATE trade (execute now)
2. A STRATEGY/CONDITIONAL trade (execute when conditions are met)

Return JSON with these fields:

For IMMEDIATE trades:
{
  "isStrategy": false,
  "action": "swap" | "buy" | "sell",
  "sourceToken": "token being sold",
  "targetToken": "token being bought", 
  "amount": "amount in base units",
  "amountType": "exact" | "all" | "percentage",
  "confidence": 0-1,
  "explanation": "what you understood"
}

For STRATEGY/CONDITIONAL trades:
{
  "isStrategy": true,
  "action": "buy" | "sell" | "swap",
  "sourceToken": "token to sell when triggered",
  "targetToken": "token to buy when triggered",
  "amount": "amount in base units",
  "amountType": "exact" | "all" | "percentage",
  "condition": "price_drop_percent" | "price_rise_percent" | "price_below" | "price_above",
  "conditionValue": number (percentage or price),
  "triggerToken": "token to monitor (usually targetToken)",
  "oneTime": true | false (execute once or repeatedly),
  "confidence": 0-1,
  "explanation": "what you understood",
  "name": "short strategy name"
}

EXAMPLES:

"Buy 100 USDC worth of SOL" -> immediate trade
{
  "isStrategy": false,
  "action": "swap",
  "sourceToken": "USDC",
  "targetToken": "SOL",
  "amount": "100000000",
  "amountType": "exact",
  "confidence": 0.95,
  "explanation": "Swap 100 USDC for SOL immediately"
}

"Buy SOL when it drops 5%" -> strategy
{
  "isStrategy": true,
  "action": "buy",
  "sourceToken": "USDC",
  "targetToken": "SOL",
  "amount": "10000000",
  "amountType": "exact",
  "condition": "price_drop_percent",
  "conditionValue": 5,
  "triggerToken": "SOL",
  "oneTime": true,
  "confidence": 0.9,
  "explanation": "Buy SOL when its price drops 5% from current",
  "name": "Buy SOL on 5% dip"
}

"Sell my JUP if it goes above $1" -> strategy
{
  "isStrategy": true,
  "action": "sell",
  "sourceToken": "JUP",
  "targetToken": "USDC",
  "amount": "all",
  "amountType": "all",
  "condition": "price_above",
  "conditionValue": 1,
  "triggerToken": "JUP",
  "oneTime": true,
  "confidence": 0.85,
  "explanation": "Sell all JUP when price exceeds $1",
  "name": "Take profit on JUP at $1"
}

"DCA into SOL every time it dips 3%" -> repeating strategy
{
  "isStrategy": true,
  "action": "buy",
  "sourceToken": "USDC",
  "targetToken": "SOL",
  "amount": "5000000",
  "amountType": "exact",
  "condition": "price_drop_percent",
  "conditionValue": 3,
  "triggerToken": "SOL",
  "oneTime": false,
  "confidence": 0.88,
  "explanation": "Buy SOL every time it drops 3%",
  "name": "DCA on SOL dips"
}

Keywords that indicate a STRATEGY:
- "when", "if", "whenever", "every time"
- "drops", "falls", "dips", "goes down"
- "rises", "goes up", "pumps", "moons"
- "above", "below", "reaches"
- "alert me", "notify me"

If uncertain, default to immediate trade with lower confidence.
If the command is unclear, return action: "unknown".`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const parsed = JSON.parse(response.choices[0].message.content);

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
  }

  /**
   * Generate a human-readable summary of a strategy
   */
  summarizeStrategy(strategy) {
    const { conditions, actions, oneTime } = strategy;
    
    let summary = '';
    
    // Describe conditions
    if (conditions.length > 0) {
      const cond = conditions[0];
      switch (cond.type) {
        case 'price_drop_percent':
          summary += `When ${cond.token} drops ${cond.value}%`;
          break;
        case 'price_rise_percent':
          summary += `When ${cond.token} rises ${cond.value}%`;
          break;
        case 'price_above':
          summary += `When ${cond.token} goes above $${cond.value}`;
          break;
        case 'price_below':
          summary += `When ${cond.token} goes below $${cond.value}`;
          break;
      }
    }
    
    // Describe actions
    if (actions.length > 0) {
      const act = actions[0];
      summary += `, ${act.type} ${act.fromToken} → ${act.toToken}`;
    }
    
    // One-time or repeating
    summary += oneTime ? ' (once)' : ' (repeating)';
    
    return summary;
  }
}
