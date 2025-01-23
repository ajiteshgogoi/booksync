import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/dev/github/booksync/server/.env' });

async function resetRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log('Connecting to Redis at:', redisUrl);
    const client = createClient({
      url: redisUrl
    });
    
    await client.connect();
    
    // Kill all client connections
    const result = await client.sendCommand(['CLIENT', 'KILL', 'TYPE', 'normal']);
    console.log('Redis connections reset:', result);
    
    // Close the client
    await client.quit();
    console.log('Redis client closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting Redis:', error);
    process.exit(1);
  }
}

resetRedis();
