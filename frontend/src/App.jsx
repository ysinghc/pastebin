import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Omnibox, FluidCreator, FluidViewer, HealthStatus } from './components';
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
    <div className="min-h-screen flex flex-col justify-between bg-black text-white/70">

      {/* Header Branding */}
      <header className="w-full max-w-5xl mx-auto px-6 pt-8 pb-6 flex justify-between items-center border-b border-neutral-900">
        <button 
          onClick={handleCancel}
          className="text-white font-mono tracking-[0.25em] text-sm uppercase cursor-pointer hover:opacity-85 transition-opacity bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          aria-label="Pastebin homepage"
        >
          Pastebin
        </button>
        <HealthStatus inline={true} />
      </header>

      {/* Main Orchestration Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {mode === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-4xl sm:text-5xl font-extralight tracking-[0.25em] uppercase text-white/95 text-center mb-10 select-none">
                Pastebin
              </h1>
              <Omnibox onAction={handleOmniboxAction} />
            </motion.div>
          )}

          {mode === 'creating' && (
            <motion.div
              key="creating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FluidCreator initialContent={initialPasteContent} onCancel={handleCancel} />
            </motion.div>
          )}

          {mode === 'retrieving' && (
            <motion.div
              key="retrieving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FluidViewer pasteId={retrievalPasteId} onCancel={handleCancel} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Creator/Coded By Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-8 border-t border-neutral-900 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono tracking-[0.2em] text-white/30 gap-4">
        <div>
          CODED BY <a href="https://ysinghc.in" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors underline decoration-white/10 underline-offset-4">YSINGHC.IN</a>
        </div>
        <div className="uppercase">
          &copy; {new Date().getFullYear()} PASTEBIN. ALL RIGHTS RESERVED.
        </div>
      </footer>

    </div>
  );
}

export default App;
