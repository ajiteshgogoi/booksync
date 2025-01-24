import { RedisPool } from './redisService.js';
import { vercelRedisService } from './vercelRedisService.js';

class RedisServiceFactory {
  static getService() {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return vercelRedisService;
    }
    return RedisPool.getInstance();
  }
}

export { RedisServiceFactory };