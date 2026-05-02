import { Router } from 'express';

const router = Router();

router
  .get('/', (req, res) => {
    res.status(200).json({
      success: true,
      name: 'Nodecraft API',
      version: '3.0',
      summary: 'Api to create and manage game servers with docker',
      docs: '/docs',
      github: 'https://github.com.br/JoaoSantos2007',
      author: 'João Pedro Tomaz dos Santos',
    });
  });

export default router;
