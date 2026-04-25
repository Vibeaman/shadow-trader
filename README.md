# 👻 Ghost

Private AI trading on Solana. Trade without exposing your wallet history onchain.

![Ghost Banner](client/public/ghost-logo.png)

## What is Ghost?

Ghost is an AI-powered trading agent that executes your trades privately via [Vanish](https://vanish.trade). Your positions, trade sizes, and wallet history stay hidden from MEV bots, competitors, and onchain watchers.

## Features

- **🔒 Private Trading** - All swaps routed through Vanish (~200ms overhead)
- **🤖 AI Commands** - Natural language trading ("buy SOL when it drops 5%")
- **📈 Automated Strategies** - Set conditions, Ghost executes automatically
- **🔐 Encrypted Strategies** - Arcium encryption keeps your alpha secret
- **📱 Mobile-First UI** - Clean Trojan-style interface

## How It Works

```
You: "Buy SOL when it drops 5%"
     ↓
[Ghost AI] creates automated strategy
     ↓
[Price Monitor] watches SOL price
     ↓
[Strategy Engine] detects 5% drop
     ↓
[Vanish] executes swap privately
     ↓
You get SOL. No trace onchain.
```

## Tech Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: Node.js + Express
- **Privacy**: Vanish (private swaps)
- **Encryption**: Arcium (strategy storage)
- **AI**: OpenAI GPT-4o-mini
- **DEX**: Jupiter aggregator
- **Wallet**: Phantom

## Getting Started

```bash
# Clone
git clone https://github.com/Vibeaman/shadow-trader.git
cd shadow-trader

# Install dependencies
npm install
cd client && npm install && cd ..

# Set up environment
cp .env.example .env
# Add your API keys

# Run development
npm run dev
```

## Environment Variables

```env
# Required for live trading
VANISH_API_KEY=        # Get from https://discord.gg/vanishtrade

# Required for AI commands
OPENAI_API_KEY=

# Optional
ARCIUM_API_KEY=        # For encrypted strategy storage
SOLANA_RPC_URL=        # Default: public RPC
```

## Screens

| Landing | Trade | AI Agent | Holdings |
|---------|-------|----------|----------|
| Connect wallet | Token list | Natural language | Vanish balance |
| Features | Filters | Strategy management | Deposit/Withdraw |
| How it works | Private swap | Automated triggers | Activity |

## Hackathon

Built for **Colosseum Frontier Hackathon** (April 6 - May 11, 2026)

**Tracks**: AI, DeFi, Infrastructure

**Sponsor Integrations**:
- ✅ Vanish - Private swap execution ($10K bounty)
- ✅ Phantom - Wallet connection
- ✅ Arcium - Encrypted computation
- ✅ Jupiter - DEX aggregation

## Privacy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Ghost                                │
├─────────────────────────────────────────────────────────────┤
│  AI Agent        Strategy Engine       Price Monitor        │
│  (parse)         (conditions)          (Jupiter API)        │
└──────────┬───────────────┬─────────────────┬────────────────┘
           │               │                 │
           ▼               ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│                    Arcium Vault                              │
│              (encrypted strategy storage)                    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       Vanish                                 │
│  - One-time wallet generation                               │
│  - Private swap execution                                   │
│  - Jito bundle submission                                   │
│  - Zero trace onchain                                       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       Solana                                 │
│              (only sees one-time wallet)                    │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT

---

Built by **VIBÆMAN** 👻
