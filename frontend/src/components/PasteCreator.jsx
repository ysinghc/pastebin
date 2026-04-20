/**
 * PasteCreator component for creating new pastes
 */

import { useState } from 'react';
import { createPaste } from '../api';
import { useApi } from '../hooks';
import { ErrorAlert, LoadingSpinner, SuccessAlert, RateLimitInfo } from './Alerts';

export function PasteCreator({ onPasteCreated }) {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState('10m');
  const [successMessage, setSuccessMessage] = useState('');
  
  const {
    loading,
    error,
    data,
    rateLimitInfo,
    execute,
    clearError,
    reset: resetApiState,
  } = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await execute(() => createPaste(content, ttl));
      
      setSuccessMessage(
        `✓ Paste created! ID: ${response.id} (expires in ${response.expires_in})`
      );
      
      setContent('');
      setTtl('10m');

      // Notify parent component
      if (onPasteCreated) {
        onPasteCreated(response.id);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      // Error is handled by the useApi hook
    }
  };

  const handleClear = () => {
    setContent('');
    resetApiState();
    setSuccessMessage('');
  };

  const contentBytes = new TextEncoder().encode(content).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Paste</h2>

      {successMessage && (
        <div className="mb-4">
          <SuccessAlert
            message={successMessage}
            onDismiss={() => setSuccessMessage('')}
          />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorAlert
            error={error}
            onDismiss={clearError}
            onRetry={() => handleSubmit({ preventDefault: () => {} })}
          />
        </div>
      )}

      {rateLimitInfo && (
        <div className="mb-4">
          <RateLimitInfo rateLimitInfo={rateLimitInfo} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            placeholder="Paste your content here..."
            className="w-full h-72 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
          />
          <div className="mt-1 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {contentBytes} bytes
            </span>
            <span className="text-xs text-gray-500">
              {content.length} characters
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="ttl" className="block text-sm font-medium text-gray-700 mb-2">
            Expiration Time
          </label>
          <select
            id="ttl"
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="10m">10 minutes</option>
            <option value="1h">1 hour</option>
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Creating...
              </>
            ) : (
              'Create Paste'
            )}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
