import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { readFileSync } from "node:fs";

// Instantiates a client
const client = new SecretManagerServiceClient();

export async function getSecret(name: string, credential?: string) {
  if (process.env.NODE_ENV === "development") {
    return readFileSync(credential ?? "credentials.json", {
      encoding: "utf-8",
    });
  }

  const [secret] = await client.accessSecretVersion({
    name,
  });

  const payload = secret.payload?.data?.toString() ?? "";
  console.log(`payload: ${payload}`);
  return payload;
}

export async function getOAuthSecret(name: string, credential?: string) {
  if (process.env.NODE_ENV === "development") {
    return readFileSync(credential ?? "oauth-credential.json", {
      encoding: "utf-8",
    });
  }

  const [secret] = await client.accessSecretVersion({
    name,
  });

  const payload = secret.payload?.data?.toString() ?? "";
  return payload;
}
