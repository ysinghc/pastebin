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
      layoutId="omnibox-container"
      className="w-full max-w-5xl mx-auto bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[75vh]"
    >
      {/* Top Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/5"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
            <Search size={14} className="text-white/40" />
            <span className="text-white/90 font-mono text-sm tracking-wide">{pasteId}</span>
          </div>
          {data && (
            <div className="flex items-center space-x-1.5 text-white/50 text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              <Clock size={14} />
              <span>{formatTTL(data.ttl_remaining_seconds)} left</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Prominent Copy Button in Header */}
          {data && (
            <button
              onClick={() => copyToClipboard(data.content)}
              className="flex items-center space-x-2 bg-white text-black px-4 py-1.5 rounded-lg font-semibold text-sm hover:scale-105 active:scale-95 transition-transform"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          )}

          <div className="w-px h-6 bg-white/10"></div>
          
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>

      {/* Main Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-white/40"
            >
              <RefreshCw size={24} className="animate-spin mb-4" />
              <p className="text-sm font-medium tracking-wide">Retrieving snippet...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl flex flex-col items-center shadow-lg">
                <X size={32} className="mb-2 opacity-50" />
                <p className="font-semibold text-center max-w-sm">{error.message || 'Failed to retrieve paste.'}</p>
                <button 
                  onClick={onCancel}
                  className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-sm font-medium transition-colors"
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
              transition={{ duration: 0.5 }}
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
                  fontSize: 15,
                  fontFamily: "'Geist Mono', 'Fira Code', monospace",
                  wordWrap: 'on',
                  lineNumbersMinChars: 4,
                  padding: { top: 32, bottom: 32 },
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
