let socket = null;
let osuAccessToken = null;
let tokenExpiresAt = 0;
let clientId = null;
let clientSecret = null;

export function initApiSocket(ws) {
  socket = ws;
}

export function setOsuCredentials(id, secret) {
  clientId = id;
  clientSecret = secret;
  osuAccessToken = null;
  tokenExpiresAt = 0;
}

async function getAccessToken() {
  if (osuAccessToken && Date.now() < tokenExpiresAt) {
    return osuAccessToken;
  }

  if (!clientId || !clientSecret) {
    console.warn('osu! API credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://osu.ppy.sh/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'public'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status}`);
    }

    const data = await response.json();
    osuAccessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    
    return osuAccessToken;
  } catch (error) {
    console.error('Error getting osu! API token:', error);
    return null;
  }
}

async function makeRequest(endpoint) {
  const token = await getAccessToken();
  if (!token) return null;
  
  try {
    const response = await fetch(`https://osu.ppy.sh/api/v2${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    return null;
  }
}

export async function getUserDataSet(username) {
  try {
    const data = await makeRequest(`/users/${username}/osu`);
    if (!data) return null;
    
    return {
      id: data.id,
      username: data.username,
      country_code: data.country_code,
      profile_colour: data.profile_colour,
      statistics: {
        global_rank: data.statistics.global_rank,
        country_rank: data.statistics.country_rank,
        pp: data.statistics.pp
      }
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getUserTop(userId) {
  try {
    const data = await makeRequest(`/users/${userId}/scores/best?mode=osu&limit=100`);
    if (!data) return null;
    
    return data.map(score => ({
      beatmap_id: score.beatmap.id,
      pp: score.pp,
      mods_id: score.mods.map(mod => mod.acronym).join(''),
      rank: score.rank,
      ended_at: score.ended_at || score.created_at,
      legacy_score_id: score.legacy_score_id || score.id
    }));
  } catch (error) {
    console.error('Error fetching user top scores:', error);
    return null;
  }
}

export async function getMapDataSet(beatmapID) {
  if (!beatmapID || beatmapID === 'undefined') return null;
  
  try {
    const data = await makeRequest(`/beatmaps/${beatmapID}`);
    if (!data) return null;
    
    return {
      id: data.id,
      beatmapset_id: data.beatmapset_id,
      difficulty_rating: data.difficulty_rating,
      version: data.version
    };
  } catch (error) {
    console.error('Error fetching beatmap:', error);
    return null;
  }
}

export async function getMapScores(beatmapID) {
  if (!beatmapID || beatmapID === 'undefined' || beatmapID === 'null') {
    return null;
  }
  
  try {
    const data = await makeRequest(`/beatmaps/${beatmapID}/scores?mode=osu`);
    if (!data || !data.scores) return null;

    return data.scores.map(score => {
      const { count_300, count_100, count_50, count_miss } = score.statistics;
      const totalHits = count_300 + count_100 + count_50 + count_miss;
      const accuracy = totalHits > 0 
        ? ((count_300 * 300 + count_100 * 100 + count_50 * 50) / (totalHits * 300)) * 100
        : 0;
      
      return {
        user_id: score.user_id,
        username: score.user?.username || 'Unknown',
        score: score.score,
        max_combo: score.max_combo,
        count_300,
        count_100,
        count_50,
        count_miss,
        rank: score.rank,
        pp: score.pp,
        mods: score.mods.map(mod => mod.acronym).join(''),
        acc: accuracy,
        created_at: score.created_at
      };
    });
  } catch (error) {
    console.error('Error fetching beatmap scores:', error);
    return null;
  }
}

export async function getModsScores(beatmapID, modsString) {
  if (!beatmapID || beatmapID === 'undefined' || beatmapID === 'null') {
    return null;
  }
  
  try {
    const allScores = await getMapScores(beatmapID);
    if (!allScores) return null;

    const modsArray = [];
    if (modsString && modsString !== 'NM') {
      for (let i = 0; i < modsString.length; i += 2) {
        modsArray.push(modsString.substr(i, 2));
      }
    }

    if (modsArray.length === 0) {
      return allScores;
    }

    return allScores.filter(score => {
      const scoreMods = score.mods.match(/.{1,2}/g) || [];
      const requestedMods = modsArray.sort().join('');
      const scoreModsStr = scoreMods.sort().join('');
      return scoreModsStr === requestedMods;
    });
  } catch (error) {
    console.error('Error fetching scores with mods:', error);
    return null;
  }
}

export async function postUserID(id) {
  try {
    const userData = await getUserDataSet(id);
    if (!userData || !userData.profile_colour) {
      return {
        hsl1: [0.5277777777777778, 0],
        hsl2: [0.5277777777777778, 0]
      };
    }

    const hex = userData.profile_colour.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      hsl1: [h, s],
      hsl2: [h, s * 0.8]
    };
  } catch (error) {
    console.error('Error getting user colors:', error);
    return {
      hsl1: [0.5277777777777778, 0],
      hsl2: [0.5277777777777778, 0]
    };
  }
}