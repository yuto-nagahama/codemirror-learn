import * as metadata from "gcp-metadata";
import { google } from "googleapis";
import { OAuth2Client, TokenPayload } from "google-auth-library";

let aud: string;

async function getAudience() {
  if (aud) return aud;
  if (!(await metadata.isAvailable())) {
    throw new Error("プロジェクトのメタデータが取得できませんでした");
  }

  const projectNumber = await metadata.project("numeric-project-id");
  const projectId = await metadata.project("project-id");

  aud = `/projects/${projectNumber}/apps/${projectId}`;
  return aud;
}

export async function getIapUser(
  client: OAuth2Client,
  iapJwt: string
): Promise<TokenPayload | null> {
  const aud = await getAudience();
  const { pubkeys } = await client.getIapPublicKeys();
  const ticket = await client.verifySignedJwtWithCertsAsync(
    iapJwt,
    pubkeys,
    aud,
    ["https://cloud.google.com/iap"]
  );
  const payload = ticket.getPayload();

  if (!payload) {
    return null;
  }

  return payload;
}

export async function listFiles(auth: OAuth2Client) {
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.list({
    includeTeamDriveItems: true,
    supportsTeamDrives: true,
    corpora: "allDrives",
    // q: `'1Ady4HCzhjbKmQJe6NzFAlEI8FXiDdVYN' in parents`,
    q: 'mimeType = "application/vnd.google-apps.folder" and name contains "shared"',
    pageSize: 999,
    fields: "files(*)",
  });

  const files = res.data.files;

  if (files?.length === 0) {
    console.log("No files found.");
    return;
  }

  console.log("Files:");

  files?.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}

export async function uploadFile(auth: OAuth2Client, body: string) {
  const drive = google.drive({ version: "v3", auth });
  const fileMetadata = {
    name: "template.md",
    parents: ["1Ady4HCzhjbKmQJe6NzFAlEI8FXiDdVYN"],
  };
  const media = {
    mimeType: "text/plain",
    body,
  };
  try {
    const response = await drive.files.create({
      supportsTeamDrives: true,
      requestBody: fileMetadata,
      media,
      fields: "id",
    });
    console.log("File uploaded successfully, file ID:", response.data.id);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}
