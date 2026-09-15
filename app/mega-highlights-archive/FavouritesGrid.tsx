"use client";

import { useState } from "react";

interface Favourite {
  id: string;
  url: string;
  thumbnail: string;
  date: string;
  savedAt: string;
}

export default function FavouritesGrid({ initialFavourites }: { initialFavourites: Favourite[] }) {
  const [items, setItems] = useState(initialFavourites);

  async function handleRemove(id: string) {
    await fetch("/api/favourites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (items.length === 0) {
    return <p className="text-[#555]">No saved clips yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 border border-[#333] rounded-lg overflow-hidden">
          <video
            src={`/api/blob?url=${encodeURIComponent(item.url)}`}
            poster={`/api/blob?url=${encodeURIComponent(item.thumbnail)}`}
            controls
            preload="none"
            className="w-full bg-black aspect-video object-cover"
          />
          <div className="px-3 pb-3 flex flex-col gap-1">
            <span className="text-[#aaa] text-xs font-mono">{item.date.slice(0, 10)}</span>
            <span className="text-[#555] text-xs">Saved {item.savedAt.slice(0, 10)}</span>
            <button
              onClick={() => handleRemove(item.id)}
              className="mt-1 text-xs px-3 py-1 rounded bg-[#3f1010] text-[#e05555] hover:bg-[#5a1a1a] transition-colors self-start"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
