import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  process.env[key] ??= val;
}

const sql = neon(process.env.DATABASE_URL);

// Create tables
console.log("Creating tables...");
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
console.log("Tables ready.");

const games = [{"id":"mu2utm6k","createdAt":"2026-09-15T15:56:22.796Z","status":"completed","teamA":[{"id":"mu2m9nlb","name":"Theo"},{"id":"mu2nr91w","name":"Sam J"},{"id":"mu2nr9f2","name":"Zach"},{"id":"mu2m9ikt","name":"Eli"},{"id":"mu2nr8nq","name":"Mike"}],"teamB":[{"id":"mu2nkgm6","name":"Harry"},{"id":"mu2p85ah","name":"AK"},{"id":"mu2omf13","name":"Barak"},{"id":"mu2p9a52","name":"Ben"},{"id":"mu2p916l","name":"James"}],"scoreA":11,"scoreB":12},{"id":"mubgdeiy","createdAt":"2026-09-21T16:21:47.338Z","status":"completed","teamA":[{"id":"mubgagij","name":"Jan"},{"id":"mu2m9nlb","name":"Theo"},{"id":"mu2nr9f2","name":"Zach"},{"id":"mu2omf13","name":"Barak"},{"id":"mu2p8u4k","name":"Tom"}],"teamB":[{"id":"mu2m9ikt","name":"Eli"},{"id":"mu2nr8nq","name":"Mike"},{"id":"mu2nkfv8","name":"Ben A"},{"id":"mu2p916l","name":"James"},{"id":"mu2nkgm6","name":"Harry"}],"scoreA":8,"scoreB":9},{"id":"muea4i0q","createdAt":"2026-09-23T15:50:12.794Z","status":"completed","teamA":[{"id":"mu2nkfv8","name":"Ben A"},{"id":"mu2nr8nq","name":"Mike"},{"id":"mu2p8u4k","name":"Tom"},{"id":"mu2p916l","name":"James"},{"id":"mu2nkgm6","name":"Harry"}],"teamB":[{"id":"mu9vpyrh","name":"Jan"},{"id":"mu2m9ikt","name":"Eli"},{"id":"mu2nr9f2","name":"Zach"},{"id":"mu2m9nlb","name":"Theo"},{"id":"mu2omf13","name":"Barak"}],"scoreA":4,"scoreB":6},{"id":"muvjxgy7","createdAt":"2026-10-05T17:56:45.967Z","status":"completed","teamA":[{"id":"mu2m9ikt","name":"Eli"},{"id":"mu2p8u4k","name":"Tom"},{"id":"muvjrtyw","name":"Bunty"},{"id":"mu2p85ah","name":"AK"},{"id":"muvjru83","name":"JQ"}],"teamB":[{"id":"mu2nkgm6","name":"Harry"},{"id":"mu2omf13","name":"Barak"},{"id":"muvjrtow","name":"Timo"},{"id":"muvjrtga","name":"Sam A"},{"id":"mu2m9nlb","name":"Theo"}],"scoreA":9,"scoreB":12},{"id":"mv5nqjxd","createdAt":"2026-10-12T19:41:03.457Z","status":"completed","teamA":[{"id":"mu2m9ikt","name":"Eli"},{"id":"mulh0mic","name":"Sam A"},{"id":"mu2omf13","name":"Barak"},{"id":"mv5nq5up","name":"DG"},{"id":"mu2nkgm6","name":"Harry"}],"teamB":[{"id":"mu2p85ah","name":"AK"},{"id":"guest-1791834045356-9","name":"Sasha R"},{"id":"mu2nr9f2","name":"Zach"},{"id":"mu2p8u4k","name":"Tom"},{"id":"mu2p916l","name":"James"}],"scoreA":8,"scoreB":9},{"id":"mv5nvyc7","createdAt":"2026-10-12T19:45:15.415Z","status":"completed","teamA":[{"id":"mu2p916l","name":"James"},{"id":"mu2p8u4k","name":"Tom"},{"id":"mu2nr9f2","name":"Zach"},{"id":"mu2p85ah","name":"AK"},{"id":"guest-1791834300725-9","name":"Sasha R"}],"teamB":[{"id":"mu2nkgm6","name":"Harry"},{"id":"mu2omf13","name":"Barak"},{"id":"mv5nvmxj","name":"DG"},{"id":"mu2m9ikt","name":"Eli"},{"id":"mulh0mic","name":"Sam A"}],"scoreA":9,"scoreB":8}];

for (const g of games) {
  await sql`
    INSERT INTO games (id, created_at, status, team_a, team_b, score_a, score_b)
    VALUES (
      ${g.id},
      ${g.createdAt},
      ${g.status},
      ${JSON.stringify(g.teamA)}::jsonb,
      ${JSON.stringify(g.teamB)}::jsonb,
      ${g.scoreA ?? null},
      ${g.scoreB ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET
      status  = EXCLUDED.status,
      team_a  = EXCLUDED.team_a,
      team_b  = EXCLUDED.team_b,
      score_a = EXCLUDED.score_a,
      score_b = EXCLUDED.score_b
  `;
  console.log(`Inserted game ${g.id} (${g.createdAt.slice(0, 10)})`);
}

console.log(`\nDone — ${games.length} games imported.`);
