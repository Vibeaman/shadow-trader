import { useState, useEffect } from 'react';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Start fade out
          setTimeout(() => setFadeOut(true), 200);
          // Complete after fade
          setTimeout(() => onComplete(), 700);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Ghost Logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 relative animate-float">
          <img 
            src="/ghost-logo.png" 
            alt="Ghost" 
            className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(0,218,233,0.5)]"
          />
        </div>
        {/* Glow ring */}
        <div className="absolute inset-0 -m-4 rounded-full border border-cyan-500/20 animate-ping-slow" />
      </div>

      {/* Brand name */}
      <h1 className="text-3xl font-bold mb-2 tracking-wider">
        <span className="text-white">G</span>
        <span className="text-gray-400">HOST</span>
      </h1>
      <p className="text-gray-500 text-sm mb-8">Private Trading on Solana</p>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-[#1f1f2e] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Loading text */}
      <p className="text-gray-600 text-xs mt-4">
        {progress < 30 && 'Initializing...'}
        {progress >= 30 && progress < 60 && 'Connecting to Solana...'}
        {progress >= 60 && progress < 90 && 'Loading prices...'}
        {progress >= 90 && 'Ready'}
      </p>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
