import { Component, inject } from '@angular/core';
import { Workspace } from '../workspace/workspace';
import { Editor } from '../editor/editor';
import { OutputPanel } from '../output-panel/output-panel';
@Component({
  selector: 'app-editor-workspace',
  imports: [Editor, OutputPanel],
  templateUrl: './editor-workspace.html',
  styleUrl: './editor-workspace.css',
})
export class EditorWorkspace {
  readonly workspace = inject(Workspace);
}
