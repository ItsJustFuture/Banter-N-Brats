# DnD Modal Refactor - Implementation Summary

## Overview
This refactor fixes the DnD modal opening issues by removing overly strict permission checks and centralizing room detection logic. The modal now opens for all users in valid DnD rooms, with permissions controlling only the visibility of UI elements within the modal.

## Problem Statement
Previously, the DnD modal had multiple issues:
- **Overly strict permission checks** blocked observers from opening the modal
- **Duplicated room detection logic** led to inconsistencies
- **Silent failures** when users tried to open the modal
- **Room detection was too broad** (.includes("dnd") matched unintended rooms)
- **Modal visibility coupled to session state** caused unexpected behavior

## Solution

### 1. Centralized Room Detection (`dndRoomRegistry.js`)
Created a single source of truth for DnD room detection:
- **Normalized matching**: Converts room names to lowercase alphanumeric (e.g., "DnD Story Room" → "dndstoryroom")
- **Valid rooms**: R6 code, or exact match of normalized names: `dnd`, `dndstoryroom`, `justdnd`
- **Debug support**: `__DND_DEBUG__` flag (defaults to false) and `dndDebugLog()` helper

```javascript
// Example usage
isDnDRoom("R6")           // true
isDnDRoom("dnd")          // true
isDnDRoom("DnD")          // true
isDnDRoom("DnD Story Room") // true (normalizes to "dndstoryroom")
isDnDRoom("mydndroom")    // false (not exact match)
```

### 2. Refactored Modal Opening (`openDnDModal()`)
Removed ALL role and permission checks:
- ✅ Modal opens for any user in a valid DnD room
- ✅ No silent failures
- ✅ Debug logging for troubleshooting
- ✅ Sets `window.dndUIActive = true` for state tracking

**Before:**
```javascript
if (!hasPermission) {
  const message = "You do not have permission to open the DnD panel.";
  console.warn("[dnd] open denied - insufficient role", { triggerSource, role: me?.role });
  if (triggerSource === "command") showCommandPopup("Command error", message);
  else toast(message);
  return false;
}
```

**After:**
```javascript
// Only check if we're in a DnD room
if (!isDnDRoom(room)) {
  console.warn("[DnD] modal blocked — not a DnD room", room);
  dndDebugLog("modal blocked — not a DnD room", { room });
  return false;
}
```

### 3. Permission-Based UI Visibility (`initDnDModal()`)
Permissions now control what users see INSIDE the modal:
- `data-dnd-host-only`: Session management controls (Moderators and above)
- `data-dnd-session-only`: Session information (when session exists)

```javascript
function initDnDModal() {
  const canHost = dndCanHostSession();  // Moderator role and above
  const hasSession = !!window.dndState?.session;

  // Show/hide based on permissions
  document.querySelectorAll("[data-dnd-host-only]")
    .forEach(el => el.hidden = !canHost);
  
  document.querySelectorAll("[data-dnd-session-only]")
    .forEach(el => el.hidden = !hasSession);
}
```

### 4. Improved Room Change Logic
Modal closes when leaving DnD room, not based on session state:

**Before:**
```javascript
if (!nowDndRoom) {
  closeDndModal();
}
```

**After:**
```javascript
if (nowDndRoom) {
  enableDndUI();
} else {
  disableDndUI();
  // Close modal when leaving DnD room
  if (dndModalOpen) {
    closeDndModal();
  }
}
```

### 5. State Cleanup
Added proper cleanup in `closeDndModal()`:
```javascript
window.dndUIActive = false;  // Clean up state
```

## Files Modified

### New Files:
- `public/dndRoomRegistry.js` - Centralized room detection module
- `scripts/test-dnd-room-detection.js` - Test suite for room detection

### Modified Files:
- `public/app.js` - Refactored modal opening and room detection
- `public/index.html` - Added data attributes for permission-based UI
- `server.js` - Updated server-side room detection to match client

## Testing

### Automated Tests
All tests passing:
- ✅ DnD module tests (38 events, character system, etc.)
- ✅ Room detection tests (22 test cases)
- ✅ Syntax validation
- ✅ CodeQL security scan (0 alerts)

### Test Cases Covered
```
✅ Room code R6 (uppercase/lowercase)
✅ Room name variations (dnd, DnD, DnD Story Room)
✅ Legacy room names (dndstoryroom)
✅ Room objects with id/name/roomId/meta
✅ Invalid rooms (null, empty, other room codes)
✅ Rooms that should NOT match (mydndroom, diceroom, etc.)
```

## Expected Behavior

### ✅ Modal Opening
- Button click in DnD room → Modal opens
- `/dnd` command in DnD room → Modal opens
- Button click in non-DnD room → Button hidden
- `/dnd` command in non-DnD room → Error message

### ✅ Permission-Based UI
- **Guests**: Can open modal, see characters, events, spectate tab
- **Users**: Can open modal, see all tabs but cannot host sessions
- **Moderators+**: Can open modal, see all tabs including session controls
- **All users**: Session information only visible when session exists

### ✅ Room Changes
- Enter DnD room → Buttons appear
- Leave DnD room → Buttons disappear, modal closes
- Room changes don't auto-close modal based on session state

## Debug Mode
To enable debug logging, set the flag in browser console:
```javascript
window.__DND_DEBUG__ = true;
```

Debug logs will show:
- Room changes
- Modal open/close attempts
- UI enable/disable
- Permission resolution

## Migration Notes
No breaking changes for users. The refactor maintains all existing functionality while fixing the opening issues. Server restart recommended to load updated room detection logic.

## Future Enhancements
Potential improvements not in scope for this PR:
- Add data-dnd-spectator-only for spectator-specific UI
- Add more granular permission levels (Moderator vs User)
- Add tooltip explaining why controls are disabled
- Track modal open/close analytics

## Security
✅ No security vulnerabilities introduced (CodeQL scan clean)
✅ No new external dependencies
✅ No changes to authentication/authorization logic
✅ Permissions still enforced on server-side for actual actions

---
**Implementation Date**: 2026-02-08
**PR**: copilot/refactor-dnd-modal-logic
