// Edge-compatible — no Buffer, no zlib. Uses only Web APIs.

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: "https://www.miruro.tv/",
};
const MIRURO_PIPE_URL = "https://www.miruro.tv/api/secure/pipe";

// ─── base64 / base64url helpers (Web API only) ─────────────────────

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function b64urlEncodeStr(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str));
}

function b64urlDecodeStr(str: string): string {
  return new TextDecoder().decode(base64UrlToBytes(str));
}

function translateId(encodedId: string): string {
  try {
    const decoded = b64urlDecodeStr(encodedId);
    return decoded.includes(":") ? decoded : encodedId;
  } catch {
    return encodedId;
  }
}

function deepTranslate(obj: unknown): void {
  if (Array.isArray(obj)) {
    obj.forEach(deepTranslate);
  } else if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    for (const key of Object.keys(o)) {
      if (key === "id" && typeof o[key] === "string") o[key] = translateId(o[key] as string);
      else deepTranslate(o[key]);
    }
  }
}

// ─── gzip decompression via Web Streams (Edge-supported) ───────────

async function gunzip(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(buf);
}

// ─── Core pipe request ──────────────────────────────────────────────

export async function pipeRequest(
  payload: Record<string, unknown>,
  revalidate?: number
): Promise<Record<string, unknown>> {
  const encoded = b64urlEncodeStr(JSON.stringify({ ...payload, version: "0.1.0" }));
  const url = `${MIRURO_PIPE_URL}?e=${encoded}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: HEADERS,
      ...(revalidate !== undefined ? { next: { revalidate } } : { cache: "no-store" }),
    });
  } catch (err) {
    throw new Error(`MIRURO_NETWORK_ERROR: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MIRURO_HTTP_${res.status}: ${body.slice(0, 300)}`);
  }

  const text = (await res.text()).trim();
  if (!text) throw new Error("MIRURO_EMPTY_RESPONSE");

  let compressed: Uint8Array;
  try {
    compressed = base64UrlToBytes(text);
  } catch (err) {
    throw new Error(`MIRURO_BASE64_DECODE_FAILED: ${(err as Error).message}`);
  }

  let json: string;
  try {
    json = await gunzip(compressed);
  } catch (err) {
    // Usually means Miruro returned a non-gzip error/captcha payload
    // (e.g. edge/datacenter IP flagged) instead of real data.
    throw new Error(`MIRURO_GUNZIP_FAILED (raw: ${text.slice(0, 200)}): ${(err as Error).message}`);
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new Error(`MIRURO_JSON_PARSE_FAILED: ${(err as Error).message}`);
  }

  deepTranslate(data);
  return data;
}