"use strict";

const crypto = require("crypto");
const { getGameClass } = require("./GameRegistry");

class GameManager {
  constructor({ io, gameSessionService }) {
    if (!io) throw new Error("GameManager requires io");
    if (!gameSessionService) throw new Error("GameManager requires gameSessionService");

    this.io = io;
    this.gameSessionService = gameSessionService;
    this.games = new Map();
  }

  async startGame({ gameType, hostUserId, config = {} }) {
    const GameClass = getGameClass(gameType);
    if (!GameClass) throw new Error(`Unsupported game type: ${gameType}`);
    if (!hostUserId) throw new Error("Missing hostUserId");

    const gameId = crypto.randomUUID();
    const game = new GameClass({ state: {}, players: [] });
    const session = {
      id: gameId,
      gameType: String(gameType),
      status: "lobby",
      state: {},
      config: config || {},
      players: [],
      game,
      startedAt: Date.now(),
      endedAt: null,
    };

    this.games.set(gameId, session);
    await this.joinGame({ gameId, userId: hostUserId });
    await this.persistGame(session);

    return this.buildMetadata(session);
  }

  async joinGame({ gameId, userId }) {
    const session = this.requireGame(gameId);
    if (!userId) throw new Error("Missing userId");

    const existing = session.players.find((p) => String(p.id) === String(userId));
    if (!existing) {
      const maxPlayers = Number(session.game.maxPlayers);
      if (Number.isInteger(maxPlayers) && maxPlayers > 0 && session.players.length >= maxPlayers) {
        throw new Error("Game is full");
      }
      session.players.push({ id: userId });
    }

    session.game.setPlayers(session.players);
    session.state = session.game.getState ? session.game.getState() : session.game.state;

    await this.persistGame(session);
    this.emitGameState(gameId);
    return this.buildMetadata(session);
  }

  async leaveGame({ gameId, userId }) {
    const session = this.requireGame(gameId);
    const nextPlayers = session.players.filter((p) => String(p.id) !== String(userId));
    if (nextPlayers.length === session.players.length) return this.buildMetadata(session);

    session.players = nextPlayers;
    session.game.setPlayers(nextPlayers);

    if (nextPlayers.length === 0) {
      await this.endGame({ gameId, reason: "all_players_left" });
      return null;
    }

    session.state = session.game.getState ? session.game.getState() : session.game.state;
    await this.persistGame(session);
    this.emitGameState(gameId);
    return this.buildMetadata(session);
  }

  async endGame({ gameId, reason = "completed" }) {
    const session = this.requireGame(gameId);
    session.status = "finished";
    session.endedAt = Date.now();
    session.endReason = reason;
    session.state = session.game.getState ? session.game.getState() : session.game.state;

    await this.persistGame(session);
    this.games.delete(gameId);

    this.io.to(`game:${gameId}`).emit("game:end", {
      gameId,
      gameType: session.gameType,
      reason,
      state: session.state,
    });
  }

  getGame(gameId) {
    return this.games.get(gameId) || null;
  }

  getAllGames() {
    return Array.from(this.games.values()).map((session) => this.buildMetadata(session));
  }

  emitGameState(gameId) {
    const session = this.requireGame(gameId);
    const state = {
      gameId,
      gameType: session.gameType,
      status: session.status,
      players: session.players,
      state: session.game.getState ? session.game.getState() : session.game.state,
    };

    this.io.to(`game:${gameId}`).emit("game:update", state);
    return state;
  }

  async handleAction({ gameId, userId, action, payload }) {
    const session = this.requireGame(gameId);
    if (session.status === "finished") throw new Error("Game already finished");
    if (!session.players.some((p) => String(p.id) === String(userId))) {
      throw new Error("You are not a player in this game");
    }

    const result = session.game.handleAction(userId, action, payload);
    session.state = session.game.getState ? session.game.getState() : session.game.state;
    if (session.game.isFinished && session.game.isFinished()) {
      await this.endGame({ gameId, reason: "game_finished" });
      return result;
    }

    await this.persistGame(session);
    this.emitGameState(gameId);
    return result;
  }

  requireGame(gameId) {
    const session = this.getGame(gameId);
    if (!session) throw new Error("Game not found");
    return session;
  }

  buildMetadata(session) {
    return {
      gameId: session.id,
      gameType: session.gameType,
      status: session.status,
      players: session.players,
      config: session.config || {},
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
  }

  async persistGame(session) {
    if (typeof this.gameSessionService?.dbRunAsync !== "function") return;

    const now = Date.now();
    await this.gameSessionService.dbRunAsync(
      `INSERT INTO game_sessions (id, room_id, game_type, state, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         state = excluded.state,
         status = excluded.status,
         updated_at = excluded.updated_at`,
      [session.id, `game:${session.id}`, session.gameType, JSON.stringify(session.state || {}), session.status, session.startedAt || now, now]
    );
  }
}

module.exports = GameManager;
