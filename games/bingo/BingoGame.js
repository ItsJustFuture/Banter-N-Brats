"use strict";

const Game = require("../core/Game");

const MIN_NUMBER = 1;
const MAX_NUMBER = 75;
const CARD_SIZE = 15;

function shuffle(arr) {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

class BingoGame extends Game {
  init() {
    const universe = Array.from({ length: MAX_NUMBER }, (_, idx) => idx + MIN_NUMBER);
    this.state = {
      numbersDrawn: [],
      remainingNumbers: shuffle(universe),
      cards: {},
      marks: {},
      winnerId: null,
      lastActionAt: Date.now(),
    };

    for (const player of this.players) {
      const card = shuffle(universe).slice(0, CARD_SIZE).sort((a, b) => a - b);
      this.state.cards[player.id] = card;
      this.state.marks[player.id] = [];
    }

    this.currentTurnIndex = 0;
  }

  handleAction(playerId, action = {}) {
    const type = String(action?.type || "");
    if (!type) throw new Error("Missing action type");

    if (type === "draw-number") {
      if (!this.validateTurn(playerId)) {
        throw new Error("Not your turn");
      }
      const next = this.state.remainingNumbers.shift();
      if (next == null) throw new Error("No numbers remaining");
      this.state.numbersDrawn.push(next);
      this.state.lastDrawnNumber = next;
      this.state.lastActionAt = Date.now();
      this.nextTurn();
      return { type, number: next };
    }

    if (type === "mark-number") {
      const number = Number(action?.number);
      if (!Number.isInteger(number)) throw new Error("Invalid number");
      if (!this.state.numbersDrawn.includes(number)) {
        throw new Error("Number has not been drawn");
      }
      const card = this.state.cards[playerId] || [];
      if (!card.includes(number)) {
        throw new Error("Number is not on your card");
      }
      const marks = this.state.marks[playerId] || [];
      if (marks.includes(number)) {
        throw new Error("Number already marked");
      }
      marks.push(number);
      this.state.marks[playerId] = marks;
      this.state.lastActionAt = Date.now();
      if (card.every((cardNumber) => marks.includes(cardNumber))) {
        this.state.winnerId = playerId;
      }
      return { type, number };
    }

    throw new Error("Unsupported action type");
  }

  getVisibleState() {
    return {
      ...this.state,
      currentTurnPlayerId: this.getCurrentTurnPlayerId(),
    };
  }

  isFinished() {
    return Boolean(this.state?.winnerId);
  }

  getWinner() {
    return this.state?.winnerId || null;
  }
}

module.exports = BingoGame;
