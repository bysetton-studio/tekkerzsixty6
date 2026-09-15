import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";

interface Player {
  id: string;
  name: string;
}

const KEY = "players";

export async function GET() {
  const players = await kv.get<Player[]>(KEY) ?? [];
  return Response.json(players);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  const players = await kv.get<Player[]>(KEY) ?? [];
  const newPlayer: Player = { id: Date.now().toString(36), name: name.trim() };
  await kv.set(KEY, [...players, newPlayer]);
  return Response.json(newPlayer);
}

export async function PATCH(req: NextRequest) {
  const { id, name } = await req.json();
  const players = await kv.get<Player[]>(KEY) ?? [];
  const updated = players.map((p) => p.id === id ? { ...p, name: name.trim() } : p);
  await kv.set(KEY, updated);
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const players = await kv.get<Player[]>(KEY) ?? [];
  await kv.set(KEY, players.filter((p) => p.id !== id));
  return Response.json({ success: true });
}
