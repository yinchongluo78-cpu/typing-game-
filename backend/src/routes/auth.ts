import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// 注册
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
    body('nickname').optional().isString(),
  ],
  validateRequest,
  register
);

// 登录
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').notEmpty().withMessage('请输入密码'),
  ],
  validateRequest,
  login
);

// 获取当前用户信息
router.get('/me', authMiddleware, getMe);

export default router;
