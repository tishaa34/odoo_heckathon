import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/** Attaches a correlation id to every request for traceable logs. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.length <= 100 ? incoming : uuidv4();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
