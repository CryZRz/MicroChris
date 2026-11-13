export interface FileEntry {
  path: string;
  directory: boolean;
}
export interface DocumentTab {
  path: string;
  text: string;
  saved: string;
}
export interface ProjectConfig {
  main: string;
  board: string;
  baud: number;
}
export interface BuildRequest {
  main: string;
  board: string;
  port: string;
  upload: boolean;
  id: string;
  serialBaud: number;
}
export interface ToolOutput {
  id: string;
  phase: string;
  text: string;
}
export interface LogEntry {
  phase: string;
  text: string;
}
export const BOARDS = [
  { id: 'uno', name: 'Arduino Uno R3' },
  { id: 'nano', name: 'Nano · bootloader moderno' },
  { id: 'nano-old', name: 'Nano · bootloader antiguo' },
  { id: 'mega', name: 'Arduino Mega 2560' },
] as const;
