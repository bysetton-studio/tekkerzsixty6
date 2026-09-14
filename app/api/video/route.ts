import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  const res = await fetch(url);
  if (!res.ok) return new Response("Failed to fetch video", { status: 502 });

  return new Response(res.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": "attachment; filename=clip.mp4",
    },
  });
}
