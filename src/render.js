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

// Epic zone definitions - Elden Ring style progression every 10 kills
// Each zone has a complete color palette for visual cohesion
const ZONES = [
    {
        name: 'THE STARTING PLAINS',
        subtitle: 'Where legends are born',
        sky: ['#ff6b35', '#f79322', '#ff4444', '#1a0a0a'],
        sun: '#ffdd44',
        mountains: '#0a0505',
        ground: '#0f0808',
        cloudColor: 'rgba(255,200,150,0.4)',
        bgType: 'plains', // Rolling hills with distant castle
        // Zone-specific accent colors for effects
        accent: '#ffaa44',        // Primary accent
        accentAlt: '#ffdd88',     // Secondary accent
        killParticle: '#ff8844',  // Kill burst color
        comboGlow: '#ffcc00',     // Combo text glow
        streakColor: 'rgba(255, 200, 100, 0.2)',
        groundPulse: 'rgba(255,150,100,0.4)'
    },
    {
        name: 'CRIMSON WASTES',
        subtitle: 'Blood stains these sands',
        sky: ['#8b0000', '#cc2222', '#661111', '#1a0505'],
        sun: '#ff4444',
        mountains: '#2a0a0a',
        ground: '#1a0505',
        cloudColor: 'rgba(200,100,100,0.3)',
        bgType: 'wastes', // Jagged rocks and skull formations
        accent: '#ff2222',
        accentAlt: '#ff6666',
        killParticle: '#cc0000',
        comboGlow: '#ff4444',
        streakColor: 'rgba(255, 100, 100, 0.25)',
        groundPulse: 'rgba(255,50,50,0.4)'
    },
    {
        name: 'THE TOXIC MIRE',
        subtitle: 'Death seeps from below',
        sky: ['#2d5a27', '#1a4a1a', '#0d2d0d', '#051505'],
        sun: '#88ff44',
        mountains: '#0a1a05',
        ground: '#051a05',
        cloudColor: 'rgba(100,200,100,0.3)',
        bgType: 'swamp', // Dead trees and bubbling pools
        accent: '#44ff44',
        accentAlt: '#88ff88',
        killParticle: '#66ff22',
        comboGlow: '#44ff88',
        streakColor: 'rgba(100, 255, 100, 0.2)',
        groundPulse: 'rgba(100,255,100,0.4)'
    },
    {
        name: 'FROZEN PEAKS',
        subtitle: 'The cold claims all',
        sky: ['#a8d5e5', '#6ab7d4', '#3a8aaa', '#1a3a4a'],
        sun: '#ffffff',
        mountains: '#2a4a5a',
        ground: '#1a2a3a',
        cloudColor: 'rgba(200,230,255,0.5)',
        bgType: 'ice', // Sharp ice spikes and glaciers
        accent: '#88ddff',
        accentAlt: '#ffffff',
        killParticle: '#aaeeff',
        comboGlow: '#66ccff',
        streakColor: 'rgba(150, 200, 255, 0.3)',
        groundPulse: 'rgba(150,200,255,0.4)'
    },
    {
        name: 'ASHEN GRAVEYARD',
        subtitle: 'Here lie the fallen',
        sky: ['#4a4a4a', '#3a3a3a', '#2a2a2a', '#0a0a0a'],
        sun: '#888888',
        mountains: '#1a1a1a',
        ground: '#0f0f0f',
        cloudColor: 'rgba(100,100,100,0.4)',
        bgType: 'graveyard', // Tombstones and dead trees
        accent: '#aaaaaa',
        accentAlt: '#dddddd',
        killParticle: '#888888',
        comboGlow: '#cccccc',
        streakColor: 'rgba(150, 150, 150, 0.2)',
        groundPulse: 'rgba(150,150,150,0.3)'
    },
    {
        name: 'THE BURNING HELLS',
        subtitle: 'Embrace the flames',
        sky: ['#ff4400', '#cc2200', '#881100', '#220500'],
        sun: '#ffaa00',
        mountains: '#2a0a00',
        ground: '#1a0500',
        cloudColor: 'rgba(255,150,50,0.4)',
        bgType: 'volcanic', // Volcanic spires with lava glow
        accent: '#ff6600',
        accentAlt: '#ffaa44',
        killParticle: '#ff4400',
        comboGlow: '#ff8800',
        streakColor: 'rgba(255, 150, 50, 0.3)',
        groundPulse: 'rgba(255,100,0,0.5)'
    },
    {
        name: 'VOID BETWEEN WORLDS',
        subtitle: 'Reality fades...',
        sky: ['#1a0a2a', '#0f051a', '#05000a', '#000000'],
        sun: '#8844ff',
        mountains: '#0a0515',
        ground: '#050008',
        cloudColor: 'rgba(100,50,150,0.3)',
        bgType: 'void', // Floating islands and strange geometry
        accent: '#aa44ff',
        accentAlt: '#dd88ff',
        killParticle: '#8844ff',
        comboGlow: '#aa66ff',
        streakColor: 'rgba(150, 100, 255, 0.25)',
        groundPulse: 'rgba(150,50,255,0.4)'
    },
    {
        name: 'GOLDEN PARADISE',
        subtitle: 'Only the worthy enter',
        sky: ['#ffd700', '#ffaa00', '#cc8800', '#4a3500'],
        sun: '#ffffff',
        mountains: '#3a2a00',
        ground: '#2a1a00',
        cloudColor: 'rgba(255,220,100,0.5)',
        bgType: 'paradise', // Elegant spires and celestial pillars
        accent: '#ffd700',
        accentAlt: '#ffee88',
        killParticle: '#ffdd44',
        comboGlow: '#ffee00',
        streakColor: 'rgba(255, 220, 100, 0.35)',
        groundPulse: 'rgba(255,220,100,0.5)'
    },
    {
        name: 'THE FINAL DOMAIN',
        subtitle: 'You have become DEATH',
        sky: ['#ff00ff', '#aa00aa', '#550055', '#1a001a'],
        sun: '#ff44ff',
        mountains: '#2a0a2a',
        ground: '#150515',
        cloudColor: 'rgba(255,100,255,0.4)',
        bgType: 'final', // Dramatic spikes with eye motif
        accent: '#ff00ff',
        accentAlt: '#ff88ff',
        killParticle: '#ff44ff',
        comboGlow: '#ff00ff',
        streakColor: 'rgba(255, 100, 255, 0.35)',
        groundPulse: 'rgba(255,0,255,0.5)'
    }
];

// Pre-parse zone colors to avoid regex parsing every frame (performance optimization)
ZONES.forEach(zone => {
    // Parse 'rgba(r, g, b, a)' into [r, g, b, a] array
    const streakMatch = zone.streakColor.match(/[\d.]+/g);
    zone.streakColorParsed = streakMatch.map(Number);

    const pulseMatch = zone.groundPulse.match(/[\d.]+/g);
    zone.groundPulseParsed = pulseMatch.map(Number);
});

// Zone progression: every 5 kills = new zone (faster progression, more reward moments)
const KILLS_PER_ZONE = 5;

// Get current zone data (exported for other modules)
export function getCurrentZone() {
    const zoneIndex = Math.min(Math.floor(state.player.kills / KILLS_PER_ZONE), ZONES.length - 1);
    return ZONES[zoneIndex];
}

// Track current zone for transition detection
let currentZoneIndex = 0;
let zoneTransitionTimer = 0;
let zoneTransitionText = '';
let zoneTransitionSubtitle = '';
let showStartingZoneIntro = true; // Flag to show zone 1 intro on game start (true by default for first play)

// Reset zone state (called on game restart)
export function resetZone() {
    currentZoneIndex = 0;
    zoneTransitionTimer = 0;
    zoneTransitionText = '';
    zoneTransitionSubtitle = '';
    showStartingZoneIntro = true; // Trigger zone 1 intro on next frame
}

// Check if zone transition is currently showing (used to suppress other prompts)
export function isZoneTransitionActive() {
    return zoneTransitionTimer > 0;
}

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

// ============================================
// ZONE-SPECIFIC BACKGROUND SILHOUETTES
// ============================================
function drawZoneSilhouette(ctx, canvas, bgType, color, isFever) {
    const h = canvas.height;
    const w = canvas.width;
    const groundY = h - 40;

    ctx.fillStyle = color;

    switch (bgType) {
        case 'plains':
            // Rolling hills with distant castle
            ctx.beginPath();
            ctx.moveTo(0, h);
            // Gentle rolling hills
            ctx.lineTo(0, groundY - 30);
            ctx.quadraticCurveTo(60, groundY - 50, 120, groundY - 25);
            ctx.quadraticCurveTo(180, groundY - 40, 240, groundY - 20);
            // Distant castle silhouette
            ctx.lineTo(280, groundY - 20);
            ctx.lineTo(280, groundY - 70);
            ctx.lineTo(290, groundY - 70);
            ctx.lineTo(290, groundY - 85); // Tower
            ctx.lineTo(300, groundY - 85);
            ctx.lineTo(300, groundY - 70);
            ctx.lineTo(320, groundY - 70);
            ctx.lineTo(320, groundY - 20);
            // More hills
            ctx.quadraticCurveTo(370, groundY - 35, w, groundY - 15);
            ctx.lineTo(w, h);
            ctx.fill();
            break;

        case 'wastes':
            // Jagged rocks and skull-like formation
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, groundY - 40);
            ctx.lineTo(30, groundY - 70);
            ctx.lineTo(50, groundY - 45);
            ctx.lineTo(80, groundY - 90);
            ctx.lineTo(100, groundY - 55);
            // Skull rock formation
            ctx.lineTo(140, groundY - 55);
            ctx.lineTo(150, groundY - 75);
            ctx.quadraticCurveTo(180, groundY - 95, 210, groundY - 75); // Skull dome
            ctx.lineTo(220, groundY - 55);
            // Eye sockets (negative space suggestion)
            ctx.lineTo(260, groundY - 55);
            ctx.lineTo(280, groundY - 85);
            ctx.lineTo(300, groundY - 50);
            ctx.lineTo(340, groundY - 100);
            ctx.lineTo(370, groundY - 60);
            ctx.lineTo(w, groundY - 45);
            ctx.lineTo(w, h);
            ctx.fill();
            break;

        case 'swamp':
            // Dead twisted trees and murky shapes
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, groundY - 20);
            // Dead tree 1
            ctx.lineTo(40, groundY - 20);
            ctx.lineTo(45, groundY - 80);
            ctx.lineTo(35, groundY - 100); // Branch
            ctx.lineTo(45, groundY - 85);
            ctx.lineTo(55, groundY - 95); // Branch
            ctx.lineTo(50, groundY - 80);
            ctx.lineTo(55, groundY - 20);
            // Murky ground
            ctx.quadraticCurveTo(100, groundY - 30, 150, groundY - 15);
            // Dead tree 2 (smaller)
            ctx.lineTo(180, groundY - 15);
            ctx.lineTo(185, groundY - 55);
            ctx.lineTo(175, groundY - 65);
            ctx.lineTo(185, groundY - 58);
            ctx.lineTo(195, groundY - 70);
            ctx.lineTo(190, groundY - 55);
            ctx.lineTo(195, groundY - 15);
            // More murk
            ctx.quadraticCurveTo(250, groundY - 25, 300, groundY - 10);
            // Twisted stump
            ctx.lineTo(340, groundY - 10);
            ctx.lineTo(350, groundY - 45);
            ctx.lineTo(360, groundY - 10);
            ctx.lineTo(w, groundY - 20);
            ctx.lineTo(w, h);
            ctx.fill();
            break;

        case 'ice':
            // Sharp ice spikes and glaciers
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, groundY - 50);
            // Ice spikes - very sharp angles
            ctx.lineTo(25, groundY - 110);
            ctx.lineTo(40, groundY - 60);
            ctx.lineTo(60, groundY - 130);
            ctx.lineTo(80, groundY - 55);
            ctx.lineTo(100, groundY - 85);
            ctx.lineTo(120, groundY - 45);
            // Glacier plateau
            ctx.lineTo(180, groundY - 45);
            ctx.lineTo(200, groundY - 70);
            ctx.lineTo(250, groundY - 70);
            ctx.lineTo(270, groundY - 45);
            // More spikes
            ctx.lineTo(300, groundY - 100);
            ctx.lineTo(320, groundY - 50);
            ctx.lineTo(350, groundY - 120);
            ctx.lineTo(380, groundY - 55);
            ctx.lineTo(w, groundY - 40);
            ctx.lineTo(w, h);
            ctx.fill();

            // Icicle details (lighter color)
            if (!isFever) {
                ctx.fillStyle = 'rgba(150,200,220,0.3)';
                for (let i = 0; i < 8; i++) {
                    const x = 30 + i * 50;
                    ctx.beginPath();
                    ctx.moveTo(x, groundY - 40);
                    ctx.lineTo(x + 3, groundY - 55);
                    ctx.lineTo(x + 6, groundY - 40);
                    ctx.fill();
                }
            }
            break;

        case 'graveyard':
            // Tombstones, crosses, and dead trees
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, groundY - 15);
            // Cross 1
            ctx.lineTo(30, groundY - 15);
            ctx.lineTo(30, groundY - 70);
            ctx.lineTo(20, groundY - 70);
            ctx.lineTo(20, groundY - 80);
            ctx.lineTo(30, groundY - 80);
            ctx.lineTo(30, groundY - 95);
            ctx.lineTo(40, groundY - 95);
            ctx.lineTo(40, groundY - 80);
            ctx.lineTo(50, groundY - 80);
            ctx.lineTo(50, groundY - 70);
            ctx.lineTo(40, groundY - 70);
            ctx.lineTo(40, groundY - 15);
            // Tombstone 1
            ctx.lineTo(80, groundY - 15);
            ctx.lineTo(80, groundY - 45);
            ctx.quadraticCurveTo(95, groundY - 55, 110, groundY - 45);
            ctx.lineTo(110, groundY - 15);
            // Dead tree
            ctx.lineTo(150, groundY - 15);
            ctx.lineTo(155, groundY - 60);
            ctx.lineTo(145, groundY - 75);
            ctx.lineTo(155, groundY - 65);
            ctx.lineTo(165, groundY - 80);
            ctx.lineTo(160, groundY - 60);
            ctx.lineTo(165, groundY - 15);
            // More tombstones
            ctx.lineTo(200, groundY - 15);
            ctx.lineTo(200, groundY - 40);
            ctx.lineTo(220, groundY - 40);
            ctx.lineTo(220, groundY - 15);
            // Cross 2 (distant, smaller)
            ctx.lineTo(270, groundY - 15);
            ctx.lineTo(270, groundY - 50);
            ctx.lineTo(263, groundY - 50);
            ctx.lineTo(263, groundY - 57);
            ctx.lineTo(270, groundY - 57);
            ctx.lineTo(270, groundY - 70);
            ctx.lineTo(280, groundY - 70);
            ctx.lineTo(280, groundY - 57);
            ctx.lineTo(287, groundY - 57);
            ctx.lineTo(287, groundY - 50);
            ctx.lineTo(280, groundY - 50);
            ctx.lineTo(280, groundY - 15);
            // Final tombstone
            ctx.lineTo(340, groundY - 15);
            ctx.lineTo(340, groundY - 35);
            ctx.quadraticCurveTo(355, groundY - 45, 370, groundY - 35);
            ctx.lineTo(370, groundY - 15);
            ctx.lineTo(w, groundY - 15);
            ctx.lineTo(w, h);
            ctx.fill();
            break;

        case 'volcanic':
            // Volcanic spires with lava cracks
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, groundY - 60);
            ctx.lineTo(40, groundY - 100);
            ctx.lineTo(60, groundY - 70);
            ctx.lineTo(100, groundY - 140);
            ctx.lineTo(130, groundY - 80);
            ctx.lineTo(160, groundY - 110);
            ctx.lineTo(190, groundY - 65);
            // Volcano crater
            ctx.lineTo(220, groundY - 65);
            ctx.lineTo(240, groundY - 95);
            ctx.lineTo(260, groundY - 85);
            ctx.lineTo(280, groundY - 95);
            ctx.lineTo(300, groundY - 65);
            // More spires
            ctx.lineTo(330, groundY - 120);
            ctx.lineTo(360, groundY - 70);
            ctx.lineTo(w, groundY - 50);
            ctx.lineTo(w, h);
            ctx.fill();

            // Lava glow cracks
            if (!isFever) {
                ctx.strokeStyle = 'rgba(255,100,0,0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(100, groundY - 130);
                ctx.lineTo(105, groundY - 115);
                ctx.lineTo(95, groundY - 100);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(330, groundY - 110);
                ctx.lineTo(335, groundY - 95);
                ctx.stroke();
            }
            break;

        case 'void':
            // Floating islands and inverted geometry
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, groundY - 30);
            // Floating chunk 1 (inverted mountain pointing up from ground)
            ctx.lineTo(60, groundY - 30);
            ctx.lineTo(80, groundY - 80);
            ctx.lineTo(100, groundY - 30);
            // Gap (floating island above - drawn separately)
            ctx.lineTo(180, groundY - 25);
            // Inverted spire
            ctx.lineTo(200, groundY - 25);
            ctx.lineTo(220, groundY - 100);
            ctx.lineTo(240, groundY - 25);
            // Another gap
            ctx.lineTo(320, groundY - 30);
            ctx.lineTo(350, groundY - 70);
            ctx.lineTo(380, groundY - 30);
            ctx.lineTo(w, groundY - 25);
            ctx.lineTo(w, h);
            ctx.fill();

            // Floating islands (in sky)
            if (!isFever) {
                ctx.fillStyle = 'rgba(50,20,80,0.6)';
                // Island 1
                ctx.beginPath();
                ctx.moveTo(120, 80);
                ctx.lineTo(100, 100);
                ctx.lineTo(160, 100);
                ctx.lineTo(140, 80);
                ctx.lineTo(130, 70);
                ctx.fill();
                // Island 2
                ctx.beginPath();
                ctx.moveTo(280, 60);
                ctx.lineTo(260, 80);
                ctx.lineTo(320, 80);
                ctx.lineTo(300, 60);
                ctx.fill();
            }
            break;

        case 'paradise':
            // Elegant spires and celestial columns
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, groundY - 25);
            // Elegant curved hill
            ctx.quadraticCurveTo(50, groundY - 45, 100, groundY - 25);
            // Column 1
            ctx.lineTo(120, groundY - 25);
            ctx.lineTo(120, groundY - 90);
            ctx.lineTo(115, groundY - 95);
            ctx.lineTo(125, groundY - 100);
            ctx.lineTo(135, groundY - 95);
            ctx.lineTo(130, groundY - 90);
            ctx.lineTo(130, groundY - 25);
            // Gentle curve
            ctx.quadraticCurveTo(180, groundY - 40, 230, groundY - 25);
            // Tall spire
            ctx.lineTo(250, groundY - 25);
            ctx.lineTo(255, groundY - 120);
            ctx.lineTo(260, groundY - 130); // Pointed top
            ctx.lineTo(265, groundY - 120);
            ctx.lineTo(270, groundY - 25);
            // More elegance
            ctx.quadraticCurveTo(320, groundY - 35, 360, groundY - 25);
            // Column 2
            ctx.lineTo(370, groundY - 25);
            ctx.lineTo(370, groundY - 70);
            ctx.lineTo(380, groundY - 75);
            ctx.lineTo(390, groundY - 70);
            ctx.lineTo(390, groundY - 25);
            ctx.lineTo(w, groundY - 20);
            ctx.lineTo(w, h);
            ctx.fill();
            break;

        case 'final':
            // Dramatic aggressive spikes with eye motif
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, groundY - 80);
            ctx.lineTo(30, groundY - 130);
            ctx.lineTo(50, groundY - 70);
            ctx.lineTo(80, groundY - 150);
            ctx.lineTo(110, groundY - 80);
            // Central eye structure
            ctx.lineTo(140, groundY - 80);
            ctx.lineTo(150, groundY - 100);
            ctx.quadraticCurveTo(200, groundY - 140, 250, groundY - 100); // Eye curve top
            ctx.lineTo(260, groundY - 80);
            // More spikes
            ctx.lineTo(290, groundY - 160);
            ctx.lineTo(320, groundY - 90);
            ctx.lineTo(350, groundY - 140);
            ctx.lineTo(380, groundY - 70);
            ctx.lineTo(w, groundY - 60);
            ctx.lineTo(w, h);
            ctx.fill();

            // Eye detail
            if (!isFever) {
                // Eye socket glow
                ctx.fillStyle = 'rgba(255,0,255,0.3)';
                ctx.beginPath();
                ctx.ellipse(200, groundY - 95, 30, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                // Pupil
                ctx.fillStyle = 'rgba(255,50,255,0.6)';
                ctx.beginPath();
                ctx.arc(200, groundY - 95, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        default:
            // Fallback generic mountains
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(50, groundY - 60);
            ctx.lineTo(120, groundY - 30);
            ctx.lineTo(180, groundY - 80);
            ctx.lineTo(250, groundY - 40);
            ctx.lineTo(320, groundY - 90);
            ctx.lineTo(400, groundY - 50);
            ctx.lineTo(w, h);
            ctx.fill();
    }
}

export function drawBackground() {
    const { ctx, canvas } = dom;
    const { player } = state;

    initClouds();

    // Determine zone based on kills
    const newZoneIndex = Math.min(Math.floor(player.kills / KILLS_PER_ZONE), ZONES.length - 1);

    // Starting zone intro (Elden Ring style "area discovered" for zone 1)
    if (showStartingZoneIntro && state.gameState === 'playing') {
        showStartingZoneIntro = false;
        const startZone = ZONES[0];
        zoneTransitionTimer = 3.5; // Slightly longer for dramatic effect
        zoneTransitionText = startZone.name;
        zoneTransitionSubtitle = startZone.subtitle;

        // Dramatic entrance effects
        state.screenShake = 8;
        state.flashColor = startZone.sun;
        state.flashAlpha = 0.2;

        // Rising dust/embers from ground
        for (let i = 0; i < 20; i++) {
            state.particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height - 40 + Math.random() * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 4 - 2,
                life: 2.0,
                color: startZone.accent
            });
        }
    }

    // Check for zone transition (zones 2+)
    if (newZoneIndex !== currentZoneIndex && player.kills > 0) {
        currentZoneIndex = newZoneIndex;
        const zone = ZONES[currentZoneIndex];
        zoneTransitionTimer = 3.0; // 3 second display
        zoneTransitionText = zone.name;
        zoneTransitionSubtitle = zone.subtitle;

        // Big screen effects for zone transition
        state.screenShake = 15;
        state.flashColor = zone.sun;
        state.flashAlpha = 0.3;

        // Spawn celebration particles
        for (let i = 0; i < 30; i++) {
            state.particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 10 - 5,
                life: 1.5,
                color: zone.sun
            });
        }
    }

    // Get current zone (always need valid zone for color lookups)
    const zone = ZONES[currentZoneIndex];

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
        gradient.addColorStop(0, zone.sky[0]);
        gradient.addColorStop(0.4, zone.sky[1]);
        gradient.addColorStop(0.7, zone.sky[2]);
        gradient.addColorStop(1, zone.sky[3]);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Beat pulse decay
    state.beatPulse *= 0.9;

    // Parallax clouds (speed scales with BPM!)
    const bpmMultiplier = 0.5 + (state.bpm / STARTING_BPM) * 0.8; // Faster clouds at higher BPM
    const cloudColor = player.feverMode ? 'rgba(255,100,255,0.3)' : zone.cloudColor;
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

    // Speed streaks at high BPM (appears after 80 BPM) - zone-colored
    if (state.bpm >= 80) {
        const streakIntensity = Math.min(1, (state.bpm - 80) / 40);
        // Use pre-parsed zone streak color
        const [sR, sG, sB, sA] = zone.streakColorParsed;
        const streakAlpha = player.feverMode ? streakIntensity * 0.35 : sA * streakIntensity;
        ctx.strokeStyle = player.feverMode
            ? `rgba(255, 100, 255, ${streakAlpha})`
            : `rgba(${sR}, ${sG}, ${sB}, ${streakAlpha})`;
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

    // Sun/moon (changes with zone)
    const sunColor = player.feverMode ? '#ff66ff' : zone.sun;
    ctx.fillStyle = sunColor;
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 60, 40 + (player.feverMode ? Math.sin(Date.now() / 80) * 5 : 0), 0, Math.PI * 2);
    ctx.fill();

    // Sun glow
    ctx.fillStyle = player.feverMode ? 'rgba(255,100,255,0.2)' : 'rgba(255,220,100,0.15)';
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 60, 55, 0, Math.PI * 2);
    ctx.fill();

    // Fever sparkle particles - zone-colored
    if (player.feverMode && Math.random() < 0.3) {
        state.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - 60),
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            life: 0.8,
            color: Math.random() > 0.5 ? zone.accent : zone.comboGlow
        });
    }

    // Zone-specific background silhouettes
    const mountainColor = player.feverMode ? '#200a20' : zone.mountains;
    ctx.fillStyle = mountainColor;
    drawZoneSilhouette(ctx, canvas, zone.bgType, mountainColor, player.feverMode);

    // Ground with beat pulse
    const groundColor = player.feverMode ? '#150510' : zone.ground;
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // Ground beat pulse line - zone-colored
    if (state.beatPulse > 0.1) {
        // Use pre-parsed zone ground pulse color
        const [pR, pG, pB, pA] = zone.groundPulseParsed;
        const pulseAlpha = player.feverMode ? state.beatPulse * 0.6 : pA * state.beatPulse;
        ctx.strokeStyle = player.feverMode
            ? `rgba(255,0,255,${pulseAlpha})`
            : `rgba(${pR},${pG},${pB},${pulseAlpha})`;
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

    // Weight shift (slower cycle for natural feel)
    const weightShift = Math.sin(Date.now() / 2000) * 1.5;

    // Subtle head look (watches for enemies)
    const headLook = Math.sin(Date.now() / 1500) * 0.08;

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

    // Apply beat bob when idle with weight shift
    if (player.stance === 'idle' && player.damageTimer <= 0) {
        y -= beatBob + breathe;
        x += weightShift; // Subtle side-to-side weight shift
        bodyLean = headLook; // Slight body sway matching head look
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

    // Slash arc for aggressive stance (normal attack)
    if (player.stance === 'aggressive') {
        // Sweeping arc trail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 20, 35, -0.3, 1.2);
        ctx.stroke();

        // Inner arc (fading)
        ctx.strokeStyle = 'rgba(255, 220, 150, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 20, 32, 0, 1.0);
        ctx.stroke();

        // Speed lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = 0.2 + i * 0.25;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 25, 20 + Math.sin(angle) * 25);
            ctx.lineTo(Math.cos(angle) * 40, 20 + Math.sin(angle) * 40);
            ctx.stroke();
        }
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

    // Charge attack wind-up effect
    if (player.stance === 'charge') {
        // Glowing power arcs
        ctx.strokeStyle = 'rgba(68, 136, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 35, 20, -1.5, 0.5);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(136, 200, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 35, 28, -1.2, 0.2);
        ctx.stroke();
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
    // Head offset for looking around during idle
    const headOffsetX = (player.stance === 'idle' && player.damageTimer <= 0) ? headLook * 15 : 0;

    // Apply head offset for idle look animation
    ctx.save();
    ctx.translate(headOffsetX, 0);

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

    ctx.restore(); // End head offset transform

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

    // Spawn approach dust when enemy is moving toward position
    if (enemy.x > enemy.targetX && Math.random() < 0.3) {
        // Footstep dust from ground
        state.particles.push({
            x: enemy.x + (Math.random() - 0.5) * 20,
            y: canvas.height - 42 + Math.random() * 5,
            vx: -1 - Math.random() * 2, // Dust trails behind
            vy: -Math.random() * 1.5,
            life: 0.5,
            color: 'rgba(136, 119, 102, 0.5)' // Dusty brown, semi-transparent
        });
    }

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

    // Zone indicator (small, top center)
    const zoneIndex = Math.min(Math.floor(player.kills / KILLS_PER_ZONE), ZONES.length - 1);
    const zoneName = ZONES[zoneIndex].name;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(zoneName, canvas.width / 2, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`☠${player.kills}`, canvas.width / 2, 22);

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

    // Combo (scales with combo count!) - zone-colored
    if (player.combo > 1) {
        const zone = getCurrentZone();
        const comboScale = Math.min(2.5, 1 + player.combo * 0.1);
        const fontSize = Math.floor(12 * comboScale);

        // Parse zone combo glow for rgba usage
        const comboGlowHex = zone.comboGlow;
        const comboR = parseInt(comboGlowHex.slice(1,3), 16);
        const comboG = parseInt(comboGlowHex.slice(3,5), 16);
        const comboB = parseInt(comboGlowHex.slice(5,7), 16);

        // Fever mode glow - uses zone accent
        if (player.feverMode) {
            ctx.fillStyle = `rgba(${comboR}, ${comboG}, ${comboB}, ${0.4 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.beginPath();
            ctx.arc(canvas.width - 30, 38, 25 + Math.sin(Date.now() / 80) * 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (player.combo >= 5) {
            // Fire glow at 5+ - zone-colored
            ctx.fillStyle = `rgba(${comboR}, ${comboG}, ${comboB}, ${0.25 + Math.sin(Date.now() / 100) * 0.1})`;
            ctx.beginPath();
            ctx.arc(canvas.width - 30, 38, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        // Combo text color intensifies with combo count
        ctx.fillStyle = player.feverMode ? zone.accent : (player.combo >= 10 ? zone.accent : zone.comboGlow);
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillText(`x${player.combo}`, canvas.width - 10, 42);

        // "FEVER!" label when in fever mode
        if (player.feverMode) {
            ctx.fillStyle = zone.accent;
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

    // Beat-synced radial glow (always visible, pulses on beat)
    if (beatPulse > 0.1) {
        const glowRadius = 25 + beatPulse * 20;
        const gradient = ctx.createRadialGradient(hitZoneX, trackY, 0, hitZoneX, trackY, glowRadius);
        gradient.addColorStop(0, `${hitZoneColor}${Math.floor(beatPulse * 80).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${hitZoneColor}${Math.floor(beatPulse * 40).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(hitZoneX, trackY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Outer glow when active (input window)
    if (phase === 1) {
        ctx.fillStyle = `${hitZoneColor}33`;
        ctx.fillRect(hitZoneX - hitZoneWidth/2 - 8, trackY - trackHeight/2 - 4, hitZoneWidth + 16, trackHeight + 8);

        // Extra "ready" pulse rings during input phase
        const ringPulse = (Date.now() % 500) / 500;
        ctx.strokeStyle = `${hitZoneColor}${Math.floor((1 - ringPulse) * 60).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hitZoneX, trackY, 15 + ringPulse * 25, 0, Math.PI * 2);
        ctx.stroke();
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

    // EPIC ZONE TRANSITION ANNOUNCEMENT (Elden Ring style)
    if (zoneTransitionTimer > 0) {
        ctx.save();

        // Cinematic black bars
        const barHeight = 30;
        const barAlpha = Math.min(1, zoneTransitionTimer);
        ctx.fillStyle = `rgba(0, 0, 0, ${barAlpha * 0.8})`;
        ctx.fillRect(0, 0, canvas.width, barHeight);
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        // Zone name with dramatic entrance
        const textAlpha = Math.min(1, zoneTransitionTimer * 0.8);
        const slideIn = Math.max(0, 1 - zoneTransitionTimer / 3) * 50;

        // Gold/epic text styling
        ctx.globalAlpha = textAlpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Zone name - large epic font
        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = '#000000';
        ctx.fillText(zoneTransitionText, canvas.width/2 + 2 + slideIn, canvas.height/2 - 10 + 2);
        ctx.fillStyle = '#ffd700'; // Gold
        ctx.fillText(zoneTransitionText, canvas.width/2 + slideIn, canvas.height/2 - 10);

        // Subtitle - smaller italic
        ctx.font = 'italic 12px monospace';
        ctx.fillStyle = '#000000';
        ctx.fillText(zoneTransitionSubtitle, canvas.width/2 + 1 + slideIn, canvas.height/2 + 15 + 1);
        ctx.fillStyle = '#ccaa00';
        ctx.fillText(zoneTransitionSubtitle, canvas.width/2 + slideIn, canvas.height/2 + 15);

        // Decorative lines
        ctx.strokeStyle = `rgba(255, 215, 0, ${textAlpha * 0.6})`;
        ctx.lineWidth = 1;
        const lineWidth = 80 + (1 - zoneTransitionTimer / 3) * 40;
        ctx.beginPath();
        ctx.moveTo(canvas.width/2 - lineWidth + slideIn, canvas.height/2 - 30);
        ctx.lineTo(canvas.width/2 + lineWidth + slideIn, canvas.height/2 - 30);
        ctx.moveTo(canvas.width/2 - lineWidth + slideIn, canvas.height/2 + 30);
        ctx.lineTo(canvas.width/2 + lineWidth + slideIn, canvas.height/2 + 30);
        ctx.stroke();

        ctx.restore();

        // Decay timer
        zoneTransitionTimer -= 0.016; // ~60fps
    }

    // Cap particle arrays to prevent memory leak (keep oldest, they're more important visually)
    const MAX_PARTICLES = 200;
    const MAX_FLOATING_TEXTS = 30;
    const MAX_DEATH_GHOSTS = 10;

    if (state.particles.length > MAX_PARTICLES) {
        state.particles = state.particles.slice(-MAX_PARTICLES);
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

    // Cap floating texts
    if (state.floatingTexts.length > MAX_FLOATING_TEXTS) {
        state.floatingTexts = state.floatingTexts.slice(-MAX_FLOATING_TEXTS);
    }

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

    // Cap death ghosts
    if (state.deathGhosts.length > MAX_DEATH_GHOSTS) {
        state.deathGhosts = state.deathGhosts.slice(-MAX_DEATH_GHOSTS);
    }

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

    // Dynamic vignette - intensifies at low health
    const lives = state.player.lives;
    const dangerIntensity = lives === 1 ? 0.6 : (lives === 2 ? 0.5 : 0.4);
    const dangerColor = lives === 1 ? '80, 0, 0' : '0, 0, 0'; // Red tint at 1 HP
    const innerRadius = lives === 1 ? 0.2 : 0.3; // Smaller safe zone at low HP

    const vignette = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.height * innerRadius,
        canvas.width/2, canvas.height/2, canvas.height * 0.8
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.7, `rgba(${dangerColor}, ${dangerIntensity * 0.3})`);
    vignette.addColorStop(1, `rgba(${dangerColor}, ${dangerIntensity})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Heartbeat edge pulse at 1 HP
    if (lives === 1) {
        const heartbeat = Math.sin(Date.now() / 150) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255, 0, 0, ${heartbeat * 0.3})`;
        ctx.lineWidth = 3 + heartbeat * 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    }

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

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${player.score}`, canvas.width/2, canvas.height/2 - 35);

    // Zone reached (Elden Ring style)
    const zoneIndex = Math.min(Math.floor(player.kills / KILLS_PER_ZONE), ZONES.length - 1);
    const zoneName = ZONES[zoneIndex].name;
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px monospace';
    ctx.fillText(`Reached: ${zoneName}`, canvas.width/2, canvas.height/2 - 15);

    // Stats row
    ctx.font = '11px monospace';
    const bpmColor = maxBpmReached >= 100 ? '#ff4444' : (maxBpmReached >= 80 ? '#ffaa00' : '#44ff88');
    ctx.fillStyle = bpmColor;
    ctx.fillText(`♪${Math.round(maxBpmReached)} BPM`, canvas.width/2 - 50, canvas.height/2 + 5);
    ctx.fillStyle = '#ff6666';
    ctx.fillText(`☠${player.kills} kills`, canvas.width/2 + 50, canvas.height/2 + 5);

    // High score
    const isNewHighScore = player.score > highScore;
    if (isNewHighScore) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('NEW HIGH SCORE!', canvas.width/2, canvas.height/2 + 30);
    } else {
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.fillText(`Best: ${highScore}`, canvas.width/2, canvas.height/2 + 30);
    }

    ctx.fillStyle = '#666666';
    ctx.font = '12px monospace';
    ctx.fillText('Tap to restart', canvas.width/2, canvas.height/2 + 55);

    ctx.textAlign = 'left';
}
