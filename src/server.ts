import express from 'express';
import cookieParser from 'cookie-parser';
import createAuthenticator from './middleware/authenticator';

import tokensRouter from './routes/tokens';

const app = express();

const authenticator = createAuthenticator({
  bypassedEndpoints: [
    {
      method: 'GET',
      url: '/tokens',
    },
  ],
});

app.use(express.json());
app.use(cookieParser());
app.use(authenticator);
app.use('/tokens', tokensRouter);

const port = process.env.INNER_PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
