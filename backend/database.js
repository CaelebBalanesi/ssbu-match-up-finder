const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./lobbies.db');

db.serialize(() => {
  db.run(`
      CREATE TABLE IF NOT EXISTS lobbies (
        id TEXT PRIMARY KEY,
        host_username TEXT NOT NULL,
        host_session_id TEXT NOT NULL,
        smash_lobby_id TEXT NOT NULL,
        smash_lobby_password TEXT NOT NULL,
        host_character TEXT NOT NULL,
        seeking_characters TEXT NOT NULL,
        created_time TEXT NOT NULL
        )
    `);
});

module.exports = db;
