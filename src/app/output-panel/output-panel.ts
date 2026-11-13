import { Component, inject } from '@angular/core';
import { IdeState } from '../core/ide-state';
import { Workspace } from '../workspace/workspace';
import { SerialMonitor } from '../serial/serial-monitor';
@Component({
  selector: 'app-output-panel',
  imports: [],
  templateUrl: './output-panel.html',
  styleUrl: './output-panel.css',
})
export class OutputPanel {
  readonly state = inject(IdeState);
  readonly workspace = inject(Workspace);
  readonly monitor = inject(SerialMonitor);
}
