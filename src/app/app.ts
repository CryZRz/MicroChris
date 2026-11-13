import { NgOptimizedImage } from '@angular/common';
import { Component, inject, afterNextRender, DestroyRef } from '@angular/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { IdeState } from './core/ide-state';
import { Workspace } from './workspace/workspace';
import { SerialMonitor } from './serial/serial-monitor';
import { BuildRunner } from './build/build-runner';
import { Toolbar } from './toolbar/toolbar';
import { Explorer } from './explorer/explorer';
import { EditorWorkspace } from './editor-workspace/editor-workspace';
@Component({
  selector: 'app-root',
  imports: [Toolbar, Explorer, EditorWorkspace, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly state = inject(IdeState);
  readonly workspace = inject(Workspace);
  private readonly monitor = inject(SerialMonitor);
  private readonly build = inject(BuildRunner);
  private readonly destroy = inject(DestroyRef);
  constructor() {
    const cleanup: (() => void)[] = [];
    const track = (off: () => void) => {
      if (this.destroy.destroyed) off();
      else cleanup.push(off);
    };
    afterNextRender(() =>
      this.state.guard(async () => {
        track(await this.build.subscribe());
        track(await this.monitor.subscribe());
        track(
          await getCurrentWindow().onCloseRequested(async (event) => {
            if (this.state.busy() || this.workspace.tabs().some((t) => t.text !== t.saved)) {
              event.preventDefault();
              if (
                !this.state.busy() &&
                (await confirm('Hay cambios sin guardar. ¿Cerrar de todos modos?'))
              )
                await getCurrentWindow().destroy();
            }
          }),
        );
        await this.monitor.refreshPorts();
      }),
    );
    this.destroy.onDestroy(() => cleanup.forEach((off) => off()));
  }
}
