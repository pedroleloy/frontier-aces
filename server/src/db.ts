import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? './data/frontier-aces.db';

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS saves (
    player_id TEXT PRIMARY KEY,
    json_data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    player_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    reputation INTEGER NOT NULL DEFAULT 0,
    bankroll INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_lb_reputation ON leaderboard(reputation DESC);
`);

export interface SaveRow {
  player_id: string;
  json_data: string;
  updated_at: number;
}

export interface LeaderboardRow {
  player_id: string;
  name: string;
  reputation: number;
  bankroll: number;
  level: number;
  updated_at: number;
}

export const stmts = {
  getSave: db.prepare<string, SaveRow>('SELECT * FROM saves WHERE player_id = ?'),
  upsertSave: db.prepare(
    `INSERT INTO saves (player_id, json_data, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(player_id) DO UPDATE SET
       json_data = excluded.json_data,
       updated_at = excluded.updated_at`,
  ),
  upsertLeaderboard: db.prepare(
    `INSERT INTO leaderboard (player_id, name, reputation, bankroll, level, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(player_id) DO UPDATE SET
       name = excluded.name,
       reputation = excluded.reputation,
       bankroll = excluded.bankroll,
       level = excluded.level,
       updated_at = excluded.updated_at`,
  ),
  topLeaderboard: db.prepare<[number], LeaderboardRow>(
    'SELECT * FROM leaderboard ORDER BY reputation DESC, bankroll DESC LIMIT ?',
  ),
};
