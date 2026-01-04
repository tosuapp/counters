const OSU_CLIENT_ID = '36882';
const OSU_CLIENT_SECRET = 'CDzHH0R5xHpc4OQUvnPT4ivalVvZtvU4zPHNSYNC';
const PROXY_URL = 'https://yes.paraliyzedevo.workers.dev/';

let osuAccessToken = null;
let tokenExpiresAt = 0;

function proxyUrl(targetUrl) {
    return `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
}

async function getOsuToken() {
    if (osuAccessToken && Date.now() < tokenExpiresAt) {
        return osuAccessToken;
    }

    try {
        const response = await axios.post(
            proxyUrl('https://osu.ppy.sh/oauth/token'),
            {
                client_id: OSU_CLIENT_ID,
                client_secret: OSU_CLIENT_SECRET,
                grant_type: 'client_credentials',
                scope: 'public'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        osuAccessToken = response.data.access_token;
        tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
        
        return osuAccessToken;
    } catch (error) {
        console.error('Failed to get osu! API token:', error);
        throw error;
    }
}

async function getOsuHeaders() {
    const token = await getOsuToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
}

export async function getUserDataSet(id) {
    try {
        const headers = await getOsuHeaders();
        const response = await axios.get(
            proxyUrl(`https://osu.ppy.sh/api/v2/users/${id}/osu`),
            { headers: headers }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

export async function postUserID(id) {
    try {
        const headers = await getOsuHeaders();
        const response = await axios.get(
            proxyUrl(`https://osu.ppy.sh/api/v2/users/${id}/osu`),
            { headers: headers }
        );
        
        const profileColor = response.data.profile_colour;
        
        if (profileColor) {
            const hex = profileColor.replace('#', '');
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
        }

        return {
            hsl1: [0.5277777777777778, 0],
            hsl2: [0.5277777777777778, 0]
        };
    } catch (error) {
        console.error('Error fetching user color:', error);
        return {
            hsl1: [0.5277777777777778, 0],
            hsl2: [0.5277777777777778, 0]
        };
    }
}

export async function getUserTop(bestid) {
    try {
        const headers = await getOsuHeaders();
        const response = await axios.get(
            proxyUrl(`https://osu.ppy.sh/api/v2/users/${bestid}/scores/best?mode=osu&limit=100`),
            { headers: headers }
        );
        
        const scores = response.data.map(score => ({
            beatmap_id: score.beatmap.id,
            pp: score.pp,
            mods_id: score.mods.map(mod => mod.acronym).join(''),
            rank: score.rank,
            ended_at: score.ended_at || score.created_at,
            legacy_score_id: score.legacy_score_id || score.id
        }));
        
        return scores;
    } catch (error) {
        console.error('Error fetching user top scores:', error);
        return null;
    }
}

export async function getMapDataSet(beatmapID) {
    try {
        const headers = await getOsuHeaders();
        const response = await axios.get(
            proxyUrl(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapID}`),
            { headers: headers }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching beatmap data:', error);
        return null;
    }
}

export async function getMapScores(beatmapID) {
    try {
        if (!beatmapID || beatmapID === 'undefined' || beatmapID === 'null') {
            console.warn('Invalid beatmap ID:', beatmapID);
            return null;
        }
        
        const headers = await getOsuHeaders();
        const response = await axios.get(
            proxyUrl(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapID}/scores?mode=osu`),
            { headers: headers }
        );

        const scores = response.data.scores?.map(score => {
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
                count_300: count_300,
                count_100: count_100,
                count_50: count_50,
                count_miss: count_miss,
                rank: score.rank,
                pp: score.pp,
                mods: score.mods.map(mod => mod.acronym).join(''),
                acc: accuracy,
                created_at: score.created_at
            };
        }) || [];
        
        return scores.length !== 0 ? scores : null;
    } catch (error) {
        console.error('Error fetching beatmap scores:', error);
        return null;
    }
}

export async function getModsScores(beatmapID, modsString) {
    try {
        if (!beatmapID || beatmapID === 'undefined' || beatmapID === 'null') {
            console.warn('Invalid beatmap ID:', beatmapID);
            return null;
        }
        
        const headers = await getOsuHeaders();
        
        const modsArray = [];
        if (modsString && modsString !== 'NM') {
            for (let i = 0; i < modsString.length; i += 2) {
                modsArray.push(modsString.substr(i, 2));
            }
        }
        
        const response = await axios.get(
            proxyUrl(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapID}/scores?mode=osu`),
            { headers: headers }
        );
        
        let scores = response.data.scores || [];

        if (modsArray.length > 0) {
            scores = scores.filter(score => {
                const scoreMods = score.mods.map(m => m.acronym).sort().join('');
                const requestedMods = modsArray.sort().join('');
                return scoreMods === requestedMods;
            });
        }

        scores = scores.map(score => {
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
                count_300: count_300,
                count_100: count_100,
                count_50: count_50,
                count_miss: count_miss,
                rank: score.rank,
                pp: score.pp,
                mods: score.mods.map(mod => mod.acronym).join(''),
                acc: accuracy,
                created_at: score.created_at
            };
        });
        
        return scores.length !== 0 ? scores : null;
    } catch (error) {
        console.error('Error fetching beatmap scores with mods:', error);
        return null;
    }
}