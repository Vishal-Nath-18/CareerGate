import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const rawKey = process.env.ENCRYPTION_KEY;
if (!rawKey) throw new Error("ENCRYPTION_KEY is not set in environment variables");
const KEY = Buffer.from(rawKey, "hex");

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString("hex"),
    encrypted: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  });
}

export function decrypt(stored: string): string {
  const { iv, encrypted, tag } = JSON.parse(stored);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
