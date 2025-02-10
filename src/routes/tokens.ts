import { Router, Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  type AdminInitiateAuthCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

import refreshTokenCookieOptions from './refreshTokenCookieOptions';

const idpClient = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});

const authRouter: Router = Router();

authRouter.post('/', async (req: Request, res: Response) => {
  const accessToken = req.headers['x-access-token'] as string;
  const { refreshToken } = req.body;

  if (!accessToken || !refreshToken) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  // set refresh token in HTTP-Only cookie for security
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  return res.status(200).json({ message: 'Refresh token updated' });
});

authRouter.get('/', async (req: Request, res: Response) => {
  // get the refresh token from the cookie
  const refreshToken = req.cookies['refreshToken'] as string;

  // no hint for missing, just say the token is invalid
  if (!refreshToken) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const params: AdminInitiateAuthCommandInput = {
    UserPoolId: 'us-east-1_FZDVMGUa7',
    ClientId: 'gvlfdn5tog93s9n14qp6ijlgd',
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  };

  try {
    const command = new AdminInitiateAuthCommand(params);
    const response = await idpClient.send(command);

    // if successful, send access and id tokens back to the client
    return res.status(200).json(response.AuthenticationResult);
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAuthorizedException') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    throw error;
  }
});

export default authRouter;
