import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export const initDatabase = async () => {
  if (db) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
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
      activity_level TEXT,
      target_calories INTEGER,
      target_protein INTEGER,
      target_carbs INTEGER,
      target_fat INTEGER
    );
  `);

  // Migration: Add columns if they usually don't exist
  try { await db.execAsync('ALTER TABLE profile ADD COLUMN target_calories INTEGER;'); } catch (e) {}
  try { await db.execAsync('ALTER TABLE profile ADD COLUMN target_protein INTEGER;'); } catch (e) {}
  try { await db.execAsync('ALTER TABLE profile ADD COLUMN target_carbs INTEGER;'); } catch (e) {}
  try { await db.execAsync('ALTER TABLE profile ADD COLUMN target_fat INTEGER;'); } catch (e) {}

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
  try {
    // Images will be stored as a JSON string of URI array
    await db.execAsync('ALTER TABLE entries ADD COLUMN images TEXT;');
  } catch (e) {}

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS weight_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT,
      start_weight REAL,
      target_weight REAL,
      timeline_weeks INTEGER,
      notes TEXT,
      target_calories INTEGER,
      target_protein INTEGER,
      target_carbs INTEGER,
      target_fat INTEGER,
      rationale TEXT,
      safety_note TEXT,
      weekly_rate_kg REAL,
      active INTEGER DEFAULT 0
    );
  `);
  })();
  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
};

export const getSetting = async (key: string): Promise<string | null> => {
  if (!db) await initDatabase();
  const row = await db!.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  if (!db) await initDatabase();
  await db!.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key, value
  );
};

export interface WeightGoal {
  id: number;
  created_at: string;
  start_weight: number;
  target_weight: number;
  timeline_weeks: number;
  notes: string | null;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  rationale: string | null;
  safety_note: string | null;
  weekly_rate_kg: number;
  active: number;
}

export const insertGoal = async (g: Omit<WeightGoal, 'id' | 'active'>): Promise<number> => {
  if (!db) await initDatabase();
  const res = await db!.runAsync(
    `INSERT INTO weight_goals
     (created_at, start_weight, target_weight, timeline_weeks, notes,
      target_calories, target_protein, target_carbs, target_fat,
      rationale, safety_note, weekly_rate_kg, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    g.created_at, g.start_weight, g.target_weight, g.timeline_weeks, g.notes ?? '',
    g.target_calories, g.target_protein, g.target_carbs, g.target_fat,
    g.rationale ?? '', g.safety_note ?? '', g.weekly_rate_kg
  );
  return res.lastInsertRowId;
};

export const listGoals = async (): Promise<WeightGoal[]> => {
  if (!db) await initDatabase();
  return await db!.getAllAsync<WeightGoal>('SELECT * FROM weight_goals ORDER BY id DESC');
};

export const getActiveGoal = async (): Promise<WeightGoal | null> => {
  if (!db) await initDatabase();
  return await db!.getFirstAsync<WeightGoal>('SELECT * FROM weight_goals WHERE active = 1 LIMIT 1');
};

export const setActiveGoal = async (id: number): Promise<void> => {
  if (!db) await initDatabase();
  await db!.withTransactionAsync(async () => {
    await db!.runAsync('UPDATE weight_goals SET active = 0 WHERE active = 1');
    await db!.runAsync('UPDATE weight_goals SET active = 1 WHERE id = ?', id);
  });
};

export const saveProfile = async (
  name: string, 
  age: number, 
  weight: number, 
  height: number, 
  gender: string, 
  activity_level: string,
  target_calories: number,
  target_protein: number,
  target_carbs: number,
  target_fat: number
) => {
  if (!db) await initDatabase();
  // We only keep one profile for now
  const existing = await db!.getFirstAsync<{ id: number }>('SELECT id FROM profile LIMIT 1');
  if (existing) {
    await db!.runAsync(
      'UPDATE profile SET name = ?, age = ?, weight = ?, height = ?, gender = ?, activity_level = ?, target_calories = ?, target_protein = ?, target_carbs = ?, target_fat = ? WHERE id = ?',
      name, age, weight, height, gender, activity_level, target_calories, target_protein, target_carbs, target_fat, existing.id
    );
  } else {
    await db!.runAsync(
      'INSERT INTO profile (name, age, weight, height, gender, activity_level, target_calories, target_protein, target_carbs, target_fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      name, age, weight, height, gender, activity_level, target_calories, target_protein, target_carbs, target_fat
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
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
}

export const getProfile = async (): Promise<Profile | null> => {
  if (!db) await initDatabase();
  return await db!.getFirstAsync<Profile>('SELECT * FROM profile LIMIT 1');
};

export const saveEntry = async (title: string, formatted_menu: string, raw_json: string, total_calories: number, total_macros: string, date: string, images: string[] = []) => {
  if (!db) await initDatabase();
  const imagesJson = JSON.stringify(images ?? []);
  const result = await db!.runAsync(
    'INSERT INTO entries (title, formatted_menu, raw_json, total_calories, total_macros, date, images) VALUES (?, ?, ?, ?, ?, ?, ?)',
    title ?? '',
    formatted_menu ?? '',
    raw_json ?? '',
    Number(total_calories) || 0,
    total_macros ?? '',
    date ?? '',
    imagesJson
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
  images: string; // JSON string of string[]
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

