import { motion } from 'framer-motion';
import { useState } from 'react';
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
      id="omnibox-container"
      layoutId="omnibox-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-xl mx-auto flex flex-col items-center"
    >
      
      {/* Explicit Create Button */}
      <button
        id="btn-create-paste"
        onClick={() => onAction('create', '')}
        className="mb-8 flex items-center space-x-3 bg-white text-black px-8 py-3.5 border border-white rounded-none font-mono text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 active:scale-98 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <Plus size={16} />
        <span>Create New Paste</span>
      </button>

      <div className="flex items-center space-x-4 mb-6 select-none">
        <div className="h-[1px] w-8 bg-neutral-900"></div>
        <span className="text-neutral-600 text-[10px] font-mono tracking-[0.2em] uppercase">or retrieve</span>
        <div className="h-[1px] w-8 bg-neutral-900"></div>
      </div>

      {/* Explicit Retrieve Form */}
      <form id="form-retrieve-paste" onSubmit={handleRetrieve} className="w-full">
        <div className="bg-neutral-950 border border-neutral-900 rounded-none flex items-center p-1.5 overflow-hidden transition-colors duration-200 focus-within:border-neutral-700">
          <div className="pl-3 pr-1 text-neutral-600">
            <Search size={16} />
          </div>
          <input
            id="input-retrieve-paste"
            type="text"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            className="w-full bg-transparent text-white/90 text-sm font-mono tracking-wider placeholder:text-neutral-750 outline-none px-2 py-2"
            placeholder="ENTER PASTE ID..."
            autoComplete="off"
            spellCheck="false"
            aria-label="Retrieve paste by ID"
          />
          <button
            id="btn-retrieve-paste"
            type="submit"
            disabled={!pasteId.trim()}
            className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white px-5 py-2.5 rounded-none font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-35 disabled:cursor-not-allowed shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            Retrieve
          </button>
        </div>
      </form>

    </motion.div>
  );
}
