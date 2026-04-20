/**
 * Custom hook for managing API calls with state management
 * Handles loading, error, and success states
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing async API operations
 * @returns {Object} Object with state and action handlers
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    setData(null);
    setRateLimitInfo(null);

    try {
      const { data: responseData, rateLimitInfo: rlInfo } = await apiCall();
      setData(responseData);
      if (rlInfo) {
        setRateLimitInfo(rlInfo);
      }
      return responseData;
    } catch (err) {
      setError({
        message: err.message,
        status: err.status,
        type: err.error?.error,
        rateLimitInfo: err.rateLimitInfo,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    setRateLimitInfo(null);
  }, []);

  return {
    loading,
    error,
    data,
    rateLimitInfo,
    execute,
    clearError,
    reset,
  };
}

/**
 * Hook for managing multiple independent API calls
 * @returns {Object} Object with call management
 */
export function useApiState() {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
    rateLimitInfo: null,
  });

  const setLoading = useCallback((loading) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setData = useCallback((data) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  const setRateLimitInfo = useCallback((rateLimitInfo) => {
    setState((prev) => ({ ...prev, rateLimitInfo }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
      rateLimitInfo: null,
    });
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    setRateLimitInfo,
    clearError,
    reset,
  };
}
