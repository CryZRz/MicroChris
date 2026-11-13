import { Service, signal, inject } from '@angular/core';
import { Desktop } from './desktop';
import { BOARDS, LogEntry } from './models';
@Service()
export class IdeState {
  private readonly desktop = inject(Desktop);
  board = signal('uno');
  port = signal('');
  ports = signal<string[]>([]);
  busy = signal(false);
  status = signal('Listo');
  panel = signal('compilacion');
  logs = signal<LogEntry[]>([]);
  baud = signal(9600);
  readonly boards = BOARDS;
  log(phase: string, text: string) {
    this.logs.update((l) => [...l.slice(-3000), { phase, text }]);
  }
  async guard(action: () => Promise<void>) {
    try {
      if (!this.desktop.available())
        throw new Error('Esta función requiere la aplicación de escritorio Tauri');
      await action();
    } catch (e) {
      this.status.set(String(e));
      this.log(this.panel(), String(e));
    }
  }
}
