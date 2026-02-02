// ============================================
// COMBAT SYSTEM
// ============================================
import {
    ENEMY_TYPES, KILL_TEXTS, CRIT_TEXTS, OVERKILL_TEXTS, DAMAGE_TEXTS,
    ARMORED_INTRO_SCORE, ARMORED_GUARANTEE_BAR,
    GIANT_INTRO_SCORE, GIANT_INTRO_BAR,
    MAGE_INTRO_SCORE, MAGE_INTRO_BAR,
    BPM_PER_KILL, BPM_DAMAGE_PENALTY, MAX_BPM, STARTING_BPM
} from './constants.js';
import { state, dom } from './state.js';
import { playSFX, playGameOverJingle, playCrash, playTone } from './audio.js';
import { showText, showBigPrompt, spawnParticles, getCurrentZone } from './render.js';

// ============================================
// ENEMY SPAWNING
// ============================================
export function spawnEnemy() {
    const { canvas } = dom;

    // Build available types based on progression
    let types = ['swordsman', 'archer'];
    if (state.player.score >= ARMORED_INTRO_SCORE || state.currentBar >= ARMORED_GUARANTEE_BAR) {
        types.push('armored');
    }
    if (state.player.score >= GIANT_INTRO_SCORE || state.currentBar >= GIANT_INTRO_BAR) {
        types.push('giant');
    }
    if (state.player.score >= MAGE_INTRO_SCORE || state.currentBar >= MAGE_INTRO_BAR) {
        types.push('mage');
    }

    // Guarantee first armored around bar 8 to teach the mechanic
    if (state.currentBar >= ARMORED_GUARANTEE_BAR && state.currentBar < ARMORED_GUARANTEE_BAR + 4 && !state.player.hasSeenArmored) {
        types = ['armored'];
        state.player.hasSeenArmored = true;
    }
    // Guarantee first giant around bar 16
    if (state.currentBar >= GIANT_INTRO_BAR && state.currentBar < GIANT_INTRO_BAR + 4 && !state.player.hasSeenGiant) {
        types = ['giant'];
        state.player.hasSeenGiant = true;
    }
    // Guarantee first mage around bar 12
    if (state.currentBar >= MAGE_INTRO_BAR && state.currentBar < MAGE_INTRO_BAR + 4 && !state.player.hasSeenMage) {
        types = ['mage'];
        state.player.hasSeenMage = true;
    }

    // Apply spawn variety - prevent 3+ of same type in a row
    const type = selectWithVariety(types);

    // Track spawn history (keep last 3)
    state.spawnHistory.push(type);
    if (state.spawnHistory.length > 3) {
        state.spawnHistory.shift();
    }

    state.enemy = {
        type: type,
        ...ENEMY_TYPES[type],
        x: canvas.width + 50,
        targetX: canvas.width - 100,
        y: canvas.height - 80,
        alive: true,
        staggered: false,
        announced: false // Track if enemy has been announced (for "AGAIN!" on survive)
    };
}

// Weighted selection to prevent repetitive spawns
function selectWithVariety(types) {
    const history = state.spawnHistory;

    // If only one type available, use it
    if (types.length === 1) return types[0];

    // Check if last two spawns were the same type
    const lastTwo = history.slice(-2);
    const repeatedType = lastTwo.length === 2 && lastTwo[0] === lastTwo[1] ? lastTwo[0] : null;

    // If we have a repeated type, exclude it from selection
    if (repeatedType && types.includes(repeatedType)) {
        const filtered = types.filter(t => t !== repeatedType);
        if (filtered.length > 0) {
            return filtered[Math.floor(Math.random() * filtered.length)];
        }
    }

    // Otherwise, weight against the last spawned type (50% less likely)
    const lastType = history[history.length - 1];
    if (lastType && types.includes(lastType)) {
        // Build weighted pool: each type gets 2 entries, last type gets 1
        const pool = [];
        types.forEach(t => {
            pool.push(t);
            if (t !== lastType) pool.push(t); // Double weight for non-recent
        });
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // Default: uniform random
    return types[Math.floor(Math.random() * types.length)];
}

// ============================================
// DEATH GHOST SPAWNING
// ============================================
function spawnDeathGhost(enemy) {
    state.deathGhosts.push({
        x: enemy.x,
        y: enemy.y,
        type: enemy.type,
        color: enemy.color,
        life: 1.0,
        vy: -2, // Initial upward pop
        vx: (Math.random() - 0.5) * 3,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        scale: 1.0
    });
}

// ============================================
// ZONE TRANSITION CHECK
// ============================================
const KILLS_PER_ZONE = 5; // Match render.js - every 5 kills = new zone

function checkZoneTransition(oldKills, newKills) {
    const oldZone = Math.floor(oldKills / KILLS_PER_ZONE);
    const newZone = Math.floor(newKills / KILLS_PER_ZONE);

    if (newZone > oldZone && newKills > 0) {
        // Epic zone transition sound - dramatic fanfare
        playCrash(); // Crash cymbal
        // Rising triumphant notes
        playTone(261.63, 0.3, 'square', 0.3); // C4
        setTimeout(() => playTone(329.63, 0.3, 'square', 0.35), 100); // E4
        setTimeout(() => playTone(392.00, 0.4, 'square', 0.4), 200); // G4
        setTimeout(() => playTone(523.25, 0.5, 'square', 0.35), 300); // C5
    }
}

// ============================================
// BPM ADJUSTMENT
// ============================================
function adjustBPM(delta) {
    const oldBPM = state.bpm;
    state.bpm = Math.max(STARTING_BPM, Math.min(MAX_BPM, state.bpm + delta));
    state.beatInterval = 60 / state.bpm;

    // Track max BPM reached
    if (state.bpm > state.maxBpmReached) {
        state.maxBpmReached = state.bpm;
    }

    // Visual feedback at tempo milestones - zone-colored
    const zone = getCurrentZone();
    if (delta > 0 && state.bpm !== oldBPM) {
        // Show "FASTER!" every 10 BPM
        if (Math.floor(state.bpm / 10) > Math.floor(oldBPM / 10)) {
            showBigPrompt('FASTER!', zone.killParticle);
        }
    } else if (delta < 0 && state.bpm !== oldBPM) {
        // Visual cue for slowdown (recovery)
        showText('tempo ↓', dom.canvas.width / 2, 80, zone.accentAlt);
    }

    return state.bpm !== oldBPM;
}

// ============================================
// COMBAT RESOLUTION
// ============================================
export function resolveClash() {
    const { player, enemy } = state;

    if (!enemy || !enemy.alive) return;

    const stance = player.stance;
    const correct = stance === enemy.counter;

    // Dice roll for variance
    const roll = Math.random();

    if (stance === 'stumble') {
        // Stumble always takes damage (with graze chance)
        if (roll < 0.2) {
            // GRAZE! Lucky dodge - celebrate it! - zone-colored
            const zone = getCurrentZone();
            state.flashColor = zone.comboGlow;
            state.flashAlpha = 0.1;
            state.screenShake = 5;
            state.hitStop = 3;
            showBigPrompt('GRAZE!', zone.comboGlow);
            playSFX('graze');

            // Sparks flying past player - zone-colored
            for (let i = 0; i < 12; i++) {
                state.particles.push({
                    x: 70 + Math.random() * 20,
                    y: dom.canvas.height - 50 - Math.random() * 30,
                    vx: 4 + Math.random() * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 0.8,
                    color: i % 2 === 0 ? zone.comboGlow : '#ffffff'
                });
            }
        } else {
            takeDamage();
        }
    } else if (correct) {
        // Correct stance - KILL with crit chance
        enemy.alive = false;
        spawnDeathGhost(enemy);
        adjustBPM(BPM_PER_KILL); // Speed up the rhythm!
        player.combo++;
        const oldKills = player.kills;
        player.kills++; // Track total kills for zone progression
        checkZoneTransition(oldKills, player.kills);
        player.victoryTimer = 0.8; // Trigger victory animation

        // Fever mode = guaranteed crits!
        const feverBonus = player.feverMode ? 0.3 : 0; // Boost crit chance

        // Charge attacks are always powerful - MAX JUICE
        if (stance === 'charge') {
            player.score += 250;
            state.screenShake = 20;
            state.hitStop = 12; // FREEZE FRAME!
            state.chromaOffset = 8; // Chromatic aberration
            state.flashColor = '#4488ff';
            state.flashAlpha = 0.15;
            showText('SMASH!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#4488ff');
            playSFX('smash');
            playCrash(); // Big crash cymbal!
            spawnParticles(enemy.x, enemy.y, 25, enemy.color);
            // Extra ground particles
            for (let i = 0; i < 10; i++) {
                state.particles.push({
                    x: enemy.x + (Math.random() - 0.5) * 60,
                    y: dom.canvas.height - 45,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 5,
                    life: 1,
                    color: '#555555'
                });
            }
        } else if (stance === 'triple') {
            // Triple tap on Giant - COMBO HIT!
            player.score += 200;
            state.screenShake = 15;
            state.hitStop = 8;
            state.chromaOffset = 5;
            state.flashColor = '#ff8844';
            state.flashAlpha = 0.12;
            showText('COMBO HIT!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#ff8844');
            playSFX('crit');
            spawnParticles(enemy.x, enemy.y, 20, enemy.color);
        } else if (stance === 'tapthenhold') {
            // Tap-hold on Mage - MAGIC COUNTER!
            player.score += 200;
            state.screenShake = 12;
            state.hitStop = 8;
            state.chromaOffset = 4;
            state.flashColor = '#ff44aa';
            state.flashAlpha = 0.12;
            showText('DISPEL!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#ff44aa');
            playSFX('crit');
            spawnParticles(enemy.x, enemy.y, 18, enemy.color);
        } else if (roll < 0.1 + feverBonus) {
            // OVERKILL! (more likely in fever mode)
            player.score += 300;
            state.screenShake = 15;
            state.hitStop = 10; // FREEZE FRAME!
            state.chromaOffset = 6;
            state.flashColor = '#ff00ff';
            state.flashAlpha = 0.15;
            const killText = OVERKILL_TEXTS[Math.floor(Math.random() * OVERKILL_TEXTS.length)];
            showText(killText, dom.canvas.width/2, dom.canvas.height/2 - 30, '#ff00ff');
            playSFX('crit');
            playCrash(); // Crash cymbal for overkill!
            spawnParticles(enemy.x, enemy.y, 20, enemy.color);
        } else if (roll < 0.3 + feverBonus || player.feverMode) {
            // Critical! (guaranteed in fever mode)
            player.score += 200;
            state.screenShake = 8;
            state.hitStop = 6; // Small freeze
            state.chromaOffset = 3;
            const zone = getCurrentZone();
            state.flashColor = player.feverMode ? zone.accent : zone.comboGlow;
            state.flashAlpha = 0.1;
            const critText = player.feverMode ? 'FEVER CRIT!' : CRIT_TEXTS[Math.floor(Math.random() * CRIT_TEXTS.length)];
            showText(critText, dom.canvas.width/2, dom.canvas.height/2 - 30, player.feverMode ? zone.accent : zone.comboGlow);
            playSFX('crit');
            spawnParticles(enemy.x, enemy.y, 15, player.feverMode ? zone.killParticle : enemy.color);
        } else {
            // Normal kill - varied text, zone-colored
            player.score += 100 * (1 + Math.floor(player.combo / 5));
            const killText = KILL_TEXTS[Math.floor(Math.random() * KILL_TEXTS.length)];
            const zone = getCurrentZone();
            showText(killText, dom.canvas.width/2, dom.canvas.height/2 - 30, zone.killParticle);
            playSFX('hit');
            spawnParticles(enemy.x, enemy.y, 10, enemy.color);
        }

        // Check combo milestones!
        checkComboMilestone();
    } else if (stance === 'defensive' && enemy.type === 'swordsman') {
        // Block - enemy survives
        if (roll < 0.1) {
            // Counter!
            enemy.alive = false;
            spawnDeathGhost(enemy);
            adjustBPM(BPM_PER_KILL); // Speed up the rhythm!
            player.combo++;
            const oldKillsCounter = player.kills;
            player.kills++; // Track total kills
            checkZoneTransition(oldKillsCounter, player.kills);
            player.victoryTimer = 0.8; // Victory animation
            player.score += 150;
            showText('COUNTER!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#00ffff');
            playSFX('crit');
            spawnParticles(enemy.x, enemy.y, 12, enemy.color);
        } else if (roll < 0.4) {
            // Staggered
            enemy.staggered = true;
            showText('BLOCKED!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#888888');
            playSFX('block');
        } else {
            showText('BLOCKED', dom.canvas.width/2, dom.canvas.height/2 - 30, '#666666');
            playSFX('block');
        }
    } else if (stance === 'charge' && enemy.type !== 'armored') {
        // Charge attack overkill on non-armored (but wastes charge)
        enemy.alive = false;
        spawnDeathGhost(enemy);
        adjustBPM(BPM_PER_KILL); // Speed up the rhythm!
        player.combo++;
        const oldKillsCharge = player.kills;
        player.kills++; // Track total kills
        checkZoneTransition(oldKillsCharge, player.kills);
        player.victoryTimer = 0.8; // Victory animation
        player.score += 150;
        state.screenShake = 12;
        showText('OVERKILL!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#4488ff');
        playSFX('smash');
        spawnParticles(enemy.x, enemy.y, 18, enemy.color);
    } else {
        // Wrong stance - DAMAGE with graze chance
        if (roll < 0.2) {
            // GRAZE! Lucky dodge! - zone-colored
            const zone = getCurrentZone();
            state.flashColor = zone.comboGlow;
            state.flashAlpha = 0.1;
            state.screenShake = 5;
            state.hitStop = 3;
            showBigPrompt('LUCKY!', zone.comboGlow);
            playSFX('graze');

            // Sparks - zone-colored
            for (let i = 0; i < 12; i++) {
                state.particles.push({
                    x: 70 + Math.random() * 20,
                    y: dom.canvas.height - 50 - Math.random() * 30,
                    vx: 4 + Math.random() * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 0.8,
                    color: i % 2 === 0 ? zone.comboGlow : '#ffffff'
                });
            }
        } else {
            takeDamage();
        }
    }
}

export function takeDamage() {
    const { player } = state;

    player.lives--;
    player.combo = 0;
    player.feverMode = false; // End fever mode on damage
    player.damageTimer = 1.0; // Trigger damage recoil animation
    adjustBPM(BPM_DAMAGE_PENALTY); // Slow down for recovery

    // JUICE: Big impact!
    state.screenShake = 15;
    state.hitStop = 8;
    state.chromaOffset = 5;
    state.flashColor = '#ff0000';
    state.flashAlpha = 0.2;
    playSFX('damage');

    // Show damage text
    const damageText = DAMAGE_TEXTS[Math.floor(Math.random() * DAMAGE_TEXTS.length)];
    showText(damageText, 60, dom.canvas.height - 80, '#ff0000');

    // Blood/damage particles from player
    for (let i = 0; i < 15; i++) {
        state.particles.push({
            x: 60 + (Math.random() - 0.5) * 20,
            y: dom.canvas.height - 60,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 6 - 2,
            life: 1,
            color: i % 3 === 0 ? '#ff0000' : '#ff4444'
        });
    }

    // Heart break particles (from UI area)
    const heartX = 20 + player.lives * 25; // Position of lost heart
    for (let i = 0; i < 8; i++) {
        state.particles.push({
            x: heartX,
            y: 20,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * 4 + 1,
            life: 1.2,
            color: '#ff4444'
        });
    }

    if (player.lives <= 0) {
        state.gameState = 'gameover';
        // Subtle death effects (minimal shake so stats are readable)
        state.screenShake = 5;
        state.hitStop = 8;
        // Play game over jingle
        playGameOverJingle();
        // Save high score
        if (player.score > state.highScore) {
            state.highScore = player.score;
            localStorage.setItem('oneButtonWarriorHighScore', state.highScore);
        }
    }
}

// ============================================
// COMBO MILESTONE CELEBRATION
// ============================================
export function checkComboMilestone() {
    const { player } = state;
    const milestones = [5, 10, 15, 20, 25, 30, 50];
    const zone = getCurrentZone();

    for (const m of milestones) {
        if (player.combo >= m && state.lastComboMilestone < m) {
            state.lastComboMilestone = m;
            state.comboMilestone = 1;

            // Big celebration! - zone-colored
            const milestoneColor = m >= 20 ? zone.accent : (m >= 10 ? zone.killParticle : zone.comboGlow);
            showBigPrompt(`${m} COMBO!`, milestoneColor);
            state.screenShake = m >= 20 ? 15 : (m >= 10 ? 10 : 5);

            // Burst of particles - zone-colored palette
            const zoneColors = [zone.accent, zone.comboGlow, zone.killParticle, zone.accentAlt];
            for (let i = 0; i < m; i++) {
                state.particles.push({
                    x: dom.canvas.width / 2 + (Math.random() - 0.5) * 100,
                    y: dom.canvas.height / 2,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15 - 5,
                    life: 1.2,
                    color: zoneColors[Math.floor(Math.random() * zoneColors.length)]
                });
            }

            // Special SFX for big milestones
            if (m >= 10) {
                playSFX('fever');
                playCrash(); // Crash cymbal for milestone!
            }
            break;
        }
    }

    // Reset milestone tracker when combo resets
    if (player.combo === 0) state.lastComboMilestone = 0;
}
