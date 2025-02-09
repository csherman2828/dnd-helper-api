import { Router, Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  type AdminInitiateAuthCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

const idpClient = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});

const authRouter: Router = Router();

authRouter.post('/', async (req: Request, res: Response) => {
  const accessToken = req.headers['x-access-token'] as string;

  console.log(req.headers);

  console.log(accessToken);
  const { refreshToken } = req.body;

  if (!accessToken || !refreshToken) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/tokens',
  });

  return res.status(200).json({ message: 'Refresh token updated' });
});

authRouter.get('/', async (req: Request, res: Response) => {
  const refreshToken = req.cookies['refreshToken'] as string;

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

    return res.status(200).json(response.AuthenticationResult);
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.name === 'NotAuthorizedException') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default authRouter;
