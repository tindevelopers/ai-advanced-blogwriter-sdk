
import { PrismaClient } from '../generated/prisma-client';

// Create a global instance to avoid multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * Utility function to handle database connections safely
 */
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('📊 Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Utility function to disconnect database
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('📊 Database disconnected');
  } catch (error) {
    console.error('❌ Database disconnect failed:', error);
  }
}
