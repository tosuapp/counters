// eslint-disable-next-line
class CanvasKeys {
  constructor({ canvasID, color, interval, speed, cornerRadius }) {
    this.id = canvasID;
    this.color = color || 'white';

    this.countUP = new CountUp(`${this.id}Bpm`, 0, 0, 0, 0.1, { useEasing: true, useGrouping: true, separator: "", decimal: "" });

    this.index = 0;
    this.cornerRadius = cornerRadius || 8;

    this.speed = speed || 150;
    this.interval = interval || 10;

    this.current_bpm = 0;
    this.previousClickTime = 0;
    this.currentClickTime = 0;
    this.lastClicked = 0;


    this.blocks = new Map();
    this.bpmArray = [];


    this.updateCanvas();
    this.animate();
  };


  updateCanvas() {
    const { width, height } = document.getElementById(this.id).getBoundingClientRect();
    this.canvas = document.getElementById(this.id);
    this.canvas.setAttribute('width', width);
    this.canvas.setAttribute('height', height);


    this.ctx = this.canvas.getContext('2d');
  };


  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.color;


    const array = new Set(this.blocks.entries());
    array.forEach((value) => {
      const [index, block] = value;
      block.x -= 1000 / this.speed;

      if (block.active) {
        block.width = this.canvas.width - block.x;
      };


      if (block.x + block.width < 0 && block.active != true) {
        this.blocks.delete(index);
        return;
      };

      if (typeof this.ctx.roundRect == 'function') {
        this.ctx.beginPath();
        this.ctx.roundRect(block.x, 0, block.width, this.canvas.height, this.cornerRadius);
        this.ctx.fill();

      }

      else {

        this.roundRect(block.x, 0, block.width, this.canvas.height, this.cornerRadius, block.active);
      };
    });


    if (new Date().getTime() - this.previousClickTime > 1000 && this.bpmArray.length > 0) {
      this.setBPM(0);
      this.bpmArray.length = 0;
    };


    requestAnimationFrame(this.animate.bind(this));
  };


  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.arcTo(x + width, y, x + width, y + radius, radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.arcTo(x, y + height, x, y + height - radius, radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.arcTo(x, y, x + radius, y, radius);
    this.ctx.closePath();
    this.ctx.fill();
  };


  blockStatus(status) {
    if (status == true) {
      this.blocks.set(this.index, {
        active: true,
        width: 0,
        x: this.canvas.width,
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