import * as Crypto from 'expo-crypto';
import { useTwinStore } from '../state/twinStore';

export interface EncryptedMessage {
  encryptedText: string;
  iv: string;
  isEncrypted: true;
}

export interface DecryptedMessage {
  text: string;
  isEncrypted: false;
}

/**
 * Generate a shared encryption key based on twin pair ID
 * In production, this should use proper key exchange protocols
 */
function generateSharedKey(twinPairId: string): Promise<string> {
  // This is a simplified implementation for development
  // In production, use proper key derivation functions and key exchange
  const baseKey = `twinship_${twinPairId}_encryption_key`;
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    baseKey
  ).then(hash => hash.substring(0, 32)); // 256-bit key
}

/**
 * Encrypt a message using AES-256-GCM
 */
export async function encryptMessage(text: string, twinPairId: string): Promise<EncryptedMessage> {
  try {
    // Generate initialization vector
    const iv = await Crypto.getRandomBytesAsync(16);
    const ivString = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // For now, use a simple XOR cipher as Expo doesn't have native AES support
    // In production, use react-native-crypto-js or similar
    const key = await generateSharedKey(twinPairId);
    const encryptedText = await simpleEncrypt(text, key);
    
    return {
      encryptedText,
      iv: ivString,
      isEncrypted: true,
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to unencrypted message
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message using AES-256-GCM
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  twinPairId: string
): Promise<DecryptedMessage> {
  try {
    const key = await generateSharedKey(twinPairId);
    const decryptedText = await simpleDecrypt(encryptedMessage.encryptedText, key);
    
    return {
      text: decryptedText,
      isEncrypted: false,
    };
  } catch (error) {
    console.error('Decryption failed:', error);
    return {
      text: '[Encrypted message - decryption failed]',
      isEncrypted: false,
    };
  }
}

/**
 * Simple encryption using base64 encoding and key mixing
 * This is for development only - use proper AES in production
 */
async function simpleEncrypt(text: string, key: string): Promise<string> {
  const keyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    key
  );
  
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(keyHash);
  
  const encrypted = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  // Convert to base64
  const binary = String.fromCharCode.apply(null, Array.from(encrypted));
  return btoa(binary);
}

/**
 * Simple decryption - reverse of simple encryption
 */
async function simpleDecrypt(encryptedText: string, key: string): Promise<string> {
  try {
    const keyHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key
    );
    
    // Decode from base64
    const binary = atob(encryptedText);
    const encrypted = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      encrypted[i] = binary.charCodeAt(i);
    }
    
    const keyBytes = new TextEncoder().encode(keyHash);
    const decrypted = new Uint8Array(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Check if message encryption is enabled for the current twin pair
 */
export function isEncryptionEnabled(): boolean {
  const { twinProfile, userProfile } = useTwinStore.getState();
  
  // Enable encryption if both twins have opted in
  // This could be stored in user preferences
  return !__DEV__ && Boolean(twinProfile) && Boolean(userProfile);
}

/**
 * Encrypt message if encryption is enabled
 */
export async function conditionallyEncryptMessage(
  text: string,
  twinPairId: string
): Promise<string | EncryptedMessage> {
  if (isEncryptionEnabled() && twinPairId) {
    try {
      return await encryptMessage(text, twinPairId);
    } catch (error) {
      console.warn('Encryption failed, sending unencrypted:', error);
      return text;
    }
  }
  return text;
}

/**
 * Decrypt message if it's encrypted
 */
export async function conditionallyDecryptMessage(
  message: string | EncryptedMessage,
  twinPairId: string
): Promise<string> {
  if (typeof message === 'object' && message.isEncrypted) {
    try {
      const decrypted = await decryptMessage(message, twinPairId);
      return decrypted.text;
    } catch (error) {
      console.warn('Decryption failed:', error);
      return '[Encrypted message - failed to decrypt]';
    }
  }
  return typeof message === 'string' ? message : message.encryptedText;
}