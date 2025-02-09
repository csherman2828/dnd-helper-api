import { Request } from 'express';

export interface CustomRequest extends Request {
  ttrpgz?: {
    auth?: {
      sub: string;
    };
  };
}

export {};
