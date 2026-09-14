interface Clip {
  id: string;
  court_name: string;
  clip_url: string;
  captured_at: string;
}

async function getClips(): Promise<Record<string, { date: string; url: string }[]>> {
  const res = await fetch(
    "https://klipr.live/api/clips?limit=8000&offset=0&sort=recent&venue_id=tekkerz",
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const clips: Clip[] = Array.isArray(data) ? data : data.clips ?? data.data ?? [];

  const filtered = clips
    .filter((c) => c.court_name === "Court 4 - Camera 0" && c.captured_at)
    .filter((c) => new Date(c.captured_at).getDay() === 1) // Mondays only
    .filter((c) => {
      const hour = new Date(c.captured_at).getUTCHours();
      return hour >= 19 && hour < 20; // 7–8pm UTC
    });

  const grouped: Record<string, { date: string; url: string }[]> = {};
  for (const c of filtered) {
    const day = c.captured_at.slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push({ date: c.captured_at, url: c.clip_url });
  }

  return grouped;
}

export default async function Page() {
  const grouped = await getClips();
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <main className="min-h-screen bg-[#111] text-[#eee] font-mono p-8">
      <h1 className="text-white text-2xl font-bold mb-2">Court 4 - Camera 0 Clips</h1>
      <p className="text-[#aaa] mb-8">
        {days.length === 0
          ? "No clips found."
          : `Found ${days.reduce((n, d) => n + grouped[d].length, 0)} clip(s) on Mondays 7–8pm UTC`}
      </p>

      {days.length === 0 ? (
        <p className="text-[#aaa]">(no results)</p>
      ) : (
        days.map((day) => (
          <section key={day} className="mb-8">
            <h2 className="text-white text-lg font-semibold border-b border-[#444] pb-1 mb-3">
              {day} ({grouped[day].length} clips)
            </h2>
            <pre className="text-[#4fc3f7] text-sm whitespace-pre-wrap">
              {grouped[day].map((c) => `${c.date}  ${c.url}`).join("\n")}
            </pre>
          </section>
        ))
      )}
    </main>
  );
}
