// ============================================
// AUDIO ENGINE (Web Audio API)
// ============================================
import { NOTES, CHORD_ROOTS } from './constants.js';
import { state } from './state.js';

// Audio context and master gain (module-level)
export let audioCtx = null;
export let masterGain = null;

export function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
    state.nextBeatTime = audioCtx.currentTime + 0.1;
}

// Create a simple oscillator for chiptune sounds
export function playTone(freq, duration, type = 'square', volume = 0.3, startTime = null) {
    if (!audioCtx) return;
    const start = startTime || audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(start);
    osc.stop(start + duration);
}

// Kick drum - low frequency burst
export function playKick(time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
}

// Snare/hi-hat - noise burst
export function playSnare(time) {
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    // High-pass filter for snare character
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(time);
    noise.stop(time + 0.1);
}

// Bass note
export function playBass(freq, time) {
    playTone(freq, state.beatInterval * 0.8, 'triangle', 0.4, time);
}

// Lead melody note
export function playLead(freq, time, duration = 0.15) {
    playTone(freq, duration, 'square', 0.15, time);
}

// Schedule a beat's audio with DYNAMIC LAYERS
export function scheduleBeat(beatNum, time) {
    // Trigger visual beat pulse
    state.beatPulse = 1;

    // LAYER 1: Drums - always playing (kick on 1 & 3, snare on 2 & 4)
    if (beatNum === 0 || beatNum === 2) {
        playKick(time);
    } else {
        playSnare(time);
    }

    // Extra hi-hat on every beat when combo 5+
    if (state.player.combo >= 5) {
        playTone(8000, 0.03, 'square', 0.1, time);
    }

    // LAYER 2: Bass follows chord progression
    const chordIndex = Math.floor(state.currentBar % 4);
    playBass(CHORD_ROOTS[chordIndex], time);

    // LAYER 3: Lead melody - procedural pentatonic (plays more often at higher combo)
    if (state.gameState === 'playing') {
        const pentatonic = state.player.feverMode ?
            [NOTES.C5, NOTES.D5, NOTES.E5, NOTES.G5, NOTES.A5] : // Higher octave in fever
            [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.G4, NOTES.A4, NOTES.C5];
        const playChance = 0.4 + Math.min(state.player.combo * 0.05, 0.4); // More notes at high combo
        if (Math.random() < playChance) {
            const noteIndex = Math.floor(Math.random() * pentatonic.length);
            playLead(pentatonic[noteIndex], time, state.beatInterval * 0.3);
        }
    }

    // LAYER 4: ARPEGGIO at combo 7+ (16th notes)
    if (state.player.combo >= 7 && state.gameState === 'playing') {
        const arpNotes = [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5];
        const sixteenth = state.beatInterval / 4;
        for (let i = 0; i < 4; i++) {
            playTone(arpNotes[i], sixteenth * 0.8, 'square', 0.08, time + i * sixteenth);
        }
    }

    // LAYER 5: FEVER MODE - extra intensity!
    if (state.player.feverMode && state.gameState === 'playing') {
        // Pulsing bass octave
        playTone(CHORD_ROOTS[chordIndex] * 2, state.beatInterval * 0.2, 'sawtooth', 0.15, time);
        // Extra percussion flourish
        if (beatNum === 1 || beatNum === 3) {
            playTone(300, 0.05, 'square', 0.2, time);
            playTone(400, 0.05, 'square', 0.15, time + 0.05);
        }
    }
}

// SFX
export function playSFX(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    switch(type) {
        case 'attack':
            // Quick rising pitch
            playTone(200, 0.1, 'sawtooth', 0.4);
            playTone(400, 0.1, 'sawtooth', 0.3);
            break;
        case 'block':
            // Metallic clang
            playTone(800, 0.15, 'square', 0.3);
            playTone(600, 0.1, 'square', 0.2);
            break;
        case 'hit':
            // Enemy hit
            playTone(300, 0.2, 'sawtooth', 0.5);
            playTone(150, 0.3, 'sawtooth', 0.3);
            break;
        case 'damage':
            // Descending wah
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'crit':
            // Fanfare arpeggio
            playTone(NOTES.C5, 0.1, 'square', 0.3);
            playTone(NOTES.E5, 0.1, 'square', 0.3);
            setTimeout(() => playTone(NOTES.G5, 0.15, 'square', 0.4), 100);
            break;
        case 'graze':
            // Lucky dodge sound
            playTone(600, 0.05, 'sine', 0.2);
            playTone(800, 0.1, 'sine', 0.3);
            break;
        case 'charge':
            // Power-up charge sound
            playTone(150, 0.3, 'sawtooth', 0.5);
            playTone(300, 0.2, 'sawtooth', 0.4);
            setTimeout(() => playTone(600, 0.15, 'square', 0.3), 100);
            break;
        case 'smash':
            // Heavy impact
            playTone(80, 0.3, 'sawtooth', 0.6);
            playTone(60, 0.4, 'sine', 0.5);
            break;
        case 'miss':
            // Buzzer/error sound for missed timing
            playTone(150, 0.15, 'square', 0.4);
            playTone(100, 0.2, 'square', 0.3);
            break;
        case 'fever':
            // Fever mode activation fanfare
            playTone(NOTES.C5, 0.1, 'square', 0.4);
            setTimeout(() => playTone(NOTES.E5, 0.1, 'square', 0.4), 80);
            setTimeout(() => playTone(NOTES.G5, 0.1, 'square', 0.4), 160);
            setTimeout(() => playTone(NOTES.C5 * 2, 0.2, 'square', 0.5), 240);
            break;
    }
}
