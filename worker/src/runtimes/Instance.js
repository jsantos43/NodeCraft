import Path from 'path';
import { Rcon } from 'rcon-client';
import Container from '../services/Container.js';
import config from '../../config/config.js';
import logger from '../../config/logger.js';
import { getIO } from '../../config/socket.js';
import Manager from '../services/Manager.js';

class Instance {
  constructor(instance, readFunction) {
    this.id = instance.id;
    this.instance = instance;
    this.instancePath = Path.join(config.paths.instances, instance.id);
    this.stream = null;
    this.buffer = '';
    this.readFunction = readFunction;
    this.rcon = null;
    this.tryingRconConnection = false;
    this.checker = {
      lastRun: 0,
      interval: null,
    };
    this.io = null;
    this.history = [];
  }

  async handleMessage(chunk, callback) {
    try {
      let data = chunk.toString('utf8');

      // eslint-disable-next-line no-control-regex
      data = data.replace(/\x1B\[[0-9;]*m/g, '');
      data = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      const message = data.trim();
      if (!message) return;

      // Update instance history
      this.history.push(message);

      // Send server output to socket.io
      if (this.io) this.io.to(`instance:${this.id}`).emit('instance-output', message);

      // Run callback if needed
      if (callback) callback(message);

      // eslint-disable-next-line no-console
      if (config.app.stage === 'DEV') console.log(message);
    } catch (err) {
      logger.error({ err }, 'Error to handle container message');
    }
  }

  async listen(callback) {
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

      this.stream.on('data', (chunk) => this.handleMessage(chunk, callback));
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
    let sent = false;
    let result = '';

    try {
      if (this.rcon) {
        result = await this.rcon.send(command);
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
      const { sent } = await this.sendRcon(command);

      if (!sent && this.stream && !this.stream.destroyed) {
        this.stream.write(`${command}\r\n`);
      }
    } catch (err) {
      logger.error({ err }, 'Error to send command');
    }
  }

  async start() {
    try {
      this.io = getIO();

      // Send to manager that instance is running
      await Manager.sendInstanceDetails(this.id, {
        status: 'running',
        history: this?.history,
      });
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

      // Send to manager that instance has stopped
      await Manager.sendInstanceDetails(this.id, {
        status: 'stopped',
        history: this?.history,
      });

      delete this;
    } catch (err) {
      logger.error({ err }, 'Error to finish instance');
    }
  }
}

export default Instance;
