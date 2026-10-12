import { sql } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const [row] = await sql`SELECT court FROM camera_config WHERE id = 1`;
  return Response.json({ court: row?.court ?? "" });
}

export async function PATCH(req: NextRequest) {
  const { court } = await req.json();
  await sql`
    INSERT INTO camera_config (id, court, cliptime) VALUES (1, ${String(court).trim()}, '')
    ON CONFLICT (id) DO UPDATE SET court = EXCLUDED.court
  `;
  return Response.json({ success: true });
}
