import { useState, useEffect } from 'react';
import { getPaste } from '../api';
import { useApi } from '../hooks';
import Editor from '@monaco-editor/react';
import { Search, Copy, Check, Clock } from 'lucide-react';
import { ErrorAlert, RateLimitInfo } from './Alerts';

export function PasteRetriever({ initialPasteId = '', activePaste = null }) {
  const [pasteId, setPasteId] = useState(initialPasteId);
  const [copied, setCopied] = useState(false);

  const { loading, error, data, rateLimitInfo, execute, clearError } = useApi();

  useEffect(() => {
    if (activePaste && activePaste.id) {
      setPasteId(activePaste.id);
      if (!data || data.id !== activePaste.id) {
        execute(() => getPaste(activePaste.id));
      }
    }
  }, [activePaste]);

  useEffect(() => {
    if (initialPasteId && (!data || data.id !== initialPasteId)) {
        setPasteId(initialPasteId);
        execute(() => getPaste(initialPasteId));
    }
  }, [initialPasteId]);

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

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!pasteId.trim() || loading) return;
    try {
      await execute(() => getPaste(pasteId));
    } catch (err) {}
  };

  const copyToClipboard = async (text) => {
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
    if (content.includes('def ') || content.includes('import ') && !content.includes(';')) return 'python';
    if (content.includes('<html>') || content.includes('<div')) return 'html';
    return 'plaintext';
  };

  const lang = data ? determineLanguage(data.content) : 'plaintext';

  return (
    <div className="w-full">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="mb-6 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className={`${loading ? 'text-white' : 'text-zinc-500 group-focus-within:text-white'} transition-colors`} />
        </div>
        <input
          type="text"
          value={pasteId}
          onChange={(e) => setPasteId(e.target.value)}
          disabled={loading}
          placeholder="Paste ID to retrieve..."
          className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all font-mono text-sm shadow-sm"
        />
        <button
          type="submit"
          disabled={loading || !pasteId.trim()}
          className="absolute inset-y-2 right-2 px-4 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Fetching...' : 'Retrieve'}
        </button>
      </form>

      {/* Alerts */}
      {(error || rateLimitInfo) && (
        <div className="mb-6 space-y-4">
          {error && <ErrorAlert error={error} onDismiss={clearError} onRetry={handleSubmit} />}
          {rateLimitInfo && <RateLimitInfo rateLimitInfo={rateLimitInfo} />}
        </div>
      )}

      {/* Editor Card */}
      {data ? (
        <div className="bg-[#000000] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Top Controls */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-950">
            <div className="flex items-center space-x-3">
              <span className="text-zinc-400 text-sm font-mono">{data.id}</span>
              <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 font-medium uppercase tracking-wider">
                {lang}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-zinc-500" title="Time remaining">
                <Clock size={14} className="mr-1.5" />
                <span className="text-sm">{formatTTL(data.ttl_remaining_seconds)}</span>
              </div>

              <button
                onClick={() => copyToClipboard(data.content)}
                className="flex items-center text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg text-sm transition-all active:scale-95"
              >
                {copied ? <Check size={14} className="mr-1.5 text-green-400" /> : <Copy size={14} className="mr-1.5" />}
                Copy
              </button>
            </div>
          </div>

          {/* Monaco Editor (Read Only) */}
          <div className="h-[500px] w-full relative">
            <Editor
              height="100%"
              language={lang}
              theme="vercel-dark"
              beforeMount={handleEditorWillMount}
              value={data.content}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Geist Mono', 'Fira Code', 'JetBrains Mono', monospace",
                wordWrap: 'on',
                lineNumbersMinChars: 3,
                padding: { top: 24, bottom: 24 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                renderLineHighlight: 'none',
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
      ) : (
        !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
            <Search size={32} className="mb-4 opacity-50" />
            <p className="text-sm">Enter a Paste ID above to fetch its contents</p>
          </div>
        )
      )}
    </div>
  );
}
