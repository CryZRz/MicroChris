import { Service, inject } from '@angular/core';
import { Desktop } from '../core/desktop';
import { IdeState } from '../core/ide-state';
import { Workspace } from '../workspace/workspace';
import { SerialMonitor } from '../serial/serial-monitor';
@Service()
export class BuildRunner {
  private readonly desktop = inject(Desktop);
  private readonly state = inject(IdeState);
  private readonly workspace = inject(Workspace);
  private readonly monitor = inject(SerialMonitor);
  private id = '';
  async subscribe() {
    return this.desktop.onOutput((output) => {
      if (output.id === this.id) this.state.log(output.phase, output.text);
    });
  }
  async compile(upload: boolean) {
    if (this.state.busy()) return;
    await this.state.guard(async () => {
      this.state.busy.set(true);
      const reconnect = this.monitor.connected();
      try {
        await this.workspace.saveAll(true);
        if (reconnect) {
          await this.desktop.serialClose();
          this.monitor.connected.set(false);
          await new Promise((r) => setTimeout(r, 200));
        }
        this.id = crypto.randomUUID();
        this.state.panel.set(upload ? 'carga' : 'compilacion');
        this.state.status.set(upload ? 'Compilando y subiendo…' : 'Compilando…');
        await this.desktop.build({
          main: this.workspace.main(),
          board: this.state.board(),
          port: this.state.port(),
          upload,
          serialBaud: this.state.baud(),
          id: this.id,
        });
        this.state.status.set(upload ? 'Programa subido y verificado' : 'Compilación correcta');
        this.state.log(this.state.panel(), this.state.status());
      } finally {
        this.state.busy.set(false);
        if (reconnect) await this.monitor.toggleSerial();
      }
    });
  }
}
