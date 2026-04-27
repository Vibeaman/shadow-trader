import { usePrivy } from '@privy-io/react-auth';

export default function Landing({ onConnect, onPrivyLogin }) {
  const { login, ready } = usePrivy();

  const handlePrivyLogin = async () => {
    try {
      await login();
      // onPrivyLogin will be called by the parent after privy state updates
    } catch (error) {
      console.error('Privy login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
      {/* Ghost Icon */}
      <div className="mb-6">
        <img 
          src="/ghost-logo.png" 
          alt="Ghost" 
          className="w-16 h-16 object-contain"
        />
      </div>

      {/* Welcome Text */}
      <h1 className="text-2xl font-semibold text-white mb-2">Welcome to Ghost</h1>
      <p className="text-gray-400 text-sm mb-6">Private trading on Solana</p>

      {/* Info Banner */}
      <div className="w-full max-w-sm mb-6 p-4 bg-[#12121a] border border-[#2a2a3a] rounded-xl flex items-start gap-3">
        <div className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-gray-400 text-xs">i</span>
        </div>
        <p className="text-gray-400 text-sm">
          Sign in with email for gasless trading, or connect Phantom for full control.
        </p>
      </div>

      {/* Email Login Button (Privy) */}
      <button
        onClick={handlePrivyLogin}
        disabled={!ready}
        className="w-full max-w-sm py-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 rounded-xl flex items-center justify-center gap-3 transition-all mb-3 disabled:opacity-50"
      >
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-white font-medium">Continue with Email</span>
        <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">Gasless</span>
      </button>

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-[#2a2a3a]"></div>
        <span className="text-gray-500 text-xs">or</span>
        <div className="flex-1 h-px bg-[#2a2a3a]"></div>
      </div>

      {/* Phantom Connect Button */}
      <button
        onClick={onConnect}
        className="w-full max-w-sm py-4 bg-[#1a1a24] hover:bg-[#22222e] border border-[#2a2a3a] rounded-xl flex items-center justify-center gap-3 transition-colors"
      >
        <img 
          src="https://phantom.app/img/phantom-icon-purple.svg" 
          alt="Phantom" 
          className="w-6 h-6"
          onError={(e) => {
            e.target.src = '/phantom-icon.png';
          }}
        />
        <span className="text-white font-medium">Connect Phantom</span>
      </button>

      {/* How it works */}
      <div className="mt-12 w-full max-w-sm">
        <h3 className="text-xs font-medium text-gray-500 mb-4 tracking-widest text-center">HOW IT WORKS</h3>
        <div className="space-y-4">
          {[
            { step: '1', text: 'Sign in with email or wallet' },
            { step: '2', text: 'Enter trade or AI command' },
            { step: '3', text: 'Ghost routes privately via Vanish' },
            { step: '4', text: 'No trace left onchain' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center text-sm font-medium text-cyan-400">
                {item.step}
              </div>
              <span className="text-gray-300 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 w-full max-w-sm grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-lg text-center">
          <span className="text-cyan-400 text-lg">🔒</span>
          <p className="text-xs text-gray-400 mt-1">Private Swaps</p>
        </div>
        <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-lg text-center">
          <span className="text-cyan-400 text-lg">⚡</span>
          <p className="text-xs text-gray-400 mt-1">Gasless Trades</p>
        </div>
        <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-lg text-center">
          <span className="text-cyan-400 text-lg">🤖</span>
          <p className="text-xs text-gray-400 mt-1">AI Commands</p>
        </div>
        <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-lg text-center">
          <span className="text-cyan-400 text-lg">👻</span>
          <p className="text-xs text-gray-400 mt-1">Zero Trace</p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-gray-600">
        Powered by Vanish + Privy • Built for Colosseum Frontier
      </p>
    </div>
  );
}
