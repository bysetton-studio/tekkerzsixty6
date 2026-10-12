import { sql } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const [row] = await sql`SELECT cliptime FROM camera_config WHERE id = 1`;
  return Response.json({ time: row?.cliptime ?? "" });
}

export async function PATCH(req: NextRequest) {
  const { time } = await req.json();
  await sql`
    INSERT INTO camera_config (id, court, cliptime) VALUES (1, '', ${String(time).trim()})
    ON CONFLICT (id) DO UPDATE SET cliptime = EXCLUDED.cliptime
  `;
  return Response.json({ success: true });
}
