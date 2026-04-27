import { useState, useEffect, createContext } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import Landing from './components/Landing';
import Trade from './components/Trade';
import Holdings from './components/Holdings';
import AIPanel from './components/AIPanel';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import { useDemoBalance } from './hooks/useDemoBalance';
import { SettingsProvider } from './hooks/useSettings';
import './index.css';

// Context for demo balance
export const DemoBalanceContext = createContext(null);

// Context for wallet type (phantom vs privy)
export const WalletTypeContext = createContext('phantom');

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmogxd3ym004j0cicd87elyrd';

function AppContent() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  
  const [phantomWallet, setPhantomWallet] = useState(null);
  const [walletType, setWalletType] = useState(null); // 'phantom' or 'privy'
  const [activeTab, setActiveTab] = useState('trade');
  const [demoMode, setDemoMode] = useState(() => {
    const saved = localStorage.getItem('ghost_demo_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const demoBalance = useDemoBalance();

  // Save demo mode to localStorage
  useEffect(() => {
    localStorage.setItem('ghost_demo_mode', JSON.stringify(demoMode));
  }, [demoMode]);

  // Hide the HTML preloader when React is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.hidePreloader) {
        window.hidePreloader();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Get the active wallet address
  const getActiveWallet = () => {
    if (walletType === 'phantom' && phantomWallet) {
      return phantomWallet;
    }
    if (walletType === 'privy' && authenticated && wallets.length > 0) {
      // Find Solana wallet from Privy
      const solanaWallet = wallets.find(w => w.walletClientType === 'privy' || w.chainType === 'solana');
      return solanaWallet?.address || null;
    }
    return null;
  };

  const wallet = getActiveWallet();

  // Connect Phantom wallet
  const connectPhantom = async () => {
    try {
      if (window.phantom?.solana) {
        const response = await window.phantom.solana.connect();
        setPhantomWallet(response.publicKey.toString());
        setWalletType('phantom');
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Phantom connection failed:', error);
    }
  };

  // Handle Privy authentication state
  useEffect(() => {
    if (authenticated && wallets.length > 0 && !phantomWallet) {
      setWalletType('privy');
    }
  }, [authenticated, wallets, phantomWallet]);

  // Disconnect wallet
  const disconnectWallet = async () => {
    if (walletType === 'phantom' && window.phantom?.solana) {
      await window.phantom.solana.disconnect();
      setPhantomWallet(null);
    }
    if (walletType === 'privy') {
      await logout();
    }
    setWalletType(null);
    setActiveTab('trade');
  };

  // Show landing if not connected
  if (!wallet) {
    return <Landing onConnect={connectPhantom} />;
  }

  return (
    <WalletTypeContext.Provider value={walletType}>
      <DemoBalanceContext.Provider value={demoBalance}>
        <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
          {/* Wallet Type Banner */}
          {walletType === 'privy' && (
            <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-2 text-center text-cyan-400 text-xs">
              ⚡ Gasless Mode via Privy
            </div>
          )}
          
          {/* Demo Mode Banner */}
          {demoMode && (
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center text-yellow-400 text-xs">
              Demo Mode - Trades are simulated
            </div>
          )}

          {/* Main Content */}
          <main className="max-w-lg mx-auto">
            {activeTab === 'trade' && <Trade wallet={wallet} demoMode={demoMode} walletType={walletType} />}
            {activeTab === 'holdings' && <Holdings wallet={wallet} demoMode={demoMode} walletType={walletType} />}
            {activeTab === 'ai' && <AIPanel wallet={wallet} demoMode={demoMode} walletType={walletType} />}
            {activeTab === 'settings' && (
              <Settings 
                wallet={wallet} 
                onDisconnect={disconnectWallet}
                demoMode={demoMode}
                setDemoMode={setDemoMode}
                walletType={walletType}
                user={user}
              />
            )}
          </main>

          {/* Bottom Navigation */}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </DemoBalanceContext.Provider>
    </WalletTypeContext.Provider>
  );
}

function App() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#00D4AA',
          showWalletLoginFirst: false,
        },
        loginMethods: ['email', 'google', 'twitter'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </PrivyProvider>
  );
}

export default App;
