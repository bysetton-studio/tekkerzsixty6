import { kv } from "@vercel/kv";
import TeamGenTabs from "./team-generator/TeamGenTabs";

interface Player {
  id: string;
  name: string;
}

interface Game {
  id: string;
  createdAt: string;
  status: "pending" | "completed";
  teamA: Player[];
  teamB: Player[];
  scoreA: number | null;
  scoreB: number | null;
}

export default async function TeamGeneratorPage() {
  const [players, games] = await Promise.all([
    kv.get<Player[]>("players").then((p) => p ?? []),
    kv.get<Game[]>("games").then((g) => g ?? []),
  ]);
  const pendingGame = games.find((g) => g.status === "pending") ?? null;

  return (
    <main className="bg-[#111] text-[#eee] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-1">Team Generator</h1>
        <p className="text-[#aaa] text-sm mb-6">Select players then generate teams. Move players between sides to adjust.</p>
        <TeamGenTabs initialPlayers={players} initialActiveGame={pendingGame} allGames={games} />
      </div>
    </main>
  );
}
