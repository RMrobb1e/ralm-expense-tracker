import * as SQLite from "expo-sqlite";
import {
  BASE_INDEXES_SCHEMA_SQL,
  BASE_TABLES_SCHEMA_SQL,
  DATABASE_NAME,
  LATEST_DATABASE_VERSION,
} from "@/db/schema";
import type { DatabaseColumnInfo, DatabaseSnapshot } from "@/db/types";
import type { Participant } from "@/db/types";
import type {
  AddExpenseFormInput,
  EventExpenseListItem,
} from "@/features/expenses/types/event-expense.types";
import type {
  CreateEventInput,
  EventItem,
  UpdateEventInput,
} from "@/features/events/types/event.types";

let dbInstance: SQLite.SQLiteDatabase | null = null;

type UserVersionRow = {
  user_version: number;
};

type NameRow = {
  name: string;
};

type EventRow = {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
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
      `[db] Database version ${currentVersion} is newer than supported version ${LATEST_DATABASE_VERSION}.`,
    );
  }
}

async function getUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<UserVersionRow>("PRAGMA user_version;");
  return result?.user_version ?? 0;
}

async function setUserVersion(
  db: SQLite.SQLiteDatabase,
  version: number,
): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

async function migrateLegacyExpensesSchema(
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  const columns = await db.getAllAsync<DatabaseColumnInfo>(
    "PRAGMA table_info(expenses);",
  );
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
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
  );
  const tables = tablesRows.map((row) => row.name);
  const details = await Promise.all(
    tables.map(async (table) => {
      const columns = await db.getAllAsync<DatabaseColumnInfo>(
        `PRAGMA table_info(${table});`,
      );
      return { table, columns };
    }),
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

export async function listEvents(): Promise<EventItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EventRow>(
    "SELECT id, name, description, start_date, end_date, created_at FROM events ORDER BY start_date DESC;",
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  }));
}

export async function createEvent(input: CreateEventInput): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startDate = input.startDate ?? now;
  const endDate = input.endDate ?? null;
  const description = input.description ?? null;

  await db.runAsync(
    `INSERT INTO events (id, name, description, start_date, end_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.name, description, startDate, endDate, now],
  );
}

export async function updateEvent(input: UpdateEventInput): Promise<void> {
  const db = await getDatabase();
  const description = input.description ?? null;
  const startDate = input.startDate ?? new Date().toISOString();
  const endDate = input.endDate ?? null;

  await db.runAsync(
    `UPDATE events
     SET name = ?, description = ?, start_date = ?, end_date = ?
     WHERE id = ?;`,
    [input.name, description, startDate, endDate, input.id],
  );
}

export async function deleteEvent(eventId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM events WHERE id = ?;", [eventId]);
}

export async function getEventById(eventId: string): Promise<EventItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<EventRow>(
    "SELECT id, name, description, start_date, end_date, created_at FROM events WHERE id = ? LIMIT 1;",
    [eventId],
  );
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

type ExpenseJoinRow = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  incurred_at: string;
  payer_name: string | null;
};

export async function listExpensesForEvent(
  eventId: string,
): Promise<EventExpenseListItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExpenseJoinRow>(
    `SELECT e.id, e.title, e.amount, e.currency, e.incurred_at, p.name AS payer_name
     FROM expenses e
     LEFT JOIN participants p ON p.id = e.participant_id
     WHERE e.event_id = ?
     ORDER BY e.incurred_at DESC;`,
    [eventId],
  );
  return rows.map((row) => ({
    id: row.id,
    description: row.title,
    amount: row.amount,
    currency: row.currency,
    payerName: row.payer_name,
    incurredAt: row.incurred_at,
  }));
}

type ParticipantRow = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  created_at: string;
};

export async function listParticipantsForEvent(
  eventId: string,
): Promise<Participant[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ParticipantRow>(
    "SELECT id, event_id, name, email, created_at FROM participants WHERE event_id = ? ORDER BY name ASC;",
    [eventId],
  );
  return rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  }));
}

async function findOrCreateParticipantForEvent(
  eventId: string,
  payerName: string,
): Promise<string> {
  const db = await getDatabase();
  const trimmed = payerName.trim();
  const normalized = trimmed.toLowerCase();

  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM participants
     WHERE event_id = ? AND LOWER(TRIM(name)) = ?
     LIMIT 1;`,
    [eventId, normalized],
  );
  if (existing) return existing.id;

  const id = `prt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO participants (id, event_id, name, email, created_at)
     VALUES (?, ?, ?, NULL, ?);`,
    [id, eventId, trimmed, now],
  );
  return id;
}

export async function addExpenseToEvent(
  input: AddExpenseFormInput & { eventId: string },
): Promise<void> {
  const db = await getDatabase();
  const participantId = await findOrCreateParticipantForEvent(
    input.eventId,
    input.payerName,
  );
  const now = new Date().toISOString();
  const expenseId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const title = input.description.trim() || "Expense";

  await db.runAsync(
    `INSERT INTO expenses (id, event_id, participant_id, title, amount, currency, incurred_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?, 'USD', ?, NULL, ?);`,
    [expenseId, input.eventId, participantId, title, input.amount, now, now],
  );
}
