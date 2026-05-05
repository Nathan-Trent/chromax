import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Generate your encryption key with:
 *   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
 * OR:
 *   openssl rand -hex 16
 * Add the result to .env.local as:
 *   SETTINGS_ENCRYPTION_KEY=your32charkey
 *
 * AES-256-CBC expects a 32-byte key — a 32-character hex string is 16 bytes;
 * we derive a 32-byte key from the configured string using scrypt when needed.
 */
const PREFIX = "enc:";

function getKeyBytes(): Buffer | null {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return scryptSync(raw, "chromax-settings", 32);
}

export function encryptValue(plaintext: string): string {
  const key = getKeyBytes();
  if (!key) {
    console.warn(
      "[encrypt] SETTINGS_ENCRYPTION_KEY is not set — storing SMTP password as plain text (development only).",
    );
    return plaintext;
  }
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const inner = `${iv.toString("base64")}:${encrypted.toString("base64")}`;
  return PREFIX + Buffer.from(inner, "utf8").toString("base64");
}

export function decryptValue(stored: string): string {
  if (!stored.startsWith(PREFIX)) {
    return stored;
  }
  const key = getKeyBytes();
  if (!key) {
    console.warn("[decrypt] SETTINGS_ENCRYPTION_KEY is not set — cannot decrypt stored password.");
    return "";
  }
  try {
    const inner = Buffer.from(stored.slice(PREFIX.length), "base64").toString("utf8");
    const colon = inner.indexOf(":");
    if (colon < 0) return "";
    const iv = Buffer.from(inner.slice(0, colon), "base64");
    const data = Buffer.from(inner.slice(colon + 1), "base64");
    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch (e) {
    console.warn("[decrypt] Failed to decrypt settings value:", e);
    return "";
  }
}
