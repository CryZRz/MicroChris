import { Service } from '@angular/core';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { FileEntry, BuildRequest, ToolOutput } from './models';
@Service()
export class Desktop {
  available = isTauri;
  openProject(args: { path: string }) {
    return invoke<FileEntry[]>('open_project', { ...args });
  }
  createProject(args: { path: string }) {
    return invoke<FileEntry[]>('create_project', { ...args });
  }
  readFile(args: { path: string }) {
    return invoke<string>('read_file', { ...args });
  }
  writeFile(args: { path: string; text: string }) {
    return invoke<void>('write_file', { ...args });
  }
  renameFile(args: { path: string; destination: string }) {
    return invoke<void>('rename_file', { ...args });
  }
  deleteFile(args: { path: string }) {
    return invoke<void>('delete_file', { ...args });
  }
  ports() {
    return invoke<string[]>('ports');
  }
  build(args: BuildRequest) {
    return invoke<void>('build', { ...args });
  }
  serialOpen(args: { port: string; baud: number }) {
    return invoke<void>('serial_open', { ...args });
  }
  serialClose() {
    return invoke<void>('serial_close');
  }
  serialSend(args: { text: string }) {
    return invoke<void>('serial_send', { ...args });
  }
  onOutput(handler: (output: ToolOutput) => void) {
    return listen<ToolOutput>('output', (e) => handler(e.payload));
  }
  onSerial(handler: (text: string) => void) {
    return listen<string>('serial', (e) => handler(e.payload));
  }
  onSerialError(handler: (text: string) => void) {
    return listen<string>('serial-error', (e) => handler(e.payload));
  }
}
