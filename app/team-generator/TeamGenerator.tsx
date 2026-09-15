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
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<Player | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function buildShareText() {
    const a = teamA.map((p) => `  • ${p.name}`).join("\n");
    const b = teamB.map((p) => `  • ${p.name}`).join("\n");
    return `⚽ Team A\n${a}\n\n⚽ Team B\n${b}`;
  }

  async function handleShare() {
    const text = buildShareText();
    if (navigator.share) {
      await navigator.share({ title: "Teams", text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

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
    setShowAddForm(false);
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
    const player = players.find((p) => p.id === id)!;
    if (selected.has(id)) {
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setTeamA((prev) => prev.filter((p) => p.id !== id));
      setTeamB((prev) => prev.filter((p) => p.id !== id));
    } else {
      setSelected((prev) => new Set(prev).add(id));
      if (teamA.length <= teamB.length) setTeamA((prev) => [...prev, player]);
      else setTeamB((prev) => [...prev, player]);
    }
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
    <div className="flex flex-col md:flex-row-reverse gap-8 items-start">

      {/* Players section */}
      <section className="w-full md:w-72 md:shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Players</h2>
          <button
            onClick={() => { setShowAddForm((v) => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="text-xs px-3 py-1 rounded bg-[#1bb1ac26] text-[#1bb1ac] hover:bg-[#1bb1ac40] transition-colors"
          >
            {showAddForm ? "Cancel" : "+ Add new member"}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={(e) => { handleAddPlayer(e); setShowAddForm(false); }} className="flex gap-2 mb-4">
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
        )}

        {players.length > 0 && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#1bb1ac] mb-3"
          />
        )}

        {/* Player list with checkboxes */}
        {players.length === 0 ? (
          <p className="text-[#555] text-sm">No players yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
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

      </section>

      {/* Teams */}
      {teamsGenerated && (
        <section className="border border-[#333] rounded-lg overflow-hidden flex-1 w-full">
          <div className="flex justify-center px-4 py-2 border-b border-[#333]">
            <button
              onClick={handleShare}
              className="text-xs px-4 py-1.5 rounded bg-[#1bb1ac26] text-[#1bb1ac] hover:bg-[#1bb1ac40] transition-colors w-[60%]"
            >
              {copied ? "Copied!" : "Share teams"}
            </button>
          </div>

          {/* Headers */}
          <div className="grid grid-cols-2">
            <div className="bg-[#0d3f3e] px-4 py-2 flex items-center justify-between border-r border-[#333]">
              <span className="text-[#1bb1ac] font-semibold text-sm">Team A</span>
            </div>
            <div className="bg-[#1a2a3f] px-4 py-2 flex items-center justify-between">
              <span className="text-[#5599e0] font-semibold text-sm">Team B</span>
            </div>
          </div>

          {/* Rows */}
          <div className="grid grid-cols-2 divide-x divide-[#333]">
            <ul className="p-3 flex flex-col gap-1">
              {teamA.map((p) => (
                <li
                  key={p.id}
                  onClick={() => moveToB(p)}
                  className="group flex gap-2 items-center justify-end px-3 py-2 rounded bg-[#1a1a1a] cursor-pointer hover:bg-[#1a2a3f] transition-colors"
                >
                  <span className="hidden md:block flex-1 text-xs text-[#444] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity text-right">Switch team →</span>
                  <span className="text-sm text-[#eee] min-w-max text-right">{p.name}</span>
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
                  <span className="text-sm text-[#eee] min-w-max text-left">{p.name}</span>
                  <span className="hidden md:block flex-1 text-xs text-[#444] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity text-left">← Switch team</span>
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
