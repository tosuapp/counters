const HOST = "127.0.0.1:24050";
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

socket.onopen = () => console.log("Successfully Connected");
socket.onclose = (event) => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = (error) => console.log("Socket Error: ", error);


let pp_animation = new CountUp("pp", 0, 0, 0, 0.5, {
    decimalPlaces: 2,
    useEasing: true,
    useGrouping: false,
    separator: " ",
    decimal: ".",
});


const cache = {};

socket.onmessage = (event) => {
    let data = JSON.parse(event.data);

    if (cache['pp'] != data.gameplay.pp.current && (data.menu.state === 2 || data.menu.state === 7)) {
        cache['pp'] = data.gameplay.pp.current;

        pp_animation.update(data.gameplay.pp.current);
    };
};
