import { Router } from 'express';

const router = Router();

router
  .get('/', (req, res) => {
    res.status(200).json({
      success: true,
      name: 'Nodecraft API',
      version: '3.0',
      summary: 'Central manager API of the NodeCraft platform — create, configure and run game server instances via Docker, with authentication, per-instance permissions, automatic backups and worker fleet monitoring.',
      docs: '/docs',
      github: 'https://github.com/jsantos43',
      author: 'João Pedro Tomaz dos Santos',
    });
  });

export default router;
