import express from 'express';
import swaggerUi from 'swagger-ui-express';
import SwaggerParser from '@apidevtools/swagger-parser';
import routes from './routes/index.js';
import handleError from './middlewares/handleError.js';

const swaggerDocument = await SwaggerParser.bundle(
  new URL('../swagger/openapi.json', import.meta.url).pathname,
);

const app = express();

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);

routes(app);
app.use(handleError);

export default app;
