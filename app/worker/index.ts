import sqlite3InitModule, {
  BindingSpec,
  Database,
  FlexibleString,
  Sqlite3Static,
} from "@sqlite.org/sqlite-wasm";
import { expose } from "comlink";
import localforage from "localforage";

declare const self: SharedWorkerGlobalScope;

const log = console.log;
const error = console.error;

let db: Database | null = null;
let sqlite3: Sqlite3Static | null = null;
let jwk: JsonWebKey | null = null;

const USERID = "1";
const CACHE_VERSION = 1;

const start = (sqlite3: Sqlite3Static) => {
  log("Running SQLite3 version", sqlite3.version.libVersion);
  db = new sqlite3.oo1.DB("/report.sqlite3", "ct");

  return db;
};

export const initializeSQLite = async (key: JsonWebKey) => {
  if (db) {
    return db;
  }

  try {
    log("Loading and initializing SQLite3 module...");

    sqlite3 = await sqlite3InitModule({
      print: log,
      printErr: error,
    });
    jwk = key;

    const db = start(sqlite3);
    const reportDb = localforage.createInstance({
      name: "report",
      version: CACHE_VERSION,
    });
    const dbfile = await reportDb.getItem<
      { updatedAt: number; encryptionDb: Uint8Array } | undefined
    >(USERID);

    if (dbfile) {
      const { encryptionDb } = dbfile;
      const importedSecretKey = await getImportKey(jwk);
      const encoder = new TextEncoder();
      const iv = encoder.encode(USERID); // ユーザーIDを使う
      const decryptDbFile = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        importedSecretKey,
        encryptionDb
      );
      const p = sqlite3.wasm.allocFromTypedArray(decryptDbFile);
      sqlite3.capi.sqlite3_deserialize(
        db,
        "main",
        p,
        decryptDbFile.byteLength,
        decryptDbFile.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
      );
    } else {
      await db.exec("pragma encoding = 'UTF-8'");
      await db.exec("pragma page_size = 65536");
      await db.exec("pragma max_page_count = 8589934588");
      await db.exec("pragma cache_size = -10000000");
      await db.exec("pragma synchronous = 'normal'");
      await db.exec(
        "CREATE TABLE IF NOT EXISTS evidence(path text(10000) primary key, data blob not null)"
      );
      await db.exec(
        "CREATE TABLE IF NOT EXISTS report(id text(16) primary key, markdown TEXT(100000))"
      );

      const dbfile = sqlite3?.capi.sqlite3_js_db_export(db);

      if (!dbfile) {
        const error = new Error("Could not retrieve db file.");
        console.error(error);
        throw error;
      }

      await encryption(USERID);
    }

    return db;
  } catch (err: unknown) {
    if (err instanceof Error) {
      error(err.name, err.message);
      throw err;
    }
  }

  throw new Error("unknown error");
};

export const exec = async (sql: any, opts?: any) => {
  if (!db) {
    throw new Error("database is not connected.");
  }

  let result: Database;

  if ("string" === typeof sql) {
    result = db.exec(sql, opts ?? {});
  } else {
    result = db.exec(sql);
  }

  await encryption(USERID);

  return result;
};

export const selectValue = (
  sql: FlexibleString,
  bind?: BindingSpec, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asType?: any
): unknown => {
  if (!db) {
    throw new Error();
  }

  return db.selectValue(sql, bind, asType);
};

const getImportKey = async (key: JsonWebKey) => {
  return crypto.subtle.importKey("jwk", key, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
};

const encryption = async (id: string) => {
  if (!db) {
    throw new Error("db is not connected.");
  }

  const dbfile = sqlite3?.capi.sqlite3_js_db_export(db);

  if (!dbfile) {
    throw new Error("Could not retrieve .db file.");
  }

  if (!jwk) {
    throw new Error("jwk is not defined.");
  }

  const encoder = new TextEncoder();
  const iv = encoder.encode(id); // ユーザーIDを使う
  const importedSecretKey = await getImportKey(jwk);
  const encryptedArrayBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    importedSecretKey,
    dbfile
  );

  const reportDb = localforage.createInstance({
    name: "report",
    version: CACHE_VERSION,
  });
  await reportDb.setItem(id, {
    updatedAt: Date.now(),
    encryptionDb: encryptedArrayBuffer,
  });
};

// self.addEventListener("connect", (event) => {
//   const port = event.ports[0];
//   expose(
//     {
//       initializeSQLite,
//       exec,
//       selectValue,
//     },
//     port
//   );
// });

expose({
  initializeSQLite,
  exec,
  selectValue,
});
