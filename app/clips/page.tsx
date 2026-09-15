import { list } from "@vercel/blob";
import DayCard from "./DayCard";

interface Clip {
  id: string;
  court_name: string;
  clip_url: string;
  thumbnail_url: string;
  captured_at: string;
}

async function getClips(): Promise<Record<string, { date: string; url: string; thumbnail: string }[]>> {
  const res = await fetch(
    "https://klipr.live/api/clips?limit=8000&offset=0&sort=recent&venue_id=tekkerz",
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
  const data = await res.json();
  const clips: Clip[] = Array.isArray(data) ? data : data.clips ?? data.data ?? [];

  const filtered = clips
  .filter((c) => c.court_name?.startsWith("Court 4") && c.captured_at)
  .filter((c) => new Date(c.captured_at).getDay() === 1) // Mondays only
  .filter((c) => {
    const hour = new Date(c.captured_at).getUTCHours();
    return hour >= 17 && hour < 18; // 5–6pm UTC
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
  // Walk backwards to find the most recent Monday (or today if Monday)
  const dayOfWeek = d.getDay(); // 0=Sun,1=Mon,...
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - daysToLastMonday);
  for (let i = 0; i < 3; i++) {
    mondays.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 7);
  }
  return mondays;
}

export default async function Page() {
  const [grouped, savedMap] = await Promise.all([getClips(), getSavedMap()]);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const lastThreeMondays = getLastThreeMondays();

  return (
    <main className="min-h-screen bg-[#111] text-[#eee] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
      <p className="text-[#aaa] mb-8">
        {days.length === 0
          ? "No clips found."
          : `Found ${days.reduce((n, d) => n + grouped[d].length, 0)} clip(s) on Mondays 7–8pm UTC`}
      </p>

      {days.length === 0 && lastThreeMondays.every((m) => !grouped[m]) ? (
        <p className="text-[#aaa]">(no results)</p>
      ) : (
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
      )}
      </div>
    </main>
  );
}
