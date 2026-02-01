import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { error } from '../utils/response';

export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => {
      if ('msg' in err) {
        return err.msg;
      }
      return '验证错误';
    });
    res.status(400).json(error(messages.join(', ')));
    return;
  }

  next();
}
