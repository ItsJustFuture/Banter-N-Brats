"use strict";

const Game = require("./Game");

class UnsupportedGame extends Game {
  init() {
    this.state = { message: "Game type not implemented yet" };
  }

  handleAction() {
    throw new Error("This game type is not implemented yet");
  }
}

module.exports = UnsupportedGame;
