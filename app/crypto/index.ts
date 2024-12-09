export const generateSalt = () => {
  const storageSalt = localStorage.getItem("salt");

  if (storageSalt) {
    return Uint8Array.from(JSON.parse(storageSalt));
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem("salt", JSON.stringify(Array.from(salt)));

  return salt;
};

export const generateJwkFromUserId = async (id: string, salt: Uint8Array) => {
  const encoder = new TextEncoder();

  // ユーザーIDをキーに変換
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(id),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // 鍵を派生
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000, // ストレッチング
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return jwk;
};
