import {
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  effect,
  viewChild,
  DestroyRef,
  inject,
} from '@angular/core';
import * as monaco from 'monaco-editor';
import { registerRetroTheme } from './retro-theme';
(globalThis as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
  getWorker: () => new Worker(new URL('./editor.worker', import.meta.url), { type: 'module' }),
};
@Component({
  selector: 'app-editor',
  template: '<div #host class="editor-host" aria-label="Editor de ensamblador"></div>',
  styles: '.editor-host {height:100%;width:100%}',
})
export class Editor {
  line = input(1);
  text = input('');
  path = input('main.asm');
  changed = output<string>();
  private host = viewChild.required<ElementRef<HTMLElement>>('host');
  private editor?: monaco.editor.IStandaloneCodeEditor;
  private syncing = false;
  constructor() {
    effect(() => {
      const text = this.text();
      this.path();
      if (this.editor && this.editor.getValue() !== text) {
        this.syncing = true;
        this.editor.setValue(text);
        this.syncing = false;
      }
    });
    effect(() => {
      const line = this.line();
      if (this.editor) {
        this.editor.setPosition({ lineNumber: line, column: 1 });
        this.editor.revealLineInCenter(line);
      }
    });
    afterNextRender(() => {
      monaco.languages.register({ id: 'avrasm' });
      monaco.languages.setMonarchTokensProvider('avrasm', {
        tokenizer: {
          root: [
            [/;.*/, 'comment'],
            [/\.[\w]+/, 'keyword'],
            [
              /\b(?:ldi|out|in|rjmp|jmp|call|ret|sbi|cbi|dec|brne|push|pop|eor|cli|sei|sts|lds|nop)\b/i,
              'keyword',
            ],
            [/\br\d+\b/i, 'variable'],
            [/0x[\da-f]+|\b\d+\b/i, 'number'],
            [/"[^"]*"/, 'string'],
          ],
        },
      });
      registerRetroTheme();
      this.editor = monaco.editor.create(this.host().nativeElement, {
        value: this.text(),
        language: 'avrasm',
        theme: 'microchris-retro',
        automaticLayout: true,
        fontSize: 20,
        lineHeight: 25,
        fontFamily: '"VT323", monospace',
        fontLigatures: false,
        fontWeight: '400',
        padding: { top: 16, bottom: 16 },
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
      });
      void document.fonts.ready.then(() => monaco.editor.remeasureFonts());
      this.editor.onDidChangeModelContent(() => {
        if (!this.syncing) this.changed.emit(this.editor!.getValue());
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.editor?.getModel()?.dispose();
      this.editor?.dispose();
    });
  }
}
