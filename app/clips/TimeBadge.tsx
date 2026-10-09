"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TimeBadge({ initialTime }: { initialTime: string }) {
  const router = useRouter();
  const [time, setTime] = useState(initialTime);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTime);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(time);
    setEditing(true);
  }

  async function save() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed === time) return;
    setTime(trimmed);
    await fetch("/api/cliptime", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: trimmed }),
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
        <span className="text-xs text-[#1bb1ac]">Time (UTC)</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 17"
          className="w-14 bg-transparent border-b border-[#1bb1ac] text-sm text-white text-center focus:outline-none"
        />
      </form>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="px-4 py-2 text-sm rounded-t-lg border-t border-x border-transparent text-[#666] hover:text-[#aaa] transition-colors whitespace-nowrap"
      title="Click to change time (UTC hour)"
    >
      {time ? `${time}:00 UTC` : "Time —"}
    </button>
  );
}
