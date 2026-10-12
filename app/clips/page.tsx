import { list } from "@vercel/blob";
import { sql } from "@/lib/db";
import DayCard from "./DayCard";
import CourtBadge from "../team-generator/CourtBadge";
import TimeBadge from "./TimeBadge";

interface Clip {
  id: string;
  court_name: string;
  clip_url: string;
  thumbnail_url: string;
  captured_at: string;
}

async function getClips(court: string, time: string): Promise<Record<string, { date: string; url: string; thumbnail: string }[]>> {
  const apiUrl = "https://klipr.live/api/clips?limit=8000&offset=0&sort=recent&venue_id=tekkerz";
  console.log("[clips] API request URL:", apiUrl);

  const res = await fetch(apiUrl, { cache: "no-store" });
  console.log("[clips] API response status:", res.status, res.statusText);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const clips: Clip[] = Array.isArray(data) ? data : data.clips ?? data.data ?? [];

  // Normalise court: "4" → "Court 4", "Court 4" → "Court 4"
  const courtPrefix = court
  ? court.toLowerCase().startsWith("court") ? court : `Court ${court}`
  : null;
  
  // Normalise time: "17" or "17:00" → 17
  const utcHour = time ? parseInt(time, 10) - 2 : null;

  const filtered = clips
    .filter((c) => (courtPrefix ? c.court_name?.startsWith(courtPrefix) : true) && c.captured_at)
    .filter((c) => new Date(c.captured_at).getDay() === 1) // Mondays only
    .filter((c) => {
      if (utcHour === null || isNaN(utcHour)) return true;
      const hour = new Date(c.captured_at).getUTCHours();
      return hour >= utcHour && hour < utcHour + 1;
    });

  const grouped: Record<string, { date: string; url: string; thumbnail: string }[]> = {};
  for (const c of filtered) {
    const day = c.captured_at.slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    const displayDate = new Date(new Date(c.captured_at).getTime() + 2 * 60 * 60 * 1000).toISOString();
    grouped[day].push({ date: displayDate, url: c.clip_url, thumbnail: c.thumbnail_url });
  }

  return grouped;
}

async function getSavedMap(): Promise<Record<string, string>> {
  try {
    const { blobs } = await list({ prefix: "favourites/meta/" });
    if (blobs.length === 0) return {};
    const items = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
          cache: "no-store",
        });
        return res.json() as Promise<{ id: string; originalUrl: string }>;
      })
    );
    return Object.fromEntries(items.map((item) => [item.originalUrl, item.id]));
  } catch {
    return {};
  }
}

function getLastThreeMondays(): string[] {
  const mondays: string[] = [];
  const d = new Date();
  const dayOfWeek = d.getDay();
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - daysToLastMonday);
  for (let i = 0; i < 3; i++) {
    mondays.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 7);
  }
  return mondays;
}

export default async function Page() {
  const [config] = await sql`SELECT court, cliptime FROM camera_config WHERE id = 1`;
  const court = config?.court ?? "";
  const time = config?.cliptime ?? "";

  const [grouped, savedMap] = await Promise.all([getClips(court, time), getSavedMap()]);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const lastThreeMondays = getLastThreeMondays();

  const courtLabel = court
    ? court.toLowerCase().startsWith("court") ? court : `Court ${court}`
    : null;
  const timeLabel = time && !isNaN(parseInt(time, 10)) ? `${time}:00 UTC` : null;

  return (
    <main className="bg-[#111] text-[#eee] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-8 border-b border-[#222]">
          <p className="text-[#aaa] pb-2">
            {days.length === 0
              ? "No clips found."
              : `${days.reduce((n, d) => n + grouped[d].length, 0)} clip(s) · Mondays${courtLabel ? ` · ${courtLabel}` : ""}${timeLabel ? ` · ${timeLabel}` : ""}`}
          </p>
          <div className="flex gap-1">
            <TimeBadge initialTime={time} />
            <CourtBadge initialCourt={court} />
          </div>
        </div>

        <>
          {lastThreeMondays.map((monday) =>
            grouped[monday] ? (
              <DayCard key={monday} day={monday} clips={grouped[monday]} savedMap={savedMap} />
            ) : (
              <div
                key={monday}
                className="mb-4 border border-dashed border-[#333] rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <span className="text-[#555] font-semibold">{monday}</span>
                <span className="text-[#444] text-sm">No clips found</span>
              </div>
            )
          )}
          {days
            .filter((d) => !lastThreeMondays.includes(d))
            .map((day) => (
              <DayCard key={day} day={day} clips={grouped[day]} savedMap={savedMap} />
            ))}
        </>
      </div>
    </main>
  );
}
