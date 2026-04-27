import { useState, useEffect, createContext } from 'react';
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

function App() {
  const [wallet, setWallet] = useState(() => {
    // Try to restore wallet from localStorage
    return localStorage.getItem('ghost_wallet') || null;
  });
  const [activeTab, setActiveTab] = useState('trade');
  const [demoMode, setDemoMode] = useState(() => {
    const saved = localStorage.getItem('ghost_demo_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isReconnecting, setIsReconnecting] = useState(false);
  const demoBalance = useDemoBalance();

  // Save wallet to localStorage when it changes
  useEffect(() => {
    if (wallet) {
      localStorage.setItem('ghost_wallet', wallet);
    } else {
      localStorage.removeItem('ghost_wallet');
    }
  }, [wallet]);

  // Save demo mode to localStorage
  useEffect(() => {
    localStorage.setItem('ghost_demo_mode', JSON.stringify(demoMode));
  }, [demoMode]);

  // Reconnect function - used on page load and visibility change
  const reconnect = async () => {
    const savedWallet = localStorage.getItem('ghost_wallet');
    if (!savedWallet) return false;
    
    // Wait for Phantom to be available
    let attempts = 0;
    while (!window.phantom?.solana && attempts < 10) {
      await new Promise(r => setTimeout(r, 200));
      attempts++;
    }
    
    if (!window.phantom?.solana) {
      console.log('[Wallet] Phantom not available');
      return false;
    }
    
    try {
      // Check if already connected
      if (window.phantom.solana.isConnected) {
        const pubkey = window.phantom.solana.publicKey?.toString();
        if (pubkey) {
          console.log('[Wallet] Already connected:', pubkey);
          setWallet(pubkey);
          return true;
        }
      }
      
      // Try to reconnect silently (eagerly)
      const response = await window.phantom.solana.connect({ onlyIfTrusted: true });
      const connectedWallet = response.publicKey.toString();
      setWallet(connectedWallet);
      console.log('[Wallet] Reconnected:', connectedWallet);
      return true;
    } catch (e) {
      console.log('[Wallet] Auto-reconnect failed:', e.message);
      // Don't clear wallet - user might still want to try manual reconnect
      return false;
    }
  };

  // Auto-reconnect to Phantom on page load
  useEffect(() => {
    const init = async () => {
      const savedWallet = localStorage.getItem('ghost_wallet');
      if (savedWallet) {
        setIsReconnecting(true);
        await reconnect();
        setIsReconnecting(false);
      }
    };
    init();
  }, []);

  // Reconnect when page becomes visible (mobile tab switching)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && localStorage.getItem('ghost_wallet')) {
        console.log('[Wallet] Page visible, checking connection...');
        await reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Listen for Phantom disconnect events
  useEffect(() => {
    if (window.phantom?.solana) {
      const handleDisconnect = () => {
        console.log('[Wallet] Disconnected by Phantom');
        setWallet(null);
        localStorage.removeItem('ghost_wallet');
      };

      const handleAccountChanged = (publicKey) => {
        if (publicKey) {
          console.log('[Wallet] Account changed:', publicKey.toString());
          setWallet(publicKey.toString());
        } else {
          handleDisconnect();
        }
      };

      window.phantom.solana.on('disconnect', handleDisconnect);
      window.phantom.solana.on('accountChanged', handleAccountChanged);

      return () => {
        window.phantom.solana.off('disconnect', handleDisconnect);
        window.phantom.solana.off('accountChanged', handleAccountChanged);
      };
    }
  }, []);

  // Hide the HTML preloader when React is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.hidePreloader) {
        window.hidePreloader();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Connect Phantom wallet
  const connectWallet = async () => {
    try {
      if (window.phantom?.solana) {
        const response = await window.phantom.solana.connect();
        const connectedWallet = response.publicKey.toString();
        setWallet(connectedWallet);
        console.log('[Wallet] Connected:', connectedWallet);
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    if (window.phantom?.solana) {
      await window.phantom.solana.disconnect();
    }
    setWallet(null);
    localStorage.removeItem('ghost_wallet');
    setActiveTab('trade');
  };

  // Show loading while reconnecting
  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <img src="/ghost-logo.png" alt="Ghost" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Reconnecting wallet...</p>
        </div>
      </div>
    );
  }

  // Show landing if not connected
  if (!wallet) {
    return <Landing onConnect={connectWallet} />;
  }

  return (
    <SettingsProvider>
      <DemoBalanceContext.Provider value={demoBalance}>
        <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
          {/* Demo Mode Banner */}
          {demoMode && (
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center text-yellow-400 text-xs">
              Demo Mode - Trades are simulated
            </div>
          )}

          {/* Main Content */}
          <main className="max-w-lg mx-auto">
            {activeTab === 'trade' && <Trade wallet={wallet} demoMode={demoMode} />}
            {activeTab === 'holdings' && <Holdings wallet={wallet} demoMode={demoMode} />}
            {activeTab === 'ai' && <AIPanel wallet={wallet} demoMode={demoMode} />}
            {activeTab === 'settings' && (
              <Settings 
                wallet={wallet} 
                onDisconnect={disconnectWallet}
                demoMode={demoMode}
                setDemoMode={setDemoMode}
              />
            )}
          </main>

          {/* Bottom Navigation */}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </DemoBalanceContext.Provider>
    </SettingsProvider>
  );
}

export default App;
