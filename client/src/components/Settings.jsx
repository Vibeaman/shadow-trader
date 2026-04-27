import { useState, useEffect } from 'react';
import { api } from '../config/api';
import { useSettings } from '../hooks/useSettings';

export default function Settings({ wallet, onDisconnect, demoMode, setDemoMode, walletType, user }) {
  const [activeTab, setActiveTab] = useState('General');
  const { settings, updateSetting } = useSettings();
  const [vaultStatus, setVaultStatus] = useState(null);

  // Fetch vault status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.vaultStatus();
        setVaultStatus(data);
      } catch (e) {
        console.log('Vault status unavailable');
      }
    };
    fetchStatus();
  }, []);

  const tabs = ['General', 'Privacy', 'AI', 'About'];

  const Toggle = ({ enabled, onChange, disabled }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`w-12 h-7 rounded-full transition-colors relative ${
        enabled ? 'bg-cyan-500' : 'bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

  const InputField = ({ label, value, onChange, suffix, type = 'text' }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-1.5 text-sm text-right outline-none focus:border-cyan-500"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <img src="/ghost-logo.png" alt="Ghost" className="w-8 h-8 object-contain" />
          <span className="text-lg font-light tracking-[0.2em]">GHOST</span>
        </div>

        {/* Wallet Card */}
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-3">
            {walletType === 'privy' ? (
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            ) : (
              <img src="/phantom-icon.png" alt="Phantom" className="w-10 h-10 rounded-xl" onError={(e) => e.target.style.display='none'} />
            )}
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                {walletType === 'privy' ? 'Privy Wallet' : 'Phantom'}
                {walletType === 'privy' && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">Gasless</span>
                )}
              </div>
              {walletType === 'privy' && user?.email?.address && (
                <div className="text-sm text-gray-500">{user.email.address}</div>
              )}
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
            {walletType === 'privy' ? 'Sign Out' : 'Disconnect Wallet'}
          </button>
        </div>
      </div>

      {/* Settings Title */}
      <div className="px-4 mb-2">
        <h2 className="text-xl font-semibold">Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 border-b border-[#1f1f2e] overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                  <span className="text-sm text-gray-300">Wallet Selection</span>
                  <Toggle enabled={settings.walletSync} onChange={(v) => updateSetting('walletSync', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Quick Buy Amount</span>
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
          <div className="space-y-6">
            {/* Vanish Toggle */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Privacy Layer</h3>
              <div className="card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Vanish Protocol</div>
                      <div className="text-sm text-gray-500">Route trades privately</div>
                    </div>
                  </div>
                  <Toggle enabled={settings.vanishEnabled} onChange={(v) => updateSetting('vanishEnabled', v)} />
                </div>
                
                {settings.vanishEnabled && (
                  <div className="pt-3 border-t border-[#2a2a3a] space-y-3">
                    <InputField 
                      label="Jito Tip" 
                      value={settings.jitoTip} 
                      onChange={(v) => updateSetting('jitoTip', v)}
                      suffix="SOL"
                      type="number"
                    />
                    <InputField 
                      label="Slippage" 
                      value={settings.slippage} 
                      onChange={(v) => updateSetting('slippage', v)}
                      suffix="%"
                      type="number"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Arcium Encryption */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Strategy Encryption</h3>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Arcium MPC</div>
                    <div className="text-sm text-gray-500">
                      {vaultStatus?.isArciumEnabled ? 'Connected to Arcium network' : 'Local encryption only'}
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    vaultStatus?.isArciumEnabled 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {vaultStatus?.isArciumEnabled ? 'Active' : 'Local'}
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Info */}
            <div className="p-4 bg-[#12121a] rounded-xl border border-[#1f1f2e]">
              <h4 className="font-medium mb-2">How Privacy Works</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>- Trades execute via one-time wallets</li>
                <li>- Your main wallet never appears onchain</li>
                <li>- MEV bots can't track your positions</li>
                <li>- Jito tips ensure fast execution</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'AI' && (
          <div className="space-y-6">
            {/* AI Toggle */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">AI Trading Agent</h3>
              <div className="card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">AI Agent</div>
                      <div className="text-sm text-gray-500">Natural language trading</div>
                    </div>
                  </div>
                  <Toggle enabled={settings.aiEnabled} onChange={(v) => updateSetting('aiEnabled', v)} />
                </div>

                {settings.aiEnabled && (
                  <div className="pt-3 border-t border-[#2a2a3a] space-y-4">
                    <InputField 
                      label="Max Trade Size" 
                      value={settings.maxTradeSize} 
                      onChange={(v) => updateSetting('maxTradeSize', v)}
                      suffix="SOL"
                      type="number"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">Require Confirmation</span>
                        <p className="text-xs text-gray-500">Ask before executing trades</p>
                      </div>
                      <Toggle 
                        enabled={settings.requireConfirmation} 
                        onChange={(v) => updateSetting('requireConfirmation', v)} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supported Commands */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Supported Commands</h3>
              <div className="card p-4">
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-cyan-400">-</span>
                    <span>"Buy 0.5 SOL of JUP"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">-</span>
                    <span>"Sell all my BONK"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">-</span>
                    <span>"Buy SOL when it drops 5%"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">-</span>
                    <span>"Alert me if WIF goes above $3"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">-</span>
                    <span>"Show my strategies"</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Risk Warning */}
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-yellow-400">Risk Warning</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    AI trades execute automatically when conditions are met. Always set a max trade size you're comfortable losing.
                  </p>
                </div>
              </div>
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
                  <span className="text-gray-500">AI</span>
                  <span>OpenRouter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Developer</span>
                  <span>VIBÆMAN</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <a href="https://x.com/0xvibeaman" target="_blank" rel="noopener noreferrer" className="flex-1 card p-3 text-center text-sm hover:bg-[#1f1f2e] transition-colors">
                Twitter
              </a>
              <a href="https://github.com/Vibeaman/shadow-trader" target="_blank" rel="noopener noreferrer" className="flex-1 card p-3 text-center text-sm hover:bg-[#1f1f2e] transition-colors">
                GitHub
              </a>
            </div>

            <div className="card p-4">
              <h4 className="font-medium mb-2">Support</h4>
              <p className="text-sm text-gray-400">
                For issues or feature requests, open an issue on GitHub or reach out on Twitter.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
