const BASE = "https://animex.one";

export async function getAnimeSlug(id: string | number) {
  const res = await fetch(`${BASE}/watch/${id}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch page (${res.status})`);
  }

  const html = await res.text();

  // First try: slug:"one-piece-p8k27"
  let match = html.match(/slug:"([^"]+)"/);

  // Fallback: animeId:"one-piece-p8k27"
  if (!match) {
    match = html.match(/animeId:"([^"]+)"/);
  }

  if (!match) {
    throw new Error("Slug not found");
  }

  return match[1];
}