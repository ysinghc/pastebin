import { useEffect, useMemo, useState } from 'react';
import { MAX_PASTE_BYTES, createPaste } from '../api';
import { copyText } from '../lib/clipboard';
import { byteLength, formatBytes, previewLine } from '../lib/format';
import { LANGUAGES, detectLanguage, getLanguage, languageFromExtension } from '../lib/languages';
import { putReceipt } from '../lib/receipts';
import { navigate, pastePath, pasteUrl } from '../lib/router';
import { addRecent, loadDraft, saveDraft } from '../lib/storage';
import { CodeEditor } from './LazyCodeEditor';
import { Notice, Segmented } from './controls';
import { Sidebar } from './Sidebar';

const TTL_OPTIONS = [
  { value: '10m', label: '10 minutes', seconds: 600 },
  { value: '1h', label: '1 hour', seconds: 3600 },
];

const IS_APPLE = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');
const SHORTCUT = IS_APPLE ? '⌘ Return' : 'Ctrl Enter';
// Focusing the editor on a touch screen would throw the keyboard up on arrival.
const FOCUS_ON_ARRIVAL = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

export function Composer() {
  const [draft] = useState(loadDraft);
  const [content, setContent] = useState(draft?.content ?? '');
  const [languageChoice, setLanguageChoice] = useState(draft?.language ?? 'auto');
  const [ttl, setTtl] = useState(draft?.ttl ?? '10m');
  const [detected, setDetected] = useState(() => detectLanguage(draft?.content ?? ''));
  const [publishing, setPublishing] = useState(false);
  const [problem, setProblem] = useState(null);

  const bytes = useMemo(() => byteLength(content), [content]);
  const overBy = bytes - MAX_PASTE_BYTES;
  const language = languageChoice === 'auto' ? detected : languageChoice;

  // Detection and draft saving both wait for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDetected(detectLanguage(content));
      saveDraft({ content, language: languageChoice, ttl });
    }, 300);
    return () => clearTimeout(timer);
  }, [content, languageChoice, ttl]);

  const onEdit = (next) => {
    setContent(next);
    if (problem) setProblem(null);
  };

  const onFileDrop = (file) => {
    const fromName = languageFromExtension(file.name.split('.').pop());
    if (fromName) setLanguageChoice(fromName);
  };

  const publish = async () => {
    if (publishing) return;
    if (!content.trim()) {
      setProblem({ message: 'There is nothing to publish yet. Type or paste some text first.' });
      return;
    }
    if (overBy > 0) {
      setProblem({
        message: `This paste is ${formatBytes(overBy)} over the 50 KB limit. Shorten it and publish again.`,
      });
      return;
    }

    setPublishing(true);
    setProblem(null);
    try {
      const result = await createPaste(content, ttl);
      const seconds = TTL_OPTIONS.find((option) => option.value === ttl).seconds;
      const expiresAt = Date.now() + seconds * 1000;
      const copied = await copyText(pasteUrl(result.id, language));

      addRecent({ id: result.id, language, expiresAt, bytes, preview: previewLine(content) });
      putReceipt(result.id, { content, expiresAt, copied, fresh: true });
      saveDraft(null);
      navigate(pastePath(result.id, language));
    } catch (error) {
      setProblem({ message: error.message, retry: error.kind !== 'too_large' && error.kind !== 'invalid' });
      setPublishing(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    publish();
  };

  return (
    <div className="page page--compose">
      <div className="compose">
        <header className="intro">
          <h1 className="intro__title">Text that deletes itself</h1>
          <p className="intro__lede">
            Paste text or code, publish it, and share the link. The paste is deleted after 10 minutes or 1 hour.
          </p>
        </header>

        <section className="sheet sheet--compose" aria-label="New paste">
          <CodeEditor
            value={content}
            onChange={onEdit}
            onSubmit={publish}
            onFileDrop={onFileDrop}
            language={language}
            placeholder="Paste or type here, or drop a text file."
            ariaLabel="Paste content"
            describedBy="editor-help"
            autoFocus={FOCUS_ON_ARRIVAL}
          />
          <p id="editor-help" className="visually-hidden">
            Tab indents. Press Escape, then Tab, to leave the editor. Press {SHORTCUT} to publish.
          </p>

          <form className="actionbar" onSubmit={onSubmit}>
            {problem && (
              <div className="actionbar__problem">
                <Notice tone="error">{problem.message}</Notice>
              </div>
            )}

            <label className="field">
              <span className="field-label">Language</span>
              <select
                className="select"
                value={languageChoice}
                onChange={(event) => setLanguageChoice(event.target.value)}
              >
                <option value="auto">Detect ({getLanguage(detected).label})</option>
                {LANGUAGES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Segmented legend="Delete after" name="ttl" value={ttl} onChange={setTtl} options={TTL_OPTIONS} />

            <div className="actionbar__end">
              <p className={`size${overBy > 0 ? ' is-over' : ''}`} aria-live="polite">
                {overBy > 0
                  ? `${formatBytes(overBy)} over the 50 KB limit`
                  : `${formatBytes(bytes)} of 50 KB`}
              </p>
              {content && !publishing && (
                <button type="button" className="button button--quiet" onClick={() => onEdit('')}>
                  Clear
                </button>
              )}
              <button type="submit" className="button button--primary button--publish" disabled={publishing}>
                <span>{publishing ? 'Publishing…' : 'Publish'}</span>
                {!publishing && (
                  <kbd className="kbd" aria-hidden="true">
                    {SHORTCUT}
                  </kbd>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>

      <Sidebar />
    </div>
  );
}
