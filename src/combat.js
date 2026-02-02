// ============================================
// COMBAT SYSTEM
// ============================================
import { ENEMY_TYPES, KILL_TEXTS, CRIT_TEXTS, OVERKILL_TEXTS, ARMORED_INTRO_SCORE, ARMORED_GUARANTEE_BAR } from './constants.js';
import { state, dom } from './state.js';
import { playSFX } from './audio.js';
import { showText, showBigPrompt, spawnParticles } from './render.js';

// ============================================
// ENEMY SPAWNING
// ============================================
export function spawnEnemy() {
    const { canvas } = dom;

    // Introduce armored earlier so players experience charge mechanic
    let types = ['swordsman', 'archer'];
    if (state.player.score >= ARMORED_INTRO_SCORE) {
        types.push('armored');
    }
    // Guarantee first armored around bar 8 to teach the mechanic
    if (state.currentBar >= ARMORED_GUARANTEE_BAR && state.currentBar < ARMORED_GUARANTEE_BAR + 4 && !state.player.hasSeenArmored) {
        types = ['armored'];
        state.player.hasSeenArmored = true;
    }
    const type = types[Math.floor(Math.random() * types.length)];
    state.enemy = {
        type: type,
        ...ENEMY_TYPES[type],
        x: canvas.width + 50,
        targetX: canvas.width - 100,
        y: canvas.height - 80,
        alive: true,
        staggered: false
    };
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
            // Graze!
            state.flashColor = '#ffff00';
            state.flashAlpha = 1;
            showText('GRAZE!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#ffff00');
            playSFX('graze');
        } else {
            takeDamage();
        }
    } else if (correct) {
        // Correct stance - KILL with crit chance
        enemy.alive = false;
        player.combo++;

        // Fever mode = guaranteed crits!
        const feverBonus = player.feverMode ? 0.3 : 0; // Boost crit chance

        // Charge attacks are always powerful - MAX JUICE
        if (stance === 'charge') {
            player.score += 250;
            state.screenShake = 20;
            state.hitStop = 12; // FREEZE FRAME!
            state.chromaOffset = 8; // Chromatic aberration
            state.flashColor = '#4488ff';
            state.flashAlpha = 1;
            showText('SMASH!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#4488ff');
            playSFX('smash');
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
        } else if (roll < 0.1 + feverBonus) {
            // OVERKILL! (more likely in fever mode)
            player.score += 300;
            state.screenShake = 15;
            state.hitStop = 10; // FREEZE FRAME!
            state.chromaOffset = 6;
            state.flashColor = '#ff00ff';
            state.flashAlpha = 1;
            const killText = OVERKILL_TEXTS[Math.floor(Math.random() * OVERKILL_TEXTS.length)];
            showText(killText, dom.canvas.width/2, dom.canvas.height/2 - 30, '#ff00ff');
            playSFX('crit');
            spawnParticles(enemy.x, enemy.y, 20, enemy.color);
        } else if (roll < 0.3 + feverBonus || player.feverMode) {
            // Critical! (guaranteed in fever mode)
            player.score += 200;
            state.screenShake = 8;
            state.hitStop = 6; // Small freeze
            state.chromaOffset = 3;
            state.flashColor = player.feverMode ? '#ff00ff' : '#ffff00';
            state.flashAlpha = 0.5;
            const critText = player.feverMode ? 'FEVER CRIT!' : CRIT_TEXTS[Math.floor(Math.random() * CRIT_TEXTS.length)];
            showText(critText, dom.canvas.width/2, dom.canvas.height/2 - 30, player.feverMode ? '#ff00ff' : '#ffff00');
            playSFX('crit');
            spawnParticles(enemy.x, enemy.y, 15, player.feverMode ? '#ff00ff' : enemy.color);
        } else {
            // Normal kill - varied text
            player.score += 100 * (1 + Math.floor(player.combo / 5));
            const killText = KILL_TEXTS[Math.floor(Math.random() * KILL_TEXTS.length)];
            showText(killText, dom.canvas.width/2, dom.canvas.height/2 - 30, '#88ff88');
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
            player.combo++;
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
        player.combo++;
        player.score += 150;
        state.screenShake = 12;
        showText('OVERKILL!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#4488ff');
        playSFX('smash');
        spawnParticles(enemy.x, enemy.y, 18, enemy.color);
    } else {
        // Wrong stance - DAMAGE with graze chance
        if (roll < 0.2) {
            // Graze!
            state.flashColor = '#ffff00';
            state.flashAlpha = 0.5;
            showText('GRAZE!', dom.canvas.width/2, dom.canvas.height/2 - 30, '#ffff00');
            playSFX('graze');
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
    state.screenShake = 10;
    state.flashColor = '#ff0000';
    state.flashAlpha = 0.8;
    playSFX('damage');

    if (player.lives <= 0) {
        state.gameState = 'gameover';
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

    for (const m of milestones) {
        if (player.combo >= m && state.lastComboMilestone < m) {
            state.lastComboMilestone = m;
            state.comboMilestone = 1;

            // Big celebration!
            showBigPrompt(`${m} COMBO!`, m >= 20 ? '#ff00ff' : (m >= 10 ? '#ff8800' : '#ffff00'));
            state.screenShake = m >= 20 ? 15 : (m >= 10 ? 10 : 5);

            // Burst of particles
            for (let i = 0; i < m; i++) {
                state.particles.push({
                    x: dom.canvas.width / 2 + (Math.random() - 0.5) * 100,
                    y: dom.canvas.height / 2,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15 - 5,
                    life: 1.2,
                    color: ['#ff00ff', '#ffff00', '#00ffff', '#ff8800'][Math.floor(Math.random() * 4)]
                });
            }

            // Special SFX for big milestones
            if (m >= 10) playSFX('fever');
            break;
        }
    }

    // Reset milestone tracker when combo resets
    if (player.combo === 0) state.lastComboMilestone = 0;
}
