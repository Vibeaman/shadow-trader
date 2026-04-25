export default function Landing({ onConnect }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Logo + Brand - Trojan style */}
        <div className="flex items-center gap-4 mb-4">
          <img 
            src="/ghost-logo.png" 
            alt="Ghost" 
            className="w-14 h-14 object-contain drop-shadow-[0_0_30px_rgba(0,218,233,0.4)]"
          />
          <h1 className="text-4xl font-light tracking-[0.3em] text-white">GHOST</h1>
        </div>
        
        <p className="text-gray-500 text-sm tracking-widest mb-10">
          PRIVATE TRADING ON SOLANA
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
          <h3 className="text-sm font-medium text-gray-500 mb-4 tracking-widest">HOW IT WORKS</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Connect your Phantom wallet' },
              { step: '2', text: 'Enter trade or AI command' },
              { step: '3', text: 'Ghost routes privately via Vanish' },
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
