/**
 * Test script for DnD button forced visibility implementation
 * 
 * This script verifies that:
 * 1. The button is not hidden in HTML
 * 2. CSS forces visibility with !important rules
 * 3. JavaScript initializes forced visibility on load
 * 4. JavaScript includes console logging
 * 5. disableDndUI no longer hides the button
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing DnD button forced visibility implementation...\n');

let allTestsPassed = true;
const results = [];

function test(name, condition, details = '') {
  const passed = condition;
  results.push({ name, passed, details });
  if (!passed) allTestsPassed = false;
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (details) console.log(`   ${details}`);
  return passed;
}

// Read files
const htmlPath = path.join(__dirname, '../public/index.html');
const cssPath = path.join(__dirname, '../public/styles.css');
const appJsPath = path.join(__dirname, '../public/app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

console.log('📋 HTML Tests:\n');

// Test 1: Button exists without hidden attribute
test(
  'Button exists in HTML without hidden attribute',
  htmlContent.includes('id="dndNewOpenBtn"') && 
  !/<button[^>]*id="dndNewOpenBtn"[^>]*hidden/.test(htmlContent),
  'Button should be visible by default in HTML'
);

// Test 2: Button is in topActions section
test(
  'Button is located in topActions section',
  /<div[^>]*class="[^"]*topActions[^"]*"[^>]*>[\s\S]*?id="dndNewOpenBtn"[\s\S]*?<\/div>/.test(htmlContent),
  'Button should be in the always-visible topbar'
);

console.log('\n📋 CSS Tests:\n');

// Test 3: CSS forces display with !important
test(
  'CSS forces display: inline-flex !important',
  /\.dndNewOpenBtn[^{]*\{[^}]*display:\s*inline-flex\s*!important/.test(cssContent),
  'Display should use !important to override any other rules'
);

// Test 4: CSS forces visibility with !important
test(
  'CSS forces visibility: visible !important',
  /\.dndNewOpenBtn[^{]*\{[^}]*visibility:\s*visible\s*!important/.test(cssContent),
  'Visibility should use !important'
);

// Test 5: CSS sets z-index to at least 1000
test(
  'CSS sets z-index to 1000',
  /\.dndNewOpenBtn[^{]*\{[^}]*z-index:\s*1000/.test(cssContent),
  'Z-index should be at least 1000 to be above chat layer'
);

// Test 6: CSS overrides [hidden] attribute
test(
  'CSS overrides [hidden] attribute',
  /\.dndNewOpenBtn\[hidden\][^{]*\{[^}]*display:\s*inline-flex\s*!important/.test(cssContent),
  'Should force display even when hidden attribute is present'
);

console.log('\n📋 JavaScript Tests:\n');

// Test 7: Button reference exists
test(
  'dndNewOpenBtn reference exists',
  /const\s+dndNewOpenBtn\s*=\s*document\.getElementById\s*\(\s*["']dndNewOpenBtn["']\s*\)/.test(appJsContent),
  'Button reference should be created'
);

// Test 8: Forced visibility initialization exists
test(
  'Forced visibility initialization code exists',
  /\/\/\s*Force\s+DnD\s+button\s+visibility\s+on\s+load/.test(appJsContent),
  'Should have initialization comment'
);

// Test 9: Initialization forces display style
test(
  'Initialization forces display = "flex"',
  /dndNewOpenBtn\.style\.display\s*=\s*["']flex["']/.test(appJsContent),
  'Should set display to flex on initialization'
);

// Test 10: Initialization forces visibility style
test(
  'Initialization forces visibility = "visible"',
  /dndNewOpenBtn\.style\.visibility\s*=\s*["']visible["']/.test(appJsContent),
  'Should set visibility to visible on initialization'
);

// Test 11: Initialization forces z-index
test(
  'Initialization forces z-index = "1000"',
  /dndNewOpenBtn\.style\.zIndex\s*=\s*["']1000["']/.test(appJsContent),
  'Should set z-index to 1000 on initialization'
);

// Test 12: Console logging exists for button initialization
test(
  'Console logging for button initialization',
  /console\.log\s*\(\s*[^)]*DnD\s+Button[^)]*Initialized/.test(appJsContent),
  'Should log button initialization'
);

// Test 13: Console logging for computed styles
test(
  'Console logging for computed styles',
  /console\.log\s*\([^)]*Computed\s+styles[^)]*\)/.test(appJsContent) &&
  /computedStyle\s*=\s*window\.getComputedStyle\s*\(\s*dndNewOpenBtn\s*\)/.test(appJsContent),
  'Should log computed display, visibility, and bounding box'
);

// Test 14: Console logging for bounding box
test(
  'Console logging for bounding box',
  /boundingBox\s*=\s*dndNewOpenBtn\.getBoundingClientRect\s*\(\s*\)/.test(appJsContent),
  'Should calculate and log bounding box'
);

// Test 15: Parent containers are made visible
test(
  'Parent containers visibility loop exists',
  /while\s*\(\s*parent\s*&&\s*parent\s*!==\s*document\.body\s*\)[\s\S]{0,500}parent\.hidden\s*=\s*false/.test(appJsContent),
  'Should ensure all parent containers are visible'
);

// Test 16: enableDndUI forces styles
test(
  'enableDndUI forces visibility styles',
  /function\s+enableDndUI\s*\([^)]*\)\s*\{[\s\S]{0,500}dndNewOpenBtn\.style\.display\s*=/.test(appJsContent),
  'enableDndUI should also force visibility styles'
);

// Test 17: disableDndUI does NOT hide the button
const disableDndUIMatch = appJsContent.match(/function\s+disableDndUI\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
const disableDndUIBody = disableDndUIMatch ? disableDndUIMatch[0] : '';
test(
  'disableDndUI does NOT hide dndNewOpenBtn',
  disableDndUIBody.length > 0 && !disableDndUIBody.includes('dndNewOpenBtn.hidden = true'),
  'disableDndUI should NOT set dndNewOpenBtn.hidden = true'
);

// Test 18: Comment explaining button remains visible
test(
  'Comment explaining button remains visible',
  /\/\/\s*NOTE:.*DnD\s+button\s+should\s+remain\s+visible/.test(appJsContent),
  'Should have comment explaining the button stays visible'
);

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Summary: ${results.filter(r => r.passed).length}/${results.length} tests passed\n`);

if (allTestsPassed) {
  console.log('✅ All tests passed! DnD button forced visibility is correctly implemented.\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the implementation.\n');
  console.log('Failed tests:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}`);
    if (r.details) console.log(`    ${r.details}`);
  });
  console.log();
  process.exit(1);
}
