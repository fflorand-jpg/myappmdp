/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to convert ArrayBuffer to Hex String
function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex String to ArrayBuffer
function hexToBuf(hexString: string): ArrayBuffer {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

// Derive AES-GCM key from password with salt using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import raw password as key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive the actual AES-GCM key
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plain text using a master password with PBKDF2 and AES-GCM.
 * Output format: "saltHexValue:ivHexValue:cipherHexValue"
 */
export async function encryptData(plainText: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataToEncrypt = encoder.encode(plainText);

  // Generate random salt (16 bytes) and IV (12 bytes)
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Derive the AES key
  const aesKey = await deriveKey(password, salt);

  // Encrypt the data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    aesKey,
    dataToEncrypt
  );

  const saltHex = bufToHex(salt.buffer);
  const ivHex = bufToHex(iv.buffer);
  const cipherHex = bufToHex(encryptedBuffer);

  return `${saltHex}:${ivHex}:${cipherHex}`;
}

/**
 * Decrypt cipher text using the master password.
 * Input format: "saltHexValue:ivHexValue:cipherHexValue"
 */
export async function decryptData(cipherText: string, password: string): Promise<string> {
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      throw new Error('Format de données chiffrées invalide');
    }

    const saltHex = parts[0];
    const ivHex = parts[1];
    const cipherHex = parts[2];

    const salt = new Uint8Array(hexToBuf(saltHex));
    const iv = new Uint8Array(hexToBuf(ivHex));
    const encryptedData = hexToBuf(cipherHex);

    // Derive the AES key using the same derived salt from storage
    const aesKey = await deriveKey(password, salt);

    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('Mot de passe incorrect ou coffre corrompu.');
  }
}

/**
 * Check if a password is valid. Since PBKDF2 can check decrypt capability, 
 * we can store a specific canary value like "CANARY_OK" in the system 
 * and try to decrypt it to verify the Master Password.
 */
export async function generateCanary(password: string): Promise<string> {
  return await encryptData('COFFRE_FORT_VALIDE', password);
}

export async function verifyCanary(canaryHex: string, password: string): Promise<boolean> {
  try {
    const decrypted = await decryptData(canaryHex, password);
    return decrypted === 'COFFRE_FORT_VALIDE';
  } catch {
    return false;
  }
}
