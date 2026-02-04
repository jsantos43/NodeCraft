import { PassThrough } from 'stream';
import Path from 'path';
import { Rcon } from 'rcon-client';
import Container from '../services/Container.js';
import config from '../../config/index.js';
import logger from '../../config/logger.js';
import instancesRunning from './instancesRunning.js';

class Instance {
  constructor(instance, readFunction) {
    this.id = instance.id;
    this.instance = instance;
    this.instancePath = Path.join(config.instance.path, instance.id);
    this.stream = null;
    this.buffer = '';
    this.readFunction = readFunction;
    this.rcon = null;
    this.tryingRconConnection = false;

    this.state = {
      alive: false,
      onlinePlayers: 0,
      players: [],
      ping: null,
    };

    this.checker = {
      lastRun: 0,
      interval: null,
    };
  }

  async updateHistory(message) {
    try {
      // Get instance in registry
      const { instance } = this;

      // Copy instance history array
      let history = [...instance.history];
      history.push(message);

      // Wipe old lines
      const historyLength = history.length;
      const maxHistoryLength = config.instance.maxHistory || 0;
      if (historyLength > maxHistoryLength) {
        history = history.slice(historyLength - maxHistoryLength);
      }

      await instance.update({ history });
    } catch (err) {
      logger.error({ err }, 'Error to update instance history');
    }
  }

  async listen(callback) {
    const handleChunk = (chunk, passFunction) => {
      try {
        let data = chunk.toString('utf8');
        let buffer = this?.buffer;

        // eslint-disable-next-line no-control-regex
        data = data.replace(/\x1B\[[0-9;]*m/g, ''); // ANSI
        data = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        buffer += data;

        const lines = buffer.split('\n');
        buffer = lines.pop();

        lines.forEach((line) => {
          const cleanLine = line.trim();
          if (!cleanLine) return;

          const match = cleanLine.match(
            /^\[(\d{2}:\d{2}:\d{2})\s+(INFO|WARN|ERROR|DEBUG|TRACE)\]:\s*(.*)$/,
          );

          const message = match ? match[3] : cleanLine;

          passFunction(message);
        });
      } catch (err) {
        logger.error({ err }, 'Error to handle container stream chunck');
      }
    };

    try {
      const container = await Container.get(this.id);
      const since = Math.floor(Date.now() / 1000);

      this.stream = await container.logs({
        stdout: true,
        stderr: true,
        follow: true,
        since,
        timestamps: false,
      });

      const stdout = new PassThrough();
      const stderr = new PassThrough();

      container.modem.demuxStream(this.stream, stdout, stderr);

      const passFunction = async (msg) => {
        await this.updateHistory(msg);

        // eslint-disable-next-line no-console
        if (config.app.stage === 'DEV') console.log(msg);

        if (callback) callback(msg);
      };

      stdout.on('data', (chunk) => handleChunk(chunk, passFunction));
      stderr.on('data', (chunk) => handleChunk(chunk, passFunction));
    } catch (err) {
      logger.error({ err }, 'Error to listen container');
    }
  }

  async initRcon(port, password, callback) {
    try {
      if (!!this.rcon && !this.tryingRconConnection) return;

      this.tryingRconConnection = true;

      const containerIpAddress = await Container.getIpAddress(this.id);
      const rcon = await Rcon.connect({
        host: containerIpAddress,
        port,
        password: password || 'nodecraft',
      });

      this.rcon = rcon;
      this.tryingRconConnection = false;
      await callback();
    } catch (err) {
      this.rcon = null;
      this.tryingRconConnection = false;
    }
  }

  async emitEvent(command) {
    let result = null;
    try {
      if (this.rcon) result = await this.rcon.send(command);
    } catch (err) {
      logger.error({ err }, `Error to emit ${command}`);
    }

    return result;
  }

  removeStream() {
    if (this.stream) {
      this.stream.removeAllListeners('data');
      this.stream.removeAllListeners('error');
      this.stream.removeAllListeners('end');

      // Close stream
      if (typeof this.stream.destroy === 'function') {
        this.stream.destroy();
      }
    }
  }

  removeInterval() {
    if (this?.monitor?.interval) clearInterval(this.monitor.interval);
  }

  async start() {
    await Container.run(this.id);
    instancesRunning[this.id] = this;
  }

  stop() {
    try {
      this.removeStream();
      this.removeInterval();

      delete instancesRunning[this.id];
      delete this;
    } catch (err) {
      logger.error({ err }, 'Error to stop instance');
    }
  }
}

export default Instance;
