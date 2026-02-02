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
    if (!audioCtx) return;
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
    if (!audioCtx) return;
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

// ============================================
// GBA-STYLE PULSE WAVE WITH DUTY CYCLE
// ============================================
// Duty cycles: 0.125 = 12.5%, 0.25 = 25%, 0.5 = 50%, 0.75 = 75%
export function playPulse(freq, duration, duty = 0.5, volume = 0.3, startTime = null) {
    if (!audioCtx) return;
    const start = startTime || audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Create custom waveform for duty cycle using Fourier series
    const real = new Float32Array(32);
    const imag = new Float32Array(32);
    real[0] = 0;
    imag[0] = 0;
    for (let n = 1; n < 32; n++) {
        real[n] = 0;
        imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    }
    const wave = audioCtx.createPeriodicWave(real, imag);
    osc.setPeriodicWave(wave);
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + duration);
}

// Lead melody note (uses pulse wave with 25% duty for GBA sound)
export function playLead(freq, time, duration = 0.15) {
    playPulse(freq, duration, 0.25, 0.15, time);
}

// ============================================
// PITCH EFFECTS
// ============================================
// Pitch bend - smooth slide from one frequency to another
export function playBend(startFreq, endFreq, duration, volume = 0.3) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration);
}

// Lead with vibrato for expressive notes
export function playLeadWithVibrato(freq, duration, volume = 0.15, startTime = null) {
    if (!audioCtx) return;
    const start = startTime || audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    const gain = audioCtx.createGain();

    // Main oscillator (square wave)
    osc.type = 'square';
    osc.frequency.value = freq;

    // LFO for vibrato (6 Hz, ±8 Hz depth)
    lfo.type = 'sine';
    lfo.frequency.value = 6;
    lfoGain.gain.value = 8;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(gain);
    gain.connect(masterGain);

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    lfo.start(start);
    osc.start(start);
    osc.stop(start + duration);
    lfo.stop(start + duration);
}

// ============================================
// IMPROVED PERCUSSION
// ============================================
// Hi-hat with open/closed variation
export function playHiHat(time, open = false) {
    if (!audioCtx) return;
    const dur = open ? 0.15 : 0.05;
    const bufferSize = audioCtx.sampleRate * dur;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = open ? 5000 : 8000;

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(time);
    noise.stop(time + dur);
}

// Tom for fills
export function playTom(freq, time) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.15);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.15);
}

// Crash cymbal for big moments
export function playCrash(time) {
    if (!audioCtx) return;
    const t = time || audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.5);
}

// ============================================
// ENEMY STINGERS
// ============================================
export function playEnemyStinger(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    switch(type) {
        case 'swordsman':
            // Quick aggressive C→E
            playPulse(NOTES.C4, 0.08, 0.25, 0.25, now);
            playPulse(NOTES.E4, 0.12, 0.25, 0.3, now + 0.06);
            break;
        case 'archer':
            // Sneaky descending G→E→C
            playPulse(NOTES.G4, 0.06, 0.125, 0.2, now);
            playPulse(NOTES.E4, 0.06, 0.125, 0.2, now + 0.05);
            playPulse(NOTES.C4, 0.1, 0.125, 0.25, now + 0.1);
            break;
        case 'armored':
            // Heavy power chord C+G
            playPulse(NOTES.C3, 0.2, 0.5, 0.3, now);
            playPulse(NOTES.G3, 0.2, 0.5, 0.25, now);
            playPulse(NOTES.C3, 0.15, 0.5, 0.15, now + 0.05); // echo
            break;
        case 'giant':
            // Menacing low slide
            playBend(NOTES.C3, NOTES.C3 / 2, 0.3, 0.4);
            break;
        case 'mage':
            // Mysterious diminished arpeggio C→Eb→Gb→A
            playPulse(NOTES.C4, 0.08, 0.25, 0.2, now);
            playPulse(311.13, 0.08, 0.25, 0.2, now + 0.06); // Eb4
            playPulse(369.99, 0.08, 0.25, 0.2, now + 0.12); // Gb4
            playPulse(NOTES.A4, 0.15, 0.25, 0.25, now + 0.18);
            break;
    }
}

// Schedule a beat's audio with DYNAMIC LAYERS
export function scheduleBeat(beatNum, time) {
    // Trigger visual beat pulse
    state.beatPulse = 1;

    const lives = state.player.lives;
    const chordIndex = Math.floor(state.currentBar % 4);

    // LAYER 1: Drums - always playing (kick on 1 & 3, snare on 2 & 4)
    if (beatNum === 0 || beatNum === 2) {
        playKick(time);
    } else {
        playSnare(time);
    }

    // Hi-hat patterns (improved)
    if (state.player.combo >= 5 || state.bpm > 70) {
        // 8th note hi-hats at high tempo or combo
        playHiHat(time, false);
        if (state.bpm > 80) {
            playHiHat(time + state.beatInterval / 2, false);
        }
    }

    // Open hi-hat on beat 4 occasionally
    if (beatNum === 3 && state.currentBar % 2 === 1) {
        playHiHat(time, true);
    }

    // Tom fill every 8 bars (on bar 7, beat 3)
    if (state.currentBar % 8 === 7 && beatNum === 3) {
        const sixteenth = state.beatInterval / 4;
        playTom(200, time);
        playTom(150, time + sixteenth);
        playTom(120, time + sixteenth * 2);
        playTom(100, time + sixteenth * 3);
    }

    // LAYER 2: Bass follows chord progression
    playBass(CHORD_ROOTS[chordIndex], time);

    // LAYER 3: Lead melody - procedural pentatonic (plays more often at higher combo)
    if (state.gameState === 'playing') {
        // Use minor hints when at 1 life (Eb instead of E)
        let pentatonic;
        if (lives === 1) {
            // Minor pentatonic for tension
            pentatonic = [NOTES.C4, NOTES.D4, 311.13, NOTES.G4, NOTES.A4]; // Eb4 = 311.13
        } else if (state.player.feverMode) {
            pentatonic = [NOTES.C5, NOTES.D5, NOTES.E5, NOTES.G5, NOTES.A5]; // Higher octave in fever
        } else {
            pentatonic = [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.G4, NOTES.A4, NOTES.C5];
        }
        const playChance = 0.4 + Math.min(state.player.combo * 0.05, 0.4);
        if (Math.random() < playChance) {
            const noteIndex = Math.floor(Math.random() * pentatonic.length);
            // Use vibrato on longer notes at high combo
            if (state.player.combo >= 10 && Math.random() < 0.3) {
                playLeadWithVibrato(pentatonic[noteIndex], state.beatInterval * 0.5, 0.15, time);
            } else {
                playLead(pentatonic[noteIndex], time, state.beatInterval * 0.3);
            }
        }
    }

    // LAYER 4: ARPEGGIO at combo 7+ (16th notes)
    if (state.player.combo >= 7 && state.gameState === 'playing') {
        const arpNotes = [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5];
        const sixteenth = state.beatInterval / 4;
        for (let i = 0; i < 4; i++) {
            playPulse(arpNotes[i], sixteenth * 0.8, 0.25, 0.08, time + i * sixteenth);
        }
    }

    // LAYER 5: FEVER MODE - extra intensity!
    if (state.player.feverMode && state.gameState === 'playing') {
        // Pulsing bass octave
        playPulse(CHORD_ROOTS[chordIndex] * 2, state.beatInterval * 0.2, 0.5, 0.15, time);
        // Extra percussion flourish
        if (beatNum === 1 || beatNum === 3) {
            playPulse(300, 0.05, 0.25, 0.2, time);
            playPulse(400, 0.05, 0.25, 0.15, time + 0.05);
        }
    }

    // LAYER 6: DANGER MUSIC - tension at low health
    if (state.gameState === 'playing') {
        if (lives === 2) {
            // Tension: octave bass pulse on off-beats
            if (beatNum === 1 || beatNum === 3) {
                playTone(CHORD_ROOTS[chordIndex] / 2, 0.1, 'sine', 0.2, time);
            }
        }

        if (lives === 1) {
            // Critical: heartbeat bass, faster hats
            if (beatNum === 0 || beatNum === 2) {
                // Heartbeat double-thump
                playTone(60, 0.15, 'sine', 0.4, time);
                playTone(55, 0.1, 'sine', 0.3, time + 0.12);
            }
            // 16th note hats for urgency
            const sixteenth = state.beatInterval / 4;
            for (let i = 0; i < 4; i++) {
                playTone(6000, 0.02, 'square', 0.06, time + i * sixteenth);
            }
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
            playPulse(NOTES.C5, 0.1, 0.25, 0.4);
            setTimeout(() => playPulse(NOTES.E5, 0.1, 0.25, 0.4), 80);
            setTimeout(() => playPulse(NOTES.G5, 0.1, 0.25, 0.4), 160);
            setTimeout(() => playPulse(NOTES.C5 * 2, 0.2, 0.25, 0.5), 240);
            break;
    }
}

// ============================================
// TITLE MUSIC - Heroic 4-bar loop
// ============================================
let titleLoopId = null;

export function startTitleMusic() {
    // Initialize audio context if needed (for title screen)
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);
    }

    if (titleLoopId) return; // Already playing

    const melody = [
        // Bar 1: C E G E - heroic rise
        { note: NOTES.C4, beat: 0 },
        { note: NOTES.E4, beat: 1 },
        { note: NOTES.G4, beat: 2 },
        { note: NOTES.E4, beat: 3 },
        // Bar 2: G A G E - tension
        { note: NOTES.G4, beat: 4 },
        { note: NOTES.A4, beat: 5 },
        { note: NOTES.G4, beat: 6 },
        { note: NOTES.E4, beat: 7 },
        // Bar 3: A G E C - descent
        { note: NOTES.A4, beat: 8 },
        { note: NOTES.G4, beat: 9 },
        { note: NOTES.E4, beat: 10 },
        { note: NOTES.C4, beat: 11 },
        // Bar 4: E D C - - resolution
        { note: NOTES.E4, beat: 12 },
        { note: NOTES.D4, beat: 13 },
        { note: NOTES.C4, beat: 14 },
    ];

    const beatDuration = 0.35; // ~85 BPM feel
    const loopDuration = 16 * beatDuration;

    function playLoop() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        // Melody with 25% duty cycle (classic GBA lead)
        melody.forEach(({ note, beat }) => {
            playPulse(note, beatDuration * 0.7, 0.25, 0.2, now + beat * beatDuration);
            // Echo at lower volume
            playPulse(note, beatDuration * 0.5, 0.25, 0.08, now + beat * beatDuration + 0.1);
        });

        // Bass on beats 0, 4, 8, 12
        [0, 4, 8, 12].forEach(beat => {
            playTone(NOTES.C3, beatDuration * 1.5, 'triangle', 0.25, now + beat * beatDuration);
        });

        // Simple kick/snare pattern
        for (let i = 0; i < 16; i++) {
            if (i % 4 === 0) playKick(now + i * beatDuration);
            if (i % 4 === 2) playSnare(now + i * beatDuration);
        }

        // Light hi-hat on every beat
        for (let i = 0; i < 16; i++) {
            playHiHat(now + i * beatDuration, false);
        }

        titleLoopId = setTimeout(playLoop, loopDuration * 1000);
    }

    playLoop();
}

export function stopTitleMusic() {
    if (titleLoopId) {
        clearTimeout(titleLoopId);
        titleLoopId = null;
    }
}

// ============================================
// GAME OVER JINGLE - Sad descending melody
// ============================================
export function playGameOverJingle() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Sad descending: E D C... A (minor feel)
    playPulse(NOTES.E4, 0.3, 0.5, 0.3, now);
    playPulse(NOTES.D4, 0.3, 0.5, 0.3, now + 0.25);
    playPulse(NOTES.C4, 0.5, 0.5, 0.35, now + 0.5);
    // Pause then final low note
    playPulse(NOTES.A3, 0.8, 0.5, 0.3, now + 1.2);

    // Low bass drone
    playTone(NOTES.C3, 2, 'triangle', 0.2, now);

    // Quiet noise sweep for finality
    const bufferSize = audioCtx.sampleRate * 1.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(now);
    noise.stop(now + 1.5);
}
