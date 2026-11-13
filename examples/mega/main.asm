; Blink · 16 MHz · mega
.device ATmega2560
.cseg
.org 0
 rjmp reset
reset:
 ldi r16, 0x21
 out 0x3e, r16
 ldi r16, 0xff
 out 0x3d, r16
 sbi 0x04, 7
loop:
 sbi 0x03, 7
 ldi r18, 40
outer:
 ldi r19, 255
middle:
 ldi r20, 255
inner:
 dec r20
 brne inner
 dec r19
 brne middle
 dec r18
 brne outer
 rjmp loop
