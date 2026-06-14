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
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-white/20"></div>
            <span className="text-white/70 font-medium tracking-wide text-sm">New Snippet</span>
          </div>
          <div className={`text-xs font-mono px-2 py-1 rounded transition-colors ${isAtLimit ? 'bg-red-500/20 text-red-400' : isNearingLimit ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'}`}>
            {(byteCount / 1024).toFixed(1)}KB / 50KB Limit
          </div>
        </div>
        
        <button 
          onClick={onCancel}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </motion.div>

      {/* Main Editor Area */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily: "'Geist Mono', 'Fira Code', monospace",
            wordWrap: 'on',
            lineNumbersMinChars: 4,
            padding: { top: 32, bottom: 32 },
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-4 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center space-x-4 z-50"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/5">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Paste published!</p>
              <p className="text-xs text-black/60">Expires in {successData.expires_in}</p>
            </div>
            <div className="h-8 w-px bg-black/10 mx-2"></div>
            <button
              onClick={() => copyToClipboard(successData.id)}
              className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:scale-105 active:scale-95 transition-transform"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              <span>{copied ? 'Copied ID' : 'Copy ID'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Action Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20 backdrop-blur-md"
      >
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-sm font-medium rounded-xl pl-4 pr-10 py-2 outline-none cursor-pointer transition-colors"
            >
              <option value="plaintext">Plain Text</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="markdown">Markdown</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
          </div>

          <div className="relative group">
            <select
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="appearance-none bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-white/70 text-sm font-medium rounded-xl pl-4 pr-10 py-2 outline-none cursor-pointer transition-colors"
            >
              <option value="10m">Burn in 10m</option>
              <option value="1h">Burn in 1h</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim() || isAtLimit}
          className="flex items-center space-x-2 bg-white text-black px-6 py-2.5 rounded-xl font-medium text-sm hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          <span>{isAtLimit ? 'Limit Exceeded' : 'Publish'}</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
