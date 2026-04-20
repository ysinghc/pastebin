/**
 * ErrorAlert component for displaying error messages with retry info
 */

export function ErrorAlert({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const isRateLimited = error.status === 429;
  const isServiceDown = error.status === 503 || error.status === 504;

  return (
    <div className="rounded-md bg-red-50 p-4 border border-red-200">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isRateLimited && 'Rate Limit Exceeded'}
            {isServiceDown && 'Service Temporarily Unavailable'}
            {!isRateLimited && !isServiceDown && 'Error'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error.message}</p>
            {error.rateLimitInfo && (
              <p className="mt-1">
                {error.rateLimitInfo.resetAfter && (
                  <>
                    Reset after{' '}
                    <strong>{error.rateLimitInfo.resetAfter} seconds</strong>
                  </>
                )}
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Dismiss
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm font-medium text-red-600 hover:text-red-700 ml-2"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LoadingSpinner component
 */
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

/**
 * SuccessAlert component
 */
export function SuccessAlert({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="rounded-md bg-green-50 p-4 border border-green-200">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 inline-flex text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Dismiss</span>
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * RateLimitInfo component
 */
export function RateLimitInfo({ rateLimitInfo }) {
  if (!rateLimitInfo) return null;

  const percentage =
    rateLimitInfo.remaining && rateLimitInfo.limit
      ? (rateLimitInfo.remaining / rateLimitInfo.limit) * 100
      : 0;

  const isWarning = percentage < 25;
  const isDanger = percentage < 10;

  return (
    <div className="rounded-md bg-blue-50 p-3 border border-blue-200">
      <div className="flex items-center">
        <span className="text-sm text-blue-800">
          Rate limit: {rateLimitInfo.remaining} / {rateLimitInfo.limit}
        </span>
        <div
          className={`ml-3 h-2 w-32 rounded-full ${
            isDanger
              ? 'bg-red-200'
              : isWarning
                ? 'bg-yellow-200'
                : 'bg-green-200'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              isDanger
                ? 'bg-red-500'
                : isWarning
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
