export default function Landing({ onConnect }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center glow-cyan">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-3">Shadow Trader</h1>
        <p className="text-gray-400 text-lg mb-8 max-w-sm">
          Trade privately on Solana. Zero trace onchain.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">~200ms</div>
            <div className="text-xs text-gray-500">Overhead</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">100%</div>
            <div className="text-xs text-gray-500">Private</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">AI</div>
            <div className="text-xs text-gray-500">Powered</div>
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={onConnect}
          className="w-full max-w-sm py-4 btn-primary text-lg glow-cyan"
        >
          Connect Wallet
        </button>

        {/* How it works */}
        <div className="mt-12 w-full max-w-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-4">HOW IT WORKS</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Connect your Phantom wallet' },
              { step: '2', text: 'Enter trade or AI command' },
              { step: '3', text: 'Vanish routes privately' },
              { step: '4', text: 'No trace left onchain' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-[#1f1f2e] flex items-center justify-center text-sm font-medium text-cyan-400">
                  {item.step}
                </div>
                <span className="text-gray-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-6 text-center text-xs text-gray-600">
        <p>Powered by Vanish • Built for Colosseum Frontier</p>
      </footer>
    </div>
  );
}
