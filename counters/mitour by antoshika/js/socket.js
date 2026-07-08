class Socket {
  constructor(host) {
    this.version = '0.1.5';

    if (host) {
      this.host = host;
    }

    this.createConnection = this.createConnection.bind(this);

    this.sockets = {};
  }

  createConnection(url, callback, filters) {
    let INTERVAL = '';

    const that = this;
    let counterPath = window.COUNTER_PATH || "";
    this.sockets[url] = new WebSocket(`ws://${this.host}${url}${url === '/websocket/commands' ? `?l=${encodeURI(counterPath)}` : ''}`);

    this.sockets[url].onopen = () => {
      console.log(`[OPEN] ${url}: Connected`);

      if (INTERVAL) clearInterval(INTERVAL);
      
      if (url === '/websocket/commands') {
        this.sockets[url].send(`getSettings:${encodeURI(counterPath)}`);
      }

      if (Array.isArray(filters)) {
        this.sockets[url].send(`applyFilters:${JSON.stringify(filters)}`);
      }
    };

    this.sockets[url].onclose = (event) => {
      console.log(`[CLOSED] ${url}: ${event.reason}`);

      delete this.sockets[url];
      INTERVAL = setTimeout(() => {
        that.createConnection(url, callback, filters);
      }, 1000);
    };

    this.sockets[url].onerror = (err) => {
      console.error(`[ERROR] ${url}: ${err.message}`);
      this.sockets[url].close();
    };

    this.sockets[url].onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
  };
};
