/**
 * Languages the editor can highlight.
 *
 * The API stores only the text, so the language travels in the share link as a
 * file extension (`/aB3x_9kLm2Q.py`). Links without one fall back to detection.
 */

export const LANGUAGES = [
  { id: 'plaintext', label: 'Plain text', ext: 'txt', load: null },
  {
    id: 'javascript',
    label: 'JavaScript',
    ext: 'js',
    load: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    ext: 'ts',
    load: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true, typescript: true })),
  },
  { id: 'python', label: 'Python', ext: 'py', load: () => import('@codemirror/lang-python').then((m) => m.python()) },
  { id: 'json', label: 'JSON', ext: 'json', load: () => import('@codemirror/lang-json').then((m) => m.json()) },
  { id: 'html', label: 'HTML', ext: 'html', load: () => import('@codemirror/lang-html').then((m) => m.html()) },
  { id: 'css', label: 'CSS', ext: 'css', load: () => import('@codemirror/lang-css').then((m) => m.css()) },
  {
    id: 'markdown',
    label: 'Markdown',
    ext: 'md',
    load: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  },
  { id: 'sql', label: 'SQL', ext: 'sql', load: () => import('@codemirror/lang-sql').then((m) => m.sql()) },
  { id: 'yaml', label: 'YAML', ext: 'yaml', load: () => import('@codemirror/lang-yaml').then((m) => m.yaml()) },
  {
    id: 'shell',
    label: 'Shell',
    ext: 'sh',
    load: () =>
      Promise.all([import('@codemirror/language'), import('@codemirror/legacy-modes/mode/shell')]).then(
        ([language, mode]) => language.StreamLanguage.define(mode.shell),
      ),
  },
  { id: 'go', label: 'Go', ext: 'go', load: () => import('@codemirror/lang-go').then((m) => m.go()) },
  { id: 'rust', label: 'Rust', ext: 'rs', load: () => import('@codemirror/lang-rust').then((m) => m.rust()) },
  { id: 'java', label: 'Java', ext: 'java', load: () => import('@codemirror/lang-java').then((m) => m.java()) },
  { id: 'cpp', label: 'C / C++', ext: 'cpp', load: () => import('@codemirror/lang-cpp').then((m) => m.cpp()) },
];

const BY_ID = new Map(LANGUAGES.map((language) => [language.id, language]));

const EXTENSION_ALIASES = {
  txt: 'plaintext', text: 'plaintext', log: 'plaintext',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python',
  json: 'json',
  html: 'html', htm: 'html', xml: 'html', svg: 'html',
  css: 'css',
  md: 'markdown', markdown: 'markdown',
  sql: 'sql',
  yaml: 'yaml', yml: 'yaml',
  sh: 'shell', bash: 'shell', zsh: 'shell',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'cpp', h: 'cpp', cc: 'cpp', cpp: 'cpp', hpp: 'cpp',
};

export function getLanguage(id) {
  return BY_ID.get(id) ?? BY_ID.get('plaintext');
}

/** Language id for a file extension, or null when the extension is unknown. */
export function languageFromExtension(ext) {
  if (!ext) return null;
  return EXTENSION_ALIASES[ext.toLowerCase()] ?? null;
}

const languageCache = new Map();

/** Resolves with a CodeMirror extension for the language ([] for plain text). */
export function loadLanguageSupport(id) {
  const language = getLanguage(id);
  if (!language.load) return Promise.resolve([]);
  if (!languageCache.has(language.id)) {
    languageCache.set(
      language.id,
      language.load().catch((error) => {
        languageCache.delete(language.id);
        throw error;
      }),
    );
  }
  return languageCache.get(language.id);
}

function count(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Best guess at the language of a snippet. Cheap line-pattern scoring; returns
 * 'plaintext' unless something scores clearly.
 */
export function detectLanguage(text) {
  const sample = text.slice(0, 6000);
  const trimmed = sample.trim();
  if (!trimmed) return 'plaintext';

  if (/^[[{]/.test(trimmed) && text.length < 200_000) {
    try {
      JSON.parse(text);
      return 'json';
    } catch {
      // Not JSON; keep looking.
    }
  }

  const shebang = trimmed.match(/^#!.*?\b(python|node|deno|bun|bash|zsh|sh)\d*\b/);
  if (shebang) {
    if (shebang[1] === 'python') return 'python';
    if (['node', 'deno', 'bun'].includes(shebang[1])) return 'javascript';
    return 'shell';
  }

  if (/^\s*<!doctype html|<html[\s>]|<\/(div|span|p|body|head|script|section|ul|a)>/i.test(sample)) return 'html';

  const scores = {
    python:
      count(sample, /^\s*(def|class)\s+\w+.*:\s*$/gm) * 3 +
      count(sample, /^\s*(from\s+[\w.]+\s+import|import\s+[\w.]+\s*$)/gm) * 2 +
      count(sample, /^\s*(elif\b.*:|except\b.*:|if __name__)/gm) * 3 +
      count(sample, /\bself\.\w+|\bprint\(|\bNone\b|\bTrue\b|\bFalse\b/g),
    javascript:
      count(sample, /\b(const|let|var)\s+[\w${[]/g) * 2 +
      count(sample, /=>|\bfunction\b|\bconsole\.\w+\(|\brequire\(|\bawait\b/g) +
      count(sample, /^\s*(import\s.+\sfrom\s+['"]|export\s+(default|const|function|class)\b)/gm) * 3,
    typescript:
      count(sample, /^\s*(export\s+)?(interface|type|enum)\s+\w+/gm) * 4 +
      count(sample, /:\s*(string|number|boolean|unknown|void|never)\b|\bas\s+const\b|\breadonly\s/g) * 2,
    go:
      count(sample, /^package\s+\w+\s*$/gm) * 6 +
      count(sample, /^func\s+(\(\w+\s+\*?\w+\)\s+)?\w+\(/gm) * 3 +
      count(sample, /:=|\bfmt\.\w+\(|\berr\s*!=\s*nil\b/g) * 2,
    rust:
      count(sample, /^\s*(pub\s+)?(fn|impl|struct|enum|trait|mod)\s+\w+/gm) * 3 +
      count(sample, /\blet\s+mut\b|\bprintln!\(|\buse\s+(std|crate)::|->\s*(Self|Result|Option)\b|&mut\s/g) * 3,
    java:
      count(sample, /\b(public|private|protected)\s+(static\s+)?(final\s+)?(class|void|int|String|boolean)\b/g) * 3 +
      count(sample, /\bSystem\.out\.\w+\(|^import\s+java\.|@Override\b/gm) * 4,
    cpp:
      count(sample, /^\s*#\s*(include|define|ifndef|pragma)\b/gm) * 4 +
      count(sample, /\bstd::\w+|\bint\s+main\s*\(|\bprintf\(|\bnullptr\b|->\w+/g) * 2,
    sql:
      count(sample, /^\s*(select|insert\s+into|update|delete\s+from|create\s+(table|index|view)|alter\s+table|with)\b/gim) * 3 +
      count(sample, /\b(from|where|group\s+by|order\s+by|left\s+join|inner\s+join|values)\b/gi),
    css:
      count(sample, /^[^{}\n]*\{\s*$/gm) +
      count(sample, /^\s*[a-z-]+\s*:\s*[^;{}\n]+;\s*$/gm) * 2 +
      count(sample, /^\s*@(media|import|font-face|keyframes|layer)\b/gm) * 3,
    yaml:
      count(sample, /^---\s*$/gm) * 3 +
      count(sample, /^\s*[\w.-]+:\s*([^\s{[].*)?$/gm) +
      count(sample, /^\s*-\s+[\w.-]+:\s/gm) * 2,
    markdown:
      count(sample, /^#{1,6}\s+\S/gm) * 3 +
      count(sample, /^```/gm) * 3 +
      count(sample, /\[[^\]\n]+\]\([^)\n]+\)|\*\*[^*\n]+\*\*/g) * 2 +
      count(sample, /^\s*[-*]\s+\S/gm),
    shell:
      count(sample, /^\s*(\$\s+)?(sudo|apt|apt-get|brew|npm|npx|pnpm|yarn|pip|git|cd|curl|wget|echo|export|chmod|mkdir|docker|kubectl|ssh)\s/gm) * 2 +
      count(sample, /^\s*(if\s+\[|fi\s*$|done\s*$|esac\s*$)/gm) * 3 +
      count(sample, /\$\{?\w+\}?|\s\|\s|&&\s/g),
  };

  // Code full of `key: value;` lines looks like CSS, and code full of `key:`
  // looks like YAML. Only trust those when nothing code-like scored.
  const codeLike = Math.max(scores.python, scores.javascript, scores.go, scores.rust, scores.java, scores.cpp);
  if (codeLike >= 4) {
    scores.css = 0;
    scores.yaml = 0;
    scores.shell = Math.min(scores.shell, 3);
  }
  if (scores.typescript >= 4 && scores.javascript >= 2) scores.typescript += scores.javascript;
  else if (scores.typescript < 8) scores.typescript = 0;

  let best = 'plaintext';
  let bestScore = 3;
  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}
