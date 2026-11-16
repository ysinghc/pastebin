import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/commit-mono/400.css';
import '@fontsource/commit-mono/400-italic.css';
import '@fontsource/commit-mono/700.css';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
