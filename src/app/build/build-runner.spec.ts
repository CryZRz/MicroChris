import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Desktop } from '../core/desktop';
import { IdeState } from '../core/ide-state';
import { Workspace } from '../workspace/workspace';
import { SerialMonitor } from '../serial/serial-monitor';
import { ToolOutput } from '../core/models';
import { BuildRunner } from './build-runner';

describe('Coordinación de compilación y serial', () => {
  const desktop = {
    available: () => true,
    writeFile: vi.fn(),
    serialClose: vi.fn(),
    serialOpen: vi.fn(),
    build: vi.fn(),
    onOutput: vi.fn(),
  };
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: Desktop, useValue: desktop }] });
    const workspace = TestBed.inject(Workspace);
    workspace.tabs.set([{ path: 'main.asm', text: 'nop', saved: '' }]);
  });
  it('guarda, libera el puerto, compila y reconecta el monitor en ese orden', async () => {
    const order: string[] = [];
    desktop.writeFile.mockImplementation(async () => {
      order.push('save');
    });
    desktop.serialClose.mockImplementation(async () => {
      order.push('close');
    });
    desktop.build.mockImplementation(async () => {
      order.push('build');
    });
    desktop.serialOpen.mockImplementation(async () => {
      order.push('open');
    });
    TestBed.inject(SerialMonitor).connected.set(true);
    const state = TestBed.inject(IdeState);
    state.port.set('COM3');
    state.baud.set(115200);
    await TestBed.inject(BuildRunner).compile(true);
    expect(order).toEqual(['save', 'close', 'build', 'open']);
    expect(desktop.build).toHaveBeenCalledWith(
      expect.objectContaining({ main: 'main.asm', upload: true, port: 'COM3', serialBaud: 115200 }),
    );
    expect(state.busy()).toBe(false);
    expect(TestBed.inject(SerialMonitor).connected()).toBe(true);
  });
  it('si guardar falla conserva el documento pendiente y no inicia la compilación', async () => {
    desktop.writeFile.mockRejectedValue(new Error('Disco lleno'));
    await TestBed.inject(BuildRunner).compile(true);
    expect(desktop.build).not.toHaveBeenCalled();
    expect(TestBed.inject(Workspace).tabs()[0].saved).toBe('');
    expect(TestBed.inject(IdeState).busy()).toBe(false);
    expect(TestBed.inject(IdeState).status()).toContain('Disco lleno');
  });
  it('ignora la salida de operaciones anteriores', async () => {
    let receive!: (output: ToolOutput) => void;
    desktop.onOutput.mockImplementation(async (callback) => {
      receive = callback;
      return () => {};
    });
    const build = TestBed.inject(BuildRunner);
    await build.subscribe();
    await build.compile(false);
    const request = desktop.build.mock.calls[0][0];
    receive({ id: 'old', phase: 'compilacion', text: 'Mensaje anterior' });
    receive({ id: request.id, phase: 'compilacion', text: 'Mensaje actual' });
    const logs = TestBed.inject(IdeState).logs();
    expect(logs.some((l) => l.text === 'Mensaje anterior')).toBe(false);
    expect(logs.some((l) => l.text === 'Mensaje actual')).toBe(true);
  });
});
