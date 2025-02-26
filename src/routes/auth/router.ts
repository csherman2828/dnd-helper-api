import { Router, Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import refreshTokenCookieOptions from '../refreshTokenCookieOptions';

const COGNITO_USER_POOL_ID = (process.env.CLOUD_COGNITO_USER_POOL_ID ||
  process.env.COGNITO_USER_POOL_ID) as string;
const COGNITO_CLIENT_ID = (process.env.CLOUD_COGNITO_CLIENT_ID ||
  process.env.COGNITO_CLIENT_ID) as string;

const idpClient = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});

interface AuthBody {
  email: string;
  password: string;
}

const authRouter: Router = Router();

authRouter.post('/', async (req: Request<{}, {}, AuthBody>, res: Response) => {
  const { email, password } = req.body;

  const command = new AdminInitiateAuthCommand({
    UserPoolId: COGNITO_USER_POOL_ID,
    ClientId: COGNITO_CLIENT_ID,
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  try {
    const response = await idpClient.send(command);

    if (response.AuthenticationResult) {
      // if successful, send access and id tokens back to the client
      const { AccessToken, IdToken, RefreshToken } =
        response.AuthenticationResult;

      res.cookie('refreshToken', RefreshToken, refreshTokenCookieOptions);
      return res.status(200).json({
        accessToken: AccessToken,
        idToken: IdToken,
      });
    }

    const { ChallengeName: challengeName, Session: session } = response;

    if (challengeName === 'NEW_PASSWORD_REQUIRED' && session)
      return res.status(200).json({ challengeName, session });

    console.error('Unhandled response from Cognito:', response);
    return res.status(500).json({ message: 'Internal server error' });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAuthorizedException') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.error('Error during authentication:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

authRouter.post('/challenge/new-password', async (req, res) => {
  const { email, newPassword, session } = req.body;

  const command = new AdminRespondToAuthChallengeCommand({
    UserPoolId: COGNITO_USER_POOL_ID,
    ClientId: COGNITO_CLIENT_ID,
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    ChallengeResponses: {
      USERNAME: email,
      NEW_PASSWORD: newPassword,
    },
    Session: session,
  });

  try {
    const response = await idpClient.send(command);

    if (response.AuthenticationResult) {
      // if successful, send access and id tokens back to the client
      const { AccessToken, IdToken, RefreshToken } =
        response.AuthenticationResult;

      res.cookie('refreshToken', RefreshToken, refreshTokenCookieOptions);
      return res.status(200).json({
        accessToken: AccessToken,
        idToken: IdToken,
      });
    }

    console.error('Unhandled response from Cognito:', response);
    return res.status(500).json({ message: 'Internal server error' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default authRouter;
