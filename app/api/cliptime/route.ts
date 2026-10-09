import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";

const KEY = "cliptime";

export async function GET() {
  const time = await kv.get<string>(KEY) ?? "";
  return Response.json({ time });
}

export async function PATCH(req: NextRequest) {
  const { time } = await req.json();
  await kv.set(KEY, String(time).trim());
  return Response.json({ success: true });
}
