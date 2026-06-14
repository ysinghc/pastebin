import { useState } from 'react';
import { createPaste } from '../api';
import { useApi } from '../hooks';
import Editor from '@monaco-editor/react';
import { Play, Copy, Check, Clock } from 'lucide-react';
import { ErrorAlert, RateLimitInfo } from './Alerts';

export function PasteCreator({ onPasteCreated }) {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState('10m');
  const [language, setLanguage] = useState('javascript');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const { loading, error, rateLimitInfo, execute, clearError } = useApi();

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('vercel-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#000000',
        'editor.lineHighlightBackground': '#0a0a0a',
        'editorLineNumber.foreground': '#3f3f46',
        'editor.selectionBackground': '#27272a',
        'editor.inactiveSelectionBackground': '#18181b',
      }
    });
  };

  const handleEditorChange = (value) => {
    setContent(value || '');
  };

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;

    try {
      const response = await execute(() => createPaste(content, ttl));
      
      setSuccessData({
        id: response.id,
        expires_in: response.expires_in
      });
      
      if (onPasteCreated) {
        onPasteCreated({ id: response.id, content, language });
      }

      setTimeout(() => setSuccessData(null), 10000);
    } catch (err) {
      // Error handled by hook
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  return (
    <div className="w-full">
      {/* Success Alert */}
      {successData && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">Paste created successfully</span>
            <span className="text-zinc-500 text-xs mt-0.5">Expires in: {successData.expires_in}</span>
          </div>
          <div className="flex items-center space-x-2 bg-black border border-zinc-800 rounded-lg p-1">
            <span className="font-mono text-xs text-zinc-300 px-3">{successData.id}</span>
            <button 
              onClick={() => copyToClipboard(successData.id)}
              className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-all"
              title="Copy ID"
            >
              {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Errors */}
      {(error || rateLimitInfo) && (
        <div className="mb-6 space-y-4">
          {error && <ErrorAlert error={error} onDismiss={clearError} onRetry={handleSubmit} />}
          {rateLimitInfo && <RateLimitInfo rateLimitInfo={rateLimitInfo} />}
        </div>
      )}

      {/* Editor Card */}
      <div className="bg-[#000000] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden focus-within:border-zinc-700 transition-colors duration-300">
        
        {/* Top Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-950">
          <div className="flex items-center space-x-3">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-zinc-300 text-sm font-medium outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="plaintext">Plain Text</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-zinc-500 hover:text-zinc-300 transition-colors">
              <Clock size={14} className="mr-1.5" />
              <select
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                className="bg-transparent text-sm outline-none cursor-pointer"
                disabled={loading}
              >
                <option value="10m">10 min</option>
                <option value="1h">1 hour</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="flex items-center bg-white hover:bg-zinc-200 text-black px-4 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin mr-2"></div>
              ) : (
                <Play size={14} className="mr-1.5" fill="currentColor" />
              )}
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="h-[500px] w-full relative group">
          <Editor
            height="100%"
            language={language}
            theme="vercel-dark"
            beforeMount={handleEditorWillMount}
            value={content}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Geist Mono', 'Fira Code', 'JetBrains Mono', monospace",
              wordWrap: 'on',
              lineNumbersMinChars: 3,
              padding: { top: 24, bottom: 24 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              formatOnPaste: true,
              renderLineHighlight: 'all',
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
