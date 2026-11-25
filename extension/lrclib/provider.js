// Always meticulous in everyhthing to minimize the case
// Be honest in everything
// Be meticulous in everything
// Dont replace or delete code, coment and explain what and why, the write your change below

/**
 * LRCLIB Provider for VoidTune / ArchiveTune
 * Fetches millisecond-synced (.lrc) and plain text lyrics from https://lrclib.net
 * No API key or account required.
 */

const API_BASE = 'https://lrclib.net/api';
const USER_AGENT = 'VoidTune-LRCLib/1.0.0 (https://github.com/mjurran-zaba/VoidModules)';

const CLEAN_PATTERNS = [
  /\s*[\(\[](?:official\s*(?:video|audio|music\s*video|lyric\s*video)?|lyric\s*video|audio|remastered(?:\s*\d+)?|live|acoustic|visualizer)[\)\]]/gi,
  /\s*-\s*(?:official\s*(?:video|audio)|lyric\s*video|audio|remastered(?:\s*\d+)?|live|acoustic)\s*$/gi,
  /\s*(?:feat\.|ft\.)\s+[^(\[]+/gi,
];

function sanitize(text) {
  return String(text ?? '').trim();
}

function cleanTitle(title) {
  let cleaned = sanitize(title);
  for (const pattern of CLEAN_PATTERNS) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  return cleaned || sanitize(title);
}

async function request(endpoint, params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.append(key, String(value).trim());
    }
  }
  const url = `${API_BASE}${endpoint}?${query.toString()}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
    });

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function toLyricsResult(item) {
  if (!item || item.instrumental) return null;

  const synced = typeof item.syncedLyrics === 'string' ? item.syncedLyrics.trim() : '';
  const plain = typeof item.plainLyrics === 'string' ? item.plainLyrics.trim() : '';

  if (synced) {
    return {
      format: 'lrc',
      lyrics: synced,
      author: sanitize(item.artistName) || 'LRCLIB',
      sourceUrl: item.id ? `https://lrclib.net/api/get/${item.id}` : 'https://lrclib.net',
    };
  }

  if (plain) {
    return {
      format: 'plain',
      lyrics: plain,
      author: sanitize(item.artistName) || 'LRCLIB',
      sourceUrl: item.id ? `https://lrclib.net/api/get/${item.id}` : 'https://lrclib.net',
    };
  }

  return null;
}

async function getLyrics(song, context) {
  if (!song) return null;

  const rawTitle = sanitize(song.title);
  const artist = sanitize(Array.isArray(song.artists) && song.artists.length ? song.artists[0] : song.artist);
  const album = sanitize(song.album);
  const duration = Number(song.duration);
  const durationSec = Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;

  if (!rawTitle) return null;

  // 1. Direct exact match with original metadata
  const exactParams = {
    track_name: rawTitle,
    artist_name: artist || undefined,
  };
  if (album) exactParams.album_name = album;
  if (durationSec) exactParams.duration = durationSec;

  const directResult = await request('/get', exactParams);
  const exactLyrics = toLyricsResult(directResult);
  if (exactLyrics) return exactLyrics;

  // 2. Direct match with cleaned title (strip "Official Video", "(Audio)", etc.)
  const cleaned = cleanTitle(rawTitle);
  if (cleaned !== rawTitle) {
    const cleanedParams = {
      track_name: cleaned,
      artist_name: artist || undefined,
    };
    if (durationSec) cleanedParams.duration = durationSec;
    const cleanedResult = await request('/get', cleanedParams);
    const cleanedLyrics = toLyricsResult(cleanedResult);
    if (cleanedLyrics) return cleanedLyrics;
  }

  // 3. Fallback search
  const searchQuery = artist ? `${cleaned} ${artist}` : cleaned;
  const searchResults = await request('/search', { q: searchQuery });

  if (Array.isArray(searchResults) && searchResults.length > 0) {
    // If duration is known, find closest candidate within 5 seconds tolerance
    if (durationSec) {
      const durationMatches = searchResults.filter(item => {
        const itemDur = Number(item.duration);
        return Number.isFinite(itemDur) && Math.abs(itemDur - durationSec) <= 5;
      });

      // Prefer synced lyrics among duration matches
      const bestDurationSynced = durationMatches.find(item => item.syncedLyrics && !item.instrumental);
      if (bestDurationSynced) return toLyricsResult(bestDurationSynced);

      const bestDurationAny = durationMatches.find(item => (item.syncedLyrics || item.plainLyrics) && !item.instrumental);
      if (bestDurationAny) return toLyricsResult(bestDurationAny);
    }

    // Otherwise, pick first candidate with synced lyrics or any lyrics
    const bestSynced = searchResults.find(item => item.syncedLyrics && !item.instrumental);
    if (bestSynced) return toLyricsResult(bestSynced);

    const bestAny = searchResults.find(item => (item.syncedLyrics || item.plainLyrics) && !item.instrumental);
    if (bestAny) return toLyricsResult(bestAny);
  }

  return null;
}

module.exports = { getLyrics };
