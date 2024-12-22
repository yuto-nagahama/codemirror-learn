import { readFileSync } from "node:fs";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

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
