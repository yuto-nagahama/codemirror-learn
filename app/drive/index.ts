import { google } from "googleapis";
import { googleDriveToken } from "~/cookie";
import { getSecret } from "~/secret";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.appfolder",
];

async function saveCredentials(client: any) {
  const content = await getSecret();
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });

  await googleDriveToken.serialize(payload);
}

export async function authorize(cookieString: string | null) {
  let client = await googleDriveToken.parse(cookieString);

  if (client) {
    return client;
  }

  client = new google.auth.GoogleAuth({
    credentials: JSON.parse(await getSecret()),
    scopes: SCOPES,
  });

  if (client.credentials) {
    await saveCredentials(client);
  }

  return client;
}

export async function listFiles(authClient: any) {
  const drive = google.drive({ version: "v3", auth: authClient });
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

export async function uploadFile(authClient: any, text: string) {
  const drive = google.drive({ version: "v3", auth: authClient });
  const res = await drive.files.list({
    includeTeamDriveItems: true,
    supportsTeamDrives: true,
    corpora: "allDrives",
    q: "mimeType = 'application/vnd.google-apps.folder' and name = 'shared'",
    pageSize: 999,
    fields: "files(id)",
  });

  const files = res.data.files;
  console.log(files);

  if (files?.length === 0 || !files) {
    console.log("No files found.");
    return;
  }
  console.log(files[0]);

  const fileMetadata = {
    name: "template.md",
    parents: [files[0].id ?? ""],
    mimeType: "text/plain",
  };
  const media = {
    mimeType: "text/plain",
    body: text,
  };
  await drive.files.create({
    requestBody: fileMetadata,
    media,
  });
}
