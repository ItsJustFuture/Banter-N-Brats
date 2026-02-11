"use strict";

const VIBE_TAG_LIMIT = 3;

const VIBE_TAGS = Object.freeze([
  // SFW Tags (original + new)
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
  { id: "early-bird", label: "Early Bird", emoji: "🌅" },
  
  // Additional SFW Tags
  { id: "funny", label: "Funny", emoji: "😂" },
  { id: "witty", label: "Witty", emoji: "🧠" },
  { id: "nerdy", label: "Nerdy", emoji: "🤓" },
  { id: "gamer", label: "Gamer", emoji: "🎮" },
  { id: "bookworm", label: "Bookworm", emoji: "📖" },
  { id: "music-lover", label: "Music Lover", emoji: "🎵" },
  { id: "anime-fan", label: "Anime Fan", emoji: "🎌" },
  { id: "foodie", label: "Foodie", emoji: "🍕" },
  { id: "fitness-enthusiast", label: "Fitness Enthusiast", emoji: "💪" },
  { id: "nature-lover", label: "Nature Lover", emoji: "🌿" },
  { id: "traveler", label: "Traveler", emoji: "✈️" },
  { id: "movie-buff", label: "Movie Buff", emoji: "🎬" },
  { id: "pet-lover", label: "Pet Lover", emoji: "🐾" },
  { id: "tech-savvy", label: "Tech Savvy", emoji: "💻" },
  { id: "creative-writer", label: "Creative Writer", emoji: "✍️" },
  { id: "photographer", label: "Photographer", emoji: "📷" },
  { id: "dreamer", label: "Dreamer", emoji: "💫" },
  { id: "optimistic", label: "Optimistic", emoji: "🌈" },
  { id: "sarcastic", label: "Sarcastic", emoji: "😏" },
  { id: "loyal", label: "Loyal", emoji: "🛡️" },
  { id: "peaceful", label: "Peaceful", emoji: "☮️" },
  { id: "spiritual", label: "Spiritual", emoji: "🕉️" },
  
  // NSFW Tags
  { id: "flirty", label: "Flirty", emoji: "😘", nsfw: true },
  { id: "seductive", label: "Seductive", emoji: "😈", nsfw: true },
  { id: "kinky", label: "Kinky", emoji: "🔗", nsfw: true },
  { id: "dominant", label: "Dominant", emoji: "👑", nsfw: true },
  { id: "submissive", label: "Submissive", emoji: "🐕", nsfw: true },
  { id: "switch", label: "Switch", emoji: "🔄", nsfw: true },
  { id: "sensual", label: "Sensual", emoji: "💋", nsfw: true },
  { id: "tease", label: "Tease", emoji: "😜", nsfw: true },
  { id: "adventurous-nsfw", label: "Adventurous (NSFW)", emoji: "🌶️", nsfw: true },
  { id: "experimental", label: "Experimental", emoji: "🧪", nsfw: true },
  { id: "passionate", label: "Passionate", emoji: "❤️‍🔥", nsfw: true },
  { id: "bratty", label: "Bratty", emoji: "😼", nsfw: true }
]);

module.exports = {
  VIBE_TAG_LIMIT,
  VIBE_TAGS
};
