import { list, put, del } from "@vercel/blob";
import { NextRequest } from "next/server";

export async function GET() {
  const { blobs } = await list({ prefix: "favourites/meta/" });
  const items = await Promise.all(
    blobs.map(async (blob) => {
      const res = await fetch(blob.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        cache: "no-store",
      });
      return res.json();
    })
  );
  return Response.json(items);
}

export async function POST(req: NextRequest) {
  const { url, thumbnail, date } = await req.json();
  const id = Date.now().toString(36);

  // Fetch video and thumbnail in parallel
  const [videoRes, thumbRes] = await Promise.all([
    fetch(url),
    fetch(thumbnail),
  ]);
  if (!videoRes.ok || !videoRes.body) throw new Error("Failed to fetch video");
  if (!thumbRes.ok || !thumbRes.body) throw new Error("Failed to fetch thumbnail");

  const thumbContentType = thumbRes.headers.get("Content-Type") ?? "image/jpeg";
  const thumbExt = thumbContentType.includes("png") ? "png" : "jpg";

  // Upload video and thumbnail to Vercel Blob in parallel
  const [videoBlob, thumbBlob] = await Promise.all([
    put(`favourites/videos/${id}.mp4`, videoRes.body, {
      access: "private",
      contentType: "video/mp4",
    }),
    put(`favourites/thumbnails/${id}.${thumbExt}`, thumbRes.body, {
      access: "private",
      contentType: thumbContentType,
    }),
  ]);

  // Store metadata with blob URLs for both video and thumbnail
  const payload = {
    id,
    url: videoBlob.url,
    originalUrl: url,
    thumbnail: thumbBlob.url,
    date,
    savedAt: new Date().toISOString(),
  };
  await put(`favourites/meta/${id}.json`, JSON.stringify(payload), {
    access: "private",
    contentType: "application/json",
  });

  return Response.json({ id });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const [{ blobs: metaBlobs }, { blobs: videoBlobs }, { blobs: thumbBlobs }] = await Promise.all([
    list({ prefix: `favourites/meta/${id}.json` }),
    list({ prefix: `favourites/videos/${id}.mp4` }),
    list({ prefix: `favourites/thumbnails/${id}.` }),
  ]);
  const toDelete = [...metaBlobs, ...videoBlobs, ...thumbBlobs].map((b) => b.url);
  if (toDelete.length > 0) await del(toDelete);
  return Response.json({ success: true });
}
