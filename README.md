# Shadow Trader

AI trading agent that executes strategies without exposing positions, trade sizes, or wallet history onchain.

## The Problem

Every trade you make onchain is public. MEV bots front-run you. Competitors copy your alpha. Your entire trading history is linked to your wallet forever.

## The Solution

Shadow Trader is an AI-powered trading agent with privacy built in:

- **Private Execution** - Trades execute without linking wallet history (Vanish)
- **Encrypted Strategy** - Your trading logic stays hidden (Arcium)
- **AI-Powered** - Natural language commands, automated strategies
- **Solana Native** - Fast, cheap, liquid

## How It Works

```
You: "Buy 1000 USDC worth of SOL when price drops 5%"
     ↓
[AI Agent] interprets intent, creates strategy
     ↓
[Arcium] encrypts strategy parameters
     ↓
[Vanish] executes swap privately
     ↓
You get SOL. No one knows your trade.
```

## Tech Stack

- **Arcium** - Encrypted computation layer
- **Vanish** - Privacy layer for swaps (~200ms overhead)
- **Condor/Hummingbot** - Trading agent framework
- **Phantom** - Wallet connection
- **Solana** - Base layer

## Features

### MVP (Hackathon)
- [ ] Private swaps via Vanish API
- [ ] Basic AI command parsing
- [ ] Wallet connection (Phantom)
- [ ] Simple trading strategies (limit orders, DCA)
- [ ] Web UI dashboard

### Future
- [ ] Encrypted strategy storage (Arcium)
- [ ] Advanced strategies (grid, arbitrage)
- [ ] Multi-wallet support
- [ ] Telegram bot interface
- [ ] Portfolio analytics (private)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  - Wallet connect  - Strategy builder  - Dashboard  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  AI Agent Layer                      │
│  - Intent parsing  - Strategy generation            │
│  - Risk management - Execution planning             │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                 Privacy Layer                        │
│  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │   Arcium    │  │         Vanish              │  │
│  │  (encrypt   │  │  (private swap execution)   │  │
│  │  strategy)  │  │                             │  │
│  └─────────────┘  └─────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                    Solana                            │
│  - Jupiter/DEX aggregators  - Token accounts        │
└─────────────────────────────────────────────────────┘
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your keys

# Run development server
npm run dev
```

## Environment Variables

```
VANISH_API_KEY=
PHANTOM_APP_ID=
OPENAI_API_KEY=
SOLANA_RPC_URL=
```

## Hackathon Submission

**Colosseum Frontier Hackathon** (April 6 - May 11, 2026)

**Tracks:**
- AI
- DeFi
- Infrastructure

**Sponsor Integrations:**
- Arcium (privacy computation)
- Vanish (private swaps - $10K bounty)
- Phantom (wallet)

## Team

Built by VIBÆMAN

## License

MIT
