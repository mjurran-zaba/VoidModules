// Always meticulous in everyhthing to minimize the case
// Be honest in everything
// Be meticulous in everything
// Dont replace or delete code, coment and explain what and why, the write your change below

/**
 * Spotify Decoupled Provider for VoidModules (VoidTune)
 * Implements searchTracks, getTrackMetadata, and getCanvas.
 * Operates on lightweight QuickJS without heavy KMP runtimes.
 */

const TOKEN_ENDPOINT = 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player';
const GQL_ENDPOINT = 'https://api-partner.spotify.com/pathfinder/v2/query';
const SEARCH_HASH = '1d120a8d795b5424cf3b5eb49704040e3ff4db0fa53f533a04cffc165d6666cf';
const WEB_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

let cachedToken = null;
let tokenExpiresAt = 0;

function setting(context, key) {
  const value = context?.settings?.[key]?.value ?? context?.settings?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

async function getAccessToken(context) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const spDc = setting(context, 'spDc');
  const headers = {
    'User-Agent': WEB_USER_AGENT,
    'Accept': 'application/json',
  };

  if (spDc) {
    headers['Cookie'] = `sp_dc=${spDc}`;
  }

  try {
    const response = await fetch(TOKEN_ENDPOINT, { headers });
    if (response.ok) {
      const data = await response.json();
      if (data?.accessToken) {
        cachedToken = data.accessToken;
        tokenExpiresAt = data.accessTokenExpirationTimestampMs || (now + 3600000);
        return cachedToken;
      }
    }
  } catch (_) {}

  return null;
}

async function searchTracks(query, limit = 10, context = null) {
  const token = await getAccessToken(context);
  if (!token) {
    return { tracks: [] };
  }

  const variables = {
    searchTerm: query,
    offset: 0,
    limit: Math.min(limit, 20),
    numberOfTopResults: 5,
    includeAudiobooks: false,
    includeArtistHasConcertsField: false,
    includePreReleases: false,
    includeLocalConcertsField: false,
    includeAuthors: false,
  };

  const extensions = {
    persistedQuery: {
      version: 1,
      sha256Hash: SEARCH_HASH,
    },
  };

  try {
    const response = await fetch(GQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json;charset=UTF-8',
        'App-Platform': 'WebPlayer',
        'User-Agent': WEB_USER_AGENT,
      },
      body: JSON.stringify({
        variables,
        operationName: 'searchDesktop',
        extensions,
      }),
    });

    if (!response.ok) return { tracks: [] };
    const root = await response.json();
    const items = root?.data?.searchV2?.tracksV2?.items || [];

    const tracks = items.map(wrapper => {
      const data = wrapper?.item?.data;
      if (!data) return null;
      const uri = wrapper?.item?._uri || data.uri || `spotify:track:${data.id}`;
      const artists = (data.artists?.items || []).map(a => a?.profile?.name).filter(Boolean);
      const sources = data.albumOfTrack?.coverArt?.sources || [];
      const thumbnail = sources[0]?.url || null;

      return {
        id: uri.replace('spotify:track:', ''),
        title: data.name || '',
        artists: artists.length > 0 ? artists : ['Unknown'],
        album: data.albumOfTrack?.name || null,
        durationSeconds: Math.round((data.trackDuration?.totalMilliseconds || 0) / 1000),
        explicit: !!data.contentRating?.label,
        thumbnailUrl: thumbnail,
      };
    }).filter(Boolean);

    return { tracks };
  } catch (_) {
    return { tracks: [] };
  }
}

async function getTrackMetadata(song, context = null) {
  const query = song?.query || `${song?.title || ''} ${song?.artist || ''}`.trim();
  if (!query) return null;

  const result = await searchTracks(query, 1, context);
  const first = result?.tracks?.[0];
  if (!first) return null;

  return {
    title: first.title,
    artists: first.artists,
    album: first.album,
    artworkUrl: first.thumbnailUrl,
  };
}

async function getCanvas(song, context = null) {
  const token = await getAccessToken(context);
  if (!token) return null;

  const query = song?.query || `${song?.title || ''} ${song?.artist || ''}`.trim();
  if (!query) return null;

  const result = await searchTracks(query, 1, context);
  const track = result?.tracks?.[0];
  if (!track || !track.id) return null;

  return {
    title: track.title,
    artist: track.artists.join(', '),
    staticImage: track.thumbnailUrl,
  };
}

// [AUDIT-FIX 2026-11-26]: ModulePackageReader strictly enforces that provider.js exported
// functions match manifest.json capabilities (actual.length === metadata.capabilities.length).
// Manifest declares ['getTrackMetadata', 'getCanvas']. Exporting searchTracks caused
// TypeError: Provider capability mismatch (QuickJsException at stage=PROVIDER; failure=EXECUTION).
// searchTracks remains available internally for getTrackMetadata and getCanvas, but is omitted from module.exports.
/*
module.exports = {
  searchTracks,
  getTrackMetadata,
  getCanvas,
};
*/
module.exports = {
  getTrackMetadata,
  getCanvas,
};
