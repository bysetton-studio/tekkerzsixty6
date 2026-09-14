"use client";

import { useState } from "react";

interface Props {
  day: string;
  clips: { date: string; url: string }[];
}

export default function DayCard({ day, clips }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 border border-[#333] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] transition-colors text-left"
      >
        <span className="text-white font-semibold">{day}</span>
        <span className="flex items-center gap-3 text-sm text-[#aaa]">
          {clips.length} clips
          <span className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
        </span>
      </button>

      {open && (
        <pre className="px-4 py-3 text-[#4fc3f7] text-sm whitespace-pre-wrap bg-[#111] border-t border-[#333]">
          {clips.map((c) => `${c.date}  ${c.url}`).join("\n")}
        </pre>
      )}
    </div>
  );
}
