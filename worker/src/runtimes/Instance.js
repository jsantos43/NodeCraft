import Path from 'path';
import { Rcon } from 'rcon-client';
import Container from '../services/Container.js';
import File from '../services/File.js';
import config from '../../config/config.js';
import logger from '../../config/logger.js';
import { getIO } from '../../config/socket.js';
import Manager from '../services/Manager.js';

class Instance {
  constructor(instance) {
    this.id = instance.id;
    this.path = Path.join(config.paths.instances, instance.id);
    this.instance = instance;
    this.status = 'stopped';
    this.stream = null;
    this.io = null;
    this.rcon = {
      service: null,
      tryingConnection: false,
    };
    this.checker = {
      lastRun: 0,
      interval: null,
    };
    this.synchronizer = { // Update instance details
      interval: null,
      history: [],
    };
    this.disk = { // Cached disk usage (MB) to avoid measuring every cycle
      value: null,
      measuredAt: 0,
    };
    this.buffer = '';
  }

  static cleanLine(raw) {
    // eslint-disable-next-line no-control-regex
    const noAnsi = raw.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');

    // Strip binary/non-printable bytes (Docker multiplexed stream frame header, etc.)
    // eslint-disable-next-line no-control-regex
    const noBinary = noAnsi.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');

    // Strip Minecraft log prefix: [HH:MM:SS INFO]: or [HH:MM:SS] [Thread/INFO]:
    const noPrefix = noBinary.replace(
      /^\[\d{2}:\d{2}:\d{2}(?:\s+[\w/]+)?\](?:\s*\[[^\]]+\])*:\s*/,
      '',
    );

    // Strip console prompt artifact "> "
    return noPrefix.replace(/^>\s*/, '').trim();
  }

  async processStreamOutput(chunk, callback) {
    try {
      this.buffer += chunk.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      const lines = this.buffer.split('\n');
      this.buffer = lines.pop();

      for (const raw of lines) {
        const message = Instance.cleanLine(raw);
        if (!message || /^[.\s]+$/.test(message)) continue;

        // Push line to history
        this.synchronizer.history.push(message);

        // Send message to socket.io
        if (this.io) this.io.to(`instance:${this.id}`).emit('instance-output', message);

        // Exec callback if it exists
        if (callback) callback(message);

        // eslint-disable-next-line no-console
        if (config.app.stage === 'DEV') console.log(message);
      }
    } catch (err) {
      logger.error({ err }, 'Error to handle container message');
    }
  }

  // Catch stream output
  async listenStreamEvents(callback) {
    try {
      if (this.stream) return;

      const container = await Container.get(this.id);
      this.stream = await container.attach({
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true,
      });
      this.stream.setEncoding('utf8');

      // Define stream events
      this.stream.on('data', (chunk) => this.processStreamOutput(chunk, callback));
      this.stream.once('end', this.finish);
      this.stream.once('close', this.finish);
      this.stream.once('error', this.finish);

      container.wait().then(this.finish);
    } catch (err) {
      logger.error({ err }, 'Error to listen container');
    }
  }

  async initRcon(port, password, callback) {
    try {
      if (!!this.rcon.service && !this.rcon.tryingConnection) return;

      this.rcon.tryingConnection = true;

      const containerIpAddress = await Container.getIpAddress(this.id);
      const rcon = await Rcon.connect({
        host: containerIpAddress,
        port,
        password: password || 'nodecraft',
      });

      this.rcon.service = rcon;
      this.rcon.tryingConnection = false;
      await callback();
    } catch (err) {
      this.rcon.service = null;
      this.rcon.tryingConnection = false;
    }
  }

  async sendRcon(command) {
    let sent = false;
    let result = '';

    try {
      if (this.rcon.service) {
        result = await this.rcon.service.send(command);
        sent = true;
      } else {
        sent = false;
      }
    } catch (err) {
      logger.error({ err }, `Error to emit ${command}`);

      sent = false;
    }

    return { sent, result };
  }

  async sendCommand(command) {
    try {
      const { sent, result } = await this.sendRcon(command);

      if (sent) {
        // RCON replies don't go through stdout, so push the response to the console
        const message = Instance.cleanLine(result);
        if (message && this.io) this.io.to(`instance:${this.id}`).emit('instance-output', message);
      } else if (this.stream && !this.stream.destroyed) {
        // Fallback to stdin; the container echoes the result via stdout
        this.stream.write(`${command}\r\n`);
      }
    } catch (err) {
      logger.error({ err }, 'Error to send command');
    }
  }

  async measureDiskUsage() {
    const now = Date.now();
    // Re-measure at most once per minute; reuse the cached value otherwise.
    if (this.disk.value !== null && now - this.disk.measuredAt < 60000) {
      return this.disk.value;
    }

    const sizeMb = await File.getDirSize(this.path);
    this.disk.value = Math.ceil(sizeMb);
    this.disk.measuredAt = now;

    return this.disk.value;
  }

  async sendInstanceDetails() {
    try {
      const diskUsage = await this.measureDiskUsage();

      await Manager.sendInstanceDetails(this.id, {
        status: this.status === 'running' ? this.status : 'stopped',
        history: this?.synchronizer?.history || [],
        diskUsage,
      });

      if (this?.synchronizer?.history) this.synchronizer.history = [];
    } catch (err) {
      logger.error({ err }, 'Error to send instance details');
    }
  }

  async start() {
    try {
      this.io = getIO();

      this.status = 'running';
      await this.sendInstanceDetails();
      this.synchronizer.interval = setInterval(() => {
        this.sendInstanceDetails();
      }, 15000);
    } catch (err) {
      this.io = null;
    }

    await Container.run(this.id);
  }

  async finish() {
    try {
      if (!this) return;

      // remove stream
      if (this?.stream) {
        this.stream.removeAllListeners();
        this.stream = null;
      }

      // remove check interval
      const checkerInterval = this?.checker?.interval;
      if (checkerInterval) clearInterval(checkerInterval);

      // remove manager interval
      const synchronizerInterval = this?.synchronizer?.interval;
      if (synchronizerInterval) clearInterval(synchronizerInterval);

      // Send to manager that instance has stopped
      await Manager.sendInstanceDetails(this.id, {
        status: 'stopped',
        history: this?.synchronizer?.history || [],
      });

      delete this;
    } catch (err) {
      logger.error({ err }, 'Error to finish instance');
    }
  }
}

export default Instance;
