"use strict";

const BingoGame = require("../bingo/BingoGame");
const CardMatchGame = require("../card-match/CardMatchGame");
const MonsterGame = require("../monster-battle/MonsterGame");
const TicTacToeGame = require("../tic-tac-toe/TicTacToeGame");
const ChessGame = require("../chess/ChessGame");

const GameRegistry = {
  bingo: BingoGame,
  "card-match": CardMatchGame,
  "monster-battle": MonsterGame,
  "tic-tac-toe": TicTacToeGame,
  chess: ChessGame,
};

function getGameClass(gameType) {
  const normalized = String(gameType || "").trim().toLowerCase();
  return GameRegistry[normalized] || null;
}

module.exports = {
  GameRegistry,
  getGameClass,
};
