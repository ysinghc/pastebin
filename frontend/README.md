# Pastebin frontend

The web app for [pastebin.ysinghc.in](https://pastebin.ysinghc.in): paste text or
code, publish it, share the link. Pastes are deleted after 10 minutes or 1 hour.

React 19 and Vite, with CodeMirror 6 for the editor. Deployed as static assets on
Cloudflare Workers.

## Run it

```bash
npm install
npm run dev
```

The app expects the API at `http://localhost:8080` in development. Point it
somewhere else with `VITE_API_BASE_URL` (see `.env.example`). Production builds
default to the hosted API, so no build variable is required.

The API only accepts browser requests from `https://pastebin.ysinghc.in` (see
`allow_origins` in `app/main.py`). To use the app from another origin, such as
`localhost` or a Workers preview URL, add that origin there.

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Dev server with hot reload                          |
| `npm run build`   | Production build into `dist/`                       |
| `npm run preview` | Build, then serve it with the Workers runtime       |
| `npm run deploy`  | Build, then `wrangler deploy`                       |
| `npm run lint`    | ESLint                                              |

## Deploying

The `pastebin` Worker is connected to this repository through Workers Builds:
pushes to `main` build and deploy production, and other branches upload a
preview version. `wrangler.jsonc` serves `dist/` with single-page-app fallback,
which is what makes paste links work as URLs.

## How it fits together

Two routes, handled in `src/lib/router.js`:

- `/` is the editor.
- `/<id>` opens a paste. An optional file extension (`/<id>.py`) carries the
  language, because the API stores only the text. Links without one are
  highlighted by detection.

```
src/
  api.js                 API client; every failure becomes an ApiError with a readable message
  hooks.js               clock tick, server health, theme
  index.css              design tokens (light and dark) and all styles
  lib/
    languages.js         language list, lazy CodeMirror loaders, detection
    router.js            routes, paste links
    storage.js           draft, your live pastes, theme (localStorage)
    receipts.js          hands a just-published paste to its page without refetching
    format.js            bytes, clocks, previews
    clipboard.js         copy and download
  components/
    Composer.jsx         the editor page
    PasteView.jsx        the paste page, plus missing/expired/error states
    Sidebar.jsx          open-by-ID form and the list of your live pastes
    CodeEditor.jsx       CodeMirror wrapper (loaded lazily)
    controls.jsx         copy button, segmented control, minute ruler, notices
```

`cloudflare-worker.js` is a separate scheduled Worker that pings the API so its
host does not go to sleep.

## Design notes

- Colors, type and radii are CSS custom properties at the top of
  `src/index.css`. The theme follows the system and can be overridden with the
  toggle in the header.
- Fonts (Archivo for the interface, Commit Mono for code) are bundled, so the
  page makes no third-party requests besides the API.
- The minute ruler under the countdown is drawn on a fixed one-hour scale: one
  tick per minute, taller every ten. It turns pink in the last two minutes.
