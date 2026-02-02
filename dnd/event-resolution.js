"use strict";

// ===================================
// DND STORY ROOM - EVENT RESOLUTION
// ===================================
// D20-based resolution engine
// Reuses Survival Simulator's outcome application pattern

const { getAttributeModifier, PERK_DEFINITIONS } = require("./character-system");
const { determineOutcome, OUTCOME_TIERS } = require("./event-templates");

/**
 * Roll a D20 with modifiers
 * @param {Function} rng - Seeded RNG function (0-1)
 * @returns {number} D20 result (1-20)
 */
function rollD20(rng) {
  return Math.floor(rng() * 20) + 1;
}

/**
 * Calculate total modifier for a check
 * @param {Object} character - Character object with attributes, skills, perks
 * @param {string} attribute - Attribute being checked
 * @param {Object} context - Additional context (situational modifiers, etc.)
 * @returns {Object} { modifier, breakdown }
 */
function calculateModifier(character, attribute, context = {}) {
  const breakdown = [];
  let total = 0;
  
  // Base attribute modifier
  const attrValue = character[attribute] || 3;
  const attrMod = getAttributeModifier(attrValue);
  total += attrMod;
  breakdown.push({ source: attribute, value: attrMod });
  
  // Skill bonuses
  const skills = character.skills_json ? JSON.parse(character.skills_json) : [];
  // For now, simple +1 per relevant skill (can be more sophisticated)
  const relevantSkillBonus = skills.length > 0 ? Math.floor(skills.length / 2) : 0;
  if (relevantSkillBonus > 0) {
    total += relevantSkillBonus;
    breakdown.push({ source: "skills", value: relevantSkillBonus });
  }
  
  // Perk bonuses
  const perks = character.perks_json ? JSON.parse(character.perks_json) : [];
  for (const perkId of perks) {
    const perk = PERK_DEFINITIONS[perkId];
    if (perk && perk.effect === "attributeBonus" && perk.attribute === attribute) {
      total += perk.value;
      breakdown.push({ source: perk.name, value: perk.value });
    }
  }
  
  // Situational modifiers from context
  if (context.situational) {
    total += context.situational;
    breakdown.push({ source: "situational", value: context.situational });
  }
  
  // Chaos attribute affects extreme outcomes
  const chaos = character.chaos || 3;
  if (chaos >= 6) {
    breakdown.push({ source: "high_chaos", value: "extreme outcomes more likely" });
  }
  
  return { modifier: total, breakdown };
}

/**
 * Perform a D20 check
 * @param {Object} character - Character performing the check
 * @param {string} attribute - Attribute to check
 * @param {number} dc - Difficulty Class
 * @param {Function} rng - Seeded RNG function
 * @param {Object} context - Additional context
 * @returns {Object} { roll, modifier, total, dc, outcome, breakdown, isCrit, isCritFail }
 */
function performCheck(character, attribute, dc, rng, context = {}) {
  let roll = rollD20(rng);
  const { modifier, breakdown } = calculateModifier(character, attribute, context);
  
  // Check for critical range expansion (perk)
  const perks = character.perks_json ? JSON.parse(character.perks_json) : [];
  let critRange = 20;
  for (const perkId of perks) {
    const perk = PERK_DEFINITIONS[perkId];
    if (perk && perk.effect === "critRange") {
      critRange = 21 - perk.value; // e.g., value:2 means crit on 19-20
      break;
    }
  }
  
  const isCrit = roll >= critRange;
  const isCritFail = roll === 1;
  
  // Chaos affects criticals
  const chaos = character.chaos || 3;
  if (chaos >= 6 && (isCrit || isCritFail)) {
    // High chaos characters have more extreme outcomes
    if (isCrit) roll = 20; // Max out crits
    if (isCritFail) roll = 1; // Min out fails
  }
  
  const total = roll + modifier;
  const outcome = determineOutcome(roll === 1 ? 1 : (roll === 20 ? 20 : total), dc);
  
  return {
    roll,
    modifier,
    total,
    dc,
    outcome,
    breakdown,
    isCrit,
    isCritFail
  };
}

/**
 * Apply event outcome to characters
 * @param {Object} template - Event template
 * @param {string} outcome - Outcome tier
 * @param {Array<Object>} characters - Characters involved
 * @param {Object} worldState - Mutable world state
 * @param {Function} rng - Seeded RNG function
 * @returns {Object} Changes made { hpChanges, itemChanges, statusChanges, narrative }
 */
function applyEventOutcome(template, outcome, characters, worldState = {}, rng = Math.random) {
  const outcomeData = template.outcomes[outcome];
  if (!outcomeData) return { narrative: "Unknown outcome", hpChanges: [] };
  
  const changes = {
    hpChanges: [],
    itemChanges: [],
    statusChanges: [],
    worldStateChanges: {},
    narrative: template.text[outcome] || "Something happened."
  };
  
  // Apply damage/healing
  if (outcomeData.dmg !== undefined) {
    if (Array.isArray(outcomeData.dmg)) {
      // Multiple characters
      characters.forEach((char, idx) => {
        if (idx < outcomeData.dmg.length) {
          const dmg = outcomeData.dmg[idx];
          char.hp = Math.max(0, Math.min(char.max_hp, char.hp - dmg));
          changes.hpChanges.push({ characterId: char.id, change: -dmg, newHp: char.hp });
          if (char.hp === 0) char.alive = false;
        }
      });
    } else {
      // Single character
      const dmg = outcomeData.dmg;
      characters.forEach(char => {
        char.hp = Math.max(0, Math.min(char.max_hp, char.hp - dmg));
        changes.hpChanges.push({ characterId: char.id, change: -dmg, newHp: char.hp });
        if (char.hp === 0) char.alive = false;
      });
    }
  }
  
  if (outcomeData.heal !== undefined) {
    const heal = outcomeData.heal;
    characters.forEach(char => {
      const oldHp = char.hp;
      char.hp = Math.min(char.max_hp, char.hp + heal);
      changes.hpChanges.push({ characterId: char.id, change: char.hp - oldHp, newHp: char.hp });
    });
  }
  
  // Apply loot
  if (outcomeData.loot) {
    const lootCount = typeof outcomeData.loot === "number" ? outcomeData.loot : 1;
    for (let i = 0; i < lootCount; i++) {
      changes.itemChanges.push({
        characterId: characters[0]?.id,
        action: "gain",
        item: generateRandomItem(rng)
      });
    }
  }
  
  // Apply status effects (buffs/debuffs)
  if (outcomeData.buff) {
    characters.forEach(char => {
      changes.statusChanges.push({
        characterId: char.id,
        type: "buff",
        effect: outcomeData.buff
      });
    });
  }
  
  if (outcomeData.debuff) {
    characters.forEach(char => {
      changes.statusChanges.push({
        characterId: char.id,
        type: "debuff",
        effect: outcomeData.debuff
      });
    });
  }
  
  // Apply morale changes to world state
  if (outcomeData.morale) {
    worldState.morale = (worldState.morale || 50) + outcomeData.morale;
    changes.worldStateChanges.morale = worldState.morale;
  }
  
  // Reputation changes
  if (outcomeData.reputation) {
    worldState.reputation = (worldState.reputation || 0) + outcomeData.reputation;
    changes.worldStateChanges.reputation = worldState.reputation;
  }
  
  // Handle allies
  if (outcomeData.ally) {
    worldState.allies = worldState.allies || [];
    worldState.allies.push({ name: "Mysterious Ally", gained_at: Date.now() });
    changes.worldStateChanges.allyGained = true;
  }
  
  return changes;
}

/**
 * Generate a random item for loot
 * @param {Function} rng - Seeded RNG function
 * @returns {string} Item name
 */
function generateRandomItem(rng = Math.random) {
  const items = [
    "Health Potion",
    "Mana Potion",
    "Ancient Scroll",
    "Magic Dagger",
    "Shield Charm",
    "Rope",
    "Torch",
    "Rations",
    "Gold Coins",
    "Mysterious Key",
    "Enchanted Ring",
    "Lucky Coin",
    "Map Fragment",
    "Healing Herb",
    "Smoke Bomb"
  ];
  return items[Math.floor(rng() * items.length)];
}

/**
 * Select a random event template based on context
 * @param {Object} templates - Event templates object
 * @param {number} aliveCount - Number of alive characters
 * @param {number} round - Current round number
 * @param {Function} rng - Seeded RNG
 * @returns {Object} Selected template with key
 */
function selectEventTemplate(templates, aliveCount, round, rng) {
  const eligible = [];
  
  for (const [key, template] of Object.entries(templates)) {
    if (aliveCount >= template.minPlayers && aliveCount <= template.maxPlayers) {
      // Weight by round (more intense events later)
      const weight = round >= 5 ? 
        (template.type === "combat" || template.type === "dilemma" ? 2 : 1) : 1;
      
      for (let i = 0; i < weight; i++) {
        eligible.push({ key, template });
      }
    }
  }
  
  if (eligible.length === 0) {
    // Fallback
    return { key: "dark_corridor", template: templates.dark_corridor };
  }
  
  const idx = Math.floor(rng() * eligible.length);
  return eligible[idx];
}

/**
 * Format narrative text with character names
 * @param {string} text - Template text with {CHAR}, {CHAR1}, etc.
 * @param {Array<Object>} characters - Characters involved
 * @returns {string} Formatted text
 */
function formatNarrative(text, characters) {
  let formatted = text;
  
  characters.forEach((char, idx) => {
    if (idx === 0) {
      // First character: {CHAR} or {CHAR1}
      formatted = formatted.replace(/{CHAR1}/g, char.display_name);
      formatted = formatted.replace(/{CHAR}/g, char.display_name);
    } else {
      // Subsequent characters: {CHAR2}, {CHAR3}, etc.
      const placeholder = `{CHAR${idx + 1}}`;
      formatted = formatted.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), "g"), char.display_name);
    }
  });
  
  // Handle {A}, {B} variants (legacy from survival)
  if (characters.length > 0) {
    formatted = formatted.replace(/{A}/g, characters[0].display_name);
  }
  if (characters.length > 1) {
    formatted = formatted.replace(/{B}/g, characters[1].display_name);
  }
  
  return formatted;
}

module.exports = {
  rollD20,
  calculateModifier,
  performCheck,
  applyEventOutcome,
  selectEventTemplate,
  formatNarrative,
  generateRandomItem
};
