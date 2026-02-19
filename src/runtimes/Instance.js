import { PassThrough } from 'stream';
import Path from 'path';
import { Rcon } from 'rcon-client';
import Container from '../services/Container.js';
import config from '../../config/index.js';
import logger from '../../config/logger.js';

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

  handleChunk(chunk, callback) {
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

        callback(message);
      });
    } catch (err) {
      logger.error({ err }, 'Error to handle container stream chunck');
    }
  }

  async listen(callback) {
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

      const handleMessage = async (msg) => {
        await this.updateHistory(msg);
        if (callback) callback(msg);

        // eslint-disable-next-line no-console
        if (config.app.stage === 'DEV') console.log(msg);
      };

      stdout.on('data', (chunk) => this.handleChunk(chunk, handleMessage));
      stderr.on('data', (chunk) => this.handleChunk(chunk, handleMessage));
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

  async sendRcon(command) {
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

  removeChecker() {
    const checkerInterval = this?.checker?.interval;
    if (checkerInterval) clearInterval(checkerInterval);
  }

  async start() {
    await Container.run(this.id);
  }

  finish() {
    try {
      this.removeStream();
      this.removeChecker();

      delete this;
    } catch (err) {
      logger.error({ err }, 'Error to finish instance');
    }
  }
}

export default Instance;
