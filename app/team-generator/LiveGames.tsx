"use client";

import { useState, useEffect } from "react";

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default function LiveGames({ initialGames }: { initialGames: Game[] }) {
  const [games, setGames] = useState<Game[]>(initialGames.filter((g) => g.status === "pending"));
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Poll every 15 seconds for updates
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/games");
        const all: Game[] = await res.json();
        setGames(all.filter((g) => g.status === "pending"));
      } catch {}
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  function getScore(gameId: string) {
    return scores[gameId] ?? { a: "", b: "" };
  }

  function setScore(gameId: string, side: "a" | "b", val: string) {
    setScores((prev) => ({ ...prev, [gameId]: { ...getScore(gameId), [side]: val } }));
  }

  async function handleSaveResult(game: Game) {
    const { a, b } = getScore(game.id);
    setSaving((prev) => ({ ...prev, [game.id]: true }));
    await fetch("/api/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: game.id,
        scoreA: a !== "" ? Number(a) : null,
        scoreB: b !== "" ? Number(b) : null,
        status: "completed",
      }),
    });
    setGames((prev) => prev.filter((g) => g.id !== game.id));
    setSaving((prev) => ({ ...prev, [game.id]: false }));
  }

  async function handleCancel(game: Game) {
    await fetch("/api/games", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: game.id }),
    });
    setGames((prev) => prev.filter((g) => g.id !== game.id));
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 border border-dashed border-[#333] rounded-lg px-6 py-12 text-center">
        <p className="text-[#555] text-sm">No live games right now.</p>
        <p className="text-[#444] text-xs">Lock in a game from the Generator tab to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {games.map((game) => {
        const { a, b } = getScore(game.id);
        const isSaving = saving[game.id] ?? false;
        return (
          <div key={game.id} className="border border-[#1bb1ac40] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0d3f3e] border-b border-[#1bb1ac40]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1bb1ac] animate-pulse" />
                <span className="text-[#1bb1ac] text-sm font-semibold">Live</span>
              </div>
              <span className="text-[#555] text-xs">
                {formatDate(game.createdAt)} · {formatTime(game.createdAt)}
              </span>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2">
              <div className="bg-[#0d3f3e80] px-4 py-2 flex items-center justify-end border-r border-[#333]">
                <span className="text-[#1bb1ac] font-semibold text-sm">Team A</span>
              </div>
              <div className="bg-[#1a2a3f80] px-4 py-2">
                <span className="text-[#5599e0] font-semibold text-sm">Team B</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-[#333]">
              <ul className="p-3 flex flex-col gap-1">
                {game.teamA.map((p) => (
                  <li key={p.id} className="flex items-center justify-end px-3 py-1.5">
                    <span className="text-sm text-[#eee] text-right">{p.name}</span>
                  </li>
                ))}
              </ul>
              <ul className="p-3 flex flex-col gap-1">
                {game.teamB.map((p) => (
                  <li key={p.id} className="flex items-center px-3 py-1.5">
                    <span className="text-sm text-[#eee]">{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Score entry */}
            <div className="border-t border-[#333] p-4 flex flex-col gap-4">
              <p className="text-[#aaa] text-xs">Enter the final scores</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#1bb1ac]">Team A</label>
                  <input
                    type="number"
                    min="0"
                    value={a}
                    onChange={(e) => setScore(game.id, "a", e.target.value)}
                    placeholder="0"
                    className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white text-lg font-bold text-center focus:outline-none focus:border-[#1bb1ac]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#5599e0]">Team B</label>
                  <input
                    type="number"
                    min="0"
                    value={b}
                    onChange={(e) => setScore(game.id, "b", e.target.value)}
                    placeholder="0"
                    className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white text-lg font-bold text-center focus:outline-none focus:border-[#5599e0]"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSaveResult(game)}
                  disabled={isSaving}
                  className="flex-1 py-2 rounded bg-[#1bb1ac] text-black text-sm font-semibold hover:bg-[#17a09b] transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save result"}
                </button>
                <button
                  onClick={() => handleCancel(game)}
                  className="px-4 py-2 rounded bg-[#2a2a2a] text-[#555] hover:text-[#aaa] transition-colors text-sm"
                >
                  Cancel game
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
