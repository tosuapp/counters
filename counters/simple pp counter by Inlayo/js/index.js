const HOST = "127.0.0.1:24050";
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);
let tempState;

socket.onopen = () => console.log("Successfully Connected");
socket.onclose = (event) => console.log("Socket Closed Connection: ", event);
socket.onerror = (error) => console.log("Socket Error: ", error);

const animation = {
  pp: new CountUp("pp", 0, 0, 0, 0.5, {
    decimalPlaces: 2,
    useEasing: true,
    useGrouping: false,
    separator: " ",
    decimal: ".",
  }),
  ifFcpp: new CountUp("ifFcpp", 0, 0, 0, 0.5, {
    decimalPlaces: 2,
    useEasing: true,
    useGrouping: false,
    separator: " ",
    decimal: ".",
  }),
  hun: new CountUp("hun", 0, 0, 0, 0.5, {
    decimalPlaces: 2,
    useEasing: true,
    useGrouping: false,
    separator: " ",
    decimal: ".",
  }),
  fiv: new CountUp("fiv", 0, 0, 0, 0.5, {
    decimalPlaces: 2,
    useEasing: true,
    useGrouping: false,
    separator: " ",
    decimal: ".",
  }),
  miss: new CountUp("miss", 0, 0, 0, 0.5, {
    decimalPlaces: 2,
    useEasing: true,
    useGrouping: false,
    separator: " ",
    decimal: ".",
  }),
};

function updateCounter(animationObj, newValue) {
  animationObj.update(newValue || 0);
}

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.menu.state !== tempState) {
    tempState = data.menu.state;
  }

  if (data.gameplay.pp.current && (tempState === 2 || tempState === 7)) {
    animation.pp.update(data.gameplay.pp.current);
  } else if (data.menu.pp[100] && tempState !== 2 && tempState !== 7) {
    animation.pp.update(data.menu.pp[100]);
  } else {
    updateCounter(animation.pp, 0);
  }

  animation.ifFcpp.update(data.gameplay.pp.fc || 0);
  animation.hun.update(data.gameplay.hits[100] || 0);
  animation.fiv.update(data.gameplay.hits[50] || 0);
  animation.miss.update(data.gameplay.hits[0] || 0);

  document.getElementsByClassName("ifFcpp")[0].style.opacity =
    data.gameplay.hits[0] > 0 || data.gameplay.hits.sliderBreaks > 0 ? 1 : 0;
};
