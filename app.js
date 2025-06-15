// Music note frequencies in Hz (C3 to B6)
const NOTE_FREQUENCIES = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
    'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53
};

// App state
let audioContext;
let analyser;
let microphone;
let isDetecting = false;
let detectedFrequency = 0;
let detectedNote = '-';
let oscillator = null;
let previousHighlightedKey = null;
let minOctave = 5; // Minimum octave for note detection (default: 5)
let activeOscillators = {}; // To track multiple oscillators for keyboard input
let highlightedKeys = {}; // To track multiple highlighted keys

// DOM elements
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const playButton = document.getElementById('playButton');
const noteDisplay = document.getElementById('noteDisplay');
const frequencyDisplay = document.getElementById('frequencyDisplay');
const statusElement = document.getElementById('status');
const visualizer = document.getElementById('visualizer');
const visualizerContext = visualizer.getContext('2d');
const pianoKeys = document.getElementById('pianoKeys');
const minOctaveInput = document.getElementById('minOctaveInput');

// Keyboard mapping UI elements
const mapKeyboardButton = document.getElementById('mapKeyboardButton');
const mappingStatus = document.getElementById('mappingStatus');
const mappingButtons = document.getElementById('mappingButtons');
const resetMappingButton = document.getElementById('resetMappingButton');
const saveMappingButton = document.getElementById('saveMappingButton');

// Set up event listeners
startButton.addEventListener('click', startDetection);
stopButton.addEventListener('click', stopDetection);
playButton.addEventListener('click', playDetectedNote);
minOctaveInput.addEventListener('change', function() {
    minOctave = parseInt(this.value);
    statusElement.textContent = `Minimum octave for detection set to ${minOctave}`;
});

// Keyboard mapping event listeners
mapKeyboardButton.addEventListener('click', toggleMappingMode);
resetMappingButton.addEventListener('click', resetKeyboardMapping);
saveMappingButton.addEventListener('click', saveKeyboardMapping);

// Resize canvas for proper resolution
function setupCanvas() {
    visualizer.width = visualizer.clientWidth;
    visualizer.height = visualizer.clientHeight;
}

// Default keyboard to piano key mapping
const defaultKeyboardMapping = {
    // White keys (z-/ row)
    'z': 'B4',
    'x': 'C5',
    'c': 'D5',
    'v': 'E5', // Specifically mapped to E5 as per requirements
    'b': 'F5', // Specifically mapped to F5 as per requirements
    'n': 'G5', // Specifically mapped to G5 as per requirements
    'm': 'A5',
    ',': 'B5',
    '.': 'C6',
    '/': 'D6',

    // Black keys (a-' row)
    'd': 'C#5',  // Above 'x' (C5)
    'f': 'D#5',  // Above 'c' (D5)
    'h': 'F#5',  // Above 'b' (F5)
    'j': 'G#5',  // Above 'n' (G5)
    'k': 'A#5',  // Above 'm' (A5)
    'l': 'C#6',  // Above ',' (B5)
    ';': 'D#6'   // Above '.' (C6)
};

// Current keyboard mapping (initialized with default)
let keyboardMapping = {...defaultKeyboardMapping};

// Mapping configuration state
let isMappingMode = false;
let currentKeyToMap = null;

// Functions for keyboard mapping configuration
function toggleMappingMode() {
    isMappingMode = !isMappingMode;

    if (isMappingMode) {
        // Enter mapping mode
        mapKeyboardButton.textContent = "Cancel Mapping";
        mappingStatus.style.display = "block";
        mappingButtons.style.display = "block";
        mappingStatus.textContent = "Press a keyboard key, then click on a piano key to map it.";
        statusElement.textContent = "Keyboard mapping mode active. Press a keyboard key, then click on a piano key to map it.";
    } else {
        // Exit mapping mode
        mapKeyboardButton.textContent = "Map Keyboard Keys";
        mappingStatus.style.display = "none";
        mappingButtons.style.display = "none";
        currentKeyToMap = null;
        statusElement.textContent = "Keyboard mapping mode deactivated.";
    }
}

function resetKeyboardMapping() {
    keyboardMapping = {...defaultKeyboardMapping};
    statusElement.textContent = "Keyboard mapping reset to default.";

    // Update the piano key display with the new mapping
    updatePianoKeyDisplay();

    // Exit mapping mode
    if (isMappingMode) {
        toggleMappingMode();
    }
}

function saveKeyboardMapping() {
    // In a real application, you might save to localStorage or a server
    // For this example, we'll just keep the current mapping in memory
    statusElement.textContent = "Keyboard mapping saved.";

    // Update the piano key display with the new mapping
    updatePianoKeyDisplay();

    // Exit mapping mode
    if (isMappingMode) {
        toggleMappingMode();
    }
}

function handlePianoKeyClick(event) {
    const note = this.getAttribute('data-note');

    if (isMappingMode && currentKeyToMap) {
        // Map the current keyboard key to this piano key
        keyboardMapping[currentKeyToMap] = note;
        mappingStatus.textContent = `Mapped key '${currentKeyToMap}' to note '${note}'`;
        currentKeyToMap = null;

        // Update the piano key display with the new mapping
        updatePianoKeyDisplay();
    } else {
        // Normal piano key click behavior
        playNoteFromKey(note);
        highlightPianoKey(note);
    }
}

// Find which keyboard key is mapped to a specific note
function findKeyForNote(note) {
    for (const [key, mappedNote] of Object.entries(keyboardMapping)) {
        if (mappedNote === note) {
            return key;
        }
    }
    return null; // No key mapped to this note
}

// Update the piano key display with the mapped keyboard keys
function updatePianoKeyDisplay() {
    const keys = pianoKeys.querySelectorAll('.piano-key');
    keys.forEach(key => {
        const note = key.getAttribute('data-note');
        const keyboardKey = findKeyForNote(note);
        const noteNameElement = key.querySelector('.note-name');

        if (keyboardKey) {
            // If a keyboard key is mapped to this note, display it
            noteNameElement.innerHTML = `<small>[${keyboardKey}]</small><br>${note}`;
        } else {
            // Otherwise, just display the note name
            noteNameElement.textContent = note;
        }
    });
}

// Initialize the app
function init() {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Initialize settings
    minOctaveInput.value = minOctave;
    statusElement.textContent = `Minimum octave for detection set to ${minOctave}`;

    // Make sure no piano keys are highlighted at startup
    if (previousHighlightedKey) {
        previousHighlightedKey.classList.remove('highlighted');
        previousHighlightedKey = null;
    }

    // Add event listeners to piano keys
    const keys = pianoKeys.querySelectorAll('.piano-key');
    keys.forEach(key => {
        // Use the new handler for mouse button press
        key.addEventListener('mousedown', handlePianoKeyClick);

        // Stop note when mouse button is released or mouse leaves the key
        key.addEventListener('mouseup', stopNote);
        key.addEventListener('mouseleave', stopNote);
    });

    // Add keyboard event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Update the piano key display with the mapped keyboard keys
    updatePianoKeyDisplay();
}

// Start the detection process
async function startDetection() {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);

        // Create analyser node
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Connect microphone to analyser
        microphone.connect(analyser);

        // Update UI
        startButton.disabled = true;
        stopButton.disabled = false;
        playButton.disabled = true;
        statusElement.textContent = 'Listening for whistling sounds...';

        // Start detection loop
        isDetecting = true;
        detectPitch(dataArray, bufferLength);

    } catch (error) {
        console.error('Error accessing microphone:', error);
        statusElement.textContent = 'Error: ' + error.message;
    }
}

// Stop the detection process
function stopDetection() {
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    // Clear any highlighted piano key
    if (previousHighlightedKey) {
        previousHighlightedKey.classList.remove('highlighted');
        previousHighlightedKey = null;
    }

    isDetecting = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    playButton.disabled = detectedNote === '-';
    statusElement.textContent = 'Detection stopped.';
}

// Main pitch detection function
function detectPitch(dataArray, bufferLength) {
    if (!isDetecting) return;

    // Get frequency data
    analyser.getByteFrequencyData(dataArray);

    // Draw visualization
    drawVisualization(dataArray, bufferLength);

    // Find the dominant frequency
    const dominantFrequency = findDominantFrequency(dataArray, bufferLength);

    // Only update if we have a significant frequency (whistling)
    if (dominantFrequency > 100) {
        detectedFrequency = dominantFrequency;
        detectedNote = findClosestNote(dominantFrequency);

        // Only update UI if a valid note (at or above the minimum octave) was found
        if (detectedNote) {
            // Update UI
            noteDisplay.textContent = detectedNote;
            frequencyDisplay.textContent = `Frequency: ${detectedFrequency.toFixed(2)} Hz`;
            playButton.disabled = false;

            // Highlight the detected note on the piano
            highlightPianoKey(detectedNote);
        }
    }

    // Continue detection loop
    requestAnimationFrame(() => detectPitch(dataArray, bufferLength));
}

// Find the dominant frequency in the audio signal
function findDominantFrequency(dataArray, bufferLength) {
    // Find the peak in the frequency data
    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxValue) {
            maxValue = dataArray[i];
            maxIndex = i;
        }
    }

    // Convert index to frequency
    // The frequency resolution is sampleRate / fftSize
    const frequency = maxIndex * audioContext.sampleRate / (analyser.fftSize * 2);

    // Only return if the signal is strong enough (to filter out background noise)
    return maxValue > 50 ? frequency : 0;
}

// Find the closest musical note to a given frequency
function findClosestNote(frequency) {
    let closestNote = '';
    let minDifference = Infinity;

    for (const [note, noteFrequency] of Object.entries(NOTE_FREQUENCIES)) {
        // Only consider notes at or above the minimum octave for pitch detection
        const noteOctave = parseInt(note.charAt(note.length - 1));
        if (noteOctave >= minOctave) {
            const difference = Math.abs(frequency - noteFrequency);
            if (difference < minDifference) {
                minDifference = difference;
                closestNote = note;
            }
        }
    }

    // If no note at or above the minimum octave matches, return empty string
    return closestNote;
}

// Play the detected note
function playDetectedNote() {
    // Only play if we have a valid note (at or above the minimum octave)
    if (!detectedNote || detectedNote === '-') return;

    // Create a new audio context if needed
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Stop any currently playing sound
    if (oscillator) {
        oscillator.stop();
        oscillator = null;
    }

    // Create and configure oscillator
    oscillator = audioContext.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(detectedFrequency, audioContext.currentTime);

    // Connect to output and play
    oscillator.connect(audioContext.destination);
    oscillator.start();

    // For consistency with piano key behavior, we'll stop the note after 1 second
    // since there's no mouseup event for the play button
    setTimeout(() => {
        if (oscillator) {
            resetHighlightedKey()
            oscillator.stop();
            oscillator = null;
        }
    }, 1000);
}

// Play a note when a piano key is pressed
function playNoteFromKey(note, keyIdentifier = null) {
    if (!note) return;

    // Get the frequency for this note
    const frequency = NOTE_FREQUENCIES[note];
    if (!frequency) return;

    // Create a new audio context if needed
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // If a key identifier is provided, we're handling keyboard input
    if (keyIdentifier) {
        // If this key is already playing, don't start it again
        if (activeOscillators[keyIdentifier]) return;

        // Create and configure oscillator for this key
        const newOscillator = audioContext.createOscillator();
        newOscillator.type = 'triangle';
        newOscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        // Connect to output and play
        newOscillator.connect(audioContext.destination);
        newOscillator.start();

        // Store the oscillator with its key identifier
        activeOscillators[keyIdentifier] = newOscillator;
    } else {
        // For mouse clicks, use the original behavior
        // Create and configure oscillator
        oscillator = audioContext.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        // Connect to output and play
        oscillator.connect(audioContext.destination);
        oscillator.start();
        // Note: No setTimeout here - the note will keep playing until stopNote is called
    }
}

function resetHighlightedKey(keyIdentifier = null) {
    if (keyIdentifier) {
        // Remove highlight for a specific key
        if (highlightedKeys[keyIdentifier]) {
            highlightedKeys[keyIdentifier].classList.remove('highlighted');
            delete highlightedKeys[keyIdentifier];
        }
    } else {
        // Remove all highlights (for mouse interaction)
        if (previousHighlightedKey) {
            previousHighlightedKey.classList.remove('highlighted');
            previousHighlightedKey = null;
        }

        // Also clear any keyboard highlights
        Object.values(highlightedKeys).forEach(key => {
            key.classList.remove('highlighted');
        });
        highlightedKeys = {};
    }
}

// Stop the currently playing note
function stopNote() {
    if (oscillator) {
        resetHighlightedKey();
        oscillator.stop();
        oscillator = null;
    }
}

// Handle keyboard key press
function handleKeyDown(event) {
    // Get the key that was pressed (lowercase for consistency)
    const key = event.key.toLowerCase();

    // If in mapping mode, store the key to map
    if (isMappingMode) {
        currentKeyToMap = key;
        mappingStatus.textContent = `Press a piano key to map it to '${key}'`;
        return;
    }

    // Check if this key is mapped to a piano note
    if (keyboardMapping[key]) {
        // Get the note for this key
        const note = keyboardMapping[key];

        // Play the note with the key as identifier
        playNoteFromKey(note, key);

        // Highlight the corresponding piano key
        highlightPianoKey(note, key);
    }
}

// Handle keyboard key release
function handleKeyUp(event) {
    // Get the key that was released (lowercase for consistency)
    const key = event.key.toLowerCase();

    // Check if this key is mapped to a piano note and is currently playing
    if (keyboardMapping[key] && activeOscillators[key]) {
        // Stop the oscillator for this key
        activeOscillators[key].stop();

        // Remove it from the active oscillators
        delete activeOscillators[key];

        // Remove highlight from the piano key
        resetHighlightedKey(key);
    }
}

// Highlight the detected note on the piano
function highlightPianoKey(note, keyIdentifier = null) {
    // Find the key with the matching note
    if (note && note !== '-') {
        const key = pianoKeys.querySelector(`[data-note="${note}"]`);
        if (key) {
            if (keyIdentifier) {
                // For keyboard input, store in highlightedKeys
                key.classList.add('highlighted');
                highlightedKeys[keyIdentifier] = key;
            } else {
                // For mouse clicks or detected notes, use the original behavior
                // Remove previous highlight
                if (previousHighlightedKey) {
                    previousHighlightedKey.classList.remove('highlighted');
                }
                key.classList.add('highlighted');
                previousHighlightedKey = key;
            }
        }
    }
}

// Draw the audio visualization
function drawVisualization(dataArray, bufferLength) {
    // Clear the canvas
    visualizerContext.clearRect(0, 0, visualizer.width, visualizer.height);

    // Draw the frequency spectrum
    const barWidth = (visualizer.width / bufferLength) * 2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * visualizer.height;

        // Use a gradient color based on frequency
        const hue = i / bufferLength * 360;
        visualizerContext.fillStyle = `hsl(${hue}, 100%, 50%)`;

        visualizerContext.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
}

// Initialize the app when the page loads
window.addEventListener('load', init);
