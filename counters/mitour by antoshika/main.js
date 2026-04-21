let OSU_API_KEY = ""; 

let teamSeeds = {};
let TEAMS_CONFIG = {};

function processBracketData(data) {
    if (data && data.Teams) {
        teamSeeds = {};
        data.Teams.forEach(t => {
            if (t.FullName) teamSeeds[t.FullName.toLowerCase()] = t.Seed;
            if (t.Acronym) teamSeeds[t.Acronym.toLowerCase()] = t.Seed;
        });
    }
    if (document.getElementById('slideContainer') && data) {
        initSeedRevealWithData(data);
    }
}

const messageTimeCache = new Map();

let currentPlayer = "";
let isAnimatingPlayer = false;

window.onload = () => {
    window.focus();
    if (document.body) document.body.focus();
    
    const playerEl = document.getElementById("player");
    if(playerEl) fitTextToContainer(playerEl);
    
    if (!document.getElementById('player') && typeof TEAMS_CONFIG !== 'undefined' && DEBUG_MODE) {
        const firstTeamName = Object.keys(TEAMS_CONFIG)[0];
        if (firstTeamName) showWinnerScene(firstTeamName, 'red');
    }

    const isMainOverlay = document.getElementById('mappool-overlay') && document.getElementById('top-bar');
    
    let urlParams = new URLSearchParams(window.location.search);
    let pathFromUrl = window.location.pathname.split('/')[1] || "";
    if (pathFromUrl) pathFromUrl = decodeURIComponent(pathFromUrl);
    let currentPathForWelcome = window.COUNTER_PATH || urlParams.get('l') || pathFromUrl || "mitour by antoshika";
    
    window.WELCOME_STORAGE_KEY = 'mitour_welcome_hidden_' + currentPathForWelcome;

    if (isMainOverlay && !localStorage.getItem(window.WELCOME_STORAGE_KEY)) {
        const welcomeHtml = `
            <style>
                .welcome-btn {
                    background: #4a4a6a; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; transition: all 0.3s ease;
                }
                .welcome-btn:hover {
                    background: #6b6b99; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .welcome-close {
                    background: #f44336; border: none; color: white; padding: 10px 30px; font-size: 1em; font-weight: bold; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;
                }
                .welcome-close:hover {
                    background: #ff7961; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(244,67,54,0.4);
                }
                .custom-checkbox {
                    display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; user-select: none; margin-bottom: 20px; font-size: 0.9em; color: #ccc;
                }
                .custom-checkbox input {
                    display: none;
                }
                .checkmark {
                    width: 20px; height: 20px; background: #2a2a40; border: 2px solid #4a4a6a; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;
                }
                .custom-checkbox input:checked ~ .checkmark {
                    background: #a3bffa; border-color: #a3bffa;
                }
                .custom-checkbox input:checked ~ .checkmark::after {
                    content: '✔'; color: #1a1a2e; font-weight: bold; font-size: 14px;
                }
                .thirty-nine {
                    position: absolute; bottom: 10px; right: 20px; font-size: 48px; font-weight: 900; color: rgba(255,255,255,0.15); pointer-events: none;
                }
            </style>
            <div id="welcomeOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); z-index:99999; display:flex; align-items:center; justify-content:center; opacity:1; transition:opacity 0.4s ease;">
                <div style="position:relative; background:#1a1a2e; border: 2px solid #4a4a6a; border-radius:15px; padding:40px; color:white; max-width:500px; text-align:center; font-family:'Montserrat', sans-serif; box-shadow:0 10px 30px rgba(0,0,0,0.5); overflow:hidden;">
                    <h2 style="margin-top:0; color:#a3bffa;">🥬 Welcome to mitour!</h2>
                    <p style="margin-bottom:25px; line-height:1.5; position:relative; z-index:2;">Use the tosu settings panel to configure the bracket, mappool, and teams. Or you can read documentation.</p>
                    <div style="display:flex; gap:15px; justify-content:center; margin-bottom:25px; position:relative; z-index:2;">
                        <a href="https://hatsunemiku39.ru/documentation" target="_blank" class="welcome-btn">Documentation</a>
                    </div>
                    <label class="custom-checkbox" style="position:relative; z-index:2;">
                        <input type="checkbox" id="welcomeDontShow">
                        <div class="checkmark"></div>
                        <span>Don't show again</span>
                    </label>
                    <button onclick="closeWelcome()" class="welcome-close" style="position:relative; z-index:2;">Close</button>
                    <div class="thirty-nine">39!</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', welcomeHtml);
    }
};

window.closeWelcome = function() {
    const dontShow = document.getElementById('welcomeDontShow').checked;
    if (dontShow) localStorage.setItem(window.WELCOME_STORAGE_KEY, 'true');
    const el = document.getElementById('welcomeOverlay');
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
};

window.addEventListener('resize', () => {
    const playerEl = document.getElementById("player");
    if(playerEl) {
        playerEl.style.transform = "scale(1)"; 
        fitTextToContainer(playerEl);
    }
});

window.addEventListener('mousedown', () => {
    window.focus();
    document.body.focus();
});

window.addEventListener('keydown', (e) => {
    if (!document.getElementById('slideContainer')) {
        if (e.key === 'm' || e.key === 'M' || 
            e.key === 'ь' || e.key === 'Ь' || 
            e.code === 'KeyM' || e.keyCode === 77) {
            toggleMappool();
        }
    }
});

let urlParams = new URLSearchParams(window.location.search);
let pathFromUrl = window.location.pathname.split('/')[1] || "";
if (pathFromUrl) pathFromUrl = decodeURIComponent(pathFromUrl);
window.COUNTER_PATH = window.COUNTER_PATH || urlParams.get('l') || pathFromUrl || "mitour by antoshika";

const socket = new Socket("127.0.0.1:24050");

socket.createConnection("/ws", (data) => {
    if (document.getElementById('slideContainer')) return; 

    try {
        let pName = "";
        try {
            if (data.resultsScreen && data.resultsScreen.name) {
                pName = data.resultsScreen.name;
            } else if (data.gameplay && data.gameplay.name) {
                pName = data.gameplay.name;
            }

            if (pName && pName.trim() !== "") {
                if (pName !== currentPlayer && !isAnimatingPlayer) {
                    updatePlayerName(pName);
                }
            }
        } catch (e) {}

        updateOverlay(data);
        
        if (!DEBUG_MODE && data.tourney && data.tourney.manager) {
            handleWinnerData(data.tourney.manager);
        }
    } catch (err) { }
});

socket.createConnection("/websocket/commands", (data) => {
    try {
        if (data.command === 'getSettings') {
            const msg = data.message;
            if (msg.osuApiKey && msg.osuApiKey.trim() !== "") {
                OSU_API_KEY = msg.osuApiKey.trim();
            }
            if (msg.bracketData && msg.bracketData.trim() !== "" && msg.bracketData !== "{}") {
                try {
                    const parsed = JSON.parse(msg.bracketData);
                    processBracketData(parsed);
                } catch(e) {}
            }
            if (msg.mappoolData && msg.mappoolData.trim() !== "" && msg.mappoolData !== "{}") {
                try {
                    const lines = msg.mappoolData.split('\n');
                    const newPicks = {};
                    lines.forEach(line => {
                        const parts = line.split(':');
                        if (parts.length === 2) {
                            const mod = parts[0].trim();
                            const id = parts[1].trim();
                            if (mod && id) newPicks[id] = mod;
                        }
                    });
                    picksData = newPicks;
                    if(document.getElementById('pool-grid')) {
                        renderMappool(); 
                        fetchMapDetails();
                    }
                } catch(e) {}
            }
            if (msg.teamsData && msg.teamsData.trim() !== "" && msg.teamsData !== "{}") {
                try {
                    const lines = msg.teamsData.split('\n');
                    const newTeams = {};
                    lines.forEach(line => {
                        const parts = line.split(':');
                        if (parts.length >= 2) {
                            const teamName = parts.shift().trim();
                            const idsStr = parts.join(':');
                            const ids = idsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                            if (teamName && ids.length > 0) newTeams[teamName] = ids;
                        }
                    });
                    TEAMS_CONFIG = newTeams;
                } catch(e) {}
            }
        }
    } catch(e) {}
});

let currentSetId = -1;
let currentMapId = -1;
let picksData = {}; 
const mapCache = {};
const mapStates = {}; 
let lastChatCount = 0;

const countUpOptions = { duration: 0.8, useEasing: true, separator: ' ' };
let redCountUp = null;
let blueCountUp = null;

let currentWinner = null;
let isDataLoading = false;
const DEBUG_MODE = false; 

if (typeof countUp !== 'undefined') {
    if(document.getElementById('red-score')) {
        redCountUp = new countUp.CountUp('red-score', 0, countUpOptions);
        blueCountUp = new countUp.CountUp('blue-score', 0, countUpOptions);
        redCountUp.start();
        blueCountUp.start();
    }
}


function updatePlayerName(newText) {
    const el = document.getElementById("player");
    if(!el) return;

    isAnimatingPlayer = true;
    el.classList.add("hidden");

    setTimeout(() => {
        el.style.transform = "scale(1)";
        el.innerText = newText;
        
        requestAnimationFrame(() => {
            fitTextToContainer(el);
            
            el.classList.remove("hidden");
            currentPlayer = newText;
            
            setTimeout(() => { isAnimatingPlayer = false; }, 300);
        });
    }, 300); 
}

function fitTextToContainer(el) {
    if (!el.parentElement) return;
    
    el.style.transform = "scale(1)";
    const containerWidth = el.parentElement.offsetWidth; 
    const actualWidth = el.scrollWidth;

    if (actualWidth === 0 || containerWidth === 0) return;

    if (actualWidth > containerWidth) {
        const scale = containerWidth / actualWidth;
        el.style.transform = `scale(${scale})`;
    }
}

const LOCAL_IMG_CACHE_KEY = 'mitour_team_img_exts';
let persistentExtCache = {};
try {
    persistentExtCache = JSON.parse(localStorage.getItem(LOCAL_IMG_CACHE_KEY) || '{}');
} catch(e) {}

const teamImageCache = {};

function setImageWithFallback(element, teamNameRaw, isImgTag = false) {
    if (!teamNameRaw) return;
    const teamName = teamNameRaw.trim();

    if (teamImageCache[teamName]) {
        const src = teamImageCache[teamName];
        if (src === 'none' || src === 'loading') {
            if (src === 'none') {
                if (isImgTag) element.style.display = 'none';
                else element.style.backgroundImage = 'none';
            }
            return;
        }
        if (isImgTag) {
            element.src = src;
            element.style.display = 'block';
        } else {
            element.style.backgroundImage = `url('${src}')`;
        }
        return;
    }

    teamImageCache[teamName] = 'loading';

    let exts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    
    const knownExt = persistentExtCache[teamName];
    if (knownExt && exts.includes(knownExt)) {
        exts = [knownExt, ...exts.filter(e => e !== knownExt)];
    }

    let cur = 0;
    
    function tryNext() {
        if (cur >= exts.length) {
            teamImageCache[teamName] = 'none';
            if (isImgTag) element.style.display = 'none';
            else element.style.backgroundImage = 'none';
            return; 
        }
        
        const ext = exts[cur];
        const src = `imgs/${encodeURIComponent(teamName)}.${ext}`;
        
        const img = new Image();
        img.onload = () => {
            teamImageCache[teamName] = src;
            persistentExtCache[teamName] = ext;
            try {
                localStorage.setItem(LOCAL_IMG_CACHE_KEY, JSON.stringify(persistentExtCache));
            } catch(e) {}

            if (isImgTag) {
                element.src = src;
                element.style.display = 'block';
            } else {
                element.style.backgroundImage = `url('${src}')`;
            }
        };
        img.onerror = () => {
            cur++;
            tryNext();
        };
        img.src = src;
    }
    
    tryNext();
}

function updateOverlay(data) {
    const chatOverlay = document.getElementById('chat-overlay');
    if (chatOverlay) {
        let isPlaying = false;
        if (data.menu && data.menu.state === 2) isPlaying = true;
        if (data.tourney && data.tourney.manager && data.tourney.manager.ipcState === 3) isPlaying = true;
        
        if (isPlaying) chatOverlay.classList.add('hidden');
        else chatOverlay.classList.remove('hidden');
    }

    if (data.menu && data.menu.bm) {
        const bm = data.menu.bm;
        const metadata = bm.metadata;
        const stats = bm.stats;
        const time = bm.time;

        const titleEl = document.getElementById('title');
        const titleWrap = document.querySelector('.title-overflow-wrap');
        
        if(titleEl && titleWrap) {
            const newTitle = metadata.title || "";
            if(titleEl.innerText !== newTitle) {
                titleEl.classList.remove('scrolling');
                titleEl.style.removeProperty('--text-width');
                titleEl.style.removeProperty('--parent-width');
                titleEl.innerText = newTitle;
                void titleEl.offsetWidth; 
                
                if (titleEl.scrollWidth > titleWrap.clientWidth) {
                    titleEl.style.setProperty('--text-width', `${titleEl.scrollWidth}px`);
                    titleEl.style.setProperty('--parent-width', `${titleWrap.clientWidth}px`);
                    titleEl.classList.add('scrolling');
                }
            }
        }

        if(document.getElementById('artist')) document.getElementById('artist').innerText = metadata.artist || "";
        if(document.getElementById('mapid')) document.getElementById('mapid').innerText = bm.id || 0;
        
        if(document.getElementById('cs')) document.getElementById('cs').innerText = stats.CS != null ? stats.CS : 0;
        if(document.getElementById('ar')) document.getElementById('ar').innerText = stats.AR != null ? stats.AR : 0; 
        if(document.getElementById('od')) document.getElementById('od').innerText = stats.OD != null ? stats.OD : 0;
        if(document.getElementById('sr')) document.getElementById('sr').innerText = (stats.fullSR != null ? stats.fullSR : 0).toFixed(2) + "★"; 
        if(document.getElementById('bpm')) document.getElementById('bpm').innerText = Math.round(stats.BPM != null ? stats.BPM.max : 0); 
        
        const currentMs = time.current;
        const totalMs = time.full;
        if(document.getElementById('len')) document.getElementById('len').innerText = `${formatTime(currentMs)} / ${formatTime(totalMs)}`;

        let progressPercent = 0;
        if (totalMs > 0) progressPercent = (currentMs / totalMs) * 100;
        if (progressPercent > 100) progressPercent = 100;
        if (progressPercent < 0) progressPercent = 0;
        
        if(document.getElementById('progress-fill')) document.getElementById('progress-fill').style.width = `${progressPercent}%`;

        if (bm.set !== currentSetId) {
            currentSetId = bm.set;
            let bgUrl = currentSetId > 0 
                ? `https://assets.ppy.sh/beatmaps/${currentSetId}/covers/cover@2x.jpg`
                : `http://127.0.0.1:24050/Background?time=${new Date().getTime()}`;

            const thumbDiv = document.getElementById('map-thumb');
            const bgDiv = document.getElementById('card-bg');
            
            if(thumbDiv) thumbDiv.style.backgroundImage = `url('${bgUrl}')`;
            if(bgDiv) bgDiv.style.backgroundImage = `url('${bgUrl}')`;
        }

        if (bm.id !== currentMapId) {
            currentMapId = bm.id;
            const pickName = picksData[String(bm.id)] || "WARMUP";
            if(document.getElementById('pick-bar')) updatePickBar(pickName);
            if(document.getElementById('inner-pick-badge')) checkInnerPickBadge(bm.id);
        }

        if(document.getElementById('map-status')) {
            updateMapStatus(bm.rankedStatus);
        }
    }

    if (data.tourney && data.tourney.manager) {
        const manager = data.tourney.manager;
        const ipc = data.tourney.ipcClients;
        const leftNameRaw = manager.teamName.left || "Red";
        const rightNameRaw = manager.teamName.right || "Blue";

        let leftSeed = teamSeeds[leftNameRaw.toLowerCase()];
        let rightSeed = teamSeeds[rightNameRaw.toLowerCase()];

        let leftDisplay = leftSeed ? `<span style="color:var(--text-gray); font-size:0.85em;">#${leftSeed}</span> ${leftNameRaw}` : leftNameRaw;
        let rightDisplay = rightSeed ? `${rightNameRaw} <span style="color:var(--text-gray); font-size:0.85em;">#${rightSeed}</span>` : rightNameRaw;

        if(document.getElementById('red-name')) document.getElementById('red-name').innerHTML = leftDisplay;
        if(document.getElementById('blue-name')) document.getElementById('blue-name').innerHTML = rightDisplay;
        if(document.getElementById('red-icon')) setImageWithFallback(document.getElementById('red-icon'), leftNameRaw);
        if(document.getElementById('blue-icon')) setImageWithFallback(document.getElementById('blue-icon'), rightNameRaw);
        if(document.getElementById('red-stars')) renderStars('red-stars', manager.stars.left, manager.bestOF);
        if(document.getElementById('blue-stars')) renderStars('blue-stars', manager.stars.right, manager.bestOF);

		let redS = 0, blueS = 0;
        if (ipc) {
            ipc.forEach(c => {
                let currentScore = (c.gameplay && c.gameplay.score) ? c.gameplay.score : 0;
                if (c.team === 'left' || c.team === 'Red') redS += currentScore;
                if (c.team === 'right' || c.team === 'Blue') blueS += currentScore;
            });
        }
        if (redCountUp) redCountUp.update(redS);
        else if(document.getElementById('red-score')) document.getElementById('red-score').innerText = redS;

        if (blueCountUp) blueCountUp.update(blueS);
        else if(document.getElementById('blue-score')) document.getElementById('blue-score').innerText = blueS;
        
        const diff = Math.abs(redS - blueS);
        const redDiffEl = document.getElementById('red-diff');
        const blueDiffEl = document.getElementById('blue-diff');
        
        if(redDiffEl && blueDiffEl) {
            redDiffEl.innerText = "";
            blueDiffEl.innerText = "";
            redDiffEl.classList.remove('visible');
            blueDiffEl.classList.remove('visible');

            if (redS > blueS) {
                blueDiffEl.innerText = `-${diff.toLocaleString()}`;
                blueDiffEl.classList.add('visible');
            } else if (blueS > redS) {
                redDiffEl.innerText = `-${diff.toLocaleString()}`;
                redDiffEl.classList.add('visible');
            }
        }

        if(document.getElementById('team-red')) document.getElementById('team-red').classList.toggle('leading', redS > blueS);
        if(document.getElementById('team-blue')) document.getElementById('team-blue').classList.toggle('leading', blueS > redS);
    }

    let chatSource = null;
    if (data.tourney) {
        if (data.tourney.chat) chatSource = data.tourney.chat;
        else if (data.tourney.manager && data.tourney.manager.chat) chatSource = data.tourney.manager.chat;
    } else if (data.chat) {
        chatSource = data.chat;
    }

    if (chatSource) updateChat(chatSource);
}

function updateMapStatus(status) {
    const el = document.getElementById('map-status');
    if (!el) return;
    el.className = 'status-badge';
    let activeClass = '';
    if (status === 4) activeClass = 'status-ranked';
    else if (status === 7) activeClass = 'status-loved';
    else if (status === 3 || status === 6) activeClass = 'status-qualified';
    else if (status === 5) activeClass = 'status-approved';
    else if (status === 2 || status === 0) activeClass = 'status-pending';
    else if (status === -1) activeClass = 'status-wip';
    else if (status === -2) activeClass = 'status-graveyard';
    else if (status === 1 || status === null || status === undefined) activeClass = 'status-none';
    if (activeClass) el.classList.add(activeClass, 'visible');
    else el.classList.remove('visible');
}

function handleWinnerData(manager) {
    if (!document.getElementById('winner-container')) return;
    const bestOf = manager.bestOF;
    const winsNeeded = Math.ceil(bestOf / 2);
    const starsLeft = manager.stars.left;
    const starsRight = manager.stars.right;
    
    let winnerTeam = null;
    let winnerSide = null;

    if (starsLeft >= winsNeeded) {
        winnerTeam = manager.teamName.left;
        winnerSide = 'red';
    } else if (starsRight >= winsNeeded) {
        winnerTeam = manager.teamName.right;
        winnerSide = 'blue';
    } else {
        hideWinner();
        return;
    }

    if (winnerTeam && winnerTeam !== currentWinner) {
        currentWinner = winnerTeam;
        showWinnerScene(winnerTeam, winnerSide);
    }
}

async function showWinnerScene(teamName, side) {
    const container = document.getElementById('winner-container');
    if(!container) return;
    isDataLoading = true;
    const labelEl = document.getElementById('team-label');
    const nameEl = document.getElementById('team-name');
    const logoEl = document.getElementById('team-logo');
    
    container.classList.remove('winner-red', 'winner-blue');
    container.classList.add(side === 'red' ? 'winner-red' : 'winner-blue');
    labelEl.innerText = side === 'red' ? "TEAM RED" : "TEAM BLUE";
    
    let seed = teamSeeds[teamName.toLowerCase()];
    if (seed) {
        nameEl.innerHTML = `<span style="color:var(--text-gray); font-size:0.7em;">#${seed}</span> ${teamName}`;
    } else {
        nameEl.innerText = teamName;
    }

    setImageWithFallback(logoEl, teamName);

    let playerIds = TEAMS_CONFIG[teamName];
    if (!playerIds) {
        const key = Object.keys(TEAMS_CONFIG).find(k => k.toLowerCase() === teamName.toLowerCase());
        if (key) playerIds = TEAMS_CONFIG[key];
    }
    if (playerIds) {
        try {
            const players = await Promise.all(playerIds.map(id => fetchPlayer(id)));
            renderPlayers(players);
        } catch (e) { console.error(e); }
    } else {
        document.getElementById('players-grid').innerHTML = '<div class="player-item">No Data</div>';
    }
    container.classList.remove('hidden');
    isDataLoading = false;
}

function hideWinner() {
    const container = document.getElementById('winner-container');
    if (container && !container.classList.contains('hidden')) {
        container.classList.add('hidden');
        currentWinner = null;
    }
}

async function fetchPlayer(userId) {
    if (userId == 18815482) return { name: "antoshika", country: "RU", rank: 0 };
    if (!userId || isNaN(userId)) return { name: "Unknown", country: null, rank: 0 };
    if (OSU_API_KEY) {
        try {
            const res = await fetch(`https://osu.ppy.sh/api/get_user?k=${OSU_API_KEY}&u=${userId}&type=id`);
            if (res.ok) {
                const json = await res.json();
                if (json && json.length > 0) return { name: json[0].username, country: json[0].country, rank: parseInt(json[0].pp_rank) || 0 };
            }
        } catch (e) { }
    }
    try {
        const res = await fetch(`https://api.nerinyan.moe/u/${userId}`);
        if (res.ok) {
            const json = await res.json();
            return { name: json.username, country: json.country_code, rank: json.statistics ? json.statistics.global_rank : 0 };
        }
    } catch (e) { }
    try {
        const res = await fetch(`https://catboy.best/api/v2/user/${userId}`);
        if (res.ok) {
            const json = await res.json();
            return { name: json.username, country: json.country, rank: json.statistics ? json.statistics.global_rank : 0 };
        }
    } catch (e) { }
    return { name: `Player ${userId}`, country: null, rank: 0 };
}

function renderPlayers(players) {
    const grid = document.getElementById('players-grid');
    if(!grid) return;
    grid.innerHTML = '';
    players.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-item';
        let flagHtml = '';
        if (p.country) {
            const countryCode = p.country.toLowerCase();
            flagHtml = `<img src="https://flagcdn.com/w40/${countryCode}.png" class="player-flag" alt="${p.country}">`;
        }
        div.innerHTML = `${flagHtml} <span>${p.name}</span>`; 
        grid.appendChild(div);
    });
}

function checkInnerPickBadge(mapId) {
    const badge = document.getElementById('inner-pick-badge');
    if(!badge) return;
    const status = mapStates[mapId]; 
    badge.classList.remove('red', 'blue', 'visible');
    if (status === 'picked-red') {
        badge.innerText = "PICK";
        badge.classList.add('red', 'visible');
    } else if (status === 'picked-blue') {
        badge.innerText = "PICK";
        badge.classList.add('blue', 'visible');
    }
}

function updateBadgeIfCurrent(clickedMapId) {
    if (Number(clickedMapId) === Number(currentMapId)) checkInnerPickBadge(clickedMapId);
}

function updatePickBar(pickText) {
    const bar = document.getElementById('pick-bar');
    const textEl = document.getElementById('pick-text');
    const topBar = document.getElementById('top-bar');
    
    if(textEl) textEl.innerText = pickText;
    let colorVar = getColorForMod(pickText);
    const colorVal = `var(${colorVar})`;
    
    if(topBar) {
        topBar.style.setProperty('--active-color', colorVal);
        
        if (pickText === "WARMUP") {
            topBar.style.borderColor = "rgba(255,255,255,0.1)";
        } else {
            topBar.style.borderColor = colorVal;
        }
    }
}

function getColorForMod(modStr) {
    if (modStr === "WARMUP") return '--mod-warmup';
    if (modStr.startsWith("NM")) return '--mod-nm';
    if (modStr.startsWith("HD")) return '--mod-hd';
    if (modStr.startsWith("HR")) return '--mod-hr';
    if (modStr.startsWith("DT")) return '--mod-dt';
    if (modStr.startsWith("FM")) return '--mod-fm';
    if (modStr.startsWith("AP")) return '--mod-ap';
    if (modStr.startsWith("TB")) return '--mod-tb';
    if (modStr.startsWith("EZ")) return '--mod-ez';
    return '--mod-def';
}

function formatTime(ms) {
    if (isNaN(ms) || ms < 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function renderStars(elementId, currentWins, bestOf) {
    const container = document.getElementById(elementId);
    if(!container) return;
    container.innerHTML = ''; 
    const winsNeeded = Math.ceil(bestOf / 2);
    for (let i = 0; i < winsNeeded; i++) {
        let div = document.createElement('div');
        div.className = 'star-point';
        if (i < currentWins) div.classList.add('active');
        container.appendChild(div);
    }
}

function toggleMappool() {
    const el = document.getElementById('mappool-overlay');
    if(el) el.classList.toggle('visible');
}

async function fetchMapDetails() {
    const ids = Object.keys(picksData);
    const BATCH_SIZE = 5; 
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(id => loadSingleMap(id)));
    }
}

async function loadSingleMap(id) {
    if (mapCache[id]) return;
    try {
        const response = await fetch(`https://api.nerinyan.moe/b/${id}`);
        if (!response.ok) throw new Error("Err");
        const data = await response.json();
        let mapper = data.beatmapset ? data.beatmapset.creator : "Unknown";
        let diffName = data.version;
        if (!diffName || diffName === "Undefined") diffName = "Unknown";
        mapCache[id] = { title: data.title, artist: data.artist, mapper: mapper, diff: diffName, setId: data.beatmapset_id };
    } catch (error) {
        try {
            const sayoRes = await fetch(`https://api.sayobot.cn/v2/beatmapinfo?K=${id}`);
            const sayoJson = await sayoRes.json();
            if(sayoJson && sayoJson.data) {
                 let diffName = "Unknown";
                 if (sayoJson.data.bid_data) {
                     const bData = sayoJson.data.bid_data.find(b => String(b.bid) === String(id));
                     if (bData && bData.version && bData.version !== "Undefined") diffName = bData.version;
                     else if (sayoJson.data.bid_data.length > 0) diffName = sayoJson.data.bid_data[0].version;
                 }
                 mapCache[id] = { title: sayoJson.data.title, artist: sayoJson.data.artist, mapper: sayoJson.data.creator, diff: diffName, setId: sayoJson.data.sid };
            }
        } catch (e2) {
            mapCache[id] = { title: `Map ID: ${id}`, artist: "Artist", mapper: "Mapper", diff: "Unknown", setId: 0 };
        }
    }
    updateCardUI(id);
}

function updateCardUI(id) {
    const card = document.querySelector(`.pool-card[data-id="${id}"]`);
    if (card && mapCache[id]) {
        const info = mapCache[id];
        const bg = card.querySelector('.pool-card-bg');
        if (info.setId > 0) bg.style.backgroundImage = `url('https://assets.ppy.sh/beatmaps/${info.setId}/covers/cover.jpg')`;
        else bg.style.backgroundColor = '#333';
        card.querySelector('.pc-title').innerText = info.title;
        card.querySelector('.pc-artist').innerText = info.artist;
        card.querySelector('.pc-mapper').innerHTML = `mapper <span>${info.mapper}</span> diff <span>${info.diff}</span>`;
    }
}

function renderMappool() {
    const container = document.getElementById('pool-grid');
    if(!container) return;
    container.innerHTML = '';
    const groups = { NM: [], HD: [], HR: [], DT: [], EZ: [], FM: [], AP: [], TB: [] };
    Object.entries(picksData).forEach(([id, modStr]) => {
        let prefix = modStr.replace(/[0-9]/g, '');
        if (groups[prefix]) groups[prefix].push({ id, modStr });
    });
    const order = ['NM', 'HD', 'HR', 'DT', 'EZ', 'FM', 'AP', 'TB'];
    order.forEach(modTag => {
        const maps = groups[modTag];
        if (maps.length === 0) return;
        maps.sort((a, b) => a.modStr.localeCompare(b.modStr, undefined, {numeric: true}));
        const row = document.createElement('div');
        row.className = 'pool-row';
        maps.forEach(item => {
            const card = document.createElement('div');
            card.className = 'pool-card';
            card.dataset.id = item.id;
            let colorVar = getColorForMod(item.modStr);
            card.innerHTML = `
                <div class="pool-card-bg"></div>
                <div class="pool-card-gradient"></div>
                <div class="status-overlay"></div>
                <div class="pool-card-content">
                    <div class="song-info-block">
                        <div class="pc-artist">Loading...</div>
                        <div class="pc-title">Map ID: ${item.id}</div>
                        <div class="pc-mapper">wait...</div>
                    </div>
                    <div class="mod-tag" style="background: var(${colorVar})">
                        ${item.modStr}
                    </div>
                </div>
            `;
            card.onmousedown = (e) => handlePoolClick(card, e, item.id);
            row.appendChild(card);
        });
        container.appendChild(row);
    });
}

function handlePoolClick(card, e, mapId) {
    e.preventDefault(); 
    const classes = ['picked-red', 'picked-blue', 'banned-red', 'banned-blue', 'protect-red', 'protect-blue'];
    let newStatus = null;
    if (e.shiftKey) {
        classes.forEach(c => card.classList.remove(c));
        mapStates[mapId] = null; 
        updateBadgeIfCurrent(mapId);
        return;
    }
    classes.forEach(c => card.classList.remove(c));
    if (e.altKey) {
        if (e.button === 0) { card.classList.add('protect-red'); newStatus = 'protect-red'; }
        if (e.button === 2) { card.classList.add('protect-blue'); newStatus = 'protect-blue'; }
    } else if (e.ctrlKey) {
        if (e.button === 0) { card.classList.add('banned-red'); newStatus = 'banned-red'; }
        if (e.button === 2) { card.classList.add('banned-blue'); newStatus = 'banned-blue'; }
    } else {
        if (e.button === 0) { card.classList.add('picked-red'); newStatus = 'picked-red'; }
        if (e.button === 2) { card.classList.add('picked-blue'); newStatus = 'picked-blue'; }
    }
    mapStates[mapId] = newStatus;
    updateBadgeIfCurrent(mapId);
}

function updateChat(chatData) {
    if (!chatData) return;
    if (chatData.length === lastChatCount) return;
    const container = document.getElementById('chat-messages');
    if(!container) return;
    container.innerHTML = '';
    const startIndex = Math.max(chatData.length - 8, 0);
    const messagesToShow = chatData.slice(startIndex);
    messagesToShow.forEach((msg, idx) => {
        const originalIndex = startIndex + idx;
        let timeStr;
        if (!messageTimeCache.has(originalIndex)) {
            const now = new Date();
            timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            messageTimeCache.set(originalIndex, timeStr);
        }
        timeStr = messageTimeCache.get(originalIndex);
        let teamClass = 'team-unknown';
        let roleClass = '';
        if (msg.team === 'left' || msg.team === 'Red') teamClass = 'team-left';
        else if (msg.team === 'right' || msg.team === 'Blue') teamClass = 'team-right';
        if (msg.name === 'BanchoBot') roleClass = 'role-banchobot';
        else if (teamClass === 'team-unknown') roleClass = 'role-referee';
        let messageText = msg.messageBody || msg.message || "";
        if (!messageText) return;
        const line = document.createElement('div');
        line.className = 'chat-irc-line';
        line.innerHTML = `<span class="time-stamp">[${timeStr}]</span><span class="user-name ${teamClass} ${roleClass}">${msg.name}:</span> <span class="msg-content">${messageText}</span>`;
        container.appendChild(line);
    });
    lastChatCount = chatData.length;
}

document.addEventListener('contextmenu', event => event.preventDefault());

const SEED_CONFIG = { jsonPath: 'conf/bracket.json' };
const seedMapCache = new Map();
let seedTeams = [];
let seedCurrentTeamIndex = 0;
const MOD_ORDER = ['NM', 'HD', 'HR', 'DT', 'EZ', 'FM', 'AP', 'TB'];

window.nextSlide = async function() {
    if (seedCurrentTeamIndex > 0) {
        seedCurrentTeamIndex--;
        await updateSlideWithAnimation();
    }
};

window.prevSlide = async function() {
    if (seedCurrentTeamIndex < seedTeams.length - 1) {
        seedCurrentTeamIndex++;
        await updateSlideWithAnimation();
    }
};

async function initSeedRevealWithData(data) {
    try {
        if (!data || !data.Teams) throw new Error("Teams not found");
        seedTeams = data.Teams.map(t => {
            let groupedMaps = {};
            MOD_ORDER.forEach(mod => groupedMaps[mod] = []);
            groupedMaps['OTHER'] = [];
            if (t.SeedingResults) {
                t.SeedingResults.forEach(group => {
                    let modName = group.Mod;
                    let targetList = groupedMaps[modName] ? groupedMaps[modName] : groupedMaps['OTHER'];
                    if(group.Beatmaps) {
                        group.Beatmaps.forEach((m, idx) => {
                            const poolId = `${modName}${idx + 1}`;
                            let embeddedInfo = null;
                            if (m.BeatmapInfo && m.BeatmapInfo.Metadata) {
                                embeddedInfo = {
                                    title: m.BeatmapInfo.Metadata.Title,
                                    artist: m.BeatmapInfo.Metadata.Artist,
                                    mapper: m.BeatmapInfo.Metadata.Author.Username,
                                    diff: m.BeatmapInfo.DifficultyName,
                                    cover: m.BeatmapInfo.Covers ? m.BeatmapInfo.Covers['cover@2x'] : null
                                };
                            }
                            targetList.push({ mod: modName, poolId: poolId, seed: parseInt(m.Seed, 10) || m.Seed, score: m.Score, id: m.ID, info: embeddedInfo });
                        });
                    }
                });
            }
            let teamFlagUpper = 'XX';
            if (t.FlagName) teamFlagUpper = t.FlagName.toUpperCase();
            let roster = [];
            if (t.Players) {
                roster = t.Players.map(p => {
                    let cCode = 'XX';
                    if (p.country_code) cCode = p.country_code;
                    else if (p.country && p.country.code) cCode = p.country.code;
                    if (cCode) cCode = cCode.toUpperCase();
                    let pName = p.Username || p.username || p.Name || p.name;
                    if (!pName && t.Players.length === 1) pName = t.FullName;
                    let pId = p.id || p.ID;
                    return { name: pName || (pId ? `Player ${pId}` : null), country: cCode, id: pId };
                }).filter(p => p.name !== null);
            }
            return {
                ...t,
                _seed: parseInt(t.Seed, 10),
                _avgRank: t.AverageRank ? Math.round(t.AverageRank) : 0,
                _groupedMaps: groupedMaps,
                _roster: roster,
                _acronym: t.Acronym,
                _fullname: t.FullName,
                _flagName: teamFlagUpper
            };
        });
        seedTeams.sort((a, b) => a._seed - b._seed);
        seedCurrentTeamIndex = seedTeams.length - 1;
        await preloadMapsForTeam(seedTeams[seedCurrentTeamIndex]);
        renderSlide();
        
        const container = document.getElementById('slideContainer');
        if (container) container.classList.remove('seed-hidden');

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowRight') nextSlide();
            if (e.code === 'ArrowLeft') prevSlide();
        });
    } catch (e) {
        console.error(e);
        document.body.innerHTML = "<h1 style='color:white'>Error: " + e.message + "</h1>";
    }
}

async function fetchBeatmapData(id) {
    if (OSU_API_KEY) {
        try {
            const res = await fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${OSU_API_KEY}&b=${id}`);
            if (res.ok) {
                const json = await res.json();
                if (json && json.length > 0) {
                    const data = json[0];
                    return { 
                        title: data.title, 
                        artist: data.artist, 
                        mapper: data.creator, 
                        diff: data.version, 
                        setId: data.beatmapset_id,
                        cover: `https://assets.ppy.sh/beatmaps/${data.beatmapset_id}/covers/cover.jpg`
                    };
                }
            }
        } catch(e) {}
    }
    
    try {
        const sayoRes = await fetch(`https://api.sayobot.cn/v2/beatmapinfo?K=${id}&T=4`);
        if (sayoRes.ok) {
            const sayoJson = await sayoRes.json();
            if(sayoJson && sayoJson.data) {
                 let diffName = "Unknown";
                 if (sayoJson.data.bid_data) {
                     const bData = sayoJson.data.bid_data.find(b => String(b.bid) === String(id));
                     if (bData && bData.version && bData.version !== "Undefined") diffName = bData.version;
                     else if (sayoJson.data.bid_data.length > 0) diffName = sayoJson.data.bid_data[0].version;
                 }
                 return { 
                     title: sayoJson.data.title, 
                     artist: sayoJson.data.artist, 
                     mapper: sayoJson.data.creator, 
                     diff: diffName, 
                     setId: sayoJson.data.sid,
                     cover: `https://assets.ppy.sh/beatmaps/${sayoJson.data.sid}/covers/cover.jpg`
                 };
            }
        }
    } catch (e2) {}

    return { title: `Map ID: ${id}`, artist: "Artist", mapper: "Mapper", diff: "Unknown", setId: 0, cover: null };
}

async function loadSingleMap(id) {
    if (mapCache[id]) return;
    const data = await fetchBeatmapData(id);
    mapCache[id] = data;
    updateCardUI(id);
}

async function getMapInfo(beatmapId) {
    if (seedMapCache.has(beatmapId)) return seedMapCache.get(beatmapId);
    const data = await fetchBeatmapData(beatmapId);
    seedMapCache.set(beatmapId, data);
    return data;
}

async function preloadMapsForTeam(team) {
    if (!team) return;
    const promises = [];
    if (team._groupedMaps) {
        for (const mod in team._groupedMaps) {
            team._groupedMaps[mod].forEach(m => {
                if (!m.info && m.id) {
                    promises.push(getMapInfo(m.id).then(data => {
                        m.info = data;
                    }));
                }
            });
        }
    }
    if (team._roster) {
        team._roster.forEach(p => {
            if ((p.name && p.name.startsWith('Player ')) || !p._rankFetched) {
                promises.push(fetchPlayer(p.id).then(data => {
                    p.name = data.name;
                    if (data.country) p.country = data.country.toUpperCase();
                    if (data.rank) p.rank = data.rank;
                    p._rankFetched = true;
                }));
            }
        });
    }
    await Promise.all(promises);

    if (!team._avgRank || team._avgRank === 0) {
        if (team._roster && team._roster.length > 0) {
            const validRanks = team._roster.filter(p => p.rank && p.rank > 0).map(p => p.rank);
            if (validRanks.length > 0) {
                team._avgRank = Math.round(validRanks.reduce((a, b) => a + b, 0) / validRanks.length);
            }
        }
    }
}

async function updateSlideWithAnimation() {
    const container = document.getElementById('slideContainer');
    if (container) {
        container.style.opacity = 0;
        container.style.transition = 'opacity 0.3s ease';
        setTimeout(async () => {
            await preloadMapsForTeam(seedTeams[seedCurrentTeamIndex]);
            renderSlide();
            container.style.opacity = 1;
        }, 300);
    } else {
        await preloadMapsForTeam(seedTeams[seedCurrentTeamIndex]);
        renderSlide();
    }
}

function renderSlide() {
    const team = seedTeams[seedCurrentTeamIndex];
    if (!team) return;

    const teamSeedEl = document.getElementById('teamSeed');
    if (teamSeedEl) teamSeedEl.innerText = `#${team._seed}`;

    const seedWrapper = document.getElementById('seedWrapper');
    if (seedWrapper) {
        seedWrapper.classList.remove('seed-gold', 'seed-silver', 'seed-bronze');
        if (team._seed === 1) seedWrapper.classList.add('seed-gold');
        else if (team._seed === 2) seedWrapper.classList.add('seed-silver');
        else if (team._seed === 3) seedWrapper.classList.add('seed-bronze');
    }
    
    const fullnameEl = document.getElementById('teamFullname');
    if (fullnameEl) fullnameEl.innerText = team._fullname || team._acronym || "Unknown Team";

    const flagEl = document.getElementById('teamFlag');
    if (flagEl) {
        if (team._flagName && team._flagName !== 'XX') {
            flagEl.src = `https://flagcdn.com/w40/${team._flagName.toLowerCase()}.png`;
            flagEl.style.display = 'block';
        } else {
            flagEl.style.display = 'none';
        }
    }

    const avatarEl = document.getElementById('teamAvatar');
    if (avatarEl) {
        const teamName = team._fullname || team._acronym;
        if (teamName) {
            setImageWithFallback(avatarEl, teamName, true);
        } else {
            avatarEl.style.display = 'none';
        }
    }

    const rankEl = document.getElementById('teamRank');
    if (rankEl) {
        rankEl.innerText = `#${team._avgRank || 0}`;
        document.getElementById('rankBlock').style.display = 'block';
    }

    const rosterBlock = document.getElementById('rosterBlock');
    const rosterList = document.getElementById('rosterList');
    if (rosterBlock && rosterList) {
        rosterList.innerHTML = '';
        if (team._roster && team._roster.length > 0) {
            rosterBlock.style.display = 'block';
            team._roster.forEach(player => {
                const pDiv = document.createElement('div');
                pDiv.className = 'player-card';
                
                const pAvatar = document.createElement('img');
                pAvatar.className = 'p-avatar';
                pAvatar.src = player.id ? `https://a.ppy.sh/${player.id}` : '';
                pAvatar.onerror = () => pAvatar.style.display = 'none';
                
                const pInfo = document.createElement('div');
                pInfo.className = 'p-info';
                
                if (player.country && player.country !== 'XX') {
                    const pFlag = document.createElement('img');
                    pFlag.className = 'p-flag';
                    pFlag.src = `https://flagcdn.com/w40/${player.country.toLowerCase()}.png`;
                    pInfo.appendChild(pFlag);
                }
                
                const pName = document.createElement('span');
                pName.className = 'p-name';
                pName.innerText = player.name;
                pInfo.appendChild(pName);
                
                pDiv.appendChild(pAvatar);
                pDiv.appendChild(pInfo);
                rosterList.appendChild(pDiv);
            });
        } else {
            rosterBlock.style.display = 'none';
        }
    }

    const modsContainer = document.getElementById('modsContainer');
    if (modsContainer) {
        modsContainer.innerHTML = '';
        MOD_ORDER.forEach(mod => {
            const maps = team._groupedMaps[mod];
            if (!maps || maps.length === 0) return;
            
            const modCol = document.createElement('div');
            modCol.className = 'mod-column';
            
            const modHeader = document.createElement('div');
            modHeader.className = 'mod-header';
            modHeader.innerText = mod;
            let colorVar = getColorForMod(mod);
            modHeader.style.color = `var(${colorVar})`;
            modHeader.style.borderLeftColor = `var(${colorVar})`;
            modCol.appendChild(modHeader);
            
            maps.forEach(m => {
                const card = document.createElement('div');
                card.className = 'map-card';
                
                const info = m.info || { title: `Map ID: ${m.id}`, mapper: "Unknown", diff: "Unknown", cover: null, setId: 0 };
                
                let bgUrl = '';
                if (info.cover) bgUrl = info.cover;
                else if (info.setId > 0) bgUrl = `https://assets.ppy.sh/beatmaps/${info.setId}/covers/cover.jpg`;
                
                let rankClass = '';
                if (m.seed === 1) rankClass = 'rank-gold';
                else if (m.seed === 2) rankClass = 'rank-silver';
                else if (m.seed === 3) rankClass = 'rank-bronze';

                card.innerHTML = `
                    ${bgUrl ? `<div class="map-bg" style="background-image: url('${bgUrl}');"></div>` : `<div class="map-bg-fallback"></div>`}
                    <div class="map-content">
                        <div class="map-top">
                            <span class="pool-id" style="color: var(${colorVar})">${m.poolId || ''}</span>
                            <div class="map-info">
                                <div class="marquee-container">
                                    <span class="song-title-seed">${info.title} [${info.diff}]</span>
                                </div>
                                <span class="map-mapper">${info.mapper}</span>
                            </div>
                        </div>
                        <div class="map-bot">
                            <span class="map-rank ${rankClass}">#${m.seed || 0}</span>
                            <span class="map-score">${m.score ? (Math.round(m.score * 100) / 100).toLocaleString('en-US') : 0}</span>
                        </div>
                    </div>
                `;
                modCol.appendChild(card);
            });
            modsContainer.appendChild(modCol);
        });

        setTimeout(() => {
            document.querySelectorAll('.song-title-seed').forEach(el => {
                if (el.scrollWidth > el.parentElement.clientWidth) {
                    el.classList.add('scroll');
                } else {
                    el.classList.remove('scroll');
                }
            });
        }, 100);
    }
}