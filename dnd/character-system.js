"use strict";

// ===================================
// DND STORY ROOM - CHARACTER SYSTEM
// ===================================
// CORE attribute system (NOT SPECIAL)
// - MIGHT: physical force, endurance, raw damage
// - FINESSE: speed, dexterity, stealth, precision
// - WIT: reasoning, memory, magical logic, problem solving
// - INSTINCT: perception, awareness, danger sense
// - PRESENCE: leadership, persuasion, intimidation
// - RESOLVE: mental toughness, willpower, resistance
// - CHAOS: unpredictability, luck, critical swings

const CORE_ATTRIBUTES = [
  "might",
  "finesse",
  "wit",
  "instinct",
  "presence",
  "resolve",
  "chaos"
];

const ATTRIBUTE_CONFIG = {
  totalPoints: 28,
  minPerAttribute: 1,
  maxPerAttribute: 7,
  startingHP: 100,
  maxHP: 100
};

// Skills tied to CORE attributes
const SKILL_DEFINITIONS = {
  // Might-based
  warrior: {
    name: "Warrior",
    description: "Expert in physical combat and endurance",
    primaryAttribute: "might",
    bonuses: { might: 2, hp: 10 },
    unlocks: ["power_strike", "fortify"]
  },
  brawler: {
    name: "Brawler",
    description: "Unarmed combat specialist with raw strength",
    primaryAttribute: "might",
    bonuses: { might: 1, resolve: 1 },
    unlocks: ["knockout_punch", "intimidate"]
  },
  
  // Finesse-based
  rogue: {
    name: "Rogue",
    description: "Stealthy and precise, masters of surprise",
    primaryAttribute: "finesse",
    bonuses: { finesse: 2 },
    unlocks: ["sneak_attack", "dodge"]
  },
  ranger: {
    name: "Ranger",
    description: "Agile tracker and survivalist",
    primaryAttribute: "finesse",
    bonuses: { finesse: 1, instinct: 1 },
    unlocks: ["track", "quick_shot"]
  },
  
  // Wit-based
  mage: {
    name: "Mage",
    description: "Wields arcane knowledge and magical power",
    primaryAttribute: "wit",
    bonuses: { wit: 2, resolve: 1 },
    unlocks: ["arcane_blast", "spell_shield"]
  },
  scholar: {
    name: "Scholar",
    description: "Vast knowledge reveals hidden solutions",
    primaryAttribute: "wit",
    bonuses: { wit: 2 },
    unlocks: ["analyze", "recall_lore"]
  },
  
  // Instinct-based
  scout: {
    name: "Scout",
    description: "Alert and perceptive, always aware",
    primaryAttribute: "instinct",
    bonuses: { instinct: 2 },
    unlocks: ["danger_sense", "spot_weakness"]
  },
  hunter: {
    name: "Hunter",
    description: "Tracks prey with unmatched awareness",
    primaryAttribute: "instinct",
    bonuses: { instinct: 1, finesse: 1 },
    unlocks: ["ambush", "track_prey"]
  },
  
  // Presence-based
  leader: {
    name: "Leader",
    description: "Inspires and commands others",
    primaryAttribute: "presence",
    bonuses: { presence: 2 },
    unlocks: ["rally", "command"]
  },
  diplomat: {
    name: "Diplomat",
    description: "Master of words and negotiation",
    primaryAttribute: "presence",
    bonuses: { presence: 1, wit: 1 },
    unlocks: ["persuade", "deception"]
  },
  
  // Resolve-based
  cleric: {
    name: "Cleric",
    description: "Divine power and unwavering faith",
    primaryAttribute: "resolve",
    bonuses: { resolve: 2, hp: 5 },
    unlocks: ["heal", "divine_protection"]
  },
  paladin: {
    name: "Paladin",
    description: "Holy warrior with unbreakable will",
    primaryAttribute: "resolve",
    bonuses: { resolve: 1, might: 1 },
    unlocks: ["smite", "aura_of_protection"]
  },
  
  // Chaos-based
  wildcard: {
    name: "Wildcard",
    description: "Unpredictable and lucky beyond reason",
    primaryAttribute: "chaos",
    bonuses: { chaos: 3 },
    unlocks: ["lucky_break", "chaos_surge"]
  },
  gambler: {
    name: "Gambler",
    description: "Risk-taker who bets it all",
    primaryAttribute: "chaos",
    bonuses: { chaos: 2 },
    unlocks: ["double_or_nothing", "risk_reward"]
  },
  
  // Multi-attribute hybrids
  spellblade: {
    name: "Spellblade",
    description: "Blends magic and martial prowess",
    primaryAttribute: "might",
    secondaryAttribute: "wit",
    bonuses: { might: 1, wit: 1 },
    unlocks: ["enchanted_strike", "arcane_defense"]
  },
  trickster: {
    name: "Trickster",
    description: "Cunning manipulator and deceiver",
    primaryAttribute: "finesse",
    secondaryAttribute: "presence",
    bonuses: { finesse: 1, presence: 1 },
    unlocks: ["misdirect", "charm"]
  }
};

// Perks - passive or conditional modifiers
const PERK_DEFINITIONS = {
  // Combat perks
  critical_eye: {
    name: "Critical Eye",
    description: "Critical successes on 19-20 instead of just 20",
    effect: "critRange",
    value: 2
  },
  lucky_dodge: {
    name: "Lucky Dodge",
    description: "Reroll one failed defense per session",
    effect: "reroll",
    uses: 1
  },
  iron_will: {
    name: "Iron Will",
    description: "+2 to all Resolve checks",
    effect: "attributeBonus",
    attribute: "resolve",
    value: 2
  },
  
  // Survival perks
  second_wind: {
    name: "Second Wind",
    description: "Heal 20 HP once when below 30 HP",
    effect: "autoHeal",
    threshold: 30,
    amount: 20,
    uses: 1
  },
  quick_reflexes: {
    name: "Quick Reflexes",
    description: "+2 to all Finesse checks",
    effect: "attributeBonus",
    attribute: "finesse",
    value: 2
  },
  
  // Social perks
  silver_tongue: {
    name: "Silver Tongue",
    description: "+2 to all Presence checks",
    effect: "attributeBonus",
    attribute: "presence",
    value: 2
  },
  intimidating: {
    name: "Intimidating",
    description: "Enemies less likely to target you",
    effect: "targetingWeight",
    value: 0.7
  },
  
  // Luck perks
  fate_touched: {
    name: "Fate Touched",
    description: "Add +3 to one roll per round",
    effect: "fateBonus",
    value: 3,
    uses: 1
  },
  chaos_magnet: {
    name: "Chaos Magnet",
    description: "Extreme outcomes (crit success or crit fail) more likely",
    effect: "chaosMultiplier",
    value: 1.5
  }
};

/**
 * Validate character attributes
 * @param {Object} attributes - CORE attributes object
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateAttributes(attributes) {
  if (!attributes || typeof attributes !== "object") {
    return { valid: false, error: "Attributes must be an object" };
  }
  
  // Check all required attributes exist
  for (const attr of CORE_ATTRIBUTES) {
    if (!(attr in attributes)) {
      return { valid: false, error: `Missing attribute: ${attr}` };
    }
    
    const val = attributes[attr];
    if (!Number.isInteger(val)) {
      return { valid: false, error: `Attribute ${attr} must be an integer` };
    }
    
    if (val < ATTRIBUTE_CONFIG.minPerAttribute) {
      return { valid: false, error: `Attribute ${attr} below minimum (${ATTRIBUTE_CONFIG.minPerAttribute})` };
    }
    
    if (val > ATTRIBUTE_CONFIG.maxPerAttribute) {
      return { valid: false, error: `Attribute ${attr} above maximum (${ATTRIBUTE_CONFIG.maxPerAttribute})` };
    }
  }
  
  // Check total points
  const total = CORE_ATTRIBUTES.reduce((sum, attr) => sum + attributes[attr], 0);
  if (total !== ATTRIBUTE_CONFIG.totalPoints) {
    return { valid: false, error: `Total points must equal ${ATTRIBUTE_CONFIG.totalPoints}, got ${total}` };
  }
  
  return { valid: true };
}

/**
 * Validate character skills
 * @param {Array<string>} skills - Array of skill IDs
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateSkills(skills) {
  if (!Array.isArray(skills)) {
    return { valid: false, error: "Skills must be an array" };
  }
  
  if (skills.length < 3 || skills.length > 6) {
    return { valid: false, error: "Must select 3-6 skills" };
  }
  
  // Check all skills exist
  for (const skillId of skills) {
    if (!SKILL_DEFINITIONS[skillId]) {
      return { valid: false, error: `Unknown skill: ${skillId}` };
    }
  }
  
  // Check for duplicates
  const uniqueSkills = new Set(skills);
  if (uniqueSkills.size !== skills.length) {
    return { valid: false, error: "Duplicate skills not allowed" };
  }
  
  return { valid: true };
}

/**
 * Validate character perks
 * @param {Array<string>} perks - Array of perk IDs
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePerks(perks) {
  if (!Array.isArray(perks)) {
    return { valid: false, error: "Perks must be an array" };
  }
  
  if (perks.length > 3) {
    return { valid: false, error: "Maximum 3 perks allowed" };
  }
  
  // Check all perks exist
  for (const perkId of perks) {
    if (!PERK_DEFINITIONS[perkId]) {
      return { valid: false, error: `Unknown perk: ${perkId}` };
    }
  }
  
  // Check for duplicates
  const uniquePerks = new Set(perks);
  if (uniquePerks.size !== perks.length) {
    return { valid: false, error: "Duplicate perks not allowed" };
  }
  
  return { valid: true };
}

/**
 * Apply skill bonuses to character attributes
 * @param {Object} baseAttributes - Base CORE attributes
 * @param {Array<string>} skills - Selected skill IDs
 * @returns {Object} Modified attributes with skill bonuses
 */
function applySkillBonuses(baseAttributes, skills) {
  const modified = { ...baseAttributes };
  let hpBonus = 0;
  
  for (const skillId of skills) {
    const skill = SKILL_DEFINITIONS[skillId];
    if (!skill) continue;
    
    for (const [attr, bonus] of Object.entries(skill.bonuses)) {
      if (attr === "hp") {
        hpBonus += bonus;
      } else if (CORE_ATTRIBUTES.includes(attr)) {
        const newValue = (modified[attr] || 0) + bonus;
        const clampedValue = Math.max(
          ATTRIBUTE_CONFIG.minPerAttribute,
          Math.min(ATTRIBUTE_CONFIG.maxPerAttribute, newValue)
        );
        modified[attr] = clampedValue;
      }
    }
  }
  
  return { attributes: modified, hpBonus };
}

/**
 * Get attribute modifier for D20 rolls
 * @param {number} attributeValue - Attribute value (1-7)
 * @returns {number} Modifier to add to rolls (-3 to +3)
 */
function getAttributeModifier(attributeValue) {
  // Conversion: 1->-3, 2->-2, 3->-1, 4->0, 5->+1, 6->+2, 7->+3
  return attributeValue - 4;
}

module.exports = {
  CORE_ATTRIBUTES,
  ATTRIBUTE_CONFIG,
  SKILL_DEFINITIONS,
  PERK_DEFINITIONS,
  validateAttributes,
  validateSkills,
  validatePerks,
  applySkillBonuses,
  getAttributeModifier
};
