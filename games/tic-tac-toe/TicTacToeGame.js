"use strict";

const Game = require("../core/Game");

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function evaluateWinner(board = []) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const symbol = board[a];
    if (!symbol) continue;
    if (symbol === board[b] && symbol === board[c]) {
      return { winner: symbol, line };
    }
  }
  return { winner: null, line: null };
}

class TicTacToeGame extends Game {
  init() {
    this.currentTurnIndex = 0;
    this.state = {
      board: Array(9).fill(null),
      symbolsByPlayerId: {
        [this.players?.[0]?.id]: "X",
        [this.players?.[1]?.id]: "O",
      },
      winner: null,
      winningLine: null,
      isDraw: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  handleAction(playerId, action = {}) {
    const type = String(action?.type || "");
    if (type !== "move") throw new Error("Unsupported action type");
    if (!this.validateTurn(playerId)) throw new Error("Not your turn");

    const index = Number(action?.index);
    if (!Number.isInteger(index) || index < 0 || index > 8) throw new Error("Invalid move");
    if (this.state.board[index]) throw new Error("Cell already occupied");

    const symbol = this.state.symbolsByPlayerId?.[playerId];
    if (!symbol) throw new Error("You are not a game player");

    this.state.board[index] = symbol;
    this.state.updatedAt = Date.now();

    const { winner, line } = evaluateWinner(this.state.board);
    if (winner) {
      this.state.winner = winner;
      this.state.winningLine = line;
      this.state.isDraw = false;
      return { type, index, symbol, winner };
    }

    if (this.state.board.every(Boolean)) {
      this.state.winner = "draw";
      this.state.isDraw = true;
      return { type, index, symbol, winner: "draw" };
    }

    this.nextTurn();
    return { type, index, symbol, winner: null };
  }

  getVisibleState() {
    return {
      ...this.state,
      currentTurnPlayerId: this.getCurrentTurnPlayerId(),
    };
  }

  isFinished() {
    return Boolean(this.state?.winner);
  }

  getWinner() {
    if (!this.state?.winner || this.state.winner === "draw") return null;
    const winnerEntry = Object.entries(this.state.symbolsByPlayerId || {}).find(([, symbol]) => symbol === this.state.winner);
    return winnerEntry?.[0] || null;
  }
}

module.exports = TicTacToeGame;
