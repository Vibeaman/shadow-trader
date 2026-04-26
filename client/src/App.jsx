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
  const [wallet, setWallet] = useState(null);
  const [activeTab, setActiveTab] = useState('trade');
  const [demoMode, setDemoMode] = useState(() => {
    // Load demo mode from localStorage
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

  const connectWallet = async () => {
    try {
      if (window.phantom?.solana) {
        const response = await window.phantom.solana.connect();
        setWallet(response.publicKey.toString());
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const disconnectWallet = () => {
    if (window.phantom?.solana) {
      window.phantom.solana.disconnect();
    }
    setWallet(null);
    setActiveTab('trade');
  };

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
