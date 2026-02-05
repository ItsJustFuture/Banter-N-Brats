#!/usr/bin/env node
/**
 * Test: DND Button in Input Bar
 * 
 * Verifies that the DND button has been moved to the input bar
 * and shows/hides correctly based on room.
 */

const fs = require("fs");
const path = require("path");

console.log("=== DND Button Input Bar Position Test ===\n");

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`✅ PASS: ${msg}`);
  passed++;
}

function fail(msg) {
  console.error(`❌ FAIL: ${msg}`);
  failed++;
}

// Test 1: Check HTML - Button removed from top bar
console.log("Test 1: Verify button removed from top bar");
const indexHtml = fs.readFileSync(
  path.join(__dirname, "../public/index.html"),
  "utf8"
);

// Check that dndNewOpenBtn is NOT in the topActions area
const topActionsMatch = indexHtml.match(
  /<div[^>]*class="[^"]*topActions[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/
);
if (topActionsMatch) {
  const topActionsContent = topActionsMatch[1];
  if (topActionsContent.includes('id="dndNewOpenBtn"')) {
    fail("dndNewOpenBtn still found in top actions bar");
  } else {
    pass("dndNewOpenBtn successfully removed from top actions bar");
  }
} else {
  fail("Could not find topActions div");
}

// Test 2: Check HTML - Button added to input bar
console.log("\nTest 2: Verify button in input bar");
const inputBarMatch = indexHtml.match(
  /<div[^>]*class="inputBar"[^>]*>([\s\S]*?)<div aria-label="Tone indicator"/
);
if (inputBarMatch) {
  const inputBarContent = inputBarMatch[1];
  if (inputBarContent.includes('id="dndNewOpenBtn"')) {
    pass("dndNewOpenBtn found in input bar");
    
    // Check it's next to media button
    const mediaIndex = inputBarContent.indexOf('id="mediaBtn"');
    const dndIndex = inputBarContent.indexOf('id="dndNewOpenBtn"');
    if (mediaIndex > 0 && dndIndex > mediaIndex && dndIndex - mediaIndex < 200) {
      pass("dndNewOpenBtn positioned near mediaBtn");
    } else {
      fail("dndNewOpenBtn not positioned near mediaBtn");
    }
    
    // Check it has hidden attribute
    const dndButtonMatch = inputBarContent.match(/<button[^>]*id="dndNewOpenBtn"[^>]*>/);
    if (dndButtonMatch && dndButtonMatch[0].includes('hidden')) {
      pass("dndNewOpenBtn has hidden attribute by default");
    } else {
      fail("dndNewOpenBtn should have hidden attribute by default");
    }
    
    // Check it's styled as iconBtn
    if (dndButtonMatch && dndButtonMatch[0].includes('class="iconBtn')) {
      pass("dndNewOpenBtn styled as iconBtn");
    } else {
      fail("dndNewOpenBtn should be styled as iconBtn");
    }
  } else {
    fail("dndNewOpenBtn not found in input bar");
  }
} else {
  fail("Could not find input bar");
}

// Test 3: Check CSS - No forced visibility
console.log("\nTest 3: Verify CSS doesn't force visibility");
const stylesCSS = fs.readFileSync(
  path.join(__dirname, "../public/styles.css"),
  "utf8"
);

// Check that forced visibility styles are removed
if (stylesCSS.includes('.dndNewOpenBtn[hidden]')) {
  fail("CSS still has [hidden] override - should be removed");
} else {
  pass("CSS doesn't override [hidden] attribute");
}

if (stylesCSS.includes('visibility: visible !important')) {
  const dndStylesMatch = stylesCSS.match(/\.dndNewOpenBtn[^{]*\{[^}]*visibility:\s*visible\s*!important/);
  if (dndStylesMatch) {
    fail("CSS still forces visibility with !important");
  } else {
    pass("CSS doesn't force visibility for dndNewOpenBtn");
  }
} else {
  pass("No forced visibility styles found");
}

// Test 4: Check JavaScript - enableDndUI shows button
console.log("\nTest 4: Verify enableDndUI shows button");
const appJS = fs.readFileSync(
  path.join(__dirname, "../public/app.js"),
  "utf8"
);

const enableDndUIMatch = appJS.match(/function enableDndUI\(\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
if (enableDndUIMatch) {
  const enableDndUIBody = enableDndUIMatch[1];
  
  if (enableDndUIBody.includes('dndNewOpenBtn.hidden = false')) {
    pass("enableDndUI sets dndNewOpenBtn.hidden = false");
  } else {
    fail("enableDndUI should set dndNewOpenBtn.hidden = false");
  }
  
  // Check that forced styles are removed
  if (enableDndUIBody.includes('dndNewOpenBtn.style.display') ||
      enableDndUIBody.includes('dndNewOpenBtn.style.visibility') ||
      enableDndUIBody.includes('dndNewOpenBtn.style.zIndex')) {
    fail("enableDndUI still sets forced inline styles - should be removed");
  } else {
    pass("enableDndUI doesn't set forced inline styles");
  }
} else {
  fail("Could not find enableDndUI function");
}

// Test 5: Check JavaScript - disableDndUI hides button
console.log("\nTest 5: Verify disableDndUI hides button");
const disableDndUIMatch = appJS.match(/function disableDndUI\(\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
if (disableDndUIMatch) {
  const disableDndUIBody = disableDndUIMatch[1];
  
  if (disableDndUIBody.includes('dndNewOpenBtn.hidden = true')) {
    pass("disableDndUI sets dndNewOpenBtn.hidden = true");
  } else {
    fail("disableDndUI should set dndNewOpenBtn.hidden = true");
  }
  
  // Check that old "always visible" comment is removed
  if (disableDndUIBody.includes('should remain visible at all times')) {
    fail("disableDndUI still has 'always visible' comment - should be updated");
  } else {
    pass("disableDndUI no longer mentions 'always visible'");
  }
} else {
  fail("Could not find disableDndUI function");
}

// Test 6: Check JavaScript - Forced visibility initialization removed
console.log("\nTest 6: Verify forced visibility initialization removed");
if (appJS.includes('Force DnD button visibility on load')) {
  fail("JavaScript still has forced visibility initialization code");
} else {
  pass("Forced visibility initialization code removed");
}

if (appJS.includes('dndNewOpenBtn.style.removeProperty')) {
  fail("JavaScript still manipulates positioning styles");
} else {
  pass("No position style manipulation found");
}

// Test 7: Check that event listener is still attached
console.log("\nTest 7: Verify event listener still attached");
if (appJS.includes('dndNewOpenBtn?.addEventListener("click", openDndModal)')) {
  pass("Event listener for dndNewOpenBtn is attached");
} else {
  fail("Event listener for dndNewOpenBtn not found");
}

// Summary
console.log("\n=== Test Summary ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
  console.log("\n✅ All tests passed!");
  process.exit(0);
} else {
  console.log("\n❌ Some tests failed");
  process.exit(1);
}
