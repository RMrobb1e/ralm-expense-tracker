export const DATABASE_NAME = "expense-tracker.db";
export const LATEST_DATABASE_VERSION = 2;

export const BASE_TABLES_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

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
`;

export const BASE_INDEXES_SCHEMA_SQL = `
  CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_participant_id ON expenses(participant_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_incurred_at ON expenses(incurred_at);
`;
