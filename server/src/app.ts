import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import apiRoutes from './routes';
import {
  globalErrorHandler,
  notFoundHandler,
} from './middleware/error.middleware';

const app = express();

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
