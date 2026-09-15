import { list } from "@vercel/blob";
import Link from "next/link";
import FavouritesGrid from "./FavouritesGrid";

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

export default async function FavouritesPage() {
  const favourites = await getFavourites();

  return (
    <main className="min-h-screen bg-[#111] text-[#eee] font-mono p-8">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/" className="text-[#1bb1ac] hover:underline text-sm">← Back</Link>
      </div>
      <h1 className="text-white text-2xl font-bold mb-2">Mega Highlights Archive</h1>
      <p className="text-[#aaa] mb-8">
        {favourites.length === 0 ? "No saved clips yet." : `${favourites.length} saved clip(s)`}
      </p>
      <FavouritesGrid initialFavourites={favourites} />
    </main>
  );
}
