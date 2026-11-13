export function blinkSource(board: string): string {
  const mega = board === 'mega';
  const text = `; Blink · 16 MHz · ${board}\n.device ${mega ? 'ATmega2560' : 'ATmega328P'}\n.cseg\n.org 0\n rjmp reset\nreset:\n ldi r16, 0x${mega ? '21' : '08'}\n out 0x3e, r16\n ldi r16, 0xff\n out 0x3d, r16\n sbi ${mega ? '0x04, 7' : '0x04, 5'}\nloop:\n sbi ${mega ? '0x03, 7' : '0x03, 5'}\n ldi r18, 40\nouter:\n ldi r19, 255\nmiddle:\n ldi r20, 255\ninner:\n dec r20\n brne inner\n dec r19\n brne middle\n dec r18\n brne outer\n rjmp loop\n`;
  return text;
}
