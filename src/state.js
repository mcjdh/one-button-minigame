// ============================================
// SHARED MUTABLE STATE
// ============================================
import { STARTING_BPM, HIT_ZONE_X } from './constants.js';

export const state = {
    // Game control
    gameState: 'title', // 'title', 'playing', 'gameover'
    currentBar: 0,
    phase: 0, // 0-3: enemy appears, choose, clash, aftermath

    // Audio timing
    bpm: STARTING_BPM,
    maxBpmReached: STARTING_BPM, // Track highest BPM for game over stats
    beatInterval: 60 / STARTING_BPM,
    nextBeatTime: 0,
    currentBeat: 0, // 0-3 for the 4-beat cycle

    // Player state
    player: {
        stance: 'idle', // 'idle', 'aggressive', 'defensive', 'stumble', 'charge', 'triple', 'tapthenhold'
        lives: 3,
        score: 0,
        combo: 0,
        hasSeenArmored: false,
        hasSeenGiant: false,
        hasSeenMage: false,
        feverMode: false,
        // Animation state
        animTimer: 0, // General animation timer
        victoryTimer: 0, // Victory pose duration
        damageTimer: 0, // Damage recoil duration
        lastStance: 'idle', // For transition animations
        attackPhase: 0 // 0=none, 1=windup, 2=strike, 3=recovery
    },

    // Cape physics (array of control points)
    // Initialized to hang behind player position (x=60, y~=155)
    capePoints: [
        { x: 52, y: 120, vx: 0, vy: 0 },
        { x: 44, y: 132, vx: 0, vy: 0 },
        { x: 36, y: 144, vx: 0, vy: 0 },
        { x: 28, y: 156, vx: 0, vy: 0 }
    ],

    // Current enemy
    enemy: null,
    enemyQueue: [],
    spawnHistory: [], // Track last 3 enemy types for variety

    // Input state
    inputBuffer: [],
    lastTapTime: 0,
    holdStartTime: 0,
    isHolding: false,
    chargeLevel: 0, // 0-1, for visual feedback

    // High score (loaded from localStorage)
    highScore: parseInt(localStorage.getItem('oneButtonWarriorHighScore')) || 0,

    // Visual effects
    screenShake: 0,
    flashColor: null,
    flashAlpha: 0,
    particles: [],
    floatingTexts: [],
    beatMarkers: [],
    hitZoneX: HIT_ZONE_X,
    deathGhosts: [], // Dying enemies for death animation

    // Juice effects
    hitStop: 0, // Freeze frames on big hits
    chromaOffset: 0, // Chromatic aberration on hits
    slowMo: 1, // Slow motion multiplier (1 = normal)
    comboMilestone: 0, // For milestone celebrations
    lastComboMilestone: 0,

    // WarioWare-style prompt
    bigPrompt: '',
    bigPromptColor: '#ffffff',
    bigPromptScale: 1,
    bigPromptAlpha: 0,

    // Beat pulse for visual rhythm feedback
    beatPulse: 0
};

// ============================================
// DOM REFERENCES (initialized in game.js)
// ============================================
export const dom = {
    canvas: null,
    ctx: null,
    startOverlay: null
};
