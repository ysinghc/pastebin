/**
 * Alerts and feedback components using shadcn/ui primitives
 */

import React from 'react';
import { Alert } from './ui/alert';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

export function ErrorAlert({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const isRateLimited = error.status === 429;
  const isServiceDown = error.status === 503 || error.status === 504;
  const title = isRateLimited
    ? 'Rate Limit Exceeded'
    : isServiceDown
      ? 'Service Temporarily Unavailable'
      : 'Error';

  return (
    <Alert variant="error" title={title}>
      <div className="space-y-2">
        <p>{error.message}</p>
        {error.rateLimitInfo?.resetAfter && (
          <p className="text-xs opacity-80">
            Reset after <strong>{error.rateLimitInfo.resetAfter} seconds</strong>
          </p>
        )}
        <div className="flex gap-3 pt-2">
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss} className="h-auto p-0 text-red-700 hover:bg-transparent hover:text-red-800">
              Dismiss
            </Button>
          )}
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry} className="h-auto p-0 text-red-700 hover:bg-transparent hover:text-red-800">
              Retry
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

export function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex justify-center">
      <svg
        className={`${sizeClasses[size]} animate-spin text-purple-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
}

export function SuccessAlert({ children, onDismiss }) {
  return (
    <Alert variant="success">
      <div className="flex justify-between items-start">
        <div>{children}</div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-0 text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        )}
      </div>
    </Alert>
  );
}

export function RateLimitInfo({ rateLimitInfo }) {
  if (!rateLimitInfo) return null;

  const percentage =
    rateLimitInfo.remaining && rateLimitInfo.limit
      ? (rateLimitInfo.remaining / rateLimitInfo.limit) * 100
      : 0;

  return (
    <Alert variant="info" title="API Rate Limit">
      <div className="flex items-center gap-4">
        <span className="text-sm">
          {rateLimitInfo.remaining} / {rateLimitInfo.limit} requests remaining
        </span>
        <div className="flex-1">
          <Progress value={percentage} />
        </div>
      </div>
    </Alert>
  );
}
