/**
 * PasteRetriever component for fetching and displaying pastes
 */

import { useState } from 'react';
import { getPaste } from '../api';
import { useApi } from '../hooks';
import { ErrorAlert, LoadingSpinner, RateLimitInfo } from './Alerts';

export function PasteRetriever({ initialPasteId = '' }) {
  const [pasteId, setPasteId] = useState(initialPasteId);
  const [copied, setCopied] = useState(false);

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

    if (!pasteId.trim()) {
      return;
    }

    try {
      await execute(() => getPaste(pasteId));
    } catch (err) {
      // Error is handled by the useApi hook
    }
  };

  const handleCopyContent = async () => {
    if (data?.content) {
      try {
        await navigator.clipboard.writeText(data.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleClear = () => {
    resetApiState();
    setPasteId('');
    setCopied(false);
  };

  const formatTTL = (seconds) => {
    if (seconds < 0) {
      return 'expired';
    }
    if (seconds < 60) {
      return `${seconds}s`;
    }
    if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes}m`;
    }
    const hours = Math.ceil(seconds / 3600);
    return `${hours}h`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Retrieve Paste</h2>

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

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            disabled={loading}
            placeholder="Enter paste ID..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
          />
          <button
            type="submit"
            disabled={loading || !pasteId.trim()}
            className="px-6 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Fetching...
              </>
            ) : (
              'Fetch'
            )}
          </button>
        </div>
      </form>

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Paste ID</p>
              <p className="text-sm font-mono font-medium text-gray-900">{pasteId}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs text-gray-500">Expires in</p>
              <p className="text-sm font-medium text-gray-900">
                {formatTTL(data.ttl_remaining_seconds)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <button
                type="button"
                onClick={handleCopyContent}
                className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              value={data.content}
              readOnly
              className="w-full h-72 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="py-12 text-center">
          <p className="text-gray-500">Enter a paste ID to retrieve its content</p>
        </div>
      )}
    </div>
  );
}
