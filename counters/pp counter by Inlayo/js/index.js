const HOST = "127.0.0.1:24050";
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);
let wrapper = document.getElementById("wrapper");

socket.onopen = () => console.log("Successfully Connected");
socket.onclose = (event) => {
  console.log("Socket Closed Connection: ", event);
  socket.send("Client Closed!");
};
socket.onerror = (error) => console.log("Socket Error: ", error);

let animation = {
  pp: new CountUp("pp", 0, 0, 0, 0.5, {
    decimalPlaces: 2,
    useEasing: true,
    useGrouping: false,
    separator: " ",
    decimal: ".",
  }),
};

let tempState;
let seek;
let fullTime;
let onepart;

socket.onmessage = (event) => {
  let data = JSON.parse(event.data);

  if (data.menu.state !== tempState) {
    tempState = data.menu.state;
  }
  if (data.gameplay.pp.current !== "" && (tempState === 2 || tempState === 7)) {
    animation.pp.update(data.gameplay.pp.current);
  }
  if (data.menu.pp[100] !== "" && tempState !== 2 && tempState !== 7) {
    animation.pp.update(data.menu.pp[100]);
  }
  if (data.gameplay.hits[0] > 0 || data.gameplay.hits.sliderBreaks > 0) {
    ifFcpp.style.opacity = 1;
  } else {
    ifFcpp.style.opacity = 0;
  }
  if (fullTime !== data.menu.bm.time.mp3) {
    fullTime = data.menu.bm.time.mp3;
    onepart = 178 / fullTime;
  }
  if (
    seek !== data.menu.bm.time.current &&
    fullTime !== undefined &&
    fullTime != 0
  ) {
    seek = data.menu.bm.time.current;
    progress.style.width = onepart * seek + "px";
  }
};
