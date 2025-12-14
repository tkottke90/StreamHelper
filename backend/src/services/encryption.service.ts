import { Container, Injectable, InjectionToken } from '@decorators/di';
import * as crypto from 'node:crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // Get encryption key from environment or generate one
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Validate key length (should be 64 hex characters = 32 bytes)
    if (keyString.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    this.key = Buffer.from(keyString, 'hex');
  }

  /**
   * Encrypt a string using AES-256-GCM
   * @param text - Plain text to encrypt
   * @returns Encrypted string in format: iv:authTag:encrypted
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    // @ts-ignore - Node.js crypto type definitions issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cipher: any = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a string encrypted with AES-256-GCM
   * @param encryptedData - Encrypted string in format: iv:authTag:encrypted
   * @returns Decrypted plain text
   */
  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    // @ts-ignore - Node.js crypto type definitions issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decipher: any = crypto.createDecipheriv(this.algorithm, this.key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export const EncryptionServiceIdentifier = new InjectionToken(
  'EncryptionService'
);
Container.provide([
  { provide: EncryptionServiceIdentifier, useClass: EncryptionService }
]);
