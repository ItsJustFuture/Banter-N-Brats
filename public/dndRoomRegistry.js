/**
 * dndRoomRegistry.js
 * 
 * Client-side single source of truth for DnD room detection.
 * All client-side DnD room checks must use this module.
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
    "dndstory",
    "justdnd"
  ];

  /**
   * Check if a room is a DnD room
   * @param {string|object} room - Room name string or room object
   * @returns {boolean} True if the room is a valid DnD room
   */
  function isDnDRoom(room) {
    if (!room) return false;

    // CASE 1: room is a STRING (most of the app)
    if (typeof room === "string") {
      const rawName = String(room);

      if (rawName.toUpperCase() === "R6") return true;

      const normalized = normalizeRoomName(rawName);
      return VALID_DND_NAMES.includes(normalized);
    }

    // CASE 2: room is an OBJECT (future-proofing)
    if (typeof room === "object") {
      if (room.meta?.type === "dnd") return true;

      const directId = room?.id ?? room?.room_id ?? room?.roomId;
      if (directId && String(directId).toUpperCase() === "R6") return true;

      const rawName = room?.name ?? room?.id ?? "";
      const normalized = normalizeRoomName(rawName);
      return VALID_DND_NAMES.includes(normalized);
    }

    return false;
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
