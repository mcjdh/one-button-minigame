// ============================================
// RENDERING
// ============================================
import { DOUBLE_TAP_WINDOW } from './constants.js';
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
export function drawBackground() {
    const { ctx, canvas } = dom;
    const { player } = state;

    // Sunset gradient with beat pulse (more intense in fever mode)
    const pulseIntensity = state.beatPulse * (player.feverMode ? 0.3 : 0.15);
    const feverPulse = player.feverMode ? Math.sin(Date.now() / 100) * 0.15 : 0;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (player.feverMode) {
        // Purple/magenta fever palette
        gradient.addColorStop(0, `rgb(${255}, ${50 + pulseIntensity * 50}, ${150 + pulseIntensity * 50})`);
        gradient.addColorStop(0.4, `rgb(${200 + feverPulse * 55}, ${50 + pulseIntensity * 40}, ${180 + pulseIntensity * 40})`);
        gradient.addColorStop(0.7, `rgb(${150}, ${30 + pulseIntensity * 30}, ${150 + pulseIntensity * 30})`);
        gradient.addColorStop(1, '#1a0a1a');
    } else {
        // Normal sunset palette
        gradient.addColorStop(0, `rgb(${255}, ${107 + pulseIntensity * 50}, ${53 + pulseIntensity * 50})`);
        gradient.addColorStop(0.4, `rgb(${247}, ${147 + pulseIntensity * 40}, ${30 + pulseIntensity * 40})`);
        gradient.addColorStop(0.7, `rgb(${255}, ${68 + pulseIntensity * 30}, ${68 + pulseIntensity * 30})`);
        gradient.addColorStop(1, '#1a0a0a');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Beat pulse decay
    state.beatPulse *= 0.9;

    // Sun (pink in fever mode)
    ctx.fillStyle = player.feverMode ? '#ff66ff' : '#ffdd44';
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 60, 40 + (player.feverMode ? Math.sin(Date.now() / 80) * 5 : 0), 0, Math.PI * 2);
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

    // Silhouette mountains
    ctx.fillStyle = '#0a0505';
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

    // Ground
    ctx.fillStyle = '#0f0808';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
}

// ============================================
// WARRIOR (PLAYER)
// ============================================
export function drawWarrior() {
    const { ctx, canvas } = dom;
    const { player, chargeLevel } = state;

    const x = 60;
    const y = canvas.height - 45;

    // SQUASH & STRETCH based on stance
    let squashX = 1, squashY = 1;
    if (player.stance === 'aggressive' || player.stance === 'triple') {
        // Stretch forward on attack
        squashX = 1.15;
        squashY = 0.9;
    } else if (player.stance === 'defensive' || player.stance === 'tapthenhold') {
        // Squash down on block/dispel
        squashX = 1.1;
        squashY = 0.85;
    } else if (player.stance === 'stumble') {
        // Wobbly on stumble
        squashX = 0.85 + Math.sin(Date.now() / 50) * 0.1;
        squashY = 1.1;
    }

    // Apply squash/stretch transform
    ctx.save();
    ctx.translate(x, y);
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

    ctx.fillStyle = '#000000';

    // Body (simple silhouette) - scale up when charging
    const scale = 1 + chargeLevel * 0.15;
    ctx.beginPath();
    ctx.ellipse(x, y - 20, 12 * scale, 20 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(x, y - 48 - chargeLevel * 5, 10 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (expressive!)
    ctx.fillStyle = player.stance === 'charge' ? '#4488ff' : '#ffffff';
    const eyeOffsetX = player.stance === 'aggressive' ? 2 : (player.stance === 'charge' ? 1 : 0);
    const eyeY = y - 50 - chargeLevel * 5;
    ctx.beginPath();
    ctx.arc(x - 3 + eyeOffsetX, eyeY, 4, 0, Math.PI * 2);
    ctx.arc(x + 5 + eyeOffsetX, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (intense when charging)
    ctx.fillStyle = player.stance === 'charge' ? '#ffffff' : '#000000';
    ctx.beginPath();
    ctx.arc(x - 2 + eyeOffsetX, eyeY, player.stance === 'charge' ? 1 : 2, 0, Math.PI * 2);
    ctx.arc(x + 6 + eyeOffsetX, eyeY, player.stance === 'charge' ? 1 : 2, 0, Math.PI * 2);
    ctx.fill();

    // Weapon/Shield based on stance
    ctx.fillStyle = '#222222';
    if (player.stance === 'aggressive') {
        // Sword raised
        ctx.save();
        ctx.translate(x + 15, y - 30);
        ctx.rotate(-0.5);
        ctx.fillRect(-2, -25, 4, 30);
        ctx.fillRect(-5, -25, 10, 5);
        ctx.restore();
    } else if (player.stance === 'triple') {
        // Triple slash - sword with motion lines
        ctx.save();
        ctx.translate(x + 18, y - 35);
        ctx.rotate(-0.7);
        ctx.fillStyle = '#ff8844';
        ctx.fillRect(-2, -25, 4, 30);
        ctx.fillRect(-5, -25, 10, 5);
        // Motion lines
        ctx.strokeStyle = '#ff884488';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-10 - i * 6, -20 + i * 8);
            ctx.lineTo(-10 - i * 6, 5 + i * 8);
            ctx.stroke();
        }
        ctx.restore();
    } else if (player.stance === 'defensive') {
        // Shield up
        ctx.beginPath();
        ctx.ellipse(x + 20, y - 25, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else if (player.stance === 'tapthenhold') {
        // Magic dispel - glowing hand
        ctx.fillStyle = '#ff44aa';
        ctx.beginPath();
        ctx.arc(x + 20, y - 30, 12, 0, Math.PI * 2);
        ctx.fill();
        // Magic glow
        ctx.fillStyle = 'rgba(255, 68, 170, 0.4)';
        ctx.beginPath();
        ctx.arc(x + 20, y - 30, 20 + Math.sin(Date.now() / 50) * 3, 0, Math.PI * 2);
        ctx.fill();
        // Sparkles
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 15 + Math.sin(Date.now() / 100) * 5, y - 35, 2, 0, Math.PI * 2);
        ctx.arc(x + 25, y - 25 + Math.cos(Date.now() / 80) * 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (player.stance === 'charge' || chargeLevel > 0.3) {
        // Charged heavy weapon overhead
        ctx.fillStyle = chargeLevel > 0.8 || player.stance === 'charge' ? '#4488ff' : '#222222';
        ctx.save();
        ctx.translate(x, y - 55 - chargeLevel * 10);
        ctx.rotate(-0.2);
        // Heavy sword/hammer
        ctx.fillRect(-4, -20, 8, 35);
        ctx.fillRect(-10, -25, 20, 10);
        ctx.restore();
    } else {
        // Idle - sword down
        ctx.fillRect(x + 10, y - 20, 4, 25);
    }

    ctx.restore(); // End squash/stretch transform
}

// ============================================
// ENEMY
// ============================================
export function drawEnemy() {
    const { ctx, canvas } = dom;
    const { enemy } = state;

    if (!enemy) return;

    const x = enemy.x;
    const y = enemy.y;

    // Glow effect behind enemy (colored by type)
    const glowColors = {
        swordsman: 'rgba(255,68,68,0.3)',
        archer: 'rgba(68,255,68,0.3)',
        armored: 'rgba(68,136,255,0.4)',
        giant: 'rgba(255,136,68,0.4)',
        mage: 'rgba(255,68,170,0.4)'
    };
    ctx.fillStyle = glowColors[enemy.type] || 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(x, y - 25, 35, 0, Math.PI * 2);
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

    // BPM indicator (pulses with beat)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + beatPulse * 0.4})`;
    ctx.font = '10px monospace';
    ctx.fillText(`♪${Math.round(bpm)}`, 90, 20);

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

    // Track background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, trackY - trackHeight/2, canvas.width, trackHeight);

    // Hit zone (where you should press)
    const hitZoneWidth = 40;
    ctx.fillStyle = phase === 1 ? 'rgba(255,255,0,0.4)' : 'rgba(255,255,255,0.15)';
    ctx.fillRect(hitZoneX - hitZoneWidth/2, trackY - trackHeight/2, hitZoneWidth, trackHeight);

    // Hit zone border
    ctx.strokeStyle = phase === 1 ? '#ffff00' : '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(hitZoneX - hitZoneWidth/2, trackY - trackHeight/2, hitZoneWidth, trackHeight);

    // "HIT" label
    ctx.fillStyle = phase === 1 ? '#ffff00' : '#666666';
    ctx.font = 'bold 10px monospace';
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
    const { player, highScore } = state;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${player.score}`, canvas.width/2, canvas.height/2);

    // High score
    const isNewHighScore = player.score > highScore;
    if (isNewHighScore) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('NEW HIGH SCORE!', canvas.width/2, canvas.height/2 + 25);
    } else {
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.fillText(`Best: ${highScore}`, canvas.width/2, canvas.height/2 + 25);
    }

    ctx.fillStyle = '#666666';
    ctx.font = '12px monospace';
    ctx.fillText('Tap to restart', canvas.width/2, canvas.height/2 + 55);

    ctx.textAlign = 'left';
}
