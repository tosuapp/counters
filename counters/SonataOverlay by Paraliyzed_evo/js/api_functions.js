let socket = null;
let apiKey = null;
let profileColor = null;

const CrashReportDebug = document.getElementById('CrashReportDebug');
const CrashReason = document.getElementById('CrashReason');
const API_BASE = 'https://osu.ppy.sh/api';

export function initApiSocket(ws) {
  socket = ws;
  setupTosuConnectionHandlers();
}

function setupTosuConnectionHandlers() {
  const attachHandlers = () => {
    if (socket.sockets?.['/websocket/v2']) {
      const ws = socket.sockets['/websocket/v2'];
      
      const originalOnOpen = ws.onopen;
      ws.onopen = function(event) {
        if (originalOnOpen) originalOnOpen.call(this, event);
        hideTosuWarning();
      };

      const originalOnClose = ws.onclose;
      ws.onclose = function(event) {
        showTosuWarning();
        if (originalOnClose) originalOnClose.call(this, event);
      };

      if (ws.readyState === WebSocket.OPEN) {
        hideTosuWarning();
      }
    } else {
      setTimeout(attachHandlers, 100);
    }
  };
  
  attachHandlers();
}

function showTosuWarning() {
  CrashReportDebug.classList.remove('crashpop');
  CrashReason.innerHTML = 
    `The tosu server socket is currently closed (or the program has crashed). Please relaunch tosu!<br><br>
    If this error still exists, please contact the overlay developer or tosu developer.`;
}

function hideTosuWarning() {
  if (!apiKey) {
    showCredentialsWarning();
  } else {
    CrashReportDebug.classList.add('crashpop');
  }
}

export async function setOsuCredentials(key) {
  apiKey = key;
  
  if (key) {
    console.log('osu! API key set');
    hideCredentialsWarning();
  } else {
    console.log('osu! API key not set');
    showCredentialsWarning();
  }
}

export function setprofileColor(color) {
  profileColor = color;
}

function showCredentialsWarning() {
  CrashReportDebug.classList.remove('crashpop');
  CrashReason.innerHTML = 
    `To enable API features (user top scores, leaderboards):<br><br>
    Add your osu! API Key in the overlay settings<br><br>
    Get your API key at: <a href="https://osu.ppy.sh/p/api" target="_blank" style="color: #a1c9ff;">https://osu.ppy.sh/p/api</a>`;
}

function hideCredentialsWarning() {
  CrashReportDebug.classList.add('crashpop');
  CrashReason.innerHTML = '';
}

export async function getUserDataSet(username) {
  if (!apiKey) {
    console.warn('osu! API key not set');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/get_user?k=${apiKey}&u=${encodeURIComponent(username)}&type=string`);
    if (!response.ok) {
      console.error('API response not OK:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (!data || data.length === 0) {
      console.warn('No user data found for:', username);
      return null;
    }
    
    const user = data[0];
    return {
      id: parseInt(user.user_id),
      username: user.username,
      country_code: user.country,
      statistics: {
        global_rank: parseInt(user.pp_rank) || 0,
        country_rank: parseInt(user.pp_country_rank) || 0,
        pp: parseFloat(user.pp_raw) || 0
      }
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getUserTop(userId) {
  if (!apiKey) {
    console.warn('osu! API key not set');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/get_user_best?k=${apiKey}&u=${userId}&limit=100&type=id`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;
    
    return data.map(score => ({
      beatmap_id: parseInt(score.beatmap_id),
      pp: parseFloat(score.pp),
      mods_id: convertModsNumberToString(parseInt(score.enabled_mods)),
      rank: score.rank,
      ended_at: score.date,
      legacy_score_id: parseInt(score.score_id)
    }));
  } catch (error) {
    console.error('Error fetching user top scores:', error);
    return null;
  }
}

export async function getMapDataSet(beatmapID) {
  if (!apiKey || !beatmapID || beatmapID === 'undefined') {
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE}/get_beatmaps?k=${apiKey}&b=${beatmapID}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;
    
    const beatmap = data[0];
    return {
      id: parseInt(beatmap.beatmap_id),
      beatmapset_id: parseInt(beatmap.beatmapset_id),
      difficulty_rating: parseFloat(beatmap.difficultyrating),
      version: beatmap.version
    };
  } catch (error) {
    console.error('Error fetching beatmap:', error);
    return null;
  }
}

export async function getMapScores(beatmapID, gameMode = 0) {
  if (!apiKey || !beatmapID || beatmapID === 'undefined' || beatmapID === 'null') {
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE}/get_scores?k=${apiKey}&b=${beatmapID}&limit=100`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;

    return data.map(score => {
      const count_300 = parseInt(score.count300);
      const count_100 = parseInt(score.count100);
      const count_50 = parseInt(score.count50);
      const count_miss = parseInt(score.countmiss);
      const count_geki = parseInt(score.countgeki);
      const count_katu = parseInt(score.countkatu);
      let accuracy = 0;

      switch (gameMode) {
        case 0: // osu!standard
          const totalHitsStd = count_300 + count_100 + count_50 + count_miss;
          accuracy = totalHitsStd > 0 
            ? ((count_300 * 300 + count_100 * 100 + count_50 * 50) / (totalHitsStd * 300)) * 100
            : 0;
          break;
          
        case 1: // taiko
          const totalHitsTaiko = count_300 + count_100 + count_miss;
          accuracy = totalHitsTaiko > 0
            ? ((count_300 + count_100 * 0.5) / totalHitsTaiko) * 100
            : 0;
          break;
          
        case 2: // catch
          const totalHitsCatch = count_300 + count_100 + count_50 + count_katu + count_miss;
          accuracy = totalHitsCatch > 0
            ? ((count_300 + count_100 + count_50) / totalHitsCatch) * 100
            : 0;
          break;
          
        case 3: // mania
          const totalHitsMania = count_geki + count_300 + count_katu + count_100 + count_50 + count_miss;
          accuracy = totalHitsMania > 0
            ? ((count_geki * 300 + count_300 * 300 + count_katu * 200 + count_100 * 100 + count_50 * 50) / (totalHitsMania * 300)) * 100
            : 0;
          break;
      }
      
      return {
        user_id: parseInt(score.user_id),
        username: score.username,
        score: parseInt(score.score),
        max_combo: parseInt(score.maxcombo),
        count_300,
        count_100,
        count_50,
        count_miss,
        count_geki,
        count_katu,
        rank: score.rank,
        pp: parseFloat(score.pp),
        mods: convertModsNumberToString(parseInt(score.enabled_mods)),
        acc: accuracy,
        created_at: score.date
      };
    });
  } catch (error) {
    console.error('Error fetching beatmap scores:', error);
    return null;
  }
}

export async function getModsScores(beatmapID, modsString, gameMode = 0) {
  if (!apiKey || !beatmapID || beatmapID === 'undefined' || beatmapID === 'null') {
    return null;
  }
  
  try {
    const allScores = await getMapScores(beatmapID, gameMode);
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

export function postUserID() {
  try {
    const hex = profileColor;

    if (!hex || hex.length !== 8) {
      return {
        hsl1: [0.5277777777777778, 0],
        hsl2: [0.5277777777777778, 0]
      };
    }

    const rgb = hex.slice(2);
    const r = parseInt(rgb.slice(0, 2), 16) / 255;
    const g = parseInt(rgb.slice(2, 4), 16) / 255;
    const b = parseInt(rgb.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
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
  } catch (e) {
    console.error('Error getting profile color from tosu:', e);
    return {
      hsl1: [0.5277777777777778, 0],
      hsl2: [0.5277777777777778, 0]
    };
  }
}

function convertModsNumberToString(modsNumber) {
  if (modsNumber === 0) return 'NM';
  
  const modMap = {
    1: 'NF',
    2: 'EZ',
    8: 'HD',
    16: 'HR',
    32: 'SD',
    64: 'DT',
    128: 'RX',
    256: 'HT',
    512: 'NC',
    1024: 'FL',
    2048: 'SO',
    4096: 'AP',
    8192: 'PF',
    16384: '4K',
    32768: '5K',
    65536: '6K',
    131072: '7K',
    262144: '8K',
    524288: 'FI',
    1048576: 'RD',
    2097152: 'CN',
    4194304: 'TP',
    8388608: '9K',
    16777216: 'CO',
    33554432: '1K',
    67108864: '3K',
    134217728: '2K',
    268435456: 'V2'
  };

  let modsString = '';
  for (const [value, mod] of Object.entries(modMap)) {
    if (modsNumber & parseInt(value)) {
      modsString += mod;
    }
  }

  if (modsString.includes('NC') && modsString.includes('DT')) {
    modsString = modsString.replace('DT', '');
  }
  
  if (modsString.includes('PF') && modsString.includes('SD')) {
    modsString = modsString.replace('SD', '');
  }

  return modsString || 'NM';
}