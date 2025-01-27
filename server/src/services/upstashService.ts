import { Redis } from '@upstash/redis'

import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

console.log('Initializing Upstash Redis with:');
console.log('URL:', UPSTASH_URL || 'not set');
console.log('Token:', UPSTASH_TOKEN ? '***[redacted]***' : 'not set');

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  throw new Error('Upstash Redis credentials not found in environment variables');
}

const redis = new Redis({
  url: UPSTASH_URL,
  token: UPSTASH_TOKEN
});

export interface UserState {
  oauthToken: string;
  userId: string;
  workspaceId: string;
  databaseId: string;
}

class UpstashService {
  private static readonly KEY_PREFIX = 'user:';
  private static readonly EXPIRE_TIME = 60 * 60 * 24; // 24 hours

  async saveUserState(userId: string, state: UserState): Promise<void> {
    const key = this.getUserKey(userId);
    await redis.set(key, JSON.stringify(state), {
      ex: UpstashService.EXPIRE_TIME
    });
  }

  async getUserState(userId: string): Promise<UserState | null> {
    const key = this.getUserKey(userId);
    const data = await redis.get<string>(key);
    if (!data) return null;
    return JSON.parse(data);
  }

  async updateUserState(userId: string, partialState: Partial<UserState>): Promise<void> {
    const currentState = await this.getUserState(userId);
    if (!currentState) {
      throw new Error('User state not found');
    }
    
    const updatedState = {
      ...currentState,
      ...partialState
    };
    
    await this.saveUserState(userId, updatedState);
  }

  async deleteUserState(userId: string): Promise<void> {
    const key = this.getUserKey(userId);
    await redis.del(key);
  }

  private getUserKey(userId: string): string {
    return `${UpstashService.KEY_PREFIX}${userId}`;
  }
}

export const upstashService = new UpstashService();