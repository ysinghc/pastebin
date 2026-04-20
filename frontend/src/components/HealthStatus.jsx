/**
 * HealthStatus component for monitoring backend health
 */

import { useEffect, useState } from 'react';
import { getHealth } from '../api';

export function HealthStatus() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const data = await getHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    // Check health on mount
    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-3">
        <p className="text-sm text-red-800">
          <strong>Health Check Failed:</strong> {error}
        </p>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const isHealthy = health.status === 'ok';
  const isDegraded = health.status === 'degraded';
  const redisConnected = health.redis === 'connected';

  return (
    <div
      className={`rounded-md p-3 border ${
        isHealthy
          ? 'bg-green-50 border-green-200'
          : isDegraded
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`h-3 w-3 rounded-full mt-0.5 flex-shrink-0 ${
            isHealthy
              ? 'bg-green-500'
              : isDegraded
                ? 'bg-yellow-500'
                : 'bg-red-500'
          }`}
        ></div>
        <div className="flex-1 text-sm">
          <p
            className={`font-medium ${
              isHealthy
                ? 'text-green-800'
                : isDegraded
                  ? 'text-yellow-800'
                  : 'text-red-800'
            }`}
          >
            {isHealthy && 'Service Operational'}
            {isDegraded && 'Service Degraded'}
            {!isHealthy && !isDegraded && 'Service Down'}
          </p>
          <p
            className={`mt-1 text-xs ${
              isHealthy
                ? 'text-green-700'
                : isDegraded
                  ? 'text-yellow-700'
                  : 'text-red-700'
            }`}
          >
            Redis: {redisConnected ? 'Connected' : 'Disconnected'}
            {health.connection_count > 0 && ` • ${health.connection_count} connections`}
          </p>
        </div>
      </div>
    </div>
  );
}
