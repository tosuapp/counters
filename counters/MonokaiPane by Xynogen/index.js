const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

let everything = document.getElementById("everything");
let bg = document.getElementById("bg");
let title = document.getElementById("title");
let artist = document.getElementById("artist");
let diff = document.getElementById("diff");
let mapper = document.getElementById("mapper");
let hit = document.getElementById("hits");
let hun = document.getElementById("100");
let fifty = document.getElementById("50");
let miss = document.getElementById("0");
let pp = document.getElementById("pp");
let infoContainer = document.getElementById("infoContainer");
let root = document.documentElement;
let rank = document.getElementById('rank');
let mapRank = document.getElementById("rankedStatus");
let rankedColor = document.getElementById("rankedColor");

let $title = document.getElementsByClassName("title");
let $artist = document.getElementsByClassName("artist");

socket.onopen = () => {
    console.log("Successfully Connected");
    socket.send(`applyFilters:${JSON.stringify([
        {
            field: 'menu',
            keys: [
                'state',
                {
                    field: 'bm',
                    keys: [
                        'rankedStatus',
                        {
                            field: 'path',
                            keys: ['full']
                        },
                        {
                            field: 'time',
                            keys: ['current', 'mp3']
                        },
                        {
                            field: 'metadata',
                            keys: ['title', 'artist', 'mapper', 'difficulty']
                        }
                    ]
                }]
        },
        {
            field: 'gameplay',
            keys: [
                {
                    field: 'pp',
                    keys: ['current']
                },
                {
                    field: 'hits',
                    keys: [
                        '100', '50', '0',
                        {
                            field: 'grade',
                            keys: ['current']
                        }
                    ]
                }
            ]
        }
    ])}`)
};

socket.onclose = (event) => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};

socket.onerror = (error) => {
    console.log("Socket Error: ", error);
};

function hide(el) {
    el.classList.add('hide');
    el.classList.remove('show');
}
function show(el) {
    el.classList.remove('hide');
    el.classList.add('show');
}
function toggleFunction() {
    if (rank.classList.contains("show")) {
        hide(rank);
        show($title[0]);
        show($artist[0]);
    } else {
        show(rank);
        hide($title[0]);
        hide($artist[0]);
    }
}


const cache = {};

socket.onmessage = (event) => {
    /** @type {JsonData} */
    const data = JSON.parse(event.data);



    if (cache['grade'] != data.gameplay.hits.grade.current) {
        cache['grade'] = data.gameplay.hits.grade.current;


        switch (cache['grade']) {
            case 'XH':
                rank.style.color = "#D3D3D3";
                rank.style.textShadow = "0 0 0.5rem #D3D3D3";
                break;

            case 'X':
                rank.style.color = "#d6c253";
                rank.style.textShadow = "0 0 0.5rem #d6c253";
                break;

            case 'SH':
                rank.style.color = "#D3D3D3";
                rank.style.textShadow = "0 0 0.5rem #D3D3D3";
                break;

            case 'S':
                rank.style.color = "#d6c253";
                rank.style.textShadow = "0 0 0.5rem #d6c253";
                break;

            case 'A':
                rank.style.color = "#7ed653";
                rank.style.textShadow = "0 0 0.5rem #7ed653";
                break;

            case 'B':
                rank.style.color = "#53d4d6";
                rank.style.textShadow = "0 0 0.5rem #53d4d6";
                break;

            case 'C':
                rank.style.color = "#d6538e";
                rank.style.textShadow = "0 0 0.5rem #d6538e";
                break;

            default:
                rank.style.color = "#d65353";
                rank.style.textShadow = "0 0 0.5rem #d65353";
                break;
        };

        rank.innerHTML = cache['grade'].replace('X', 'SS').replace('H', '');
    };


    if (cache['image'] != data.menu.bm.path.full) {
        cache['image'] = data.menu.bm.path.full;


        let img = cache['image'].replace(/#/g, "%23").replace(/%/g, "%25");
        bg.setAttribute("src", `http://${HOST}/Songs/${img}?a=${Math.random(10000)}`);
    };


    if (cache['rankedStatus'] != data.menu.bm.rankedStatus) {
        cache['rankedStatus'] = data.menu.bm.rankedStatus;

        let mapRanking;
        switch (cache['rankedStatus']) {
            case 7:
                mapRanking = "";
                rankedColor.className = "LOVED";
                break;

            case 4:
                mapRanking = "";
                rankedColor.className = "RANKED";
                break;

            case 5:
                mapRanking = "";
                rankedColor.className = "QUALIFIED";
                break;

            default:
                mapRanking = "";
                rankedColor.className = "GRAVEYARD";
                break;
        };


        mapRank.innerHTML = mapRanking;
    };


    if (cache['state'] != data.menu.state) {
        cache['state'] = data.menu.state;


        if (cache['state'] == 2) {
            hit.style.transform = "translateY(0)";
            infoContainer.style.transform = "translateY(-1.225rem)";

            cache.toggleStatus = setInterval(toggleFunction, 10000);
        }
        else {
            hit.style.transform = "translateY(calc(100% - 0.25rem))";
            infoContainer.style.transform = "translate(0)";
            clearInterval(cache.toggleStatus);

            hide(rank);
            show($title[0]);
            show($artist[0]);
            root.style.setProperty("--progress", 0);
        };
    };


    const time = ((100 / data.menu.bm.time.mp3) * data.menu.bm.time.current).toFixed(1);
    if (cache['time'] != time) {
        cache['time'] = time;


        root.style.setProperty("--progress", `${cache['time']}%`);
    };


    if (cache['diff'] != data.menu.bm.metadata.difficulty) {
        cache['diff'] = data.menu.bm.metadata.difficulty;

        diff.innerHTML = cache['diff'];
    };

    if (cache['mapper'] != data.menu.bm.metadata.mapper) {
        cache['mapper'] = data.menu.bm.metadata.mapper;

        mapper.innerHTML = cache['mapper'];
    };

    if (cache['title'] != data.menu.bm.metadata.title) {
        cache['title'] = data.menu.bm.metadata.title;

        title.innerHTML = cache['title'];
    };

    if (cache['artist'] != data.menu.bm.metadata.artist) {
        cache['artist'] = data.menu.bm.metadata.artist;

        artist.innerHTML = cache['artist'];
    };


    const widthLimit = everything.getBoundingClientRect().width * 0.6;
    const titleWidth = title.offsetWidth;
    const artistWidth = artist.offsetWidth;

    if (titleWidth > widthLimit) {
        const timeTaken = titleWidth / 24;
        title.style.animationDuration = timeTaken + "s";
        title.className = 'textMarquee';
    } else {
        title.className = '';
    };


    if (artistWidth > widthLimit) {
        const timeTaken = artistWidth / 24;
        artist.style.animationDuration = timeTaken + "s";
        artist.className = 'textMarquee';
    } else {
        artist.className = '';
    };


    if (cache['pp'] != data.gameplay.pp.current) {
        cache['pp'] = data.gameplay.pp.current;

        pp.innerHTML = Math.round(cache['pp']);
    };


    if (cache['100'] != data.gameplay.hits[100]) {
        cache['100'] = data.gameplay.hits[100];

        hun.innerHTML = cache['100'];
    };


    if (cache['50'] != data.gameplay.hits[50]) {
        cache['50'] = data.gameplay.hits[50];

        fifty.innerHTML = cache['50'];
    };


    if (cache['0'] != data.gameplay.hits[0]) {
        cache['0'] = data.gameplay.hits[0];

        miss.innerHTML = cache['0'];
    };
};