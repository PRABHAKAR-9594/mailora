import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-cbc";

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  // Only throw at runtime in server context, not during build
  if (process.env.NODE_ENV !== "test") {
    console.warn("ENCRYPTION_KEY must be at least 32 characters long.");
  }
}

// Derive a 32-byte key from the env string
function getKey(): Buffer {
  return crypto.scryptSync(ENCRYPTION_KEY, "mailora-salt", 32);
}

export function encrypt(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  // Return iv:encryptedData as hex
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(encryptedText: string): string {
  const key = getKey();
  const [ivHex, encryptedHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
