import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  const range = req.headers.get("range");

  const upstream = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      ...(range ? { Range: range } : {}),
    },
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") ?? "video/mp4",
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
  });

  if (upstream.headers.get("Content-Range")) {
    headers.set("Content-Range", upstream.headers.get("Content-Range")!);
  }
  if (upstream.headers.get("Content-Length")) {
    headers.set("Content-Length", upstream.headers.get("Content-Length")!);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
