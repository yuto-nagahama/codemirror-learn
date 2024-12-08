import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { readFileSync } from "node:fs";

const name =
  "projects/1093370138563/secrets/drive-api-credentials/versions/latest";

// Instantiates a client
const client = new SecretManagerServiceClient();

export async function getSecret() {
  if (process.env.NODE_ENV === "development") {
    return readFileSync("credentials.json", { encoding: "utf-8" });
  }

  const [secret] = await client.accessSecretVersion({
    name: name,
  });

  const payload = secret.payload?.data?.toString() ?? "";
  console.log(`payload: ${payload}`);
  return payload;
}
