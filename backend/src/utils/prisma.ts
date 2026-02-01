import { PrismaClient } from '@prisma/client';

// Debug: log DATABASE_URL (masked)
const dbUrl = process.env.DATABASE_URL || '';
const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
console.log('DATABASE_URL (masked):', maskedUrl);
console.log('DATABASE_URL length:', dbUrl.length);

const prisma = new PrismaClient();

export default prisma;
