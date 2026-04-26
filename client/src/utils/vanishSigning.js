/**
 * Vanish Signing Utilities
 * Handles message signing for Vanish API authentication
 */

const TOS_HEADER = "By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)";

/**
 * Sign a message using Phantom wallet
 * @param {string} message - Message to sign
 * @returns {Promise<string>} Base64-encoded signature
 */
export async function signWithPhantom(message) {
  if (!window.phantom?.solana) {
    throw new Error('Phantom wallet not found');
  }

  const encodedMessage = new TextEncoder().encode(message);
  const { signature } = await window.phantom.solana.signMessage(encodedMessage, 'utf8');
  
  // Convert Uint8Array to base64
  return btoa(String.fromCharCode(...signature));
}

/**
 * Generate timestamp in milliseconds
 */
export function getTimestamp() {
  return Date.now().toString();
}

/**
 * Create read signature for balance/account endpoints
 */
export async function createReadSignature() {
  const timestamp = getTimestamp();
  const message = `${TOS_HEADER}\n\nDetails: read:${timestamp}`;
  const signature = await signWithPhantom(message);
  return { signature, timestamp };
}

/**
 * Create trade signature
 * @param {Object} params Trade parameters
 */
export async function createTradeSignature({
  sourceToken,
  targetToken,
  amount,
  loanSol = '12000000',
  jitoTip = '1000000',
}) {
  const timestamp = getTimestamp();
  const message = `${TOS_HEADER}\n\nDetails: trade:${sourceToken}:${targetToken}:${amount}:${loanSol}:${timestamp}:${jitoTip}`;
  const signature = await signWithPhantom(message);
  return { signature, timestamp, loanSol, jitoTip };
}

/**
 * Create withdraw signature
 */
export async function createWithdrawSignature({
  tokenAddress,
  amount,
  additionalSol = '2000000',
}) {
  const timestamp = getTimestamp();
  const message = `${TOS_HEADER}\n\nDetails: withdraw:${tokenAddress}:${amount}:${additionalSol}:${timestamp}`;
  const signature = await signWithPhantom(message);
  return { signature, timestamp, additionalSol };
}
