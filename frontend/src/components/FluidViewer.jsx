import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPaste } from '../api';
import { useApi } from '../hooks';
import Editor from '@monaco-editor/react';
import { X, Copy, Check, Clock, Search, RefreshCw } from 'lucide-react';

export function FluidViewer({ pasteId, onCancel }) {
  const [copied, setCopied] = useState(false);
  const { loading, error, data, execute } = useApi();

  useEffect(() => {
    if (pasteId) {
      execute(() => getPaste(pasteId));
    }
  }, [pasteId]);

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('fluid-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
        'editor.lineHighlightBackground': '#ffffff0a',
        'editorLineNumber.foreground': '#ffffff40',
        'editor.selectionBackground': '#ffffff20',
      }
    });
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const formatTTL = (seconds) => {
    if (!seconds) return '';
    if (seconds < 0) return 'expired';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h`;
  };

  const determineLanguage = (content) => {
    if (!content) return 'plaintext';
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) return 'json';
    if (content.includes('function') || content.includes('const ') || content.includes('=>')) return 'javascript';
    if (content.includes('def ') || (content.includes('import ') && !content.includes(';'))) return 'python';
    if (content.includes('<html>') || content.includes('<div')) return 'html';
    return 'plaintext';
  };

  const lang = data ? determineLanguage(data.content) : 'plaintext';

  return (
    <motion.div
      id="viewer-container"
      layoutId="omnibox-container"
      className="w-full max-w-5xl mx-auto bg-[#0a0a0a] border border-neutral-900 rounded-none flex flex-col h-[70vh] min-h-[500px]"
    >
      {/* Top Header */}
      <div 
        className="flex justify-between items-center px-5 py-3 border-b border-neutral-900 bg-neutral-950/50"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-neutral-950 px-3 py-1.5 rounded-none border border-neutral-900">
            <Search size={12} className="text-neutral-500" />
            <span id="viewer-paste-id" className="text-neutral-300 font-mono text-xs tracking-wider select-all">{pasteId}</span>
          </div>
          {data && (
            <div id="viewer-ttl" className="flex items-center space-x-1.5 text-neutral-400 text-xs bg-neutral-950 px-3 py-1.5 rounded-none border border-neutral-900 font-mono uppercase tracking-wider">
              <Clock size={12} />
              <span>{formatTTL(data.ttl_remaining_seconds)} left</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Prominent Copy Button in Header */}
          {data && (
            <button
              id="btn-copy-code"
              onClick={() => copyToClipboard(data.content)}
              className="flex items-center space-x-2 bg-white text-black px-4 py-1.5 rounded-none font-bold font-mono text-[10px] uppercase tracking-widest transition-colors hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          )}

          <div className="w-px h-4 bg-neutral-900"></div>
          
          <button 
            id="btn-close-viewer"
            onClick={onCancel}
            className="p-1 hover:bg-neutral-900 text-neutral-600 hover:text-white transition-colors border border-transparent hover:border-neutral-800 rounded-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
            aria-label="Close viewer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500"
            >
              <RefreshCw size={18} className="animate-spin mb-3 text-neutral-600" />
              <p className="text-[10px] font-mono tracking-widest uppercase">Retrieving snippet...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4"
            >
              <div className="bg-neutral-950 border border-neutral-900 text-rose-500 px-6 py-5 rounded-none flex flex-col items-center max-w-md font-mono text-xs uppercase tracking-wider">
                <X size={20} className="mb-3 text-rose-600" />
                <p className="font-bold text-center max-w-sm leading-relaxed">{error.message || 'Failed to retrieve paste.'}</p>
                <button 
                  id="btn-error-return-search"
                  onClick={onCancel}
                  className="mt-6 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white font-mono text-[10px] uppercase tracking-widest transition-colors rounded-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
                >
                  Return to Search
                </button>
              </div>
            </motion.div>
          ) : data ? (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full relative group"
            >
              <Editor
                height="100%"
                language={lang}
                theme="fluid-dark"
                beforeMount={handleEditorWillMount}
                value={data.content}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Geist Mono', 'Fira Code', monospace",
                  wordWrap: 'on',
                  lineNumbersMinChars: 4,
                  padding: { top: 24, bottom: 24 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  renderLineHighlight: 'none',
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
