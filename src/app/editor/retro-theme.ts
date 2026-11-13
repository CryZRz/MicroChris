import { editor } from 'monaco-editor';

export function registerRetroTheme(): void {
  editor.defineTheme('microchris-retro', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '9DA9BD' },
      { token: 'keyword', foreground: 'F4CA6A' },
      { token: 'variable', foreground: 'F4E6C5' },
      { token: 'number', foreground: 'EF99AB' },
      { token: 'string', foreground: '8CCFBD' },
    ],
    colors: {
      'editor.background': '#172033',
      'editor.foreground': '#F4E6C5',
      'editorLineNumber.foreground': '#9DA9BD',
      'editorLineNumber.activeForeground': '#F4CA6A',
      'editor.lineHighlightBackground': '#202C44',
      'editor.selectionBackground': '#4C5C76',
      'editorCursor.foreground': '#8CCFBD',
      'editorIndentGuide.background1': '#35425B',
    },
  });
}
