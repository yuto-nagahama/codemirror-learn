import sqlite3InitModule, {
  BindingSpec,
  Database,
  FlexibleString,
  Sqlite3Static,
} from "@sqlite.org/sqlite-wasm";
import localforage from "localforage";

const log = console.log;
const error = console.error;

let db: Database | null = null;
let sqlite3: Sqlite3Static | null = null;

const start = (sqlite3: Sqlite3Static) => {
  log("Running SQLite3 version", sqlite3.version.libVersion);
  db = new sqlite3.oo1.DB("/report.sqlite3", "ct");

  return db;
};

export const initializeSQLite = async () => {
  if (db) {
    return db;
  }

  try {
    log("Loading and initializing SQLite3 module...");

    sqlite3 = await sqlite3InitModule({
      print: log,
      printErr: error,
    });

    const db = start(sqlite3);
    const dbfile = await localforage.getItem<Uint8Array>("1");

    if (dbfile) {
      const p = sqlite3.wasm.allocFromTypedArray(dbfile);
      sqlite3.capi.sqlite3_deserialize(
        db,
        "main",
        p,
        dbfile.byteLength,
        dbfile.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
      );
    } else {
      await db.exec("pragma encoding = 'UTF-8'");
      await db.exec("pragma page_size = 65536");
      await db.exec("pragma max_page_count = 8589934588");
      await db.exec("pragma cache_size = -10000000");
      await db.exec("pragma synchronous = 'normal'");

      await db.exec(
        "CREATE TABLE IF NOT EXISTS report(id text primary key, markdown TEXT(100000))"
      );

      const dbfile = sqlite3?.capi.sqlite3_js_db_export(db);

      if (!dbfile) {
        const error = new Error("Could not retrieve db file.");
        console.error(error);
        throw error;
      }

      await localforage.setItem("1", dbfile);
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

  const dbfile = sqlite3?.capi.sqlite3_js_db_export(db);

  if (!dbfile) {
    const error = new Error("Could not retrieve db file.");
    console.error(error);
    throw error;
  }

  await localforage.setItem("1", dbfile);

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

export const dataExport = async () => {
  if (!db) {
    throw new Error("db is not connected.");
  }

  const dbfile = sqlite3?.capi.sqlite3_js_db_export(db);

  if (!dbfile) {
    throw new Error("Could not retrieve .db file.");
  }

  await localforage.setItem("1", dbfile);
};
