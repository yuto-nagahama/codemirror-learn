import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const credential = JSON.parse(
  await readFileSync("firebase-admin-credential.json", {
    encoding: "utf-8",
  })
);

// Firebaseアプリの初期化
admin.initializeApp({
  credential: admin.credential.cert(credential),
});

// OIDCプロバイダのユーザーを追加する関数
async function createUserWithOIDC(email: string, oidcProvider: string) {
  try {
    const firebaseAuth = admin.auth();
    // ユーザーの作成
    const userRecord = await firebaseAuth.createUser({
      email: email,
      providerToLink: {
        providerId: oidcProvider,
      },
    });
    console.log("Successfully created new user:", userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error("Error creating new user:", error);
  }
}

// 使用例
const email = "nagahama3201@gmail.com";
const oidcProvider = "oidc.sandbox2";

await createUserWithOIDC(email, oidcProvider);
