"use client";

import { useState } from "react";

interface Props {
  day: string;
  clips: { date: string; url: string; thumbnail: string }[];
}

function ShareButton({ url }: { url: string }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  async function handleClick() {
    if (isMobile && navigator.share) {
      setLoading(true);
      try {
        const res = await fetch(`/api/video?url=${encodeURIComponent(url)}`);
        const blob = await res.blob();
        const file = new File([blob], "clip.mp4", { type: "video/mp4" });
        await navigator.share({ files: [file], title: "Clip" });
      } finally {
        setLoading(false);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const label = isMobile
    ? loading ? "Loading..." : "Share"
    : copied ? "Copied!" : "Copy Link";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs px-3 py-1 rounded bg-[#1bb1ac26] text-[#1bb1ac] hover:bg-[#1bb1ac40] transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export default function DayCard({ day, clips }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 border border-[#333] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0d3f3e] hover:bg-[#10504f] transition-colors text-left"
      >
        <span className="text-white font-semibold">{day}</span>
        <span className="flex items-center gap-3 text-sm text-[#aaa]">
          {clips.length} clips
          <span className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
        </span>
      </button>

      {open && (
        <div className="bg-[#111] border-t border-[#333] p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clips.map((c) => (
              <div key={c.url} className="flex flex-col gap-1">
                <video
                  src={c.url}
                  poster={c.thumbnail}
                  controls
                  preload="none"
                  className="w-full rounded-lg bg-black aspect-video object-cover"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[#aaa] text-xs font-mono">{c.date.slice(11, 19)}</span>
                  <div className="flex gap-2">
                    <ShareButton url={c.url} />
                    <a
                      href={c.url}
                      download
                      className="text-xs px-3 py-1 rounded bg-[#1bb1ac26] text-[#1bb1ac] hover:bg-[#1bb1ac40] transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
