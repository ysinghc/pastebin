import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPaste } from '../api';
import { useApi } from '../hooks';
import Editor from '@monaco-editor/react';
import { Play, X, Copy, Check, ChevronDown, Sparkles } from 'lucide-react';

const MAX_BYTES = 50 * 1024; // 50 KB limit

export function FluidCreator({ initialContent = '', onCancel }) {
  const editorRef = useRef(null);
  const [content, setContent] = useState('');
  const [byteCount, setByteCount] = useState(0);
  const [ttl, setTtl] = useState('10m');
  const [language, setLanguage] = useState('plaintext');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const { loading, error, execute } = useApi();

  useEffect(() => {
    if (initialContent) {
      if (initialContent.includes('function') || initialContent.includes('const ') || initialContent.includes('=>')) setLanguage('javascript');
      else if (initialContent.includes('def ') || (initialContent.includes('import ') && !initialContent.includes(';'))) setLanguage('python');
      else if (initialContent.trim().startsWith('{') || initialContent.trim().startsWith('[')) setLanguage('json');
      else if (initialContent.includes('<html>') || initialContent.includes('<div')) setLanguage('html');
      
      const bytes = new Blob([initialContent]).size;
      if (bytes <= MAX_BYTES) {
        setContent(initialContent);
        setByteCount(bytes);
      } else {
        handleEditorChange(initialContent);
      }
    }
  }, [initialContent]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
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
    monaco.editor.setTheme('fluid-dark');
  };

  const handleEditorChange = (val) => {
    const text = val || '';
    const bytes = new Blob([text]).size;
    
    if (bytes <= MAX_BYTES) {
      setContent(text);
      setByteCount(bytes);
    } else {
      // Binary search to find exact cutoff
      let low = 0;
      let high = text.length;
      let best = 0;
      
      while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        let slice = text.slice(0, mid);
        if (new Blob([slice]).size <= MAX_BYTES) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      
      const truncated = text.slice(0, best);
      setContent(truncated);
      setByteCount(new Blob([truncated]).size);
      
      // Force Monaco to respect the cutoff immediately to prevent cursor jumping bug
      if (editorRef.current) {
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(truncated);
        if (position) {
          editorRef.current.setPosition(position);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    try {
      const response = await execute(() => createPaste(content, ttl));
      setSuccessData({ id: response.id, expires_in: response.expires_in });
    } catch (err) {}
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const isNearingLimit = byteCount > MAX_BYTES * 0.9;
  const isAtLimit = byteCount >= MAX_BYTES;

  return (
    <motion.div
      id="creator-container"
      layoutId="omnibox-container"
      className="w-full max-w-5xl mx-auto bg-[#0a0a0a] border border-neutral-900 rounded-none flex flex-col h-[70vh] min-h-[500px]"
    >
      {/* Top Header */}
      <div 
        className="flex justify-between items-center px-5 py-3 border-b border-neutral-900 bg-neutral-950/50"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-1.5 h-1.5 bg-neutral-700"></div>
            <span className="text-neutral-400 font-mono tracking-widest text-xs uppercase select-none">New Snippet</span>
          </div>
          <div className={`text-[10px] font-mono px-2 py-0.5 border border-neutral-900 transition-colors uppercase tracking-wider ${isAtLimit ? 'bg-red-950/30 text-red-400 border-red-900' : isNearingLimit ? 'bg-yellow-950/30 text-yellow-500 border-yellow-900' : 'bg-neutral-950 text-neutral-500'}`}>
            {(byteCount / 1024).toFixed(1)}KB / 50KB Limit
          </div>
        </div>
        
        <button 
          id="btn-close-creator"
          onClick={onCancel}
          className="p-1 hover:bg-neutral-900 text-neutral-600 hover:text-white transition-colors border border-transparent hover:border-neutral-800 rounded-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          aria-label="Close editor"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Geist Mono', 'Fira Code', monospace",
            wordWrap: 'on',
            lineNumbersMinChars: 4,
            padding: { top: 24, bottom: 24 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: 'all',
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
          }}
        />
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {successData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-neutral-950 border border-neutral-850 text-white px-5 py-4 rounded-none flex items-center space-x-4 z-50 font-mono text-[11px] uppercase tracking-wider"
          >
            <div className="flex items-center justify-center w-6 h-6 border border-neutral-800 bg-neutral-900 text-emerald-500">
              <Check size={12} />
            </div>
            <div>
              <p className="font-bold text-white/90">Snippet Published</p>
              <p className="text-[10px] text-neutral-500">EXPIRES IN {successData.expires_in.toUpperCase()}</p>
            </div>
            <div className="h-6 w-px bg-neutral-900 mx-1"></div>
            <button
              id="btn-copy-success-id"
              onClick={() => copyToClipboard(successData.id)}
              className="flex items-center space-x-2 bg-white text-black px-4 py-2 border border-white hover:bg-neutral-200 transition-colors rounded-none font-bold font-mono text-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'COPIED' : 'COPY ID'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Action Bar */}
      <div 
        className="flex items-center justify-between px-5 py-3 border-t border-neutral-900 bg-neutral-950"
      >
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <select
              id="select-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-400 hover:text-white text-[10px] font-mono tracking-widest uppercase pl-3 pr-10 py-2.5 outline-none cursor-pointer transition-colors rounded-none focus:border-neutral-700 focus-visible:ring-1 focus-visible:ring-white/30 min-w-[140px]"
              aria-label="Select syntax language"
            >
              <option value="plaintext" className="bg-neutral-950 text-neutral-300">Plain Text</option>
              <option value="javascript" className="bg-neutral-950 text-neutral-300">JavaScript</option>
              <option value="python" className="bg-neutral-950 text-neutral-300">Python</option>
              <option value="json" className="bg-neutral-950 text-neutral-300">JSON</option>
              <option value="html" className="bg-neutral-950 text-neutral-300">HTML</option>
              <option value="css" className="bg-neutral-950 text-neutral-300">CSS</option>
              <option value="markdown" className="bg-neutral-950 text-neutral-300">Markdown</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
          </div>

          <div className="relative group">
            <select
              id="select-ttl"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="appearance-none bg-transparent hover:bg-neutral-900 border border-transparent hover:border-neutral-900 text-neutral-500 hover:text-neutral-300 text-[10px] font-mono tracking-widest uppercase pl-3 pr-10 py-2.5 outline-none cursor-pointer transition-colors rounded-none focus:border-neutral-700 focus-visible:ring-1 focus-visible:ring-white/30 min-w-[140px]"
              aria-label="Select expiration time"
            >
              <option value="10m" className="bg-neutral-950 text-neutral-300">Burn in 10m</option>
              <option value="1h" className="bg-neutral-950 text-neutral-300">Burn in 1h</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
          </div>
        </div>

        <button
          id="btn-publish-paste"
          onClick={handleSubmit}
          disabled={loading || !content.trim() || isAtLimit}
          className="flex items-center space-x-2 bg-white hover:bg-neutral-200 text-black px-6 py-2.5 rounded-none font-bold font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin"></div>
          ) : (
            <Play size={12} fill="currentColor" />
          )}
          <span>{isAtLimit ? 'Limit Exceeded' : 'Publish'}</span>
        </button>
      </div>
    </motion.div>
  );
}
