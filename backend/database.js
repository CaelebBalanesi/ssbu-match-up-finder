// database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.resolve(__dirname, "database.db"),
  (err) => {
    if (err) {
      console.error("Could not connect to SQLite database", err);
    } else {
      console.log("Connected to SQLite database");
    }
  },
);

db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `,
    (err) => {
      if (err) {
        console.error("Failed to create users table", err);
      } else {
        console.log("Users table is ready");
      }
    },
  );
});

module.exports = db;
