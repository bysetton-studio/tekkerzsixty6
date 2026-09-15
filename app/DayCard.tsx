"use client";

import { useEffect, useRef, useState } from "react";
import LoadingOverlay from "./LoadingOverlay";

interface Props {
  day: string;
  clips: { date: string; url: string; thumbnail: string }[];
  savedMap: Record<string, string>; // originalUrl -> saved id
}

function SaveButton({
  url,
  thumbnail,
  date,
  initialSavedId,
}: {
  url: string;
  thumbnail: string;
  date: string;
  initialSavedId: string | null;
}) {
  const [savedId, setSavedId] = useState<string | null>(initialSavedId);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, thumbnail, date }),
      });
      const { id } = await res.json();
      setSavedId(id);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsave() {
    if (!savedId) return;
    setLoading(true);
    try {
      await fetch("/api/favourites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedId }),
      });
      setSavedId(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={savedId ? handleUnsave : handleSave}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded transition-colors ${
        savedId
          ? "bg-[#1bb1ac40] text-[#1bb1ac] hover:bg-[#3f1010] hover:text-[#e05555]"
          : "bg-[#1bb1ac26] text-[#1bb1ac] hover:bg-[#1bb1ac40]"
      } disabled:opacity-50`}
    >
      {loading ? "..." : savedId ? "★ Saved" : "Save"}
    </button>
  );
}

function ShareButton({ url }: { url: string }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  async function handleClick() {
    if (isMobile && navigator.share) {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/video?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        const blob = await res.blob();
        const file = new File([blob], "clip.mp4", { type: "video/mp4" });
        await navigator.share({ files: [file], title: "Clip" });
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") throw e;
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setLoading(false);
  }

  const label = isMobile ? "Share" : copied ? "Copied!" : "Copy Link";

  return (
    <>
      {loading && <LoadingOverlay message="Preparing video..." onCancel={handleCancel} />}
      <button
        onClick={handleClick}
        className="text-xs px-3 py-1 rounded bg-[#1bb1ac26] text-[#1bb1ac] hover:bg-[#1bb1ac40] transition-colors"
      >
        {label}
      </button>
    </>
  );
}

function formatDay(day: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return day;
}

export default function DayCard({ day, clips, savedMap }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 border border-[#333] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0d3f3e] hover:bg-[#10504f] transition-colors text-left"
      >
        <span className="text-white font-semibold">{formatDay(day)}</span>
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
                    <SaveButton
                      url={c.url}
                      thumbnail={c.thumbnail}
                      date={c.date}
                      initialSavedId={savedMap[c.url] ?? null}
                    />
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
