let socket = new ReconnectingWebSocket("ws://127.0.0.1:24050/websocket/v2/keys");
let keys = document.getElementById('keys');
let Key1Cont = document.getElementById('Key1Cont');
let Key2Cont = document.getElementById('Key2Cont');
let Mouse1Cont = document.getElementById('Mouse1Cont');
let Mouse2Cont = document.getElementById('Mouse2Cont');
let k1 = new KeyOverlay('k1', 'k1Tiles', { speed: 0.2, keyTextId: "k1Text", keyNameId: "key1"}),
    k2 = new KeyOverlay('k2', 'k2Tiles', { speed: 0.2, keyTextId: "k2Text", keyNameId: "key2"}),
    m1 = new KeyOverlay('m1', 'm1Tiles', { speed: 0.2, keyTextId: "m1Text", keyNameId: "key3"}),
    m2 = new KeyOverlay('m2', 'm2Tiles', { speed: 0.2, keyTextId: "m2Text", keyNameId: "key4"});

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

socket.onmessage = (event) => {
    let data = JSON.parse(event.data);

    if (data.k1.count > 0) {
        Key1Cont.style.opacity = 1
        Key1Cont.style.transform = 'translateY(0)';
    }
    else {
        Key1Cont.style.opacity = 0
        Key1Cont.style.transform = 'translateY(-10px)';
    }
    if (data.k2.count > 0) {
        Key2Cont.style.opacity = 1
        Key2Cont.style.transform = 'translateY(0)';
    }
    else {
        Key2Cont.style.opacity = 0
        Key2Cont.style.transform = 'translateY(-10px)';
    }
    if (data.m1.count > 0) {
        Mouse1Cont.style.opacity = 1
        Mouse1Cont.style.transform = 'translateY(0)';
    }
    else {
        Mouse1Cont.style.opacity = 0
        Mouse1Cont.style.transform = 'translateY(-10px)';
    }
    if (data.m2.count > 0) {
        Mouse2Cont.style.opacity = 1
        Mouse2Cont.style.transform = 'translateY(0)';
    }
    else {
        Mouse2Cont.style.opacity = 0
        Mouse2Cont.style.transform = 'translateY(-10px)';
    }

    k1.update(data.k1, "var(--keyColor)", "var(--keyTap)")
    k2.update(data.k2, "var(--keyColor)", "var(--keyTap)")
    m1.update(data.m1, "var(--keyColor)", "var(--keyTap)")
    m2.update(data.m2, "var(--keyColor)", "var(--keyTap)")
}
