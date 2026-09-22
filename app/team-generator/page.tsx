import { kv } from "@vercel/kv";
import TeamGenerator from "./TeamGenerator";

interface Player {
  id: string;
  name: string;
}

export default async function TeamGeneratorPage() {
  const players = await kv.get<Player[]>("players") ?? [];

  return (
    <main className="bg-[#111] text-[#eee] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-1">Team Generator</h1>
        <p className="text-[#aaa] text-sm mb-8">Select players then generate teams. Move players between sides to adjust.</p>
        <TeamGenerator initialPlayers={players} />
      </div>
    </main>
  );
}
