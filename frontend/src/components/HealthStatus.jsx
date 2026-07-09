/**
 * HealthStatus component - Quiet indicator supporting inline or floating modes
 */

import { useEffect, useState } from 'react';
import { getHealth } from '../api';
import { motion } from 'framer-motion';

export function HealthStatus({ inline = false }) {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await getHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setHealth(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  let dotColor = 'bg-neutral-600';
  let statusText = 'CONNECTING...';

  if (error || (!health && !error)) {
    dotColor = 'bg-rose-600';
    statusText = error ? 'OFFLINE' : 'CONNECTING...';
  } else if (health) {
    if (health.status === 'ok') {
      dotColor = 'bg-emerald-600';
      statusText = 'SYSTEM OPERATIONAL';
    } else {
      dotColor = 'bg-amber-600';
      statusText = 'DEGRADED';
    }
  }

  const tooltip = `API: ${health?.status || 'Unknown'} | Redis: ${health?.redis || 'Unknown'}`;

  if (inline) {
    return (
      <div 
        className="flex items-center space-x-2 cursor-default select-none"
        title={tooltip}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`}></span>
        </span>
        <span className="text-[10px] font-mono tracking-[0.2em] text-white/40">
          {statusText}
        </span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="fixed bottom-6 right-6 flex items-center space-x-2.5 px-3 py-1.5 rounded-none bg-neutral-950 border border-neutral-800 cursor-default z-50 select-none"
      title={tooltip}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`}></span>
      </span>
      <span className="text-[10px] font-mono tracking-[0.2em] text-white/40">
        {statusText}
      </span>
    </motion.div>
  );
}
