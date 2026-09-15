import { list } from "@vercel/blob";
import FavouritesGrid from "./FavouritesGrid";

const FREE_TIER_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB Vercel Blob free tier

interface Favourite {
  id: string;
  url: string;
  thumbnail: string;
  date: string;
  savedAt: string;
}

async function getFavourites(): Promise<Favourite[]> {
  const { blobs } = await list({ prefix: "favourites/meta/" });
  if (blobs.length === 0) return [];
  const items = await Promise.all(
    blobs.map(async (blob) => {
      const res = await fetch(blob.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        cache: "no-store",
      });
      return res.json() as Promise<Favourite>;
    })
  );
  return items.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

async function getStorageUsed(): Promise<number> {
  let totalBytes = 0;
  let cursor: string | undefined;
  do {
    const result = await list({ cursor, limit: 1000 });
    for (const blob of result.blobs) totalBytes += blob.size;
    cursor = result.cursor;
  } while (cursor);
  return totalBytes;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function FavouritesPage() {
  const [favourites, usedBytes] = await Promise.all([getFavourites(), getStorageUsed()]);
  const pct = Math.min((usedBytes / FREE_TIER_BYTES) * 100, 100);
  const color = pct > 90 ? "#e05555" : pct > 70 ? "#e0a855" : "#1bb1ac";

  return (
    <main className="min-h-screen bg-[#111] text-[#eee] font-mono p-8">
      <h1 className="text-white text-2xl font-bold mb-2">Mega Highlights Archive</h1>
      <p className="text-[#aaa] mb-6">
        {favourites.length === 0 ? "No saved clips yet." : `${favourites.length} saved clip(s)`}
      </p>

      <div className="mb-8">
        <div className="flex justify-between text-xs text-[#aaa] mb-1">
          <span>Vercel Blob storage</span>
          <span>{formatBytes(usedBytes)} / 1 GB free</span>
        </div>
        <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>

      <FavouritesGrid initialFavourites={favourites} />
    </main>
  );
}
