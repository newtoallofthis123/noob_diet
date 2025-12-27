import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('entries.db');
  
  // Create table if not exists with new schema
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      formatted_menu TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      total_calories INTEGER DEFAULT 0,
      date TEXT
    );
  `);

  // Migration: Add columns if they usually don't exist (primitive check)
  // SQLite ignores ADD COLUMN if it exists usually or we can wrap in try-catch
  try {
    await db.execAsync('ALTER TABLE entries ADD COLUMN total_calories INTEGER DEFAULT 0;');
  } catch (e) {
    // Column likely exists
  }
  try {
    await db.execAsync('ALTER TABLE entries ADD COLUMN date TEXT;');
  } catch (e) {
    // Column likely exists
  }
};

export const saveEntry = async (title: string, formatted_menu: string, raw_json: string, total_calories: number, date: string) => {
  if (!db) await initDatabase();
  const result = await db!.runAsync(
    'INSERT INTO entries (title, formatted_menu, raw_json, total_calories, date) VALUES (?, ?, ?, ?, ?)',
    title,
    formatted_menu,
    raw_json,
    total_calories,
    date
  );
  return result.lastInsertRowId;
};

export interface Entry {
  id: number;
  title: string;
  formatted_menu: string;
  raw_json: string;
  total_calories: number;
  date: string;
}

export const getEntries = async (): Promise<Entry[]> => {
  if (!db) await initDatabase();
  return await db!.getAllAsync<Entry>('SELECT * FROM entries ORDER BY date DESC, id DESC');
};

export const getEntry = async (id: number): Promise<Entry | null> => {
  if (!db) await initDatabase();
  return await db!.getFirstAsync<Entry>('SELECT * FROM entries WHERE id = ?', id);
};

export const deleteEntry = async (id: number) => {
  if (!db) await initDatabase();
  await db!.runAsync('DELETE FROM entries WHERE id = ?', id);
};

export const updateEntry = async (id: number, title: string, formatted_menu: string) => {
  if (!db) await initDatabase();
  await db!.runAsync(
    'UPDATE entries SET title = ?, formatted_menu = ? WHERE id = ?',
    title,
    formatted_menu,
    id
  );
};
