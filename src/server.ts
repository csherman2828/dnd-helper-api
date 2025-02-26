import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authenticator from './middleware/authenticator';
import logger from './middleware/logger';

import authRouter from './routes/auth/router';
import internalErrorHandler from './middleware/errorHandler';

const PORT = +(process.env.CLOUD_PORT || process.env.PORT || '3000');
const HOST = process.env.CLOUD_HOST || process.env.HOST || 'localhost';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true, // Allows cookies
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  authenticator({
    bypassedEndpoints: [
      {
        method: 'GET',
        url: '/tokens',
      },
      {
        method: 'GET',
        url: '/health',
      },
      {
        method: 'POST',
        url: '/auth/login',
      },
      {
        method: 'POST',
        url: '/auth/logout',
      },
      {
        method: 'POST',
        url: '/auth/challenge/new-password',
      },
      {
        method: 'GET',
        url: '/auth/refresh',
      },
    ],
  }),
);
app.use(logger);
app.get('/health', (req, res) => {
  res.status(200).send('Health: OK');
});
app.use('/auth', authRouter);
app.use(internalErrorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
