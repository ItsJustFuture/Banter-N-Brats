"use strict";

const BingoGame = require("../bingo/BingoGame");
const CardMatchGame = require("../card-match/CardMatchGame");
const MonsterGame = require("../monster-battle/MonsterGame");

const GameRegistry = {
  bingo: BingoGame,
  "card-match": CardMatchGame,
  "monster-battle": MonsterGame,
};

function getGameClass(gameType) {
  const normalized = String(gameType || "").trim().toLowerCase();
  return GameRegistry[normalized] || null;
}

module.exports = {
  GameRegistry,
  getGameClass,
};
