# DnD Game Room Enhancements

## Overview

This document describes the enhancements made to the DnD Story Room game, including new diverse event types and couple system integration.

## New Features

### 1. Diverse Event Categories (26 New Events)

Added a rich variety of new events to make the game more engaging and varied:

#### Funny/Comedic Events (4)
- **Mimic Mishap**: Treasure chest turns out to be a toothy monster
- **Banana Peel Trap**: Classic slapstick hazard
- **Cursed Joke Book**: Ancient jokes that can heal or harm
- **Wardrobe Malfunction**: Embarrassing clothing mishaps

#### Romantic Events (4)
- **Under the Stars**: Intimate moment under starlit sky
- **Secret Admirer**: Discovery of a love letter
- **Tavern Dance**: Romantic dance sequence
- **Cold Night**: Sharing warmth on a freezing night

#### Sexy/NSFW Events (4)
- **Hot Springs Discovery**: Relaxing in magical springs
- **Enchanting Encounter**: Seductive stranger interaction
- **Release Tension**: Private moment to relieve stress
- **Enchanted Wine**: Wine with interesting properties

#### Gory/Horror Events (4)
- **Forbidden Ritual**: Dark blood magic altar
- **Blade Trap**: Vicious dismemberment hazard
- **Undead Ambush**: Zombie horde attack
- **Chamber of Horrors**: Torture chamber exploration

#### Game-Altering Events (3)
- **Reality Warp**: Change character attributes
- **Divine Blessing**: God's intervention
- **Time Paradox**: Time loop mechanics

#### Challenge Events (3)
- **Sphinx's Riddle**: Deadly intelligence test
- **Death Gauntlet**: Trap-filled obstacle course
- **Trial of Strength**: Combat coordination test

#### Mysterious Events (4)
- **Whispering Darkness**: Secrets from shadows
- **Vision of Fate**: Prophetic glimpses
- **Ancient Sentinel**: Guardian awakening
- **Unknown Portal**: Interdimensional exploration

### 2. Couple System Integration

#### Couple Detection
- System automatically detects when two players in a session are a couple (via site's couple_links)
- Couples are identified by querying active couple relationships

#### Couple Bonuses
When couples participate together in events:
- **+2 modifier bonus** to checks for couple-specific events
- Bonus shows as "couple_synergy" in the check breakdown
- Events display a 💕 emoji prefix when couple bonuses apply

#### Couple Event Weighting
- Events marked with `coupleBonus: true` are **3x more likely** to be selected when couples are present
- 6 events specifically designed for couples:
  - Under the Stars
  - Tavern Dance
  - Cold Night
  - Hot Springs Discovery
  - Release Tension
  - Enchanted Wine

#### Smart Character Selection
- Couple events automatically try to pair actual couple members together
- Falls back to random selection if no couples available
- Maintains game balance while rewarding relationship roleplay

### 3. Technical Implementation

#### Event Template Structure
```javascript
event_name: {
  type: EVENT_TYPES.SOCIAL,
  title: "Event Title",
  minPlayers: 2,
  maxPlayers: 30,
  coupleBonus: true,  // NEW: Marks couple-specific events
  text: {
    intro: "{CHAR1} and {CHAR2}...",
    critical_success: "Amazing outcome!",
    success: "Good outcome",
    partial: "Mixed outcome",
    failure: "Bad outcome",
    catastrophic: "Terrible outcome"
  },
  check: {
    attribute: "presence",
    dc: 13
  },
  outcomes: {
    critical_success: { heal: 30, buff: "protective_bond" },
    success: { heal: 20 },
    // ... other outcomes
  }
}
```

#### Couple Detection Function
```javascript
function areCouple(char1, char2, couplePairs) {
  // Checks if two characters are in an active couple relationship
  // Order-independent (A+B === B+A)
}
```

#### Enhanced Event Selection
```javascript
function selectEventTemplate(templates, aliveCount, round, rng, characters, couplePairs) {
  // Detects couples in session
  // Weights couple events 3x higher when couples present
  // Returns appropriate event for current context
}
```

### 4. Benefits

#### For All Players
- 26 new events provide much more variety
- Events cover funny, romantic, sexy, gory, game-altering, challenging, and mysterious themes
- Better narrative diversity keeps sessions fresh

#### For Couples
- Relationship status has mechanical impact
- Bonus rewards for playing together
- Special romantic/intimate events
- Visible couple indicator (💕 emoji)
- Encourages couples to participate together

#### For NSFW Content
- 4 NSFW events appropriate for 18+ audience
- Tasteful and context-appropriate
- Optional (appears randomly like other events)

## Testing

### Test Suite
Created `scripts/test-dnd-enhancements.js` to validate:
- All 38 total events (12 original + 26 new)
- Event structure and required fields
- Outcome text completeness
- Placeholder consistency
- Couple detection logic
- Event selection weighting

### Test Results
```
Total Events: 38
✅ Funny/Comedic: 4
✅ Romantic: 4
✅ Sexy/NSFW: 4
✅ Gory/Horror: 4
✅ Game-Altering: 3
✅ Challenge: 3
✅ Mysterious: 4
✅ Couple-Specific: 6
✅ All validations passed
```

## Backward Compatibility

All changes are fully backward compatible:
- Original 12 events still work unchanged
- New couple system is optional (works without couples)
- No database schema changes required
- No breaking changes to existing API

## Usage

### For Players
1. Join a DnD session as usual
2. If you're in a couple, the system automatically detects it
3. Couple events are more likely to appear
4. Look for 💕 emoji to see when couple bonuses apply
5. Enjoy +2 bonus on couple event checks

### For Developers
```javascript
// Event selection now includes couple awareness
const { template } = dndEventResolution.selectEventTemplate(
  dndEventTemplates.EVENT_TEMPLATES,
  aliveChars.length,
  session.round,
  rng,
  aliveChars,        // NEW: Pass alive characters
  couplePairs        // NEW: Pass couple relationships
);

// Check includes couple bonus context
const checkResult = dndEventResolution.performCheck(
  mainChar,
  template.check.attribute,
  template.check.dc,
  rng,
  { coupleBonus: isCouple && template.coupleBonus }  // NEW: Couple bonus
);
```

## Future Enhancements

Potential additions:
- More couple-specific events
- Couple achievement tracking
- Special couple-only storylines
- Couple reputation system
- Relationship strength mechanics

## Security & Content

- All NSFW content is age-appropriate for 18+ audience
- Gory content is for mature audiences
- No explicit/graphic content
- Maintains tasteful tone throughout
- Respects site's content guidelines
