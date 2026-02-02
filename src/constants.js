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
// With BEATS_TO_HIT=2, markers move at half speed, so halve spacing to maintain timing feel
// 35px at 170px/sec = ~0.2 seconds gap (snappy quarter-beat feel)
export const DOUBLE_TAP_SPACING = 35;

// Triple-tap (Giant) settings
export const TRIPLE_TAP_SPACING = 25; // Halved for new timing - ~0.15s between each tap
export const TRIPLE_TAP_WINDOW = 600; // ms - longer window for 3 taps

// Tap-hold (Mage) settings
export const TAP_HOLD_WINDOW = 400; // ms - time to start hold after tap
export const TAP_HOLD_DURATION = 300; // ms - how long to hold after tap
export const TAP_HOLD_SPACING = 30; // Halved - ~0.18s between tap and hold start

// Beat track
export const HIT_ZONE_X = 80; // Where you should hit
export const HIT_RANGE = 110; // Very forgiving hit detection range
export const TRACK_START_X = 420; // Where markers spawn (off-screen right)
export const TRACK_DISTANCE = 340; // Distance markers travel (TRACK_START_X - HIT_ZONE_X)
export const FRAMES_PER_SECOND = 60;
export const BEATS_TO_HIT = 2; // Markers take 2 beats to reach hit zone (spawn beat 3 → arrive beat 1)

// Note frequencies (pentatonic scale in C)
export const NOTES = {
    C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
};

// Chord progression: I - V - vi - IV (C - G - Am - F) - Simplified
export const CHORD_ROOTS = [NOTES.C3, NOTES.G3, NOTES.A3, NOTES.C3];

// Enemy type definitions - vibrant distinct colors
export const ENEMY_TYPES = {
    swordsman: { color: '#e63946', eyes: '#ff6b6b', weapon: 'sword', counter: 'aggressive' },    // Crimson red
    archer: { color: '#2a9d8f', eyes: '#40ffdc', weapon: 'bow', counter: 'defensive' },          // Teal green
    armored: { color: '#457b9d', eyes: '#90e0ef', weapon: 'shield', counter: 'charge' },         // Steel blue
    giant: { color: '#e76f51', eyes: '#ffba08', weapon: 'club', counter: 'triple' },             // Burnt orange
    mage: { color: '#9d4edd', eyes: '#e0aaff', weapon: 'staff', counter: 'tapthenhold' }         // Royal purple
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
export const STARTING_BPM = 60; // Comfortable starting pace
export const MAX_BPM = 130;     // Fast but achievable max
export const BPM_INCREMENT = 3;
export const BPM_PER_KILL = 1;  // Gradual ramp per enemy slain
export const BPM_DAMAGE_PENALTY = -5; // Slow down on damage for recovery
export const TEMPO_UP_INTERVAL = 12; // bars between tempo increases (legacy)
export const FEVER_COMBO_THRESHOLD = 10;
export const ARMORED_INTRO_SCORE = 200;
export const ARMORED_GUARANTEE_BAR = 8;
export const GIANT_INTRO_SCORE = 500;
export const GIANT_INTRO_BAR = 16;
export const MAGE_INTRO_SCORE = 400;
export const MAGE_INTRO_BAR = 12;
