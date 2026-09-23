export default function Loading() {
  return (
    <main className="bg-[#111] text-[#eee] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="h-7 w-40 bg-[#222] rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-[#1a1a1a] rounded animate-pulse mb-6" />
        <div className="h-9 w-48 bg-[#1a1a1a] rounded-t-lg animate-pulse mb-6" />
        <div className="flex flex-col-reverse md:flex-row-reverse gap-8">
          <div className="w-full md:w-72 flex flex-col gap-2">
            <div className="h-5 w-20 bg-[#222] rounded animate-pulse mb-1" />
            <div className="h-9 w-full bg-[#1a1a1a] rounded animate-pulse" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#1a1a1a] rounded animate-pulse" />
            ))}
          </div>
          <div className="flex-1">
            <div className="h-32 border border-dashed border-[#222] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
