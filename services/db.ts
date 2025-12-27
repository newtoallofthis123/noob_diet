import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('entries.db');
  
  // Create table for profile
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      age INTEGER,
      weight REAL,
      height REAL,
      gender TEXT,
      activity_level TEXT
    );
  `);

  // Create table if not exists with new schema
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      formatted_menu TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      total_calories INTEGER DEFAULT 0,
      total_macros TEXT,
      date TEXT
    );
  `);

  // Migration: Add columns if they usually don't exist (primitive check)
  try {
    await db.execAsync('ALTER TABLE entries ADD COLUMN total_calories INTEGER DEFAULT 0;');
  } catch (e) {}
  try {
    await db.execAsync('ALTER TABLE entries ADD COLUMN date TEXT;');
  } catch (e) {}
  try {
    await db.execAsync('ALTER TABLE entries ADD COLUMN total_macros TEXT;');
  } catch (e) {}
};

export const saveProfile = async (name: string, age: number, weight: number, height: number, gender: string, activity_level: string) => {
  if (!db) await initDatabase();
  // We only keep one profile for now
  const existing = await db!.getFirstAsync<{ id: number }>('SELECT id FROM profile LIMIT 1');
  if (existing) {
    await db!.runAsync(
      'UPDATE profile SET name = ?, age = ?, weight = ?, height = ?, gender = ?, activity_level = ? WHERE id = ?',
      name, age, weight, height, gender, activity_level, existing.id
    );
  } else {
    await db!.runAsync(
      'INSERT INTO profile (name, age, weight, height, gender, activity_level) VALUES (?, ?, ?, ?, ?, ?)',
      name, age, weight, height, gender, activity_level
    );
  }
};

export interface Profile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  activity_level: string;
}

export const getProfile = async (): Promise<Profile | null> => {
  if (!db) await initDatabase();
  return await db!.getFirstAsync<Profile>('SELECT * FROM profile LIMIT 1');
};

export const saveEntry = async (title: string, formatted_menu: string, raw_json: string, total_calories: number, total_macros: string, date: string) => {
  if (!db) await initDatabase();
  const result = await db!.runAsync(
    'INSERT INTO entries (title, formatted_menu, raw_json, total_calories, total_macros, date) VALUES (?, ?, ?, ?, ?, ?)',
    title,
    formatted_menu,
    raw_json,
    total_calories,
    total_macros,
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
  total_macros: string; // JSON string
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

