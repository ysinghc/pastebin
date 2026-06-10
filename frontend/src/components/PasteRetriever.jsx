/**
 * PasteRetriever component for fetching and displaying pastes
 */

import { useState } from 'react';
import { getPaste } from '../api';
import { useApi } from '../hooks';
import { ErrorAlert, LoadingSpinner, RateLimitInfo } from './Alerts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { CopyButton } from './ui/copy-button';

export function PasteRetriever({ initialPasteId = '' }) {
  const [pasteId, setPasteId] = useState(initialPasteId);

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

  const handleClear = () => {
    resetApiState();
    setPasteId('');
  };

  const formatTTL = (seconds) => {
    if (seconds < 0) return 'expired';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Retrieve Paste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <ErrorAlert
            error={error}
            onDismiss={clearError}
            onRetry={() => handleSubmit({ preventDefault: () => {} })}
          />
        )}

        {rateLimitInfo && (
          <RateLimitInfo rateLimitInfo={rateLimitInfo} />
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            disabled={loading}
            placeholder="Enter paste ID..."
            className="font-mono text-sm"
          />
          <Button
            type="submit"
            disabled={loading || !pasteId.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Fetching...
              </>
            ) : (
              'Fetch'
            )}
          </Button>
        </form>

        {data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Paste ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-medium text-gray-900">{pasteId}</p>
                  <CopyButton text={pasteId} label="Copy" />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs text-gray-500">Expires in</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatTTL(data.ttl_remaining_seconds)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Content
                </label>
                <CopyButton text={data.content} label="Copy Content" />
              </div>
              <Textarea
                value={data.content}
                readOnly
                className="h-72 bg-gray-50 font-mono text-sm"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleClear}
              className="w-full"
            >
              Clear
            </Button>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="py-12 text-center">
            <p className="text-gray-500">Enter a paste ID to retrieve its content</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
