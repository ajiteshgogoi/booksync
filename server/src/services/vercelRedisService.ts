import { Redis } from 'ioredis';
import { logger } from '../utils/logger.js';

// Vercel-specific connection pool configuration
const POOL_SIZE = 1; // Single connection in Vercel
const CONNECT_TIMEOUT = 2000; // 2s timeout
const COMMAND_TIMEOUT = 2000; // 2s timeout
const MAX_RETRIES = 2; // Fewer retries in Vercel
const RETRY_DELAY = 200; // Faster retries
const KEEP_ALIVE = 1000; // 1s keep-alive
const CONNECTION_MAX_AGE = 25000; // 25s max age
const CONNECTION_IDLE_TIMEOUT = 10000; // 10s idle timeout
const REAPER_INTERVAL = 10000; // 10s reaper interval

interface RedisConnection {
  client: Redis;
  lastUsed: number;
  inUse: boolean;
  createdAt: number;
  id: string;
}

interface ConnectionStats {
  totalAcquires: number;
  totalReleases: number;
  totalTimeouts: number;
  totalErrors: number;
  maxWaiters: number;
  totalStaleConnections: number;
  totalReconnects: number;
}

class VercelRedisService {
  private pool: RedisConnection[] = [];
  private connectionWaiters: number = 0;
  private connectionStats: ConnectionStats = {
    totalAcquires: 0,
    totalReleases: 0,
    totalTimeouts: 0,
    totalErrors: 0,
    maxWaiters: 0,
    totalStaleConnections: 0,
    totalReconnects: 0
  };
  private reaperInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializePool();
    this.startConnectionReaper();
  }

  private async initializePool(): Promise<void> {
    try {
      for (let i = 0; i < POOL_SIZE; i++) {
        const client = await this.createClient();
        const now = Date.now();
        this.pool.push({
          client,
          lastUsed: now,
          inUse: false,
          createdAt: now,
          id: `conn-vercel-${now}`
        });
      }
    } catch (error) {
      logger.error('Failed to initialize Redis pool', { error });
      throw error;
    }
  }

  private async createClient(): Promise<Redis> {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is required');
    }

    const options = {
      maxRetriesPerRequest: MAX_RETRIES,
      connectTimeout: CONNECT_TIMEOUT,
      commandTimeout: COMMAND_TIMEOUT,
      retryStrategy: (times: number) => Math.min(times * RETRY_DELAY, 1000),
      keepAlive: KEEP_ALIVE,
      noDelay: true,
      lazyConnect: true,
      ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {})
    };

    const client = new Redis(process.env.REDIS_URL, options);

    client.on('error', (error) => {
      logger.error('Redis connection error', { error });
    });

    client.on('ready', () => {
      logger.info('Redis connection ready');
    });

    return client;
  }

  private startConnectionReaper(): void {
    if (this.reaperInterval) {
      clearInterval(this.reaperInterval);
    }
    
    this.reaperInterval = setInterval(async () => {
      for (const connection of this.pool) {
        try {
          const isStale = await this.isConnectionStale(connection);
          if (isStale) {
            await this.replaceConnection(connection);
          }
        } catch (error) {
          logger.error('Error in connection reaper', { error });
        }
      }
    }, REAPER_INTERVAL);
  }

  private stopConnectionReaper(): void {
    if (this.reaperInterval) {
      clearInterval(this.reaperInterval);
      this.reaperInterval = null;
    }
  }

  private async isConnectionStale(connection: RedisConnection): Promise<boolean> {
    const now = Date.now();

    if (now - connection.createdAt > CONNECTION_MAX_AGE) {
      return true;
    }

    if (!connection.inUse && now - connection.lastUsed > CONNECTION_IDLE_TIMEOUT) {
      return true;
    }

    try {
      await connection.client.ping();
      return false;
    } catch {
      return true;
    }
  }

  private async replaceConnection(connection: RedisConnection): Promise<void> {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 200;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
      try {
        // Clean up old connection if it's still open
        if (connection.client.status === 'ready' || connection.client.status === 'connecting') {
          try {
            await connection.client.quit();
          } catch (quitError) {
            logger.warn('Error quitting old connection', { error: quitError });
          }
        }

        this.connectionStats.totalStaleConnections++;
        
        const index = this.pool.indexOf(connection);
        if (index !== -1) {
          const newClient = await this.createClient();
          await newClient.ping();
          
          this.pool[index] = {
            client: newClient,
            inUse: false,
            lastUsed: Date.now(),
            createdAt: Date.now(),
            id: `conn-vercel-${Date.now()}-${index}`
          };
          this.connectionStats.totalReconnects++;
          return;
        }
      } catch (error) {
        retryCount++;
        logger.error('Error replacing connection', {
          attempt: retryCount,
          maxRetries: MAX_RETRIES,
          error
        });
        
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
        } else {
          this.connectionStats.totalErrors++;
          throw error;
        }
      }
    }
  }

  public async acquire(): Promise<Redis> {
    if (this.connectionWaiters >= POOL_SIZE) {
      this.connectionStats.totalErrors++;
      throw new Error('Maximum connection waiters reached');
    }

    this.connectionWaiters++;
    this.connectionStats.maxWaiters = Math.max(
      this.connectionStats.maxWaiters,
      this.connectionWaiters
    );

    let currentRetry = 0;
    let currentDelay = RETRY_DELAY;

    try {
      if (this.pool.length === 0) {
        await this.initializePool();
      }

      while (currentRetry < MAX_RETRIES) {
        const connection = this.pool.find(conn => !conn.inUse);
        
        if (connection) {
          try {
            if (!await this.isConnectionStale(connection)) {
              connection.inUse = true;
              connection.lastUsed = Date.now();
              this.connectionWaiters--;
              return connection.client;
            }
            
            await this.replaceConnection(connection);
            continue;
          } catch (error) {
            logger.warn('Error verifying connection', { error });
          }
        }

        currentRetry++;
        if (currentRetry < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay = Math.min(currentDelay * 1.2, CONNECT_TIMEOUT);
        }
      }

      this.connectionWaiters--;
      throw new Error('Failed to acquire Redis connection after maximum retries');
    } catch (error) {
      this.connectionWaiters--;
      throw error;
    }
  }

  public release(client: Redis): void {
    const connection = this.pool.find(conn => conn.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
    }
  }

  public async cleanup(): Promise<void> {
    this.stopConnectionReaper();
    
    const CLEANUP_TIMEOUT = 1000;
    
    try {
      await Promise.all(this.pool.map(async (connection) => {
        try {
          if (connection.client.status === 'ready' || connection.client.status === 'connecting') {
            await Promise.race([
              connection.client.quit(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Redis quit timeout')), CLEANUP_TIMEOUT)
              )
            ]);
          }
        } catch (error) {
          logger.error('Error during connection cleanup', {
            error,
            connectionId: connection.id,
            status: connection.client.status
          });
          connection.client.disconnect(false);
        }
      }));
    } catch (error) {
      logger.error('Pool cleanup error', { error });
    } finally {
      this.pool = [];
    }
  }
}

export const vercelRedisService = new VercelRedisService();