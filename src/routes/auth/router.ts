import { Router, Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  RevokeTokenCommand,
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

// initiates the auth, which may result in tokens or an additional challenge
authRouter.post(
  '/login',
  async (req: Request<{}, {}, AuthBody>, res: Response) => {
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
        const { AccessToken, IdToken, RefreshToken, ExpiresIn } =
          response.AuthenticationResult;

        res.cookie('refreshToken', RefreshToken, refreshTokenCookieOptions);
        return res.status(200).json({
          accessToken: AccessToken,
          idToken: IdToken,
          expiresIn: ExpiresIn,
        });
      }

      const { ChallengeName: challengeName, Session: session } = response;

      if (challengeName === 'NEW_PASSWORD_REQUIRED' && session)
        return res.status(200).json({ challengeName, session });

      console.error('Unhandled response from Cognito:', response);
      return res.status(500).json({ message: 'Internal server error' });
    } catch (error) {
      if (error instanceof Error && error.name === 'NotAuthorizedException') {
        return res.status(401).json({ message: 'Incorrect email or password' });
      }

      console.error('Error during authentication:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
);

// clears the refresh token cookie and revokes the refresh token
authRouter.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    console.log('refreshToken', refreshToken);

    res.clearCookie('refreshToken');

    if (refreshToken) {
      const command = new RevokeTokenCommand({
        ClientId: COGNITO_CLIENT_ID,
        Token: refreshToken,
      });

      try {
        await idpClient.send(command);
      } catch (err) {
        console.error('Error revoking refresh token:', err);
      }
    }
  } catch (err) {
    console.error('Error during logout:', err);
  } finally {
    return res.status(200).json({ message: 'Logged out successfully' });
  }
});

// allows the client to respond to a new password challenge
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
      const { AccessToken, IdToken, RefreshToken, ExpiresIn } =
        response.AuthenticationResult;

      res.cookie('refreshToken', RefreshToken, refreshTokenCookieOptions);
      return res.status(200).json({
        accessToken: AccessToken,
        idToken: IdToken,
        expiresIn: ExpiresIn,
      });
    }

    console.error('Unhandled response from Cognito:', response);
    return res.status(500).json({ message: 'Internal server error' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// used to get fresh tokens using the secure http-only refresh token cookie
authRouter.get('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Cannot refresh auth session' });
  }

  const command = new AdminInitiateAuthCommand({
    UserPoolId: COGNITO_USER_POOL_ID,
    ClientId: COGNITO_CLIENT_ID,
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  try {
    const response = await idpClient.send(command);

    if (response.AuthenticationResult) {
      // if successful, send access and id tokens back to the client
      const { AccessToken, IdToken, RefreshToken, ExpiresIn } =
        response.AuthenticationResult;

      res.cookie('refreshToken', RefreshToken, refreshTokenCookieOptions);
      return res.status(200).json({
        accessToken: AccessToken,
        idToken: IdToken,
        expiresIn: ExpiresIn,
      });
    }

    console.error('Unhandled response from Cognito:', response);
    return res.status(500).json({ message: 'Internal server error' });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAuthorizedException') {
      return res.status(401).json({ message: 'Cannot refresh auth session' });
    }

    console.error('Unhandled error during refresh:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default authRouter;
