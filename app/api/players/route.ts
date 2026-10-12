import { sql } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const players = await sql`SELECT id, name FROM players ORDER BY id`;
  return Response.json(players);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  const id = Date.now().toString(36);
  const [player] = await sql`
    INSERT INTO players (id, name) VALUES (${id}, ${name.trim()})
    RETURNING id, name
  `;
  return Response.json(player);
}

export async function PATCH(req: NextRequest) {
  const { id, name } = await req.json();
  await sql`UPDATE players SET name = ${name.trim()} WHERE id = ${id}`;
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await sql`DELETE FROM players WHERE id = ${id}`;
  return Response.json({ success: true });
}
