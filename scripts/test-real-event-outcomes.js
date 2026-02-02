#!/usr/bin/env node
"use strict";

// ===================================
// TEST REAL EVENT OUTCOMES
// ===================================
// Tests actual events that use the new outcome properties

const { EVENT_TEMPLATES } = require("../dnd/event-templates");
const { applyEventOutcome } = require("../dnd/event-resolution");

console.log("🎲 Testing Real Event Outcomes with New Properties\n");

let testsPassed = 0;
let testsFailed = 0;

function test(eventKey, outcome, expectedProperties) {
  try {
    const template = EVENT_TEMPLATES[eventKey];
    if (!template) {
      throw new Error(`Event ${eventKey} not found`);
    }
    
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
    
    const worldState = {};
    const changes = applyEventOutcome(template, outcome, [mockChar], worldState, () => 0.5);
    
    // Check if expected properties are present in changes
    for (const [prop, value] of Object.entries(expectedProperties)) {
      if (prop === "gold") {
        if (changes.itemChanges.length === 0 || !changes.itemChanges.some(c => c.action.includes("gold"))) {
          throw new Error(`Expected gold change but got none`);
        }
      } else if (prop === "intel") {
        if (changes.statusChanges.length === 0 || !changes.statusChanges.some(c => c.type === "intel")) {
          throw new Error(`Expected intel change but got none`);
        }
      } else if (prop === "loseItem") {
        if (changes.itemChanges.length === 0 || !changes.itemChanges.some(c => c.action === "lose_random")) {
          throw new Error(`Expected loseItem change but got none`);
        }
      } else if (prop === "summonMonster") {
        if (!changes.worldStateChanges.monsterSummoned) {
          throw new Error(`Expected monster summoned but got none`);
        }
      }
    }
    
    console.log(`✅ ${eventKey} (${outcome})`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${eventKey} (${outcome}): ${error.message}`);
    testsFailed++;
  }
}

// Test events with gold property
console.log("Gold-based events:");
test("seductive_charm", "critical_success", { gold: true, intel: true });
test("seductive_charm", "failure", { gold: true });
test("seductive_charm", "catastrophic", { gold: true });
test("dancing_together", "catastrophic", { gold: true });
test("portal_mystery", "critical_success", { gold: true });

// Test events with intel property
console.log("\nIntel-based events:");
test("seductive_charm", "success", { intel: true });
test("riddle_sphinx", "critical_success", { intel: true });
test("whispering_shadows", "critical_success", { intel: true });
test("whispering_shadows", "success", { intel: true });
test("prophetic_vision", "critical_success", { intel: true });
test("prophetic_vision", "success", { intel: true });

// Test events with loseItem property
console.log("\nLoseItem-based events:");
test("pants_rip", "catastrophic", { loseItem: true });
test("aphrodisiac_wine", "catastrophic", { loseItem: true });

// Test events with summonMonster property
console.log("\nSummonMonster-based events:");
test("blood_ritual", "catastrophic", { summonMonster: true });

// Test events with attribute modification properties
console.log("\nAttribute modification events:");
test("reality_shift", "critical_success", {}); // chooseAttributeSwap
test("reality_shift", "success", {}); // randomAttributeBoost
test("reality_shift", "partial", {}); // randomAttributeSwap
test("reality_shift", "catastrophic", {}); // scrambleAttributes

// Test events with check modifier properties
console.log("\nCheck modifier events:");
test("time_loop", "critical_success", {}); // redoCheck
test("time_loop", "success", {}); // nextCheckBonus
test("time_loop", "failure", {}); // loseTurn

// Test events with randomDebuff property
console.log("\nRandom debuff events:");
test("reality_shift", "failure", {}); // randomDebuff

// Summary
console.log("\n" + "=".repeat(50));
console.log("📊 Test Results");
console.log("=".repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log("\n❌ Some real event tests failed!");
  process.exit(1);
} else {
  console.log("\n🎉 All real event tests passed!");
  process.exit(0);
}
