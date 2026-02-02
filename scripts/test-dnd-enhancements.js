"use strict";

// ===================================
// DND ENHANCEMENTS - VALIDATION TEST
// ===================================
// Validates new event templates and couple system integration

const { EVENT_TEMPLATES } = require("../dnd/event-templates");
const { areCouple, selectEventTemplate } = require("../dnd/event-resolution");

console.log("🎲 DnD Enhancements Validation");
console.log("================================\n");

// Count events by category
const eventCategories = {
  funny: [],
  romantic: [],
  sexy: [],
  gory: [],
  gameAltering: [],
  challenge: [],
  mysterious: [],
  couple: []
};

const categoryKeywords = {
  funny: ["mimic", "slippery", "banana", "joke", "pants", "wardrobe"],
  romantic: ["starlit", "love_letter", "dancing", "shared_blanket"],
  sexy: ["steamy_springs", "seductive", "tension_release", "aphrodisiac"],
  gory: ["blood_ritual", "dismemberment", "zombie_horde", "torture_chamber"],
  gameAltering: ["reality_shift", "divine_intervention", "time_loop"],
  challenge: ["riddle_sphinx", "gauntlet_run", "strength_trial"],
  mysterious: ["whispering_shadows", "prophetic_vision", "ancient_guardian", "portal_mystery"]
};

// Categorize events
for (const [key, template] of Object.entries(EVENT_TEMPLATES)) {
  // Check for couple bonus flag
  if (template.coupleBonus) {
    eventCategories.couple.push(key);
  }
  
  // Categorize by keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => key.includes(kw) || template.title.toLowerCase().includes(kw))) {
      eventCategories[category].push(key);
    }
  }
}

// Display results
console.log("📊 Event Distribution:");
console.log(`Total Events: ${Object.keys(EVENT_TEMPLATES).length}`);
console.log(`\n✨ New Event Categories:`);
console.log(`  Funny/Comedic: ${eventCategories.funny.length}`);
console.log(`  Romantic: ${eventCategories.romantic.length}`);
console.log(`  Sexy/NSFW: ${eventCategories.sexy.length}`);
console.log(`  Gory/Horror: ${eventCategories.gory.length}`);
console.log(`  Game-Altering: ${eventCategories.gameAltering.length}`);
console.log(`  Challenge: ${eventCategories.challenge.length}`);
console.log(`  Mysterious: ${eventCategories.mysterious.length}`);
console.log(`  Couple-Specific: ${eventCategories.couple.length}`);

// Validate event structure
console.log("\n🔍 Validating Event Structure...");
let errors = 0;
let warnings = 0;

for (const [key, template] of Object.entries(EVENT_TEMPLATES)) {
  // Check required fields
  if (!template.type) {
    console.error(`❌ ${key}: Missing type field`);
    errors++;
  }
  if (!template.title) {
    console.error(`❌ ${key}: Missing title field`);
    errors++;
  }
  if (!template.text || !template.text.intro) {
    console.error(`❌ ${key}: Missing text.intro field`);
    errors++;
  }
  if (!template.check || !template.check.attribute || !template.check.dc) {
    console.error(`❌ ${key}: Missing or invalid check field`);
    errors++;
  }
  if (!template.outcomes) {
    console.error(`❌ ${key}: Missing outcomes field`);
    errors++;
  }
  
  // Check outcome texts exist
  const requiredOutcomes = ["critical_success", "success", "partial", "failure", "catastrophic"];
  for (const outcome of requiredOutcomes) {
    if (!template.text[outcome]) {
      console.warn(`⚠️  ${key}: Missing text for outcome: ${outcome}`);
      warnings++;
    }
    if (!template.outcomes[outcome]) {
      console.error(`❌ ${key}: Missing outcome definition: ${outcome}`);
      errors++;
    }
  }
  
  // Check placeholder consistency
  const intro = template.text.intro || "";
  const hasChar1 = intro.includes("{CHAR1}") || intro.includes("{CHAR}");
  const hasChar2 = intro.includes("{CHAR2}");
  
  if (template.minPlayers >= 2 && !hasChar2) {
    console.warn(`⚠️  ${key}: minPlayers=2+ but no {CHAR2} in intro`);
    warnings++;
  }
  
  if (template.minPlayers === 1 && hasChar2) {
    console.warn(`⚠️  ${key}: minPlayers=1 but has {CHAR2} in intro`);
    warnings++;
  }
}

// Test couple detection
console.log("\n💕 Testing Couple Detection...");

const mockChar1 = { user_id: 1, display_name: "Alice" };
const mockChar2 = { user_id: 2, display_name: "Bob" };
const mockChar3 = { user_id: 3, display_name: "Charlie" };

const mockCouplePairs = [
  { user1_id: 1, user2_id: 2 }
];

const isCouple12 = areCouple(mockChar1, mockChar2, mockCouplePairs);
const isCouple13 = areCouple(mockChar1, mockChar3, mockCouplePairs);
const isCouple21 = areCouple(mockChar2, mockChar1, mockCouplePairs); // Reversed

console.log(`  Alice & Bob are couple: ${isCouple12} (expected: true)`);
console.log(`  Alice & Charlie are couple: ${isCouple13} (expected: false)`);
console.log(`  Bob & Alice are couple: ${isCouple21} (expected: true, order-independent)`);

if (!isCouple12 || isCouple13 || !isCouple21) {
  console.error("❌ Couple detection failed!");
  errors++;
} else {
  console.log("✅ Couple detection working correctly");
}

// Test event selection with couples
console.log("\n🎯 Testing Event Selection with Couples...");

const mockRng = () => Math.random();
const aliveChars = [mockChar1, mockChar2, mockChar3];

// Test without couples
const selection1 = selectEventTemplate(EVENT_TEMPLATES, 3, 1, mockRng, aliveChars, []);
console.log(`  Without couples: Selected "${selection1.template.title}"`);

// Test with couples (should prefer couple events)
const coupleEventWeights = {};
for (let i = 0; i < 100; i++) {
  const selection = selectEventTemplate(EVENT_TEMPLATES, 3, 1, mockRng, aliveChars, mockCouplePairs);
  const isCoupleEvent = selection.template.coupleBonus ? "couple" : "non-couple";
  coupleEventWeights[isCoupleEvent] = (coupleEventWeights[isCoupleEvent] || 0) + 1;
}

console.log(`  With couples (100 selections):`);
console.log(`    Couple events: ${coupleEventWeights.couple || 0}`);
console.log(`    Non-couple events: ${coupleEventWeights["non-couple"] || 0}`);

if ((coupleEventWeights.couple || 0) > (coupleEventWeights["non-couple"] || 0)) {
  console.log("✅ Couple events are weighted higher when couples present");
} else {
  console.warn("⚠️  Couple event weighting may not be working as expected");
  warnings++;
}

// Summary
console.log("\n" + "=".repeat(50));
console.log("📋 Validation Summary");
console.log("=".repeat(50));

if (errors === 0 && warnings === 0) {
  console.log("✅ All validations passed!");
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  ${warnings} warnings found (non-critical)`);
  process.exit(0);
} else {
  console.log(`❌ ${errors} errors and ${warnings} warnings found`);
  process.exit(1);
}
