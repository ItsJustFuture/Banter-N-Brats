"use strict";

const { Chess } = require("chess.js");
const Game = require("../core/Game");

class ChessGame extends Game {
  constructor(options = {}) {
    super(options);
    const fen = options?.state?.fen || undefined;
    this.chess = new Chess(fen);
  }

  init() {
    this.currentTurnIndex = 0;
    this.chess = new Chess();
    this.state = {
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      turn: this.chess.turn(),
      winner: null,
      status: "active",
      players: {
        white: this.players?.[0]?.id || null,
        black: this.players?.[1]?.id || null,
      },
      updatedAt: Date.now(),
    };
  }

  handleAction(playerId, action = {}) {
    const type = String(action?.type || "");
    if (type !== "move") throw new Error("Unsupported action type");

    const { white, black } = this.state.players || {};
    const expectedPlayer = this.chess.turn() === "w" ? white : black;
    if (!expectedPlayer || String(expectedPlayer) !== String(playerId)) {
      throw new Error("Not your turn");
    }

    const from = String(action?.from || "").trim().toLowerCase();
    const to = String(action?.to || "").trim().toLowerCase();
    const promotion = String(action?.promotion || "").trim().toLowerCase() || undefined;
    if (!from || !to) throw new Error("Invalid move");

    const move = this.chess.move({ from, to, promotion });
    if (!move) throw new Error("Illegal move");

    this.state.fen = this.chess.fen();
    this.state.pgn = this.chess.pgn();
    this.state.turn = this.chess.turn();
    this.state.updatedAt = Date.now();

    if (this.chess.isCheckmate()) {
      this.state.status = "mate";
      this.state.winner = move.color === "w" ? "white" : "black";
    } else if (this.chess.isStalemate() || this.chess.isDraw()) {
      this.state.status = "draw";
      this.state.winner = "draw";
    }

    this.currentTurnIndex = this.state.turn === "w" ? 0 : 1;
    return { type, move };
  }

  getVisibleState() {
    return {
      ...this.state,
      currentTurnPlayerId: this.getCurrentTurnPlayerId(),
    };
  }

  isFinished() {
    return this.state?.status === "mate" || this.state?.status === "draw";
  }

  getWinner() {
    if (this.state?.winner === "white") return this.state?.players?.white || null;
    if (this.state?.winner === "black") return this.state?.players?.black || null;
    return null;
  }
}

module.exports = ChessGame;
