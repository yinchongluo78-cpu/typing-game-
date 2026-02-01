import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // eslint-disable-next-line no-console
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json(error(err.message));
    return;
  }

  res.status(500).json(error('服务器内部错误'));
}
