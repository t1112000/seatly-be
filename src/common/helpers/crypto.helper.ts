import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

// AES encryption constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits

// Use environment variable for encryption key
const getEncryptionKey = (): string => {
  const configService = new ConfigService();
  return (
    configService.get<string>('ENCRYPTION_KEY') ||
    'default-super-secret-key-32-chars!!'
  );
};

// Derive a key from the encryption key using PBKDF2
const deriveKey = (salt: Buffer): Buffer => {
  const encryptionKey = getEncryptionKey();
  return crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha512');
};

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted data as base64 string
 */
export function encryptSensitiveData(text: string): string {
  if (!text) {
    return '';
  }

  try {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from salt
    const key = deriveKey(salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('ClusterAccessToken', 'utf8'));

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex'),
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param encryptedData - Encrypted data as base64 string
 * @returns Decrypted plain text
 */
export function decryptSensitiveData(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  try {
    // Parse base64 data
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH,
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // Derive key from salt
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('ClusterAccessToken', 'utf8'));
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Simple encryption for less sensitive data (backward compatibility)
 * @param text - Plain text to encrypt
 * @returns Encrypted data as base64 string
 */
export function simpleEncrypt(text: string): string {
  if (!text) {
    return '';
  }

  try {
    const encryptionKey = getEncryptionKey();
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return Buffer.from(encrypted, 'hex').toString('base64');
  } catch (error) {
    console.error('Simple encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Simple decryption for less sensitive data (backward compatibility)
 * @param encryptedData - Encrypted data as base64 string
 * @returns Decrypted plain text
 */
export function simpleDecrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  try {
    const encryptionKey = getEncryptionKey();
    const encrypted = Buffer.from(encryptedData, 'base64').toString('hex');
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Simple decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}
