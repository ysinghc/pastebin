import { useEffect, useId, useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { useNow } from '../hooks';
import { formatBytes } from '../lib/format';
import { getLanguage } from '../lib/languages';
import { linkHandler, navigate, parsePasteReference, pastePath, pasteUrl } from '../lib/router';
import { pruneRecent, useRecent } from '../lib/storage';
import { Clock, CopyButton, MinuteRuler } from './controls';

function OpenForm() {
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const inputId = useId();
  const errorId = useId();

  const onSubmit = (event) => {
    event.preventDefault();
    const reference = parsePasteReference(value);
    if (!reference) {
      setInvalid(true);
      return;
    }
    navigate(pastePath(reference.id, reference.language));
  };

  return (
    <form className="open" onSubmit={onSubmit} noValidate>
      <label className="rail__heading" htmlFor={inputId}>
        Open a paste
      </label>
      <div className="open__row">
        <input
          id={inputId}
          className="input"
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
          placeholder="ID or link"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
        />
        <button type="submit" className="button button--outline">
          Open
        </button>
      </div>
      {invalid && (
        <p id={errorId} className="field-error" role="alert">
          {value.trim()
            ? 'That is not a paste ID or link. IDs look like aB3x_9kLm2Q.'
            : 'Enter a paste ID or link first.'}
        </p>
      )}
    </form>
  );
}

function RecentList() {
  const recent = useRecent();
  const now = useNow(recent.length > 0);

  useEffect(() => {
    if (recent.some((entry) => entry.expiresAt <= now)) pruneRecent();
  }, [recent, now]);

  const alive = recent.filter((entry) => entry.expiresAt > now);

  return (
    <section className="recent" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="rail__heading">
        Your live pastes
      </h2>
      {alive.length === 0 ? (
        <p className="rail__empty">Pastes you publish from this browser are listed here until they expire.</p>
      ) : (
        <ul className="recent__list">
          {alive.map((entry) => {
            const path = pastePath(entry.id, entry.language);
            const secondsLeft = (entry.expiresAt - now) / 1000;
            return (
              <li key={entry.id} className="slip">
                <a className="slip__link" href={path} onClick={linkHandler(path)}>
                  <span className="slip__preview">{entry.preview || entry.id}</span>
                  <span className="slip__meta">
                    {getLanguage(entry.language).label}, {formatBytes(entry.bytes)}
                  </span>
                </a>
                <div className="slip__side">
                  <Clock secondsLeft={secondsLeft} />
                  <CopyButton
                    iconOnly
                    icon={LinkIcon}
                    label="Copy link"
                    copiedLabel="Link copied"
                    text={() => pasteUrl(entry.id, entry.language)}
                  />
                </div>
                <MinuteRuler secondsLeft={secondsLeft} compact />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function Sidebar() {
  return (
    <aside className="rail" aria-label="Open and recent pastes">
      <OpenForm />
      <RecentList />
    </aside>
  );
}
