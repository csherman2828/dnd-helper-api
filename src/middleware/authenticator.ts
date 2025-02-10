import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '@/types/express';

interface BypassedEndpoint {
  method: string;
  url: string;
}

interface AuthenticatorInput {
  bypassedEndpoints?: BypassedEndpoint[];
}

interface CognitoAccessTokenPayload {
  sub: string;
}

function authenticator(input?: AuthenticatorInput) {
  const bypassedEndpoints = input?.bypassedEndpoints;

  function isBypassed(req: Request) {
    return bypassedEndpoints?.some(
      endpoint => endpoint.method === req.method && endpoint.url === req.url,
    );
  }

  const verifier = CognitoJwtVerifier.create({
    userPoolId: 'us-east-1_FZDVMGUa7',
    clientId: 'gvlfdn5tog93s9n14qp6ijlgd',
    tokenUse: 'access',
  });

  return async function authenticatorMiddleware(
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ) {
    if (isBypassed(req)) {
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

      return next();
    } catch (e) {
      return res.status(401).json({
        error: 'Invalid access token',
      });
    }
  };
}
export default authenticator;
