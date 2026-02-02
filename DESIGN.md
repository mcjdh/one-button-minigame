# One Button Warrior - Systems Deep Dive

## Current Core Loop (Proven Fun)
```
ENEMY APPEARS → READ TYPE → CHOOSE (tap/double-tap) → RESOLVE → REPEAT
     ↓              ↓              ↓                    ↓
  Visual cue    Pattern       One button          Feedback
  (color/weapon) recognition   binary choice       (juice!)
```

This loop works because:
1. **Clear input language**: Tap = aggressive, Double-tap = defensive
2. **Readable threats**: Color + weapon = instant recognition
3. **Rhythm pressure**: Forces gut decisions, no overthinking
4. **Satisfying feedback**: Crits, grazes, screen shake, sounds

---

## SYSTEM 1: Enemy Scaling

### Current
- Swordsman (red) → TAP
- Archer (green) → DOUBLE-TAP

### Scaling Ideas

**Tier 1 - Simple Additions:**
```
SHIELDBEARER (blue) → DOUBLE-TAP twice (break shield, then kill)
ASSASSIN (purple) → TAP within tighter window (faster enemy)
BOMBER (orange) → TAP, but has area effect on death
```

**Tier 2 - Sequence Enemies:**
```
KNIGHT → DOUBLE-TAP (block charge) → TAP (counter attack)
         Requires 2-beat sequence to defeat

MAGE → TAP (interrupt cast) → DOUBLE-TAP (deflect spell)
       Cast time = 2 beats, interrupt or face spell
```

**Tier 3 - Boss Encounters:**
```
WARLORD (every 20 kills?)
  - Multiple phases
  - Phase 1: Block 3 attacks (DOUBLE-TAP × 3)
  - Phase 2: Find opening (TAP when eyes flash)
  - Phase 3: Finish (TAP × 2 rapid)
  - Unique music intensity
```

**Tier 4 - Combo Enemies (2+ at once):**
```
[SWORD] + [ARCHER] approaching together
  - Must handle in order of arrival
  - Or: new input? TAP+TAP = cleave both?
```

---

## SYSTEM 2: Input Evolution

### Current
- TAP (single press, 200ms window) = Aggressive
- DOUBLE-TAP (two presses within 150ms) = Defensive

### Scaling Ideas

**Add HOLD mechanic:**
```
HOLD (press and hold 500ms+) = CHARGE ATTACK
  - More powerful, kills armored enemies
  - Risk: Vulnerable while charging
  - New enemy type: ARMORED requires HOLD
```

**Input combinations create depth without adding buttons:**
```
TAP         = Quick attack
DOUBLE-TAP  = Block/Deflect
HOLD        = Charge attack
TAP→HOLD    = Feint into charge (advanced technique)
```

**Rhythm patterns (advanced players):**
```
Beat: 1    2    3    4
      TAP  -    TAP  -    = Combo attack (bonus damage)
      -    DBL  -    DBL  = Perfect defense (reflect projectiles)
```

---

## SYSTEM 3: Progression & Meta

### Short-term (within a run)

**Combo System (current):**
```
Kills without damage → Combo multiplier
x1 → x2 → x3 → x5 → x10
Points scale with combo
```

**Power-ups (drops from enemies):**
```
⚡ FURY    - Next 3 attacks are auto-crits
🛡️ AEGIS   - Block one free hit
❤️ HEART   - Restore 1 life
⏰ SLOW    - Tempo decreases for 10 beats
```

**Fever Mode:**
```
At 10+ combo, enter FEVER:
  - All attacks are critical
  - Music intensifies (extra layers)
  - Visual filter (more saturated)
  - Lasts until hit
```

### Long-term (between runs)

**Unlockable Warriors:**
```
SPEARMAN - Longer TAP window, less damage
BERSERKER - Shorter windows, more damage
MONK - HOLD charges super attack
DANCER - Rhythm patterns deal bonus damage
```

**Permanent Upgrades (currency from runs):**
```
HEART CONTAINERS - Start with 4/5 lives
TIMING TRAINING - Wider input windows
CRITICAL CHANCE - Base crit % increase
GRAZE MASTERY - Higher graze chance
```

**Stage/World Progression:**
```
WORLD 1: Sunset Plains (current)
  - Swordsman, Archer
  - 60-90 BPM

WORLD 2: Dark Forest
  - Add Assassin, Shieldbearer
  - 70-100 BPM
  - New music theme
  - Tree silhouettes, darker palette

WORLD 3: Frozen Peak
  - Add Mage, Bomber
  - 80-110 BPM
  - Snow particles
  - Slippery timing? (input delay mechanic)
```

---

## SYSTEM 4: Audio Scaling

### Current
- Procedural drums (kick/snare)
- Procedural bass (chord roots)
- Procedural lead (random pentatonic)
- SFX layer

### Scaling Ideas

**Dynamic music layers based on state:**
```
Layer 0 (Base):     Drums only
Layer 1 (Playing):  + Bass
Layer 2 (Combo 3+): + Lead melody
Layer 3 (Combo 7+): + Arpeggio
Layer 4 (Fever):    + Extra percussion + filter sweep
```

**Per-world music themes:**
```
World 1: Major pentatonic, warm, heroic
World 2: Minor pentatonic, mysterious, tense
World 3: Dorian mode, cold, epic
Boss:    Unique composition, dynamic phases
```

**Reactive audio:**
```
- Perfect timing = musical flourish
- Damage = dissonant hit
- Combo break = music briefly mutes
- Near-death = heartbeat layered in
```

---

## SYSTEM 5: Visual Scaling

### Current
- Silhouette warriors (Patapon style)
- Sunset gradient background
- Particle effects
- Screen shake

### Scaling Ideas

**Environment variety:**
```
Plains:  Sunset gradient, rolling hills, grass tufts
Forest:  Dark green/purple, tree silhouettes, fog particles
Peak:    Blue/white gradient, snow particles, ice crystals
Castle:  Interior, torchlight flicker, stone pillars
```

**Character expression:**
```
Current: Basic eye movement
Add:
  - Squash/stretch on actions
  - Anticipation frames before attacks
  - Unique idle animations per warrior
  - Death animations for enemies (fall, explode, fade)
```

**Juice escalation:**
```
Normal kill:    Small particles
Critical:       Large particles + screen shake
Overkill:       Huge particles + screen shake + flash
Fever mode:     Constant subtle particles + color shift
Boss defeat:    Slow-mo + massive explosion + victory pose
```

**UI evolution:**
```
Minimal:       Hearts, score (current)
Add:           Combo counter with fire effect at high combos
Add:           Enemy queue preview (what's coming next)
Add:           BPM indicator (shows current tempo)
Boss:          Health bar for boss
```

---

## SYSTEM 6: Difficulty Scaling

### Current
- BPM increases every 8 bars (60 → 120)

### Smarter Scaling

**Adaptive difficulty:**
```javascript
// Track player performance
let recentResults = []; // Last 10 encounters

// If player is crushing it (90%+ success)
  → Increase BPM faster
  → Introduce harder enemy types sooner
  → Tighter timing windows

// If player is struggling (< 50% success)
  → Slow BPM increase
  → More forgiving windows
  → More graze chances
```

**Difficulty modes:**
```
CHILL:    50-80 BPM, wide windows, extra lives
NORMAL:   60-100 BPM, standard windows
INTENSE:  70-120 BPM, tight windows, fewer grazes
MASTER:   80-140 BPM, perfect timing required, no grazes
```

**Endless vs Campaign:**
```
ENDLESS (current):
  - Pure score chase
  - Infinite scaling
  - Leaderboards

CAMPAIGN:
  - Fixed levels with designed enemy sequences
  - Boss at end of each world
  - Story beats between worlds
  - Unlocks new warriors/upgrades
```

---

## IMPLEMENTATION PRIORITY

### For Game Jam (next 24h):
1. ✅ Core loop (DONE)
2. [ ] Add HOLD mechanic for variety
3. [ ] Add 1-2 more enemy types
4. [ ] Simple fever mode at high combo
5. [ ] Polish title/game over screens
6. [ ] High score persistence (localStorage)

### Post-Jam Expansion:
1. Multiple worlds with themes
2. Unlockable warriors
3. Permanent progression
4. Boss encounters
5. Mobile-friendly touch controls
6. Leaderboards

### Dream Features:
1. Level editor
2. Multiplayer (take turns, compare scores)
3. Daily challenges
4. Soundtrack release
5. Speedrun mode (fixed seed, compete on time)

---

## WHY THIS SCALES WELL

The core mechanic (one button, binary choice, rhythm pressure) is:

1. **Infinitely tunable** - BPM, windows, enemy speed all adjustable
2. **Horizontally expandable** - New enemies = new patterns to learn
3. **Vertically expandable** - HOLD adds depth without complexity
4. **Platform agnostic** - Works on keyboard, touch, controller
5. **Speedrun friendly** - Deterministic with practice
6. **Accessible** - Anyone can play, mastery takes time

The Patapon visual style is:

1. **Fast to produce** - Silhouettes are simple shapes
2. **Universally readable** - High contrast, clear forms
3. **Emotionally expressive** - Eyes convey everything
4. **Scalable** - Works at any resolution
5. **Distinctive** - Stands out, memorable

The procedural audio is:

1. **Always fresh** - Slight variations each run
2. **Perfectly synced** - No audio drift, beat is truth
3. **Memory efficient** - No audio files to load
4. **Layerable** - Easy to add/remove intensity
5. **Mood flexible** - Change scale = change feel
