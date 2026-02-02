// ============================================
// RENDERING
// ============================================
import { DOUBLE_TAP_WINDOW, STARTING_BPM } from './constants.js';
import { state, dom } from './state.js';

// ============================================
// TEXT & PARTICLE UTILITIES
// ============================================
export function showText(text, x, y, color) {
    state.floatingTexts.push({ text, x, y, color, alpha: 1, vy: -2 });
}

// WarioWare-style big prompt
export function showBigPrompt(text, color = '#ffffff') {
    state.bigPrompt = text;
    state.bigPromptColor = color;
    state.bigPromptScale = 1.5;
    state.bigPromptAlpha = 1;
}

export function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            life: 1,
            color
        });
    }
}

// ============================================
// BACKGROUND
// ============================================

// Environment themes based on score
const ENVIRONMENTS = {
    sunset: {
        sky: ['#ff6b35', '#f79322', '#ff4444', '#1a0a0a'],
        sun: '#ffdd44',
        mountains: '#0a0505',
        ground: '#0f0808'
    },
    desert: {
        sky: ['#ffcc66', '#ff9933', '#cc6600', '#331100'],
        sun: '#ffff88',
        mountains: '#553311',
        ground: '#442200'
    },
    forest: {
        sky: ['#226644', '#114422', '#0a2211', '#050a05'],
        sun: '#aaffaa',
        mountains: '#0a1a0a',
        ground: '#0a1505'
    },
    castle: {
        sky: ['#442266', '#331155', '#220a44', '#0a0510'],
        sun: '#aa88ff',
        mountains: '#1a0a20',
        ground: '#0f0515'
    }
};

// Parallax cloud state (persists between frames)
let clouds = [];
function initClouds() {
    if (clouds.length === 0) {
        for (let i = 0; i < 5; i++) {
            clouds.push({
                x: Math.random() * 500,
                y: 30 + Math.random() * 60,
                size: 20 + Math.random() * 30,
                speed: 0.2 + Math.random() * 0.3
            });
        }
    }
}

export function drawBackground() {
    const { ctx, canvas } = dom;
    const { player } = state;

    initClouds();

    // Determine environment based on score
    let env;
    if (player.feverMode) {
        env = null; // Use special fever palette
    } else if (player.score >= 800) {
        env = ENVIRONMENTS.castle;
    } else if (player.score >= 500) {
        env = ENVIRONMENTS.forest;
    } else if (player.score >= 200) {
        env = ENVIRONMENTS.desert;
    } else {
        env = ENVIRONMENTS.sunset;
    }

    // Beat pulse intensity
    const pulseIntensity = state.beatPulse * (player.feverMode ? 0.3 : 0.15);
    const feverPulse = player.feverMode ? Math.sin(Date.now() / 100) * 0.15 : 0;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (player.feverMode) {
        // Purple/magenta fever palette
        gradient.addColorStop(0, `rgb(${255}, ${50 + pulseIntensity * 50}, ${150 + pulseIntensity * 50})`);
        gradient.addColorStop(0.4, `rgb(${200 + feverPulse * 55}, ${50 + pulseIntensity * 40}, ${180 + pulseIntensity * 40})`);
        gradient.addColorStop(0.7, `rgb(${150}, ${30 + pulseIntensity * 30}, ${150 + pulseIntensity * 30})`);
        gradient.addColorStop(1, '#1a0a1a');
    } else {
        gradient.addColorStop(0, env.sky[0]);
        gradient.addColorStop(0.4, env.sky[1]);
        gradient.addColorStop(0.7, env.sky[2]);
        gradient.addColorStop(1, env.sky[3]);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Beat pulse decay
    state.beatPulse *= 0.9;

    // Parallax clouds (speed scales with BPM!)
    const bpmMultiplier = 0.5 + (state.bpm / STARTING_BPM) * 0.8; // Faster clouds at higher BPM
    const cloudColor = player.feverMode ? 'rgba(255,100,255,0.3)' :
        (env === ENVIRONMENTS.castle ? 'rgba(100,50,150,0.4)' :
        (env === ENVIRONMENTS.forest ? 'rgba(100,150,100,0.3)' : 'rgba(255,200,150,0.4)'));
    ctx.fillStyle = cloudColor;
    clouds.forEach(cloud => {
        // Draw cloud as overlapping circles
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Move cloud (faster at higher BPM)
        cloud.x -= cloud.speed * bpmMultiplier;
        if (cloud.x + cloud.size < 0) {
            cloud.x = canvas.width + cloud.size;
            cloud.y = 30 + Math.random() * 60;
        }
    });

    // Speed streaks at high BPM (appears after 80 BPM)
    if (state.bpm >= 80) {
        const streakIntensity = Math.min(1, (state.bpm - 80) / 40);
        ctx.strokeStyle = player.feverMode ? `rgba(255, 100, 255, ${streakIntensity * 0.3})` : `rgba(255, 200, 100, ${streakIntensity * 0.2})`;
        ctx.lineWidth = 1;

        const streakCount = Math.floor(1 + 7 * streakIntensity);
        for (let i = 0; i < streakCount; i++) {
            const streakY = 50 + (i * 25) % (canvas.height - 80);
            // Ensure divisor never goes below 4 to prevent too-fast animation
            const streakSpeed = Math.max(4, 8 - streakIntensity * 4);
            const streakOffset = (Date.now() / streakSpeed + i * 50) % (canvas.width + 100);
            const streakLength = 30 + streakIntensity * 40;

            ctx.beginPath();
            ctx.moveTo(canvas.width - streakOffset, streakY);
            ctx.lineTo(canvas.width - streakOffset + streakLength, streakY);
            ctx.stroke();
        }
    }

    // Sun/moon (changes with environment)
    const sunColor = player.feverMode ? '#ff66ff' : env.sun;
    ctx.fillStyle = sunColor;
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 60, 40 + (player.feverMode ? Math.sin(Date.now() / 80) * 5 : 0), 0, Math.PI * 2);
    ctx.fill();

    // Sun glow
    ctx.fillStyle = player.feverMode ? 'rgba(255,100,255,0.2)' : 'rgba(255,220,100,0.15)';
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 60, 55, 0, Math.PI * 2);
    ctx.fill();

    // Fever sparkle particles
    if (player.feverMode && Math.random() < 0.3) {
        state.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - 60),
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            life: 0.8,
            color: Math.random() > 0.5 ? '#ff00ff' : '#ffff00'
        });
    }

    // Silhouette mountains (color changes with environment)
    const mountainColor = player.feverMode ? '#200a20' : env.mountains;
    ctx.fillStyle = mountainColor;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(50, canvas.height - 60);
    ctx.lineTo(120, canvas.height - 30);
    ctx.lineTo(180, canvas.height - 80);
    ctx.lineTo(250, canvas.height - 40);
    ctx.lineTo(320, canvas.height - 90);
    ctx.lineTo(400, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    // Ground with beat pulse
    const groundColor = player.feverMode ? '#150510' : env.ground;
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // Ground beat pulse line
    if (state.beatPulse > 0.1) {
        ctx.strokeStyle = player.feverMode ? `rgba(255,0,255,${state.beatPulse * 0.5})` : `rgba(255,150,100,${state.beatPulse * 0.4})`;
        ctx.lineWidth = 2 + state.beatPulse * 3;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 40);
        ctx.lineTo(canvas.width, canvas.height - 40);
        ctx.stroke();
    }
}

// ============================================
// WARRIOR (PLAYER)
// ============================================

// Update cape physics
function updateCape(baseX, baseY, playerVelX) {
    const cape = state.capePoints;
    const anchorX = baseX - 8;
    const anchorY = baseY - 35;

    // Anchor point follows player
    cape[0].x = anchorX;
    cape[0].y = anchorY;

    // Physics for trailing points
    for (let i = 1; i < cape.length; i++) {
        const prev = cape[i - 1];
        const point = cape[i];

        // Target position (hanging down and back)
        const segmentLength = 12;
        const targetX = prev.x - 6 - i * 2;
        const targetY = prev.y + segmentLength;

        // Spring physics
        const dx = targetX - point.x;
        const dy = targetY - point.y;
        point.vx += dx * 0.15 - playerVelX * 0.3;
        point.vy += dy * 0.15 + 0.2; // Gravity

        // Damping
        point.vx *= 0.85;
        point.vy *= 0.85;

        // Apply velocity
        point.x += point.vx;
        point.y += point.vy;

        // Constrain distance from previous point
        const currentDx = point.x - prev.x;
        const currentDy = point.y - prev.y;
        const dist = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
        if (dist > segmentLength) {
            point.x = prev.x + (currentDx / dist) * segmentLength;
            point.y = prev.y + (currentDy / dist) * segmentLength;
        }
    }
}

// Draw flowing cape
function drawCape(ctx, baseX, baseY, color) {
    const cape = state.capePoints;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(baseX - 5, baseY - 38);
    ctx.lineTo(baseX - 12, baseY - 32);

    // Curve through cape points
    for (let i = 1; i < cape.length; i++) {
        ctx.lineTo(cape[i].x, cape[i].y);
    }

    // Return path
    ctx.lineTo(cape[cape.length - 1].x + 8, cape[cape.length - 1].y - 2);
    for (let i = cape.length - 2; i >= 1; i--) {
        ctx.lineTo(cape[i].x + 6, cape[i].y - 3);
    }
    ctx.lineTo(baseX - 2, baseY - 32);
    ctx.closePath();
    ctx.fill();

    // Cape highlight
    ctx.strokeStyle = `${color}88`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cape[1].x + 2, cape[1].y);
    for (let i = 2; i < cape.length; i++) {
        ctx.lineTo(cape[i].x + 3, cape[i].y - 1);
    }
    ctx.stroke();
}

export function drawWarrior() {
    const { ctx, canvas } = dom;
    const { player, chargeLevel, beatPulse } = state;

    const baseX = 60;
    const baseY = canvas.height - 45;

    // ====== ANIMATION CALCULATIONS ======

    // Beat-synced idle bob (bounces with the music)
    const beatBob = Math.sin(beatPulse * Math.PI) * 3;

    // Breathing animation (slower, subtle)
    const breathe = Math.sin(Date.now() / 800) * 2;

    // Victory animation timer decay
    if (player.victoryTimer > 0) {
        player.victoryTimer -= 0.016; // ~60fps
    }

    // Damage recoil timer decay
    if (player.damageTimer > 0) {
        player.damageTimer -= 0.02;
    }

    // Calculate player velocity for cape physics
    let playerVelX = 0;
    if (player.stance === 'aggressive' || player.stance === 'triple') {
        playerVelX = 5; // Moving forward
    } else if (player.damageTimer > 0) {
        playerVelX = -8; // Knocked back
    } else if (player.victoryTimer > 0) {
        playerVelX = 2; // Slight forward
    }

    // Update cape physics
    updateCape(baseX, baseY, playerVelX);

    // ====== POSITION MODIFIERS ======

    let x = baseX;
    let y = baseY;
    let bodyLean = 0; // Rotation
    let squashX = 1, squashY = 1;

    // Apply beat bob when idle
    if (player.stance === 'idle' && player.damageTimer <= 0) {
        y -= beatBob + breathe;
    }

    // Damage recoil - knockback and lean
    if (player.damageTimer > 0) {
        const recoilProgress = player.damageTimer;
        x -= recoilProgress * 15;
        bodyLean = -recoilProgress * 0.3;
        squashX = 0.9;
        squashY = 1.1;
    }

    // Victory pose
    if (player.victoryTimer > 0 && player.stance === 'idle') {
        const victoryProgress = player.victoryTimer;
        y -= victoryProgress * 8;
        bodyLean = victoryProgress * 0.1;
    }

    // Stance-based squash & stretch
    if (player.stance === 'aggressive' || player.stance === 'triple') {
        squashX = 1.15;
        squashY = 0.9;
        x += 8; // Lunge forward
        bodyLean = 0.15;
    } else if (player.stance === 'defensive' || player.stance === 'tapthenhold') {
        squashX = 1.1;
        squashY = 0.85;
        y += 5; // Crouch
        bodyLean = -0.05;
    } else if (player.stance === 'stumble') {
        squashX = 0.85 + Math.sin(Date.now() / 50) * 0.1;
        squashY = 1.1;
        x -= 5;
        bodyLean = Math.sin(Date.now() / 80) * 0.2;
    } else if (player.stance === 'charge' || chargeLevel > 0.3) {
        squashY = 0.9 + chargeLevel * 0.15;
        y += 3;
    }

    // ====== RENDERING ======

    ctx.save();

    // Apply body lean rotation
    ctx.translate(x, y);
    ctx.rotate(bodyLean);
    ctx.scale(squashX, squashY);
    ctx.translate(-x, -y);

    // Charge glow effect
    if (chargeLevel > 0 || player.stance === 'charge') {
        const glowIntensity = player.stance === 'charge' ? 1 : chargeLevel;
        ctx.fillStyle = `rgba(68, 136, 255, ${glowIntensity * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y - 30, 30 + glowIntensity * 15, 0, Math.PI * 2);
        ctx.fill();

        // Charge particles
        if (Math.random() < glowIntensity * 0.5) {
            state.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y - 20 - Math.random() * 40,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                life: 0.8,
                color: '#4488ff'
            });
        }
    }

    // Victory glow
    if (player.victoryTimer > 0.3) {
        ctx.fillStyle = `rgba(255, 255, 100, ${(player.victoryTimer - 0.3) * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y - 30, 35, 0, Math.PI * 2);
        ctx.fill();
    }

    // Fever mode aura
    if (player.feverMode) {
        const feverPulse = Math.sin(Date.now() / 50) * 5;
        ctx.fillStyle = `rgba(255, 0, 255, ${0.2 + Math.sin(Date.now() / 100) * 0.1})`;
        ctx.beginPath();
        ctx.arc(x, y - 30, 40 + feverPulse, 0, Math.PI * 2);
        ctx.fill();
    }

    // ====== CAPE (behind body) ======
    const capeColor = player.feverMode ? '#6600aa' :
        (player.damageTimer > 0 ? '#660022' : '#4a1a2a');
    drawCape(ctx, x, y, capeColor);

    // ====== COLOR PALETTE (Castlevania-style) ======
    const armorMain = player.feverMode ? '#8844aa' : '#5a6a7a';  // Steel gray
    const armorLight = player.feverMode ? '#aa66cc' : '#7a8a9a'; // Armor highlight
    const armorDark = player.feverMode ? '#663388' : '#3a4a5a';  // Armor shadow
    const leatherColor = '#4a3a2a';  // Brown leather
    const leatherLight = '#6a5a4a';  // Leather highlight
    const skinColor = '#d4a574';     // Skin tone
    const goldTrim = player.feverMode ? '#ffaa00' : '#c4a020';   // Gold accents

    // ====== LEGS (armored boots) ======
    const leftLegAngle = player.stance === 'aggressive' ? 0.3 :
        (player.stance === 'defensive' ? -0.2 : Math.sin(Date.now() / 400) * 0.05);
    ctx.save();
    ctx.translate(x - 5, y);
    ctx.rotate(leftLegAngle);
    // Leg armor
    ctx.fillStyle = armorDark;
    ctx.fillRect(-4, 0, 8, 18);
    ctx.fillStyle = armorMain;
    ctx.fillRect(-3, 1, 5, 16);
    // Boot
    ctx.fillStyle = leatherColor;
    ctx.fillRect(-5, 14, 11, 6);
    ctx.fillStyle = leatherLight;
    ctx.fillRect(-4, 15, 3, 4);
    ctx.restore();

    // Right leg
    const rightLegAngle = player.stance === 'aggressive' ? -0.4 :
        (player.stance === 'defensive' ? 0.2 : -Math.sin(Date.now() / 400) * 0.05);
    ctx.save();
    ctx.translate(x + 5, y);
    ctx.rotate(rightLegAngle);
    ctx.fillStyle = armorDark;
    ctx.fillRect(-4, 0, 8, 18);
    ctx.fillStyle = armorMain;
    ctx.fillRect(-3, 1, 5, 16);
    // Boot
    ctx.fillStyle = leatherColor;
    ctx.fillRect(-4, 14, 11, 6);
    ctx.fillStyle = leatherLight;
    ctx.fillRect(-3, 15, 3, 4);
    ctx.restore();

    // ====== TORSO (armored breastplate) ======
    const torsoScale = 1 + chargeLevel * 0.1;

    // Main armor body
    ctx.fillStyle = armorDark;
    ctx.beginPath();
    ctx.moveTo(x - 11 * torsoScale, y);
    ctx.lineTo(x - 13 * torsoScale, y - 25);
    ctx.lineTo(x - 9 * torsoScale, y - 36);
    ctx.lineTo(x + 9 * torsoScale, y - 36);
    ctx.lineTo(x + 13 * torsoScale, y - 25);
    ctx.lineTo(x + 11 * torsoScale, y);
    ctx.closePath();
    ctx.fill();

    // Breastplate highlight
    ctx.fillStyle = armorMain;
    ctx.beginPath();
    ctx.moveTo(x - 8 * torsoScale, y - 2);
    ctx.lineTo(x - 10 * torsoScale, y - 24);
    ctx.lineTo(x - 6 * torsoScale, y - 33);
    ctx.lineTo(x + 6 * torsoScale, y - 33);
    ctx.lineTo(x + 10 * torsoScale, y - 24);
    ctx.lineTo(x + 8 * torsoScale, y - 2);
    ctx.closePath();
    ctx.fill();

    // Center plate detail
    ctx.fillStyle = armorLight;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 5);
    ctx.lineTo(x - 4, y - 20);
    ctx.lineTo(x, y - 28);
    ctx.lineTo(x + 4, y - 20);
    ctx.lineTo(x + 3, y - 5);
    ctx.closePath();
    ctx.fill();

    // Gold trim on armor
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 33);
    ctx.lineTo(x + 8, y - 33);
    ctx.stroke();

    // ====== ARMS ======
    // Back arm (left, behind body)
    ctx.save();
    const backArmAngle = player.stance === 'charge' ? -2.5 :
        (player.stance === 'aggressive' || player.stance === 'triple' ? -0.5 : -0.3);
    ctx.translate(x - 10, y - 30);
    ctx.rotate(backArmAngle);
    // Shoulder pauldron
    ctx.fillStyle = armorDark;
    ctx.beginPath();
    ctx.arc(0, 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = armorMain;
    ctx.beginPath();
    ctx.arc(-1, 1, 4, 0, Math.PI * 2);
    ctx.fill();
    // Arm
    ctx.fillStyle = armorDark;
    ctx.fillRect(-4, 4, 8, 18);
    ctx.fillStyle = armorMain;
    ctx.fillRect(-3, 5, 5, 16);
    ctx.restore();

    // Front arm (right, holds weapon)
    const frontArmAngle = player.stance === 'aggressive' || player.stance === 'triple' ? -1.2 :
        (player.stance === 'defensive' || player.stance === 'tapthenhold' ? 0.3 :
        (player.stance === 'charge' ? -2.8 :
        (player.victoryTimer > 0.3 ? -2.5 : 0.5)));
    ctx.save();
    ctx.translate(x + 10, y - 30);
    ctx.rotate(frontArmAngle);
    // Shoulder pauldron
    ctx.fillStyle = armorDark;
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = armorMain;
    ctx.beginPath();
    ctx.arc(1, 1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = goldTrim;
    ctx.beginPath();
    ctx.arc(1, 1, 2, 0, Math.PI * 2);
    ctx.fill();
    // Arm armor
    ctx.fillStyle = armorDark;
    ctx.fillRect(-4, 4, 8, 20);
    ctx.fillStyle = armorMain;
    ctx.fillRect(-3, 5, 5, 18);
    // Gauntlet
    ctx.fillStyle = armorLight;
    ctx.fillRect(-3, 20, 6, 4);

    // ====== SWORD (consistent style across all stances) ======
    const swordGlow = player.stance === 'charge' || (player.stance === 'triple' && player.feverMode);
    const swordColor = swordGlow ? '#88ccff' : '#c0c0c0';  // Silver blade
    const hiltColor = '#8b4513';   // Brown leather grip
    const guardColor = goldTrim;   // Gold crossguard

    // Blade
    ctx.fillStyle = swordColor;
    ctx.beginPath();
    ctx.moveTo(-1, 22);
    ctx.lineTo(-2, 24);
    ctx.lineTo(-2, 50);
    ctx.lineTo(0, 55);  // Point
    ctx.lineTo(2, 50);
    ctx.lineTo(2, 24);
    ctx.lineTo(1, 22);
    ctx.closePath();
    ctx.fill();

    // Blade edge highlight
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 24, 1, 26);

    // Crossguard
    ctx.fillStyle = guardColor;
    ctx.fillRect(-7, 18, 14, 4);

    // Hilt/grip
    ctx.fillStyle = hiltColor;
    ctx.fillRect(-2, 14, 4, 6);

    // Pommel
    ctx.fillStyle = guardColor;
    ctx.beginPath();
    ctx.arc(0, 13, 3, 0, Math.PI * 2);
    ctx.fill();

    // Sword glow effect for charge/triple
    if (swordGlow) {
        ctx.strokeStyle = player.stance === 'triple' ? '#ff8844' : '#88ccff';
        ctx.lineWidth = 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(0, 54);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Motion trails for triple attack
    if (player.stance === 'triple') {
        ctx.strokeStyle = '#ff884466';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-8 - i * 6, 25 + i * 5);
            ctx.lineTo(-8 - i * 6, 50 + i * 5);
            ctx.stroke();
        }
    }

    ctx.restore(); // End front arm transform

    // ====== SHIELD (defensive stance) ======
    if (player.stance === 'defensive' || player.stance === 'tapthenhold') {
        const shieldMain = player.stance === 'tapthenhold' ? '#aa3377' : '#3a5a8a';
        const shieldLight = player.stance === 'tapthenhold' ? '#cc5599' : '#5a7aaa';
        const shieldDark = player.stance === 'tapthenhold' ? '#882255' : '#2a4a6a';

        // Shield body
        ctx.fillStyle = shieldDark;
        ctx.beginPath();
        ctx.ellipse(x + 18, y - 20, 15, 19, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = shieldMain;
        ctx.beginPath();
        ctx.ellipse(x + 17, y - 21, 12, 16, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Shield boss (center)
        ctx.fillStyle = goldTrim;
        ctx.beginPath();
        ctx.arc(x + 17, y - 21, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = shieldLight;
        ctx.beginPath();
        ctx.arc(x + 16, y - 22, 3, 0, Math.PI * 2);
        ctx.fill();

        // Shield rim
        ctx.strokeStyle = goldTrim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 17, y - 21, 13, 17, 0.2, 0, Math.PI * 2);
        ctx.stroke();

        // Magic glow for tapthenhold
        if (player.stance === 'tapthenhold') {
            ctx.fillStyle = `rgba(255, 68, 170, ${0.2 + Math.sin(Date.now() / 50) * 0.15})`;
            ctx.beginPath();
            ctx.arc(x + 17, y - 21, 22 + Math.sin(Date.now() / 50) * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ====== HEAD/HELMET (Great Helm style) ======
    const headY = y - 48 - chargeLevel * 5;

    // Helmet main shape (flat-topped great helm)
    ctx.fillStyle = armorDark;
    ctx.beginPath();
    ctx.moveTo(x - 11, headY + 8);   // Bottom left
    ctx.lineTo(x - 12, headY - 2);   // Left side
    ctx.lineTo(x - 10, headY - 10);  // Top left curve
    ctx.lineTo(x - 4, headY - 14);   // Top left
    ctx.lineTo(x + 4, headY - 14);   // Top right
    ctx.lineTo(x + 10, headY - 10);  // Top right curve
    ctx.lineTo(x + 12, headY - 2);   // Right side
    ctx.lineTo(x + 11, headY + 8);   // Bottom right
    ctx.closePath();
    ctx.fill();

    // Helmet front plate (lighter)
    ctx.fillStyle = armorMain;
    ctx.beginPath();
    ctx.moveTo(x - 9, headY + 6);
    ctx.lineTo(x - 10, headY - 1);
    ctx.lineTo(x - 8, headY - 9);
    ctx.lineTo(x - 3, headY - 12);
    ctx.lineTo(x + 3, headY - 12);
    ctx.lineTo(x + 8, headY - 9);
    ctx.lineTo(x + 10, headY - 1);
    ctx.lineTo(x + 9, headY + 6);
    ctx.closePath();
    ctx.fill();

    // Center ridge (nose guard)
    ctx.fillStyle = armorLight;
    ctx.beginPath();
    ctx.moveTo(x - 1, headY - 12);
    ctx.lineTo(x + 1, headY - 12);
    ctx.lineTo(x + 2, headY + 5);
    ctx.lineTo(x - 2, headY + 5);
    ctx.closePath();
    ctx.fill();

    // Visor slit (horizontal eye slot)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x - 9, headY - 3, 18, 4);

    // Breathing holes (left side)
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x - 7, headY + 2 + i * 3, 1, 0, Math.PI * 2);
        ctx.fill();
    }
    // Breathing holes (right side)
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + 7, headY + 2 + i * 3, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Gold trim around visor
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 10, headY - 4);
    ctx.lineTo(x + 10, headY - 4);
    ctx.moveTo(x - 10, headY + 2);
    ctx.lineTo(x + 10, headY + 2);
    ctx.stroke();

    // Chin guard
    ctx.fillStyle = armorDark;
    ctx.beginPath();
    ctx.moveTo(x - 6, headY + 6);
    ctx.lineTo(x - 4, headY + 12);
    ctx.lineTo(x + 4, headY + 12);
    ctx.lineTo(x + 6, headY + 6);
    ctx.closePath();
    ctx.fill();

    // ====== NOBLE PLUME ======
    const plumeWave = Math.sin(Date.now() / 150) * 3;
    const plumeColor = player.feverMode ? '#ff44ff' : '#aa2222';
    const plumeLight = player.feverMode ? '#ff88ff' : '#cc4444';
    const plumeDark = player.feverMode ? '#aa00aa' : '#771111';

    // Plume base (gold mount)
    ctx.fillStyle = goldTrim;
    ctx.beginPath();
    ctx.ellipse(x, headY - 13, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Back feather
    ctx.fillStyle = plumeDark;
    ctx.beginPath();
    ctx.moveTo(x + 2, headY - 14);
    ctx.quadraticCurveTo(x + 8 + plumeWave * 0.5, headY - 30, x + 5 + plumeWave, headY - 40);
    ctx.quadraticCurveTo(x + 3 + plumeWave * 0.8, headY - 44, x - 2 + plumeWave * 0.6, headY - 42);
    ctx.quadraticCurveTo(x + 2, headY - 32, x + 2, headY - 14);
    ctx.fill();

    // Main feather
    ctx.fillStyle = plumeColor;
    ctx.beginPath();
    ctx.moveTo(x, headY - 15);
    ctx.quadraticCurveTo(x + 6 + plumeWave * 0.7, headY - 28, x + 4 + plumeWave, headY - 38);
    ctx.quadraticCurveTo(x + 2 + plumeWave, headY - 46, x - 4 + plumeWave * 0.8, headY - 44);
    ctx.quadraticCurveTo(x - 6 + plumeWave * 0.5, headY - 40, x - 5 + plumeWave * 0.3, headY - 34);
    ctx.quadraticCurveTo(x - 2, headY - 24, x, headY - 15);
    ctx.fill();

    // Highlight feather
    ctx.fillStyle = plumeLight;
    ctx.beginPath();
    ctx.moveTo(x - 1, headY - 16);
    ctx.quadraticCurveTo(x + 3 + plumeWave * 0.6, headY - 27, x + 2 + plumeWave * 0.8, headY - 35);
    ctx.quadraticCurveTo(x + plumeWave * 0.7, headY - 40, x - 3 + plumeWave * 0.5, headY - 38);
    ctx.quadraticCurveTo(x - 4 + plumeWave * 0.3, headY - 32, x - 1, headY - 16);
    ctx.fill();

    // Feather spine
    ctx.strokeStyle = plumeDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, headY - 16);
    ctx.quadraticCurveTo(x + 4 + plumeWave * 0.6, headY - 28, x + 1 + plumeWave * 0.7, headY - 38);
    ctx.stroke();

    // ====== EYES (glowing through visor) ======
    const eyeGlow = player.stance === 'charge' ? '#4488ff' :
        (player.feverMode ? '#ff00ff' :
        (player.damageTimer > 0 ? '#ff4444' : '#ffcc44'));

    let eyeOffsetX = 0;
    if (player.stance === 'aggressive' || player.stance === 'triple') {
        eyeOffsetX = 2;
    } else if (player.damageTimer > 0) {
        eyeOffsetX = -2;
    }

    const eyeY = headY - 1;

    if (player.damageTimer > 0.5) {
        // Damage - flickering red eyes
        const flicker = Math.sin(Date.now() / 30) > 0 ? 1 : 0.5;
        ctx.fillStyle = `rgba(255, 68, 68, ${flicker})`;
        ctx.fillRect(x - 6 + eyeOffsetX, eyeY - 1, 4, 2);
        ctx.fillRect(x + 2 + eyeOffsetX, eyeY - 1, 4, 2);
    } else {
        // Normal glowing eyes in visor slit
        ctx.fillStyle = eyeGlow;
        ctx.shadowColor = eyeGlow;
        ctx.shadowBlur = player.feverMode ? 8 : 4;

        // Left eye
        ctx.fillRect(x - 6 + eyeOffsetX, eyeY - 1, 4, 2);
        // Right eye
        ctx.fillRect(x + 2 + eyeOffsetX, eyeY - 1, 4, 2);

        ctx.shadowBlur = 0;
    }

    ctx.restore(); // End body transform

    // ====== WEAPON TRAIL (outside transform for screen-space effect) ======
    if (player.stance === 'aggressive' || player.stance === 'triple') {
        const trailColor = player.stance === 'triple' ? '#ff884466' : '#ffffff33';
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = player.stance === 'triple' ? 4 : 2;
        ctx.lineCap = 'round';

        // Arc trail
        ctx.beginPath();
        ctx.arc(x + 15, y - 30, 40, -0.5, 1.2);
        ctx.stroke();

        if (player.stance === 'triple') {
            // Multiple trail arcs
            ctx.strokeStyle = '#ff884433';
            ctx.beginPath();
            ctx.arc(x + 15, y - 30, 45, -0.3, 1.0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + 15, y - 30, 35, -0.7, 1.4);
            ctx.stroke();
        }
    }
}

// ============================================
// ENEMY
// ============================================
export function drawEnemy() {
    const { ctx, canvas } = dom;
    const { enemy } = state;

    if (!enemy) return;

    // Base position
    let x = enemy.x;
    let y = enemy.y;

    // ANIMATION: Idle bobbing (gentle sine wave)
    const bobSpeed = enemy.type === 'giant' ? 800 : (enemy.type === 'armored' ? 1200 : 600);
    const bobAmount = enemy.type === 'giant' ? 2 : 3;
    const idleBob = Math.sin(Date.now() / bobSpeed) * bobAmount;
    y += idleBob;

    // ANIMATION: Attack windup on phase 2 (clash)
    // Lean forward and raise weapon before attacking
    let leanAngle = 0;
    let weaponRaise = 0;
    if (state.phase === 2 && enemy.alive) {
        // Quick lunge forward
        const attackProgress = Math.min(1, (Date.now() % 500) / 200);
        x -= attackProgress * 15; // Lunge toward player
        leanAngle = attackProgress * 0.2; // Lean forward
        weaponRaise = attackProgress * 0.5; // Raise weapon
    }

    // ANIMATION: Staggered sway
    if (enemy.staggered) {
        const staggerSway = Math.sin(Date.now() / 100) * 5;
        x += staggerSway;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(leanAngle);
    ctx.translate(-x, -y);

    // Glow effect behind enemy (colored by type, pulses on attack)
    const glowColors = {
        swordsman: [255, 68, 68],
        archer: [68, 255, 68],
        armored: [68, 136, 255],
        giant: [255, 136, 68],
        mage: [255, 68, 170]
    };
    const glowRGB = glowColors[enemy.type] || [255, 255, 255];
    const glowAlpha = state.phase === 2 ? 0.5 + Math.sin(Date.now() / 50) * 0.2 : 0.3;
    const glowSize = state.phase === 2 ? 40 + Math.sin(Date.now() / 80) * 5 : 35;
    ctx.fillStyle = `rgba(${glowRGB[0]},${glowRGB[1]},${glowRGB[2]},${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y - 25, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Body silhouette (bigger)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x, y - 15, 14, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(x, y - 45, 12, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (colored by type - BIGGER and more expressive)
    ctx.fillStyle = enemy.eyes;
    ctx.beginPath();
    ctx.arc(x - 4, y - 47, 5, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 47, 5, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (enemy.type === 'swordsman') {
        // Angry V brows
        ctx.moveTo(x - 8, y - 55);
        ctx.lineTo(x - 2, y - 52);
        ctx.moveTo(x + 8, y - 55);
        ctx.lineTo(x + 2, y - 52);
    }
    ctx.stroke();

    // Weapon indicator (BIGGER and clearer)
    if (enemy.weapon === 'sword') {
        ctx.fillStyle = '#444444';
        ctx.save();
        ctx.translate(x - 18, y - 25);
        ctx.rotate(0.4);
        ctx.fillRect(-3, -30, 6, 40);
        // Crossguard
        ctx.fillRect(-10, -5, 20, 6);
        ctx.restore();
    } else if (enemy.weapon === 'bow') {
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x - 20, y - 25, 18, -0.9, 0.9);
        ctx.stroke();
        // Bowstring
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 20 + 18 * Math.cos(-0.9), y - 25 + 18 * Math.sin(-0.9));
        ctx.lineTo(x - 5, y - 25);
        ctx.lineTo(x - 20 + 18 * Math.cos(0.9), y - 25 + 18 * Math.sin(0.9));
        ctx.stroke();
        // Arrow
        ctx.fillStyle = '#444444';
        ctx.fillRect(x - 25, y - 27, 25, 4);
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(x, y - 25);
        ctx.lineTo(x - 8, y - 30);
        ctx.lineTo(x - 8, y - 20);
        ctx.fill();
    } else if (enemy.weapon === 'shield') {
        // Big shield in front
        ctx.fillStyle = '#3366aa';
        ctx.beginPath();
        ctx.ellipse(x - 10, y - 20, 18, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#224488';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Shield boss (center decoration)
        ctx.fillStyle = '#4488cc';
        ctx.beginPath();
        ctx.arc(x - 10, y - 20, 6, 0, Math.PI * 2);
        ctx.fill();
        // Armor helmet spike
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.moveTo(x, y - 60);
        ctx.lineTo(x - 5, y - 52);
        ctx.lineTo(x + 5, y - 52);
        ctx.fill();
    } else if (enemy.weapon === 'club') {
        // Giant's club - big and chunky
        ctx.fillStyle = '#8B4513'; // Brown
        ctx.save();
        ctx.translate(x - 15, y - 20);
        ctx.rotate(0.6);
        // Handle
        ctx.fillRect(-4, -10, 8, 45);
        // Club head (thick end)
        ctx.beginPath();
        ctx.ellipse(0, -15, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Spikes/bumps on club
        ctx.fillStyle = '#5C3317';
        ctx.beginPath();
        ctx.arc(-8, -18, 4, 0, Math.PI * 2);
        ctx.arc(6, -12, 4, 0, Math.PI * 2);
        ctx.arc(-3, -25, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else if (enemy.weapon === 'staff') {
        // Mage's staff with glowing orb
        ctx.fillStyle = '#663399'; // Purple staff
        ctx.save();
        ctx.translate(x + 15, y - 25);
        ctx.rotate(-0.2);
        // Staff shaft
        ctx.fillRect(-3, -35, 6, 50);
        // Orb holder
        ctx.beginPath();
        ctx.arc(0, -40, 8, 0, Math.PI * 2);
        ctx.fill();
        // Glowing orb
        const orbPulse = Math.sin(Date.now() / 100) * 2;
        ctx.fillStyle = 'rgba(255,68,170,0.5)';
        ctx.beginPath();
        ctx.arc(0, -40, 12 + orbPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff44aa';
        ctx.beginPath();
        ctx.arc(0, -40, 6, 0, Math.PI * 2);
        ctx.fill();
        // Sparkles
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-3 + Math.sin(Date.now() / 200) * 3, -43, 2, 0, Math.PI * 2);
        ctx.arc(4, -38 + Math.cos(Date.now() / 150) * 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Stagger indicator
    if (enemy.staggered) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DIZZY', x, y - 70);
        ctx.textAlign = 'left';
    }

    ctx.restore(); // Restore from lean animation
}

// ============================================
// UI
// ============================================
export function drawUI() {
    const { ctx, canvas } = dom;
    const { player, enemy, phase, bpm, beatPulse, beatMarkers, hitZoneX, lastTapTime, isHolding, chargeLevel } = state;

    // Lives (hearts)
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < player.lives ? '#ff4444' : '#333333';
        ctx.beginPath();
        const hx = 20 + i * 25;
        const hy = 20;
        ctx.moveTo(hx, hy + 5);
        ctx.bezierCurveTo(hx, hy, hx - 8, hy, hx - 8, hy + 5);
        ctx.bezierCurveTo(hx - 8, hy + 10, hx, hy + 15, hx, hy + 18);
        ctx.bezierCurveTo(hx, hy + 15, hx + 8, hy + 10, hx + 8, hy + 5);
        ctx.bezierCurveTo(hx + 8, hy, hx, hy, hx, hy + 5);
        ctx.fill();
    }

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${player.score}`, canvas.width - 10, 25);

    // BPM indicator (pulses with beat, color-coded by speed)
    const bpmIntensity = Math.min(1, (bpm - 60) / 50);
    const bpmRGB = bpm >= 100 ? '255, 68, 68' : (bpm >= 80 ? '255, 170, 0' : '68, 255, 136');
    ctx.fillStyle = `rgba(${bpmRGB}, ${0.5 + beatPulse * 0.5})`;
    ctx.font = `bold ${10 + bpmIntensity * 4}px monospace`;
    ctx.fillText(`♪${Math.round(bpm)}`, 90, 22);

    // Speed flame effect at high BPM
    if (bpm >= 90) {
        ctx.fillStyle = `rgba(255, ${150 - bpmIntensity * 100}, 0, ${0.2 + Math.sin(Date.now() / 50) * 0.15})`;
        ctx.beginPath();
        ctx.moveTo(85, 25);
        ctx.quadraticCurveTo(100 + Math.sin(Date.now() / 100) * 3, 5, 115, 25);
        ctx.quadraticCurveTo(100, 30, 85, 25);
        ctx.fill();
    }

    // Combo (scales with combo count!)
    if (player.combo > 1) {
        const comboScale = Math.min(2.5, 1 + player.combo * 0.1);
        const fontSize = Math.floor(12 * comboScale);

        // Fever mode glow
        if (player.feverMode) {
            ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.beginPath();
            ctx.arc(canvas.width - 30, 38, 25 + Math.sin(Date.now() / 80) * 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (player.combo >= 5) {
            // Fire glow at 5+
            ctx.fillStyle = `rgba(255, 100, 0, ${0.2 + Math.sin(Date.now() / 100) * 0.1})`;
            ctx.beginPath();
            ctx.arc(canvas.width - 30, 38, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = player.feverMode ? '#ff00ff' : (player.combo >= 10 ? '#ff8800' : '#ffff00');
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillText(`x${player.combo}`, canvas.width - 10, 42);

        // "FEVER!" label when in fever mode
        if (player.feverMode) {
            ctx.fillStyle = '#ff00ff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('FEVER!', canvas.width - 10, 55);
        }
    }

    // Tutorial hint for first few enemies (or when armored first appears)
    const showTutorial = (player.score < 400) || (enemy && enemy.type === 'armored' && player.score < 800);
    if (showTutorial && enemy && enemy.alive) {
        const colors = { swordsman: '#ff4444', archer: '#44ff44', armored: '#4488ff' };

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(canvas.width/2 - 90, 45, 180, 50);
        ctx.strokeStyle = colors[enemy.type];
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width/2 - 90, 45, 180, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';

        if (enemy.type === 'swordsman') {
            ctx.fillText('SWORDSMAN [1] = TAP once', canvas.width/2, 63);
            ctx.fillStyle = '#ffff00';
            ctx.fillText('Quick tap when marker hits!', canvas.width/2, 82);
        } else if (enemy.type === 'archer') {
            ctx.fillText('ARCHER [2] = DOUBLE-TAP', canvas.width/2, 63);
            ctx.fillStyle = '#00ffff';
            ctx.fillText('Tap twice quickly!', canvas.width/2, 82);
        } else if (enemy.type === 'armored') {
            ctx.fillText('ARMORED [H] = HOLD', canvas.width/2, 63);
            ctx.fillStyle = '#4488ff';
            ctx.fillText('Hold until charge fills!', canvas.width/2, 82);
        }
    }

    ctx.textAlign = 'left';

    // GUITAR HERO STYLE BEAT TRACK
    const trackY = canvas.height - 35;
    const trackHeight = 30;

    // Track background with subtle gradient
    const trackGradient = ctx.createLinearGradient(0, trackY - trackHeight/2, 0, trackY + trackHeight/2);
    trackGradient.addColorStop(0, 'rgba(0,0,0,0.7)');
    trackGradient.addColorStop(0.5, 'rgba(20,20,40,0.7)');
    trackGradient.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = trackGradient;
    ctx.fillRect(0, trackY - trackHeight/2, canvas.width, trackHeight);

    // Speed lines on track (more lines at higher BPM)
    const speedIntensity = Math.min(1, (bpm - 60) / 50);
    if (speedIntensity > 0) {
        ctx.strokeStyle = `rgba(100, 150, 255, ${speedIntensity * 0.3})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            // Ensure divisor never goes below 5 to prevent too-fast animation
            const lineSpeed = Math.max(5, 10 - speedIntensity * 5);
            const lineOffset = (Date.now() / lineSpeed + i * 80) % canvas.width;
            ctx.beginPath();
            ctx.moveTo(canvas.width - lineOffset, trackY - trackHeight/2 + 5);
            ctx.lineTo(canvas.width - lineOffset - 30, trackY + trackHeight/2 - 5);
            ctx.stroke();
        }
    }

    // Hit zone (where you should press) - dynamic based on enemy/BPM
    const hitZoneWidth = 40;
    const hitZonePulse = Math.sin(Date.now() / 100) * 3;

    // Determine hit zone color based on current enemy type
    let hitZoneColor = '#ffffff';
    if (enemy && enemy.alive) {
        const enemyColors = {
            swordsman: '#e63946',
            archer: '#2a9d8f',
            armored: '#457b9d',
            giant: '#e76f51',
            mage: '#9d4edd'
        };
        hitZoneColor = enemyColors[enemy.type] || '#ffffff';
    }

    // Outer glow when active
    if (phase === 1) {
        ctx.fillStyle = `${hitZoneColor}33`;
        ctx.fillRect(hitZoneX - hitZoneWidth/2 - 8, trackY - trackHeight/2 - 4, hitZoneWidth + 16, trackHeight + 8);
    }

    // Hit zone fill
    const hitZoneFillAlpha = phase === 1 ? 0.5 + Math.sin(Date.now() / 50) * 0.2 : 0.2;
    ctx.fillStyle = phase === 1 ? `${hitZoneColor}${Math.floor(hitZoneFillAlpha * 255).toString(16).padStart(2, '0')}` : 'rgba(255,255,255,0.15)';
    ctx.fillRect(hitZoneX - hitZoneWidth/2, trackY - trackHeight/2, hitZoneWidth, trackHeight);

    // Hit zone border (pulses with beat)
    ctx.strokeStyle = phase === 1 ? hitZoneColor : '#666666';
    ctx.lineWidth = phase === 1 ? 3 + beatPulse * 2 : 2;
    ctx.strokeRect(hitZoneX - hitZoneWidth/2 - (phase === 1 ? hitZonePulse/2 : 0), trackY - trackHeight/2, hitZoneWidth + (phase === 1 ? hitZonePulse : 0), trackHeight);

    // "HIT" label
    ctx.fillStyle = phase === 1 ? hitZoneColor : '#666666';
    ctx.font = phase === 1 ? 'bold 12px monospace' : 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HIT', hitZoneX, trackY - trackHeight/2 - 5);

    // Show "waiting for double-tap" indicator
    const timeSinceLastTap = performance.now() - lastTapTime;
    if (lastTapTime > 0 && timeSinceLastTap < DOUBLE_TAP_WINDOW && !isHolding) {
        // Pulsing ring showing double-tap window
        const progress = timeSinceLastTap / DOUBLE_TAP_WINDOW;
        ctx.strokeStyle = `rgba(0, 255, 255, ${1 - progress})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hitZoneX, trackY, 20 + progress * 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('TAP?', hitZoneX, trackY - trackHeight/2 - 15);
    }

    // Show charging progress in hit zone when holding
    if (isHolding && chargeLevel > 0) {
        // Charge fill bar
        ctx.fillStyle = `rgba(68, 136, 255, ${0.3 + chargeLevel * 0.5})`;
        ctx.fillRect(
            hitZoneX - hitZoneWidth/2,
            trackY + trackHeight/2 - chargeLevel * trackHeight,
            hitZoneWidth,
            chargeLevel * trackHeight
        );

        // Charge ring around hit zone
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hitZoneX, trackY, 18, -Math.PI/2, -Math.PI/2 + chargeLevel * Math.PI * 2);
        ctx.stroke();

        // "CHARGING" text
        if (chargeLevel < 1) {
            ctx.fillStyle = '#4488ff';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('HOLD...', hitZoneX, trackY - trackHeight/2 - 15);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('READY!', hitZoneX, trackY - trackHeight/2 - 15);
        }
    }

    // Draw beat markers (scrolling toward hit zone)
    beatMarkers.forEach(marker => {
        // Skip rendering hit markers (they explode into particles)
        if (marker.hit) return;

        const colors = {
            aggressive: '#ffff00',
            defensive: '#00ffff',
            charge: '#4488ff',
            triple: '#ff8844',
            tapthenhold: '#ff44aa'
        };
        const markerColor = colors[marker.type] || '#ffffff';
        const distToHit = Math.abs(marker.x - hitZoneX);
        const inHitZone = distToHit < 40;

        // HOLD marker: Draw tail first (behind the marker)
        if (marker.type === 'charge' && marker.tailLength) {
            // Shrink tail based on charge progress when holding in zone
            let displayTailLength = marker.tailLength;
            if (inHitZone && isHolding && chargeLevel > 0) {
                displayTailLength = marker.tailLength * (1 - chargeLevel);
            }
            const tailEnd = marker.x + displayTailLength;

            // Tail glow
            ctx.fillStyle = `rgba(68, 136, 255, 0.3)`;
            ctx.fillRect(marker.x, trackY - 8, displayTailLength, 16);

            // Tail body
            const gradient = ctx.createLinearGradient(marker.x, 0, tailEnd, 0);
            gradient.addColorStop(0, markerColor);
            gradient.addColorStop(1, `${markerColor}44`);
            ctx.fillStyle = gradient;
            ctx.fillRect(marker.x, trackY - 6, displayTailLength, 12);

            // Tail end cap (only if tail still visible)
            if (displayTailLength > 5) {
                ctx.fillStyle = `${markerColor}88`;
                ctx.beginPath();
                ctx.arc(tailEnd, trackY, 6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Pulsing stripes on tail when holding in zone
            if (inHitZone && isHolding && displayTailLength > 10) {
                const stripeOffset = (Date.now() / 50) % 20;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                for (let sx = marker.x + stripeOffset; sx < tailEnd; sx += 20) {
                    ctx.beginPath();
                    ctx.moveTo(sx, trackY - 5);
                    ctx.lineTo(sx, trackY + 5);
                    ctx.stroke();
                }
            }

            // Show consumed portion with bright flash
            if (inHitZone && isHolding && chargeLevel > 0) {
                const consumedStart = marker.x + displayTailLength;
                const consumedEnd = marker.x + marker.tailLength;
                ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() / 30) * 0.2})`;
                ctx.fillRect(consumedStart, trackY - 4, consumedEnd - consumedStart, 8);
            }
        }

        // TAP-HOLD marker: Draw tail on hold marker only
        if (marker.type === 'tapthenhold' && marker.isHold && marker.tailLength) {
            const tailEnd = marker.x + marker.tailLength;

            // Tail glow (pink)
            ctx.fillStyle = `rgba(255, 68, 170, 0.3)`;
            ctx.fillRect(marker.x, trackY - 6, marker.tailLength, 12);

            // Tail body
            const gradient = ctx.createLinearGradient(marker.x, 0, tailEnd, 0);
            gradient.addColorStop(0, markerColor);
            gradient.addColorStop(1, `${markerColor}44`);
            ctx.fillStyle = gradient;
            ctx.fillRect(marker.x, trackY - 4, marker.tailLength, 8);

            // Pulsing stripes when hold is active
            if (marker.holdActive && marker.tailLength > 10) {
                const stripeOffset = (Date.now() / 50) % 20;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                for (let sx = marker.x + stripeOffset; sx < tailEnd; sx += 20) {
                    ctx.beginPath();
                    ctx.moveTo(sx, trackY - 3);
                    ctx.lineTo(sx, trackY + 3);
                    ctx.stroke();
                }
            }
        }

        // Approaching glow (gets brighter near hit zone)
        if (distToHit < 80) {
            const glowIntensity = 1 - (distToHit / 80);
            ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.4})`;
            ctx.beginPath();
            ctx.arc(marker.x, trackY, 22 + glowIntensity * 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pulsing effect when in hit zone
        const pulseSize = inHitZone ? Math.sin(Date.now() / 50) * 4 : 0;
        const baseSize = 16; // Bigger markers for clarity

        // PENDING STATE: First tap of double-tap registered, waiting for second
        if (marker.pendingHit && !marker.holdActive) {
            // Success color with rapid pulse
            const pendingPulse = Math.sin(Date.now() / 30) * 3;
            ctx.fillStyle = marker.type === 'tapthenhold' ? '#ff88cc' : '#88ffaa';
            ctx.beginPath();
            ctx.arc(marker.x, trackY, baseSize + pendingPulse, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Symbol
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (marker.type === 'tapthenhold' && marker.isHold) {
                ctx.fillText('H', marker.x, trackY);
            } else {
                ctx.fillText('✓', marker.x, trackY);
            }
            ctx.textBaseline = 'alphabetic';

            // Prompt above
            const promptColor = marker.type === 'tapthenhold' ? '#ff88cc' : '#88ffaa';
            ctx.fillStyle = promptColor;
            ctx.font = 'bold 12px monospace';
            const prompt = (marker.type === 'tapthenhold' && marker.isHold) ? 'HOLD!' : 'TAP!';
            ctx.fillText(prompt, marker.x, trackY - baseSize - 10);

            // Ring expanding outward
            const ringProgress = ((Date.now() % 500) / 500);
            ctx.strokeStyle = `rgba(${marker.type === 'tapthenhold' ? '255, 136, 204' : '136, 255, 170'}, ${1 - ringProgress})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(marker.x, trackY, baseSize + ringProgress * 20, 0, Math.PI * 2);
            ctx.stroke();
        } else if (marker.holdActive) {
            // HOLDING STATE: Player is holding on hold marker
            const progress = marker.holdProgress || 0;
            const holdPulse = Math.sin(Date.now() / 30) * 2;

            // Background circle
            ctx.fillStyle = '#ff44aa';
            ctx.beginPath();
            ctx.arc(marker.x, trackY, baseSize + holdPulse, 0, Math.PI * 2);
            ctx.fill();

            // Progress arc
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(marker.x, trackY, baseSize + 3, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.stroke();

            // "H" symbol
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('H', marker.x, trackY);
            ctx.textBaseline = 'alphabetic';

            // "HOLD!" prompt
            ctx.fillStyle = progress >= 1 ? '#ffffff' : '#ff88cc';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(progress >= 1 ? 'READY!' : 'HOLD!', marker.x, trackY - baseSize - 10);

            // Particles while holding
            if (Math.random() < 0.3) {
                state.particles.push({
                    x: marker.x + (Math.random() - 0.5) * 30,
                    y: trackY + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 2 - 1,
                    life: 0.5,
                    color: '#ff44aa'
                });
            }
        } else {
            // Normal marker rendering
            // Marker circle (bigger)
            ctx.fillStyle = markerColor;
            ctx.beginPath();
            ctx.arc(marker.x, trackY, baseSize + pulseSize, 0, Math.PI * 2);
            ctx.fill();

            // Marker border (thicker when in zone)
            ctx.strokeStyle = inHitZone ? '#ffffff' : '#888888';
            ctx.lineWidth = inHitZone ? 4 : 2;
            ctx.stroke();

            // Marker symbol - BIGGER and clearer
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${inHitZone ? 18 : 16}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (marker.type === 'aggressive') {
                ctx.fillText('!', marker.x, trackY); // "!" for single tap
            } else if (marker.type === 'defensive') {
                // Show "1" on first marker, "2" on second
                ctx.fillText(marker.isSecond ? '2' : '1', marker.x, trackY);
            } else if (marker.type === 'charge') {
                ctx.fillText('H', marker.x, trackY); // "H" for hold
            } else if (marker.type === 'triple') {
                // Show "1", "2", "3" for triple tap
                ctx.fillText(`${marker.tripleIndex + 1}`, marker.x, trackY);
            } else if (marker.type === 'tapthenhold') {
                // "T" for tap marker, "H" for hold marker
                ctx.fillText(marker.isTap ? 'T' : 'H', marker.x, trackY);
            }
            ctx.textBaseline = 'alphabetic';
        }

        // Action label above marker when approaching (skip if pending/active - already has prompt)
        if (distToHit < 100 && distToHit > 40 && !marker.pendingHit && !marker.holdActive) {
            ctx.fillStyle = markerColor;
            ctx.font = 'bold 10px monospace';
            let label = 'TAP';
            if (marker.type === 'defensive') label = 'DBL';
            else if (marker.type === 'charge') label = 'HOLD';
            else if (marker.type === 'triple') label = 'TRI';
            else if (marker.type === 'tapthenhold') {
                label = marker.isTap ? 'TAP' : 'HOLD';
            }
            ctx.fillText(label, marker.x, trackY - baseSize - 8);
        }

        // Connect double-tap markers with a line
        if (marker.type === 'defensive' && !marker.isSecond) {
            // Find the second marker
            const secondMarker = beatMarkers.find(m =>
                m.type === 'defensive' && m.isSecond && !m.hit &&
                Math.abs(m.x - marker.x) < 80
            );
            if (secondMarker) {
                ctx.strokeStyle = `${markerColor}88`;
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(marker.x + 14, trackY);
                ctx.lineTo(secondMarker.x - 14, trackY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Connect triple-tap markers with lines
        // Draw from current marker to next marker (if both exist and not hit)
        if (marker.type === 'triple' && marker.tripleIndex < 2) {
            const nextMarker = beatMarkers.find(m =>
                m.type === 'triple' && m.tripleIndex === marker.tripleIndex + 1 && !m.hit
            );

            if (nextMarker) {
                ctx.strokeStyle = `${markerColor}88`;
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(marker.x + 14, trackY);
                ctx.lineTo(nextMarker.x - 14, trackY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Connect tap-hold markers with arrow line (tap → hold)
        if (marker.type === 'tapthenhold' && marker.isTap && !marker.hit) {
            const holdMarker = beatMarkers.find(m =>
                m.type === 'tapthenhold' && m.isHold && !m.hit
            );

            if (holdMarker) {
                ctx.strokeStyle = `${markerColor}88`;
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(marker.x + 14, trackY);
                ctx.lineTo(holdMarker.x - 14, trackY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrow head pointing to hold marker
                ctx.fillStyle = `${markerColor}88`;
                ctx.beginPath();
                ctx.moveTo(holdMarker.x - 14, trackY);
                ctx.lineTo(holdMarker.x - 22, trackY - 5);
                ctx.lineTo(holdMarker.x - 22, trackY + 5);
                ctx.fill();
            }
        }
    });

    // Beat tick marks on track
    for (let i = 0; i < 8; i++) {
        const tickX = hitZoneX + (i - 1) * 50;
        if (tickX > 0 && tickX < canvas.width) {
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tickX, trackY - 10);
            ctx.lineTo(tickX, trackY + 10);
            ctx.stroke();
        }
    }

    ctx.textAlign = 'left';
}

// ============================================
// EFFECTS
// ============================================
export function drawEffects() {
    const { ctx, canvas } = dom;

    // Screen flash
    if (state.flashAlpha > 0) {
        ctx.fillStyle = state.flashColor;
        ctx.globalAlpha = state.flashAlpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        state.flashAlpha -= 0.05;
    }

    // BIG WARIOWARE-STYLE PROMPT
    if (state.bigPromptAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = state.bigPromptAlpha;
        ctx.fillStyle = state.bigPromptColor;
        ctx.font = `bold ${Math.floor(36 * state.bigPromptScale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw shadow
        ctx.fillStyle = '#000000';
        ctx.fillText(state.bigPrompt, canvas.width/2 + 3, canvas.height/2 - 20 + 3);

        // Draw text
        ctx.fillStyle = state.bigPromptColor;
        ctx.fillText(state.bigPrompt, canvas.width/2, canvas.height/2 - 20);

        ctx.restore();

        // Animate
        state.bigPromptScale = Math.max(1, state.bigPromptScale - 0.03);
        state.bigPromptAlpha -= 0.015;
    }

    // Update and filter particles
    state.particles = state.particles.filter(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.globalAlpha = 1;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.life -= 0.03;

        return p.life > 0;
    });

    // Update and filter floating text
    state.floatingTexts = state.floatingTexts.filter(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.alpha;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;

        t.y += t.vy;
        t.alpha -= 0.02;

        return t.alpha > 0;
    });

    // Update and draw death ghosts (dying enemies)
    state.deathGhosts = state.deathGhosts.filter(ghost => {
        ctx.save();
        ctx.globalAlpha = ghost.life * 0.8;

        // Apply rotation and scale
        ctx.translate(ghost.x, ghost.y);
        ctx.rotate(ghost.rotation);
        ctx.scale(ghost.scale, ghost.scale);
        ctx.translate(-ghost.x, -ghost.y);

        // Ghost glow (fading)
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y - 20, 30 * ghost.life, 0, Math.PI * 2);
        ctx.fill();

        // Ghost body silhouette
        ctx.fillStyle = `rgba(0, 0, 0, ${ghost.life * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(ghost.x, ghost.y - 15, 12, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ghost head
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y - 42, 10, 0, Math.PI * 2);
        ctx.fill();

        // X eyes (dead)
        ctx.strokeStyle = ghost.color;
        ctx.lineWidth = 2;
        // Left eye X
        ctx.beginPath();
        ctx.moveTo(ghost.x - 7, ghost.y - 46);
        ctx.lineTo(ghost.x - 3, ghost.y - 42);
        ctx.moveTo(ghost.x - 7, ghost.y - 42);
        ctx.lineTo(ghost.x - 3, ghost.y - 46);
        ctx.stroke();
        // Right eye X
        ctx.beginPath();
        ctx.moveTo(ghost.x + 3, ghost.y - 46);
        ctx.lineTo(ghost.x + 7, ghost.y - 42);
        ctx.moveTo(ghost.x + 3, ghost.y - 42);
        ctx.lineTo(ghost.x + 7, ghost.y - 46);
        ctx.stroke();

        ctx.restore();

        // Update physics
        ghost.x += ghost.vx;
        ghost.y += ghost.vy;
        ghost.vy += 0.15; // Gentle gravity
        ghost.rotation += ghost.rotationSpeed;
        ghost.scale = Math.max(0.3, ghost.scale - 0.015);
        ghost.life -= 0.02;

        return ghost.life > 0;
    });
}

// ============================================
// CRT EFFECTS
// ============================================
export function drawCRT() {
    const { ctx, canvas } = dom;

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < canvas.height; y += 3) {
        ctx.fillRect(0, y, canvas.width, 1);
    }

    // Subtle vignette
    const vignette = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.height * 0.3,
        canvas.width/2, canvas.height/2, canvas.height * 0.8
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chromatic aberration on hits
    if (state.chromaOffset > 0.5) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = state.chromaOffset * 0.15;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-state.chromaOffset, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(state.chromaOffset, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }
    state.chromaOffset *= 0.85;
}

// ============================================
// GAME OVER SCREEN
// ============================================
export function drawGameOver() {
    const { ctx, canvas } = dom;
    const { player, highScore, maxBpmReached } = state;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${player.score}`, canvas.width/2, canvas.height/2 - 15);

    // Max BPM stat
    const bpmColor = maxBpmReached >= 100 ? '#ff4444' : (maxBpmReached >= 80 ? '#ffaa00' : '#44ff88');
    ctx.fillStyle = bpmColor;
    ctx.font = '12px monospace';
    ctx.fillText(`Max Tempo: ♪${Math.round(maxBpmReached)}`, canvas.width/2, canvas.height/2 + 8);

    // High score
    const isNewHighScore = player.score > highScore;
    if (isNewHighScore) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('NEW HIGH SCORE!', canvas.width/2, canvas.height/2 + 32);
    } else {
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.fillText(`Best: ${highScore}`, canvas.width/2, canvas.height/2 + 32);
    }

    ctx.fillStyle = '#666666';
    ctx.font = '12px monospace';
    ctx.fillText('Tap to restart', canvas.width/2, canvas.height/2 + 60);

    ctx.textAlign = 'left';
}
