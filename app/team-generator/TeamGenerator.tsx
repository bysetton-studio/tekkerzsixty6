"use client";

import { useState, useRef } from "react";

interface Player {
  id: string;
  name: string;
}

type PatchAction = "matched" | "manual" | "member" | "guest" | "skip";

interface ImportRow {
  raw: string;          // cleaned name from the pasted text
  action: PatchAction;
  matchedId: string | null;  // auto-matched or manually chosen player id
}

function normalize(s: string) {
  return s
    .toLowerCase()
    // strip invisible / zero-width chars
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00A0]/g, "")
    // strip emoji (broad range)
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNames(text: string): string[] {
  // Find the first numbered item: "1." or "1)" or "1 "
  const firstMatch = text.match(/\n?\s*1[\.\)]\s*/);
  if (!firstMatch || firstMatch.index == null) return [];
  const body = text.slice(firstMatch.index);
  return body
    .split("\n")
    .map((line) => {
      // Remove leading number + separator
      const stripped = line.replace(/^\s*\d+[\.\)]\s*/, "");
      // Remove invisible chars and trim emojis from edges
      return stripped
        .replace(/[\u200B-\u200D\u2060\uFEFF\u00A0]/g, "")
        .replace(/^[\s\p{Emoji}]+|[\s\p{Emoji}]+$/gu, "")
        .trim();
    })
    .filter((n) => n.length > 0);
}

function autoMatch(raw: string, players: Player[]): Player | null {
  const n = normalize(raw);
  return (
    players.find((p) => normalize(p.name) === n) ??
    players.find((p) => normalize(p.name).includes(n) || n.includes(normalize(p.name))) ??
    null
  );
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [copied, setCopied] = useState(false);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importRows, setImportRows] = useState<ImportRow[] | null>(null);
  const [applying, setApplying] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function buildShareText() {
    const a = teamA.map((p) => `  • ${p.name}`).join("\n");
    const b = teamB.map((p) => `  • ${p.name}`).join("\n");
    return `⚽ Team A\n${a}\n\n⚽ Team B\n${b}`;
  }

  function handleShuffle() {
    const all = [...teamA, ...teamB];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    setTeamA(all.filter((_, i) => i % 2 === 0));
    setTeamB(all.filter((_, i) => i % 2 !== 0));
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

  async function handleRenamePlayer(id: string, name: string) {
    if (!name.trim()) return;
    await fetch("/api/players", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, name: name.trim() } : p));
    setTeamA((prev) => prev.map((p) => p.id === id ? { ...p, name: name.trim() } : p));
    setTeamB((prev) => prev.map((p) => p.id === id ? { ...p, name: name.trim() } : p));
    setEditingId(null);
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

  function toggleSelect(id: string, currentPlayers = players) {
    const player = currentPlayers.find((p) => p.id === id)!;
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

  function removeFromTeam(player: Player) {
    setTeamA((prev) => prev.filter((p) => p.id !== player.id));
    setTeamB((prev) => prev.filter((p) => p.id !== player.id));
    setSelected((prev) => { const s = new Set(prev); s.delete(player.id); return s; });
  }

  // --- Import ---
  function handleParse() {
    const names = parseNames(importText);
    const rows: ImportRow[] = names.map((raw) => {
      const match = autoMatch(raw, players);
      return {
        raw,
        action: match ? "matched" : "skip",
        matchedId: match ? match.id : null,
      };
    });
    setImportRows(rows);
  }

  function updateRow(index: number, patch: Partial<ImportRow>) {
    setImportRows((prev) => prev!.map((r, i) => i === index ? { ...r, ...patch } : r));
  }

  async function handleApplyImport() {
    if (!importRows) return;
    setApplying(true);

    let currentPlayers = players;

    let aLen = teamA.length;
    let bLen = teamB.length;

    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i];
      const effectiveAction = row.action === "skip" ? "guest" : row.action;

      let player: Player | undefined;

      if (effectiveAction === "member") {
        // Save to KV and add to permanent list
        const res = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: row.raw }),
        });
        const newPlayer: Player = await res.json();
        currentPlayers = [...currentPlayers, newPlayer];
        setPlayers(currentPlayers);
        player = newPlayer;
      } else if (effectiveAction === "guest") {
        // Temp player — session only, not saved to KV
        player = { id: `guest-${Date.now()}-${i}`, name: row.raw };
      } else if (row.matchedId) {
        player = currentPlayers.find((p) => p.id === row.matchedId);
      }

      if (player && (effectiveAction === "guest" || !selected.has(player.id))) {
        if (effectiveAction !== "guest") setSelected((prev) => new Set(prev).add(player!.id));
        if (aLen <= bLen) { setTeamA((prev) => [...prev, player!]); aLen++; }
        else { setTeamB((prev) => [...prev, player!]); bLen++; }
      }
    }

    setApplying(false);
    setShowImport(false);
    setImportText("");
    setImportRows(null);
  }

  const teamsGenerated = teamA.length > 0 || teamB.length > 0;
  const hasUnknowns = importRows?.some((r) => r.action === "skip");

  return (
    <div className="flex flex-col-reverse md:flex-row-reverse gap-8 items-start">

      {/* Players section */}
      <section className="w-full md:w-72 md:shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Members</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddForm((v) => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="text-xs px-3 py-1 rounded bg-[#1bb1ac26] text-[#1bb1ac] hover:bg-[#1bb1ac40] transition-colors"
            >
              {showAddForm ? "Cancel" : "+ Add"}
            </button>
          </div>
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

        {players.length === 0 ? (
          <p className="text-[#555] text-sm">No players yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 max-h-[240px] md:max-h-[calc(100vh-400px)] overflow-y-auto">
            {players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id))).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded bg-[#1a1a1a] border border-[#222] hover:border-[#333] transition-colors"
              >
                {editingId === p.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleRenamePlayer(p.id, editName); }}
                    className="flex items-center gap-2 flex-1"
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-[#111] border border-[#1bb1ac] rounded px-2 py-0.5 text-sm text-white focus:outline-none"
                    />
                    <button type="submit" className="text-xs text-[#1bb1ac] hover:text-white transition-colors">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-[#555] hover:text-[#aaa] transition-colors">✕</button>
                  </form>
                ) : (
                  <>
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
                      onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                      className="text-[#444] hover:text-[#aaa] text-xs transition-colors ml-2 cursor-pointer"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setConfirmRemove(p)}
                      className="text-[#444] hover:text-[#e05555] text-xs transition-colors ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Teams */}
      <div className="flex flex-col gap-3 flex-1 w-full">
        {!teamsGenerated ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-[#333] rounded-lg px-6 py-10 text-center">
            <p className="text-[#555] text-sm">Paste a numbered list to auto-populate teams.</p>
            <button
              onClick={() => { setShowImport(true); setImportRows(null); setImportText(""); setTeamA([]); setTeamB([]); setSelected(new Set()); }}
              className="px-6 py-2 rounded bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors text-sm font-semibold"
            >
              Import signups
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setShowImport(true); setImportRows(null); setImportText(""); setTeamA([]); setTeamB([]); setSelected(new Set()); }}
            className="text-xs px-2 py-1 md:px-4 md:py-1.5 rounded bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors w-full max-w-[160px]"
          >
            Import
          </button>
        )}
        {teamsGenerated && (
        <section className="border border-[#333] rounded-lg overflow-hidden w-full">
          <div className="flex gap-2 px-4 py-2 border-b border-[#333]">
            <button
              onClick={handleShuffle}
              className="text-xs px-4 py-1.5 rounded bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors flex-1 md:flex-none"
            >
              Shuffle
            </button>
            <button
              onClick={handleShare}
              className="text-xs px-4 py-1.5 rounded bg-[#1bb1ac26] text-[#1bb1ac] hover:bg-[#1bb1ac40] transition-colors flex-1 md:flex-none"
            >
              {copied ? "Copied!" : "Share teams"}
            </button>
          </div>

          <div className="grid grid-cols-2">
            <div className="bg-[#0d3f3e] px-4 py-2 flex items-center justify-end border-r border-[#333]">
              <span className="text-[#1bb1ac] font-semibold text-sm text-right">Team A</span>
            </div>
            <div className="bg-[#1a2a3f] px-4 py-2 flex items-center justify-between">
              <span className="text-[#5599e0] font-semibold text-sm">Team B</span>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-[#333]">
            <ul className="p-3 flex flex-col gap-1">
              {teamA.map((p) => (
                <li
                  key={p.id}
                  onClick={() => moveToB(p)}
                  className="group flex gap-2 items-center justify-end px-3 py-2 rounded bg-[#1a1a1a] cursor-pointer hover:bg-[#1a2a3f] transition-colors"
                >
                  <span className="hidden md:block flex-1 text-xs text-[#444] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity text-right">Switch team →</span>
                  <span className="text-sm text-[#eee] text-right break-words">{p.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromTeam(p); }}
                    className="text-[#444] hover:text-[#e05555] text-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
                  >✕</button>
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
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromTeam(p); }}
                    className="text-[#444] hover:text-[#e05555] text-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
                  >✕</button>
                  <span className="text-sm text-[#eee] min-w-max text-left">{p.name}</span>
                  <span className="hidden md:block flex-1 text-xs text-[#444] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity text-left">← Switch team</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        )}
      </div>

      {/* Remove confirmation */}
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

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-[#1a1a1a] border border-[#333] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Import signups</h2>
              <button onClick={() => setShowImport(false)} className="text-[#555] hover:text-white text-sm">✕</button>
            </div>

            {!importRows ? (
              <>
                <p className="text-[#aaa] text-sm">Paste the WhatsApp or message list below. Numbered entries will be extracted automatically.</p>
                <div className="relative">
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={"Monday 7pm\n\n1. Theo\n2. Eli\n3. Damian..."}
                    rows={10}
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#1bb1ac] resize-none font-mono"
                  />
                  {!importText && (
                    <button
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          setImportText(text);
                        } catch {}
                      }}
                      className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors"
                    >
                      Paste
                    </button>
                  )}
                </div>
                <button
                  onClick={handleParse}
                  disabled={!importText.trim()}
                  className="py-2 rounded bg-[#1bb1ac] text-black text-sm font-semibold hover:bg-[#17a09b] transition-colors disabled:opacity-40"
                >
                  Import
                </button>
              </>
            ) : (
              <>
                <p className="text-[#aaa] text-sm">
                  {hasUnknowns
                    ? "Some names couldn't be matched. Choose what to do with each."
                    : "All names matched. Ready to apply."}
                </p>

                <ul className="flex flex-col gap-2">
                  {importRows.map((row, i) => (
                    <li key={i} className="flex flex-col gap-1 px-3 py-2 rounded bg-[#111] border border-[#222]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-white font-mono">{row.raw}</span>
                        {(row.action === "matched" || row.action === "manual") && row.matchedId && (
                          <span className="text-xs text-[#1bb1ac]">→ {players.find((p) => p.id === row.matchedId)?.name}</span>
                        )}
                        {row.action === "guest" && <span className="text-xs text-[#e0a855]">Guest</span>}
                        {row.action === "member" && <span className="text-xs text-[#1bb1ac]">New member</span>}
                        {row.action === "skip" && <span className="text-xs text-[#555]">Skipped</span>}
                      </div>

                      {(row.action === "skip" || row.action === "manual") && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <select
                            value={row.matchedId ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateRow(i, val
                                ? { action: "manual", matchedId: val }
                                : { action: "skip", matchedId: null }
                              );
                            }}
                            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#1bb1ac]"
                          >
                            <option value="">— map to existing player —</option>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateRow(i, { action: "member", matchedId: null })}
                            className="text-xs px-2 py-1 rounded bg-[#0d3f3e] text-[#1bb1ac] hover:bg-[#10504f] transition-colors"
                          >
                            Add to members
                          </button>
                          <button
                            onClick={() => updateRow(i, { action: "guest", matchedId: null })}
                            className="text-xs px-2 py-1 rounded bg-[#3a2a0a] text-[#e0a855] hover:bg-[#4a3a0a] transition-colors"
                          >
                            Guest
                          </button>
                        </div>
                      )}
                      {(row.action === "guest" || row.action === "member") && (
                        <button
                          onClick={() => updateRow(i, { action: "skip", matchedId: null })}
                          className="text-xs text-[#555] hover:text-[#aaa] transition-colors mt-1 self-start"
                        >
                          Undo
                        </button>
                      )}

                    </li>
                  ))}
                </ul>

                <div className="flex gap-3">
                  <button
                    onClick={handleApplyImport}
                    disabled={applying}
                    className="flex-1 py-2 rounded bg-[#1bb1ac] text-black text-sm font-semibold hover:bg-[#17a09b] transition-colors disabled:opacity-50"
                  >
                    {applying ? "Applying..." : "Apply"}
                  </button>
                  <button
                    onClick={() => setImportRows(null)}
                    className="flex-1 py-2 rounded bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors text-sm"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
