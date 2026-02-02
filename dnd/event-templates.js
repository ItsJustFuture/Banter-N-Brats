"use strict";

// ===================================
// DND STORY ROOM - EVENT TEMPLATES
// ===================================
// Reuses Survival Simulator's event resolution pattern
// But with D20-based checks and narrative depth

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
  },
  
  // === FUNNY/COMEDIC EVENTS ===
  mimic_mishap: {
    type: EVENT_TYPES.EXPLORATION,
    title: "Mimic Mishap",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} spots what appears to be a treasure chest...",
      critical_success: "{CHAR} recognizes the mimic immediately and tames it as a pet! Gains a loyal companion.",
      success: "{CHAR} realizes it's a mimic and carefully avoids it. Smart move!",
      partial: "{CHAR} gets bitten but manages to escape! Takes 15 damage and loses dignity.",
      failure: "{CHAR} opens the chest and gets chomped! Takes 30 damage and screams comically.",
      catastrophic: "{CHAR} is fully swallowed by the mimic! Takes 50 damage and needs rescuing while muffled screaming echoes."
    },
    check: {
      attribute: "instinct",
      dc: 13
    },
    outcomes: {
      critical_success: { dmg: 0, ally: true, morale: 15 },
      success: { dmg: 0, morale: 5 },
      partial: { dmg: 15 },
      failure: { dmg: 30 },
      catastrophic: { dmg: 50, debuff: "embarrassed" }
    }
  },
  
  slippery_floor: {
    type: EVENT_TYPES.HAZARD,
    title: "Banana Peel Trap",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "Someone left banana peels all over the floor. {CHAR} attempts to cross...",
      critical_success: "{CHAR} performs an amazing acrobatic display while crossing! Everyone applauds.",
      success: "{CHAR} carefully steps around the peels without incident.",
      partial: "{CHAR} slips but catches themself. Takes 5 damage to pride.",
      failure: "{CHAR} goes down hard in a cartoonish tumble! Takes 20 damage and the party can't stop laughing.",
      catastrophic: "{CHAR} triggers a chain reaction! Everyone nearby slips. Takes 35 damage in the chaos."
    },
    check: {
      attribute: "finesse",
      dc: 12
    },
    outcomes: {
      critical_success: { dmg: 0, morale: 20 },
      success: { dmg: 0 },
      partial: { dmg: 5 },
      failure: { dmg: 20, morale: -10 },
      catastrophic: { dmg: 35 }
    }
  },
  
  cursed_joke_book: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Cursed Joke Book",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} finds an ancient book of jokes and decides to read one aloud...",
      critical_success: "The joke is so good everyone's morale soars! {CHAR} becomes the life of the party.",
      success: "It's mildly amusing. The party chuckles politely.",
      partial: "The joke falls flat. Awkward silence fills the air.",
      failure: "The joke is so bad it hurts. Everyone takes 10 psychic damage from secondhand embarrassment.",
      catastrophic: "The joke is cursed! {CHAR} can't stop telling terrible puns. Takes 25 damage and can't speak normally for a while."
    },
    check: {
      attribute: "presence",
      dc: 14
    },
    outcomes: {
      critical_success: { dmg: 0, morale: 25 },
      success: { morale: 10 },
      partial: { morale: -5 },
      failure: { dmg: 10, morale: -15 },
      catastrophic: { dmg: 25, debuff: "cursed_comedian" }
    }
  },
  
  pants_rip: {
    type: EVENT_TYPES.SOCIAL,
    title: "Wardrobe Malfunction",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} bends down to pick something up and... *RIIIP*",
      critical_success: "{CHAR} quickly fashions the tear into a stylish new look! Gains confidence.",
      success: "{CHAR} patches it up discreetly. Crisis averted.",
      partial: "{CHAR} is embarrassed but laughs it off. Minor ego damage.",
      failure: "{CHAR} is mortified! Loses 15 HP from pure embarrassment.",
      catastrophic: "{CHAR}'s entire outfit falls apart! Takes 30 damage from extreme embarrassment and needs new clothes."
    },
    check: {
      attribute: "finesse",
      dc: 13
    },
    outcomes: {
      critical_success: { dmg: 0, buff: "stylish" },
      success: { dmg: 0 },
      partial: { dmg: 5 },
      failure: { dmg: 15, debuff: "embarrassed" },
      catastrophic: { dmg: 30, debuff: "exposed", loseItem: true }
    }
  },
  
  // === ROMANTIC EVENTS ===
  starlit_moment: {
    type: EVENT_TYPES.SOCIAL,
    title: "Under the Stars",
    minPlayers: 2,
    maxPlayers: 30,
    coupleBonus: true,
    text: {
      intro: "{CHAR1} and {CHAR2} find themselves alone under a beautiful starlit sky...",
      critical_success: "They share a perfect moment together. Both heal 30 HP and gain a protective bond.",
      success: "They have a heartfelt conversation. Both heal 20 HP and feel closer.",
      partial: "It's nice but slightly awkward. Both heal 10 HP.",
      failure: "The mood is ruined by mosquitoes. Both take 10 damage from bites.",
      catastrophic: "A monster attacks during their moment! Both take 35 damage."
    },
    check: {
      attribute: "presence",
      dc: 13
    },
    outcomes: {
      critical_success: { heal: 30, buff: "protective_bond" },
      success: { heal: 20 },
      partial: { heal: 10 },
      failure: { dmg: 10 },
      catastrophic: { dmg: 35 }
    }
  },
  
  love_letter: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Secret Admirer",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} discovers a love letter addressed to them...",
      critical_success: "{CHAR} is touched and gains confidence! Heals 25 HP and gets +2 to Presence.",
      success: "{CHAR} feels flattered. Heals 15 HP.",
      partial: "{CHAR} isn't sure how to feel. Heals 5 HP but feels confused.",
      failure: "{CHAR} realizes it's meant for someone else. Takes 15 damage from disappointment.",
      catastrophic: "{CHAR} discovers it's a trap from an enemy! Takes 30 damage and loses trust."
    },
    check: {
      attribute: "instinct",
      dc: 12
    },
    outcomes: {
      critical_success: { heal: 25, buff: "confident" },
      success: { heal: 15 },
      partial: { heal: 5, debuff: "confused" },
      failure: { dmg: 15 },
      catastrophic: { dmg: 30, debuff: "betrayed" }
    }
  },
  
  dancing_together: {
    type: EVENT_TYPES.SOCIAL,
    title: "Tavern Dance",
    minPlayers: 2,
    maxPlayers: 30,
    coupleBonus: true,
    text: {
      intro: "Music fills the tavern. {CHAR1} asks {CHAR2} to dance...",
      critical_success: "They dance beautifully together! Both heal 25 HP and the crowd cheers.",
      success: "They have a lovely dance. Both heal 15 HP.",
      partial: "They step on each other's feet a bit. Both heal 5 HP.",
      failure: "They collide awkwardly. Both take 10 damage.",
      catastrophic: "They crash into a table! Both take 25 damage and break dishes."
    },
    check: {
      attribute: "finesse",
      dc: 13
    },
    outcomes: {
      critical_success: { heal: 25, morale: 20 },
      success: { heal: 15, morale: 10 },
      partial: { heal: 5 },
      failure: { dmg: 10 },
      catastrophic: { dmg: 25, gold: -20 }
    }
  },
  
  shared_blanket: {
    type: EVENT_TYPES.SOCIAL,
    title: "Cold Night",
    minPlayers: 2,
    maxPlayers: 30,
    coupleBonus: true,
    text: {
      intro: "The night is freezing. {CHAR1} and {CHAR2} huddle together for warmth...",
      critical_success: "They keep each other perfectly warm. Both heal 20 HP and gain cold resistance.",
      success: "They manage to stay warm enough. Both heal 15 HP.",
      partial: "It helps a little. Both heal 5 HP but still cold.",
      failure: "They're too awkward to get close enough. Both take 15 cold damage.",
      catastrophic: "They accidentally roll off a cliff while adjusting! Both take 40 damage."
    },
    check: {
      attribute: "resolve",
      dc: 11
    },
    outcomes: {
      critical_success: { heal: 20, buff: "cold_resistant" },
      success: { heal: 15 },
      partial: { heal: 5, debuff: "chilled" },
      failure: { dmg: 15 },
      catastrophic: { dmg: 40 }
    }
  },
  
  // === SEXY/NSFW EVENTS ===
  steamy_springs: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Hot Springs Discovery",
    minPlayers: 2,
    maxPlayers: 30,
    coupleBonus: true,
    text: {
      intro: "{CHAR1} and {CHAR2} discover hidden hot springs and decide to relax...",
      critical_success: "The springs have magical properties! Both heal 35 HP and gain enhanced vigor.",
      success: "Very relaxing and... intimate. Both heal 25 HP and feel refreshed.",
      partial: "Pleasant but the water's too hot. Both heal 10 HP but are flushed.",
      failure: "They slip on wet rocks. Both take 15 damage.",
      catastrophic: "The springs were actually a monster's lair! Both take 40 damage fleeing naked."
    },
    check: {
      attribute: "instinct",
      dc: 12
    },
    outcomes: {
      critical_success: { heal: 35, buff: "invigorated" },
      success: { heal: 25, buff: "refreshed" },
      partial: { heal: 10, debuff: "overheated" },
      failure: { dmg: 15 },
      catastrophic: { dmg: 40, debuff: "exposed" }
    }
  },
  
  seductive_charm: {
    type: EVENT_TYPES.SOCIAL,
    title: "Enchanting Encounter",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A seductive stranger approaches {CHAR} with alluring intentions...",
      critical_success: "{CHAR} charms them right back and gains valuable information plus a gift!",
      success: "{CHAR} enjoys the attention and learns something useful.",
      partial: "{CHAR} is flustered but maintains composure.",
      failure: "{CHAR} is seduced and manipulated. Loses 20 gold.",
      catastrophic: "{CHAR} falls completely under their spell! Loses 30 HP and 40 gold in a honey trap."
    },
    check: {
      attribute: "resolve",
      dc: 15
    },
    outcomes: {
      critical_success: { loot: 1, intel: 2, gold: 25 },
      success: { intel: 1 },
      partial: { debuff: "flustered" },
      failure: { gold: -20 },
      catastrophic: { dmg: 30, gold: -40, debuff: "charmed" }
    }
  },
  
  tension_release: {
    type: EVENT_TYPES.SOCIAL,
    title: "Release Tension",
    minPlayers: 2,
    maxPlayers: 30,
    coupleBonus: true,
    text: {
      intro: "{CHAR1} and {CHAR2} find a private moment to... release some stress...",
      critical_success: "Absolutely amazing! Both heal 40 HP and gain massive confidence boost.",
      success: "Very satisfying. Both heal 30 HP and feel great.",
      partial: "It was... fine. Both heal 15 HP.",
      failure: "Interrupted at the worst moment! Both lose 15 HP from frustration.",
      catastrophic: "Walked in on by the entire party! Both take 35 damage from mortification."
    },
    check: {
      attribute: "finesse",
      dc: 13
    },
    outcomes: {
      critical_success: { heal: 40, buff: "euphoric" },
      success: { heal: 30, buff: "satisfied" },
      partial: { heal: 15 },
      failure: { dmg: 15, debuff: "frustrated" },
      catastrophic: { dmg: 35, debuff: "mortified" }
    }
  },
  
  aphrodisiac_wine: {
    type: EVENT_TYPES.DILEMMA,
    title: "Enchanted Wine",
    minPlayers: 2,
    maxPlayers: 30,
    coupleBonus: true,
    text: {
      intro: "{CHAR1} and {CHAR2} discover a bottle of enchanted wine with... interesting properties...",
      critical_success: "They enjoy it responsibly and gain enhanced connection! Both heal 25 HP and get bond buff.",
      success: "Pleasantly intoxicating. Both heal 20 HP.",
      partial: "A bit too strong. Both heal 10 HP but are dizzy.",
      failure: "Way too potent! Both take 15 damage from side effects.",
      catastrophic: "They black out and wake up in a strange place! Both take 30 damage and are confused."
    },
    check: {
      attribute: "resolve",
      dc: 14
    },
    outcomes: {
      critical_success: { heal: 25, buff: "bonded" },
      success: { heal: 20 },
      partial: { heal: 10, debuff: "dizzy" },
      failure: { dmg: 15, debuff: "intoxicated" },
      catastrophic: { dmg: 30, debuff: "confused", loseItem: true }
    }
  },
  
  // === GORY/HORROR EVENTS ===
  blood_ritual: {
    type: EVENT_TYPES.DILEMMA,
    title: "Forbidden Ritual",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} finds an ancient altar soaked in blood. Participate in the ritual?",
      critical_success: "{CHAR} masters the dark magic! Gains 50 HP and a powerful curse mark.",
      success: "{CHAR} completes the ritual carefully. Gains dark powers but loses 20 HP.",
      partial: "{CHAR} partially completes it. Loses 30 HP but gains minor dark power.",
      failure: "{CHAR} fails the ritual and is punished! Loses 45 HP, blood pours from wounds.",
      catastrophic: "{CHAR} awakens something terrible! Loses 60 HP as tentacles emerge from the altar."
    },
    check: {
      attribute: "resolve",
      dc: 16
    },
    outcomes: {
      critical_success: { heal: 50, buff: "dark_empowerment" },
      success: { dmg: 20, buff: "dark_power" },
      partial: { dmg: 30, buff: "minor_dark_power" },
      failure: { dmg: 45, debuff: "bleeding" },
      catastrophic: { dmg: 60, debuff: "cursed", summonMonster: true }
    }
  },
  
  dismemberment_trap: {
    type: EVENT_TYPES.HAZARD,
    title: "Blade Trap",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} triggers a vicious blade trap!",
      critical_success: "{CHAR} dodges with superhuman reflexes! Completely unharmed.",
      success: "{CHAR} moves just in time. Takes 10 damage from a grazing cut.",
      partial: "{CHAR} is slashed badly. Takes 30 damage, blood sprays everywhere.",
      failure: "{CHAR} loses a finger! Takes 50 damage and screams in agony.",
      catastrophic: "{CHAR} is nearly cut in half! Takes 75 damage, barely clinging to life."
    },
    check: {
      attribute: "finesse",
      dc: 15
    },
    outcomes: {
      critical_success: { dmg: 0, morale: 10 },
      success: { dmg: 10 },
      partial: { dmg: 30, debuff: "bleeding" },
      failure: { dmg: 50, debuff: "maimed" },
      catastrophic: { dmg: 75, debuff: "critical_injury" }
    }
  },
  
  zombie_horde: {
    type: EVENT_TYPES.COMBAT,
    title: "Undead Ambush",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A horde of rotting zombies shambles toward {CHAR}!",
      critical_success: "{CHAR} destroys them all spectacularly! Covered in zombie gore but unharmed.",
      success: "{CHAR} fights them off. Takes 15 damage and is covered in putrid blood.",
      partial: "{CHAR} barely survives. Takes 35 damage, chunks of flesh everywhere.",
      failure: "{CHAR} is overwhelmed! Takes 55 damage, bitten multiple times.",
      catastrophic: "{CHAR} is dragged down and nearly eaten! Takes 80 damage and contracts zombie plague."
    },
    check: {
      attribute: "might",
      dc: 14
    },
    outcomes: {
      critical_success: { dmg: 0, loot: 1, morale: 15 },
      success: { dmg: 15, debuff: "gore_covered" },
      partial: { dmg: 35, debuff: "wounded" },
      failure: { dmg: 55, debuff: "infected" },
      catastrophic: { dmg: 80, debuff: "zombie_plague" }
    }
  },
  
  torture_chamber: {
    type: EVENT_TYPES.EXPLORATION,
    title: "Chamber of Horrors",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} enters a torture chamber filled with gruesome devices...",
      critical_success: "{CHAR} finds a hidden exit and valuable loot! Avoids all traps.",
      success: "{CHAR} carefully navigates through. Takes 10 damage from a minor trap.",
      partial: "{CHAR} triggers several devices. Takes 25 damage from various implements.",
      failure: "{CHAR} gets caught in restraints! Takes 40 damage before escaping.",
      catastrophic: "{CHAR} is trapped in an iron maiden! Takes 70 damage, screaming echoes in the chamber."
    },
    check: {
      attribute: "instinct",
      dc: 15
    },
    outcomes: {
      critical_success: { dmg: 0, loot: 2 },
      success: { dmg: 10 },
      partial: { dmg: 25, debuff: "traumatized" },
      failure: { dmg: 40, debuff: "tortured" },
      catastrophic: { dmg: 70, debuff: "severely_traumatized" }
    }
  },
  
  // === GAME-ALTERING EVENTS ===
  reality_shift: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Reality Warp",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} touches a strange orb and reality begins to shift...",
      critical_success: "{CHAR} controls the shift! Can swap any two attributes permanently.",
      success: "{CHAR} gains a random positive mutation. One attribute increases by 2.",
      partial: "{CHAR} is changed unpredictably. Random attribute swaps.",
      failure: "{CHAR} loses control! Loses 30 HP and gains a random debuff.",
      catastrophic: "{CHAR} is warped horribly! All attributes scrambled and takes 50 damage."
    },
    check: {
      attribute: "chaos",
      dc: 17
    },
    outcomes: {
      critical_success: { chooseAttributeSwap: true },
      success: { randomAttributeBoost: 2 },
      partial: { randomAttributeSwap: true },
      failure: { dmg: 30, randomDebuff: true },
      catastrophic: { dmg: 50, scrambleAttributes: true }
    }
  },
  
  divine_intervention: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Divine Blessing",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A divine presence manifests before {CHAR}...",
      critical_success: "A god blesses {CHAR}! Fully healed and gains permanent divine protection.",
      success: "{CHAR} receives a blessing. Heals 50 HP and gains temporary buff.",
      partial: "{CHAR} is judged worthy. Heals 30 HP.",
      failure: "{CHAR} is found wanting. No benefit.",
      catastrophic: "{CHAR} offends the deity! Cursed for 60 damage."
    },
    check: {
      attribute: "presence",
      dc: 16
    },
    outcomes: {
      critical_success: { heal: 100, buff: "divine_protection" },
      success: { heal: 50, buff: "blessed" },
      partial: { heal: 30 },
      failure: {},
      catastrophic: { dmg: 60, debuff: "divine_curse" }
    }
  },
  
  time_loop: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Time Paradox",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} experiences a time loop and relives the last event...",
      critical_success: "{CHAR} masters time! Can redo their last failed check with advantage.",
      success: "{CHAR} learns from the loop. Gains insight bonus to next check.",
      partial: "{CHAR} is disoriented by the experience. Loses 10 HP.",
      failure: "{CHAR} is trapped briefly. Loses 25 HP and a turn.",
      catastrophic: "{CHAR} is lost in time! Takes 45 damage and ages rapidly."
    },
    check: {
      attribute: "wit",
      dc: 16
    },
    outcomes: {
      critical_success: { redoCheck: true },
      success: { nextCheckBonus: 5 },
      partial: { dmg: 10, debuff: "disoriented" },
      failure: { dmg: 25, loseTurn: true },
      catastrophic: { dmg: 45, debuff: "aged" }
    }
  },
  
  // === CHALLENGE EVENTS ===
  riddle_sphinx: {
    type: EVENT_TYPES.DILEMMA,
    title: "Sphinx's Riddle",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A sphinx blocks {CHAR}'s path and poses a deadly riddle...",
      critical_success: "{CHAR} answers brilliantly! The sphinx grants safe passage and a reward.",
      success: "{CHAR} answers correctly. The sphinx allows passage.",
      partial: "{CHAR} gives a partially correct answer. The sphinx lets them pass but warns them.",
      failure: "{CHAR} answers wrong! The sphinx attacks for 40 damage.",
      catastrophic: "{CHAR} insults the sphinx with their stupidity! Takes 65 damage from its wrath."
    },
    check: {
      attribute: "wit",
      dc: 17
    },
    outcomes: {
      critical_success: { dmg: 0, loot: 2, intel: 1 },
      success: { dmg: 0 },
      partial: { dmg: 0, debuff: "warned" },
      failure: { dmg: 40 },
      catastrophic: { dmg: 65, debuff: "sphinx_curse" }
    }
  },
  
  gauntlet_run: {
    type: EVENT_TYPES.HAZARD,
    title: "Death Gauntlet",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} must run through a deadly gauntlet of traps!",
      critical_success: "{CHAR} blazes through untouched! Gains legendary status.",
      success: "{CHAR} makes it through with minor wounds. Takes 15 damage.",
      partial: "{CHAR} struggles through. Takes 35 damage from multiple traps.",
      failure: "{CHAR} is battered badly. Takes 55 damage.",
      catastrophic: "{CHAR} fails spectacularly! Takes 80 damage and is nearly destroyed."
    },
    check: {
      attribute: "finesse",
      dc: 16
    },
    outcomes: {
      critical_success: { dmg: 0, buff: "legendary", morale: 30 },
      success: { dmg: 15 },
      partial: { dmg: 35, debuff: "battered" },
      failure: { dmg: 55, debuff: "wounded" },
      catastrophic: { dmg: 80, debuff: "broken" }
    }
  },
  
  strength_trial: {
    type: EVENT_TYPES.COMBAT,
    title: "Trial of Strength",
    minPlayers: 2,
    maxPlayers: 30,
    text: {
      intro: "{CHAR1} and {CHAR2} must prove their strength in combat!",
      critical_success: "They fight as one! Both gain 20 HP and a teamwork buff.",
      success: "They work well together. Both gain 10 HP.",
      partial: "They barely coordinate. Both take 10 damage.",
      failure: "They get in each other's way! Both take 30 damage.",
      catastrophic: "They accidentally attack each other! Both take 50 damage."
    },
    check: {
      attribute: "might",
      dc: 15
    },
    outcomes: {
      critical_success: { heal: 20, buff: "coordinated" },
      success: { heal: 10 },
      partial: { dmg: 10 },
      failure: { dmg: 30 },
      catastrophic: { dmg: 50, debuff: "disorganized" }
    }
  },
  
  // === MYSTERIOUS EVENTS ===
  whispering_shadows: {
    type: EVENT_TYPES.EXPLORATION,
    title: "Whispering Darkness",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "Shadows whisper secrets to {CHAR} in an unknown language...",
      critical_success: "{CHAR} understands the whispers! Gains forbidden knowledge and dark power.",
      success: "{CHAR} catches fragments of meaning. Gains minor insight.",
      partial: "{CHAR} is unsettled but unharmed.",
      failure: "{CHAR} is haunted by the whispers. Loses 20 HP to mental strain.",
      catastrophic: "{CHAR} goes mad from the revelations! Loses 45 HP and is driven to hysteria."
    },
    check: {
      attribute: "resolve",
      dc: 15
    },
    outcomes: {
      critical_success: { intel: 3, buff: "dark_insight" },
      success: { intel: 1 },
      partial: { debuff: "unsettled" },
      failure: { dmg: 20, debuff: "haunted" },
      catastrophic: { dmg: 45, debuff: "insane" }
    }
  },
  
  prophetic_vision: {
    type: EVENT_TYPES.DISCOVERY,
    title: "Vision of Fate",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} experiences a vivid vision of possible futures...",
      critical_success: "{CHAR} sees the perfect path! Gains foresight for upcoming events.",
      success: "{CHAR} glimpses useful information about what's ahead.",
      partial: "{CHAR} sees conflicting futures. Confused but intrigued.",
      failure: "{CHAR} sees only darkness. Loses 15 HP to existential dread.",
      catastrophic: "{CHAR} witnesses their own death! Loses 40 HP and is traumatized."
    },
    check: {
      attribute: "wit",
      dc: 14
    },
    outcomes: {
      critical_success: { buff: "foresight", intel: 2 },
      success: { intel: 1 },
      partial: { debuff: "confused" },
      failure: { dmg: 15, debuff: "dread" },
      catastrophic: { dmg: 40, debuff: "death_vision" }
    }
  },
  
  ancient_guardian: {
    type: EVENT_TYPES.COMBAT,
    title: "Ancient Sentinel",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "A mysterious ancient guardian awakens as {CHAR} approaches...",
      critical_success: "{CHAR} proves worthy! The guardian offers a powerful gift and stands down.",
      success: "{CHAR} defeats the guardian respectfully. Takes 20 damage but gains its blessing.",
      partial: "{CHAR} barely survives the test. Takes 40 damage.",
      failure: "{CHAR} is deemed unworthy! Takes 60 damage from the guardian's assault.",
      catastrophic: "{CHAR} enrages the ancient being! Takes 85 damage and is marked for death."
    },
    check: {
      attribute: "might",
      dc: 17
    },
    outcomes: {
      critical_success: { dmg: 0, loot: 2, buff: "guardian_gift" },
      success: { dmg: 20, buff: "guardian_blessing" },
      partial: { dmg: 40 },
      failure: { dmg: 60, debuff: "unworthy" },
      catastrophic: { dmg: 85, debuff: "marked_for_death" }
    }
  },
  
  portal_mystery: {
    type: EVENT_TYPES.DILEMMA,
    title: "Unknown Portal",
    minPlayers: 1,
    maxPlayers: 30,
    text: {
      intro: "{CHAR} discovers a swirling portal to... somewhere. Enter it?",
      critical_success: "{CHAR} finds a treasure dimension! Returns with amazing loot.",
      success: "{CHAR} explores briefly and returns safely with something interesting.",
      partial: "{CHAR} gets lost but finds their way back. Takes 15 damage.",
      failure: "{CHAR} is attacked in the other realm! Takes 35 damage.",
      catastrophic: "{CHAR} is nearly trapped forever! Takes 55 damage and barely escapes."
    },
    check: {
      attribute: "instinct",
      dc: 16
    },
    outcomes: {
      critical_success: { loot: 3, gold: 50 },
      success: { loot: 1 },
      partial: { dmg: 15, debuff: "disoriented" },
      failure: { dmg: 35, debuff: "portal_sick" },
      catastrophic: { dmg: 55, debuff: "reality_sickness" }
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
