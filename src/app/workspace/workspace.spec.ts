import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { Workspace } from './workspace';
describe('Documentos del IDE', () => {
  it('editar una pestaña conserva el contenido de las otras y marca cambios sin guardar', () => {
    const app = TestBed.inject(Workspace);
    app.tabs.set([
      { path: 'main.asm', text: 'nop', saved: 'nop' },
      { path: 'other.asm', text: 'ret', saved: 'ret' },
    ]);
    app.active.set('main.asm');
    app.edit('rjmp reset');
    expect(app.current()?.text).toBe('rjmp reset');
    expect(app.current()?.saved).toBe('nop');
    expect(app.tabs()[1].text).toBe('ret');
  });
});
