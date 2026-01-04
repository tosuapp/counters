// eslint-disable-next-line
const tileWrapperNode = document.createElement('div'),
    tileNode = document.createElement('div')
tileWrapperNode.classList.add('canvas')
tileNode.classList.add('canvas')
tileWrapperNode.appendChild(tileNode)

class CanvasKeys {
  constructor({ canvasID, color, interval, speed }) {
    this.tiles = document.getElementById(`${canvasID}_canvas`)
    this.tile = null

    this.id = canvasID;
    this.color = color || 'rgba(29, 29, 29, 0.8)';

    this.countUP = new CountUp(`${this.id}Bpm`, 0, 0, 0, 0.01, { useEasing: true, useGrouping: true, separator: "", decimal: "" });

    this.index = 0;
    // this.cornerRadius = cornerRadius || 7;

    this.speed = speed || 0.4;
    this.interval = interval || 10;

    this.current_bpm = 0;
    this.previousClickTime = 0;
    this.currentClickTime = 0;
    this.lastClicked = 0;


    this.blocks = new Map();
    this.bpmArray = [];
    this.animate();
  };

    update(key) {
        if (key.isPressed == true) {
            if (!this.tile){
                this.tile = tileWrapperNode.cloneNode(true)
                this.tiles.appendChild(this.tile)
                this.updateTile()
            }
            if (this.keyText && key.count !== 0) this.keyText.innerText = key.count
        } else {
            if (this.tile) {
                this.tile.end = true
            }
        }
    }

    updateTile() {
        const start = performance.now()
        const step = () => {
            const now = performance.now();
            const count = Math.min(this.speed * (now - start), this.tiles.lastChild.offsetWidth);
            this.tile.firstChild.style.width = count + "px"
            this.tile.firstChild.style.backgroundColor = this.color
            if (!this.tile.end) requestAnimationFrame(step)
            else {
                this.tile.style.animation = `moveOut ${this.tile.offsetWidth/this.speed}ms linear forwards`
                setTimeout(() => {
                    this.tiles.firstElementChild.remove()
                }, this.tile.offsetWidth/this.speed)
                this.tile = null
            }
        }
        step()
    }
  
  animate() {
    if (new Date().getTime() - this.previousClickTime > 1000 && this.bpmArray.length > 0) {
      this.setBPM(0);
      this.bpmArray.length = 0;
    };
    requestAnimationFrame(this.animate.bind(this));
  };

  blockStatus(status) {
    if (status == true) {
      this.blocks.set(this.index, {
        active: true,
        width: 0,
      });

      return;
    };

    const blockCache = this.blocks.get(this.index);
    if (!blockCache) return;

    blockCache.active = false;
    this.index += 1;
  };


  registerKeypress() {
    this.currentClickTime = new Date().getTime();
    if (this.previousClickTime) this.updateBPM();

    this.previousClickTime = this.currentClickTime;
  };


  updateBPM() {
    const elapsedTimeInSeconds = (this.currentClickTime - this.previousClickTime) / 1000;
    const bpm = Math.round((1 / elapsedTimeInSeconds) * 60);

    if (isFinite(bpm))
      this.bpmArray.push(Math.round(bpm / 2));

    if (this.bpmArray.length >= (this.interval || 1)) {
      const len = this.bpmArray.length;
      this.bpmArray = this.bpmArray.slice(len - (this.interval || 1), len);
    }

    this.calculateAverageBPM();
  };


  calculateAverageBPM() {
    const sum = this.bpmArray.reduce((acc, val) => acc + val, 0);
    const average = Math.round(sum / this.bpmArray.length);

    if (average != null && average > 0 && !isNaN(average)) {
      this.setBPM(`${Math.round(average)}`);
    };
  };

  
  setBPM(value) {
    this.countUP.update(value);
  };
};


export default CanvasKeys;