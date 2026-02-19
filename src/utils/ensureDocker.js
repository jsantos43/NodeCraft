import docker from '../../config/docker.js';

const ensureImage = (imageName) => new Promise((resolve, reject) => {
  docker.getImage(imageName).inspect()
    .then(() => resolve())
    .catch(() => {
      docker.pull(imageName, (err, stream) => {
        if (err) return reject(err);

        return docker.modem.followProgress(
          stream,
          (errProgress) => (errProgress ? reject(errProgress) : resolve()),
        );
      });
    });
});

const ensureNetwork = async (networkName) => {
  const networks = await docker.listNetworks();

  let exists = false;
  networks.forEach((net) => {
    if (net.Name === networkName) exists = true;
  });

  if (exists) return;

  await docker.createNetwork({
    Name: networkName,
    Driver: 'bridge',
    Internal: false,
    Attachable: false,
  });
};

export { ensureImage, ensureNetwork };
