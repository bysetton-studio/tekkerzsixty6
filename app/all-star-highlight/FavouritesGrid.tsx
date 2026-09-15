"use client";

import { useState } from "react";

interface Favourite {
  id: string;
  url: string;
  thumbnail: string;
  date: string;
  savedAt: string;
}

function DeleteModal({
  item,
  onConfirm,
  onCancel,
}: {
  item: Favourite;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deleting, setDeleting] = useState(false);

  function handleFinalConfirm() {
    setDeleting(true);
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`flex flex-col gap-5 p-6 rounded-2xl bg-[#1a1a1a] border border-[#333] w-full transition-all duration-300 ${step === 2 ? "max-w-2xl" : "max-w-sm"}`}>

        {step === 1 && (
          <>
            <h2 className="text-white text-lg font-bold">Are you sure?</h2>
            <p className="text-[#aaa] text-sm">
              This clip will be permanently removed from your All Star highlights. There is no undo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2 rounded-lg bg-[#3f1010] text-[#e05555] hover:bg-[#5a1a1a] transition-colors text-sm"
              >
                Yes, remove it
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-white text-lg font-bold">This is the last time you will see this clip.</h2>
            <p className="text-[#aaa] text-sm">Take one last look.</p>
            <video
              src={`/api/blob?url=${encodeURIComponent(item.url)}`}
              poster={`/api/blob?url=${encodeURIComponent(item.thumbnail)}`}
              controls
              autoPlay
              className="w-full rounded-lg bg-black aspect-video object-cover"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2 rounded-lg bg-[#3f1010] text-[#e05555] hover:bg-[#5a1a1a] transition-colors text-sm"
              >
                I&apos;ve said my goodbyes
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors text-sm"
              >
                Keep it
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-white text-lg font-bold">Final chance.</h2>
            <p className="text-[#aaa] text-sm">
              Once deleted, this clip is gone forever. Are you absolutely certain?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleFinalConfirm}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-[#e05555] text-white hover:bg-[#c04444] transition-colors text-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete forever"}
              </button>
              <button
                onClick={onCancel}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors text-sm disabled:opacity-50"
              >
                Keep it
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default function FavouritesGrid({ initialFavourites }: { initialFavourites: Favourite[] }) {
  const [items, setItems] = useState(initialFavourites);
  const [pendingDelete, setPendingDelete] = useState<Favourite | null>(null);

  async function handleRemove(item: Favourite) {
    await fetch("/api/favourites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setPendingDelete(null);
  }

  if (items.length === 0) {
    return <p className="text-[#555]">No saved clips yet.</p>;
  }

  return (
    <>
      {pendingDelete && (
        <DeleteModal
          item={pendingDelete}
          onConfirm={() => handleRemove(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
              <span className="text-[#aaa] text-xs font-mono">{item.date.replace("T", " ").replace("Z", " UTC")}</span>
              <button
                onClick={() => setPendingDelete(item)}
                className="mt-1 text-xs px-3 py-1 rounded bg-[#3f1010] text-[#e05555] hover:bg-[#5a1a1a] transition-colors self-start"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
