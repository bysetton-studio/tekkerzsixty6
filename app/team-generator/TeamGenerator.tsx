"use client";

import { useState, useRef } from "react";

interface Player {
  id: string;
  name: string;
}

export default function TeamGenerator({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Player | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const player = await res.json();
    setPlayers((prev) => [...prev, player]);
    setNewName("");
    setAdding(false);
    inputRef.current?.focus();
  }

  async function handleRemovePlayer(id: string) {
    await fetch("/api/players", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setTeamA((prev) => prev.filter((p) => p.id !== id));
    setTeamB((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function handleGenerate() {
    const pool = players.filter((p) => selected.has(p.id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setTeamA(shuffled.filter((_, i) => i % 2 === 0));
    setTeamB(shuffled.filter((_, i) => i % 2 === 1));
  }

  function moveToB(player: Player) {
    setTeamA((prev) => prev.filter((p) => p.id !== player.id));
    setTeamB((prev) => [...prev, player]);
  }

  function moveToA(player: Player) {
    setTeamB((prev) => prev.filter((p) => p.id !== player.id));
    setTeamA((prev) => [...prev, player]);
  }

  const teamsGenerated = teamA.length > 0 || teamB.length > 0;

  return (
    <div className="flex flex-row-reverse gap-8 items-start">

      {/* Add player */}
      <section className="w-72 shrink-0">
        <h2 className="text-white font-semibold mb-3">Players</h2>
        <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Player name"
            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#1bb1ac]"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-4 py-2 rounded bg-[#1bb1ac] text-black text-sm font-semibold hover:bg-[#17a09b] transition-colors disabled:opacity-40"
          >
            Add
          </button>
        </form>

        {/* Player list with checkboxes */}
        {players.length === 0 ? (
          <p className="text-[#555] text-sm">No players yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded bg-[#1a1a1a] border border-[#222] hover:border-[#333] transition-colors"
              >
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="accent-[#1bb1ac] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-[#eee]">{p.name}</span>
                </label>
                <button
                  onClick={() => setConfirmRemove(p)}
                  className="text-[#444] hover:text-[#e05555] text-xs transition-colors ml-2"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected.size >= 2 && (
          <button
            onClick={handleGenerate}
            className="mt-4 px-5 py-2 rounded bg-[#0d3f3e] border border-[#1bb1ac40] text-[#1bb1ac] text-sm font-semibold hover:bg-[#10504f] transition-colors"
          >
            {teamsGenerated ? "Re-generate Teams" : "Generate Teams"} ({selected.size} players)
          </button>
        )}
      </section>

      {/* Teams */}
      {teamsGenerated && (
        <section className="border border-[#333] rounded-lg overflow-hidden flex-1">
          {/* Headers */}
          <div className="grid grid-cols-2">
            <div className="bg-[#0d3f3e] px-4 py-2 flex items-center justify-between border-r border-[#333]">
              <span className="text-[#1bb1ac] font-semibold text-sm">Team A</span>
              <span className="text-[#aaa] text-xs">{teamA.length} players</span>
            </div>
            <div className="bg-[#1a2a3f] px-4 py-2 flex items-center justify-between">
              <span className="text-[#5599e0] font-semibold text-sm">Team B</span>
              <span className="text-[#aaa] text-xs">{teamB.length} players</span>
            </div>
          </div>

          {/* Rows */}
          <div className="grid grid-cols-2 divide-x divide-[#333]">
            <ul className="p-3 flex flex-col gap-1">
              {teamA.map((p) => (
                <li
                  key={p.id}
                  onClick={() => moveToB(p)}
                  className="group flex gap-2 items-center px-3 py-2 rounded bg-[#1a1a1a] cursor-pointer hover:bg-[#1a2a3f] transition-colors"
                >
                  <span className="text-xs text-[#444] ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity w-full text-right">Switch team →</span>
                  <span className="text-sm text-[#eee] flex-1 text-right">{p.name}</span>
                </li>
              ))}
            </ul>
            <ul className="p-3 flex flex-col gap-1">
              {teamB.map((p) => (
                <li
                  key={p.id}
                  onClick={() => moveToA(p)}
                  className="group flex gap-2 items-center px-3 py-2 rounded bg-[#1a1a1a] cursor-pointer hover:bg-[#0a2e2d] transition-colors"
                >
                  <span className="text-sm text-[#eee] flex-1 text-left">{p.name}</span>
                  <span className="text-xs text-[#444] mr-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity w-full text-left">← Switch team</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-[#1a1a1a] border border-[#333] max-w-sm w-full">
            <h2 className="text-white font-bold">Remove player?</h2>
            <p className="text-[#aaa] text-sm">
              Are you sure you want to remove <span className="text-white">{confirmRemove.name}</span> from the player list?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { handleRemovePlayer(confirmRemove.id); setConfirmRemove(null); }}
                className="flex-1 py-2 rounded-lg bg-[#3f1010] text-[#e05555] hover:bg-[#5a1a1a] transition-colors text-sm"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmRemove(null)}
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
