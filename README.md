# MicroChris

MicroChris is a desktop IDE for writing, building, and uploading assembly programs to Arduino boards.

## Features

- Project explorer and tabbed code editor.
- Syntax highlighting and navigation to build errors.
- Board and serial port selection.
- Build and upload actions with live output.
- Serial monitor with configurable baud rate and text input.
- Starter projects with Blink examples.
- Retro interface with pixel art and an included pixel font.
- Bundled build and upload tools that work offline after installation.

## Supported boards

- Arduino Uno R3.
- Classic Arduino Nano with ATmega328P, including old and new bootloaders.
- Arduino Mega 2560.

Boards must have a working bootloader. The IDE does not install bootloaders or change fuses. Uno R4, Nano Every, ARM-based boards, and ESP32 are not supported.

## Installation

Download the installer for your operating system from this repository's Releases page:

| Platform                  | Package          |
| ------------------------- | ---------------- |
| Linux x64 (Debian/Ubuntu) | `.deb`           |
| Windows x64               | `.exe` installer |
| macOS Intel               | `.dmg`           |
| macOS Apple Silicon       | `.dmg`           |

The build and upload tools are included. Some USB adapters may require a driver; Linux may require permission to access the serial device.

## Getting started

1. Create a project or open an existing project folder.
2. Create an assembly file or use the included Blink example.
3. Select the main file and the target board.
4. Build the project to check for errors.
5. Select the serial port and build and upload the program.
6. Use the output panel to inspect build messages or connect the serial monitor.

The main file must declare the correct device, either directly or through its device definitions. The board selector sets the upload parameters and application memory limits; it does not adapt code or pin assignments written for another board. Projects target a 16 MHz clock.

## Building from source

Install the development prerequisites for your operating system, then run:

```sh
npm ci
npm run tools:prepare
npm run desktop
```

On NixOS, enter `nix-shell` first. On Windows, the tool preparation script needs Python 3.12 or newer and GCC on PATH. On macOS, it also needs the command line developer tools, CMake, Flex, and Bison.

To build an installer on the current platform:

```sh
npm run desktop:build
```

The release workflow builds the installers on their respective operating systems. A version tag or a manual workflow run with a release tag publishes the resulting packages together.

## Checks

```sh
npm run build
npm test -- --watch=false
cargo test --manifest-path src-tauri/Cargo.toml
```

## Third-party notices

Included fonts and bundled tools retain their original licenses and notices. Corresponding tool sources and build recipes are included with the application resources.
