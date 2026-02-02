// ============================================
// ONE BUTTON WARRIOR - Main Entry Point
// ============================================
import {
    SCALE,
    STARTING_BPM,
    FEVER_COMBO_THRESHOLD,
    TRACK_DISTANCE,
    FRAMES_PER_SECOND,
    BEATS_TO_HIT,
    DOUBLE_TAP_SPACING,
    TRIPLE_TAP_SPACING,
    TAP_HOLD_SPACING,
    HOLD_TAIL_LENGTH,
    MISS_TEXTS
} from './constants.js';
import { state, dom } from './state.js';
import { initAudio, audioCtx, scheduleBeat, playSFX, playEnemyStinger, startTitleMusic, stopTitleMusic } from './audio.js';
import { drawBackground, drawWarrior, drawEnemy, drawUI, drawEffects, drawCRT, drawGameOver, showBigPrompt, spawnParticles, resetZone, isZoneTransitionActive } from './render.js';
import { spawnEnemy, resolveClash } from './combat.js';
import { updateCharge, setupInputListeners, resetFirstTap } from './input.js';

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
    stopTitleMusic(); // Stop title music if playing from game over
    dom.startOverlay.classList.add('hidden');
    state.gameState = 'playing';
    state.nextBeatTime = audioCtx.currentTime + 0.1;
    state.currentBeat = 0;
    state.currentBar = 0;
    state.phase = 0;
}

export function resetGame() {
    resetZone(); // Reset zone progression
    state.player.lives = 3;
    state.player.score = 0;
    state.player.combo = 0;
    state.player.kills = 0;
    state.player.stance = 'idle';
    state.player.hasSeenArmored = false;
    state.player.hasSeenGiant = false;
    state.player.hasSeenMage = false;
    state.player.feverMode = false;
    state.player.victoryTimer = 0;
    state.player.damageTimer = 0;
    state.player.attackPhase = 0;
    state.enemy = null;
    state.spawnHistory = [];
    state.bpm = STARTING_BPM;
    state.maxBpmReached = STARTING_BPM;
    state.beatInterval = 60 / state.bpm;
    state.particles = [];
    state.floatingTexts = [];
    state.beatMarkers = [];
    state.deathGhosts = [];
    state.screenShake = 0;
    state.flashAlpha = 0;
    state.chargeLevel = 0;
    state.isHolding = false;
    state.hitStop = 0;
    state.chromaOffset = 0;
    state.lastComboMilestone = 0;
    state.comboMilestone = 0;
    state.bigPromptAlpha = 0;
    state.beatPulse = 0;
    state.gameState = 'playing';
    state.nextBeatTime = audioCtx.currentTime + 0.1;
    state.currentBeat = 0;
    state.currentBar = 0;
    state.phase = 0;
    // Reset cape physics to hang behind player
    state.capePoints[0] = { x: 52, y: 120, vx: 0, vy: 0 };
    state.capePoints[1] = { x: 44, y: 132, vx: 0, vy: 0 };
    state.capePoints[2] = { x: 36, y: 144, vx: 0, vy: 0 };
    state.capePoints[3] = { x: 28, y: 156, vx: 0, vy: 0 };
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

    // Update beat markers - use audio time for perfect sync
    // Position is calculated directly from audio clock, not frame-based movement
    // This ensures markers are always perfectly synced to the beat regardless of frame rate
    const pixelsPerSecond = (TRACK_DISTANCE * state.bpm) / (BEATS_TO_HIT * 60);
    const currentTime = audioCtx ? audioCtx.currentTime : 0;

    state.beatMarkers.forEach(marker => {
        if (marker.spawnTime !== undefined) {
            // Time-based position: spawn position minus distance traveled
            const elapsed = currentTime - marker.spawnTime;
            marker.x = marker.spawnX - (elapsed * pixelsPerSecond);
        } else {
            // Fallback for markers without spawnTime (shouldn't happen)
            marker.x -= (TRACK_DISTANCE * state.bpm) / (FRAMES_PER_SECOND * 60 * BEATS_TO_HIT);
        }
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
        case 0: // Enemy announcement (enemy + markers usually pre-spawned on beat 3)
            state.player.stance = 'idle';
            resetFirstTap(); // Clear any stale double-tap state

            // Handle first spawn or edge cases where enemy wasn't pre-spawned
            if (!state.enemy || !state.enemy.alive) {
                spawnEnemy();
                // Spawn markers for this enemy (fallback for first round)
                const markerType = state.enemy.counter;
                const spawnTime = audioCtx ? audioCtx.currentTime : 0;
                const baseX = canvas.width + 20;

                if (markerType === 'defensive') {
                    state.beatMarkers.push({ x: baseX, spawnX: baseX, spawnTime, type: markerType, hit: false, isSecond: false });
                    state.beatMarkers.push({ x: baseX + DOUBLE_TAP_SPACING, spawnX: baseX + DOUBLE_TAP_SPACING, spawnTime, type: markerType, hit: false, isSecond: true });
                } else if (markerType === 'charge') {
                    state.beatMarkers.push({ x: baseX, spawnX: baseX, spawnTime, type: markerType, hit: false, tailLength: HOLD_TAIL_LENGTH });
                } else if (markerType === 'triple') {
                    for (let i = 0; i < 3; i++) {
                        const tripleX = baseX + i * TRIPLE_TAP_SPACING;
                        state.beatMarkers.push({ x: tripleX, spawnX: tripleX, spawnTime, type: markerType, hit: false, tripleIndex: i });
                    }
                } else if (markerType === 'tapthenhold') {
                    state.beatMarkers.push({ x: baseX, spawnX: baseX, spawnTime, type: markerType, hit: false, isTap: true, isHold: false });
                    const holdX = baseX + TAP_HOLD_SPACING;
                    state.beatMarkers.push({ x: holdX, spawnX: holdX, spawnTime, type: markerType, hit: false, isTap: false, isHold: true, tailLength: 50 });
                } else {
                    state.beatMarkers.push({ x: baseX, spawnX: baseX, spawnTime, type: markerType, hit: false });
                }
            }

            // Play announcement for current enemy (suppress during zone transitions)
            if (state.enemy && state.enemy.alive) {
                playEnemyStinger(state.enemy.type);

                // Check if this is a returning enemy (survived a block)
                const isReturning = state.enemy.announced;
                state.enemy.announced = true;

                // Only show text prompts if zone transition isn't active
                if (!isZoneTransitionActive()) {
                    if (isReturning) {
                        showBigPrompt('AGAIN!', '#ffaa00');
                    } else if (state.enemy.type === 'swordsman') {
                        showBigPrompt('SWORDSMAN!', '#ff4444');
                    } else if (state.enemy.type === 'archer') {
                        showBigPrompt('ARCHER!', '#44ff44');
                    } else if (state.enemy.type === 'armored') {
                        showBigPrompt('ARMORED!', '#4488ff');
                    } else if (state.enemy.type === 'giant') {
                        showBigPrompt('GIANT!', '#ff8844');
                    } else if (state.enemy.type === 'mage') {
                        showBigPrompt('MAGE!', '#ff44aa');
                    }
                }
            }
            break;

        case 1: // Choose stance (input window)
            // Show control hint based on enemy type (suppress during zone transitions)
            if (state.enemy && state.enemy.alive && !isZoneTransitionActive()) {
                if (state.enemy.type === 'swordsman') {
                    showBigPrompt('TAP!', '#ffff00');
                } else if (state.enemy.type === 'archer') {
                    showBigPrompt('DOUBLE-TAP!', '#00ffff');
                } else if (state.enemy.type === 'armored') {
                    showBigPrompt('HOLD!', '#4488ff');
                } else if (state.enemy.type === 'giant') {
                    showBigPrompt('TRIPLE-TAP!', '#ff8844');
                } else if (state.enemy.type === 'mage') {
                    showBigPrompt('TAP+HOLD!', '#ff44aa');
                }
            }
            break;

        case 2: // Clash
            if (state.player.stance === 'idle') {
                state.player.stance = 'stumble';
                const missText = MISS_TEXTS[Math.floor(Math.random() * MISS_TEXTS.length)];
                showBigPrompt(missText, '#ff0000');
                playSFX('miss');

                // JUICE: Screen effects
                state.screenShake = 8;
                state.flashColor = '#ff0000';
                state.flashAlpha = 0.15;
                state.hitStop = 4;

                // Big X burst from hit zone
                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * Math.PI * 2;
                    state.particles.push({
                        x: state.hitZoneX,
                        y: canvas.height - 35,
                        vx: Math.cos(angle) * 6 + (Math.random() - 0.5) * 3,
                        vy: Math.sin(angle) * 6 + (Math.random() - 0.5) * 3,
                        life: 0.8,
                        color: i % 2 === 0 ? '#ff0000' : '#ff4444'
                    });
                }

                // Debris from ground
                for (let i = 0; i < 8; i++) {
                    state.particles.push({
                        x: state.hitZoneX + (Math.random() - 0.5) * 40,
                        y: canvas.height - 40,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 6 - 2,
                        life: 1,
                        color: '#333333'
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
                state.flashAlpha = 0.12;
            }
            break;

        case 3: // Aftermath - prepare for next round with anticipation
            // Clear dead enemy
            if (state.enemy && !state.enemy.alive) {
                state.enemy = null;
            }

            // Clear old markers - they've either been hit or passed
            state.beatMarkers = [];

            // Spawn enemy if needed (dead or never existed)
            if (!state.enemy) {
                spawnEnemy();
            }

            // Always spawn fresh markers for current enemy
            if (state.enemy) {
                const markerType = state.enemy.counter;
                const spawnTime = audioCtx ? audioCtx.currentTime : 0;
                const baseX = canvas.width + 20;

                if (markerType === 'defensive') {
                    state.beatMarkers.push({
                        x: baseX, spawnX: baseX, spawnTime,
                        type: markerType, hit: false, isSecond: false
                    });
                    const secondX = baseX + DOUBLE_TAP_SPACING;
                    state.beatMarkers.push({
                        x: secondX, spawnX: secondX, spawnTime,
                        type: markerType, hit: false, isSecond: true
                    });
                } else if (markerType === 'charge') {
                    state.beatMarkers.push({
                        x: baseX, spawnX: baseX, spawnTime,
                        type: markerType, hit: false, tailLength: HOLD_TAIL_LENGTH
                    });
                } else if (markerType === 'triple') {
                    for (let i = 0; i < 3; i++) {
                        const tripleX = baseX + i * TRIPLE_TAP_SPACING;
                        state.beatMarkers.push({
                            x: tripleX, spawnX: tripleX, spawnTime,
                            type: markerType, hit: false, tripleIndex: i
                        });
                    }
                } else if (markerType === 'tapthenhold') {
                    state.beatMarkers.push({
                        x: baseX, spawnX: baseX, spawnTime,
                        type: markerType, hit: false, isTap: true, isHold: false
                    });
                    const holdX = baseX + TAP_HOLD_SPACING;
                    state.beatMarkers.push({
                        x: holdX, spawnX: holdX, spawnTime,
                        type: markerType, hit: false, isTap: false, isHold: true, tailLength: 50
                    });
                } else {
                    state.beatMarkers.push({
                        x: baseX, spawnX: baseX, spawnTime,
                        type: markerType, hit: false
                    });
                }

                // Subtle anticipation - small beat pulse
                state.beatPulse = Math.max(state.beatPulse, 0.3);
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
