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

  // we'll store the refresh token in an a secure, same-site, HTTP only cookie
  //   code won't be able to access it from the browser
  //   this keeps it safe from XSS and CSRF attacks
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // can't be accessed from JS on the browser
    secure: false, // when set to true, cookie will only be sent over HTTPS
    sameSite: 'strict', // cookie will only be sent in a first-party context
    path: '/tokens', // cookie will only be sent to this path
  });

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

    // unexpected error, log details
    console.error(error);

    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default authRouter;
