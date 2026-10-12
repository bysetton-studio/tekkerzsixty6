import { sql } from "@/lib/db";
import { NextRequest } from "next/server";

/**
 * POST /api/migrate-data
 *
 * Body (all fields optional — only provided ones will be imported):
 * {
 *   players:  [{ id: string, name: string }, ...],
 *   games:    [{ id, createdAt, status, teamA, teamB, scoreA, scoreB }, ...],
 *   court:    "4",
 *   cliptime: "19"
 * }
 */
export async function POST(req: NextRequest) {
  const { players, games, court, cliptime } = await req.json();

  const results: Record<string, number | string> = {};

  if (Array.isArray(players) && players.length > 0) {
    for (const p of players) {
      await sql`
        INSERT INTO players (id, name)
        VALUES (${p.id}, ${p.name})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      `;
    }
    results.players = players.length;
  }

  if (Array.isArray(games) && games.length > 0) {
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
    }
    results.games = games.length;
  }

  if (court != null || cliptime != null) {
    await sql`
      INSERT INTO camera_config (id, court, cliptime)
      VALUES (1, ${court != null ? String(court) : ""}, ${cliptime != null ? String(cliptime) : ""})
      ON CONFLICT (id) DO UPDATE SET
        court   = CASE WHEN ${court != null} THEN EXCLUDED.court   ELSE camera_config.court   END,
        cliptime = CASE WHEN ${cliptime != null} THEN EXCLUDED.cliptime ELSE camera_config.cliptime END
    `;
    if (court != null) results.court = String(court);
    if (cliptime != null) results.cliptime = String(cliptime);
  }

  return Response.json({ success: true, imported: results });
}
