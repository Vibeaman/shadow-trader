/**
 * Strategy Engine
 * Manages automated trading strategies with conditions and actions
 */

import { priceMonitor } from './priceMonitor.js';
import { VanishClient } from './vanish.js';

export class StrategyEngine {
  constructor() {
    this.strategies = new Map(); // strategyId -> strategy
    this.vanish = new VanishClient();
    this.isRunning = false;
    this.checkInterval = 5000; // Check conditions every 5 seconds
  }

  /**
   * Start the strategy engine
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[StrategyEngine] Starting strategy engine...');
    
    // Start price monitor if not running
    priceMonitor.start();
    
    // Start checking conditions
    this.checkLoop();
  }

  /**
   * Stop the strategy engine
   */
  stop() {
    this.isRunning = false;
    console.log('[StrategyEngine] Stopped strategy engine');
  }

  /**
   * Main loop - check all strategy conditions
   */
  async checkLoop() {
    if (!this.isRunning) return;

    for (const [id, strategy] of this.strategies) {
      if (!strategy.enabled) continue;

      try {
        await this.evaluateStrategy(strategy);
      } catch (error) {
        console.error(`[StrategyEngine] Error evaluating strategy ${id}:`, error.message);
        strategy.lastError = error.message;
        strategy.errorCount = (strategy.errorCount || 0) + 1;

        // Disable strategy after 5 consecutive errors
        if (strategy.errorCount >= 5) {
          strategy.enabled = false;
          console.log(`[StrategyEngine] Disabled strategy ${id} after too many errors`);
        }
      }
    }

    // Schedule next check
    setTimeout(() => this.checkLoop(), this.checkInterval);
  }

  /**
   * Evaluate a single strategy
   */
  async evaluateStrategy(strategy) {
    // Check cooldown
    if (strategy.lastTriggered) {
      const cooldown = strategy.cooldownMs || 60000; // Default 1 minute
      if (Date.now() - strategy.lastTriggered < cooldown) {
        return; // Still in cooldown
      }
    }

    // Check all conditions (AND logic)
    const allConditionsMet = strategy.conditions.every(condition => 
      priceMonitor.checkCondition(condition)
    );

    if (!allConditionsMet) return;

    console.log(`[StrategyEngine] Strategy "${strategy.name}" triggered!`);

    // Execute actions
    for (const action of strategy.actions) {
      await this.executeAction(strategy, action);
    }

    // Update strategy state
    strategy.lastTriggered = Date.now();
    strategy.triggerCount = (strategy.triggerCount || 0) + 1;
    strategy.errorCount = 0; // Reset error count on success

    // If one-time strategy, disable it
    if (strategy.oneTime) {
      strategy.enabled = false;
      console.log(`[StrategyEngine] One-time strategy "${strategy.name}" completed and disabled`);
    }
  }

  /**
   * Execute a strategy action
   */
  async executeAction(strategy, action) {
    const { type, fromToken, toToken, amount, amountType } = action;

    if (type !== 'swap') {
      console.log(`[StrategyEngine] Unknown action type: ${type}`);
      return;
    }

    // Calculate actual amount
    let actualAmount = amount;
    if (amountType === 'percent') {
      // Would need to fetch balance and calculate percentage
      // For now, use fixed amount
      actualAmount = amount;
    }

    console.log(`[StrategyEngine] Executing swap: ${actualAmount} ${fromToken} → ${toToken}`);

    // Log the trade (actual execution requires wallet signature)
    strategy.executionLog = strategy.executionLog || [];
    strategy.executionLog.push({
      timestamp: Date.now(),
      action: `swap ${actualAmount} ${fromToken} → ${toToken}`,
      status: 'logged', // Would be 'executed' with real Vanish integration
    });

    // In demo mode or without API key, just log
    if (!process.env.VANISH_API_KEY) {
      console.log(`[StrategyEngine] Demo mode - trade logged but not executed`);
      return;
    }

    // Real execution would happen here
    // This requires the user's wallet signature, so it needs to be
    // handled through the frontend or a pre-authorized setup
  }

  /**
   * Create a new strategy
   */
  createStrategy(config) {
    const id = `strategy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const strategy = {
      id,
      name: config.name || 'Unnamed Strategy',
      description: config.description || '',
      userAddress: config.userAddress,
      conditions: config.conditions || [],
      actions: config.actions || [],
      enabled: true,
      oneTime: config.oneTime || false,
      cooldownMs: config.cooldownMs || 60000,
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
      errorCount: 0,
      executionLog: [],
      encrypted: false, // Will be true when Arcium integration is added
    };

    this.strategies.set(id, strategy);
    console.log(`[StrategyEngine] Created strategy "${strategy.name}" (${id})`);

    return strategy;
  }

  /**
   * Get a strategy by ID
   */
  getStrategy(id) {
    return this.strategies.get(id);
  }

  /**
   * Get all strategies for a user
   */
  getUserStrategies(userAddress) {
    const result = [];
    for (const strategy of this.strategies.values()) {
      if (strategy.userAddress === userAddress) {
        result.push(strategy);
      }
    }
    return result;
  }

  /**
   * Update a strategy
   */
  updateStrategy(id, updates) {
    const strategy = this.strategies.get(id);
    if (!strategy) return null;

    Object.assign(strategy, updates, { updatedAt: Date.now() });
    return strategy;
  }

  /**
   * Delete a strategy
   */
  deleteStrategy(id) {
    return this.strategies.delete(id);
  }

  /**
   * Enable/disable a strategy
   */
  setStrategyEnabled(id, enabled) {
    const strategy = this.strategies.get(id);
    if (strategy) {
      strategy.enabled = enabled;
      strategy.errorCount = 0; // Reset errors when re-enabling
    }
    return strategy;
  }

  /**
   * Parse natural language into strategy config
   * This is called by the AI agent
   */
  parseStrategyFromIntent(intent) {
    // Intent comes from AI parsing, e.g.:
    // { action: "buy", token: "SOL", condition: "price_drop", value: 5 }

    const conditions = [];
    const actions = [];

    // Build conditions based on intent
    if (intent.condition === 'price_drop' || intent.condition === 'price_drop_percent') {
      conditions.push({
        type: 'price_drop_percent',
        token: intent.triggerToken || intent.targetToken || 'SOL',
        value: intent.conditionValue || 5,
        periodMs: 300000, // 5 minutes
      });
    } else if (intent.condition === 'price_rise' || intent.condition === 'price_rise_percent') {
      conditions.push({
        type: 'price_rise_percent',
        token: intent.triggerToken || intent.targetToken || 'SOL',
        value: intent.conditionValue || 5,
        periodMs: 300000,
      });
    } else if (intent.condition === 'price_below') {
      conditions.push({
        type: 'price_below',
        token: intent.triggerToken || intent.targetToken || 'SOL',
        value: intent.conditionValue,
      });
    } else if (intent.condition === 'price_above') {
      conditions.push({
        type: 'price_above',
        token: intent.triggerToken || intent.targetToken || 'SOL',
        value: intent.conditionValue,
      });
    }

    // Build actions based on intent
    if (intent.action === 'buy' || intent.action === 'swap') {
      actions.push({
        type: 'swap',
        fromToken: intent.sourceToken || 'USDC',
        toToken: intent.targetToken || 'SOL',
        amount: intent.amount || '1000000', // Default 1 USDC
        amountType: intent.amountType || 'exact',
      });
    } else if (intent.action === 'sell') {
      actions.push({
        type: 'swap',
        fromToken: intent.sourceToken || 'SOL',
        toToken: intent.targetToken || 'USDC',
        amount: intent.amount || '100000000', // Default 0.1 SOL
        amountType: intent.amountType || 'exact',
      });
    }

    return {
      name: intent.name || `${intent.action} ${intent.targetToken} strategy`,
      description: intent.explanation || '',
      conditions,
      actions,
      oneTime: intent.oneTime !== false, // Default to one-time
      cooldownMs: intent.cooldownMs || 60000,
    };
  }
}

// Singleton instance
export const strategyEngine = new StrategyEngine();
