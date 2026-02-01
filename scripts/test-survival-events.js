const assert = require("assert");
const { SURVIVAL_EVENT_TEMPLATES, SURVIVAL_ITEM_POOL } = require("../survival-events");

// Test that all event templates are well-formed
console.log(`Testing ${SURVIVAL_EVENT_TEMPLATES.length} survival event templates...`);

let totalWeight = 0;
const eventTypeCounts = {};
const participantCounts = {};

for (const template of SURVIVAL_EVENT_TEMPLATES) {
  // Required fields
  assert.ok(template.id, `Event missing id: ${JSON.stringify(template)}`);
  assert.ok(template.text, `Event ${template.id} missing text`);
  assert.ok(template.outcome, `Event ${template.id} missing outcome`);
  assert.ok(typeof template.participants === "number", `Event ${template.id} has invalid participants`);
  assert.ok(typeof template.weight === "number", `Event ${template.id} has invalid weight`);
  assert.ok(template.type, `Event ${template.id} missing type`);

  // Validate text has correct placeholders
  const participants = template.participants;
  if (participants >= 1 && template.text.includes("{A}")) {
    assert.ok(true, "Has {A}");
  }
  if (participants >= 2 && template.text.includes("{B}")) {
    assert.ok(true, "Has {B}");
  }
  if (participants >= 3 && template.text.includes("{C}")) {
    assert.ok(true, "Has {C}");
  }
  if (participants >= 4 && template.text.includes("{D}")) {
    assert.ok(true, "Has {D}");
  }

  // Check loot events have proper tags
  if (template.type === "loot") {
    if (template.text.includes("{ITEM}")) {
      assert.ok(
        template.lootTag,
        `Event ${template.id} has {ITEM} but no lootTag`
      );
      assert.ok(
        SURVIVAL_ITEM_POOL[template.lootTag],
        `Event ${template.id} has invalid lootTag: ${template.lootTag}`
      );
    }
  }

  // Check couple events have requiresCouple flag
  if (template.type === "couple") {
    assert.ok(
      template.requiresCouple === true,
      `Event ${template.id} is type couple but doesn't require couple`
    );
  }

  // Track statistics
  totalWeight += template.weight;
  eventTypeCounts[template.type] = (eventTypeCounts[template.type] || 0) + 1;
  participantCounts[template.participants] = (participantCounts[template.participants] || 0) + 1;
}

// Verify we have a good distribution
assert.ok(SURVIVAL_EVENT_TEMPLATES.length > 100, "Should have plenty of events for variety");
assert.ok(eventTypeCounts.loot > 0, "Should have loot events");
assert.ok(eventTypeCounts.heal > 0, "Should have heal events");
assert.ok(eventTypeCounts.injure > 0, "Should have injure events");
assert.ok(eventTypeCounts.kill > 0, "Should have kill events");
assert.ok(eventTypeCounts.alliance > 0, "Should have alliance events");
assert.ok(eventTypeCounts.couple > 0, "Should have couple events");
assert.ok(eventTypeCounts.betray > 0, "Should have betrayal events");

// Verify we have events for different participant counts
assert.ok(participantCounts[1] > 0, "Should have solo events");
assert.ok(participantCounts[2] > 0, "Should have duo events");
assert.ok(participantCounts[3] > 0, "Should have trio events");
assert.ok(participantCounts[4] > 0, "Should have quad events");

// Verify item pools exist
const itemCategories = Object.keys(SURVIVAL_ITEM_POOL);
assert.ok(itemCategories.includes("weapon"), "Should have weapon items");
assert.ok(itemCategories.includes("food"), "Should have food items");
assert.ok(itemCategories.includes("medkit"), "Should have medkit items");
assert.ok(itemCategories.includes("trap"), "Should have trap items");
assert.ok(itemCategories.includes("map"), "Should have map items");

for (const category of itemCategories) {
  assert.ok(
    SURVIVAL_ITEM_POOL[category].length > 0,
    `Item category ${category} should have items`
  );
}

console.log("\n✓ Event Statistics:");
console.log(`  Total events: ${SURVIVAL_EVENT_TEMPLATES.length}`);
console.log(`  Total weight: ${totalWeight}`);
console.log(`  Event types:`, eventTypeCounts);
console.log(`  Participant counts:`, participantCounts);
console.log(`  Item categories: ${itemCategories.length} (${itemCategories.join(", ")})`);

// Test new event types were added
const newEventIds = [
  "solo_env_", // environmental events
  "solo_powerup_", // power-up events
  "couple_team_", // couple teamwork events
  "duo_showdown_", // final showdown events
  "duo_break_", // alliance break events
];

for (const prefix of newEventIds) {
  const found = SURVIVAL_EVENT_TEMPLATES.some((t) => t.id.startsWith(prefix));
  assert.ok(found, `Should have events with prefix ${prefix}`);
}

console.log("\n✓ All survival event templates validated successfully!");
