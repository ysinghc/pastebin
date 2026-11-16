import { Moon, Plus, Sun } from 'lucide-react';
import { useHealth, useTheme } from './hooks';
import { linkHandler, parsePath, usePathname } from './lib/router';
import { usePageSeo } from './lib/seo';
import { Composer } from './components/Composer';
import { MessagePage, PasteView } from './components/PasteView';
import { Notice } from './components/controls';

const HEALTH_LABEL = {
  checking: 'Checking the server',
  waking: 'Waking the server',
  ok: 'Server ready',
  degraded: 'Storage unreachable',
  offline: 'Server unreachable',
};

function HealthNotice({ status }) {
  if (status === 'waking') {
    return (
      <Notice tone="info" title="Waking the server.">
        It sleeps when idle, so the first request can take up to a minute.
      </Notice>
    );
  }
  if (status === 'degraded') {
    return (
      <Notice tone="warn" title="Storage is unreachable.">
        Publishing and opening pastes will fail until it is back. Checking again every 30 seconds.
      </Notice>
    );
  }
  if (status === 'offline') {
    return (
      <Notice tone="warn" title="The server is unreachable.">
        Check your connection. Checking again every 30 seconds.
      </Notice>
    );
  }
  return null;
}

export default function App() {
  const pathname = usePathname();
  const route = parsePath(pathname);
  const health = useHealth();
  const [theme, toggleTheme] = useTheme();
  usePageSeo(route.name);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="masthead">
        <a className="wordmark" href="/" onClick={linkHandler('/')} aria-label="Pastebin, new paste">
          <span className="wordmark__ticks" aria-hidden="true" />
          pastebin
        </a>
        <nav className="masthead__nav" aria-label="Site">
          {route.name !== 'new' && (
            <a className="button button--outline" href="/" onClick={linkHandler('/')}>
              <Plus size={16} aria-hidden="true" />
              <span>New paste</span>
            </a>
          )}
          <button
            type="button"
            className="button button--quiet button--icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </nav>
      </header>

      <main id="main" className="main" tabIndex={-1}>
        <HealthNotice status={health} />
        {route.name === 'new' && <Composer />}
        {route.name === 'view' && <PasteView key={route.id} id={route.id} routeLanguage={route.language} />}
        {route.name === 'unknown' && (
          <MessagePage
            title="Nothing at this address"
            actions={
              <a className="button button--primary" href="/" onClick={linkHandler('/')}>
                Write a new paste
              </a>
            }
          >
            Paste links look like <code className="inline-code">{window.location.host}/aB3x_9kLm2Q</code>. Check the
            link for missing or extra characters.
          </MessagePage>
        )}
      </main>

      <footer className="colophon">
        <p className="colophon__rules">
          Anyone with the link can read a paste. Each one holds up to 50 KB, and you can publish 20 an hour.
        </p>
        <p className={`status status--${health}`} role="status">
          <span className="status__dot" aria-hidden="true" />
          {HEALTH_LABEL[health]}
        </p>
        <p className="colophon__credit">
          Built by{' '}
          <a href="https://ysinghc.in" target="_blank" rel="noopener noreferrer">
            ysinghc.in
          </a>
        </p>
      </footer>
    </div>
  );
}
