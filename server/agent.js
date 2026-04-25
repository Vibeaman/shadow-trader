/**
 * AI Agent for parsing natural language trading commands
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
   * Parse natural language command into trade parameters
   * Examples:
   * - "Buy 100 USDC worth of SOL"
   * - "Swap 0.5 SOL to USDC"
   * - "Sell all my SOL for USDC"
   */
  async parseCommand(command) {
    const systemPrompt = `You are a trading command parser. Parse the user's trading intent into structured parameters.

Available tokens: SOL, USDC, USDT

Return JSON with these fields:
- action: "swap" | "buy" | "sell" | "unknown"
- sourceToken: token being sold (SOL, USDC, etc)
- targetToken: token being bought
- amount: amount in base units (lamports for SOL, 6 decimals for USDC/USDT)
- amountType: "exact" | "all" | "percentage"
- confidence: 0-1 how confident you are in parsing
- explanation: brief explanation of what you understood

If the command is unclear, set action to "unknown" and ask for clarification in explanation.

Examples:
"Buy 100 USDC worth of SOL" -> swap USDC to SOL, 100000000 (100 * 1e6)
"Swap 0.5 SOL to USDC" -> swap SOL to USDC, 500000000 (0.5 * 1e9)
"Sell all SOL" -> swap SOL to USDC (default), amountType: "all"`;

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

    return parsed;
  }

  /**
   * Generate trading strategy from description
   */
  async generateStrategy(description) {
    const systemPrompt = `You are a trading strategy generator. Convert the user's description into a concrete strategy.

Return JSON with:
- name: short name for the strategy
- description: what it does
- conditions: array of conditions that trigger trades
- actions: array of trade actions when conditions are met
- riskLevel: "low" | "medium" | "high"

Example conditions:
- { type: "price_drop", token: "SOL", percentage: 5 }
- { type: "price_above", token: "SOL", price: 150 }
- { type: "time", schedule: "daily", time: "09:00" }

Example actions:
- { type: "swap", from: "USDC", to: "SOL", amount: "10%", amountOf: "balance" }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
