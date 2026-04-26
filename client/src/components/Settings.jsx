import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'ghost_settings';

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export default function Settings({ wallet, onDisconnect, demoMode, setDemoMode }) {
  const [activeTab, setActiveTab] = useState('General');
  const [settings, setSettings] = useState(() => ({
    displayCurrency: 'USD',
    topBar: true,
    clipboardBuy: true,
    walletSync: true,
    quickBuySync: true,
    ...loadSettings(),
  }));

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = ['General', 'Privacy', 'AI', 'About'];

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-12 h-7 rounded-full transition-colors relative ${
        enabled ? 'bg-cyan-500' : 'bg-gray-700'
      }`}
    >
      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
        enabled ? 'left-6' : 'left-1'
      }`} />
    </button>
  );

  const SegmentControl = ({ options, value, onChange }) => (
    <div className="flex bg-[#1a1a24] rounded-lg p-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === opt ? 'bg-[#2a2a3a] text-white' : 'text-gray-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <img src="/ghost-logo.png" alt="Ghost" className="w-8 h-8 object-contain" />
          <span className="text-lg font-light tracking-[0.2em]">GHOST</span>
        </div>

        {/* Wallet Card */}
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-3">
            <img src="/phantom-icon.png" alt="Phantom" className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <div className="font-medium">Phantom</div>
              <div className="text-sm text-gray-500 font-mono">
                {wallet.slice(0, 6)}...{wallet.slice(-6)}
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <button
            onClick={onDisconnect}
            className="w-full mt-3 py-2.5 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>

      {/* Settings Title */}
      <div className="px-4 mb-2">
        <h2 className="text-xl font-semibold">Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 border-b border-[#1f1f2e]">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab 
                ? 'text-white border-white' 
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        {activeTab === 'General' && (
          <div className="space-y-6">
            {/* Data Display Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Data Display</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Top Bar</span>
                  <Toggle enabled={settings.topBar} onChange={(v) => updateSetting('topBar', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Clipboard Buy Button</span>
                  <Toggle enabled={settings.clipboardBuy} onChange={(v) => updateSetting('clipboardBuy', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Display Currency</span>
                  <SegmentControl 
                    options={['USD', 'SOL']} 
                    value={settings.displayCurrency} 
                    onChange={(v) => updateSetting('displayCurrency', v)} 
                  />
                </div>
              </div>
            </div>

            {/* Trade Settings Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Trade Settings Sync</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 underline decoration-dotted underline-offset-4">Wallet Selection</span>
                  <Toggle enabled={settings.walletSync} onChange={(v) => updateSetting('walletSync', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 underline decoration-dotted underline-offset-4">Quick Buy Amount</span>
                  <Toggle enabled={settings.quickBuySync} onChange={(v) => updateSetting('quickBuySync', v)} />
                </div>
              </div>
            </div>

            {/* Mode Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Mode</h3>
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Demo Mode</div>
                    <div className="text-sm text-gray-500">Simulates trades without real execution</div>
                  </div>
                  <Toggle enabled={demoMode} onChange={setDemoMode} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Privacy' && (
          <div className="space-y-4">
            {/* Vanish Integration */}
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium">Vanish Integration</div>
                  <div className="text-sm text-gray-500">All trades routed privately</div>
                </div>
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full">Active</span>
              </div>
            </div>

            {/* Arcium Encryption */}
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium">Arcium Encryption</div>
                  <div className="text-sm text-gray-500">Strategy encryption layer</div>
                </div>
                <span className="px-3 py-1 bg-gray-700 text-gray-400 text-xs font-medium rounded-full">Coming Soon</span>
              </div>
            </div>

            {/* Privacy Info */}
            <div className="mt-6 p-4 bg-[#12121a] rounded-xl border border-[#1f1f2e]">
              <h4 className="font-medium mb-2">How Privacy Works</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Trades execute via one-time wallets</li>
                <li>• Your main wallet never appears onchain</li>
                <li>• MEV bots can't track your positions</li>
                <li>• ~200ms overhead per trade</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'AI' && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium">AI Agent</div>
                  <div className="text-sm text-gray-500">Natural language trading</div>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">Active</span>
              </div>
              <p className="text-sm text-gray-400">
                Type commands like "buy SOL when it drops 5%" and the AI will create automated strategies.
              </p>
            </div>

            <div className="card p-4">
              <h4 className="font-medium mb-2">Supported Commands</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• "Buy [amount] [token]"</li>
                <li>• "Sell all my [token]"</li>
                <li>• "Buy [token] when it drops [X]%"</li>
                <li>• "Sell [token] if it goes above $[price]"</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'About' && (
          <div className="space-y-4">
            <div className="card p-4 text-center">
              <img src="/ghost-logo.png" alt="Ghost" className="w-16 h-16 mx-auto mb-3" />
              <h3 className="text-xl font-light tracking-widest mb-1">GHOST</h3>
              <p className="text-gray-500 text-sm">v1.0.0</p>
            </div>

            <div className="card p-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Built for</span>
                  <span>Colosseum Frontier 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Privacy</span>
                  <span>Vanish Protocol</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Developer</span>
                  <span>VIBÆMAN</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <a href="https://x.com/0xvibeaman" target="_blank" rel="noopener" className="flex-1 card p-3 text-center text-sm hover:bg-[#1f1f2e] transition-colors">
                Twitter
              </a>
              <a href="https://github.com/Vibeaman/shadow-trader" target="_blank" rel="noopener" className="flex-1 card p-3 text-center text-sm hover:bg-[#1f1f2e] transition-colors">
                GitHub
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
