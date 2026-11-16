import { useEffect, useRef } from 'react';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { tags as t } from '@lezer/highlight';
import { loadLanguageSupport } from '../lib/languages';

// Colors come from CSS custom properties, so light and dark themes switch
// without touching the editor.
const highlightStyle = HighlightStyle.define([
  {
    tag: [t.keyword, t.modifier, t.operatorKeyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.self],
    color: 'var(--syn-keyword)',
  },
  { tag: [t.string, t.special(t.string), t.regexp, t.character, t.attributeValue], color: 'var(--syn-string)' },
  { tag: [t.number, t.bool, t.null, t.atom, t.escape, t.unit], color: 'var(--syn-constant)' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.meta, t.processingInstruction, t.documentMeta], color: 'var(--syn-comment)' },
  { tag: [t.typeName, t.className, t.namespace, t.tagName, t.macroName], color: 'var(--syn-type)' },
  { tag: [t.propertyName, t.attributeName, t.labelName], color: 'var(--syn-property)' },
  { tag: t.heading, fontWeight: '700' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: [t.link, t.url], color: 'var(--syn-string)', textDecoration: 'underline' },
  { tag: t.invalid, color: 'var(--stripe)' },
]);

const baseTheme = EditorView.theme({
  '&': { color: 'var(--ink)', backgroundColor: 'transparent', fontSize: 'var(--code-size)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-code)', lineHeight: '1.6' },
  '.cm-content': { padding: '20px 0', caretColor: 'var(--ink)' },
  '.cm-line': { padding: '0 20px 0 12px' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--ink-3)',
    border: 'none',
    borderRight: '1px solid var(--rule)',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 12px 0 16px', minWidth: '2.5em' },
  '.cm-activeLine': { backgroundColor: 'var(--paper-2)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--paper-2)', color: 'var(--ink)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--ink)', borderLeftWidth: '2px' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'var(--blue-wash)' },
  '.cm-selectionMatch': { backgroundColor: 'var(--blue-wash)' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'transparent',
    outline: '1px solid var(--rule-strong)',
  },
  '.cm-placeholder': { color: 'var(--ink-3)' },
  '.cm-panels': { backgroundColor: 'var(--paper-2)', color: 'var(--ink)', borderColor: 'var(--rule)' },
  '.cm-panels input, .cm-panels button': { fontFamily: 'var(--font-ui)', fontSize: '13px' },
  '.cm-searchMatch': { backgroundColor: 'var(--stripe-wash)' },
});

/**
 * CodeMirror wrapper. `value` is controlled: edits are reported through
 * `onChange`, and a `value` that differs from the document replaces it.
 */
export function CodeEditor({
  value,
  onChange,
  onSubmit,
  onFileDrop,
  language = 'plaintext',
  readOnly = false,
  wrap = true,
  placeholder = '',
  ariaLabel,
  describedBy,
  autoFocus = false,
}) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const compartments = useRef({ language: new Compartment(), wrap: new Compartment() });
  const callbacks = useRef({ onChange, onSubmit, onFileDrop });

  useEffect(() => {
    callbacks.current = { onChange, onSubmit, onFileDrop };
  });

  useEffect(() => {
    const { language: languageCompartment, wrap: wrapCompartment } = compartments.current;

    const contentAttributes = { 'aria-label': ariaLabel ?? 'Code editor' };
    if (describedBy) contentAttributes['aria-describedby'] = describedBy;
    if (readOnly) contentAttributes.tabindex = '0';

    const extensions = [
      lineNumbers(),
      drawSelection(),
      bracketMatching(),
      highlightSelectionMatches(),
      syntaxHighlighting(highlightStyle),
      baseTheme,
      EditorView.contentAttributes.of(contentAttributes),
      languageCompartment.of([]),
      wrapCompartment.of(wrap ? EditorView.lineWrapping : []),
      keymap.of(searchKeymap),
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
    } else {
      extensions.push(
        history(),
        indentOnInput(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        placeholderExtension(placeholder),
        Prec.highest(
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                callbacks.current.onSubmit?.();
                return true;
              },
            },
          ]),
        ),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) callbacks.current.onChange?.(update.state.doc.toString());
        }),
        EditorView.domEventHandlers({
          drop(event) {
            const file = event.dataTransfer?.files?.[0];
            if (file) callbacks.current.onFileDrop?.(file);
            return false; // CodeMirror still inserts the file's text itself.
          },
        }),
      );
    }

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({ doc: value, extensions }),
    });
    viewRef.current = view;
    if (autoFocus) view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once; later prop changes are applied by the
    // effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    loadLanguageSupport(language)
      .then((support) => {
        if (cancelled || !viewRef.current) return;
        viewRef.current.dispatch({ effects: compartments.current.language.reconfigure(support) });
      })
      .catch(() => {
        // Highlighting is optional; the text stays readable without it.
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: compartments.current.wrap.reconfigure(wrap ? EditorView.lineWrapping : []),
    });
  }, [wrap]);

  return <div ref={hostRef} className="editor" />;
}
