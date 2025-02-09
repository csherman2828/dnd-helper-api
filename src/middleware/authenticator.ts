import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '@/types/express';

interface BypassedEndpoint {
  method: string;
  url: string;
}

interface CognitoAccessTokenPayload {
  sub: string;
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: 'us-east-1_FZDVMGUa7',
  clientId: 'gvlfdn5tog93s9n14qp6ijlgd',
  tokenUse: 'access',
});

function setAuth(
  req: CustomRequest,
  accessTokenPayload: CognitoAccessTokenPayload,
) {
  if (req.ttrpgz) {
    req.ttrpgz.auth = {
      sub: accessTokenPayload.sub,
    };
    return;
  }

  req.ttrpgz = {
    auth: {
      sub: accessTokenPayload.sub,
    },
  };
}

function createAuthenticator({
  bypassedEndpoints,
}: {
  bypassedEndpoints: BypassedEndpoint[];
}) {
  return async function authenticator(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const isBypassed = bypassedEndpoints.some(
      endpoint => endpoint.method === req.method && endpoint.url === req.url,
    );

    if (isBypassed) {
      return next();
    }

    if (!req.headers['x-access-token']) {
      return res.status(401).json({
        error: 'Missing access token',
      });
    }

    const accessToken = req.headers['x-access-token'] as string;

    try {
      const accessTokenPayload: CognitoAccessTokenPayload =
        await verifier.verify(accessToken);
      setAuth(req, accessTokenPayload);
      return next();
    } catch (e) {
      return res.status(401).json({
        error: 'Invalid access token',
      });
    }
  };
}
export default createAuthenticator;
