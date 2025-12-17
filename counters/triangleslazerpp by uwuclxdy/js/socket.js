/* minified socket.js */

class WebSocketManager {
  constructor(host) {
    this.version = '0.1.5';

    if (host) {
      this.host = host;
    }

    this.createConnection = this.createConnection.bind(this);

    /**
     * @type {{ [key: string]: WebSocket }}
     */
    this.sockets = {};
  }

  createConnection(url, callback) {
    let INTERVAL = '';

    const that = this;
    this.sockets[url] = new WebSocket(`ws://${this.host}${url}?l=${encodeURI(window.COUNTER_PATH)}`);

    this.sockets[url].onopen = () => {
      console.log(`[OPEN] ${url}: Connected`);

      if (INTERVAL) clearInterval(INTERVAL);
    };

    this.sockets[url].onclose = (event) => {
      console.log(`[CLOSED] ${url}: ${event.reason}`);

      delete this.sockets[url];
      INTERVAL = setTimeout(() => {
        that.createConnection(url, callback);
      }, 1000);
    };

    this.sockets[url].onerror = (event) => {
      console.log(`[ERROR] ${url}: ${event.reason}`);
    };


    this.sockets[url].onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error != null) {
          console.error(`[MESSAGE_ERROR] ${url}:`, data.error);
          return;
        };

        if (data.message != null) {
          if (data.message.error != null) {
            console.error(`[MESSAGE_ERROR] ${url}:`, data.message.error);
            return;
          }
        };

        callback(data);
      } catch (error) {
        console.log(`[MESSAGE_ERROR] ${url}: Couldn't parse incomming message`, error);
      };
    };
  };

  /**
   * Connects to tosu advanced socket api.
   * @param {(data: WEBSOCKET_V2) => void} callback The function to handle received messages.
   */
  api_v2(callback) {
    this.createConnection(`/websocket/v2`, callback);
  };

  /**
   * Connects to message
   * @param {(data: { command: string, message: any }) => void} callback The function to handle received messages.
   */
  commands(callback) {
    this.createConnection(`/websocket/commands`, callback);
  };

  /**
   *
   * @param {string} name
   * @param {string|Object} payload
   */
  sendCommand(name, command, amountOfRetries = 1) {
    const that = this;


    if (!this.sockets['/websocket/commands']) {
      setTimeout(() => {
        that.sendCommand(name, command, amountOfRetries + 1);
      }, 100);

      return;
    };


    try {
      const payload = typeof command == 'object' ? JSON.stringify(command) : command;
      this.sockets['/websocket/commands'].send(`${name}:${payload}`);
    } catch (error) {
      if (amountOfRetries <= 3) {
        console.log(`[COMMAND_ERROR] Attempt ${amountOfRetries}`, error);
        setTimeout(() => {
          that.sendCommand(name, command, amountOfRetries + 1);
        }, 1000);
        return;
      };


      console.error(`[COMMAND_ERROR]`, error);
    };
  };
};

export default WebSocketManager;




/** @typedef {object} WEBSOCKET_V2
 * @property {object} state
 * @property {'menu' | 'edit' | 'play' | 'exit' | 'selectEdit' | 'selectPlay' | 'selectDrawings' | 'resultScreen' | 'update' | 'busy' | 'unknown' | 'lobby' | 'matchSetup' | 'selectMulti' | 'rankingVs' | 'onlineSelection' | 'optionsOffsetWizard' | 'rankingTagCoop' | 'rankingTeam' | 'beatmapImport' | 'packageUpdater' | 'benchmark' | 'tourney' | 'charts'} state.name
 * @property {object} play
 * @property {object} play.pp
 * @property {number} play.pp.current
 * @property {object} performance
 * @property {object} performance.accuracy
 * @property {number} performance.accuracy.100
 */
