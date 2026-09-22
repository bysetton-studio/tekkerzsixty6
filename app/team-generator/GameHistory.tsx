"use client";

import { useState } from "react";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

function ResultBadge({ scoreA, scoreB }: { scoreA: number | null; scoreB: number | null }) {
  if (scoreA === null || scoreB === null) return <span className="text-xs text-[#555]">No score</span>;
  const winner = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : null;
  return (
    <div className="flex items-center gap-2 text-sm font-bold">
      <span className={scoreA > scoreB ? "text-rose-400" : "text-[#aaa]"}>{scoreA}</span>
      <span className="text-[#444]">–</span>
      <span className={scoreB > scoreA ? "text-[#5599e0]" : "text-[#aaa]"}>{scoreB}</span>
      {winner && (
        <span className={`text-xs font-normal px-1.5 py-0.5 rounded ${winner === "A" ? "bg-rose-950 text-rose-400" : "bg-[#1a2a3f] text-[#5599e0]"}`}>
          Team {winner} wins
        </span>
      )}
      {!winner && <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[#aaa]">Draw</span>}
    </div>
  );
}

async function deleteGame(id: string) {
  await fetch("/api/games", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export default function GameHistory({ games }: { games: Game[] }) {
  const [items, setItems] = useState([...games].filter((g) => g.status === "completed").reverse());
  const [confirmDelete, setConfirmDelete] = useState<Game | null>(null);
  const completed = items;

  if (completed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 border border-dashed border-[#333] rounded-lg px-6 py-12 text-center">
        <p className="text-[#555] text-sm">No completed games yet.</p>
        <p className="text-[#444] text-xs">Lock in a game and save the score to see results here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {completed.map((game) => (
        <div key={game.id} className="border border-[#333] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
            <span className="text-xs text-[#555]">{formatDate(game.createdAt)}</span>
            <div className="flex items-center gap-3">
              <ResultBadge scoreA={game.scoreA} scoreB={game.scoreB} />
              <button
                onClick={() => setConfirmDelete(game)}
                className="text-[#444] hover:text-[#e05555] text-xs transition-colors cursor-pointer"
                title="Remove game"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#333]">
            <div className="p-3">
              <p className="text-xs text-rose-400 font-semibold mb-2">Team A</p>
              <ul className="flex flex-col gap-1">
                {game.teamA.map((p) => (
                  <li key={p.id} className="text-sm text-[#eee]">{p.name}</li>
                ))}
              </ul>
            </div>
            <div className="p-3">
              <p className="text-xs text-[#5599e0] font-semibold mb-2">Team B</p>
              <ul className="flex flex-col gap-1">
                {game.teamB.map((p) => (
                  <li key={p.id} className="text-sm text-[#eee]">{p.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-[#1a1a1a] border border-[#333] max-w-sm w-full">
            <h2 className="text-white font-bold">Remove game?</h2>
            <p className="text-[#aaa] text-sm">
              Are you sure you want to remove this game from{" "}
              <span className="text-white">{formatDate(confirmDelete.createdAt)}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await deleteGame(confirmDelete.id);
                  setItems((prev) => prev.filter((g) => g.id !== confirmDelete.id));
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2 rounded-lg bg-[#3f1010] text-[#e05555] hover:bg-[#5a1a1a] transition-colors text-sm"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-lg bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
