/**
 * Retry API calls with exponential backoff
 * @param {Function} apiCall - The API call function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @returns {Promise} - The result of the API call
 */
export const retryApiCall = async (
  apiCall,
  maxRetries = 3,
  baseDelay = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry on certain error types
      if (
        error.status === 401 ||
        error.status === 403 ||
        error.status === 404
      ) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(
        `API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
        error.message
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Retry API call with custom retry conditions
 * @param {Function} apiCall - The API call function to retry
 * @param {Function} shouldRetry - Function to determine if we should retry (receives error as argument)
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - The result of the API call
 */
export const retryApiCallWithCondition = async (
  apiCall,
  shouldRetry = (error) => error.status >= 500,
  maxRetries = 3,
  baseDelay = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(
        `API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
        error.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export default retryApiCall;
