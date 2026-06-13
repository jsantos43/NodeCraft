import express from 'express';
import routes from './routes/index.js';
import handleError from './middlewares/handleError.js';

const app = express();

routes(app);
app.use(handleError);

export default app;