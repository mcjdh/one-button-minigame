// ============================================
// ONE BUTTON WARRIOR - Main Entry Point
// ============================================
import {
    SCALE,
    STARTING_BPM,
    MAX_BPM,
    BPM_INCREMENT,
    TEMPO_UP_INTERVAL,
    FEVER_COMBO_THRESHOLD,
    TRACK_DISTANCE,
    FRAMES_PER_SECOND
} from './constants.js';
import { state, dom } from './state.js';
import { initAudio, audioCtx, scheduleBeat, playSFX } from './audio.js';
import { drawBackground, drawWarrior, drawEnemy, drawUI, drawEffects, drawCRT, drawGameOver, showBigPrompt, spawnParticles } from './render.js';
import { spawnEnemy, resolveClash } from './combat.js';
import { updateCharge, setupInputListeners } from './input.js';

// ============================================
// INITIALIZATION
// ============================================
function init() {
    // Set up DOM references
    dom.canvas = document.getElementById('game');
    dom.ctx = dom.canvas.getContext('2d');
    dom.startOverlay = document.getElementById('startOverlay');

    // Scale canvas for crisp pixels
    dom.canvas.style.width = dom.canvas.width * SCALE + 'px';
    dom.canvas.style.height = dom.canvas.height * SCALE + 'px';

    // Set up input listeners
    setupInputListeners(startGame, resetGame);

    // Start the game loop
    gameLoop();
}

// ============================================
// GAME CONTROL
// ============================================
export function startGame() {
    initAudio();
    dom.startOverlay.classList.add('hidden');
    state.gameState = 'playing';
    state.nextBeatTime = audioCtx.currentTime + 0.1;
    state.currentBeat = 0;
    state.currentBar = 0;
    state.phase = 0;
}

export function resetGame() {
    state.player.lives = 3;
    state.player.score = 0;
    state.player.combo = 0;
    state.player.stance = 'idle';
    state.player.hasSeenArmored = false;
    state.player.feverMode = false;
    state.enemy = null;
    state.bpm = STARTING_BPM;
    state.beatInterval = 60 / state.bpm;
    state.particles = [];
    state.floatingTexts = [];
    state.beatMarkers = [];
    state.screenShake = 0;
    state.flashAlpha = 0;
    state.chargeLevel = 0;
    state.isHolding = false;
    state.gameState = 'playing';
    state.nextBeatTime = audioCtx.currentTime + 0.1;
    state.currentBeat = 0;
    state.currentBar = 0;
    state.phase = 0;
}

// ============================================
// UPDATE
// ============================================
function update() {
    if (state.gameState !== 'playing') return;

    // Update charge state
    updateCharge();

    // Move enemy toward target
    if (state.enemy && state.enemy.x > state.enemy.targetX) {
        state.enemy.x -= 3;
    }

    // Update beat markers - move toward hit zone
    // speed = distance / frames = TRACK_DISTANCE / (FRAMES_PER_SECOND * secondsPerBeat)
    const markerSpeed = (TRACK_DISTANCE * state.bpm) / (FRAMES_PER_SECOND * 60);
    state.beatMarkers.forEach(marker => {
        marker.x -= markerSpeed;
    });

    // Remove markers that have passed or been hit
    state.beatMarkers = state.beatMarkers.filter(m => m.x > -50 && !m.hit);

    // Screen shake decay
    if (state.screenShake > 0) state.screenShake *= 0.9;
}

// ============================================
// RENDER
// ============================================
function render() {
    const { ctx, canvas } = dom;

    // HIT-STOP: Skip rendering during freeze frames for impact
    if (state.hitStop > 0) {
        state.hitStop--;
        // Still draw but with slight zoom for impact
        ctx.save();
        const zoomAmount = 1 + state.hitStop * 0.002;
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.scale(zoomAmount, zoomAmount);
        ctx.translate(-canvas.width/2, -canvas.height/2);
    } else {
        ctx.save();
    }

    // Apply screen shake
    if (state.screenShake > 0.5) {
        ctx.translate(
            (Math.random() - 0.5) * state.screenShake,
            (Math.random() - 0.5) * state.screenShake
        );
    }

    drawBackground();

    if (state.gameState === 'playing' || state.gameState === 'gameover') {
        drawWarrior();
        if (state.enemy && state.enemy.alive) drawEnemy();
        drawUI();
        drawEffects();
    }

    if (state.gameState === 'gameover') {
        drawGameOver();
    }

    ctx.restore();

    // CRT effects on top (outside transform)
    drawCRT();
}

// ============================================
// BEAT SCHEDULER
// ============================================
function schedulerTick() {
    if (!audioCtx || state.gameState !== 'playing') return;

    while (state.nextBeatTime < audioCtx.currentTime + 0.1) {
        scheduleBeat(state.currentBeat, state.nextBeatTime);

        // Advance phase on each beat
        advancePhase();

        state.currentBeat = (state.currentBeat + 1) % 4;
        if (state.currentBeat === 0) state.currentBar++;

        state.nextBeatTime += state.beatInterval;
    }
}

// ============================================
// PHASE MANAGEMENT
// ============================================
function advancePhase() {
    const { canvas } = dom;
    state.phase = state.currentBeat;

    switch (state.phase) {
        case 0: // Enemy appears
            state.player.stance = 'idle';
            if (!state.enemy || !state.enemy.alive) {
                spawnEnemy();
                // WarioWare-style enemy announcement
                if (state.enemy.type === 'swordsman') {
                    showBigPrompt('SWORDSMAN!', '#ff4444');
                } else if (state.enemy.type === 'archer') {
                    showBigPrompt('ARCHER!', '#44ff44');
                } else if (state.enemy.type === 'armored') {
                    showBigPrompt('ARMORED!', '#4488ff');
                }
            } else {
                // Enemy returning
                showBigPrompt('AGAIN!', '#ffaa00');
            }

            // Spawn beat marker(s) based on enemy type
            const markerType = state.enemy ? state.enemy.counter : 'aggressive';

            if (markerType === 'defensive') {
                // DOUBLE TAP: Two markers close together
                state.beatMarkers.push({
                    x: canvas.width + 50,
                    type: markerType,
                    hit: false,
                    isSecond: false
                });
                state.beatMarkers.push({
                    x: canvas.width + 20, // Second marker slightly behind
                    type: markerType,
                    hit: false,
                    isSecond: true
                });
            } else if (markerType === 'charge') {
                // HOLD: Long note with tail
                state.beatMarkers.push({
                    x: canvas.width + 20,
                    type: markerType,
                    hit: false,
                    tailLength: 80 // Length of the hold tail
                });
            } else {
                // SINGLE TAP: Normal marker
                state.beatMarkers.push({
                    x: canvas.width + 20,
                    type: markerType,
                    hit: false
                });
            }
            break;

        case 1: // Choose stance (input window)
            // Show control hint based on enemy type
            if (state.enemy && state.enemy.alive) {
                if (state.enemy.type === 'swordsman') {
                    showBigPrompt('TAP!', '#ffff00');
                } else if (state.enemy.type === 'archer') {
                    showBigPrompt('DOUBLE-TAP!', '#00ffff');
                } else if (state.enemy.type === 'armored') {
                    showBigPrompt('HOLD!', '#4488ff');
                }
            }
            break;

        case 2: // Clash
            if (state.player.stance === 'idle') {
                state.player.stance = 'stumble';
                showBigPrompt('TOO SLOW!', '#ff0000');
                playSFX('miss');
                // Miss particles burst from hit zone
                for (let i = 0; i < 10; i++) {
                    state.particles.push({
                        x: state.hitZoneX,
                        y: canvas.height - 35,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        life: 0.6,
                        color: '#ff0000'
                    });
                }
            }
            resolveClash();

            // Check for fever mode activation
            if (state.player.combo >= FEVER_COMBO_THRESHOLD && !state.player.feverMode) {
                state.player.feverMode = true;
                playSFX('fever');
                showBigPrompt('FEVER MODE!', '#ff00ff');
                state.screenShake = 10;
                state.flashColor = '#ff00ff';
                state.flashAlpha = 0.6;
            }
            break;

        case 3: // Aftermath
            // Prepare for next round
            if (state.enemy && !state.enemy.alive) {
                state.enemy = null;
            }
            // Increase tempo over time
            if (state.currentBar > 0 && state.currentBar % TEMPO_UP_INTERVAL === 0) {
                state.bpm = Math.min(state.bpm + BPM_INCREMENT, MAX_BPM);
                state.beatInterval = 60 / state.bpm;
                showBigPrompt('TEMPO UP!', '#ff8800');
            }
            break;
    }
}

// ============================================
// GAME LOOP
// ============================================
function gameLoop() {
    update();
    render();
    schedulerTick();
    requestAnimationFrame(gameLoop);
}

// ============================================
// START
// ============================================
init();
