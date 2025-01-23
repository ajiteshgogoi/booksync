import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/dev/github/booksync/server/.env' });

async function clearOAuthTokens() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log('Connecting to Redis at:', redisUrl);
    const client = createClient({
      url: redisUrl
    });
    
    await client.connect();
    
    // Delete all OAuth tokens
    const oauthKeys = await client.keys('oauth:*');
    if (oauthKeys.length > 0) {
      console.log('Found OAuth tokens:', oauthKeys);
      const deletedCount = await client.del(oauthKeys);
      console.log('Deleted OAuth tokens:', deletedCount);
    } else {
      console.log('No OAuth tokens found');
    }
    
    // Close the client
    await client.quit();
    console.log('Redis client closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing OAuth tokens:', error);
    process.exit(1);
  }
}

clearOAuthTokens();