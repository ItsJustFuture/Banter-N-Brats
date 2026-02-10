"use strict";

const VIBE_TAG_LIMIT = 3;

const VIBE_TAGS = Object.freeze([
  { id: "chill", label: "Chill", emoji: "😌" },
  { id: "energetic", label: "Energetic", emoji: "⚡" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "adventurous", label: "Adventurous", emoji: "🗺️" },
  { id: "cozy", label: "Cozy", emoji: "🛋️" },
  { id: "social", label: "Social", emoji: "🎉" },
  { id: "thoughtful", label: "Thoughtful", emoji: "💭" },
  { id: "curious", label: "Curious", emoji: "👀" },
  { id: "playful", label: "Playful", emoji: "🎲" },
  { id: "romantic", label: "Romantic", emoji: "💞" },
  { id: "confident", label: "Confident", emoji: "💪" },
  { id: "shy", label: "Shy", emoji: "🙈" },
  { id: "mysterious", label: "Mysterious", emoji: "🌒" },
  { id: "bold", label: "Bold", emoji: "🔥" },
  { id: "caring", label: "Caring", emoji: "💝" },
  { id: "spontaneous", label: "Spontaneous", emoji: "🌪️" },
  { id: "intellectual", label: "Intellectual", emoji: "📚" },
  { id: "artistic", label: "Artistic", emoji: "🎭" },
  { id: "competitive", label: "Competitive", emoji: "🏆" },
  { id: "laid-back", label: "Laid-back", emoji: "🌴" },
  { id: "ambitious", label: "Ambitious", emoji: "🚀" },
  { id: "supportive", label: "Supportive", emoji: "🤝" },
  { id: "independent", label: "Independent", emoji: "🦅" },
  { id: "empathetic", label: "Empathetic", emoji: "💙" },
  { id: "night-owl", label: "Night Owl", emoji: "🦉" },
  { id: "early-bird", label: "Early Bird", emoji: "🌅" }
]);

module.exports = {
  VIBE_TAG_LIMIT,
  VIBE_TAGS
};
