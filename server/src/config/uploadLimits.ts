export const UPLOAD_LIMITS = {
  // Maximum number of active uploads allowed
  // To remove limitation, set MAX_ACTIVE_UPLOADS to a very high number or Infinity
  // Example: MAX_ACTIVE_UPLOADS=Infinity
  MAX_ACTIVE_UPLOADS: parseInt(process.env.MAX_ACTIVE_UPLOADS || '5', 10),
  
  // Time to wait before checking upload limit again (ms)
  // To disable retry delay, set UPLOAD_LIMIT_RETRY_DELAY=0
  UPLOAD_LIMIT_RETRY_DELAY: parseInt(process.env.UPLOAD_LIMIT_RETRY_DELAY || '5000', 10)
};