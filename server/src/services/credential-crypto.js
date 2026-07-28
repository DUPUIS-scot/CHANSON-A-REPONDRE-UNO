import crypto from 'node:crypto';

const algorithm = 'aes-256-gcm';
const version = 1;

function encryptionKey(encodedKey) {
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new Error('Credential encryption is unavailable.');
  return key;
}

export function encryptCredential(plaintext, encodedKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey(encodedKey), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return {
    version,
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptCredential(record, encodedKey) {
  if (record.encryption_version !== version) {
    throw new Error('Unsupported credential encryption version.');
  }
  const decipher = crypto.createDecipheriv(
    algorithm,
    encryptionKey(encodedKey),
    Buffer.from(record.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(record.auth_tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(record.encrypted_key, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

export function maskCredential(value) {
  const prefix = value.startsWith('sk-proj-') ? 'sk-proj-' : 'sk-';
  const suffix = value.slice(-4);
  return `${prefix}${'•'.repeat(8)}${suffix}`;
}
