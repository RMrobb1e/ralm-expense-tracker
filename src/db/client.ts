import * as SQLite from "expo-sqlite";
import {
  BASE_INDEXES_SCHEMA_SQL,
  BASE_TABLES_SCHEMA_SQL,
  DATABASE_NAME,
  LATEST_DATABASE_VERSION,
} from "@/db/schema";
import type { DatabaseColumnInfo, DatabaseSnapshot } from "@/db/types";

let dbInstance: SQLite.SQLiteDatabase | null = null;

type UserVersionRow = {
  user_version: number;
};

type NameRow = {
  name: string;
};

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `);

  await runMigrations(db);
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const currentVersion = await getUserVersion(db);

  if (currentVersion < 1) {
    await db.execAsync(BASE_TABLES_SCHEMA_SQL);
    await setUserVersion(db, 1);
  }

  if (currentVersion < 2) {
    await migrateLegacyExpensesSchema(db);
    await db.execAsync(BASE_INDEXES_SCHEMA_SQL);
    await setUserVersion(db, 2);
  }

  if (currentVersion > LATEST_DATABASE_VERSION) {
    console.warn(
      `[db] Database version ${currentVersion} is newer than supported version ${LATEST_DATABASE_VERSION}.`
    );
  }
}

async function getUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<UserVersionRow>("PRAGMA user_version;");
  return result?.user_version ?? 0;
}

async function setUserVersion(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

async function migrateLegacyExpensesSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<DatabaseColumnInfo>("PRAGMA table_info(expenses);");
  if (!columns.length) return;

  const hasEventIdColumn = columns.some((column) => column.name === "event_id");
  if (hasEventIdColumn) return;

  await db.execAsync(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      created_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO events (id, name, description, start_date, end_date, created_at)
    VALUES ('legacy-event', 'Legacy Imported Expenses', 'Auto-created during schema migration', datetime('now'), NULL, datetime('now'));

    ALTER TABLE expenses RENAME TO expenses_legacy;

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      participant_id TEXT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      incurred_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
    );

    INSERT INTO expenses (id, event_id, participant_id, title, amount, currency, incurred_at, notes, created_at)
    SELECT
      id,
      'legacy-event',
      NULL,
      title,
      amount,
      'USD',
      created_at,
      NULL,
      created_at
    FROM expenses_legacy;

    DROP TABLE expenses_legacy;

    CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_participant_id ON expenses(participant_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_incurred_at ON expenses(incurred_at);

    COMMIT;
  `);
}

export async function getDatabaseSnapshot(): Promise<DatabaseSnapshot> {
  const db = await getDatabase();
  const userVersion = await getUserVersion(db);
  const tablesRows = await db.getAllAsync<NameRow>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
  );
  const tables = tablesRows.map((row) => row.name);
  const details = await Promise.all(
    tables.map(async (table) => {
      const columns = await db.getAllAsync<DatabaseColumnInfo>(`PRAGMA table_info(${table});`);
      return { table, columns };
    })
  );

  return {
    userVersion,
    tables,
    details,
  };
}

export async function logDatabaseSnapshot(): Promise<void> {
  const snapshot = await getDatabaseSnapshot();
  console.log("[db] user_version:", snapshot.userVersion);
  console.log("[db] tables:", snapshot.tables);
  console.log("[db] schema:", JSON.stringify(snapshot.details, null, 2));
}
