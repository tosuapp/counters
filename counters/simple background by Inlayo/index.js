const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

let bg = document.getElementById("bg");

socket.onopen = () => {
    console.log("Successfully Connected");
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};

let tempImg;

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

socket.onmessage = event => {
    let data = JSON.parse(event.data);
    if (tempImg !== data.menu.bm.path.full) {
        tempImg = data.menu.bm.path.full
        data.menu.bm.path.full = data.menu.bm.path.full.replace(/#/g, '%23').replace(/%/g, '%25')
        bg.setAttribute('src', `http://${HOST}/Songs/${data.menu.bm.path.full}?a=${Math.random(10000)}`)
    }
}