/**
 * PasteCreator component for creating new pastes
 */

import { useState } from 'react';
import { createPaste } from '../api';
import { useApi } from '../hooks';
import { ErrorAlert, LoadingSpinner, SuccessAlert, RateLimitInfo } from './Alerts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { CopyButton } from './ui/copy-button';

export function PasteCreator({ onPasteCreated }) {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState('10m');
  const [successData, setSuccessData] = useState(null);

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

      setSuccessData({
        id: response.id,
        expires_in: response.expires_in
      });

      setContent('');
      setTtl('10m');

      if (onPasteCreated) {
        onPasteCreated(response.id);
      }

      setTimeout(() => setSuccessData(null), 10000);
    } catch (err) {
      // Error is handled by the useApi hook
    }
  };

  const handleClear = () => {
    setContent('');
    resetApiState();
    setSuccessData(null);
  };

  const contentBytes = new TextEncoder().encode(content).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Create Paste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {successData && (
          <SuccessAlert onDismiss={() => setSuccessData(null)}>
            <div className="flex flex-col gap-2">
              <p className="font-medium">✓ Paste created successfully!</p>
              <div className="flex items-center justify-between bg-white/50 p-2 rounded border border-green-200">
                <span className="text-xs font-mono font-medium text-green-900">
                  ID: {successData.id}
                </span>
                <CopyButton text={successData.id} label="Copy ID" />
              </div>
              <p className="text-xs opacity-80">Expires in {successData.expires_in}</p>
            </div>
          </SuccessAlert>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-gray-700">
              Content
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              placeholder="Paste your content here..."
              className="h-72 font-mono text-sm"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {contentBytes} bytes
              </span>
              <span className="text-xs text-gray-500">
                {content.length} characters
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="ttl" className="text-sm font-medium text-gray-700">
              Expiration Time
            </label>
            <select
              id="ttl"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="10m">10 minutes</option>
              <option value="1h">1 hour</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                'Create Paste'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
