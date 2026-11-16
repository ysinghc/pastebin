import { Suspense, lazy } from 'react';

// CodeMirror is most of the JavaScript on the page. Loading it separately lets
// the page frame paint first.
const Editor = lazy(() => import('./CodeEditor').then((module) => ({ default: module.CodeEditor })));

export function CodeEditor(props) {
  return (
    <Suspense fallback={<div className="editor editor--loading" aria-hidden="true" />}>
      <Editor {...props} />
    </Suspense>
  );
}
