// ============================================
// INPUT HANDLING
// ============================================
import {
    DOUBLE_TAP_WINDOW, HOLD_THRESHOLD, HIT_RANGE,
    TRIPLE_TAP_WINDOW, TAP_HOLD_WINDOW, TAP_HOLD_DURATION
} from './constants.js';
import { state, dom } from './state.js';
import { playSFX } from './audio.js';
import { showText, spawnParticles } from './render.js';

// Track double-tap progress
let doubleTapState = {
    firstHit: false,
    firstHitTime: 0,
    firstHitDist: 0
};

// Track triple-tap progress (Giant)
let tripleTapState = {
    hitCount: 0, // 0, 1, 2, or 3
    firstHitTime: 0,
    totalDist: 0
};

// Track tap-hold progress (Mage)
let tapHoldState = {
    tapped: false,
    tapTime: 0,
    holdStarted: false,
    holdStartTime: 0
};

// ============================================
// INPUT DOWN (key press, mouse down, touch start)
// ============================================
export function handleInputDown() {
    const now = performance.now();
    state.holdStartTime = now;
    state.isHolding = true;
    state.lastTapTime = now;

    // Check if we're continuing a tap-hold sequence (second press for hold)
    if (tapHoldState.tapped && !tapHoldState.holdStarted) {
        const elapsed = now - tapHoldState.tapTime;
        if (elapsed < TAP_HOLD_WINDOW) {
            // Start the hold phase!
            tapHoldState.holdStarted = true;
            tapHoldState.holdStartTime = now;
            showText('HOLD!', state.hitZoneX, dom.canvas.height - 55, '#ff44aa');
            return;
        }
    }

    // Find markers in range by type
    const markersInRange = findMarkersInRange();

    // TRIPLE-TAP LOGIC (Giant)
    if (markersInRange.triple.length > 0 || tripleTapState.hitCount > 0) {
        handleTripleTap(now, markersInRange.triple);
        return;
    }

    // DOUBLE-TAP LOGIC (Archer)
    if (markersInRange.defensive.length > 0 || doubleTapState.firstHit) {
        handleDoubleTap(now, markersInRange.defensive);
        return;
    }

    // TAP-HOLD LOGIC - First tap (Mage)
    if (markersInRange.tapthenhold.length > 0) {
        handleTapHoldFirstTap(now, markersInRange.tapthenhold[0]);
        return;
    }

    // Otherwise, let handleInputUp deal with single tap or charge
}

// Find all markers in range, grouped by type
function findMarkersInRange() {
    const result = {
        defensive: [],
        triple: [],
        tapthenhold: [],
        other: []
    };

    state.beatMarkers.forEach(marker => {
        if (marker.hit) return;
        const dist = Math.abs(marker.x - state.hitZoneX);
        if (dist < HIT_RANGE) {
            const entry = { marker, dist };
            if (marker.type === 'defensive') {
                result.defensive.push(entry);
            } else if (marker.type === 'triple') {
                result.triple.push(entry);
            } else if (marker.type === 'tapthenhold' && marker.isTap) {
                // Only push tap markers for initial detection
                result.tapthenhold.push(entry);
            } else {
                result.other.push(entry);
            }
        }
    });

    // Sort by tripleIndex for triple markers
    result.triple.sort((a, b) => a.marker.tripleIndex - b.marker.tripleIndex);

    return result;
}

// Handle double-tap input (Archer)
function handleDoubleTap(now, defensiveMarkers) {
    // Sort to get marker 1 (isSecond: false) and marker 2 (isSecond: true)
    const marker1 = defensiveMarkers.find(m => !m.marker.isSecond);
    const marker2 = defensiveMarkers.find(m => m.marker.isSecond);

    if (doubleTapState.firstHit) {
        // Looking for marker 2
        if (marker2) {
            // SUCCESS!
            marker2.marker.hit = true;
            marker2.marker.pendingHit = false;
            state.player.stance = 'defensive';
            playSFX('block');
            state.isHolding = false;

            const avgDist = (doubleTapState.firstHitDist + marker2.dist) / 2;
            showTimingFeedback(avgDist, '#00ffff');
            spawnSuccessParticles('#00ffff');
            doubleTapState = { firstHit: false, firstHitTime: 0, firstHitDist: 0 };
        } else {
            showText('WAIT...', state.hitZoneX, dom.canvas.height - 55, '#ffaa00');
            spawnSmallParticles('#ffaa00', 4);
        }
    } else if (marker1) {
        // First hit
        marker1.marker.hit = true;
        doubleTapState = { firstHit: true, firstHitTime: now, firstHitDist: marker1.dist };

        // Mark second marker as pending
        state.beatMarkers.forEach(m => {
            if (m.type === 'defensive' && m.isSecond && !m.hit) {
                m.pendingHit = true;
            }
        });

        showText('1!', state.hitZoneX, dom.canvas.height - 55, '#88ffaa');
        spawnSmallParticles('#88ffaa', 8);
    }
}

// Handle triple-tap input (Giant)
function handleTripleTap(now, tripleMarkers) {
    // Find the next marker to hit based on tripleIndex
    const nextIndex = tripleTapState.hitCount;
    const nextMarker = tripleMarkers.find(m => m.marker.tripleIndex === nextIndex);

    if (nextMarker) {
        // Hit this marker!
        nextMarker.marker.hit = true;
        tripleTapState.hitCount++;
        tripleTapState.totalDist += nextMarker.dist;

        if (tripleTapState.hitCount === 1) {
            tripleTapState.firstHitTime = now;
        }

        // Mark next marker as pending
        state.beatMarkers.forEach(m => {
            if (m.type === 'triple' && m.tripleIndex === nextIndex + 1 && !m.hit) {
                m.pendingHit = true;
            }
        });

        if (tripleTapState.hitCount >= 3) {
            // SUCCESS! All three hit
            state.player.stance = 'triple';
            playSFX('hit');
            state.isHolding = false;

            const avgDist = tripleTapState.totalDist / 3;
            showTimingFeedback(avgDist, '#ff8844');
            spawnSuccessParticles('#ff8844');
            tripleTapState = { hitCount: 0, firstHitTime: 0, totalDist: 0 };
        } else {
            showText(`${tripleTapState.hitCount}!`, state.hitZoneX, dom.canvas.height - 55, '#ffaa66');
            spawnSmallParticles('#ffaa66', 6);
        }
    } else if (tripleTapState.hitCount > 0) {
        // In progress but next marker not in range yet
        showText('WAIT...', state.hitZoneX, dom.canvas.height - 55, '#ffaa00');
        spawnSmallParticles('#ffaa00', 4);
    }
}

// Handle first tap of tap-hold (Mage)
function handleTapHoldFirstTap(now, markerEntry) {
    // Register the tap, but DON'T set isHolding false yet
    // Player needs to release and press again to hold
    tapHoldState = {
        tapped: true,
        tapTime: now,
        holdStarted: false,
        holdStartTime: 0
    };

    // Mark tap marker as hit
    markerEntry.marker.hit = true;
    markerEntry.marker.tapRegistered = true;

    // Set hold marker as pending
    state.beatMarkers.forEach(m => {
        if (m.type === 'tapthenhold' && m.isHold && !m.hit) {
            m.pendingHit = true;
        }
    });

    showText('TAP!', state.hitZoneX, dom.canvas.height - 55, '#ff44aa');
    spawnSmallParticles('#ff44aa', 6);
}

// Helper: spawn success particles
function spawnSuccessParticles(color) {
    for (let i = 0; i < 15; i++) {
        state.particles.push({
            x: state.hitZoneX,
            y: dom.canvas.height - 35,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 0.8,
            color: i % 2 === 0 ? color : '#ffffff'
        });
    }
}

// Helper: spawn small particles
function spawnSmallParticles(color, count) {
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x: state.hitZoneX,
            y: dom.canvas.height - 35,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 0.5,
            color: color
        });
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
            // Skip markers that have their own input handling
            if (marker.type === 'defensive' || marker.type === 'triple' || marker.type === 'tapthenhold') return;
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

    // If action already complete, done
    if (state.player.stance === 'defensive' || state.player.stance === 'triple' || state.player.stance === 'tapthenhold') return;

    // Check if we were in middle of double-tap
    if (doubleTapState.firstHit) {
        // Player released after hitting marker 1 but before completing marker 2
        // This is expected! They need to tap again for marker 2
        return;
    }

    // Check if we were in middle of triple-tap
    if (tripleTapState.hitCount > 0) {
        // Player released but hasn't completed all 3 hits
        // This is expected! They need to tap again
        return;
    }

    // Check if this release completes the tap part of tap-hold
    if (tapHoldState.tapped && !tapHoldState.holdStarted) {
        // Tap registered, now waiting for hold press
        // Update tapTime to release time so window starts from here
        tapHoldState.tapTime = now;
        return;
    }

    // Check if holding during tap-hold
    if (tapHoldState.holdStarted) {
        // Released too early during hold phase
        showText('HOLD LONGER!', state.hitZoneX, dom.canvas.height - 55, '#ff6666');
        spawnSmallParticles('#ff6666', 6);

        // Clear hold state on markers
        state.beatMarkers.forEach(m => {
            if (m.type === 'tapthenhold' && m.isHold) {
                m.holdActive = false;
                m.holdProgress = 0;
                m.pendingHit = false;
            }
        });

        tapHoldState = { tapped: false, tapTime: 0, holdStarted: false, holdStartTime: 0 };
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
    const now = performance.now();

    if (state.isHolding) {
        const holdDuration = now - state.holdStartTime;
        state.chargeLevel = Math.min(1, holdDuration / HOLD_THRESHOLD);

        // Check tap-hold completion
        if (tapHoldState.holdStarted) {
            const holdElapsed = now - tapHoldState.holdStartTime;

            // Update hold marker visual state
            state.beatMarkers.forEach(m => {
                if (m.type === 'tapthenhold' && m.isHold && !m.hit) {
                    m.holdActive = true;
                    m.holdProgress = Math.min(1, holdElapsed / TAP_HOLD_DURATION);
                }
            });

            if (holdElapsed >= TAP_HOLD_DURATION) {
                // SUCCESS! Tap-hold complete
                state.player.stance = 'tapthenhold';
                state.isHolding = false;
                playSFX('block');

                // Mark the hold marker as hit
                state.beatMarkers.forEach(m => {
                    if (m.type === 'tapthenhold' && m.isHold) {
                        m.hit = true;
                        m.holdActive = false;
                        m.pendingHit = false;
                    }
                });

                showTimingFeedback(30, '#ff44aa'); // Good timing feedback
                spawnSuccessParticles('#ff44aa');
                tapHoldState = { tapped: false, tapTime: 0, holdStarted: false, holdStartTime: 0 };
            }
            return; // Don't do normal charge logic during tap-hold
        }

        // Auto-trigger charge visual when fully charged
        if (holdDuration >= HOLD_THRESHOLD && state.player.stance === 'idle') {
            // Don't auto-trigger if in middle of multi-tap sequences
            if (!doubleTapState.firstHit && tripleTapState.hitCount === 0 && !tapHoldState.tapped) {
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
        const elapsed = now - doubleTapState.firstHitTime;
        if (elapsed > DOUBLE_TAP_WINDOW) {
            handleTimeout('double');
        }
    }

    // Check for triple-tap timeout
    if (tripleTapState.hitCount > 0) {
        const elapsed = now - tripleTapState.firstHitTime;
        if (elapsed > TRIPLE_TAP_WINDOW) {
            handleTimeout('triple');
        }
    }

    // Check for tap-hold timeout (tap registered but no hold started)
    if (tapHoldState.tapped && !tapHoldState.holdStarted) {
        const elapsed = now - tapHoldState.tapTime;
        if (elapsed > TAP_HOLD_WINDOW) {
            handleTimeout('tapthenhold');
        }
    }
}

// Handle timeout for multi-tap sequences
function handleTimeout(type) {
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

    // Clear pending/active state on remaining markers
    state.beatMarkers.forEach(m => {
        if (m.pendingHit) m.pendingHit = false;
        if (m.holdActive) {
            m.holdActive = false;
            m.holdProgress = 0;
        }
    });

    // Set wrong stance
    if (state.player.stance === 'idle') {
        state.player.stance = 'aggressive';
        playSFX('attack');
    }

    // Reset the appropriate state
    if (type === 'double') {
        doubleTapState = { firstHit: false, firstHitTime: 0, firstHitDist: 0 };
    } else if (type === 'triple') {
        tripleTapState = { hitCount: 0, firstHitTime: 0, totalDist: 0 };
    } else if (type === 'tapthenhold') {
        tapHoldState = { tapped: false, tapTime: 0, holdStarted: false, holdStartTime: 0 };
    }
}

// ============================================
// RESET ALL INPUT STATES (called on phase change)
// ============================================
export function resetFirstTap() {
    doubleTapState = { firstHit: false, firstHitTime: 0, firstHitDist: 0 };
    tripleTapState = { hitCount: 0, firstHitTime: 0, totalDist: 0 };
    tapHoldState = { tapped: false, tapTime: 0, holdStarted: false, holdStartTime: 0 };
    state.beatMarkers.forEach(marker => {
        if (marker.pendingHit) {
            marker.pendingHit = false;
        }
        if (marker.tapRegistered) {
            marker.tapRegistered = false;
        }
        if (marker.holdActive) {
            marker.holdActive = false;
            marker.holdProgress = 0;
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

    // Prevent scrolling/zooming on mobile during gameplay
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

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
