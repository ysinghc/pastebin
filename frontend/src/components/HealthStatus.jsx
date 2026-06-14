/**
 * HealthStatus component - Quiet corner indicator
 */

import { useEffect, useState } from 'react';
import { getHealth } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

export function HealthStatus() {
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

  let dotClass = 'glow-red';
  let statusText = 'Connecting...';

  if (error || (!health && !error)) {
    dotClass = 'glow-red';
    statusText = error ? 'Offline' : 'Connecting...';
  } else if (health) {
    if (health.status === 'ok') {
      dotClass = 'glow-green';
      statusText = 'System Operational';
    } else {
      dotClass = 'glow-yellow';
      statusText = 'Degraded';
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="fixed bottom-6 right-6 flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md cursor-default group z-50"
      title={`API: ${health?.status || 'Unknown'} | Redis: ${health?.redis || 'Unknown'}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></div>
      <span className="text-[10px] font-medium tracking-wide text-white/40 group-hover:text-white/80 transition-colors duration-300">
        {statusText}
      </span>
    </motion.div>
  );
}
