// models/Lobby.js
const uuid = require("uuid");

class Lobby {
  constructor({
    host_username,
    smash_lobby_id,
    smash_lobby_password,
    host_character,
    seeking_characters,
  }) {
    this.id = uuid.v4();
    this.host_username = host_username;
    this.smash_lobby_id = smash_lobby_id;
    this.smash_lobby_password = smash_lobby_password;
    this.host_character = host_character;
    this.seeking_characters = seeking_characters;
    this.created_time = new Date().toISOString();
    this.users = [];
    this.maxUsers = 2;
  }

  isFull() {
    return this.users.length >= this.maxUsers;
  }
}

module.exports = Lobby;
