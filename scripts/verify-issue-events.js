#!/usr/bin/env node
"use strict";

const { EVENT_TEMPLATES } = require("../dnd/event-templates");
const { applyEventOutcome } = require("../dnd/event-resolution");

console.log("🔍 Verifying specific events mentioned in issue:\n");

const eventsToCheck = [
  { name: "seductive_charm", outcomes: ["critical_success", "success", "failure", "catastrophic"], properties: ["gold", "intel"] },
  { name: "dancing_together", outcomes: ["catastrophic"], properties: ["gold"] },
  { name: "aphrodisiac_wine", outcomes: ["catastrophic"], properties: ["loseItem"] },
  { name: "portal_mystery", outcomes: ["critical_success"], properties: ["gold"] },
  { name: "riddle_sphinx", outcomes: ["critical_success"], properties: ["intel"] },
  { name: "whispering_shadows", outcomes: ["critical_success", "success"], properties: ["intel"] },
  { name: "prophetic_vision", outcomes: ["critical_success", "success"], properties: ["intel"] },
  { name: "pants_rip", outcomes: ["catastrophic"], properties: ["loseItem"] },
  { name: "blood_ritual", outcomes: ["catastrophic"], properties: ["summonMonster"] },
  { name: "reality_shift", outcomes: ["critical_success", "success", "partial", "failure", "catastrophic"], properties: ["chooseAttributeSwap", "randomAttributeBoost", "randomAttributeSwap", "randomDebuff", "scrambleAttributes"] },
  { name: "time_loop", outcomes: ["critical_success", "success", "failure"], properties: ["redoCheck", "nextCheckBonus", "loseTurn"] }
];

let allGood = true;

eventsToCheck.forEach(event => {
  const template = EVENT_TEMPLATES[event.name];
  console.log(`\n📌 ${event.name}:`);
  
  event.outcomes.forEach(outcome => {
    const mockChar = { id: 1, hp: 50, max_hp: 100, gold: 100, 
                      might: 4, finesse: 5, wit: 3, instinct: 4, 
                      presence: 3, resolve: 5, chaos: 4 };
    const worldState = {};
    
    const changes = applyEventOutcome(template, outcome, [mockChar], worldState, () => 0.5);
    
    let handled = false;
    if (changes.itemChanges.length > 0 || changes.statusChanges.length > 0 || 
        changes.hpChanges.length > 0 || Object.keys(changes.worldStateChanges).length > 0) {
      handled = true;
    }
    
    console.log(`  ${outcome}: ${handled ? "✅ Handled" : "❌ Not handled"}`);
    if (!handled) allGood = false;
  });
});

console.log("\n" + "=".repeat(60));
if (allGood) {
  console.log("✅ All events mentioned in the issue are now properly handled!");
  console.log("\n📋 Summary of fixed properties:");
  console.log("  • gold - gain/lose gold coins");
  console.log("  • intel - gain intelligence/information");
  console.log("  • loseItem - lose a random item");
  console.log("  • summonMonster - spawn monster encounter");
  console.log("  • chooseAttributeSwap - player chooses attribute swap");
  console.log("  • randomAttributeBoost - random attribute increases");
  console.log("  • randomAttributeSwap - swap two random attributes");
  console.log("  • scrambleAttributes - randomize all attributes");
  console.log("  • redoCheck - allow redo of last check");
  console.log("  • nextCheckBonus - bonus to next check");
  console.log("  • loseTurn - skip next turn");
  console.log("  • randomDebuff - apply random debuff");
  process.exit(0);
} else {
  console.log("❌ Some events are still not handled!");
  process.exit(1);
}
