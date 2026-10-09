"use client";

import { useState } from "react";
import TeamGenerator from "./TeamGenerator";
import GameHistory from "./GameHistory";
import LiveGames from "./LiveGames";

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
  const [tab, setTab] = useState<"generator" | "live" | "history">("generator");
  const [visible, setVisible] = useState(true);

  const pendingGames = allGames.filter((g) => g.status === "pending");

  function switchTab(t: "generator" | "live" | "history") {
    if (t === tab) return;
    setVisible(false);
    setTimeout(() => {
      setTab(t);
      setVisible(true);
    }, 120);
  }

  const tabLabels: { key: "generator" | "live" | "history"; label: React.ReactNode }[] = [
    { key: "generator", label: "Generator" },
    {
      key: "live",
      label: (
        <span className="flex items-center gap-1.5">
          Live
          {pendingGames.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#1bb1ac] animate-pulse" />
          )}
        </span>
      ),
    },
    { key: "history", label: "Past Games" },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-[#222]">
        {tabLabels.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`px-4 py-2 text-sm rounded-t-lg border-t border-x transition-colors whitespace-nowrap ${
              tab === key
                ? "bg-[#0d3f3e] border-[#1bb1ac40] text-[#1bb1ac]"
                : "border-transparent text-[#666] hover:text-[#aaa]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}>
        {tab === "generator" && (
          <TeamGenerator initialPlayers={initialPlayers} initialActiveGame={initialActiveGame} />
        )}
        {tab === "live" && (
          <LiveGames initialGames={allGames} />
        )}
        {tab === "history" && (
          <GameHistory games={allGames} />
        )}
      </div>
    </div>
  );
}
