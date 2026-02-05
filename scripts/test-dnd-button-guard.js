/**
 * Test script for DnD button guard functionality
 * 
 * This script verifies that:
 * 1. disableDndUI() has a guard that checks isDndRoom(currentRoom)
 * 2. The guard returns early without hiding the button when in a DnD room
 * 3. The guard uses proper normalization (lowercase, removes spaces/dashes/underscores)
 * 4. The guard logs when it blocks the disable action
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing DnD button guard functionality...\n');

// Read the app.js file
const appJsPath = path.join(__dirname, '../public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

let allChecksPassed = true;

// Test 1: Verify disableDndUI has guard at the beginning
console.log('Test 1: disableDndUI() guard implementation');
const disableDndUIMatch = appJsContent.match(/function\s+disableDndUI\s*\(\s*\)\s*\{([\s\S]*?)(?=\n\s*if\s*\(\s*dndNewOpenBtn|\n\})/);
if (!disableDndUIMatch) {
  console.log('  ❌ Could not find disableDndUI function');
  allChecksPassed = false;
} else {
  const functionStart = disableDndUIMatch[1];
  
  // Check if guard exists at the beginning
  const hasGuard = /if\s*\(\s*isDndRoom\s*\(\s*currentRoom\s*\)\s*\)/.test(functionStart);
  console.log(`  ${hasGuard ? '✅' : '❌'} Has isDndRoom(currentRoom) guard: ${hasGuard}`);
  if (!hasGuard) allChecksPassed = false;
  
  // Check if guard returns early
  const returnsEarly = /if\s*\(\s*isDndRoom\s*\(\s*currentRoom\s*\)\s*\)\s*\{[\s\S]*?return\s*;/.test(functionStart);
  console.log(`  ${returnsEarly ? '✅' : '❌'} Guard returns early: ${returnsEarly}`);
  if (!returnsEarly) allChecksPassed = false;
  
  // Check if guard logs when blocking
  const logsBlock = /if\s*\(\s*isDndRoom\s*\(\s*currentRoom\s*\)\s*\)\s*\{[\s\S]*?console\.log[\s\S]*?return\s*;/.test(functionStart);
  console.log(`  ${logsBlock ? '✅' : '❌'} Logs when blocking disable: ${logsBlock}`);
  if (!logsBlock) allChecksPassed = false;
}

// Test 2: Verify isDndRoom uses proper normalization
console.log('\nTest 2: isDndRoom() normalization implementation');
const isDndRoomMatch = appJsContent.match(/function\s+isDndRoom\s*\(\s*activeRoom\s*\)\s*\{([\s\S]*?)\n\}/);
if (!isDndRoomMatch) {
  console.log('  ❌ Could not find isDndRoom function');
  allChecksPassed = false;
} else {
  const functionBody = isDndRoomMatch[1];
  
  // Check if it uses normalizeDndRoomKey
  const usesNormalizer = /normalizeDndRoomKey/.test(functionBody);
  console.log(`  ${usesNormalizer ? '✅' : '❌'} Uses normalizeDndRoomKey: ${usesNormalizer}`);
  if (!usesNormalizer) allChecksPassed = false;
}

// Test 3: Verify normalizeDndRoomKey implementation
console.log('\nTest 3: normalizeDndRoomKey() implementation');
const normalizeMatch = appJsContent.match(/function\s+normalizeDndRoomKey\s*\(\s*value\s*\)\s*\{([\s\S]*?)\n\}/);
if (!normalizeMatch) {
  console.log('  ❌ Could not find normalizeDndRoomKey function');
  allChecksPassed = false;
} else {
  const functionBody = normalizeMatch[1];
  
  // Check if it lowercases
  const lowercases = /\.toLowerCase\(\)/.test(functionBody);
  console.log(`  ${lowercases ? '✅' : '❌'} Converts to lowercase: ${lowercases}`);
  if (!lowercases) allChecksPassed = false;
  
  // Check if it removes spaces, dashes, and underscores
  const removesChars = /\.replace\(.*[\s_-].*\)/.test(functionBody);
  console.log(`  ${removesChars ? '✅' : '❌'} Removes spaces/dashes/underscores: ${removesChars}`);
  if (!removesChars) allChecksPassed = false;
}

// Test 4: Verify matchesDndRoomKey uses includes (not strict equality)
console.log('\nTest 4: matchesDndRoomKey() uses includes (not strict equality)');
const matchesMatch = appJsContent.match(/function\s+matchesDndRoomKey\s*\(\s*value\s*\)\s*\{([\s\S]*?)\n\}/);
if (!matchesMatch) {
  console.log('  ❌ Could not find matchesDndRoomKey function');
  allChecksPassed = false;
} else {
  const functionBody = matchesMatch[1];
  
  // Check if it uses includes
  const usesIncludes = /\.includes\(/.test(functionBody);
  console.log(`  ${usesIncludes ? '✅' : '❌'} Uses includes() method: ${usesIncludes}`);
  if (!usesIncludes) allChecksPassed = false;
  
  // Check if it doesn't use strict equality
  const noStrictEquality = !/===.*dndstoryroom|dndstoryroom.*===/.test(functionBody.toLowerCase());
  console.log(`  ${noStrictEquality ? '✅' : '❌'} Does not use strict equality: ${noStrictEquality}`);
  if (!noStrictEquality) allChecksPassed = false;
}

// Test 5: Verify DND_ROOM_MATCHERS includes expected values
console.log('\nTest 5: DND_ROOM_MATCHERS configuration');
const matchersMatch = appJsContent.match(/const\s+DND_ROOM_MATCHERS\s*=\s*\[(.*?)\]/);
if (!matchersMatch) {
  console.log('  ❌ Could not find DND_ROOM_MATCHERS constant');
  allChecksPassed = false;
} else {
  const matchersValue = matchersMatch[1];
  
  // Check if it includes "dndstoryroom"
  const hasDndStoryRoom = /["']dndstoryroom["']/.test(matchersValue);
  console.log(`  ${hasDndStoryRoom ? '✅' : '❌'} Includes "dndstoryroom": ${hasDndStoryRoom}`);
  if (!hasDndStoryRoom) allChecksPassed = false;
  
  // Check if it includes "DnD Story Room"
  const hasDndStoryRoomSpaced = /["']DnD Story Room["']/.test(matchersValue);
  console.log(`  ${hasDndStoryRoomSpaced ? '✅' : '❌'} Includes "DnD Story Room": ${hasDndStoryRoomSpaced}`);
  if (!hasDndStoryRoomSpaced) allChecksPassed = false;
}

// Test 6: Verify the guard doesn't prevent hiding in non-DnD rooms
console.log('\nTest 6: disableDndUI() still hides button in non-DnD rooms');
const fullDisableFunction = appJsContent.match(/function\s+disableDndUI\s*\(\s*\)\s*\{([\s\S]*?)\n\}/);
if (!fullDisableFunction) {
  console.log('  ❌ Could not find disableDndUI function');
  allChecksPassed = false;
} else {
  const functionBody = fullDisableFunction[1];
  
  // Check that button hiding logic still exists after the guard
  const hidesNewButton = /if\s*\(\s*dndNewOpenBtn\s*\)\s*dndNewOpenBtn\.hidden\s*=\s*true/.test(functionBody);
  console.log(`  ${hidesNewButton ? '✅' : '❌'} Still hides dndNewOpenBtn: ${hidesNewButton}`);
  if (!hidesNewButton) allChecksPassed = false;
  
  const hidesOldButton = /if\s*\(\s*dndOpenBtn\s*\)\s*dndOpenBtn\.hidden\s*=\s*true/.test(functionBody);
  console.log(`  ${hidesOldButton ? '✅' : '❌'} Still hides dndOpenBtn: ${hidesOldButton}`);
  if (!hidesOldButton) allChecksPassed = false;
  
  const hidesComposerBtn = /dndComposerBtn.*hidden\s*=\s*true/.test(functionBody);
  console.log(`  ${hidesComposerBtn ? '✅' : '❌'} Still hides dndComposerBtn: ${hidesComposerBtn}`);
  if (!hidesComposerBtn) allChecksPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
  console.log('✅ All guard functionality checks passed!');
  console.log('\n📊 Verified Implementation:');
  console.log('  ✓ disableDndUI() checks isDndRoom(currentRoom) at the start');
  console.log('  ✓ Guard returns early without hiding button when in DnD room');
  console.log('  ✓ Guard logs when blocking the disable action');
  console.log('  ✓ isDndRoom() normalizes room names properly');
  console.log('  ✓ Normalization removes spaces, dashes, and underscores');
  console.log('  ✓ Normalization converts to lowercase');
  console.log('  ✓ Matching uses includes() instead of strict equality');
  console.log('  ✓ DND_ROOM_MATCHERS includes both "dndstoryroom" and "DnD Story Room"');
  console.log('  ✓ Button is still hidden in non-DnD rooms');
  console.log('\n🎯 Expected Behavior:');
  console.log('  1. User is in DnD Story Room - button is visible');
  console.log('  2. UI refresh or room sync event occurs');
  console.log('  3. disableDndUI() is called but guard blocks it');
  console.log('  4. Button remains visible while in DnD room');
  console.log('  5. User switches to non-DnD room - button is hidden');
  process.exit(0);
} else {
  console.log('❌ Some guard functionality checks failed!');
  console.log('\n⚠️  Review the failed checks above');
  process.exit(1);
}
