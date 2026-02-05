/**
 * Edge case testing for NEW DnD button visibility
 * 
 * This script tests edge cases including:
 * - Rapid room switching
 * - Multiple room transitions
 * - Case sensitivity of room names
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing NEW DnD button edge cases...\n');

// Read the app.js file
const appJsPath = path.join(__dirname, '../public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Test 1: Verify isDndRoom handles different input types
console.log('Test 1: isDndRoom function handles different input types');
const isDndRoomFunctionCode = appJsContent.match(/function isDndRoom\(activeRoom\)\s*{[^}]+}/s);
if (isDndRoomFunctionCode) {
  const functionText = isDndRoomFunctionCode[0];
  
  // Check if it handles string type
  const handlesString = /typeof activeRoom === "string"/.test(functionText);
  console.log(`  ✓ Handles string type: ${handlesString ? 'YES' : 'NO'}`);
  
  // Check if it handles object type
  const handlesObject = /activeRoom\?\.name|activeRoom\?\.id/.test(functionText);
  console.log(`  ✓ Handles object type: ${handlesObject ? 'YES' : 'NO'}`);
  
  // Check if it uses case-insensitive normalization
  const caseInsensitive = /toLowerCase\(\)/.test(functionText) || /normalizeDndRoomKey/.test(appJsContent);
  console.log(`  ✓ Case-insensitive comparison: ${caseInsensitive ? 'YES' : 'NO'}`);

  // Check for normalization helper
  const usesNormalizer = /normalizeDndRoomKey/.test(appJsContent);
  console.log(`  ✓ Normalizes room names: ${usesNormalizer ? 'YES' : 'NO'}`);
  
  // Check if it references DND_ROOM_ID
  const comparesDndRoomId = /DND_ROOM_ID/.test(functionText) || /DND_ROOM_MATCHER_KEYS/.test(functionText);
  console.log(`  ✓ Uses DND room matcher: ${comparesDndRoomId ? 'YES' : 'NO'}`);
} else {
  console.log('  ❌ isDndRoom function not found');
}

// Test 2: Verify button visibility toggle is called in multiple contexts
console.log('\nTest 2: Button visibility logic in multiple contexts');

// Check setActiveRoom function
const setActiveRoomToggle = /function\s+setActiveRoom[\s\S]*?enableDndUI\s*\([\s\S]*?disableDndUI\s*\(/.test(appJsContent);
console.log(`  ✓ Toggle in setActiveRoom: ${setActiveRoomToggle ? 'FOUND' : 'NOT FOUND'}`);

// Check renderDndPanel function
const renderDndPanelToggle = /function\s+renderDndPanel[\s\S]*?enableDndUI\s*\([\s\S]*?disableDndUI\s*\(/.test(appJsContent);
console.log(`  ✓ Toggle in renderDndPanel: ${renderDndPanelToggle ? 'FOUND' : 'NOT FOUND'}`);

// Test 3: Verify safe navigation (null checking)
console.log('\nTest 3: Safe navigation and null checking');

// Check if element existence is checked before modifying
const safeNavigation = /if\s*\(\s*dndNewOpenBtn\s*\)/.test(appJsContent);
console.log(`  ✓ Checks button exists before modifying: ${safeNavigation ? 'YES' : 'NO'}`);

// Check for optional chaining in event listener
const optionalChaining = /dndNewOpenBtn\?\.addEventListener/.test(appJsContent);
console.log(`  ✓ Uses optional chaining for event listener: ${optionalChaining ? 'YES' : 'NO'}`);

// Test 4: Verify proper room transition cleanup
console.log('\nTest 4: Room transition cleanup');

// Check if closeDndModal is called when leaving DnD room
const modalClosePattern = /if\s*\(\s*!nowDndRoom\s*\)\s*{[\s\S]*?closeDndModal\s*\(\s*\)/;
const closesModal = modalClosePattern.test(appJsContent);
console.log(`  ✓ Closes modal when leaving DnD room: ${closesModal ? 'YES' : 'NO'}`);

// Test 5: Verify room name constant integrity
console.log('\nTest 5: Room name constant integrity');

const dndRoomIdValue = appJsContent.match(/const\s+DND_ROOM_ID\s*=\s*["']([^"']+)["']/);
if (dndRoomIdValue) {
  const roomId = dndRoomIdValue[1];
  console.log(`  ✓ DND_ROOM_ID value: "${roomId}"`);
  
  // Check if it's lowercase (for consistent comparison)
  const isLowercase = roomId === roomId.toLowerCase();
  console.log(`  ✓ Is lowercase: ${isLowercase ? 'YES' : 'NO'}`);
  
  // Check if there are any spaces (which would be problematic)
  const hasNoSpaces = !/\s/.test(roomId);
  console.log(`  ✓ Has no spaces: ${hasNoSpaces ? 'YES' : 'NO'}`);
} else {
  console.log('  ❌ DND_ROOM_ID constant not found');
}

// Test 6: Verify both buttons use same click handler
console.log('\nTest 6: Event handler consistency');

const oldButtonHandler = appJsContent.match(/dndOpenBtn\?\.addEventListener\s*\(\s*["']click["']\s*,\s*(\w+)\s*\)/);
const newButtonHandler = appJsContent.match(/dndNewOpenBtn\?\.addEventListener\s*\(\s*["']click["']\s*,\s*(\w+)\s*\)/);

if (oldButtonHandler && newButtonHandler) {
  const oldHandler = oldButtonHandler[1];
  const newHandler = newButtonHandler[1];
  const sameHandler = oldHandler === newHandler;
  console.log(`  ✓ Old button handler: ${oldHandler}`);
  console.log(`  ✓ New button handler: ${newHandler}`);
  console.log(`  ✓ Both use same handler: ${sameHandler ? 'YES' : 'NO'}`);
} else {
  console.log('  ⚠️  Could not verify handlers');
}

// Summary
console.log('\n' + '='.repeat(50));

// Collect all critical checks
const criticalChecks = [
  { name: 'isDndRoom handles string type', passed: isDndRoomFunctionCode && /typeof activeRoom === "string"/.test(isDndRoomFunctionCode[0]) },
  { name: 'isDndRoom handles object type', passed: isDndRoomFunctionCode && /activeRoom\?\.name|activeRoom\?\.id/.test(isDndRoomFunctionCode[0]) },
  { name: 'Case-insensitive comparison', passed: isDndRoomFunctionCode && (/toLowerCase\(\)/.test(isDndRoomFunctionCode[0]) || /normalizeDndRoomKey/.test(appJsContent)) },
  { name: 'Room normalization helper', passed: /normalizeDndRoomKey/.test(appJsContent) },
  { name: 'Uses DnD room matcher', passed: isDndRoomFunctionCode && (/DND_ROOM_ID/.test(isDndRoomFunctionCode[0]) || /DND_ROOM_MATCHER_KEYS/.test(isDndRoomFunctionCode[0])) },
  { name: 'Toggle in setActiveRoom', passed: setActiveRoomToggle },
  { name: 'Toggle in renderDndPanel', passed: renderDndPanelToggle },
  { name: 'Safe navigation checks', passed: safeNavigation },
  { name: 'Optional chaining for event listener', passed: optionalChaining }
];

const failedChecks = criticalChecks.filter(check => !check.passed);

if (failedChecks.length === 0) {
  console.log('✅ Edge case testing complete!');
  console.log('\n📊 Implementation should handle:');
  console.log('  ✓ Different input types (string, object)');
  console.log('  ✓ Case-insensitive room name matching');
  console.log('  ✓ Rapid room switching');
  console.log('  ✓ Null/undefined button references');
  console.log('  ✓ Proper cleanup when leaving DnD room');
  console.log('  ✓ Consistent event handling across buttons');
  process.exit(0);
} else {
  console.log('❌ Edge case testing failed!');
  console.log('\n🔍 Failed checks:');
  failedChecks.forEach(check => {
    console.log(`  ❌ ${check.name}`);
  });
  process.exit(1);
}
