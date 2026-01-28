// play.hits's Bar

export function hitJudgementsAdd(type, positionPercentage) {
    const element = document.createElement("div");

    element.setAttribute("class", `tickGraph tick${type}`);

    element.style.transform = `translateX(${positionPercentage}px)`;

    document.getElementById(`graph${type}`).appendChild(element);
}

export function hitJudgementsClear(type) {
    document.querySelectorAll(`.tick${type}`).forEach(e => e.remove());
}

export function tapJudgement(type) {
        if (type === `100`) {
            h100Cont.style.backgroundColor = `rgb(0, 255, 47)`;
            h100Text.style.color = `rgb(0, 255, 47)`;
            h100Text.style.transform = `scale(85%)`;
            setTimeout(function () {
                h100Cont.style.backgroundColor = `#27b641`;
                h100Text.style.color = `white`;
                h100Text.style.transform = `scale(100%)`;
            }, 300);
        }
        if (type === `50`) {
            h50Cont.style.backgroundColor = `rgb(255, 145, 0)`;
            h50Text.style.color = `rgb(255, 145, 0)`;
            h50Text.style.transform = `scale(85%)`;
            setTimeout(function () {
                h50Cont.style.backgroundColor = `#b87f34`;
                h50Text.style.color = `white`;
                h50Text.style.transform = `scale(100%)`;
            }, 300);
        }
        if (type === `0`) {
            h0Cont.style.backgroundColor = `rgb(255, 0, 4)`;
            h0Text.style.color = `rgb(255, 0, 4)`;
            h0Text.style.transform = `scale(85%)`;
            setTimeout(function () {
                h0Cont.style.backgroundColor = `#b83133`;
                h0Text.style.color = `white`;
                h0Text.style.transform = `scale(100%)`;
            }, 300);
        }
        if (type === `SB`) {
            hsbCont.style.backgroundColor = `white`;
            hSBText.style.transform = `scale(85%)`;
            setTimeout(function () {
                hsbCont.style.backgroundColor = `#b8b8b8`;
                hSBText.style.transform = `scale(100%)`;
            }, 300);
        }
}