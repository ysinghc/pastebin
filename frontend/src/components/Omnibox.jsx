import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Search, Plus } from 'lucide-react';

export function Omnibox({ onAction }) {
  const [pasteId, setPasteId] = useState('');

  const handleRetrieve = (e) => {
    e.preventDefault();
    if (pasteId.trim()) {
      onAction('retrieve', pasteId.trim());
    }
  };

  return (
    <motion.div
      layoutId="omnibox-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-2xl mx-auto flex flex-col items-center"
    >
      
      {/* Explicit Create Button */}
      <motion.button
        onClick={() => onAction('create', '')}
        className="mb-8 flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
      >
        <Plus size={24} />
        <span>Create New Paste</span>
      </motion.button>

      <div className="flex items-center space-x-4 mb-4">
        <div className="h-px w-12 bg-white/10"></div>
        <span className="text-white/40 text-sm font-medium">OR RETRIEVE EXISTING</span>
        <div className="h-px w-12 bg-white/10"></div>
      </div>

      {/* Explicit Retrieve Form */}
      <form onSubmit={handleRetrieve} className="relative group w-full">
        <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur-xl opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
        
        <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center p-2 overflow-hidden transition-all duration-300 focus-within:border-white/30 focus-within:bg-black/60">
          <div className="pl-4 pr-2 text-white/40">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            className="w-full bg-transparent text-white/90 text-lg font-medium placeholder:text-white/30 outline-none px-2 py-3"
            placeholder="Enter Paste ID..."
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            disabled={!pasteId.trim()}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            Retrieve
          </button>
        </div>
      </form>

    </motion.div>
  );
}
