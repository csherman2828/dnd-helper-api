import { Request, Response, NextFunction } from 'express';

const logger = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  const endpoint = req.originalUrl;

  console.log(`${method} ${endpoint}`);

  next();
};

export default logger;
