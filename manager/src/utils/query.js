import { GameDig } from 'gamedig';

const query = async (port, type = 'minecraft') => new Promise((resolve) => {
  GameDig.query({
    type,
    host: '127.0.0.1',
    port,
    timeout: 2000,
  }).then((state) => {
    resolve({
      online: true,
      version: state?.version,
      ping: state?.ping,
      onlinePlayers: state?.numplayers,
      players: state?.players ?? [],
    });
  }).catch(() => {
    resolve({
      online: false,
      version: '',
      ping: '',
      onlinePlayers: 0,
      players: [],
    });
  });
});

export default query;
