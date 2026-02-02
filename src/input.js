// ============================================
// INPUT HANDLING
// ============================================
import { DOUBLE_TAP_WINDOW, HOLD_THRESHOLD, HIT_RANGE } from './constants.js';
import { state, dom } from './state.js';
import { playSFX } from './audio.js';
import { showText } from './render.js';

// ============================================
// INPUT DOWN (key press, mouse down, touch start)
// ============================================
export function handleInputDown() {
    const now = performance.now();
    state.holdStartTime = now;
    state.isHolding = true;

    // Check for double tap
    if (now - state.lastTapTime < DOUBLE_TAP_WINDOW) {
        // Double tap - DEFENSIVE
        state.player.stance = 'defensive';
        playSFX('block');
        state.lastTapTime = 0;
        state.isHolding = false;
        markBeatHit('defensive');
    } else {
        state.lastTapTime = now;
        // Mark first marker of double-tap pair immediately for visual feedback
        state.beatMarkers.forEach(marker => {
            const dist = Math.abs(marker.x - state.hitZoneX);
            if (!marker.hit && dist < HIT_RANGE && marker.type === 'defensive' && !marker.isSecond) {
                marker.hit = true;
                // Small feedback particles for first hit
                for (let i = 0; i < 6; i++) {
                    state.particles.push({
                        x: state.hitZoneX,
                        y: dom.canvas.height - 35,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        life: 0.5,
                        color: '#00ffff'
                    });
                }
            }
        });
    }
}

// ============================================
// MARK BEAT HIT (visual feedback)
// ============================================
export function markBeatHit(actionType) {
    let bestMarker = null;
    let bestDist = Infinity;

    state.beatMarkers.forEach(marker => {
        const dist = Math.abs(marker.x - state.hitZoneX);
        if (!marker.hit && dist < HIT_RANGE && dist < bestDist) {
            bestMarker = marker;
            bestDist = dist;
        }
    });

    // Color based on action type
    const actionColors = {
        aggressive: '#ffff00',
        defensive: '#00ffff',
        charge: '#4488ff'
    };
    const pColor = actionColors[actionType] || '#ffffff';

    if (bestMarker) {
        bestMarker.hit = true;

        // For double-tap, mark BOTH markers as hit
        if (actionType === 'defensive') {
            state.beatMarkers.forEach(m => {
                if (m.type === 'defensive' && !m.hit && Math.abs(m.x - bestMarker.x) < 60) {
                    m.hit = true;
                }
            });
        }

        // Timing feedback
        let timingText, timingColor;
        if (bestDist < 20) {
            timingText = 'PERFECT!';
            timingColor = '#ffff00';
            state.screenShake = Math.max(state.screenShake, 3);
        } else if (bestDist < 45) {
            timingText = 'GREAT';
            timingColor = '#88ff88';
        } else {
            timingText = 'OK';
            timingColor = '#aaaaaa';
        }

        showText(timingText, state.hitZoneX, dom.canvas.height - 55, timingColor);

        // Spawn hit particles
        for (let i = 0; i < 12; i++) {
            state.particles.push({
                x: state.hitZoneX,
                y: dom.canvas.height - 35,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 0.8,
                color: pColor
            });
        }
    } else {
        // No marker in range but still show some feedback
        for (let i = 0; i < 6; i++) {
            state.particles.push({
                x: state.hitZoneX,
                y: dom.canvas.height - 35,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 0.5,
                color: pColor
            });
        }
    }
}

// ============================================
// INPUT UP (key release, mouse up, touch end)
// ============================================
export function handleInputUp() {
    if (!state.isHolding) return;

    const now = performance.now();
    const holdDuration = now - state.holdStartTime;
    state.isHolding = false;

    // If we already set defensive (double-tap), don't override
    if (state.player.stance === 'defensive') return;

    if (holdDuration >= HOLD_THRESHOLD) {
        // CHARGE attack!
        state.player.stance = 'charge';
        playSFX('charge');
        markBeatHit('charge');
    } else {
        // Single tap - AGGRESSIVE
        state.player.stance = 'aggressive';
        playSFX('attack');
        markBeatHit('aggressive');
    }

    state.chargeLevel = 0;
}

// ============================================
// UPDATE CHARGE (called each frame)
// ============================================
export function updateCharge() {
    if (state.isHolding) {
        const holdDuration = performance.now() - state.holdStartTime;
        state.chargeLevel = Math.min(1, holdDuration / HOLD_THRESHOLD);

        // Auto-trigger charge visual/sound when fully charged
        if (holdDuration >= HOLD_THRESHOLD && state.player.stance === 'idle') {
            state.player.stance = 'charge';
            playSFX('charge');
        }
    } else if (state.chargeLevel > 0) {
        state.chargeLevel *= 0.85; // Smooth decay
        if (state.chargeLevel < 0.05) state.chargeLevel = 0;
    }
}

// ============================================
// SETUP INPUT LISTENERS
// ============================================
export function setupInputListeners(startGame, resetGame) {
    const { canvas } = dom;

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.repeat) {
            e.preventDefault();
            if (state.gameState === 'title') {
                startGame();
            } else if (state.gameState === 'gameover') {
                resetGame();
            } else if (state.gameState === 'playing') {
                // Accept input during phase 0 (late), 1 (on time), or early phase 2
                if (state.phase === 1 || state.phase === 0 || state.phase === 2) {
                    handleInputDown();
                }
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (state.gameState === 'playing') {
                handleInputUp();
            }
        }
    });

    // Mouse
    canvas.addEventListener('mousedown', () => {
        if (state.gameState === 'title') {
            startGame();
        } else if (state.gameState === 'gameover') {
            resetGame();
        } else if (state.gameState === 'playing') {
            if (state.phase === 1 || state.phase === 0 || state.phase === 2) {
                handleInputDown();
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (state.gameState === 'playing') {
            handleInputUp();
        }
    });

    // Touch
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (state.gameState === 'title') {
            startGame();
        } else if (state.gameState === 'gameover') {
            resetGame();
        } else if (state.gameState === 'playing') {
            if (state.phase === 1 || state.phase === 0 || state.phase === 2) {
                handleInputDown();
            }
        }
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (state.gameState === 'playing') {
            handleInputUp();
        }
    });

    // Start overlay click handler
    dom.startOverlay.addEventListener('click', () => {
        if (state.gameState === 'title') {
            startGame();
        }
    });

    dom.startOverlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (state.gameState === 'title') {
            startGame();
        }
    });
}
