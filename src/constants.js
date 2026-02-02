// ============================================
// CONSTANTS
// ============================================

// Display
export const SCALE = 2;

// Timing
export const DOUBLE_TAP_WINDOW = 400; // ms - window to register second tap (generous)
export const BEAT_WINDOW = 300; // ms - forgiving timing
export const HOLD_THRESHOLD = 400; // ms to trigger charge attack

// Double-tap marker spacing (pixels between 1st and 2nd marker)
// Spaced apart so you hit each one as it passes through
export const DOUBLE_TAP_SPACING = 70;

// Triple-tap (Giant) settings
export const TRIPLE_TAP_SPACING = 50; // Tighter spacing for triple
export const TRIPLE_TAP_WINDOW = 600; // ms - longer window for 3 taps

// Tap-hold (Mage) settings
export const TAP_HOLD_WINDOW = 400; // ms - time to start hold after tap
export const TAP_HOLD_DURATION = 300; // ms - how long to hold after tap
export const TAP_HOLD_SPACING = 60; // pixels between tap marker and hold marker

// Beat track
export const HIT_ZONE_X = 80; // Where you should hit
export const HIT_RANGE = 110; // Very forgiving hit detection range
export const TRACK_START_X = 420; // Where markers spawn (off-screen right)
export const TRACK_DISTANCE = 340; // Distance markers travel (TRACK_START_X - HIT_ZONE_X)
export const FRAMES_PER_SECOND = 60;

// Note frequencies (pentatonic scale in C)
export const NOTES = {
    C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
};

// Chord progression: I - V - vi - IV (C - G - Am - F) - Simplified
export const CHORD_ROOTS = [NOTES.C3, NOTES.G3, NOTES.A3, NOTES.C3];

// Enemy type definitions
export const ENEMY_TYPES = {
    swordsman: { color: '#ff4444', eyes: '#ff0000', weapon: 'sword', counter: 'aggressive' },
    archer: { color: '#44ff44', eyes: '#00ff00', weapon: 'bow', counter: 'defensive' },
    armored: { color: '#4488ff', eyes: '#0066ff', weapon: 'shield', counter: 'charge' },
    giant: { color: '#ff8844', eyes: '#ff6600', weapon: 'club', counter: 'triple' },
    mage: { color: '#ff44aa', eyes: '#ff00aa', weapon: 'staff', counter: 'tapthenhold' }
};

// Kill text variety
export const KILL_TEXTS = ['SLAIN!', 'DESTROYED!', 'VANQUISHED!', 'OBLITERATED!', 'WRECKED!'];
export const CRIT_TEXTS = ['CRITICAL!', 'DEVASTATING!', 'BRUTAL!', 'SAVAGE!'];
export const OVERKILL_TEXTS = ['OVERKILL!', 'ANNIHILATED!', 'DECIMATED!', 'EVISCERATED!'];
export const MISS_TEXTS = ['TOO SLOW!', 'MISSED!', 'WHIFF!', 'NOPE!', 'TOO LATE!'];
export const DAMAGE_TEXTS = ['OUCH!', 'OOF!', 'AGH!', 'ARGH!', 'UGH!'];

// Hold marker tail (should visually match HOLD_THRESHOLD duration)
// At 60 BPM: speed ~340px/sec, 400ms hold = ~136px tail
export const HOLD_TAIL_LENGTH = 120;

// Game balance
export const STARTING_BPM = 55; // Slightly slower start for learning
export const MAX_BPM = 100;
export const BPM_INCREMENT = 3;
export const TEMPO_UP_INTERVAL = 12; // bars between tempo increases
export const FEVER_COMBO_THRESHOLD = 10;
export const ARMORED_INTRO_SCORE = 200;
export const ARMORED_GUARANTEE_BAR = 8;
export const GIANT_INTRO_SCORE = 500;
export const GIANT_INTRO_BAR = 16;
export const MAGE_INTRO_SCORE = 400;
export const MAGE_INTRO_BAR = 12;
