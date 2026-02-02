#!/usr/bin/env node
"use strict";

// ===================================
// TEST EVENT OUTCOME PROPERTIES
// ===================================
// Tests all event outcome properties including newly implemented ones

const { applyEventOutcome } = require("../dnd/event-resolution");

console.log("🧪 Testing Event Outcome Properties\n");

let testsPassed = 0;
let testsFailed = 0;

// Helper function for testing
function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Mock data
const mockChar = {
  id: 1,
  display_name: "TestChar",
  hp: 50,
  max_hp: 100,
  gold: 100,
  might: 4,
  finesse: 5,
  wit: 3,
  instinct: 4,
  presence: 3,
  resolve: 5,
  chaos: 4
};

const mockTemplate = {
  text: {
    critical_success: "Test success"
  },
  outcomes: {}
};

// Test 1: Gold gain
test("Gold gain outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { critical_success: { gold: 50 } }
  };
  
  const changes = applyEventOutcome(template, "critical_success", [char], {}, () => 0.5);
  
  assert(char.gold === 150, `Expected gold to be 150, got ${char.gold}`);
  assert(changes.itemChanges.length > 0, "Expected itemChanges for gold gain");
  assert(changes.itemChanges[0].action === "gain_gold", "Expected gain_gold action");
  assert(changes.itemChanges[0].amount === 50, "Expected amount to be 50");
});

// Test 2: Gold loss
test("Gold loss outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { failure: { gold: -30 } }
  };
  
  const changes = applyEventOutcome(template, "failure", [char], {}, () => 0.5);
  
  assert(char.gold === 70, `Expected gold to be 70, got ${char.gold}`);
  assert(changes.itemChanges.length > 0, "Expected itemChanges for gold loss");
  assert(changes.itemChanges[0].action === "lose_gold", "Expected lose_gold action");
});

// Test 3: Gold cannot go negative
test("Gold cannot go negative", () => {
  const char = { ...mockChar, gold: 10 };
  const template = {
    ...mockTemplate,
    outcomes: { catastrophic: { gold: -50 } }
  };
  
  applyEventOutcome(template, "catastrophic", [char], {}, () => 0.5);
  
  assert(char.gold === 0, `Expected gold to be 0 (capped), got ${char.gold}`);
});

// Test 4: Intel gain
test("Intel outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { success: { intel: 2 } }
  };
  
  const changes = applyEventOutcome(template, "success", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for intel");
  assert(changes.statusChanges[0].type === "intel", "Expected intel status change");
  assert(changes.statusChanges[0].amount === 2, "Expected intel amount to be 2");
});

// Test 5: Lose item
test("Lose item outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { catastrophic: { loseItem: true } }
  };
  
  const changes = applyEventOutcome(template, "catastrophic", [char], {}, () => 0.5);
  
  assert(changes.itemChanges.length > 0, "Expected itemChanges for lose item");
  assert(changes.itemChanges[0].action === "lose_random", "Expected lose_random action");
});

// Test 6: Summon monster
test("Summon monster outcome", () => {
  const char = { ...mockChar };
  const worldState = {};
  const template = {
    ...mockTemplate,
    outcomes: { catastrophic: { summonMonster: true } }
  };
  
  const changes = applyEventOutcome(template, "catastrophic", [char], worldState, () => 0.5);
  
  assert(changes.worldStateChanges.monsterSummoned === true, "Expected monsterSummoned flag");
  assert(worldState.activeMonster !== undefined, "Expected activeMonster in worldState");
  assert(worldState.activeMonster.hp > 0, "Expected monster to have HP");
});

// Test 7: Choose attribute swap
test("Choose attribute swap outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { critical_success: { chooseAttributeSwap: true } }
  };
  
  const changes = applyEventOutcome(template, "critical_success", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for attribute choice");
  assert(changes.statusChanges[0].type === "attribute_choice", "Expected attribute_choice type");
});

// Test 8: Random attribute boost
test("Random attribute boost outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { success: { randomAttributeBoost: 2 } }
  };
  
  const changes = applyEventOutcome(template, "success", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for attribute boost");
  assert(changes.statusChanges[0].type === "attribute_boost", "Expected attribute_boost type");
  assert(changes.statusChanges[0].amount === 2, "Expected boost amount to be 2");
  assert(changes.statusChanges[0].attribute !== undefined, "Expected attribute to be defined");
});

// Test 9: Random attribute swap
test("Random attribute swap outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { partial: { randomAttributeSwap: true } }
  };
  
  const changes = applyEventOutcome(template, "partial", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for attribute swap");
  assert(changes.statusChanges[0].type === "attribute_swap", "Expected attribute_swap type");
  assert(changes.statusChanges[0].attr1 !== undefined, "Expected attr1 to be defined");
  assert(changes.statusChanges[0].attr2 !== undefined, "Expected attr2 to be defined");
  assert(changes.statusChanges[0].attr1 !== changes.statusChanges[0].attr2, "Expected different attributes");
});

// Test 10: Scramble attributes
test("Scramble attributes outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { catastrophic: { scrambleAttributes: true } }
  };
  
  const changes = applyEventOutcome(template, "catastrophic", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for attribute scramble");
  assert(changes.statusChanges[0].type === "attribute_scramble", "Expected attribute_scramble type");
});

// Test 11: Redo check
test("Redo check outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { critical_success: { redoCheck: true } }
  };
  
  const changes = applyEventOutcome(template, "critical_success", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for redo check");
  const redoChange = changes.statusChanges.find(c => c.type === "check_modifier");
  assert(redoChange !== undefined, "Expected check_modifier status change");
  assert(redoChange.effect === "redo_last_check", "Expected redo_last_check effect");
});

// Test 12: Next check bonus
test("Next check bonus outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { success: { nextCheckBonus: 5 } }
  };
  
  const changes = applyEventOutcome(template, "success", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for check bonus");
  const bonusChange = changes.statusChanges.find(c => c.type === "check_modifier");
  assert(bonusChange !== undefined, "Expected check_modifier status change");
  assert(bonusChange.effect === "next_check_bonus", "Expected next_check_bonus effect");
  assert(bonusChange.bonus === 5, "Expected bonus to be 5");
});

// Test 13: Lose turn
test("Lose turn outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { failure: { loseTurn: true } }
  };
  
  const changes = applyEventOutcome(template, "failure", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for lose turn");
  assert(changes.statusChanges[0].type === "turn_skip", "Expected turn_skip type");
});

// Test 14: Random debuff
test("Random debuff outcome", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { failure: { randomDebuff: true } }
  };
  
  const changes = applyEventOutcome(template, "failure", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for random debuff");
  const debuffChange = changes.statusChanges.find(c => c.type === "debuff");
  assert(debuffChange !== undefined, "Expected debuff status change");
  assert(typeof debuffChange.effect === "string", "Expected debuff effect to be a string");
});

// Test 15: Multiple characters affected
test("Multiple characters affected by outcome", () => {
  const char1 = { ...mockChar, id: 1 };
  const char2 = { ...mockChar, id: 2 };
  const template = {
    ...mockTemplate,
    outcomes: { success: { gold: 25, intel: 1 } }
  };
  
  const changes = applyEventOutcome(template, "success", [char1, char2], {}, () => 0.5);
  
  // Both characters should get gold
  assert(char1.gold === 125, "Expected char1 gold to be 125");
  assert(char2.gold === 125, "Expected char2 gold to be 125");
  
  // Should have 2 gold changes (one per character) and 2 intel changes
  assert(changes.itemChanges.length === 2, "Expected 2 itemChanges");
  assert(changes.statusChanges.length === 2, "Expected 2 statusChanges");
});

// Test 16: Combined outcomes
test("Combined outcome properties", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { 
      critical_success: { 
        gold: 50, 
        intel: 2, 
        loot: 1, 
        heal: 20,
        buff: "empowered"
      } 
    }
  };
  
  const changes = applyEventOutcome(template, "critical_success", [char], {}, () => 0.5);
  
  // Check all effects are applied
  assert(char.gold === 150, "Expected gold change");
  assert(char.hp === 70, "Expected HP healing");
  
  // Check changes are recorded
  assert(changes.itemChanges.length >= 2, "Expected gold and loot changes");
  assert(changes.statusChanges.length >= 2, "Expected intel and buff changes");
  assert(changes.hpChanges.length > 0, "Expected HP changes");
});

// Test 17: Existing properties still work (dmg)
test("Existing damage property still works", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { failure: { dmg: 30 } }
  };
  
  const changes = applyEventOutcome(template, "failure", [char], {}, () => 0.5);
  
  assert(char.hp === 20, `Expected HP to be 20, got ${char.hp}`);
  assert(changes.hpChanges.length > 0, "Expected hpChanges");
});

// Test 18: Existing properties still work (buff)
test("Existing buff property still works", () => {
  const char = { ...mockChar };
  const template = {
    ...mockTemplate,
    outcomes: { success: { buff: "blessed" } }
  };
  
  const changes = applyEventOutcome(template, "success", [char], {}, () => 0.5);
  
  assert(changes.statusChanges.length > 0, "Expected statusChanges for buff");
  const buffChange = changes.statusChanges.find(c => c.type === "buff");
  assert(buffChange !== undefined, "Expected buff status change");
  assert(buffChange.effect === "blessed", "Expected blessed buff");
});

// Summary
console.log("\n" + "=".repeat(50));
console.log("📊 Test Results");
console.log("=".repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log("\n❌ Some tests failed!");
  process.exit(1);
} else {
  console.log("\n🎉 All tests passed!");
  process.exit(0);
}
