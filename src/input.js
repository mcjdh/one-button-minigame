// ============================================
// INPUT HANDLING
// ============================================
import { DOUBLE_TAP_WINDOW, HOLD_THRESHOLD, HIT_RANGE } from './constants.js';
import { state, dom } from './state.js';
import { playSFX } from './audio.js';
import { showText, spawnParticles } from './render.js';

// Track double-tap progress
let doubleTapState = {
    firstHit: false,
    firstHitTime: 0,
    firstHitDist: 0
};

// ============================================
// INPUT DOWN (key press, mouse down, touch start)
// ============================================
export function handleInputDown() {
    const now = performance.now();
    state.holdStartTime = now;
    state.isHolding = true;
    state.lastTapTime = now;

    // Check for double-tap markers in range
    let hitMarker1 = null;
    let hitMarker2 = null;

    state.beatMarkers.forEach(marker => {
        if (marker.type !== 'defensive' || marker.hit) return;
        const dist = Math.abs(marker.x - state.hitZoneX);
        if (dist < HIT_RANGE) {
            if (!marker.isSecond) {
                hitMarker1 = { marker, dist };
            } else {
                hitMarker2 = { marker, dist };
            }
        }
    });

    // SEQUENTIAL DOUBLE-TAP LOGIC
    if (doubleTapState.firstHit) {
        // We already hit marker 1, now looking for marker 2
        if (hitMarker2) {
            // SUCCESS! Complete the double-tap
            hitMarker2.marker.hit = true;
            hitMarker2.marker.pendingHit = false;
            state.player.stance = 'defensive';
            playSFX('block');
            state.isHolding = false;

            // Timing based on average of both hits
            const avgDist = (doubleTapState.firstHitDist + hitMarker2.dist) / 2;
            showTimingFeedback(avgDist, '#00ffff');

            // Success particles
            for (let i = 0; i < 15; i++) {
                state.particles.push({
                    x: state.hitZoneX,
                    y: dom.canvas.height - 35,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 0.8,
                    color: i % 2 === 0 ? '#00ffff' : '#ffffff'
                });
            }

            // Reset double-tap state
            doubleTapState = { firstHit: false, firstHitTime: 0, firstHitDist: 0 };
        } else {
            // Marker 2 not in range yet - tapped too early for second hit
            // Show feedback but don't fail yet (they might still be waiting)
            showText('WAIT...', state.hitZoneX, dom.canvas.height - 55, '#ffaa00');
            for (let i = 0; i < 4; i++) {
                state.particles.push({
                    x: state.hitZoneX,
                    y: dom.canvas.height - 35,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 2,
                    life: 0.3,
                    color: '#ffaa00'
                });
            }
        }
    } else {
        // Looking for first hit
        if (hitMarker1) {
            // Hit marker 1!
            hitMarker1.marker.hit = true;
            doubleTapState = {
                firstHit: true,
                firstHitTime: now,
                firstHitDist: hitMarker1.dist
            };

            // Mark the second marker as pending (for visual feedback)
            state.beatMarkers.forEach(m => {
                if (m.type === 'defensive' && m.isSecond && !m.hit) {
                    m.pendingHit = true;
                }
            });

            // Visual feedback for first hit
            showText('1!', state.hitZoneX, dom.canvas.height - 55, '#88ffaa');
            for (let i = 0; i < 8; i++) {
                state.particles.push({
                    x: state.hitZoneX,
                    y: dom.canvas.height - 35,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 0.5,
                    color: '#88ffaa'
                });
            }
        }
        // If no defensive marker found, firstTapInfo stays unset
        // and handleInputUp will process as single tap or charge
    }
}

// ============================================
// SHOW TIMING FEEDBACK
// ============================================
function showTimingFeedback(dist, color) {
    let timingText, timingColor;
    if (dist < 25) {
        timingText = 'PERFECT!';
        timingColor = '#ffff00';
        state.screenShake = Math.max(state.screenShake, 4);
        spawnParticles(state.hitZoneX, dom.canvas.height - 35, 8, '#ffff00');
    } else if (dist < 55) {
        timingText = 'GREAT!';
        timingColor = '#88ff88';
        state.screenShake = Math.max(state.screenShake, 2);
    } else {
        timingText = 'OK';
        timingColor = '#aaaaaa';
    }
    showText(timingText, state.hitZoneX, dom.canvas.height - 55, timingColor);
}

// ============================================
// MARK BEAT HIT (for single tap and charge)
// ============================================
export function markBeatHit(actionType) {
    let bestMarker = null;
    let bestDist = Infinity;

    state.beatMarkers.forEach(marker => {
        const dist = Math.abs(marker.x - state.hitZoneX);
        if (!marker.hit && dist < HIT_RANGE && dist < bestDist) {
            // Skip defensive markers for non-defensive actions
            if (marker.type === 'defensive') return;
            bestMarker = marker;
            bestDist = dist;
        }
    });

    const actionColors = {
        aggressive: '#ffff00',
        charge: '#4488ff'
    };
    const pColor = actionColors[actionType] || '#ffffff';

    if (bestMarker) {
        bestMarker.hit = true;
        showTimingFeedback(bestDist, pColor);

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
        // No marker in range
        for (let i = 0; i < 6; i++) {
            state.particles.push({
                x: state.hitZoneX,
                y: dom.canvas.height - 35,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 0.5,
                color: '#666666'
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

    // If defensive action already complete, done
    if (state.player.stance === 'defensive') return;

    // Check if we were in middle of double-tap
    if (doubleTapState.firstHit) {
        // Player released after hitting marker 1 but before completing marker 2
        // This is expected! They need to tap again for marker 2
        // Don't set stance yet - wait for second tap or timeout
        return;
    }

    // Normal single-tap or charge logic
    if (holdDuration >= HOLD_THRESHOLD) {
        state.player.stance = 'charge';
        playSFX('charge');
        markBeatHit('charge');
    } else {
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

        // Auto-trigger charge visual when fully charged
        if (holdDuration >= HOLD_THRESHOLD && state.player.stance === 'idle') {
            // Don't auto-trigger if in middle of double-tap
            if (!doubleTapState.firstHit) {
                state.player.stance = 'charge';
                playSFX('charge');
            }
        }
    } else if (state.chargeLevel > 0) {
        state.chargeLevel *= 0.85;
        if (state.chargeLevel < 0.05) state.chargeLevel = 0;
    }

    // Check for double-tap timeout
    if (doubleTapState.firstHit) {
        const elapsed = performance.now() - doubleTapState.firstHitTime;
        if (elapsed > DOUBLE_TAP_WINDOW) {
            // Timeout! Player didn't hit marker 2 in time
            showText('TOO SLOW!', state.hitZoneX, dom.canvas.height - 55, '#ff6666');

            // Failure particles
            for (let i = 0; i < 8; i++) {
                state.particles.push({
                    x: state.hitZoneX,
                    y: dom.canvas.height - 35,
                    vx: (Math.random() - 0.5) * 5,
                    vy: -Math.random() * 3,
                    life: 0.5,
                    color: '#ff4444'
                });
            }

            // Clear pending state on remaining markers
            state.beatMarkers.forEach(m => {
                if (m.pendingHit) m.pendingHit = false;
            });

            // Set aggressive (wrong action) since they only did one tap
            if (state.player.stance === 'idle') {
                state.player.stance = 'aggressive';
                playSFX('attack');
            }

            doubleTapState = { firstHit: false, firstHitTime: 0, firstHitDist: 0 };
        }
    }
}

// ============================================
// RESET DOUBLE TAP STATE (called on phase change)
// ============================================
export function resetFirstTap() {
    doubleTapState = { firstHit: false, firstHitTime: 0, firstHitDist: 0 };
    state.beatMarkers.forEach(marker => {
        if (marker.pendingHit) {
            marker.pendingHit = false;
        }
    });
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

    // Start overlay
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
