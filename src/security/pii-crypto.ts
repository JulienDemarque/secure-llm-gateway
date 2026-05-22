import { createCipheriv, randomBytes } from "node:crypto";

const IV_LENGTH = 12;
const KEY_LENGTH = 32;

type EncryptionMaterial = {
  key: Buffer;
  keyId: string;
};

/** Loads and validates encryption key material used for reversible PII redaction. */
function getEncryptionMaterial(): EncryptionMaterial {
  const keyB64 = process.env.PII_ENCRYPTION_KEY_B64;
  const keyId = process.env.PII_ENCRYPTION_KEY_ID;
  if (!keyB64 || !keyId) {
    throw new Error("pii-encryption-not-configured");
  }

  const key = Buffer.from(keyB64, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error("pii-encryption-key-invalid-length");
  }
  return { key, keyId };
}

/** Encrypts raw PII value with AES-256-GCM for audit-path-only reversibility. */
export function encryptPiiValue(value: string): {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
} {
  const { key, keyId } = getEncryptionMaterial();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    keyId
  };
}
