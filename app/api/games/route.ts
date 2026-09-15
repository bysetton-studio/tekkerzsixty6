import { kv } from "@vercel/kv";
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

const KEY = "games";

export async function GET() {
  const games = await kv.get<Game[]>(KEY) ?? [];
  return Response.json(games);
}

export async function POST(req: NextRequest) {
  const { teamA, teamB } = await req.json();
  const games = await kv.get<Game[]>(KEY) ?? [];
  const game: Game = {
    id: Date.now().toString(36),
    createdAt: new Date().toISOString(),
    status: "pending",
    teamA,
    teamB,
    scoreA: null,
    scoreB: null,
  };
  await kv.set(KEY, [...games, game]);
  return Response.json(game);
}

export async function PATCH(req: NextRequest) {
  const { id, teamA, teamB, scoreA, scoreB, status } = await req.json();
  const games = await kv.get<Game[]>(KEY) ?? [];
  const updated = games.map((g) => {
    if (g.id !== id) return g;
    return {
      ...g,
      ...(teamA !== undefined && { teamA }),
      ...(teamB !== undefined && { teamB }),
      ...(scoreA !== undefined && { scoreA }),
      ...(scoreB !== undefined && { scoreB }),
      ...(status !== undefined && { status }),
    };
  });
  await kv.set(KEY, updated);
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const games = await kv.get<Game[]>(KEY) ?? [];
  await kv.set(KEY, games.filter((g) => g.id !== id));
  return Response.json({ success: true });
}
