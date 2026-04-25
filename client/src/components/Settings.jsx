export default function Settings({ wallet, onDisconnect, demoMode, setDemoMode }) {
  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <h1 className="text-xl font-bold mb-6">Settings</h1>

      {/* Wallet Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">WALLET</h3>
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">Phantom</div>
              <div className="text-sm text-gray-400 truncate">{wallet}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <button
            onClick={onDisconnect}
            className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>

      {/* Mode Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">MODE</h3>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Demo Mode</div>
              <div className="text-sm text-gray-400">Simulates trades without real execution</div>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                demoMode ? 'bg-cyan-500' : 'bg-[#1f1f2e]'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                demoMode ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
          {!demoMode && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-400">
                ⚠️ Live mode requires Vanish API key. Trades will execute on Solana mainnet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">PRIVACY</h3>
        <div className="card divide-y divide-[#1f1f2e]">
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium">Vanish Integration</div>
              <div className="text-sm text-gray-400">All trades routed privately</div>
            </div>
            <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              Active
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium">Arcium Encryption</div>
              <div className="text-sm text-gray-400">Strategy encryption layer</div>
            </div>
            <div className="px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
              Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">RESOURCES</h3>
        <div className="card divide-y divide-[#1f1f2e]">
          <a href="https://core.vanish.trade" target="_blank" className="p-4 flex items-center gap-3 hover:bg-[#1a1a24] transition-colors">
            <span className="flex-1">Vanish Docs</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a href="https://discord.gg/vanishtrade" target="_blank" className="p-4 flex items-center gap-3 hover:bg-[#1a1a24] transition-colors">
            <span className="flex-1">Discord Community</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a href="https://colosseum.com/frontier" target="_blank" className="p-4 flex items-center gap-3 hover:bg-[#1a1a24] transition-colors">
            <span className="flex-1">Colosseum Hackathon</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-600">
        <p>Shadow Trader v1.0.0</p>
        <p className="mt-1">Built for Colosseum Frontier 2026</p>
        <p className="mt-1">By VIBÆMAN</p>
      </div>
    </div>
  );
}
