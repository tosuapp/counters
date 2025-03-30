const HOST = window.location.host;
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

    const is_gameplay = data.menu.state === 2 || data.menu.state === 7;
    if (cache['pp'] != data.gameplay.pp.current && is_gameplay == true) {
        cache['pp'] = data.gameplay.pp.current;

        pp_animation.update(data.gameplay.pp.current);
    };

    if (cache['pp'] != data.menu.pp[100] && is_gameplay == false) {
        cache['pp'] = data.menu.pp[100];
        pp_animation.update(data.menu.pp[100]);
    };
};
