import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";

const KEY = "court";

export async function GET() {
  const court = await kv.get<string>(KEY) ?? "";
  return Response.json({ court });
}

export async function PATCH(req: NextRequest) {
  const { court } = await req.json();
  await kv.set(KEY, String(court).trim());
  return Response.json({ success: true });
}
