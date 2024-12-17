import * as metadata from "gcp-metadata";
import { Credentials, OAuth2Client } from "google-auth-library";
import { getSecret } from "~/secret";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive",
];
let oAuthClient: OAuth2Client | null = null;

export async function getOAuthClient() {
  if (oAuthClient) {
    return oAuthClient;
  }

  const projectNumber = await metadata.project("numeric-project-id");
  const secretName = `projects/${projectNumber}/secrets/oauth-credential/versions/latest`;
  const secret = await getSecret(secretName);
  const credentials = JSON.parse(secret);
  const redirectUri =
    process.env.NODE_ENV === "development"
      ? credentials.web.redirect_uris.at(1)
      : credentials.web.redirect_uris.at(0);
  oAuthClient = new OAuth2Client(
    credentials.web.client_id,
    credentials.web.client_secret,
    redirectUri
  );

  return oAuthClient;
}

export function getOAuthGenerateUrl(client: OAuth2Client, state?: string) {
  if (!oAuthClient) {
    throw new Error("Auth Error: oAuthClient is null.");
  }

  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
  });
}

export async function getCredentials(client: OAuth2Client, code: string) {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return client.credentials;
}

export async function refreshCredentials(
  client: OAuth2Client,
  credentials: Credentials
) {
  client.setCredentials(credentials);
  await client.refreshAccessToken();
  return client.credentials;
}
