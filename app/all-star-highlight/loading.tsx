export default function Loading() {
  return (
    <main className="bg-[#111] text-[#eee] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="h-7 w-40 bg-[#222] rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-[#222] animate-pulse">
              <div className="aspect-video bg-[#1a1a1a]" />
              <div className="p-3 flex flex-col gap-2">
                <div className="h-3 bg-[#222] rounded w-1/2" />
                <div className="h-3 bg-[#222] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
