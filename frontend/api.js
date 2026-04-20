/**
 * API client utility for pastebin service
 * Handles requests to the backend with proper error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Error messages based on backend error types
const ERROR_MESSAGES = {
  'service_unavailable': 'Storage backend is unreachable. Please try again later.',
  'gateway_timeout': 'Request timed out. Please try again.',
  'storage_error': 'A storage error occurred. Please try again later.',
  'not_found': 'Paste not found or has expired.',
  'http_error': 'An error occurred.',
  'network_error': 'Network error. Please check your connection.',
  'parse_error': 'Failed to parse response from server.',
};

// Rate limit headers
export const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
  RESET_AFTER: 'X-RateLimit-Reset-After',
};

class APIError extends Error {
  constructor(message, status, error, headers = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.error = error;
    this.headers = headers;
    this.rateLimitInfo = extractRateLimitInfo(headers);
  }
}

/**
 * Extract rate limit information from response headers
 */
function extractRateLimitInfo(headers) {
  const info = {};
  
  if (headers[RATE_LIMIT_HEADERS.LIMIT]) {
    info.limit = parseInt(headers[RATE_LIMIT_HEADERS.LIMIT]);
  }
  if (headers[RATE_LIMIT_HEADERS.REMAINING]) {
    info.remaining = parseInt(headers[RATE_LIMIT_HEADERS.REMAINING]);
  }
  if (headers[RATE_LIMIT_HEADERS.RESET]) {
    info.reset = parseInt(headers[RATE_LIMIT_HEADERS.RESET]);
  }
  if (headers[RATE_LIMIT_HEADERS.RESET_AFTER]) {
    info.resetAfter = parseInt(headers[RATE_LIMIT_HEADERS.RESET_AFTER]);
  }

  return Object.keys(info).length > 0 ? info : null;
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(status, errorData) {
  // Check for specific error type from backend
  if (errorData?.error && ERROR_MESSAGES[errorData.error]) {
    return ERROR_MESSAGES[errorData.error];
  }
  
  // Check for custom message from backend
  if (errorData?.message) {
    return errorData.message;
  }

  // Fall back to status code messages
  const statusMessages = {
    400: 'Invalid request. Please check your input.',
    404: 'Resource not found.',
    429: 'Rate limit exceeded. Please wait before trying again.',
    503: 'Service temporarily unavailable. Please try again later.',
    504: 'Request timed out. Please try again.',
  };

  return statusMessages[status] || 'An unexpected error occurred.';
}

/**
 * Create a paste
 */
export async function createPaste(content, ttl = '10m') {
  try {
    const response = await fetch(`${API_BASE_URL}/paste`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, ttl }),
    });

    const headers = Object.fromEntries(response.headers.entries());
    const data = await response.json();

    if (!response.ok) {
      const message = getErrorMessage(response.status, data);
      throw new APIError(message, response.status, data, headers);
    }

    return { data, rateLimitInfo: extractRateLimitInfo(headers) };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new APIError(ERROR_MESSAGES.network_error, 0, { error: 'network_error' });
    }

    throw new APIError(
      ERROR_MESSAGES.parse_error,
      0,
      { error: 'parse_error', originalError: error.message }
    );
  }
}

/**
 * Retrieve a paste
 */
export async function getPaste(pasteId) {
  try {
    const response = await fetch(`${API_BASE_URL}/paste/${pasteId}`);
    
    const headers = Object.fromEntries(response.headers.entries());
    const data = await response.json();

    if (!response.ok) {
      const message = getErrorMessage(response.status, data);
      throw new APIError(message, response.status, data, headers);
    }

    return { data, rateLimitInfo: extractRateLimitInfo(headers) };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new APIError(ERROR_MESSAGES.network_error, 0, { error: 'network_error' });
    }

    throw new APIError(
      ERROR_MESSAGES.parse_error,
      0,
      { error: 'parse_error', originalError: error.message }
    );
  }
}

/**
 * Check service health
 */
export async function getHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        'Health check failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError(
      ERROR_MESSAGES.network_error,
      0,
      { error: 'network_error' }
    );
  }
}

export { APIError };
