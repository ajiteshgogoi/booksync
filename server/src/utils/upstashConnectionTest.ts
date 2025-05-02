import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testConnection() {
    console.log('Starting Upstash connection test...');
    
    // Debug environment variables (safely)
    console.log('Environment variables:');
    console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? '***[redacted]***' : '[missing]');
    console.log('UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? '[present]' : '[missing]');

    try {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL || '',
            token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
        });

        // Simple test: Set and get a value
        console.log('\nTesting basic Redis operations...');
        
        const testKey = 'test:connection';
        const testValue = 'Hello Upstash! ' + new Date().toISOString();
        
        console.log('Setting test value...');
        await redis.set(testKey, testValue);
        console.log('✓ Set operation successful');
        
        console.log('Getting test value...');
        const retrieved = await redis.get(testKey);
        // Don't log the actual value as it contains timestamp
        console.log('Retrieved value matches:', retrieved === testValue);
        
        if (retrieved === testValue) {
            console.log('✓ Get operation successful');
            console.log('\n✅ Connection test passed successfully!');
        } else {
            console.log('❌ Get operation failed: values do not match');
        }
        
        // Cleanup
        await redis.del(testKey);
        
    } catch (error) {
        // Safely log error without exposing URLs
        console.error('\n❌ Connection test failed');
        if (error instanceof Error) {
            // Remove any URLs from error message
            const safeMessage = error.message.replace(/(https?:\/\/[^\s]*)/g, '***[redacted]***');
            console.error('Error:', safeMessage);
        }
        process.exit(1);
    }
}

console.log('Test script started');
testConnection().catch(error => {
    // Safely log error without exposing URLs
    if (error instanceof Error) {
        const safeMessage = error.message.replace(/(https?:\/\/[^\s]*)/g, '***[redacted]***');
        console.error('Fatal error:', safeMessage);
    }
    process.exit(1);
});