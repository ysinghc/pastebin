import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Omnibox, FluidCreator, FluidViewer, HealthStatus } from './components';
import { Code2 } from 'lucide-react';
import './App.css';

function App() {
  // mode can be: 'idle', 'creating', 'retrieving'
  const [mode, setMode] = useState('idle');
  
  // Data passed between states
  const [initialPasteContent, setInitialPasteContent] = useState('');
  const [retrievalPasteId, setRetrievalPasteId] = useState('');

  const handleOmniboxAction = (action, value) => {
    if (action === 'create') {
      setInitialPasteContent(value);
      setMode('creating');
    } else if (action === 'retrieve') {
      setRetrievalPasteId(value);
      setMode('retrieving');
    }
  };

  const handleCancel = () => {
    setMode('idle');
    setInitialPasteContent('');
    setRetrievalPasteId('');
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center overflow-hidden">
      
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header Branding (absolute top left) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute top-8 left-8 flex items-center space-x-3 select-none pointer-events-none"
      >
        <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
          <Code2 size={16} className="text-white/70" />
        </div>
        <span className="text-white/60 font-semibold tracking-widest text-xs uppercase">Pastebin</span>
      </motion.div>

      {/* Main Orchestration Area */}
      <main className="w-full px-4 z-10 relative">
        <AnimatePresence mode="wait">
          
          {mode === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-center mb-10">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 shadow-2xl flex items-center justify-center">
                  <Code2 size={24} className="text-white/80" />
                </div>
              </div>
              <Omnibox onAction={handleOmniboxAction} />
            </motion.div>
          )}

          {mode === 'creating' && (
            <motion.div
              key="creating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
            >
              <FluidCreator initialContent={initialPasteContent} onCancel={handleCancel} />
            </motion.div>
          )}

          {mode === 'retrieving' && (
            <motion.div
              key="retrieving"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
            >
              <FluidViewer pasteId={retrievalPasteId} onCancel={handleCancel} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Quiet Health Status */}
      <HealthStatus />

    </div>
  );
}

export default App;
