import { sql } from "@/lib/db";
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
  const [playerRows, gameRows] = await Promise.all([
    sql`SELECT id, name FROM players ORDER BY id`,
    sql`SELECT * FROM games ORDER BY created_at DESC`,
  ]);

  const players = playerRows as Player[];
  const games: Game[] = gameRows.map((r) => ({
    id: r.id as string,
    createdAt: r.created_at as string,
    status: r.status as "pending" | "completed",
    teamA: r.team_a as Player[],
    teamB: r.team_b as Player[],
    scoreA: r.score_a as number | null,
    scoreB: r.score_b as number | null,
  }));

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
