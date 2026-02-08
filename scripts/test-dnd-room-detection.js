#!/usr/bin/env node
/**
 * Test script for DnD room detection
 * Verifies the centralized isDnDRoom logic works correctly
 * 
 * NOTE: The VALID_NAMES array below is duplicated from dndRoomRegistry.js
 * If you change the valid names in dndRoomRegistry.js, update this test file too!
 */

console.log('🧪 Testing DnD Room Detection\n');

// Normalize room name function (copied from dndRoomRegistry.js)
function normalizeRoomName(name = "") {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Valid DnD room names - MUST match dndRoomRegistry.js!
const VALID_NAMES = ["dnd", "dndstoryroom", "justdnd"];

// isDnDRoom function (copied from dndRoomRegistry.js)
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
    return VALID_NAMES.includes(normalized);
  }

  // Handle string room names
  const rawName = String(room);
  
  // Check if it's R6 room code
  if (rawName.toUpperCase() === "R6") return true;

  // Check normalized name
  const normalized = normalizeRoomName(rawName);
  return VALID_NAMES.includes(normalized);
}

// Test cases
const testCases = [
  // Should be true
  { input: "R6", expected: true, desc: "Room code R6" },
  { input: "r6", expected: true, desc: "Room code r6 (lowercase)" },
  { input: "dnd", expected: true, desc: "Room name 'dnd'" },
  { input: "DnD", expected: true, desc: "Room name 'DnD' (mixed case)" },
  { input: "dndstoryroom", expected: true, desc: "Legacy room name 'dndstoryroom'" },
  { input: "DnD Story Room", expected: true, desc: "Room name 'DnD Story Room' (with spaces)" },
  { input: "justdnd", expected: true, desc: "Room name 'justdnd'" },
  { input: { id: "R6" }, expected: true, desc: "Room object with id 'R6'" },
  { input: { name: "dnd" }, expected: true, desc: "Room object with name 'dnd'" },
  { input: { roomId: "R6" }, expected: true, desc: "Room object with roomId 'R6'" },
  { input: { meta: { type: "dnd" } }, expected: true, desc: "Room object with meta.type 'dnd'" },
  { input: { id: "R6", name: "DnD Story Room" }, expected: true, desc: "Room object with both id and name" },
  
  // Should be false
  { input: null, expected: false, desc: "Null room" },
  { input: undefined, expected: false, desc: "Undefined room" },
  { input: "", expected: false, desc: "Empty string" },
  { input: "R1", expected: false, desc: "Different room code R1" },
  { input: "main", expected: false, desc: "Main room" },
  { input: "music", expected: false, desc: "Music room" },
  { input: "diceroom", expected: false, desc: "Dice room" },
  { input: "mydndroom", expected: false, desc: "Room with 'dnd' in middle (not exact match)" },
  { input: { id: "R1" }, expected: false, desc: "Room object with different id" },
  { input: { name: "main" }, expected: false, desc: "Room object with different name" },
];

let passed = 0;
let failed = 0;

console.log('Running test cases:\n');

testCases.forEach((test, index) => {
  const result = isDnDRoom(test.input);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.desc}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.desc}`);
    console.log(`   Expected: ${test.expected}, Got: ${result}`);
    console.log(`   Input:`, test.input);
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Total: ${testCases.length} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
