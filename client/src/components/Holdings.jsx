import { useState, useEffect, useContext } from 'react';
import { DemoBalanceContext } from '../App';
import { api } from '../config/api';
import { createReadSignature, createWithdrawSignature } from '../utils/vanishSigning';

// Token metadata
const TOKEN_INFO = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9, image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
  '11111111111111111111111111111111': { symbol: 'SOL', name: 'Solana', decimals: 9, image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6, image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether', decimals: 6, image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png' },
};

// Prices (would come from API in production)
const PRICES = { SOL: 148, USDC: 1, USDT: 1 };

export default function Holdings({ wallet, demoMode, walletType }) {
  const [holdings, setHoldings] = useState([]);
  const [vanishHoldings, setVanishHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositToken, setDepositToken] = useState('SOL');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawToken, setWithdrawToken] = useState('SOL');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const demoBalance = useContext(DemoBalanceContext);

  // Fetch wallet balance from Solana (works for both Phantom and Privy wallets)
  const fetchWalletBalance = async () => {
    if (!wallet) return;
    
    // Skip if it's an Ethereum address (0x prefix)
    if (wallet.startsWith('0x')) {
      console.log('Ethereum address detected, skipping Solana balance fetch');
      return;
    }
    
    try {
      const { Connection, PublicKey } = await import('@solana/web3.js');
      const connection = new Connection(
        'https://api.mainnet-beta.solana.com',
        'confirmed'
      );
      const pubkey = new PublicKey(wallet);
      
      // Get SOL balance
      const solBalance = await connection.getBalance(pubkey);
      const solAmount = solBalance / 1e9;
      
      const walletHoldings = [{
        symbol: 'SOL',
        name: 'Solana',
        balance: solAmount,
        value: solAmount * PRICES.SOL,
        change: 0,
        image: TOKEN_INFO['So11111111111111111111111111111111111111112'].image,
        isWallet: true,
      }];
      
      setHoldings(walletHoldings);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  // Fetch Vanish balance - only when user explicitly requests (requires signature)
  const fetchVanishBalance = async (forceSign = false) => {
    if (!wallet) return;
    
    // Skip auto-fetch to avoid signature popup on every page load
    // User can click refresh to sign and fetch Vanish balance
    if (!forceSign) {
      console.log('[Holdings] Skipping Vanish balance (requires signature)');
      return;
    }
    
    try {
      const { signature, timestamp } = await createReadSignature();
      const data = await api.getBalance(wallet, signature, timestamp);
      
      if (Array.isArray(data)) {
        const vanishHolds = data.map(item => {
          const info = TOKEN_INFO[item.token_address] || { symbol: 'UNKNOWN', name: 'Unknown', decimals: 9 };
          const balance = parseFloat(item.balance) / Math.pow(10, info.decimals);
          return {
            symbol: info.symbol,
            name: info.name,
            balance,
            value: balance * (PRICES[info.symbol] || 0),
            change: 0,
            image: info.image || '',
            isVanish: true,
          };
        }).filter(h => h.balance > 0);
        
        setVanishHoldings(vanishHolds);
      }
    } catch (error) {
      if (error.message?.includes('User rejected')) {
        console.log('[Holdings] User cancelled signature');
      } else {
        console.error('Failed to fetch Vanish balance:', error);
      }
    }
  };

  // Fetch all balances (wallet only by default, Vanish requires manual refresh)
  const fetchAll = async (includeVanish = false) => {
    if (demoMode) {
      if (demoBalance) {
        setHoldings(demoBalance.getHoldings());
      }
      return;
    }
    
    setLoading(true);
    // Only fetch wallet balance automatically (no signature required)
    await fetchWalletBalance();
    // Vanish balance only when explicitly requested (requires signature)
    if (includeVanish) {
      await fetchVanishBalance(true);
    }
    setLoading(false);
  };

  // Auto-fetch wallet balance on mount (no signature needed)
  useEffect(() => {
    fetchAll(false);
  }, [wallet, demoMode]);

  // Get deposit address
  const handleDeposit = async () => {
    setActionLoading(true);
    setMessage('');
    try {
      const tokenAddress = depositToken === 'SOL' 
        ? '11111111111111111111111111111111' 
        : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      
      const data = await api.getDepositAddress(tokenAddress);
      setDepositAddress(data.address);
      setMessage(`Send ${depositToken} to this address. After sending, the balance will appear in your Vanish holdings.`);
    } catch (error) {
      setMessage('Failed to get deposit address: ' + error.message);
    }
    setActionLoading(false);
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!withdrawAmount || !wallet) return;
    
    setActionLoading(true);
    setMessage('');
    try {
      const tokenAddress = withdrawToken === 'SOL' 
        ? '11111111111111111111111111111111' 
        : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      
      const decimals = withdrawToken === 'SOL' ? 9 : 6;
      const amountInBaseUnits = Math.floor(parseFloat(withdrawAmount) * Math.pow(10, decimals)).toString();
      
      // Sign the withdraw request with Phantom
      setMessage('Please sign the withdraw request in your wallet...');
      const { signature, timestamp, additionalSol } = await createWithdrawSignature({
        tokenAddress,
        amount: amountInBaseUnits,
      });
      
      // Call withdraw API
      const result = await api.withdraw({
        userAddress: wallet,
        tokenAddress,
        amount: amountInBaseUnits,
        additionalSol,
        timestamp,
        userSignature: signature,
      });
      
      if (result.success) {
        setMessage(`Withdrawal initiated! TX: ${result.txId?.slice(0, 8)}... Check your wallet shortly.`);
        setWithdrawAmount('');
        // Refresh balances after a delay
        setTimeout(() => fetchAll(true), 3000);
      } else {
        setMessage('Withdraw failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      if (error.message?.includes('User rejected')) {
        setMessage('Signature cancelled');
      } else {
        setMessage('Withdraw failed: ' + error.message);
      }
    }
    setActionLoading(false);
  };

  // Calculate totals
  const walletTotal = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
  const vanishTotal = vanishHoldings.reduce((sum, h) => sum + (h.value || 0), 0);
  const totalValue = demoMode && demoBalance 
    ? demoBalance.getTotalValue() 
    : walletTotal + vanishTotal;

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Holdings</h1>
        <button
          onClick={() => fetchAll(true)}
          disabled={loading}
          className="p-2 rounded-lg bg-[#1f1f2e] hover:bg-[#2a2a3a] transition-colors"
        >
          <svg className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Total Value Card */}
      <div className="card p-6 mb-6 text-center">
        <p className="text-gray-400 text-sm mb-1">Total Balance</p>
        <h2 className="text-4xl font-bold mb-2">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        {!demoMode && vanishTotal > 0 && (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-cyan-400">${vanishTotal.toFixed(2)} in Vanish (private)</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-xl" style={{ backgroundColor: '#0C0D10' }}>
        <button 
          onClick={() => { setShowWithdraw(true); setShowDeposit(false); }}
          className="h-12 rounded-xl text-white font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: 'rgba(42, 45, 53, 0.8)' }}
        >
          Withdraw
        </button>
        <button 
          onClick={() => { setShowDeposit(true); setShowWithdraw(false); }}
          className="h-12 rounded-xl text-white font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: '#214D2B' }}
        >
          Deposit
        </button>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Deposit to Vanish</h3>
            <button onClick={() => setShowDeposit(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Token</label>
            <select 
              value={depositToken}
              onChange={(e) => setDepositToken(e.target.value)}
              className="w-full bg-[#1f1f2e] border border-[#2a2a3a] rounded-lg p-3 outline-none"
            >
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
            </select>
          </div>

          <button
            onClick={handleDeposit}
            disabled={actionLoading}
            className="w-full py-3 rounded-xl bg-green-500 text-white font-medium disabled:opacity-50"
          >
            {actionLoading ? 'Getting address...' : 'Get Deposit Address'}
          </button>

          {depositAddress && (
            <div className="mt-4 p-3 bg-[#1f1f2e] rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Send {depositToken} to:</p>
              <p className="text-sm font-mono break-all text-cyan-400">{depositAddress}</p>
              <button
                onClick={() => navigator.clipboard.writeText(depositAddress)}
                className="mt-2 text-xs text-gray-400 hover:text-white"
              >
                Copy address
              </button>
            </div>
          )}

          {message && (
            <p className="mt-3 text-xs text-gray-400">{message}</p>
          )}
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Withdraw from Vanish</h3>
            <button onClick={() => setShowWithdraw(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Token</label>
            <select 
              value={withdrawToken}
              onChange={(e) => setWithdrawToken(e.target.value)}
              className="w-full bg-[#1f1f2e] border border-[#2a2a3a] rounded-lg p-3 outline-none"
            >
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Amount</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#1f1f2e] border border-[#2a2a3a] rounded-lg p-3 outline-none"
            />
          </div>

          <button
            onClick={handleWithdraw}
            disabled={actionLoading || !withdrawAmount}
            className="w-full py-3 rounded-xl bg-purple-500 text-white font-medium disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Withdraw'}
          </button>

          {message && (
            <p className="mt-3 text-xs text-gray-400">{message}</p>
          )}
        </div>
      )}

      {/* Wallet Holdings */}
      {!demoMode && holdings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">WALLET</h3>
          <div className="space-y-2">
            {holdings.map((holding, index) => (
              <HoldingCard key={`wallet-${index}`} holding={holding} />
            ))}
          </div>
        </div>
      )}

      {/* Vanish Holdings */}
      {!demoMode && vanishHoldings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            VANISH BALANCE
            <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </h3>
          <div className="space-y-2">
            {vanishHoldings.map((holding, index) => (
              <HoldingCard key={`vanish-${index}`} holding={holding} />
            ))}
          </div>
        </div>
      )}

      {/* Demo Holdings */}
      {demoMode && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">DEMO ASSETS</h3>
          <div className="space-y-2">
            {(demoBalance ? demoBalance.getHoldings() : []).map((holding, index) => (
              <HoldingCard key={`demo-${index}`} holding={holding} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!demoMode && holdings.length === 0 && vanishHoldings.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1f1f2e] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-400 mb-4">No holdings found</p>
          <p className="text-sm text-gray-500">Connect wallet or deposit to Vanish to start</p>
        </div>
      )}
    </div>
  );
}

// Holding card component
function HoldingCard({ holding }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <img
        src={holding.image || `https://ui-avatars.com/api/?name=${holding.symbol}&background=1f1f2e&color=fff&size=40`}
        alt={holding.symbol}
        className="w-10 h-10 rounded-full bg-[#1f1f2e]"
        onError={(e) => {
          e.target.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=1f1f2e&color=fff&size=40`;
        }}
      />
      <div className="flex-1">
        <div className="font-medium flex items-center gap-2">
          {holding.symbol}
          {holding.isVanish && (
            <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">Private</span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {holding.balance?.toLocaleString(undefined, { maximumFractionDigits: 6 })} {holding.symbol}
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">${(holding.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
}
