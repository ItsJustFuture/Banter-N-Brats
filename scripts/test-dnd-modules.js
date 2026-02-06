#!/usr/bin/env node
"use strict";

// Test DnD functionality
const dndCharacterSystem = require("../dnd/character-system");
const dndEventTemplates = require("../dnd/event-templates");
const dndEventResolution = require("../dnd/event-resolution");

console.log("🧪 Testing DnD Modules\n");

// Test 1: Character validation
console.log("✅ Test 1: Character Attribute Validation");
const validAttributes = {
  might: 4,
  finesse: 5,
  wit: 3,
  instinct: 4,
  presence: 3,
  resolve: 5,
  chaos: 4
};

const result1 = dndCharacterSystem.validateAttributes(validAttributes);
console.log(`  Valid attributes (28 points): ${result1.valid ? "✓ PASS" : "✗ FAIL"}`);

const invalidAttributes = { ...validAttributes, might: 10 };
const result2 = dndCharacterSystem.validateAttributes(invalidAttributes);
console.log(`  Invalid attributes (too many points): ${!result2.valid ? "✓ PASS" : "✗ FAIL"}`);

// Test 2: Skills validation
console.log("\n✅ Test 2: Skills Validation");
const validSkills = ["warrior", "rogue", "mage"];
const result3 = dndCharacterSystem.validateSkills(validSkills);
console.log(`  Valid skills (3 skills): ${result3.valid ? "✓ PASS" : "✗ FAIL"}`);

const tooFewSkills = ["warrior"];
const result4 = dndCharacterSystem.validateSkills(tooFewSkills);
console.log(`  Too few skills: ${!result4.valid ? "✓ PASS" : "✗ FAIL"}`);

// Test 3: Perks validation
console.log("\n✅ Test 3: Perks Validation");
const validPerks = ["critical_eye", "iron_will"];
const result5 = dndCharacterSystem.validatePerks(validPerks);
console.log(`  Valid perks (2 perks): ${result5.valid ? "✓ PASS" : "✗ FAIL"}`);

const tooManyPerks = ["critical_eye", "iron_will", "lucky_dodge", "second_wind"];
const result6 = dndCharacterSystem.validatePerks(tooManyPerks);
console.log(`  Too many perks: ${!result6.valid ? "✓ PASS" : "✗ FAIL"}`);

// Test 4: Attribute modifiers
console.log("\n✅ Test 4: Attribute Modifiers");
const mod1 = dndCharacterSystem.getAttributeModifier(1);
const mod4 = dndCharacterSystem.getAttributeModifier(4);
const mod7 = dndCharacterSystem.getAttributeModifier(7);
console.log(`  Attribute 1 → modifier ${mod1}: ${mod1 === -3 ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  Attribute 4 → modifier ${mod4}: ${mod4 === 0 ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  Attribute 7 → modifier ${mod7}: ${mod7 === 3 ? "✓ PASS" : "✗ FAIL"}`);

// Test 5: Skill bonuses
console.log("\n✅ Test 5: Skill Bonuses Application");
const { attributes: modifiedAttrs, hpBonus } = dndCharacterSystem.applySkillBonuses(
  validAttributes,
  ["warrior", "mage"]
);
console.log(`  Skill bonuses applied: ${modifiedAttrs.might >= validAttributes.might ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  HP bonus calculated: ${hpBonus >= 0 ? "✓ PASS" : "✗ FAIL"}`);

// Test 6: Event templates
console.log("\n✅ Test 6: Event Templates");
const templates = dndEventTemplates.EVENT_TEMPLATES;
const templateCount = Object.keys(templates).length;
console.log(`  Loaded ${templateCount} event templates: ${templateCount >= 10 ? "✓ PASS" : "✗ FAIL"}`);

// Test 7: D20 roll
console.log("\n✅ Test 7: D20 Roll System");
const rng = () => 0.5; // Predictable RNG for testing
const roll = dndEventResolution.rollD20(rng);
console.log(`  D20 roll (0.5 RNG): ${roll} ${roll >= 1 && roll <= 20 ? "✓ PASS" : "✗ FAIL"}`);

// Test 8: Check outcome determination
console.log("\n✅ Test 8: Outcome Determination");
const outcome1 = dndEventTemplates.determineOutcome(20, 15);
const outcome2 = dndEventTemplates.determineOutcome(15, 12);
const outcome3 = dndEventTemplates.determineOutcome(1, 15);
console.log(`  Roll 20 vs DC 15 → ${outcome1}: ${outcome1 === "critical_success" ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  Roll 15 vs DC 12 → ${outcome2}: ${outcome2 === "success" ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  Roll 1 vs DC 15 → ${outcome3}: ${outcome3 === "catastrophic" ? "✓ PASS" : "✗ FAIL"}`);

// Test 9: Event selection
console.log("\n✅ Test 9: Event Selection");
const selected = dndEventResolution.selectEventTemplate(templates, 10, 1, rng);
console.log(`  Event selected: ${selected.key} ${selected.template ? "✓ PASS" : "✗ FAIL"}`);

// Test 10: Narrative formatting
console.log("\n✅ Test 10: Narrative Formatting");
const mockChars = [
  { display_name: "Alice" },
  { display_name: "Bob" }
];
const narrative = dndEventResolution.formatNarrative("{CHAR1} and {CHAR2} explore together.", mockChars);
console.log(`  Formatted: "${narrative}"`);
console.log(`  Contains character names: ${narrative.includes("Alice") && narrative.includes("Bob") ? "✓ PASS" : "✗ FAIL"}`);

console.log("\n🎉 All DnD module tests completed!\n");
