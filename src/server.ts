import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authenticator from './middleware/authenticator';

import tokensRouter from './routes/tokens';
import internalErrorHandler from './middleware/errorHandler';

const port = process.env.INNER_PORT || 3001;

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
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
    ],
  }),
);
app.use('/tokens', tokensRouter);
app.use(internalErrorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
