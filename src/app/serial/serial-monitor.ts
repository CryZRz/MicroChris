import { Service, signal, inject } from '@angular/core';
import { Desktop } from '../core/desktop';
import { IdeState } from '../core/ide-state';
@Service()
export class SerialMonitor {
  private readonly desktop = inject(Desktop);
  private readonly state = inject(IdeState);
  serial = signal('');
  connected = signal(false);
  send = signal('');
  ending = signal('\n');
  async refreshPorts() {
    await this.state.guard(async () => {
      this.state.ports.set(await this.desktop.ports());
      if (!this.state.port()) this.state.port.set(this.state.ports()[0] || '');
    });
  }
  async toggleSerial() {
    await this.state.guard(async () => {
      if (this.connected()) {
        await this.desktop.serialClose();
        this.connected.set(false);
      } else {
        await this.desktop.serialOpen({ port: this.state.port(), baud: this.state.baud() });
        this.connected.set(true);
      }
    });
  }
  async transmit() {
    await this.state.guard(async () => {
      await this.desktop.serialSend({ text: this.send() + this.ending() });
      this.send.set('');
    });
  }
  async subscribe() {
    const off = await this.desktop.onSerial((text) =>
      this.serial.update((t) => (t + text).slice(-200000)),
    );
    try {
      const error = await this.desktop.onSerialError((text) => {
        this.connected.set(false);
        this.state.log('carga', text);
      });
      return () => {
        off();
        error();
      };
    } catch (error) {
      off();
      throw error;
    }
  }
}
