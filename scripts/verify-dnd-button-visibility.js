/**
 * Manual verification script for DnD button visibility logic
 * 
 * This script verifies that the button visibility toggle logic exists
 * and is properly structured in the client-side code.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying DnD button visibility implementation...\n');

// Read the app.js file
const appJsPath = path.join(__dirname, '../public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Check 1: Verify button element reference exists
const buttonRefPattern = /const\s+dndOpenBtn\s*=\s*document\.getElementById\s*\(\s*["']dndOpenBtn["']\s*\)/;
const hasButtonRef = buttonRefPattern.test(appJsContent);
console.log(`✓ Button element reference: ${hasButtonRef ? 'FOUND' : 'NOT FOUND'}`);

// Check 2: Verify DND_ROOM_ID constant exists
const roomIdPattern = /const\s+DND_ROOM_ID\s*=\s*["']dndstoryroom["']/;
const hasRoomId = roomIdPattern.test(appJsContent);
console.log(`✓ DND_ROOM_ID constant: ${hasRoomId ? 'FOUND' : 'NOT FOUND'}`);

// Check 3: Verify isDndRoom function exists
const isDndRoomPattern = /function\s+isDndRoom\s*\(/;
const hasIsDndRoomFn = isDndRoomPattern.test(appJsContent);
console.log(`✓ isDndRoom function: ${hasIsDndRoomFn ? 'FOUND' : 'NOT FOUND'}`);

// Check 4: Verify button visibility toggle in setActiveRoom
const togglePattern = /dndOpenBtn\.hidden\s*=\s*!nowDndRoom/;
const hasToggleLogic = togglePattern.test(appJsContent);
console.log(`✓ Button visibility toggle logic: ${hasToggleLogic ? 'FOUND' : 'NOT FOUND'}`);

// Check 5: Verify setActiveRoom function exists
const setActiveRoomPattern = /function\s+setActiveRoom\s*\(/;
const hasSetActiveRoom = setActiveRoomPattern.test(appJsContent);
console.log(`✓ setActiveRoom function: ${hasSetActiveRoom ? 'FOUND' : 'NOT FOUND'}`);

// Check 6: Verify joinRoom function exists and calls setActiveRoom
const joinRoomPattern = /function\s+joinRoom\s*\([^)]*\)\s*{[^}]*setActiveRoom/s;
const hasJoinRoom = joinRoomPattern.test(appJsContent);
console.log(`✓ joinRoom function with setActiveRoom call: ${hasJoinRoom ? 'FOUND' : 'NOT FOUND'}`);

// Check 7: Verify click event listener for DnD button
const clickListenerPattern = /dndOpenBtn\?\.addEventListener\s*\(\s*["']click["']/;
const hasClickListener = clickListenerPattern.test(appJsContent);
console.log(`✓ DnD button click event listener: ${hasClickListener ? 'FOUND' : 'NOT FOUND'}`);

// Check 8: Verify nowDndRoom variable assignment in setActiveRoom
const nowDndRoomPattern = /const\s+nowDndRoom\s*=\s*isDndRoom\s*\(\s*room\s*\)/;
const hasNowDndRoom = nowDndRoomPattern.test(appJsContent);
console.log(`✓ nowDndRoom variable assignment: ${hasNowDndRoom ? 'FOUND' : 'NOT FOUND'}`);

// Summary
const allChecks = [
  hasButtonRef,
  hasRoomId,
  hasIsDndRoomFn,
  hasToggleLogic,
  hasSetActiveRoom,
  hasJoinRoom,
  hasClickListener,
  hasNowDndRoom
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`\n${'='.repeat(50)}`);
console.log(`Result: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('✅ All DnD button visibility logic is properly implemented!');
  console.log('\nThe button should:');
  console.log('  - Be hidden when NOT in dndstoryroom');
  console.log('  - Be visible when IN dndstoryroom');
  console.log('  - Update dynamically when switching rooms');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}
