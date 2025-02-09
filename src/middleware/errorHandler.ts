import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '@/types/express';

export default function internalErrorHandler(
  err: Error,
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) {
  console.error('Unhandled internal error:', err);
  const { method, url } = req;

  console.error(
    'Internal Server Error',
    JSON.stringify({
      method,
      url,
      ...(req.ttrpgz?.auth ? { userId: req.ttrpgz.auth.sub } : {}),
    }),
  );
  return res.status(500).json({ error: 'Internal Server Error' });
}
