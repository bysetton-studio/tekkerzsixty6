"use client";

import { useState } from "react";
import TeamGenerator from "./TeamGenerator";
import GameHistory from "./GameHistory";

interface Player { id: string; name: string; }
interface Game {
  id: string; createdAt: string; status: "pending" | "completed";
  teamA: Player[]; teamB: Player[]; scoreA: number | null; scoreB: number | null;
}

export default function TeamGenTabs({
  initialPlayers,
  initialActiveGame,
  allGames,
}: {
  initialPlayers: Player[];
  initialActiveGame: Game | null;
  allGames: Game[];
}) {
  const [tab, setTab] = useState<"generator" | "history">("generator");
  const [visible, setVisible] = useState(true);

  function switchTab(t: "generator" | "history") {
    if (t === tab) return;
    setVisible(false);
    setTimeout(() => {
      setTab(t);
      setVisible(true);
    }, 120);
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-[#222]">
        {(["generator", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-4 py-2 text-sm rounded-t-lg border-t border-x transition-colors whitespace-nowrap ${
              tab === t
                ? "bg-[#0d3f3e] border-[#1bb1ac40] text-[#1bb1ac]"
                : "border-transparent text-[#666] hover:text-[#aaa]"
            }`}
          >
            {t === "generator" ? "Generator" : "Past Games"}
          </button>
        ))}
      </div>

      <div className={`transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}>
        {tab === "generator" && (
          <TeamGenerator initialPlayers={initialPlayers} initialActiveGame={initialActiveGame} />
        )}
        {tab === "history" && (
          <GameHistory games={allGames} />
        )}
      </div>
    </div>
  );
}
