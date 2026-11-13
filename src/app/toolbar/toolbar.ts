import { Component, inject } from '@angular/core';
import { IdeState } from '../core/ide-state';
import { Workspace } from '../workspace/workspace';
import { SerialMonitor } from '../serial/serial-monitor';
import { BuildRunner } from '../build/build-runner';
@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {
  readonly state = inject(IdeState);
  readonly workspace = inject(Workspace);
  readonly monitor = inject(SerialMonitor);
  readonly build = inject(BuildRunner);
}
