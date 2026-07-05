// 'use server';
import axios from 'axios';
import crypto from 'crypto';

const PORT = process.env.PORT || 3001;
const ALLANIME_API = 'https://api.allanime.day/api';
const ANILIST_GRAPHQL_API = 'https://graphql.anilist.co';
const JIKAN_API = 'https://api.jikan.moe/v4';
const ALLANIME_BASE = 'allanime.day';
const ALLANIME_REFERER = 'https://allanime.day';
const YOUTU_CHAN_REFERER = 'https://youtu-chan.com';
const ALLANIME_EPISODE_QUERY_HASH = 'd405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec';

const HTTP_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
  Referer: YOUTU_CHAN_REFERER,
  Origin: YOUTU_CHAN_REFERER,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'DNT': '1',
};

// ─── Queries ────────────────────────────────────────────────────────────────

const ALLANIME_SEARCH_QUERY = `query($search: SearchInput, $limit: Int, $translationType: VaildTranslationTypeEnumType, $countryOrigin: VaildCountryOriginEnumType) {
  shows(search: $search, limit: $limit, translationType: $translationType, countryOrigin: $countryOrigin) {
    edges {
      _id
      name
      englishName
      malId
      aniListId
      availableEpisodesDetail
    }
  }
}`;

const ALLANIME_EPISODES_QUERY = `query ($showId: String!) {
  show(_id: $showId) {
    _id
    name
    availableEpisodesDetail
    malId
    aniListId
  }
}`;

const ANILIST_TITLE_QUERY = `query ($id: Int) {
  Media(id: $id, type: ANIME) {
    title {
      romaji
      english
      native
    }
  }
}`;

// ─── Decryption ──────────────────────────────────────────────────────────────

const ALLANIME_KEY = crypto.createHash('sha256').update('Xot36i3lK3:v1').digest();

function decrypt(blob: any) {
  try {
    const data = Buffer.from(String(blob), 'base64');
    if (data.length <= 29) return null;
    const iv = Buffer.concat([data.slice(1, 13), Buffer.from('00000002', 'hex')]);
    const ciphertext = data.slice(13, data.length - 16);
    const decipher = crypto.createDecipheriv('aes-256-ctr', ALLANIME_KEY, iv);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch (e) {
    return null;
  }
}

// ─── Provider ID decoder ──────────────────────────────────────────────────────

const decodeMapping: Record<string, string> = {
  '79': 'A', '7a': 'B', '7b': 'C', '7c': 'D', '7d': 'E', '7e': 'F', '7f': 'G',
  '70': 'H', '71': 'I', '72': 'J', '73': 'K', '74': 'L', '75': 'M', '76': 'N', '77': 'O',
  '68': 'P', '69': 'Q', '6a': 'R', '6b': 'S', '6c': 'T', '6d': 'U', '6e': 'V', '6f': 'W',
  '60': 'X', '61': 'Y', '62': 'Z',
  '59': 'a', '5a': 'b', '5b': 'c', '5c': 'd', '5d': 'e', '5e': 'f', '5f': 'g',
  '50': 'h', '51': 'i', '52': 'j', '53': 'k', '54': 'l', '55': 'm', '56': 'n', '57': 'o',
  '48': 'p', '49': 'q', '4a': 'r', '4b': 's', '4c': 't', '4d': 'u', '4e': 'v', '4f': 'w',
  '40': 'x', '41': 'y', '42': 'z',
  '08': '0', '09': '1', '0a': '2', '0b': '3', '0c': '4', '0d': '5', '0e': '6', '0f': '7',
  '00': '8', '01': '9',
  '15': '-', '16': '.', '67': '_', '46': '~', '02': ':', '17': '/', '07': '?',
  '1b': '#', '63': '[', '65': ']', '78': '@', '19': '!', '1c': '$', '1e': '&',
  '10': '(', '11': ')', '12': '*', '13': '+', '14': ',', '03': ';', '05': '=', '1d': '%',
};

function decodeProviderId(hex: string) {
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    result += decodeMapping[hex.substring(i, i + 2)] || '';
  }
  return result.replace('/clock', '/clock.json');
}

// ─── Source line parser (ported from working GitHub version) ─────────────────

function unescapeSource(str: string) {
  return str
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003D/g, '=')
    .replace(/\\/g, '');
}

function normalizeSourceName(sourceName: string, sourceUrl: string) {
  const name = String(sourceName || '').trim();
  const url = String(sourceUrl || '').trim();

  if (/fast4speed|youtu/i.test(url) || /^yt(?:[-_\s]?mp4)?$/i.test(name)) {
    return 'Yt-mp4';
  }

  if (/mp4upload/i.test(url) || /^mp4$/i.test(name)) {
    return 'Mp4';
  }

  return name;
}

function sourceNameKey(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function extractSourcePairs(text: string) {
  const pairs: Array<{ sourceName: string; sourceUrl: string }> = [];
  const sourceUrlFirst = /"sourceUrl":"([^"]*)".*?"sourceName":"([^"]*)"/g;
  const sourceNameFirst = /"sourceName":"([^"]*)".*?"sourceUrl":"([^"]*)"/g;

  for (const match of text.matchAll(sourceUrlFirst)) {
    pairs.push({ sourceUrl: match[1], sourceName: match[2] });
  }

  for (const match of text.matchAll(sourceNameFirst)) {
    pairs.push({ sourceUrl: match[2], sourceName: match[1] });
  }

  return pairs;
}

function collectStructuredSources(node: any, respLines: Array<{ sourceName: string; hex?: string; directUrl?: string }>, seen: Set<string>) {
  if (!node) return;

  if (Array.isArray(node)) {
    for (const item of node) {
      collectStructuredSources(item, respLines, seen);
    }
    return;
  }

  if (typeof node !== 'object') return;

  const sourceUrl = typeof node.sourceUrl === 'string' ? node.sourceUrl : typeof node.url === 'string' ? node.url : null;
  const sourceName = typeof node.sourceName === 'string'
    ? node.sourceName
    : typeof node.provider === 'string'
      ? node.provider
      : typeof node.resolutionStr === 'string'
        ? node.resolutionStr
        : null;

  if (sourceUrl && sourceName) {
    const cleanedUrl = unescapeSource(sourceUrl);
    const normalizedName = normalizeSourceName(sourceName, cleanedUrl);
    const key = `${normalizedName}|${cleanedUrl}`;
    if (!seen.has(key)) {
      seen.add(key);
      if (cleanedUrl.startsWith('--')) {
        respLines.push({ sourceName: normalizedName, hex: cleanedUrl.substring(2) });
      } else if (cleanedUrl.startsWith('http') || cleanedUrl.startsWith('/')) {
        respLines.push({ sourceName: normalizedName, directUrl: cleanedUrl });
      } else {
        respLines.push({ sourceName: normalizedName, hex: cleanedUrl });
      }
    }
  }

  for (const value of Object.values(node)) {
    collectStructuredSources(value, respLines, seen);
  }
}

function parseSourceLines(apiData: { data: { _m: string | any[]; tobeparsed: any; episode: { sourceUrls: any; }; }; tobeparsed: any; }) {
  const respLines: Array<{ sourceName: string; hex?: string; directUrl?: string }> = [];
  const seen = new Set<string>();

  const extractFromBlob = (blob: string | any[]) => {
    if (!blob || blob.length < 50) return;
    const plain = decrypt(blob);
    if (!plain) return;

    const parts = plain.replace(/[{}]/g, '\n').split('\n');
    for (const part of parts) {
      const pairs = extractSourcePairs(part);
      for (const pair of pairs) {
        const sourceUrl = unescapeSource(pair.sourceUrl);
        const sourceName = normalizeSourceName(pair.sourceName, sourceUrl);
        if (sourceUrl.startsWith('--')) {
          respLines.push({ sourceName, hex: sourceUrl.substring(2) });
        } else if (sourceUrl.startsWith('http') || sourceUrl.startsWith('/')) {
          respLines.push({ sourceName, directUrl: sourceUrl });
        } else {
          respLines.push({ sourceName, hex: sourceUrl });
        }
      }
    }
  };

  collectStructuredSources(apiData?.data, respLines, seen);
  collectStructuredSources(apiData?.tobeparsed, respLines, seen);

  // Check all blob locations
  if (apiData?.data?._m && apiData.data._m.length > 10) {
    extractFromBlob(apiData.data._m);
  }
  if (apiData?.data?.tobeparsed) {
    extractFromBlob(apiData.data.tobeparsed);
  }
  if (apiData?.tobeparsed) {
    extractFromBlob(apiData.tobeparsed);
  }

  // Handle sourceUrls array directly
  if (apiData?.data?.episode?.sourceUrls) {
    const raw = JSON.stringify(apiData.data.episode.sourceUrls);
    const cleaned = unescapeSource(raw);
    const parts = cleaned.replace(/[{}]/g, '\n').split('\n');
    for (const part of parts) {
      const pairs = extractSourcePairs(part);
      for (const pair of pairs) {
        const sourceUrl = unescapeSource(pair.sourceUrl);
        const sourceName = normalizeSourceName(pair.sourceName, sourceUrl);
        if (sourceUrl.startsWith('--')) {
          respLines.push({ sourceName, hex: sourceUrl.substring(2) });
        } else if (sourceUrl.startsWith('http') || sourceUrl.startsWith('/')) {
          respLines.push({ sourceName, directUrl: sourceUrl });
        } else {
          respLines.push({ sourceName, hex: sourceUrl });
        }
      }
    }
  }

  return respLines;
}

// ─── Provider link fetchers ──────────────────────────────────────────────────

function b64urlToHex(b64url: any) {
  let padded = b64url;
  const mod = padded.length % 4;
  if (mod === 2) padded += '==';
  else if (mod === 3) padded += '=';
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('hex');
}

async function getFilemoonLinks(providerPath: string) {
  const allLinks: Array<{ resolution: any; url: any; provider: any; needsReferer?: boolean }> & {
    _subtitles?: Array<{ language: any; label: any; url: any }>;
  } = [];
  const fetchUrl = providerPath.startsWith('http') ? providerPath : `https://${ALLANIME_BASE}${providerPath}`;
  try {
    const response = await axios.get(fetchUrl, {
      headers: { 'User-Agent': HTTP_HEADERS['User-Agent'], Referer: YOUTU_CHAN_REFERER },
      timeout: 4000,
    });
    const fmData = response.data;
    if (fmData?.iv && fmData?.payload && fmData?.key_parts) {
      const keyHex = b64urlToHex(fmData.key_parts[0]) + b64urlToHex(fmData.key_parts[1]);
      const ivHex = b64urlToHex(fmData.iv) + '00000002';

      let payloadB64 = fmData.payload;
      const pMod = payloadB64.length % 4;
      if (pMod === 2) payloadB64 += '==';
      else if (pMod === 3) payloadB64 += '=';
      payloadB64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
      const payloadBuf = Buffer.from(payloadB64, 'base64');

      const ciphertext = payloadBuf.slice(0, payloadBuf.length - 16);
      const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(keyHex, 'hex'), Buffer.from(ivHex, 'hex'));
      const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

      const parts = plain.replace(/[{}\[\]]/g, '\n').split('\n');
      for (const part of parts) {
        const m1 = part.match(/"url":"([^"]*)".*"height":(\d+)/);
        const m2 = part.match(/"height":(\d+).*"url":"([^"]*)"/);
        if (m1) {
          allLinks.push({ resolution: m1[2], url: m1[1].replace(/\\u0026/g, '&').replace(/\\u003D/g, '='), provider: 'Fm-mp4' });
        } else if (m2) {
          allLinks.push({ resolution: m2[1], url: m2[2].replace(/\\u0026/g, '&').replace(/\\u003D/g, '='), provider: 'Fm-mp4' });
        }
      }
    }
  } catch (e) {
    console.log('[FILEMOON] fetch failed:', e);
  }
  return allLinks;
}

async function getMp4UploadLinks(pageUrl: string) {
  try {
    const response = await axios.get(pageUrl, {
      headers: { 'User-Agent': HTTP_HEADERS['User-Agent'], Referer: YOUTU_CHAN_REFERER },
      timeout: 25000,
      maxRedirects: 5,
    });
    const html = typeof response.data === 'string' ? response.data : '';
    const m = html.match(/(?:src|file):\s*"([^"]+\.mp4[^"]*)"/i);
    if (m) {
      return [{ resolution: 'Mp4', url: m[1].replace(/\\u0026/g, '&').replace(/\\/g, ''), provider: 'Mp4' }];
    }
  } catch (e) {
    console.log('[MP4UPLOAD] fetch failed:', e);
  }
  return [];
}

async function getProviderLinks(providerPath: string, sourceName: any) {
  if (providerPath.includes('tools.fast4speed.rsvp')) {
    return [{ resolution: 'Yt', url: providerPath, provider: 'Yt-mp4', needsReferer: true }];
  }
  if (providerPath.includes('mp4upload.com')) {
    return getMp4UploadLinks(providerPath);
  }

  const fetchUrl = providerPath.startsWith('http') ? providerPath : `https://${ALLANIME_BASE}${providerPath}`;
  const allLinks: any[] & { _subtitles?: any[] } = [];

  try {
    const response = await axios.get(fetchUrl, {
      headers: { 'User-Agent': HTTP_HEADERS['User-Agent'], Referer: YOUTU_CHAN_REFERER },
      timeout: 4000,
    });
    const data = response.data || {};

    if (Array.isArray(data.links)) {
      for (const link of data.links) {
        if (!link.link) continue;
        const url = link.link;
        const res = link.resolutionStr || 'unknown';

        if (url.includes('repackager.wixmp.com')) {
          const cleaned = url.replace('repackager.wixmp.com/', '').replace(/\.urlset.*/, '');
          const qualitiesMatch = url.match(/\/,([^/]*),\/mp4/);
          if (qualitiesMatch) {
            for (const q of qualitiesMatch[1].split(',')) {
              allLinks.push({ resolution: q, url: cleaned.replace(/,[^/]*/, q), provider: sourceName });
            }
          } else {
            allLinks.push({ resolution: res, url, provider: sourceName });
          }
        } else {
          allLinks.push({ resolution: res, url, provider: sourceName });
        }
      }
    }

    if (data.hls?.url) {
      allLinks.push({ resolution: 'hls', url: data.hls.url, provider: sourceName });
    }

    if (Array.isArray(data.subtitles)) {
      // attach to first link as metadata (returned separately below)
      allLinks._subtitles = data.subtitles.map((s: { lang: any; label: any; src: any; }) => ({
        language: s.lang,
        label: s.label,
        url: s.src,
      }));
    }
  } catch (e) {
    console.log(`[PROVIDER:${sourceName}] fetch failed:`, e);
  }

  return allLinks;
}

// ─── Episode sources API request ──────────────────────────────────────────────

// Minimal headers that match ani-cli / the working GitHub script exactly.
// Extra headers (Accept-Encoding, DNT, Connection, Content-Type on GET) are
// what cause the API to respond with NEED_CAPTCHA.
const EPISODE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
  Referer: YOUTU_CHAN_REFERER,
  Origin: YOUTU_CHAN_REFERER,
};

async function requestAllanimeEpisodeSources(showId: any, mode: any, episode: any) {
  const variables = { showId, translationType: mode, episodeString: String(episode) };
  const extensions = {
    persistedQuery: { version: 1, sha256Hash: ALLANIME_EPISODE_QUERY_HASH },
  };

  // Try persisted-query GET first (bypasses captcha per ani-cli v4.14.0)
  try {
    const getResponse = await axios.get(ALLANIME_API, {
      params: {
        variables: JSON.stringify(variables),
        extensions: JSON.stringify(extensions),
      },
      headers: EPISODE_HEADERS,
      timeout: 8000,
    });

    const raw = JSON.stringify(getResponse.data);
    if (raw.includes('tobeparsed') || raw.includes('"_m"') || raw.includes('sourceUrls')) {
      console.log('[REQUEST] GET succeeded');
      return getResponse.data;
    }
    // If we got data but none of the expected keys, log it so we can debug
    console.log('[REQUEST] GET returned unexpected shape:', raw.substring(0, 200));
  } catch (e) {
    console.log('[REQUEST] GET failed:', e);
  }

  // POST fallback — use the same minimal headers, no extra Content-Type cruft
  console.log('[REQUEST] Falling back to POST...');
  const postResponse = await axios.post(
    ALLANIME_API,
    {
      variables,
      query: `query ($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) {
        episode(showId: $showId translationType: $translationType episodeString: $episodeString) {
          episodeString sourceUrls
        }
      }`,
    },
    {
      headers: {
        ...EPISODE_HEADERS,
        'Content-Type': 'application/json', // required for POST body
      },
      timeout: 8000,
    }
  );

  const raw = JSON.stringify(postResponse.data);
  console.log('[REQUEST] POST response shape:', raw.substring(0, 200));
  return postResponse.data;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeMode(mode: string) {
  return ['sub', 'dub', 'raw'].includes(mode) ? mode : 'sub';
}

function buildCandidateTitles(values: any[]) {
  return [...new Set(values.filter(Boolean).map((v) => v.trim()).filter(Boolean))];
}

function formatShow(show: { _id: any; name: any; englishName: any; aniListId: any; malId: any; }) {
  return {
    allanimeId: show._id,
    name: show.name,
    englishName: show.englishName,
    aniListId: show.aniListId,
    malId: show.malId,
  };
}

async function allanimeSearchByTitle(title: any, mode = 'sub') {
  const response = await axios.post(
    ALLANIME_API,
    {
      query: ALLANIME_SEARCH_QUERY,
      variables: {
        search: { allowAdult: false, allowUnknown: true, query: title },
        limit: 50,
        translationType: normalizeMode(mode),
        countryOrigin: 'ALL',
      },
    },
    { headers: HTTP_HEADERS }
  );
  return response.data?.data?.shows?.edges || [];
}

async function getAniListTitles(aniListId: any) {
  const parsedId = Number.parseInt(String(aniListId), 10);
  if (Number.isNaN(parsedId)) throw new Error('AniList ID must be a number');

  const response = await axios.post(
    ANILIST_GRAPHQL_API,
    { query: ANILIST_TITLE_QUERY, variables: { id: parsedId } },
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  );

  const media = response.data?.data?.Media;
  if (!media) throw new Error('AniList media not found');
  return buildCandidateTitles([media.title?.romaji, media.title?.english, media.title?.native]);
}

async function getMalTitles(malId: any) {
  const parsedId = Number.parseInt(String(malId), 10);
  if (Number.isNaN(parsedId)) throw new Error('MAL ID must be a number');

  const response = await axios.get(`${JIKAN_API}/anime/${parsedId}`);
  const anime = response.data?.data;
  if (!anime) throw new Error('MAL anime not found');
  return buildCandidateTitles([anime.title, anime.title_english, anime.title_japanese]);
}

async function mapByAniListId(aniListId: any, mode = 'sub') {
  const titles = await getAniListTitles(aniListId);
  for (const title of titles) {
    const results = await allanimeSearchByTitle(title, mode);
    const matched = results.find((show: { aniListId: any; }) => String(show.aniListId) === String(aniListId));
    if (matched) return { input: { type: 'anilist', id: String(aniListId), matchedTitle: title }, data: formatShow(matched) };
  }
  throw new Error('No AllAnime mapping found for this AniList ID');
}

async function mapByMalId(malId: any, mode = 'sub') {
  const titles = await getMalTitles(malId);
  for (const title of titles) {
    const results = await allanimeSearchByTitle(title, mode);
    const matched = results.find((show: { malId: any; }) => String(show.malId) === String(malId));
    if (matched) return { input: { type: 'mal', id: String(malId), matchedTitle: title }, data: formatShow(matched) };
  }
  throw new Error('No AllAnime mapping found for this MAL ID');
}

export {
  mapByAniListId,
  mapByMalId,
  decodeProviderId,
  normalizeMode,
  requestAllanimeEpisodeSources,
  getFilemoonLinks,
  getMp4UploadLinks,
  parseSourceLines,
  getProviderLinks,
  buildCandidateTitles,
};