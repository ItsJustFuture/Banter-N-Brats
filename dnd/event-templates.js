"use strict";

// ===================================
// DND STORY ROOM - EVENT TEMPLATES
// ===================================
// Reuses Survival Simulator's event resolution pattern
// But with D20-based checks and narrative depth

const { getAttributeModifier } = require("./character-system");

// Event outcome tiers
const OUTCOME_TIERS = {
  CRITICAL_SUCCESS: "critical_success",
  SUCCESS: "success",
  PARTIAL: "partial",
  FAILURE: "failure",
  CATASTROPHIC: "catastrophic"
};

/**
 * Determine outcome tier from D20 roll result
 * @param {number} roll - D20 roll result
 * @param {number} dc - Difficulty Class
 * @returns {string} Outcome tier
 */
function determineOutcome(roll, dc) {
  if (roll === 20 || roll >= dc + 10) return OUTCOME_TIERS.CRITICAL_SUCCESS;
  if (roll >= dc) return OUTCOME_TIERS.SUCCESS;
  if (roll >= dc - 5) return OUTCOME_TIERS.PARTIAL;
  if (roll === 1 || roll <= dc - 10) return OUTCOME_TIERS.CATASTROPHIC;
  return OUTCOME_TIERS.FAILURE;
}

// Event type categories
const EVENT_TYPES = {
  EXPLORATION: "exploration",
  HAZARD: "hazard",
  SOCIAL: "social",
  COMBAT: "combat",
  DILEMMA: "dilemma",
  DISCOVERY: "discovery"
};

// Event templates following Survival Simulator pattern
const EVENT_TEMPLATES = {
  // === EXPLORATION EVENTS ===
  dark_corridor: {
    type: EVENT_TYPES.EXPLORATION,
    title: "Dark Corridor",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A shadowy corridor stretches ahead. {CHAR} volunteers to scout.",
      critical_success: "{CHAR} finds a hidden cache! Gains a valuable item and spots a safe path forward.",
      success: "{CHAR} navigates carefully and finds a useful item.",
      partial: "{CHAR} makes progress but triggers a minor trap. Takes 10 damage.",
      failure: "{CHAR} stumbles into a trap. Takes 20 damage.",
      catastrophic: "{CHAR} falls through a weak floor! Takes 35 damage and loses an item."
    },
    check: {
      attribute: "instinct",
      dc: 12
    },
    outcomes: {
      critical_success: { dmg: 0, loot: true, bonus: true },
      success: { dmg: 0, loot: true },
      partial: { dmg: 10, loot: false },
      failure: { dmg: 20, loot: false },
      catastrophic: { dmg: 35, loot: false, loseItem: true }
    }
  },
  
  ancient_ruins: {
    type: EVENT_TYPES.EXPLORATION,
    title: "Ancient Ruins",
    minPlayers: 2,
    maxPlayers: 30,
    text: {
      intro: "{CHAR1} and {CHAR2} explore ancient ruins filled with mystery.",
      critical_success: "They decipher ancient runes and unlock a treasure vault! Both gain valuable artifacts.",
      success: "They find scattered relics and learn about the area's history.",
      partial: "They discover clues but disturb a nest of creatures. Both take 15 damage.",
      failure: "They trigger a collapse. Both take 25 damage.",
      catastrophic: "The floor gives way! Both fall into a pit, taking 40 damage."
    },
    check: {
      attribute: "wit",
      dc: 14
    },
    outcomes: {
      critical_success: { dmg: 0, loot: 2 },
      success: { dmg: 0, loot: 1 },
      partial: { dmg: 15 },
      failure: { dmg: 25 },
      catastrophic: { dmg: 40 }
    }
  },
  
  // === ENVIRONMENTAL HAZARD EVENTS ===
  bridge_crossing: {
    type: EVENT_TYPES.HAZARD,
    title: "Rickety Bridge",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A rope bridge spans a deep chasm. {CHAR} must cross.",
      critical_success: "{CHAR} dances across with perfect balance, inspiring others!",
      success: "{CHAR} crosses safely to the other side.",
      partial: "{CHAR} slips but catches themself. Takes 10 damage from rope burn.",
      failure: "{CHAR} falls but grabs a rope. Takes 30 damage climbing back up.",
      catastrophic: "{CHAR} plummets! Takes 50 damage and is barely saved by the party."
    },
    check: {
      attribute: "finesse",
      dc: 13
    },
    outcomes: {
      critical_success: { dmg: 0, morale: 10 },
      success: { dmg: 0 },
      partial: { dmg: 10 },
      failure: { dmg: 30 },
      catastrophic: { dmg: 50 }
    }
  },
  
  poison_gas: {
    type: EVENT_TYPES.HAZARD,
    title: "Poison Gas",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "Toxic fumes fill the chamber. {CHAR} must resist!",
      critical_success: "{CHAR} holds their breath and finds the ventilation switch!",
      success: "{CHAR} covers their face and escapes with minimal exposure.",
      partial: "{CHAR} coughs and stumbles. Takes 15 damage.",
      failure: "{CHAR} inhales the gas. Takes 30 damage and is weakened.",
      catastrophic: "{CHAR} collapses from the fumes! Takes 45 damage, needs help."
    },
    check: {
      attribute: "resolve",
      dc: 14
    },
    outcomes: {
      critical_success: { dmg: 0, clearHazard: true },
      success: { dmg: 5 },
      partial: { dmg: 15 },
      failure: { dmg: 30, debuff: "weakened" },
      catastrophic: { dmg: 45, debuff: "poisoned" }
    }
  },
  
  // === SOCIAL ENCOUNTER EVENTS ===
  merchant_haggle: {
    type: EVENT_TYPES.SOCIAL,
    title: "Shrewd Merchant",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A traveling merchant offers rare goods. {CHAR} negotiates.",
      critical_success: "{CHAR} charms the merchant into giving premium items at a discount!",
      success: "{CHAR} strikes a fair deal and gets useful supplies.",
      partial: "{CHAR} pays a bit too much but gets something worthwhile.",
      failure: "{CHAR} gets scammed and walks away with junk.",
      catastrophic: "{CHAR} offends the merchant who spreads bad rumors. Party reputation suffers."
    },
    check: {
      attribute: "presence",
      dc: 13
    },
    outcomes: {
      critical_success: { loot: 2, gold: 20 },
      success: { loot: 1 },
      partial: { loot: 1, gold: -10 },
      failure: { gold: -15 },
      catastrophic: { gold: -20, debuff: "bad_reputation" }
    }
  },
  
  suspicious_stranger: {
    type: EVENT_TYPES.SOCIAL,
    title: "Suspicious Stranger",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A hooded figure approaches {CHAR} with a proposition.",
      critical_success: "{CHAR} reads their intentions perfectly and gains a valuable ally!",
      success: "{CHAR} extracts useful information before declining.",
      partial: "{CHAR} learns something but reveals too much in return.",
      failure: "{CHAR} is deceived and loses trust.",
      catastrophic: "{CHAR} is ambushed by the stranger! Takes 35 damage."
    },
    check: {
      attribute: "instinct",
      dc: 15
    },
    outcomes: {
      critical_success: { ally: true, intel: 2 },
      success: { intel: 1 },
      partial: { intel: 1, leak: true },
      failure: { leak: true },
      catastrophic: { dmg: 35, ambushed: true }
    }
  },
  
  // === COMBAT-LITE EVENTS ===
  goblin_ambush: {
    type: EVENT_TYPES.COMBAT,
    title: "Goblin Ambush",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "Goblins leap from the shadows! {CHAR} reacts first.",
      critical_success: "{CHAR} strikes with devastating precision! Goblins flee in terror.",
      success: "{CHAR} fends them off. Takes 10 damage but defeats the ambush.",
      partial: "{CHAR} struggles but survives. Takes 25 damage.",
      failure: "{CHAR} is overwhelmed. Takes 40 damage.",
      catastrophic: "{CHAR} is surrounded and badly wounded! Takes 60 damage."
    },
    check: {
      attribute: "might",
      dc: 12
    },
    outcomes: {
      critical_success: { dmg: 0, loot: 1, morale: 15 },
      success: { dmg: 10, loot: 1 },
      partial: { dmg: 25 },
      failure: { dmg: 40 },
      catastrophic: { dmg: 60, debuff: "wounded" }
    }
  },
  
  rival_duel: {
    type: EVENT_TYPES.COMBAT,
    title: "Duel with Rival",
    minPlayers: 2,
    maxPlayers: 30,
    text: {
      intro: "{CHAR1} and {CHAR2} face off in a dramatic duel!",
      critical_success: "{CHAR1} wins decisively with a spectacular move!",
      success: "{CHAR1} wins narrowly. {CHAR2} takes 20 damage.",
      partial: "A close match! Both take 15 damage from exhaustion.",
      failure: "{CHAR2} wins! {CHAR1} takes 20 damage.",
      catastrophic: "{CHAR1} loses badly and takes 35 damage."
    },
    check: {
      attribute: "finesse",
      dc: 14
    },
    outcomes: {
      critical_success: { dmg: [0, 30], winner: 0, morale: 20 },
      success: { dmg: [0, 20], winner: 0 },
      partial: { dmg: [15, 15] },
      failure: { dmg: [20, 0], winner: 1 },
      catastrophic: { dmg: [35, 0], winner: 1 }
    }
  },
  
  // === MORAL DILEMMAS ===
  cursed_artifact: {
    type: EVENT_TYPES.DILEMMA,
    title: "Cursed Artifact",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} finds a powerful but cursed artifact. Take it?",
      critical_success: "{CHAR} resists the curse entirely and claims the power!",
      success: "{CHAR} takes it cautiously, managing the curse.",
      partial: "{CHAR} takes it but suffers minor curse effects. Loses 10 HP.",
      failure: "{CHAR} is overcome by the curse. Loses 30 HP.",
      catastrophic: "{CHAR} is possessed by the artifact! Loses 50 HP and control."
    },
    check: {
      attribute: "resolve",
      dc: 16
    },
    outcomes: {
      critical_success: { dmg: 0, loot: 1, buff: "artifact_mastery" },
      success: { dmg: 0, loot: 1, debuff: "minor_curse" },
      partial: { dmg: 10, loot: 1, debuff: "cursed" },
      failure: { dmg: 30, debuff: "heavily_cursed" },
      catastrophic: { dmg: 50, debuff: "possessed" }
    }
  },
  
  innocent_plea: {
    type: EVENT_TYPES.DILEMMA,
    title: "Plea for Help",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A wounded stranger begs {CHAR} for help. Trust them?",
      critical_success: "{CHAR} helps wisely and gains a grateful ally!",
      success: "{CHAR} helps cautiously. The stranger recovers and offers thanks.",
      partial: "{CHAR} helps but it drains resources. Loses supplies.",
      failure: "{CHAR} is betrayed! The stranger was a trap. Takes 25 damage.",
      catastrophic: "{CHAR} falls for an elaborate ambush! Takes 45 damage and loses items."
    },
    check: {
      attribute: "instinct",
      dc: 14
    },
    outcomes: {
      critical_success: { ally: true, reputation: 10 },
      success: { reputation: 5 },
      partial: { loseItem: true },
      failure: { dmg: 25, ambushed: true },
      catastrophic: { dmg: 45, loseItem: 2, ambushed: true }
    }
  },
  
  // === DISCOVERY EVENTS ===
  magical_fountain: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Magical Fountain",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} discovers a glowing fountain with unknown properties.",
      critical_success: "{CHAR} drinks and gains extraordinary power! +20 HP and a blessing.",
      success: "{CHAR} drinks carefully and feels rejuvenated. Heals 25 HP.",
      partial: "{CHAR} drinks but the effects are mixed. Heals 10 HP but feels strange.",
      failure: "{CHAR} drinks and feels ill. Loses 15 HP.",
      catastrophic: "{CHAR} drinks poison! Loses 40 HP and is weakened."
    },
    check: {
      attribute: "wit",
      dc: 13
    },
    outcomes: {
      critical_success: { heal: 20, buff: "fountain_blessing" },
      success: { heal: 25 },
      partial: { heal: 10, debuff: "disoriented" },
      failure: { dmg: 15 },
      catastrophic: { dmg: 40, debuff: "poisoned" }
    }
  },
  
  hidden_library: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Hidden Library",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} uncovers a secret library filled with ancient knowledge.",
      critical_success: "{CHAR} absorbs profound wisdom! Gains permanent stat boost and rare spell.",
      success: "{CHAR} learns valuable techniques. Gains skill bonus.",
      partial: "{CHAR} skims the books. Minor knowledge gained.",
      failure: "{CHAR} can't decipher the texts. Wastes time.",
      catastrophic: "{CHAR} accidentally activates a book trap! Takes 30 damage."
    },
    check: {
      attribute: "wit",
      dc: 15
    },
    outcomes: {
      critical_success: { statBoost: "wit", loot: 1, spell: true },
      success: { skillBonus: true },
      partial: { minorKnowledge: true },
      failure: { timeWasted: true },
      catastrophic: { dmg: 30, timeWasted: true }
    }
  }
};

// Additional template variations for variety
const RANDOM_ENCOUNTERS = [
  "strange_noise",
  "mysterious_door",
  "fork_in_path",
  "campfire_remains",
  "ancient_statue",
  "underground_river",
  "beast_tracks",
  "magical_runes",
  "treasure_chest",
  "abandoned_camp"
];

module.exports = {
  EVENT_TEMPLATES,
  EVENT_TYPES,
  OUTCOME_TIERS,
  RANDOM_ENCOUNTERS,
  determineOutcome
};
