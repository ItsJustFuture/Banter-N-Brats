/**
 * Verification script for the NEW DnD button visibility logic
 * 
 * This script verifies that the new dndNewOpenBtn button is properly implemented
 * with correct visibility toggle logic.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying NEW DnD button implementation...\n');

// Read the app.js file
const appJsPath = path.join(__dirname, '../public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Read the index.html file
const indexHtmlPath = path.join(__dirname, '../public/index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Read the styles.css file
const stylesPath = path.join(__dirname, '../public/styles.css');
const stylesContent = fs.readFileSync(stylesPath, 'utf8');

// Check 1: Verify new button element exists in HTML
const htmlButtonPattern = /id=["']dndNewOpenBtn["']/;
const hasHtmlButton = htmlButtonPattern.test(indexHtmlContent);
console.log(`✓ New button in HTML: ${hasHtmlButton ? 'FOUND' : 'NOT FOUND'}`);

// Check 2: Verify new button has 'hidden' attribute initially
const htmlButtonHiddenPattern = /id=["']dndNewOpenBtn["'][^>]*\bhidden\b|<button[^>]*\bhidden\b[^>]*id=["']dndNewOpenBtn["']/;
const hasHiddenAttr = htmlButtonHiddenPattern.test(indexHtmlContent);
console.log(`✓ New button has 'hidden' attribute: ${hasHiddenAttr ? 'YES' : 'NO'}`);

// Check 3: Verify CSS styling for new button
const cssPattern = /\.dndNewOpenBtn\s*{/;
const hasCSS = cssPattern.test(stylesContent);
console.log(`✓ CSS styling for new button: ${hasCSS ? 'FOUND' : 'NOT FOUND'}`);

// Check 4: Verify old button is deprecated in CSS
const deprecatedCssPattern = /\.dndOpenBtn\.deprecated\s*{/;
const hasDeprecatedCSS = deprecatedCssPattern.test(stylesContent);
console.log(`✓ Deprecated CSS for old button: ${hasDeprecatedCSS ? 'FOUND' : 'NOT FOUND'}`);

// Check 5: Verify new button element reference exists in JavaScript
const jsButtonRefPattern = /const\s+dndNewOpenBtn\s*=\s*document\.getElementById\s*\(\s*["']dndNewOpenBtn["']\s*\)/;
const hasJsButtonRef = jsButtonRefPattern.test(appJsContent);
console.log(`✓ JavaScript element reference: ${hasJsButtonRef ? 'FOUND' : 'NOT FOUND'}`);

// Check 6: Verify old button is marked as deprecated in JavaScript
const jsDeprecatedComment = /const\s+dndOpenBtn\s*=.*\/\/.*[Dd]eprecated/;
const hasDeprecatedComment = jsDeprecatedComment.test(appJsContent);
console.log(`✓ Old button marked deprecated in JS: ${hasDeprecatedComment ? 'YES' : 'NO'}`);

// Check 7: Verify DND_ROOM_ID constant still exists
const roomIdPattern = /const\s+DND_ROOM_ID\s*=\s*["']dndstoryroom["']/;
const hasRoomId = roomIdPattern.test(appJsContent);
console.log(`✓ DND_ROOM_ID constant: ${hasRoomId ? 'FOUND' : 'NOT FOUND'}`);

// Check 8: Verify isDndRoom function exists
const isDndRoomPattern = /function\s+isDndRoom\s*\(/;
const hasIsDndRoomFn = isDndRoomPattern.test(appJsContent);
console.log(`✓ isDndRoom function: ${hasIsDndRoomFn ? 'FOUND' : 'NOT FOUND'}`);

// Check 9: Verify new button visibility toggle in setActiveRoom
const newTogglePattern = /dndNewOpenBtn\)\s*dndNewOpenBtn\.hidden\s*=\s*!nowDndRoom/;
const hasNewToggleLogic = newTogglePattern.test(appJsContent);
console.log(`✓ New button visibility toggle logic: ${hasNewToggleLogic ? 'FOUND' : 'NOT FOUND'}`);

// Check 10: Verify click event listener for new button
const newClickListenerPattern = /dndNewOpenBtn\?\.addEventListener\s*\(\s*["']click["']/;
const hasNewClickListener = newClickListenerPattern.test(appJsContent);
console.log(`✓ New button click event listener: ${hasNewClickListener ? 'FOUND' : 'NOT FOUND'}`);

// Check 11: Verify new button visibility in renderDndArena
const renderDndPattern = /dndNewOpenBtn\)\s*dndNewOpenBtn\.hidden\s*=\s*!isDndRoom\s*\(\s*currentRoom\s*\)/;
const hasRenderDndToggle = renderDndPattern.test(appJsContent);
console.log(`✓ New button toggle in renderDndArena: ${hasRenderDndToggle ? 'FOUND' : 'NOT FOUND'}`);

// Check 12: Verify setActiveRoom function exists
const setActiveRoomPattern = /function\s+setActiveRoom\s*\(/;
const hasSetActiveRoom = setActiveRoomPattern.test(appJsContent);
console.log(`✓ setActiveRoom function: ${hasSetActiveRoom ? 'FOUND' : 'NOT FOUND'}`);

// Check 13: Verify nowDndRoom variable assignment
const nowDndRoomPattern = /const\s+nowDndRoom\s*=\s*isDndRoom\s*\(\s*room\s*\)/;
const hasNowDndRoom = nowDndRoomPattern.test(appJsContent);
console.log(`✓ nowDndRoom variable assignment: ${hasNowDndRoom ? 'FOUND' : 'NOT FOUND'}`);

// Summary
const allChecks = [
  hasHtmlButton,
  hasHiddenAttr,
  hasCSS,
  hasDeprecatedCSS,
  hasJsButtonRef,
  hasDeprecatedComment,
  hasRoomId,
  hasIsDndRoomFn,
  hasNewToggleLogic,
  hasNewClickListener,
  hasRenderDndToggle,
  hasSetActiveRoom,
  hasNowDndRoom
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`\n${'='.repeat(50)}`);
console.log(`Result: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('✅ All NEW DnD button implementation checks passed!');
  console.log('\n📋 Implementation Summary:');
  console.log('  ✓ New button created with ID "dndNewOpenBtn"');
  console.log('  ✓ Old button deprecated and hidden via CSS');
  console.log('  ✓ New button has proper CSS styling');
  console.log('  ✓ JavaScript references and logic implemented');
  console.log('  ✓ Visibility toggles in setActiveRoom and renderDndArena');
  console.log('  ✓ Click event listener attached');
  console.log('\n🎯 Expected Behavior:');
  console.log('  - New button hidden when NOT in "dndstoryroom"');
  console.log('  - New button visible when IN "dndstoryroom"');
  console.log('  - Updates dynamically when switching rooms');
  console.log('  - Opens DnD modal when clicked');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  console.log('\n🔍 Failed checks:');
  if (!hasHtmlButton) console.log('  - New button missing in HTML');
  if (!hasHiddenAttr) console.log('  - New button missing "hidden" attribute');
  if (!hasCSS) console.log('  - CSS styling missing for new button');
  if (!hasDeprecatedCSS) console.log('  - Deprecated CSS missing for old button');
  if (!hasJsButtonRef) console.log('  - JavaScript reference missing');
  if (!hasDeprecatedComment) console.log('  - Old button not marked as deprecated');
  if (!hasRoomId) console.log('  - DND_ROOM_ID constant missing');
  if (!hasIsDndRoomFn) console.log('  - isDndRoom function missing');
  if (!hasNewToggleLogic) console.log('  - Visibility toggle logic missing in setActiveRoom');
  if (!hasNewClickListener) console.log('  - Click event listener missing');
  if (!hasRenderDndToggle) console.log('  - Visibility toggle missing in renderDndArena');
  if (!hasSetActiveRoom) console.log('  - setActiveRoom function missing');
  if (!hasNowDndRoom) console.log('  - nowDndRoom variable assignment missing');
  process.exit(1);
}
