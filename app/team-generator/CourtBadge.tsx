"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CourtBadge({ initialCourt }: { initialCourt: string }) {
  const router = useRouter();
  const [court, setCourt] = useState(initialCourt);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialCourt);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(court);
    setEditing(true);
  }

  async function save() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed === court) return;
    setCourt(trimmed);
    await fetch("/api/court", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ court: trimmed }),
    });
    router.refresh();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => { e.preventDefault(); save(); }}
        className="px-3 py-2 rounded-t-lg border-t border-x border-[#1bb1ac40] bg-[#0d3f3e] flex items-center gap-1.5"
      >
        <span className="text-xs text-[#1bb1ac]">Court</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          placeholder="—"
          className="w-14 bg-transparent border-b border-[#1bb1ac] text-sm text-white text-center focus:outline-none"
        />
      </form>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="px-4 py-2 text-sm rounded-t-lg border-t border-x border-transparent text-[#666] hover:text-[#aaa] transition-colors whitespace-nowrap"
      title="Click to change court"
    >
      Court {court || "—"}
    </button>
  );
}
