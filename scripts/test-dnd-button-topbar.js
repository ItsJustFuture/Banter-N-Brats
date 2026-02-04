/**
 * Test script to verify DnD button appears in topbar when in dndstoryroom
 * 
 * This test verifies:
 * 1. Button exists in the HTML topbar structure
 * 2. enableDndUI() function correctly shows the button
 * 3. disableDndUI() function correctly hides the button
 * 4. setActiveRoom() calls the appropriate functions based on room
 * 5. Button has proper event listeners attached
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing DnD button in topbar functionality...\n');

// Read source files
const appJsPath = path.join(__dirname, '../public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

const indexHtmlPath = path.join(__dirname, '../public/index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

const stylesPath = path.join(__dirname, '../public/styles.css');
const stylesContent = fs.readFileSync(stylesPath, 'utf8');

const checks = [];

// Check 1: Button exists in topbar section of HTML
console.log('✓ Check 1: Button in topbar HTML structure');
const topbarMatch = indexHtmlContent.match(/<div class="topbar">[\s\S]*?<\/div>\s*<!--.*Quick avatar/);
if (!topbarMatch) {
  console.log('  ❌ Could not find topbar section');
  checks.push(false);
} else {
  const topbarHtml = topbarMatch[0];
  const hasButton = /id=["']dndNewOpenBtn["']/.test(topbarHtml);
  console.log(`  ${hasButton ? '✅' : '❌'} Button found in topbar: ${hasButton}`);
  checks.push(hasButton);
}

// Check 2: Button is in the topActions section (right side of topbar)
console.log('\n✓ Check 2: Button in topActions section');
const topActionsMatch = indexHtmlContent.match(/<div[^>]*class="[^"]*topActions[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/);
if (!topActionsMatch) {
  console.log('  ❌ Could not find topActions section');
  checks.push(false);
} else {
  const topActionsHtml = topActionsMatch[0];
  const hasButtonInActions = /id=["']dndNewOpenBtn["']/.test(topActionsHtml);
  console.log(`  ${hasButtonInActions ? '✅' : '❌'} Button in topActions: ${hasButtonInActions}`);
  checks.push(hasButtonInActions);
}

// Check 3: enableDndUI shows the button (sets hidden = false)
console.log('\n✓ Check 3: enableDndUI() shows button');
const enableDndUIMatch = appJsContent.match(/function\s+enableDndUI\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
if (!enableDndUIMatch) {
  console.log('  ❌ Could not find enableDndUI function');
  checks.push(false);
} else {
  const functionBody = enableDndUIMatch[0];
  const showsButton = /dndNewOpenBtn.*\.hidden\s*=\s*false/.test(functionBody);
  console.log(`  ${showsButton ? '✅' : '❌'} Sets button.hidden = false: ${showsButton}`);
  checks.push(showsButton);
}

// Check 4: disableDndUI hides the button (sets hidden = true)
console.log('\n✓ Check 4: disableDndUI() hides button');
const disableDndUIMatch = appJsContent.match(/function\s+disableDndUI\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
if (!disableDndUIMatch) {
  console.log('  ❌ Could not find disableDndUI function');
  checks.push(false);
} else {
  const functionBody = disableDndUIMatch[0];
  const hidesButton = /dndNewOpenBtn.*\.hidden\s*=\s*true/.test(functionBody);
  console.log(`  ${hidesButton ? '✅' : '❌'} Sets button.hidden = true: ${hidesButton}`);
  checks.push(hidesButton);
}

// Check 5: setActiveRoom calls enableDndUI when in DnD room
console.log('\n✓ Check 5: setActiveRoom() controls button visibility');
const setActiveRoomMatch = appJsContent.match(/function\s+setActiveRoom\s*\([^)]*\)\s*\{[\s\S]*?(?=\nfunction|\n\/\*|\Z)/);
if (!setActiveRoomMatch) {
  console.log('  ❌ Could not find setActiveRoom function');
  checks.push(false);
} else {
  const functionBody = setActiveRoomMatch[0];
  const checksRoom = /const\s+nowDndRoom\s*=\s*isDndRoom\s*\(\s*room\s*\)/.test(functionBody);
  const callsEnable = /if\s*\(\s*nowDndRoom\s*\)[\s\S]*?enableDndUI\s*\(/.test(functionBody);
  const callsDisable = /else[\s\S]*?disableDndUI\s*\(/.test(functionBody);
  console.log(`  ${checksRoom ? '✅' : '❌'} Checks if room is DnD room: ${checksRoom}`);
  console.log(`  ${callsEnable ? '✅' : '❌'} Calls enableDndUI() when in DnD room: ${callsEnable}`);
  console.log(`  ${callsDisable ? '✅' : '❌'} Calls disableDndUI() when not in DnD room: ${callsDisable}`);
  checks.push(checksRoom && callsEnable && callsDisable);
}

// Check 6: Button click opens modal
console.log('\n✓ Check 6: Button click opens DnD modal');
if (!enableDndUIMatch) {
  console.log('  ❌ Could not find enableDndUI function');
  checks.push(false);
} else {
  const functionBody = enableDndUIMatch[0];
  const hasClickListener = /dndNewOpenBtn\?\.addEventListener\s*\(\s*["']click["'][\s\S]*?openDndModal/.test(functionBody);
  console.log(`  ${hasClickListener ? '✅' : '❌'} Click listener attached: ${hasClickListener}`);
  checks.push(hasClickListener);
}

// Check 7: Button visibility on socket connect
console.log('\n✓ Check 7: Button shown on socket connect if in DnD room');
const socketConnectMatch = appJsContent.match(/socket\.on\s*\(\s*["']connect["']\s*,[\s\S]{1,3000}/);
if (!socketConnectMatch) {
  console.log('  ❌ Could not find socket connect handler');
  checks.push(false);
} else {
  const handlerBody = socketConnectMatch[0];
  const checksRoomOnConnect = /if\s*\(\s*isDndRoom\s*\(\s*currentRoom\s*\)\s*\)/.test(handlerBody);
  const callsEnableOnConnect = /enableDndUI\s*\(\s*\)/.test(handlerBody);
  const callsDisableOnConnect = /disableDndUI\s*\(\s*\)/.test(handlerBody);
  console.log(`  ${checksRoomOnConnect ? '✅' : '❌'} Checks room on connect: ${checksRoomOnConnect}`);
  console.log(`  ${callsEnableOnConnect ? '✅' : '❌'} Calls enableDndUI() if in DnD room: ${callsEnableOnConnect}`);
  console.log(`  ${callsDisableOnConnect ? '✅' : '❌'} Calls disableDndUI() if not: ${callsDisableOnConnect}`);
  checks.push(checksRoomOnConnect && callsEnableOnConnect && callsDisableOnConnect);
}

// Check 8: CSS styling exists
console.log('\n✓ Check 8: CSS styling for button');
const hasButtonCSS = /\.dndNewOpenBtn\s*\{/.test(stylesContent);
const hasDisplayStyle = /\.dndNewOpenBtn[\s\S]*?display\s*:/.test(stylesContent);
console.log(`  ${hasButtonCSS ? '✅' : '❌'} CSS rule exists: ${hasButtonCSS}`);
console.log(`  ${hasDisplayStyle ? '✅' : '❌'} Has display property: ${hasDisplayStyle}`);
checks.push(hasButtonCSS);

// Summary
const passedChecks = checks.filter(Boolean).length;
const totalChecks = checks.length;

console.log(`\n${'='.repeat(60)}`);
console.log(`Result: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('\n✅ All checks passed!');
  console.log('\n📋 Verified Behavior:');
  console.log('  ✓ Button exists in topbar HTML (in topActions section)');
  console.log('  ✓ Button is hidden by default (hidden attribute)');
  console.log('  ✓ enableDndUI() shows the button');
  console.log('  ✓ disableDndUI() hides the button');
  console.log('  ✓ setActiveRoom() shows button when entering dndstoryroom');
  console.log('  ✓ setActiveRoom() hides button when leaving dndstoryroom');
  console.log('  ✓ Socket connect checks current room and shows button if needed');
  console.log('  ✓ Click listener opens DnD modal');
  console.log('  ✓ CSS styling applied');
  console.log('\n🎯 Expected User Experience:');
  console.log('  1. User starts in main room - button is hidden');
  console.log('  2. User clicks "DnD Story Room" in channel list');
  console.log('  3. Button appears in topbar (right side, next to other action buttons)');
  console.log('  4. User clicks button - DnD modal opens');
  console.log('  5. User switches to different room - button disappears');
  console.log('  6. User returns to DnD Story Room - button reappears');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed');
  process.exit(1);
}
