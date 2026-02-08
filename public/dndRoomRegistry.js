/**
 * dndRoomRegistry.js
 * 
 * Single source of truth for DnD room detection.
 * All DnD room checks across the codebase must use this module.
 */

(function(global) {
  'use strict';

  /**
   * Normalize a room name for comparison
   * @param {string} name - Room name to normalize
   * @returns {string} Normalized name (lowercase, alphanumeric only)
   */
  function normalizeRoomName(name = "") {
    return String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // Valid DnD room names (normalized)
  const VALID_DND_NAMES = [
    "dnd",
    "dndstoryroom",
    "justdnd"
  ];

  /**
   * Check if a room is a DnD room
   * @param {string|object} room - Room name string or room object
   * @returns {boolean} True if the room is a valid DnD room
   */
  function isDnDRoom(room) {
    if (!room) return false;

    // Check if room is an object with metadata
    if (typeof room === "object") {
      // Check meta.type first
      if (room.meta?.type === "dnd") return true;

      // Check room ID (direct match)
      const directId = room?.id ?? room?.room_id ?? room?.roomId;
      if (directId) {
        const DND_ROOM_IDS = ["R6"];
        if (DND_ROOM_IDS.includes(String(directId).toUpperCase())) return true;
      }

      // Check room name
      const rawName = room?.name ?? room?.id ?? "";
      const normalized = normalizeRoomName(rawName);
      return VALID_DND_NAMES.includes(normalized);
    }

    // Handle string room names
    const rawName = String(room);
    
    // Check if it's R6 room code
    if (rawName.toUpperCase() === "R6") return true;

    // Check normalized name
    const normalized = normalizeRoomName(rawName);
    return VALID_DND_NAMES.includes(normalized);
  }

  // Expose to global scope
  global.DnDRoomRegistry = {
    normalizeRoomName: normalizeRoomName,
    isDnDRoom: isDnDRoom
  };

  // Debug logging support - defaults to false in production
  global.__DND_DEBUG__ = false;

  function dndLog(...args) {
    if (global.__DND_DEBUG__) {
      console.log("[DnD]", ...args);
    }
  }

  global.dndLog = dndLog;

})(typeof window !== 'undefined' ? window : global);
