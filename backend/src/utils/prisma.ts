import { PrismaClient } from '@prisma/client';

// 直接设置数据库连接（绕过环境变量问题）
const DATABASE_URL = 'postgresql://postgres.yjcyblvjfedgubcwdgod:lyc15974388414@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

export default prisma;
