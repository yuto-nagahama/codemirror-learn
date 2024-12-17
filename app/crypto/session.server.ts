import { createCipheriv, createDecipheriv } from "crypto";

const algorithm = "aes-256-cbc";
const secretKey = "12345678901234567890123456789012";
const iv = Buffer.from("1234567890123456");

export const encrypt = (data: string) => {
  const cipher = createCipheriv(algorithm, secretKey, iv);
  return Buffer.concat([cipher.update(data, "utf-8"), cipher.final()]).toString(
    "hex"
  );
};

export const decrypt = (data: string) => {
  const decipher = createDecipheriv(algorithm, secretKey, iv);
  return Buffer.concat([
    decipher.update(Buffer.from(data, "hex")),
    decipher.final(),
  ]).toString("utf-8");
};
