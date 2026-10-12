import { sql } from "@/lib/db";
import { NextRequest } from "next/server";

interface Player {
  id: string;
  name: string;
}

export interface Game {
  id: string;
  createdAt: string;
  status: "pending" | "completed";
  teamA: Player[];
  teamB: Player[];
  scoreA: number | null;
  scoreB: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGame(row: any): Game {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    teamA: row.team_a,
    teamB: row.team_b,
    scoreA: row.score_a,
    scoreB: row.score_b,
  };
}

export async function GET() {
  const rows = await sql`SELECT * FROM games ORDER BY created_at DESC`;
  return Response.json(rows.map(rowToGame));
}

export async function POST(req: NextRequest) {
  const { teamA, teamB } = await req.json();
  const id = Date.now().toString(36);
  const [row] = await sql`
    INSERT INTO games (id, status, team_a, team_b)
    VALUES (${id}, 'pending', ${JSON.stringify(teamA)}::jsonb, ${JSON.stringify(teamB)}::jsonb)
    RETURNING *
  `;
  return Response.json(rowToGame(row));
}

export async function PATCH(req: NextRequest) {
  const { id, teamA, teamB, scoreA, scoreB, status } = await req.json();
  const [current] = await sql`SELECT * FROM games WHERE id = ${id}`;
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  await sql`
    UPDATE games SET
      team_a = ${JSON.stringify(teamA !== undefined ? teamA : current.team_a)}::jsonb,
      team_b = ${JSON.stringify(teamB !== undefined ? teamB : current.team_b)}::jsonb,
      score_a = ${scoreA !== undefined ? scoreA : current.score_a},
      score_b = ${scoreB !== undefined ? scoreB : current.score_b},
      status = ${status !== undefined ? status : current.status}
    WHERE id = ${id}
  `;
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await sql`DELETE FROM games WHERE id = ${id}`;
  return Response.json({ success: true });
}
