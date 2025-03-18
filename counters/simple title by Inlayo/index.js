const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

let title = document.getElementById("title");

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

let tempTitle;

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

socket.onmessage = event => {
    let data = JSON.parse(event.data);
    if (tempTitle !== `♪ ${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title} [${data.menu.bm.metadata.difficulty}] ${data.menu.bm.stats['fullSR']}☆ by ${data.menu.bm.metadata.mapper}`) {
        tempTitle = `♪ ${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title} [${data.menu.bm.metadata.difficulty}] ${data.menu.bm.stats['fullSR']}☆ by ${data.menu.bm.metadata.mapper}`;
        title.innerHTML = tempTitle;
    }
}
