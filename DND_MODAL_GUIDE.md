# DnD Story Room - Comprehensive Modal Guide

## Overview

The DnD Story Room now features a comprehensive modal interface that provides access to all game capabilities in an organized, tabbed layout. This modal serves as the central hub for all DnD activities, from character creation to session management.

## Accessing the Modal

The modal can be accessed in two ways when in the DnD Story Room:

1. **Top Bar Button**: Click the 📖 button in the top navigation bar
2. **Composer Button**: Click the 📖 button next to the media uploader (＋) in the message input area

Both buttons are only visible when you're in the DnD Story Room (`dndstoryroom`).

## Modal Tabs

### 1. Characters Tab 👥

**Purpose**: View all party members and manage your character

**Features**:
- Grid display of all characters in the current session
- Real-time HP tracking with color-coded indicators:
  - 🟢 Green (>60% HP): Healthy
  - 🟡 Orange (30-60% HP): Wounded
  - 🔴 Red (<30% HP): Critical
- Full attribute display with emoji icons:
  - 💪 Might: Physical force and endurance
  - 🎯 Finesse: Speed, dexterity, precision
  - 🧠 Wit: Reasoning and magical logic
  - 👁️ Instinct: Perception and awareness
  - ✨ Presence: Leadership and persuasion
  - 🛡️ Resolve: Mental toughness and willpower
  - 🎲 Chaos: Unpredictability and luck
- Skills display (first 3, with ellipsis if more)
- Perks display (first 2, with ellipsis if more)
- Living/dead status indicator (💚/💀)

**Create/Edit Character**:
- Click "Create/Edit Character" button to open character creator
- Only available during lobby phase
- Allocate 28 points across 7 attributes (1-7 each)
- Select 3-6 skills from 16 available options
- Choose up to 3 perks from 9 available options
- Character automatically saved when you click "Save Character"

### 2. Events Tab 📜

**Purpose**: View complete history of all events that have occurred

**Features**:
- Reverse chronological order (newest first)
- Color-coded outcome indicators:
  - 🟢 Green: Success or Critical Success
  - 🔴 Red: Failure or Catastrophic Failure
  - 🟡 Yellow: Partial Success
- Detailed roll information:
  - Base D20 roll
  - Attribute modifier
  - Total vs. DC (Difficulty Class)
- Event type and round number
- Full narrative text

**Example Event Display**:
```
Round 5 | Exploration
Alice explores the ancient ruins carefully...
Roll: 14 + 2 = 16 vs DC 13
Result: Success! (+20 HP)
```

### 3. World State Tab 🌍

**Purpose**: Track global game state and environmental factors

**Panels**:

**🐉 Active Monster**:
- Monster name
- Current HP
- Check penalty (typically -2)
- Time since summoned
- Empty state if no monster active

**📊 Statistics**:
- Morale: Party morale level
- Reputation: World reputation score
- Rounds Survived: Current round number

**🤝 Allies**:
- List of recruited NPCs
- Ally names
- Empty state if no allies

**📜 Status Effects**:
- Active buffs/debuffs
- Temporary modifiers
- Turn-based effects
- Empty state if none active

### 4. Lobby Tab 👥

**Purpose**: Manage lobby participation for upcoming sessions

**Features**:
- Join/Leave lobby button
- Live user count display
- List of users currently in lobby
- Only available when session status is "lobby"

**States**:
- Not in lobby: "Join Lobby" button
- In lobby: "Leave Lobby" button
- Session not in lobby: Button disabled

### 5. Spectate Tab 👁️

**Purpose**: Allow non-players to influence the game using gold

**Influence Options**:

1. **💚 Heal Party** (50 gold)
   - Restores 20 HP to all living characters
   - Great for helping the party survive tough battles

2. **⭐ Grant Bonus** (30 gold)
   - Gives +3 bonus to the next check
   - Can turn failures into successes

3. **🍀 Lucky Event** (40 gold)
   - Increases chance of positive outcomes
   - Affects event selection probability

**How It Works**:
- Click a button to spend gold
- Confirm the transaction
- Effect applies immediately
- System message broadcast to room
- Only available during active sessions

### 6. Controls Tab ⚙️

**Purpose**: Manage session lifecycle and view detailed information

**Session Management** (Co-owners only):
- 🎲 **New Session**: Create a new adventure
- ▶️ **Start Session**: Begin the adventure (lobby → active)
- ⏭️ **Advance Event**: Trigger next event round
- ⏹️ **End Session**: Conclude the session

**Session Information**:
- Title: Session name
- Status: lobby/active/completed
- Round: Current round number
- Alive: Number of living characters
- Created: Timestamp of session creation

**Help & Information**:
- Quick guide on how to play
- Step-by-step instructions
- Game mechanics overview

## System Messages

All major actions generate system messages visible only in the DnD room:

- **🎲 New DnD session "Title" has been created! Join the lobby to participate.**
- **🎲 Username created their character!**
- **🎲 Username updated their character!**
- **🎲 Username joined the DnD lobby!**
- **🎲 Username left the DnD lobby.**
- **🎲 The adventure begins! X heroes embark on their journey.**
- **🎲 Event narrative...**
- **💀 Total party kill! The adventure ends in tragedy.**
- **🎲 The adventure concludes! Thank you for playing.**
- **🎲 Username spent Xg on [influence type]!**

## Keyboard Shortcuts

- **ESC**: Close the modal
- **Tab**: Navigate between form fields (character creation)

## Responsive Design

The modal is fully responsive:
- Desktop: Wide modal with side-by-side panels
- Mobile: Full-screen modal, stacked panels, adjusted grid layouts

## Real-Time Updates

The modal automatically updates via WebSocket events:
- `dnd:sessionCreated` - New session started
- `dnd:sessionStarted` - Session transitioned to active
- `dnd:characterUpdated` - Character created/modified
- `dnd:eventResolved` - New event occurred
- `dnd:sessionEnded` - Session concluded
- `dnd:lobby` - Lobby members changed
- `dnd:spectatorInfluence` - Spectator action taken

## Technical Details

### Character Creation Validation

**Attributes**:
- Total: Exactly 28 points
- Range: 1-7 per attribute
- With skill bonuses: Still capped at 7

**Skills**:
- Minimum: 3 skills
- Maximum: 6 skills
- Each skill may provide attribute bonuses and HP bonuses

**Perks**:
- Maximum: 3 perks
- No duplicates allowed
- Various effects (crit range, bonuses, special abilities)

### Session Flow

1. **Lobby Phase**:
   - Players join lobby
   - Create/edit characters
   - Co-owner starts when ready

2. **Active Phase**:
   - Co-owner advances rounds
   - Events resolved automatically
   - Characters take damage/healing
   - World state updates

3. **Completion**:
   - Manual end by co-owner
   - Automatic end on TPK (Total Party Kill)
   - Session status set to "completed"

### Error Handling

The modal includes comprehensive error handling:
- Try-catch blocks for JSON parsing
- Fallback values for missing data
- Error messages for failed API calls
- Graceful degradation for missing elements

## API Endpoints Used

- `GET /api/dnd-story/current` - Load session, characters, events
- `GET /api/dnd-story/lobby` - Get lobby users
- `POST /api/dnd-story/lobby/join` - Join lobby
- `POST /api/dnd-story/lobby/leave` - Leave lobby
- `POST /api/dnd-story/sessions` - Create session
- `POST /api/dnd-story/sessions/:id/start` - Start session
- `POST /api/dnd-story/sessions/:id/advance` - Advance round
- `POST /api/dnd-story/sessions/:id/end` - End session
- `POST /api/dnd-story/characters` - Create/update character
- `POST /api/dnd-story/spectate/influence` - Apply influence

## Best Practices

### For Players

1. Create your character during lobby phase
2. Balance attributes based on playstyle
3. Choose complementary skills and perks
4. Monitor HP and world state
5. Coordinate with other players

### For Co-owners

1. Wait for players to join lobby
2. Ensure characters are created
3. Start session when ready
4. Advance at reasonable intervals
5. End gracefully or let TPK occur naturally

### For Spectators

1. Watch the adventure unfold
2. Influence at critical moments
3. Heal party when HP is low
4. Grant bonuses for tough checks
5. Don't spam influences (costs gold!)

## Future Enhancements

Potential improvements for future versions:

- Status effect management interface
- Monster defeat mechanism
- Character respec/reset option
- Session replay/history viewer
- Advanced statistics and analytics
- Character sheet export
- Custom event creation
- Achievements and milestones

## Troubleshooting

**Modal won't open**:
- Ensure you're in the DnD Story Room
- Check browser console for errors
- Try refreshing the page

**Can't create character**:
- Session must be in "lobby" status
- Check attribute point total (must be 28)
- Verify skill/perk count limits

**Buttons disabled**:
- Check your role (some require co-owner)
- Verify session status
- Ensure you meet action requirements

**Data not updating**:
- Check WebSocket connection
- Refresh the page
- Verify you're logged in

## Support

For issues, questions, or feature requests related to the DnD modal, please contact the repository maintainers or open an issue on GitHub.

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Author**: Copilot Developer  
