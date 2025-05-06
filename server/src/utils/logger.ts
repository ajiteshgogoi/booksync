// Simple console logger implementation with redaction for sensitive data

const SENSITIVE_KEYS = new Set(['token', 'key', 'secret', 'password', 'auth', 'apiKey', 'accessToken', 'refreshToken']);
const REDACTED_VALUE = '[REDACTED]';

function redactSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const redactedObject: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        redactedObject[key] = REDACTED_VALUE;
      } else {
        redactedObject[key] = redactSensitiveData(data[key]);
      }
    }
  }
  return redactedObject;
}


export const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(redactSensitiveData(data), null, 2) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(redactSensitiveData(data), null, 2) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(redactSensitiveData(data), null, 2) : ''),
  debug: (message: string, data?: any) => console.log(`[DEBUG] ${message}`, data ? JSON.stringify(redactSensitiveData(data), null, 2) : '') // Consider if debug logs should be less redacted in dev environments
};