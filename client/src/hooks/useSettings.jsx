import { useState, useEffect, createContext, useContext } from 'react';

const SETTINGS_KEY = 'ghost_settings';

const DEFAULT_SETTINGS = {
  // General
  displayCurrency: 'USD',
  topBar: true,
  clipboardBuy: true,
  walletSync: true,
  quickBuySync: true,
  // Privacy
  vanishEnabled: true,
  jitoTip: '0.001', // SOL
  slippage: '1', // percent
  // AI
  aiEnabled: true,
  maxTradeSize: '1', // SOL
  requireConfirmation: true,
};

export const SettingsContext = createContext(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    // Fallback for components not wrapped in provider
    const [settings, setSettings] = useState(() => {
      try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return { ...DEFAULT_SETTINGS, ...(saved ? JSON.parse(saved) : {}) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    });
    return { settings, updateSetting: () => {} };
  }
  return context;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return { ...DEFAULT_SETTINGS, ...(saved ? JSON.parse(saved) : {}) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getSetting = (key) => settings[key];

  // Convert settings to trade params
  const getTradeParams = () => ({
    jitoTip: (parseFloat(settings.jitoTip) * 1e9).toString(), // Convert SOL to lamports
    slippageBps: Math.round(parseFloat(settings.slippage) * 100), // Convert % to basis points
    vanishEnabled: settings.vanishEnabled,
  });

  // Check if trade is within limits
  const checkTradeLimit = (amountSol) => {
    const maxSize = parseFloat(settings.maxTradeSize);
    if (amountSol > maxSize) {
      return {
        allowed: false,
        reason: `Trade size (${amountSol} SOL) exceeds max limit (${maxSize} SOL)`,
      };
    }
    return { allowed: true };
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      getSetting,
      getTradeParams,
      checkTradeLimit,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export { DEFAULT_SETTINGS };
