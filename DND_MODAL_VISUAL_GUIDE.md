# DnD Modal Visual Changes

## Modal Appearance

### Overall Modal
```
╔═══════════════════════════════════════════════════════════╗
║ 🎲 DnD                                          [X]       ║  <- Neon green glow around edges
║ No session | No session | Round 0 | Alive: 0              ║  
╠═══════════════════════════════════════════════════════════╣
║ [Characters] [Events] [World State] [Lobby] [Spectate]   ║  <- Tab navigation
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Party Members                   [Create/Edit Character] ║
║                                                           ║
║  [Character cards displayed here...]                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Visual Effect Details

**Normal State (Session Not Active):**
- Faint neon green glow: `box-shadow: 0 0 20px rgba(0, 255, 100, 0.15)`
- Green border: `border: 1px solid rgba(0, 255, 100, 0.2)`
- Static appearance

**Active Session State:**
- Same green glow but with **pulsing animation**
- Pulses between `0.15` and `0.25` opacity over 3 seconds
- Subtle, smooth transition using `ease-in-out`
- Creates a "living" effect indicating active gameplay

## Character Creation Panel

### Extended Form Fields

```
╔═══════════════════════════════════════════════════════════╗
║ Create Your Character                            [X]      ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Character Name: [____________________]                   ║
║  Race: [Select race...            ▾]                      ║
║  Gender: [Select gender...        ▾]                      ║
║  Background: [Select background...▾]                      ║
║  Age (18+): [___]                                         ║  <- NEW FIELD
║                                                           ║
║  Character Traits                                         ║  <- NEW SECTION
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ Describe your character's traits, personality,     │ ║
║  │ and quirks...                                       │ ║
║  │                                                     │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  Special Abilities                                        ║  <- NEW SECTION
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ List any special abilities or powers your          │ ║
║  │ character has...                                    │ ║
║  │                                                     │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  💪 Might [3]  🎯 Finesse [3]  🧠 Wit [3]                 ║
║  👁️ Instinct [3]  ✨ Presence [3]  🛡️ Resolve [3]       ║
║  🎲 Chaos [3]                                             ║
║  Points: 28 / 28                                          ║
║                                                           ║
║  Select 3-6 Skills                                        ║
║  [ ] Warrior  [ ] Rogue  [ ] Mage  [ ] Scholar...        ║
║                                                           ║
║  Select up to 3 Perks                                     ║
║  [ ] Critical Eye  [ ] Lucky Dodge  [ ] Iron Will...     ║
║                                                           ║
║  [Save Character]                                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Field Styling
- **Age field**: Number input with min=18, max=999
- **Traits/Abilities textareas**: 
  - Dark background (`#2a2a2a`)
  - Green border on focus (`#00ff64`)
  - 300 character limit
  - Resizable vertically
  - Placeholder text in muted color

## Spectate Tab

### Updated Gold Costs

**BEFORE:**
```
Spectator Influence
Spend gold to influence the game:

[💚 Heal Party (50g)]
Restore 20 HP to all characters

[⭐ Grant Bonus (30g)]
+3 bonus to next check

[🍀 Lucky Event (40g)]
Increase chance of positive outcome
```

**AFTER:**
```
Spectator Influence
Spend gold to influence the game:

[💚 Heal Party (500g)]         <- Updated from 50g
Restore 20 HP to all characters

[⭐ Grant Bonus (350g)]         <- Updated from 30g
+3 bonus to next check

[🍀 Lucky Event (500g)]         <- Updated from 40g
Increase chance of positive outcome
```

## Color Scheme

### Neon Green Glow
- **Base Color**: `rgb(0, 255, 100)`
- **Glow Opacity**: `0.15` (normal) → `0.25` (pulse peak)
- **Border Opacity**: `0.2`
- Complements existing dark theme
- Provides sci-fi/cyberpunk aesthetic
- Maintains good contrast and readability

### Animation Timing
```css
@keyframes dndPulseGlow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(0, 255, 100, 0.15); 
  }
  50% { 
    box-shadow: 0 0 25px rgba(0, 255, 100, 0.25); 
  }
}
```
- Duration: 3 seconds
- Timing function: `ease-in-out` (smooth transitions)
- Infinite loop
- Only active when session status = "active"

## User Experience

### Visual Feedback States

1. **Modal Closed**: Not visible
2. **Modal Open, No Session**: Static green glow
3. **Modal Open, Lobby Session**: Static green glow
4. **Modal Open, Active Session**: Pulsing green glow (indicates live gameplay)
5. **Modal Open, Completed Session**: Static green glow

### Form Interactions

1. **Age Field**:
   - Click to enter age
   - Shows error if < 18 or > 999
   - Optional (can leave blank)
   - Number-only input

2. **Traits/Abilities**:
   - Click to focus (green border appears)
   - Type freely (300 char limit)
   - Resize vertically if needed
   - Optional fields

3. **Spectator Buttons**:
   - Shows gold cost in label
   - Disabled when session not active
   - Confirmation dialog before spending
   - Success message after purchase
   - Broadcasts to room

## Performance Characteristics

### CSS-Only Animation
- **No JavaScript timer**: Animation runs purely in CSS
- **GPU Accelerated**: Box-shadow can use GPU
- **Minimal CPU**: No frame-by-frame JavaScript execution
- **Low Memory**: Single animation definition
- **Smooth**: Browser-optimized timing

### Class Toggle
```javascript
// Minimal JavaScript - just toggle class
if (session && session.status === 'active') {
  modalShell.classList.add('session-active');
} else {
  modalShell.classList.remove('session-active');
}
```

Only runs when:
- Modal is rendered
- Session state changes
- No continuous polling or checking

## Accessibility

- All form fields have labels
- Button descriptions are clear
- Visual effects don't impair readability
- Keyboard navigation maintained
- Screen reader compatible (no content in animation)
- Color contrast remains sufficient with glow

## Browser Compatibility

The visual effects use standard CSS3 features:
- `box-shadow` (widely supported)
- `@keyframes` (widely supported)
- `rgba()` colors (widely supported)
- No vendor prefixes needed for modern browsers
- Graceful degradation (modal still functional without effects)
