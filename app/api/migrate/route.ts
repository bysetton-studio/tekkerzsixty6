import { sql } from "@/lib/db";

export async function POST() {
  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      status TEXT NOT NULL DEFAULT 'pending',
      team_a JSONB NOT NULL DEFAULT '[]',
      team_b JSONB NOT NULL DEFAULT '[]',
      score_a INTEGER,
      score_b INTEGER
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `;
  return Response.json({ success: true });
}
