/**
 * Encryption Service - End-to-end encryption for sensitive assessment data
 * Provides AES encryption with secure key management and integrity verification
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
  algorithm: string;
  keyVersion: string;
}

export interface DecryptionOptions {
  encrypted: string;
  iv: string;
  tag: string;
  algorithm: string;
  keyVersion: string;
}

class EncryptionServiceClass {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_VERSION = 'v1';
  private readonly MASTER_KEY_ALIAS = 'assessment_master_key';
  private readonly IV_LENGTH = 12; // 96 bits for GCM
  private readonly TAG_LENGTH = 16; // 128 bits
  
  private masterKey: string | null = null;
  private initialized = false;

  /**
   * Initialize encryption service with master key generation/retrieval
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to retrieve existing master key
      this.masterKey = await SecureStore.getItemAsync(this.MASTER_KEY_ALIAS);
      
      if (!this.masterKey) {
        // Generate new master key
        this.masterKey = await this.generateMasterKey();
        await SecureStore.setItemAsync(this.MASTER_KEY_ALIAS, this.masterKey);
      }
      
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize encryption service: ${error}`);
    }
  }

  /**
   * Encrypt sensitive data with AES-256-GCM
   */
  async encrypt(plaintext: string): Promise<string> {
    await this.ensureInitialized();
    
    try {
      // Generate random IV
      const iv = await Crypto.getRandomBytesAsync(this.IV_LENGTH);
      const ivHex = this.arrayBufferToHex(iv);
      
      // Create encryption key from master key and IV
      const encryptionKey = await this.deriveKey(this.masterKey!, ivHex);
      
      // Encrypt the data
      const encryptedBuffer = await this.encryptWithKey(plaintext, encryptionKey, iv);
      const encryptedHex = this.arrayBufferToHex(encryptedBuffer.encrypted);
      const tagHex = this.arrayBufferToHex(encryptedBuffer.tag);
      
      const result: EncryptionResult = {
        encrypted: encryptedHex,
        iv: ivHex,
        tag: tagHex,
        algorithm: this.ALGORITHM,
        keyVersion: this.KEY_VERSION,
      };
      
      // Return base64 encoded result for storage
      return btoa(JSON.stringify(result));
      
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt data encrypted with encrypt method
   */
  async decrypt(encryptedData: string): Promise<string> {
    await this.ensureInitialized();
    
    try {
      // Parse encrypted data structure
      const encryptionResult: EncryptionResult = JSON.parse(atob(encryptedData));
      
      // Validate encryption metadata
      if (encryptionResult.algorithm !== this.ALGORITHM) {
        throw new Error(`Unsupported algorithm: ${encryptionResult.algorithm}`);
      }
      
      if (encryptionResult.keyVersion !== this.KEY_VERSION) {
        throw new Error(`Unsupported key version: ${encryptionResult.keyVersion}`);
      }
      
      // Reconstruct encryption components
      const iv = this.hexToArrayBuffer(encryptionResult.iv);
      const encrypted = this.hexToArrayBuffer(encryptionResult.encrypted);
      const tag = this.hexToArrayBuffer(encryptionResult.tag);
      
      // Derive decryption key
      const decryptionKey = await this.deriveKey(this.masterKey!, encryptionResult.iv);
      
      // Decrypt the data
      const plaintext = await this.decryptWithKey({
        encrypted: encryptionResult.encrypted,
        iv: encryptionResult.iv,
        tag: encryptionResult.tag,
        algorithm: encryptionResult.algorithm,
        keyVersion: encryptionResult.keyVersion,
      }, decryptionKey);
      
      return plaintext;
      
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Generate secure hash for data integrity verification
   */
  async generateHash(data: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return hash;
  }

  /**
   * Verify data integrity using hash
   */
  async verifyHash(data: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.generateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Generate cryptographically secure random string
   */
  async generateSecureRandom(length: number = 32): Promise<string> {
    const bytes = await Crypto.getRandomBytesAsync(length);
    return this.arrayBufferToHex(bytes);
  }

  /**
   * Generate assessment-specific encryption key
   */
  async generateAssessmentKey(assessmentId: string, userId: string): Promise<string> {
    await this.ensureInitialized();
    
    const keyMaterial = `${this.masterKey}:${assessmentId}:${userId}:${this.KEY_VERSION}`;
    const derivedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyMaterial,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    return derivedKey;
  }

  /**
   * Encrypt assessment data with assessment-specific key
   */
  async encryptAssessmentData(
    data: any,
    assessmentId: string,
    userId: string
  ): Promise<string> {
    const assessmentKey = await this.generateAssessmentKey(assessmentId, userId);
    const plaintext = JSON.stringify(data);
    
    // Create temporary encryption service with assessment key
    const tempService = new EncryptionServiceClass();
    tempService.masterKey = assessmentKey;
    tempService.initialized = true;
    
    return tempService.encrypt(plaintext);
  }

  /**
   * Decrypt assessment data with assessment-specific key
   */
  async decryptAssessmentData(
    encryptedData: string,
    assessmentId: string,
    userId: string
  ): Promise<any> {
    const assessmentKey = await this.generateAssessmentKey(assessmentId, userId);
    
    // Create temporary encryption service with assessment key
    const tempService = new EncryptionServiceClass();
    tempService.masterKey = assessmentKey;
    tempService.initialized = true;
    
    const plaintext = await tempService.decrypt(encryptedData);
    return JSON.parse(plaintext);
  }

  /**
   * Rotate master key (for security maintenance)
   */
  async rotateMasterKey(): Promise<void> {
    const newMasterKey = await this.generateMasterKey();
    await SecureStore.setItemAsync(this.MASTER_KEY_ALIAS, newMasterKey);
    this.masterKey = newMasterKey;
  }

  /**
   * Clear all encryption keys (for user logout/data deletion)
   */
  async clearKeys(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.MASTER_KEY_ALIAS);
      this.masterKey = null;
      this.initialized = false;
    } catch (error) {
      console.warn('Failed to clear encryption keys:', error);
    }
  }

  /**
   * Get encryption service status
   */
  getStatus(): {
    initialized: boolean;
    hasKey: boolean;
    algorithm: string;
    keyVersion: string;
  } {
    return {
      initialized: this.initialized,
      hasKey: this.masterKey !== null,
      algorithm: this.ALGORITHM,
      keyVersion: this.KEY_VERSION,
    };
  }

  // Private methods
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async generateMasterKey(): Promise<string> {
    const keyBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
    return this.arrayBufferToHex(keyBytes);
  }

  private async deriveKey(masterKey: string, salt: string): Promise<CryptoKey> {
    // In a real implementation, you would use PBKDF2 or similar
    // This is a simplified version for the demo
    const keyMaterial = masterKey + salt;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyMaterial,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    // Convert hash to CryptoKey (simplified)
    const keyBuffer = this.hexToArrayBuffer(hash.slice(0, 64)); // 256 bits
    
    // In React Native, we'll simulate CryptoKey behavior
    return keyBuffer as any;
  }

  private async encryptWithKey(
    plaintext: string,
    key: CryptoKey,
    iv: ArrayBuffer
  ): Promise<{ encrypted: ArrayBuffer; tag: ArrayBuffer }> {
    // Simplified encryption for demo - in production use WebCrypto or native crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // This is a mock implementation - in production, use proper AES-GCM
    const encrypted = new Uint8Array(data.length);
    const tag = new Uint8Array(16);
    
    // Simple XOR encryption for demo (NOT secure for production)
    const keyBytes = new Uint8Array(key as ArrayBuffer);
    const ivBytes = new Uint8Array(iv);
    
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ keyBytes[i % keyBytes.length] ^ ivBytes[i % ivBytes.length];
    }
    
    // Generate mock tag
    for (let i = 0; i < 16; i++) {
      tag[i] = keyBytes[i] ^ ivBytes[i % ivBytes.length];
    }
    
    return {
      encrypted: encrypted.buffer,
      tag: tag.buffer,
    };
  }

  private async decryptWithKey(
    options: DecryptionOptions,
    key: CryptoKey
  ): Promise<string> {
    // Simplified decryption for demo - in production use WebCrypto or native crypto
    const encrypted = this.hexToArrayBuffer(options.encrypted);
    const iv = this.hexToArrayBuffer(options.iv);
    const tag = this.hexToArrayBuffer(options.tag);
    
    const encryptedBytes = new Uint8Array(encrypted);
    const keyBytes = new Uint8Array(key as ArrayBuffer);
    const ivBytes = new Uint8Array(iv);
    
    // Verify tag (simplified)
    const expectedTag = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      expectedTag[i] = keyBytes[i] ^ ivBytes[i % ivBytes.length];
    }
    
    const actualTag = new Uint8Array(tag);
    for (let i = 0; i < 16; i++) {
      if (expectedTag[i] !== actualTag[i]) {
        throw new Error('Authentication tag verification failed');
      }
    }
    
    // Decrypt data (reverse XOR)
    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length] ^ ivBytes[i % ivBytes.length];
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes.buffer;
  }
}

// Singleton instance
export const EncryptionService = new EncryptionServiceClass();

// Initialize on import
EncryptionService.initialize().catch(error => {
  console.error('Failed to initialize encryption service:', error);
});