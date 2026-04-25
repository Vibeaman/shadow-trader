export default function Landing({ onConnect }) {
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
          For the best experience, open this site in the Phantom app browser.
        </p>
      </div>

      {/* Connect Button */}
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
        <span className="text-white font-medium">Phantom</span>
      </button>

      {/* How it works */}
      <div className="mt-12 w-full max-w-sm">
        <h3 className="text-xs font-medium text-gray-500 mb-4 tracking-widest text-center">HOW IT WORKS</h3>
        <div className="space-y-4">
          {[
            { step: '1', text: 'Connect your Phantom wallet' },
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

      {/* Footer */}
      <p className="mt-12 text-xs text-gray-600">
        Powered by Vanish • Built for Colosseum Frontier
      </p>
    </div>
  );
}
