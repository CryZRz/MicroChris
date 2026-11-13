import { Component, inject } from '@angular/core';
import { IdeState } from '../core/ide-state';
import { Workspace } from '../workspace/workspace';
@Component({
  selector: 'app-explorer',
  imports: [],
  templateUrl: './explorer.html',
  styleUrl: './explorer.css',
})
export class Explorer {
  readonly state = inject(IdeState);
  readonly workspace = inject(Workspace);
}
