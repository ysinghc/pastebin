import { useEffect, useId, useMemo, useState } from 'react';
import { Download, Link as LinkIcon, SquarePen } from 'lucide-react';
import { getPaste } from '../api';
import { useNow } from '../hooks';
import { downloadText } from '../lib/clipboard';
import { byteLength, countLines, formatBytes, formatTimeOfDay } from '../lib/format';
import { LANGUAGES, detectLanguage, getLanguage } from '../lib/languages';
import { markReceiptSeen, peekReceipt } from '../lib/receipts';
import { linkHandler, navigate, pastePath, pasteUrl } from '../lib/router';
import { loadDraft, removeRecent, saveDraft, useRecent } from '../lib/storage';
import { CodeEditor } from './LazyCodeEditor';
import { Clock, CopyButton, MinuteRuler, Notice } from './controls';

function SharePanel({ url, receipt }) {
  const title = !receipt?.fresh
    ? 'You published this paste.'
    : receipt.copied
      ? 'Published. The link is on your clipboard.'
      : 'Published. Copy the link to share it.';

  return (
    <section className="share" aria-label="Share this paste">
      <p className="share__title" role="status">
        {title}
      </p>
      <div className="share__row">
        <input
          className="input share__url"
          type="text"
          readOnly
          value={url}
          aria-label="Link to this paste"
          onFocus={(event) => event.target.select()}
        />
        <CopyButton variant="primary" icon={LinkIcon} label="Copy link" copiedLabel="Link copied" text={url} />
      </div>
    </section>
  );
}

export function MessagePage({ title, children, actions }) {
  return (
    <div className="page page--message">
      <h1 className="message__title">{title}</h1>
      <p className="message__text">{children}</p>
      <div className="message__actions">{actions}</div>
    </div>
  );
}

function NewPasteLink() {
  return (
    <a className="button button--primary" href="/" onClick={linkHandler('/')}>
      Write a new paste
    </a>
  );
}

export function PasteView({ id, routeLanguage }) {
  const [receipt] = useState(() => peekReceipt(id));
  const [state, setState] = useState(() =>
    receipt
      ? { status: 'ready', content: receipt.content, expiresAt: receipt.expiresAt, loadedAt: Date.now() }
      : { status: 'loading', slow: false },
  );
  const [attempt, setAttempt] = useState(0);
  const [wrap, setWrap] = useState(true);
  const languageSelectId = useId();
  const recent = useRecent();

  useEffect(() => () => markReceiptSeen(id), [id]);

  useEffect(() => {
    if (receipt && attempt === 0) return undefined;
    let cancelled = false;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setState((current) => (current.status === 'loading' ? { ...current, slow: true } : current));
    }, 4000);

    getPaste(id)
      .then((data) => {
        if (cancelled) return;
        const ttl = data.ttl_remaining_seconds;
        setState({
          status: 'ready',
          content: data.content,
          expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : null,
          loadedAt: Date.now(),
        });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.kind === 'not_found') removeRecent(id);
        setState({ status: 'error', error });
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [id, attempt, receipt]);

  const content = state.status === 'ready' ? state.content : '';
  const detected = useMemo(() => detectLanguage(content), [content]);
  const language = routeLanguage ?? detected;
  const stats = useMemo(() => ({ bytes: byteLength(content), lines: countLines(content) }), [content]);

  const ticking = state.status === 'ready' && state.expiresAt !== null;
  // The clock ticks from mount, so `now` can be up to a second older than the
  // moment the paste arrived; never count from before that moment.
  const now = useNow(state.status !== 'error');
  const secondsLeft = ticking ? (state.expiresAt - Math.max(now, state.loadedAt)) / 1000 : null;
  const expired = secondsLeft !== null && secondsLeft <= 0;

  useEffect(() => {
    if (state.status === 'ready') document.title = `Paste ${id} (${getLanguage(language).label}) | Pastebin`;
    else if (state.status === 'error') document.title = 'Paste unavailable | Pastebin';
    else document.title = 'Opening paste | Pastebin';
  }, [state.status, id, language]);

  if (state.status === 'loading') {
    return (
      <div className="page page--view" aria-busy="true">
        <div className="viewhead">
          <div>
            <h1 className="countdown countdown--pending">Opening paste</h1>
            <p className="viewhead__sub" role="status">
              {state.slow
                ? 'Still working. The server sleeps when idle and can take up to a minute to wake.'
                : `Fetching ${id}.`}
            </p>
          </div>
        </div>
        <div className="sheet sheet--skeleton" aria-hidden="true">
          <span style={{ width: '42%' }} />
          <span style={{ width: '68%' }} />
          <span style={{ width: '55%' }} />
          <span style={{ width: '30%' }} />
          <span style={{ width: '61%' }} />
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    const retry = () => {
      setState({ status: 'loading', slow: false });
      setAttempt((value) => value + 1);
    };
    if (state.error.kind === 'not_found') {
      return (
        <MessagePage title="This paste is gone" actions={<NewPasteLink />}>
          Nothing is stored under <code className="inline-code">{id}</code>. Pastes are deleted 10 minutes or 1 hour
          after they are published, so it has most likely expired. If the link was typed by hand, check it for typos.
        </MessagePage>
      );
    }
    return (
      <MessagePage
        title="Could not open this paste"
        actions={
          <>
            <button type="button" className="button button--primary" onClick={retry}>
              Try again
            </button>
            <a className="button button--outline" href="/" onClick={linkHandler('/')}>
              Write a new paste
            </a>
          </>
        }
      >
        {state.error.message}
      </MessagePage>
    );
  }

  const mine = recent.some((entry) => entry.id === id) || Boolean(receipt);
  const url = pasteUrl(id, language);
  const showShare = mine && !expired;

  const editAsNew = () => {
    const existing = loadDraft();
    if (
      existing?.content.trim() &&
      existing.content !== content &&
      !window.confirm('You have an unpublished draft. Replace it with a copy of this paste?')
    ) {
      return;
    }
    saveDraft({ content, language, ttl: existing?.ttl ?? '10m' });
    navigate('/');
  };

  const changeLanguage = (event) => {
    navigate(pastePath(id, event.target.value), { replace: true });
  };

  return (
    <div className="page page--view">
      {showShare && <SharePanel url={url} receipt={receipt} />}

      <header className="viewhead">
        <div className="viewhead__time">
          {secondsLeft === null ? (
            <h1 className="countdown">Paste {id}</h1>
          ) : expired ? (
            <h1 className="countdown is-expired">Expired</h1>
          ) : (
            <h1 className={`countdown${secondsLeft <= 120 ? ' is-low' : ''}`}>
              Expires in <Clock secondsLeft={secondsLeft} />
            </h1>
          )}
          {secondsLeft !== null && (
            <p className="viewhead__sub">
              {expired
                ? 'The link no longer works. The text stays on this page until you leave it.'
                : `Deleted from the server at ${formatTimeOfDay(state.expiresAt)}.`}
            </p>
          )}
        </div>

        <div className="toolbar" role="group" aria-label="Paste actions">
          <CopyButton variant={showShare ? 'outline' : 'primary'} label="Copy text" text={content} />
          {!showShare && !expired && (
            <CopyButton variant="outline" icon={LinkIcon} label="Copy link" copiedLabel="Link copied" text={url} />
          )}
          <button
            type="button"
            className="button button--outline"
            onClick={() => downloadText(`paste-${id}.${getLanguage(language).ext}`, content)}
          >
            <Download size={16} aria-hidden="true" />
            <span>Download</span>
          </button>
          <button type="button" className="button button--outline" onClick={editAsNew}>
            <SquarePen size={16} aria-hidden="true" />
            <span>Edit as new</span>
          </button>
        </div>
      </header>

      {secondsLeft !== null && <MinuteRuler secondsLeft={secondsLeft} />}

      {expired && (
        <Notice
          tone="warn"
          action={
            <button type="button" className="button button--primary" onClick={editAsNew}>
              Edit as new
            </button>
          }
        >
          To keep sharing this text, publish a fresh copy of it.
        </Notice>
      )}

      <section className="sheet sheet--view" aria-label="Paste content">
        <div className="sheet__bar">
          <dl className="facts">
            <div>
              <dt>ID</dt>
              <dd className="facts__id">{id}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(stats.bytes)}</dd>
            </div>
            <div>
              <dt>Lines</dt>
              <dd>{stats.lines}</dd>
            </div>
          </dl>
          <div className="sheet__options">
            <label className="field field--inline" htmlFor={languageSelectId}>
              <span className="field-label">Language</span>
              <select id={languageSelectId} className="select" value={language} onChange={changeLanguage}>
                {LANGUAGES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={wrap} onChange={(event) => setWrap(event.target.checked)} />
              <span>Wrap lines</span>
            </label>
          </div>
        </div>
        <CodeEditor value={content} language={language} wrap={wrap} readOnly ariaLabel="Paste content" />
      </section>
    </div>
  );
}
