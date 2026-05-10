import si from 'systeminformation';
import config from '../../config/config.js';

class Hearbeat {
  static async define() {
    await Hearbeat.pulse();

    setInterval(() => {
      Hearbeat.pulse();
    }, 15000);
  }

  static async makeData() {
    const [cpu, mem, disk] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
    ]);

    // fsSize of system root
    const rootDisk = disk.find((d) => d.mount === '/') ?? disk[0];

    // Convert bytes to MB
    const toMB = (bytes) => parseFloat((bytes / 1024 ** 2).toFixed(2));

    return {
      cpuUsage: parseFloat(cpu.currentLoad.toFixed(2)),
      memorieTotal: toMB(mem.total),
      memorieUsed: toMB(mem.active),
      diskTotal: toMB(rootDisk?.size) ?? null,
      diskUsed: toMB(rootDisk?.used) ?? null,
    };
  }

  static async pulse() {
    try {
      const requestUrl = `${config.manager.url}/worker/${config.app.id}/heartbeat`;

      const data = await Hearbeat.makeData();

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.manager.apiKey}`,
      };

      const result = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      console.log('Sent Heartbeat');
    } catch (err) {
      console.log('Fail to hearbeat');
    }
  }
}

export default Hearbeat;
