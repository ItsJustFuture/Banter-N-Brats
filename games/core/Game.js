"use strict";

class Game {
  constructor({ state = {}, players = [], currentTurnIndex = 0 } = {}) {
    this.state = state || {};
    this.players = Array.isArray(players) ? players : [];
    this.currentTurnIndex = Number.isInteger(currentTurnIndex) ? currentTurnIndex : 0;
  }

  init() {
    throw new Error("init() must be implemented by the game");
  }

  handleAction(_playerId, _action) {
    throw new Error("handleAction(playerId, action) must be implemented by the game");
  }

  getVisibleState(_playerId) {
    return this.state;
  }

  isFinished() {
    return false;
  }

  getWinner() {
    return null;
  }

  getCurrentTurnPlayerId() {
    if (!Array.isArray(this.players) || this.players.length === 0) return null;
    return this.players[this.currentTurnIndex]?.id ?? null;
  }

  nextTurn() {
    if (!Array.isArray(this.players) || this.players.length === 0) return null;
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    return this.getCurrentTurnPlayerId();
  }

  validateTurn(playerId) {
    const current = this.getCurrentTurnPlayerId();
    return current != null && String(current) === String(playerId);
  }

  setPlayers(players = []) {
    this.players = Array.isArray(players) ? players : [];
    if (this.currentTurnIndex >= this.players.length) {
      this.currentTurnIndex = 0;
    }
  }
}

module.exports = Game;
