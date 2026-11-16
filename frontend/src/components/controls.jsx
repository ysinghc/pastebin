import { Check, Copy } from 'lucide-react';
import { copyText } from '../lib/clipboard';
import { useFlash } from '../hooks';
import { formatClock, formatDurationWords } from '../lib/format';

/**
 * Copies `text` (a string, or a function returning one) and confirms in place.
 * The confirmation is also announced to screen readers.
 */
export function CopyButton({ text, label, copiedLabel = 'Copied', variant = 'quiet', icon = Copy, iconOnly = false }) {
  const Icon = icon;
  const [copied, flash] = useFlash();
  const [failed, flashFailed] = useFlash(3000);

  const onClick = async () => {
    const ok = await copyText(typeof text === 'function' ? text() : text);
    if (ok) flash();
    else flashFailed();
  };

  const shown = failed ? 'Copy failed' : copied ? copiedLabel : label;

  return (
    <button
      type="button"
      className={`button button--${variant}${iconOnly ? ' button--icon' : ''}`}
      onClick={onClick}
      aria-label={iconOnly ? shown : undefined}
      title={iconOnly ? label : undefined}
    >
      {copied ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
      {!iconOnly && <span>{shown}</span>}
      <span className="visually-hidden" role="status">
        {copied ? copiedLabel : failed ? 'Copy failed' : ''}
      </span>
    </button>
  );
}

/** A small set of mutually exclusive options, as native radios. */
export function Segmented({ legend, name, value, onChange, options }) {
  return (
    <fieldset className="segmented">
      <legend className="field-label">{legend}</legend>
      <div className="segmented__track">
        {options.map((option) => (
          <label key={option.value} className="segmented__option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const SCALE_SECONDS = 60 * 60;
const LOW_SECONDS = 120;

/**
 * Time left, drawn on a one-hour ruler: one tick per minute, taller every ten.
 * Ticks to the right of the remaining time are spent.
 */
export function MinuteRuler({ secondsLeft, compact = false }) {
  const fraction = Math.min(1, Math.max(0, secondsLeft / SCALE_SECONDS));
  const low = secondsLeft <= LOW_SECONDS;
  return (
    <div
      className={`ruler${compact ? ' ruler--compact' : ''}${low ? ' is-low' : ''}`}
      style={{ '--left': fraction }}
      aria-hidden="true"
    />
  );
}

/** Ticking clock with a spoken-friendly label. */
export function Clock({ secondsLeft, className = '' }) {
  return (
    <span className={`clock ${className}`} title={`${formatDurationWords(secondsLeft)} left`}>
      {formatClock(secondsLeft)}
    </span>
  );
}

export function Notice({ tone = 'info', title, children, action }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="notice__body">
        {title && <strong className="notice__title">{title}</strong>}
        {children && <span>{children}</span>}
      </div>
      {action}
    </div>
  );
}
