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
        feverMode: false
    },

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
