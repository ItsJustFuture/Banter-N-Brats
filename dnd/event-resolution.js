"use strict";

// ===================================
// DND STORY ROOM - EVENT RESOLUTION
// ===================================
// D20-based resolution engine
// Reuses Survival Simulator's outcome application pattern

const { getAttributeModifier, PERK_DEFINITIONS, CORE_ATTRIBUTES, ATTRIBUTE_CONFIG } = require("./character-system");
const { determineOutcome } = require("./event-templates");

// Constants
const COUPLE_BONUS = 2; // Small bonus for couples participating together
const MAX_ATTRIBUTE_VALUE = ATTRIBUTE_CONFIG.maxPerAttribute; // Maximum value for any core attribute (from ATTRIBUTE_CONFIG)

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
 * @param {Object} context - Additional context (situational modifiers, worldState, etc.)
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
  
  // Couple bonus (small bonus for couples)
  if (context.coupleBonus) {
    total += COUPLE_BONUS;
    breakdown.push({ source: "couple_synergy", value: COUPLE_BONUS });
  }
  
  // Active monster penalty (NEW: Issue #1)
  if (context.worldState && context.worldState.activeMonster) {
    const penalty = context.worldState.activeMonster.checkPenalty ?? -2;
    total += penalty;
    breakdown.push({ source: "active_monster", value: penalty });
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
 * @param {Object} context - Additional context (includes statusEffects for check modifiers)
 * @returns {Object} { roll, modifier, total, dc, outcome, breakdown, isCrit, isCritFail, usedStatusEffects }
 */
function performCheck(character, attribute, dc, rng, context = {}) {
  let roll = rollD20(rng);
  const { modifier, breakdown } = calculateModifier(character, attribute, context);
  const usedStatusEffects = [];
  
  // Check for active status effects that modify checks
  let checkBonus = 0;
  if (context.statusEffects && Array.isArray(context.statusEffects)) {
    // Look for next_check_bonus status effects
    const bonusEffect = context.statusEffects.find(
      effect => effect.type === "check_modifier" && effect.effect === "next_check_bonus"
    );
    if (bonusEffect && bonusEffect.value) {
      checkBonus = bonusEffect.value;
      breakdown.push({ source: "status_bonus", value: checkBonus });
      usedStatusEffects.push(bonusEffect.id || bonusEffect);
    }
  }
  
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
  
  // Apply check bonus from status effects
  const total = roll + modifier + checkBonus;
  const outcome = determineOutcome(roll === 1 ? 1 : (roll === 20 ? 20 : total), dc);
  
  return {
    roll,
    modifier,
    total,
    dc,
    outcome,
    breakdown,
    isCrit,
    isCritFail,
    usedStatusEffects
  };
}

/**
 * Apply event outcome to characters
 * @param {Object} template - Event template
 * @param {string} outcome - Outcome tier
 * @param {Array<Object>} characters - Characters involved
 * @param {Object} worldState - Mutable world state
 * @param {Function} rng - Seeded RNG function
 * @returns {Object} Changes made { hpChanges, itemChanges, statusChanges, attributeChanges, narrative }
 */
function applyEventOutcome(template, outcome, characters, worldState = {}, rng = Math.random) {
  const outcomeData = template.outcomes[outcome];
  if (!outcomeData) return { narrative: "Unknown outcome", hpChanges: [], attributeChanges: [] };
  
  const changes = {
    hpChanges: [],
    itemChanges: [],
    statusChanges: [],
    attributeChanges: [],
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
  
  // Apply attribute modifications (NEW: Issue #2)
  if (outcomeData.randomAttributeBoost !== undefined) {
    const boost = outcomeData.randomAttributeBoost;
    characters.forEach(char => {
      // Select a random attribute
      const randomAttr = CORE_ATTRIBUTES[Math.floor(rng() * CORE_ATTRIBUTES.length)];
      const oldValue = char[randomAttr] || 3;
      const newValue = Math.min(MAX_ATTRIBUTE_VALUE, oldValue + boost); // Cap at max
      char[randomAttr] = newValue;
      
      changes.attributeChanges.push({
        characterId: char.id,
        attribute: randomAttr,
        oldValue,
        newValue,
        change: newValue - oldValue
      });
      
      changes.statusChanges.push({
        characterId: char.id,
        type: "attribute_change",
        effect: `${randomAttr} +${newValue - oldValue}`
      });
    });
  }
  
  if (outcomeData.randomAttributeSwap) {
    characters.forEach(char => {
      // Select two random different attributes to swap
      const firstIndex = Math.floor(rng() * CORE_ATTRIBUTES.length);
      let secondIndex = Math.floor(rng() * (CORE_ATTRIBUTES.length - 1));
      if (secondIndex >= firstIndex) {
        secondIndex++;
      }
      const attr1 = CORE_ATTRIBUTES[firstIndex];
      const attr2 = CORE_ATTRIBUTES[secondIndex];
      
      const value1 = char[attr1] || 3;
      const value2 = char[attr2] || 3;
      
      // Swap the values
      char[attr1] = value2;
      char[attr2] = value1;
      
      changes.attributeChanges.push({
        characterId: char.id,
        type: "swap",
        attributes: [attr1, attr2],
        values: [value2, value1]
      });
      
      changes.statusChanges.push({
        characterId: char.id,
        type: "attribute_change",
        effect: `swapped ${attr1} ↔ ${attr2}`
      });
    });
  }
  
  if (outcomeData.scrambleAttributes) {
    characters.forEach(char => {
      // Collect current attribute values
      const values = CORE_ATTRIBUTES.map(attr => char[attr] || 3);
      
      // Shuffle the values using Fisher-Yates algorithm
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      
      // Apply shuffled values back to attributes
      const oldValues = {};
      CORE_ATTRIBUTES.forEach((attr, idx) => {
        oldValues[attr] = char[attr] || 3;
        char[attr] = values[idx];
      });
      
      changes.attributeChanges.push({
        characterId: char.id,
        type: "scramble",
        oldValues,
        newValues: CORE_ATTRIBUTES.reduce((acc, attr) => {
          acc[attr] = char[attr];
          return acc;
        }, {})
      });
      
      changes.statusChanges.push({
        characterId: char.id,
        type: "attribute_change",
        effect: "all attributes scrambled!"
      });
    });
  }
  
  if (outcomeData.chooseAttributeSwap) {
    // This is a UI-driven action, just notify via statusChanges
    characters.forEach(char => {
      changes.statusChanges.push({
        characterId: char.id,
        type: "attribute_choice",
        effect: "choose_two_attributes_to_swap",
        pendingAction: true
      });
    });
  }
  
  // Apply check modifiers (NEW: Issue #3)
  if (outcomeData.nextCheckBonus !== undefined) {
    const bonus = outcomeData.nextCheckBonus;
    characters.forEach(char => {
      changes.statusChanges.push({
        characterId: char.id,
        type: "check_modifier",
        effect: "next_check_bonus",
        value: bonus,
        expiresAfter: "next_check" // Will be consumed on next check
      });
    });
  }
  
  if (outcomeData.redoCheck) {
    characters.forEach(char => {
      changes.statusChanges.push({
        characterId: char.id,
        type: "check_modifier",
        effect: "redo_last_check",
        allowRedo: true,
        expiresAfter: "next_check"
      });
    });
  }
  
  if (outcomeData.loseTurn) {
    characters.forEach(char => {
      changes.statusChanges.push({
        characterId: char.id,
        type: "turn_skip",
        effect: "loses next turn",
        skipTurn: true,
        expiresAfter: "next_turn"
      });
    });
  }
  
  // Apply monster summoning (NEW: Issue #1)
  if (outcomeData.summonMonster) {
    const monsterName = outcomeData.monsterName || "Summoned Horror";
    worldState.activeMonster = {
      name: monsterName,
      hp: 100,
      summoned_at: Date.now(),
      checkPenalty: outcomeData.monsterPenalty ?? -2 // Applies penalty to all checks while active
    };
    changes.worldStateChanges.monsterSummoned = true;
    changes.statusChanges.push({
      type: "monster_summoned",
      effect: "A monster has been summoned!",
      monsterName: worldState.activeMonster.name
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
 * Check if two characters are a couple
 * @param {Object} char1 - First character
 * @param {Object} char2 - Second character
 * @param {Array<Object>} couplePairs - Array of couple pairs {user1_id, user2_id}
 * @returns {boolean} True if they're a couple
 */
function areCouple(char1, char2, couplePairs = []) {
  if (!char1 || !char2 || !couplePairs || couplePairs.length === 0) return false;
  
  const userId1 = char1.user_id;
  const userId2 = char2.user_id;

  if (!userId1 || !userId2) return false;
  
  return couplePairs.some(pair => 
    (pair.user1_id === userId1 && pair.user2_id === userId2) ||
    (pair.user1_id === userId2 && pair.user2_id === userId1)
  );
}

/**
 * Select a random event template based on context
 * @param {Object} templates - Event templates object
 * @param {number} aliveCount - Number of alive characters
 * @param {number} round - Current round number
 * @param {Function} rng - Seeded RNG
 * @param {Array<Object>} characters - All alive characters (to detect couples)
 * @param {Array<Object>} couplePairs - Array of couple pairs
 * @returns {Object} Selected template with key
 */
function selectEventTemplate(templates, aliveCount, round, rng, characters = [], couplePairs = []) {
  const eligible = [];
  
  // Check if there are any couples in the session
  let hasCouples = false;
  if (characters.length >= 2 && couplePairs.length > 0) {
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        if (areCouple(characters[i], characters[j], couplePairs)) {
          hasCouples = true;
          break;
        }
      }
      if (hasCouples) break;
    }
  }
  
  for (const [key, template] of Object.entries(templates)) {
    if (aliveCount >= template.minPlayers && aliveCount <= template.maxPlayers) {
      // Weight by round (more intense events later)
      let weight = round >= 5 ? 
        (template.type === "combat" || template.type === "dilemma" ? 2 : 1) : 1;
      
      // Boost weight for couple events if couples are present
      if (hasCouples && template.coupleBonus) {
        weight *= 3; // 3x more likely to select couple events
      }
      
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
  generateRandomItem,
  areCouple
};
