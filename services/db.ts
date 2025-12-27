import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('entries.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      formatted_menu TEXT NOT NULL,
      raw_json TEXT NOT NULL
    );
  `);
};

export const saveEntry = async (title: string, formatted_menu: string, raw_json: string) => {
  if (!db) await initDatabase();
  const result = await db!.runAsync(
    'INSERT INTO entries (title, formatted_menu, raw_json) VALUES (?, ?, ?)',
    title,
    formatted_menu,
    raw_json
  );
  return result.lastInsertRowId;
};

export interface Entry {
  id: number;
  title: string;
  formatted_menu: string;
  raw_json: string;
}

export const getEntries = async (): Promise<Entry[]> => {
  if (!db) await initDatabase();
  return await db!.getAllAsync<Entry>('SELECT * FROM entries ORDER BY id DESC');
};

export const getEntry = async (id: number): Promise<Entry | null> => {
  if (!db) await initDatabase();
  return await db!.getFirstAsync<Entry>('SELECT * FROM entries WHERE id = ?', id);
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
