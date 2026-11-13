import { Service, signal, computed, inject } from '@angular/core';
import { open, confirm, save } from '@tauri-apps/plugin-dialog';
import { Desktop } from '../core/desktop';
import { IdeState } from '../core/ide-state';
import { FileEntry, DocumentTab, ProjectConfig } from '../core/models';
import { blinkSource } from './blink';
@Service()
export class Workspace {
  private readonly desktop = inject(Desktop);
  private readonly state = inject(IdeState);
  targetLine = signal(1);
  root = signal('');
  files = signal<FileEntry[]>([]);
  tabs = signal<DocumentTab[]>([]);
  active = signal('');
  current = computed(() => this.tabs().find((t) => t.path === this.active()));
  main = signal('main.asm');
  async newProject() {
    await this.state.guard(async () => {
      if (
        this.tabs().some((t) => t.text !== t.saved) &&
        !(await confirm('¿Descartar cambios y crear un proyecto?'))
      )
        return;
      const path = await save({
        title: 'Nombre y ubicación de la nueva carpeta de proyecto',
        defaultPath: 'avr-project',
      });
      if (!path) return;
      this.files.set(await this.desktop.createProject({ path }));
      this.root.set(path);
      this.tabs.set([]);
      this.active.set('');
      this.main.set('main.asm');
      await this.example();
    });
  }
  async openProject() {
    await this.state.guard(async () => {
      if (
        this.tabs().some((t) => t.text !== t.saved) &&
        !(await confirm('¿Descartar los cambios y abrir otra carpeta?'))
      )
        return;
      const path = await open({ directory: true });
      if (typeof path !== 'string') return;
      this.files.set(await this.desktop.openProject({ path }));
      this.root.set(path);
      this.tabs.set([]);
      this.active.set('');
      try {
        const cfg: ProjectConfig = JSON.parse(
          await this.desktop.readFile({ path: 'avr-project.json' }),
        );
        this.main.set(cfg.main || 'main.asm');
        this.state.board.set(cfg.board || 'uno');
        this.state.baud.set(cfg.baud || 9600);
      } catch {
        this.main.set(this.files().find((f) => f.path.endsWith('.asm'))?.path || 'main.asm');
      }
      if (this.files().some((f) => f.path === this.main())) await this.openFile(this.main());
    });
  }
  async refresh() {
    this.files.set(await this.desktop.openProject({ path: this.root() }));
  }
  async openFile(path: string) {
    await this.state.guard(async () => {
      if (!this.tabs().some((t) => t.path === path)) {
        const text = await this.desktop.readFile({ path });
        this.tabs.update((t) => [...t, { path, text, saved: text }]);
      }
      this.active.set(path);
    });
  }
  edit(text: string) {
    this.tabs.update((ts) => ts.map((t) => (t.path === this.active() ? { ...t, text } : t)));
  }
  async save() {
    await this.state.guard(() => this.saveAll());
  }
  async saveAll(force = false) {
    for (const tab of this.tabs()) {
      if (force || tab.text !== tab.saved) {
        await this.desktop.writeFile({ path: tab.path, text: tab.text });
        this.tabs.update((tabs) =>
          tabs.map((t) => (t.path === tab.path ? { ...t, saved: tab.text } : t)),
        );
      }
    }
  }
  async create() {
    await this.state.guard(async () => {
      const path = prompt('Nombre del archivo, por ejemplo main.asm');
      if (!path) return;
      if (this.files().some((f) => f.path === path)) throw new Error('El archivo ya existe');
      if (!this.files().some((f) => f.path === this.main())) this.main.set(path);
      await this.desktop.writeFile({ path, text: '' });
      await this.refresh();
      await this.openFile(path);
    });
  }
  async example() {
    await this.state.guard(async () => {
      if (
        this.files().some((f) => f.path === 'main.asm') &&
        !(await confirm('¿Reemplazar main.asm con Blink?'))
      )
        return;
      const text = blinkSource(this.state.board());
      await this.desktop.writeFile({ path: 'main.asm', text });
      this.tabs.update((t) => t.filter((x) => x.path !== 'main.asm'));
      this.main.set('main.asm');
      await this.refresh();
      await this.openFile('main.asm');
    });
  }
  async diagnostic(text: string) {
    const match = text.match(/^(.+?)\((\d+)\)/);
    if (!match) return;
    const normalized = match[1].replaceAll('\\', '/');
    const base = this.root().replaceAll('\\', '/') + '/';
    const path = normalized.startsWith(base) ? normalized.slice(base.length) : normalized;
    await this.openFile(path);
    this.targetLine.set(Number(match[2]));
  }
  async closeTab(path: string) {
    const t = this.tabs().find((t) => t.path === path);
    if (t && t.text !== t.saved && !(await confirm('¿Descartar los cambios de ' + path + '?')))
      return;
    this.tabs.update((ts) => ts.filter((t) => t.path !== path));
    if (this.active() === path) this.active.set(this.tabs()[0]?.path || '');
  }
  async remove() {
    const t = this.current();
    if (!t) return;
    await this.state.guard(async () => {
      if (!(await confirm(`¿Eliminar ${t.path}?`))) return;
      await this.desktop.deleteFile({ path: t.path });
      this.tabs.update((ts) => ts.filter((x) => x.path !== t.path));
      this.active.set(this.tabs()[0]?.path || '');
      await this.refresh();
    });
  }
  async rename() {
    const t = this.current();
    if (!t) return;
    await this.state.guard(async () => {
      const destination = prompt('Nuevo nombre', t.path);
      if (!destination || destination === t.path) return;
      if (this.files().some((f) => f.path === destination)) throw new Error('El destino ya existe');
      await this.desktop.renameFile({ path: t.path, destination });
      this.tabs.update((ts) =>
        ts.map((x) => (x.path === t.path ? { ...x, path: destination } : x)),
      );
      if (this.main() === t.path) this.main.set(destination);
      this.active.set(destination);
      await this.refresh();
    });
  }
}
