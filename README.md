# Music Helper - Whistle Note Detector

A web application that detects the frequency of whistling sounds from a microphone and matches them to the nearest musical note in western notation. The application can also play back the detected sound.

## Features

- Real-time detection of whistling frequencies
- Conversion of frequencies to musical notes (C4 to B5)
- Visual representation of audio input
- Playback of detected notes
- Simple and intuitive user interface

## Prerequisites

- A modern web browser with microphone access
- [Nix package manager](https://nixos.org/download.html) with flakes enabled (for development)
- Optional: [direnv](https://direnv.net/) for automatic environment activation

## Getting Started

### Running the Application

#### Method 1: Direct Browser Access
1. Open the `index.html` file directly in a web browser
2. Click "Start Detection" to begin listening for whistling sounds
3. Whistle into your microphone
4. The application will display the detected note and frequency
5. Click "Play Detected Note" to hear the detected note
6. Click "Stop Detection" when finished

#### Method 2: Using Node.js Server
1. Start the server:
   ```bash
   npm start
   # or
   node index.js
   ```
2. Open your browser and navigate to `http://localhost:3000`
3. Use the application as described above

### Using Nix Development Shell

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd music-helper
   ```

2. Enter the development environment:
   ```bash
   nix develop
   ```

   This will set up a shell with Node.js, npm, yarn, and Bun available.

3. Run a local server (optional):
   ```bash
   npx http-server
   ```

### Using direnv (Optional)

If you have direnv installed, you can create a `.envrc` file:

```bash
echo "use flake" > .envrc
direnv allow
```

This will automatically activate the development environment when you enter the project directory.

## Available Tools

The development environment includes:

- Node.js 20
- npm
- yarn
- Bun runtime

## Project Structure

- `index.html` - The web interface for the application
- `app.js` - JavaScript code for the whistling note detector
- `package.json` - Project configuration and dependencies
- `index.js` - Simple HTTP server to serve the application (optional, not required for direct browser access)
- `flake.nix` - Nix flake configuration for the development environment

## How It Works

The application uses the Web Audio API to:

1. **Access the microphone** - Using `getUserMedia()` to capture audio input
2. **Analyze audio** - Using `AnalyserNode` and Fast Fourier Transform (FFT) to extract frequency data
3. **Detect dominant frequency** - Finding the peak in the frequency spectrum
4. **Match to musical notes** - Comparing the detected frequency to a table of note frequencies
5. **Visualize the audio** - Drawing the frequency spectrum on a canvas
6. **Play back notes** - Using `OscillatorNode` to generate tones at the detected frequency

## Development

You can use either Node.js or Bun for development:

### Using Node.js
```bash
npm install <package>
npm start
```

### Using Bun
```bash
bun install <package>
bun run index.js
```

## License

MIT
