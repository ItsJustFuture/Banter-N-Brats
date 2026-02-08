/**
 * DnD Character Creation Wizard - Data Configuration
 * All RPG content for the multi-step character creator
 */

// Core Attributes with descriptions
export const ATTRIBUTES = [
  { id: 'strength', name: 'Strength', emoji: '💪', description: 'Physical power and damage', min: 1, max: 20, default: 8 },
  { id: 'dexterity', name: 'Dexterity', emoji: '🎯', description: 'Speed, evasion, finesse', min: 1, max: 20, default: 8 },
  { id: 'intelligence', name: 'Intelligence', emoji: '🧠', description: 'Knowledge and spell potency', min: 1, max: 20, default: 8 },
  { id: 'wisdom', name: 'Wisdom', emoji: '👁️', description: 'Awareness and resistance', min: 1, max: 20, default: 8 },
  { id: 'charisma', name: 'Charisma', emoji: '✨', description: 'Social influence', min: 1, max: 20, default: 8 },
  { id: 'constitution', name: 'Constitution', emoji: '🛡️', description: 'Health and stamina', min: 1, max: 20, default: 8 }
];

// Skills with descriptions (minimum 10 required)
export const SKILLS = [
  { id: 'swordsmanship', name: 'Swordsmanship', description: 'Melee combat efficiency and blade mastery' },
  { id: 'archery', name: 'Archery', description: 'Ranged accuracy with bows and crossbows' },
  { id: 'stealth', name: 'Stealth', description: 'Remaining unseen and moving silently' },
  { id: 'arcana', name: 'Arcana', description: 'Magical knowledge and spell understanding' },
  { id: 'survival', name: 'Survival', description: 'Environmental mastery and wilderness navigation' },
  { id: 'diplomacy', name: 'Diplomacy', description: 'Social negotiation and peaceful resolution' },
  { id: 'intimidation', name: 'Intimidation', description: 'Fear-based influence and threatening presence' },
  { id: 'alchemy', name: 'Alchemy', description: 'Potion effectiveness and chemical knowledge' },
  { id: 'investigation', name: 'Investigation', description: 'Clue detection and evidence analysis' },
  { id: 'athletics', name: 'Athletics', description: 'Physical feats and acrobatic prowess' },
  { id: 'lockpicking', name: 'Lockpicking', description: 'Opening locks and bypassing security' },
  { id: 'medicine', name: 'Medicine', description: 'Healing arts and anatomical knowledge' }
];

// Traits - positive characteristics (minimum 10 required)
export const TRAITS = [
  { id: 'brave', name: 'Brave', description: 'Resistance to fear and terror effects' },
  { id: 'tactical_mind', name: 'Tactical Mind', description: 'Improved planning and strategic outcomes' },
  { id: 'quick_learner', name: 'Quick Learner', description: 'Faster skill progression and XP gain' },
  { id: 'iron_nerves', name: 'Iron Nerves', description: 'High stress resistance in combat' },
  { id: 'natural_leader', name: 'Natural Leader', description: 'Provides buffs to nearby allies' },
  { id: 'sharpshooter', name: 'Sharpshooter', description: 'Precision bonus to ranged attacks' },
  { id: 'arcane_adept', name: 'Arcane Adept', description: 'Improved spell efficiency and mana usage' },
  { id: 'resilient', name: 'Resilient', description: 'Damage mitigation and injury resistance' },
  { id: 'silver_tongue', name: 'Silver Tongue', description: 'Persuasion bonus in social encounters' },
  { id: 'battle_hardened', name: 'Battle Hardened', description: 'Enhanced combat endurance and stamina' },
  { id: 'keen_eye', name: 'Keen Eye', description: 'Enhanced perception and detail spotting' },
  { id: 'nimble', name: 'Nimble', description: 'Improved dodge and evasion capabilities' }
];

// Quirks - drawbacks/personality flaws (minimum 10 required)
export const QUIRKS = [
  { id: 'reckless', name: 'Reckless', description: 'Tendency to take higher risk actions' },
  { id: 'superstitious', name: 'Superstitious', description: 'Reacts strongly to omens and signs' },
  { id: 'hot_tempered', name: 'Hot-Tempered', description: 'Prone to emotional outbursts' },
  { id: 'distractible', name: 'Distractible', description: 'Suffers focus penalties in complex situations' },
  { id: 'stubborn', name: 'Stubborn', description: 'Resistant to changing plans or admitting mistakes' },
  { id: 'overconfident', name: 'Overconfident', description: 'Tends to misjudge danger levels' },
  { id: 'night_owl', name: 'Night Owl', description: 'Penalties during daytime activities' },
  { id: 'paranoid', name: 'Paranoid', description: 'Trust issues and constant vigilance' },
  { id: 'impulsive', name: 'Impulsive', description: 'Acts before thinking things through' },
  { id: 'morbid_curiosity', name: 'Morbid Curiosity', description: 'Drawn to dangerous or forbidden things' },
  { id: 'kleptomaniac', name: 'Kleptomaniac', description: 'Compulsion to take things that aren\'t yours' },
  { id: 'cowardly', name: 'Cowardly', description: 'Likely to flee from overwhelming threats' }
];

// Abilities - special powers (minimum 10 required)
export const ABILITIES = [
  { id: 'power_strike', name: 'Power Strike', description: 'High-damage melee attack that can break defenses' },
  { id: 'shadow_step', name: 'Shadow Step', description: 'Short-range teleport through shadows' },
  { id: 'battle_cry', name: 'Battle Cry', description: 'Temporary buff to all nearby allies' },
  { id: 'arcane_surge', name: 'Arcane Surge', description: 'Spell amplification for next cast' },
  { id: 'guardian_stance', name: 'Guardian Stance', description: 'Defensive posture that protects allies' },
  { id: 'precision_shot', name: 'Precision Shot', description: 'Critical ranged attack with high accuracy' },
  { id: 'mind_shield', name: 'Mind Shield', description: 'Mental resistance against psychic attacks' },
  { id: 'adrenal_dash', name: 'Adrenal Dash', description: 'Speed burst for rapid repositioning' },
  { id: 'counterspell', name: 'Counterspell', description: 'Interrupt and negate enemy spells' },
  { id: 'last_stand', name: 'Last Stand', description: 'Survival boost when at low HP' },
  { id: 'disarm', name: 'Disarm', description: 'Remove weapon from enemy\'s grasp' },
  { id: 'rally', name: 'Rally', description: 'Restore morale and stamina to allies' }
];

// Perks - point allocation categories
export const PERK_CATEGORIES = [
  { id: 'combat_mastery', name: 'Combat Mastery', description: 'Improves attack accuracy and damage' },
  { id: 'magic_control', name: 'Magic Control', description: 'Enhances spell power and mana efficiency' },
  { id: 'social_influence', name: 'Social Influence', description: 'Better outcomes in negotiations' },
  { id: 'survival_instinct', name: 'Survival Instinct', description: 'Wilderness and environmental bonuses' },
  { id: 'luck', name: 'Luck', description: 'Chance to avoid bad outcomes or get critical successes' },
  { id: 'crafting', name: 'Crafting', description: 'Create better items and equipment' },
  { id: 'exploration', name: 'Exploration', description: 'Find hidden paths and secret areas' }
];

// Buffs - optional enhancements with XP penalty (minimum 10 required)
export const BUFFS = [
  { id: 'adrenaline_rush', name: 'Adrenaline Rush', description: 'Permanent speed increase in combat' },
  { id: 'arcane_focus', name: 'Arcane Focus', description: 'Faster mana regeneration' },
  { id: 'iron_will_buff', name: 'Iron Will', description: 'Resistance to mind control effects' },
  { id: 'berserker_blood', name: 'Berserker Blood', description: 'Damage boost when below 50% HP' },
  { id: 'eagle_eye', name: 'Eagle Eye', description: 'Enhanced vision range and clarity' },
  { id: 'battle_trance', name: 'Battle Trance', description: 'Combat clarity reduces confusion effects' },
  { id: 'mystic_aura', name: 'Mystic Aura', description: 'Magical presence intimidates enemies' },
  { id: 'rapid_recovery', name: 'Rapid Recovery', description: 'Faster healing over time' },
  { id: 'hardened_skin', name: 'Hardened Skin', description: 'Natural defense boost' },
  { id: 'lucky_charm', name: 'Lucky Charm', description: 'Random events favor you more often' },
  { id: 'vampiric_touch', name: 'Vampiric Touch', description: 'Heal when dealing damage' },
  { id: 'elemental_affinity', name: 'Elemental Affinity', description: 'Resistance to elemental damage' }
];

// XP Modifier Constants
export const XP_MODIFIER_DEFAULT = 1.0;
export const XP_MODIFIER_WITH_BUFFS = 0.85; // 15% penalty

// Point allocation for attributes
export const ATTRIBUTE_POINT_TOTAL = 48; // Total points to distribute

// Perk point allocation
export const PERK_POINT_TOTAL = 20; // Total perk points to distribute
export const PERK_POINT_MIN = 0;
export const PERK_POINT_MAX = 15;

// Ability selection limits
export const ABILITY_MAX_SELECTED = 5;
export const ABILITY_MIN_SELECTED = 1;

// Skill selection limits
export const SKILL_MIN_SELECTED = 1;

// Validation rules
export const VALIDATION_RULES = {
  // If any traits selected, must select at least one quirk
  TRAITS_REQUIRE_QUIRKS: true
};
