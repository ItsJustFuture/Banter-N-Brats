#!/usr/bin/env node
"use strict";

// Test DnD Gameplay Features
// Tests for summonMonster, attribute modifications, and check modifiers
const dndEventResolution = require("../dnd/event-resolution");

console.log("🧪 Testing DnD Gameplay Features\n");

let testsPassed = 0;
let testsFailed = 0;

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
    return true;
  } else {
    console.log(`  ✗ ${testName} (expected: ${expected}, got: ${actual})`);
    testsFailed++;
    return false;
  }
}

function assertTrue(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
    return true;
  } else {
    console.log(`  ✗ ${testName}`);
    testsFailed++;
    return false;
  }
}

function assertDefined(value, testName) {
  if (value !== undefined && value !== null) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
    return true;
  } else {
    console.log(`  ✗ ${testName}`);
    testsFailed++;
    return false;
  }
}

// ==========================================
// Test 1: Monster Summoning
// ==========================================
console.log("✅ Test 1: Monster Summoning (summonMonster property)");

const mockTemplate1 = {
  outcomes: {
    catastrophic: { dmg: 60, summonMonster: true }
  },
  text: {
    catastrophic: "A monster appears!"
  }
};

const mockChars1 = [
  { id: 1, display_name: "Alice", hp: 100, max_hp: 100, might: 4, finesse: 5, wit: 3, instinct: 4, presence: 3, resolve: 5, chaos: 4 }
];

const worldState1 = {};
const rng = () => 0.5;

const result1 = dndEventResolution.applyEventOutcome(mockTemplate1, "catastrophic", mockChars1, worldState1, rng);

assertDefined(worldState1.activeMonster, "Monster summoned to worldState");
assertEqual(worldState1.activeMonster?.name, "Summoned Horror", "Monster has default name");
assertEqual(worldState1.activeMonster?.checkPenalty, -2, "Monster has default check penalty");
assertTrue(result1.worldStateChanges?.monsterSummoned, "Monster summoning recorded in changes");

// Test custom monster name and penalty
const mockTemplate1b = {
  outcomes: {
    catastrophic: { dmg: 30, summonMonster: true, monsterName: "Ancient Dragon", monsterPenalty: -3 }
  },
  text: {
    catastrophic: "A dragon appears!"
  }
};
const worldState1b = {};
dndEventResolution.applyEventOutcome(mockTemplate1b, "catastrophic", mockChars1, worldState1b, rng);
assertEqual(worldState1b.activeMonster?.name, "Ancient Dragon", "Monster has custom name");
assertEqual(worldState1b.activeMonster?.checkPenalty, -3, "Monster has custom check penalty");

// Test monster effect on checks
console.log("\n✅ Test 2: Monster Check Penalty Application");

const mockChar2 = {
  id: 1,
  display_name: "Alice",
  might: 5,
  finesse: 4,
  wit: 4,
  instinct: 4,
  presence: 4,
  resolve: 4,
  chaos: 3,
  skills_json: "[]",
  perks_json: "[]"
};

// Check without monster
const checkContext1 = {};
const check1 = dndEventResolution.performCheck(mockChar2, "might", 15, rng, checkContext1);
const modifier1 = check1.modifier;

// Check with monster
const worldState2 = {
  activeMonster: { name: "Summoned Horror", hp: 100, checkPenalty: -2 }
};
const checkContext2 = { worldState: worldState2 };
const check2 = dndEventResolution.performCheck(mockChar2, "might", 15, rng, checkContext2);
const modifier2 = check2.modifier;

assertEqual(modifier2, modifier1 - 2, "Monster applies -2 penalty to checks");
assertTrue(check2.breakdown.some(b => b.source === "active_monster"), "Monster penalty in breakdown");

// ==========================================
// Test 3: Random Attribute Boost
// ==========================================
console.log("\n✅ Test 3: Random Attribute Boost (randomAttributeBoost property)");

const mockTemplate3 = {
  outcomes: {
    success: { randomAttributeBoost: 2 }
  },
  text: {
    success: "Your attributes increase!"
  }
};

const mockChars3 = [
  {
    id: 1,
    display_name: "Bob",
    hp: 100,
    max_hp: 100,
    might: 3,
    finesse: 3,
    wit: 3,
    instinct: 3,
    presence: 3,
    resolve: 3,
    chaos: 3
  }
];

const worldState3 = {};
const result3 = dndEventResolution.applyEventOutcome(mockTemplate3, "success", mockChars3, worldState3, rng);

assertTrue(result3.attributeChanges.length > 0, "Attribute changes recorded");
const attrChange = result3.attributeChanges[0];
assertEqual(attrChange.characterId, 1, "Attribute change for correct character");
assertEqual(attrChange.change, 2, "Attribute boosted by 2");
assertTrue(attrChange.newValue === attrChange.oldValue + 2, "New value is old value + 2");

// ==========================================
// Test 4: Random Attribute Swap
// ==========================================
console.log("\n✅ Test 4: Random Attribute Swap (randomAttributeSwap property)");

const mockTemplate4 = {
  outcomes: {
    partial: { randomAttributeSwap: true }
  },
  text: {
    partial: "Your attributes swap!"
  }
};

const mockChars4 = [
  {
    id: 1,
    display_name: "Charlie",
    hp: 100,
    max_hp: 100,
    might: 7,
    finesse: 2,
    wit: 4,
    instinct: 3,
    presence: 5,
    resolve: 3,
    chaos: 4
  }
];

const worldState4 = {};
const result4 = dndEventResolution.applyEventOutcome(mockTemplate4, "partial", mockChars4, worldState4, rng);

assertTrue(result4.attributeChanges.length > 0, "Attribute swap recorded");
const swapChange = result4.attributeChanges[0];
assertEqual(swapChange.type, "swap", "Change type is swap");
assertEqual(swapChange.attributes.length, 2, "Two attributes swapped");
assertTrue(swapChange.attributes[0] !== swapChange.attributes[1], "Different attributes swapped");

// ==========================================
// Test 5: Scramble Attributes
// ==========================================
console.log("\n✅ Test 5: Scramble Attributes (scrambleAttributes property)");

const mockTemplate5 = {
  outcomes: {
    catastrophic: { dmg: 50, scrambleAttributes: true }
  },
  text: {
    catastrophic: "Reality warps around you!"
  }
};

const mockChars5 = [
  {
    id: 1,
    display_name: "Diana",
    hp: 100,
    max_hp: 100,
    might: 7,
    finesse: 6,
    wit: 5,
    instinct: 4,
    presence: 2,
    resolve: 1,
    chaos: 3
  }
];

const worldState5 = {};
const result5 = dndEventResolution.applyEventOutcome(mockTemplate5, "catastrophic", mockChars5, worldState5, rng);

assertTrue(result5.attributeChanges.length > 0, "Attribute scramble recorded");
const scrambleChange = result5.attributeChanges[0];
assertEqual(scrambleChange.type, "scramble", "Change type is scramble");
assertDefined(scrambleChange.oldValues, "Old values recorded");
assertDefined(scrambleChange.newValues, "New values recorded");

// Verify the sum of attributes remains the same (28 total)
const oldSum = Object.values(scrambleChange.oldValues).reduce((a, b) => a + b, 0);
const newSum = Object.values(scrambleChange.newValues).reduce((a, b) => a + b, 0);
assertEqual(oldSum, newSum, "Total attribute points remain the same after scramble");

// ==========================================
// Test 6: Choose Attribute Swap
// ==========================================
console.log("\n✅ Test 6: Choose Attribute Swap (chooseAttributeSwap property)");

const mockTemplate6 = {
  outcomes: {
    critical_success: { chooseAttributeSwap: true }
  },
  text: {
    critical_success: "Choose wisely!"
  }
};

const mockChars6 = [
  {
    id: 1,
    display_name: "Eve",
    hp: 100,
    max_hp: 100,
    might: 4,
    finesse: 4,
    wit: 4,
    instinct: 4,
    presence: 4,
    resolve: 4,
    chaos: 4
  }
];

const worldState6 = {};
const result6 = dndEventResolution.applyEventOutcome(mockTemplate6, "critical_success", mockChars6, worldState6, rng);

assertTrue(result6.statusChanges.length > 0, "Status change for attribute choice recorded");
const choiceStatus = result6.statusChanges.find(s => s.type === "attribute_choice");
assertDefined(choiceStatus, "Attribute choice status effect added");
assertEqual(choiceStatus.effect, "choose_two_attributes_to_swap", "Correct effect description");
assertTrue(choiceStatus.pendingAction, "Marked as pending action");

// ==========================================
// Test 7: Next Check Bonus
// ==========================================
console.log("\n✅ Test 7: Next Check Bonus (nextCheckBonus property)");

const mockTemplate7 = {
  outcomes: {
    success: { nextCheckBonus: 5 }
  },
  text: {
    success: "You gain insight!"
  }
};

const mockChars7 = [
  {
    id: 1,
    display_name: "Frank",
    hp: 100,
    max_hp: 100,
    might: 4,
    finesse: 4,
    wit: 4,
    instinct: 4,
    presence: 4,
    resolve: 4,
    chaos: 4
  }
];

const worldState7 = {};
const result7 = dndEventResolution.applyEventOutcome(mockTemplate7, "success", mockChars7, worldState7, rng);

assertTrue(result7.statusChanges.length > 0, "Status change for check bonus recorded");
const bonusStatus = result7.statusChanges.find(s => s.type === "check_modifier");
assertDefined(bonusStatus, "Check modifier status effect added");
assertEqual(bonusStatus.effect, "next_check_bonus", "Correct effect type");
assertEqual(bonusStatus.value, 5, "Bonus value is 5");
assertEqual(bonusStatus.expiresAfter, "next_check", "Expires after next check");

// Test bonus application in performCheck
const mockChar7 = {
  id: 1,
  display_name: "Frank",
  might: 4,
  finesse: 4,
  wit: 4,
  instinct: 4,
  presence: 4,
  resolve: 4,
  chaos: 3,
  skills_json: "[]",
  perks_json: "[]"
};

const statusEffects7 = [
  { id: 1, type: "check_modifier", effect: "next_check_bonus", value: 5 }
];

const checkWithBonus = dndEventResolution.performCheck(mockChar7, "wit", 15, rng, { statusEffects: statusEffects7 });
const checkWithoutBonus = dndEventResolution.performCheck(mockChar7, "wit", 15, rng, {});

assertEqual(checkWithBonus.total, checkWithoutBonus.total + 5, "Check bonus applies +5 to total");
assertTrue(checkWithBonus.breakdown.some(b => b.source === "status_bonus"), "Bonus in breakdown");
assertTrue(checkWithBonus.usedStatusEffects.length > 0, "Status effect marked as used");

// ==========================================
// Test 8: Redo Check
// ==========================================
console.log("\n✅ Test 8: Redo Check (redoCheck property)");

const mockTemplate8 = {
  outcomes: {
    critical_success: { redoCheck: true }
  },
  text: {
    critical_success: "Time rewinds!"
  }
};

const mockChars8 = [
  {
    id: 1,
    display_name: "Grace",
    hp: 100,
    max_hp: 100,
    might: 4,
    finesse: 4,
    wit: 4,
    instinct: 4,
    presence: 4,
    resolve: 4,
    chaos: 4
  }
];

const worldState8 = {};
const result8 = dndEventResolution.applyEventOutcome(mockTemplate8, "critical_success", mockChars8, worldState8, rng);

assertTrue(result8.statusChanges.length > 0, "Status change for redo recorded");
const redoStatus = result8.statusChanges.find(s => s.type === "check_modifier" && s.effect === "redo_last_check");
assertDefined(redoStatus, "Redo check status effect added");
assertTrue(redoStatus.allowRedo, "Allow redo flag set");
assertEqual(redoStatus.expiresAfter, "next_check", "Expires after next check");

// ==========================================
// Test 9: Lose Turn
// ==========================================
console.log("\n✅ Test 9: Lose Turn (loseTurn property)");

const mockTemplate9 = {
  outcomes: {
    failure: { dmg: 25, loseTurn: true }
  },
  text: {
    failure: "You are stunned!"
  }
};

const mockChars9 = [
  {
    id: 1,
    display_name: "Henry",
    hp: 100,
    max_hp: 100,
    might: 4,
    finesse: 4,
    wit: 4,
    instinct: 4,
    presence: 4,
    resolve: 4,
    chaos: 4
  }
];

const worldState9 = {};
const result9 = dndEventResolution.applyEventOutcome(mockTemplate9, "failure", mockChars9, worldState9, rng);

assertTrue(result9.statusChanges.length > 0, "Status change for lose turn recorded");
const skipStatus = result9.statusChanges.find(s => s.type === "turn_skip");
assertDefined(skipStatus, "Turn skip status effect added");
assertEqual(skipStatus.effect, "loses next turn", "Correct effect description");
assertTrue(skipStatus.skipTurn, "Skip turn flag set");
assertEqual(skipStatus.expiresAfter, "next_turn", "Expires after next turn");

// ==========================================
// Test 10: Attribute Cap at Max
// ==========================================
console.log("\n✅ Test 10: Attribute Boost Caps at Max (7)");

const mockTemplate10 = {
  outcomes: {
    success: { randomAttributeBoost: 5 }
  },
  text: {
    success: "Massive power increase!"
  }
};

const mockChars10 = [
  {
    id: 1,
    display_name: "Ivy",
    hp: 100,
    max_hp: 100,
    might: 6,
    finesse: 3,
    wit: 4,
    instinct: 4,
    presence: 4,
    resolve: 4,
    chaos: 3
  }
];

const worldState10 = {};
// Force RNG to select might (index 0)
const rngFixed = () => 0.1;
const result10 = dndEventResolution.applyEventOutcome(mockTemplate10, "success", mockChars10, worldState10, rngFixed);

const attrChange10 = result10.attributeChanges[0];
assertTrue(attrChange10.newValue <= 7, "Attribute capped at maximum 7");
assertEqual(attrChange10.newValue, 7, "Attribute reached cap");

// ==========================================
// Summary
// ==========================================
console.log("\n==========================================");
console.log("📋 Test Summary");
console.log("==========================================");
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log("==========================================\n");

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log("🎉 All gameplay feature tests passed!\n");
}
