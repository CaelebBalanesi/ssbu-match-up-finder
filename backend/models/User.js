// models/User.js
const db = require("../database"); // Adjust the path if necessary

class User {
  constructor({
    id,
    username,
    discriminator,
    avatar,
    email,
    mfa_enabled,
    mainCharacter = null,
  }) {
    this.id = id;
    this.username = username;
    this.discriminator = discriminator;
    this.avatar = avatar;
    this.email = email;
    this.mfa_enabled = mfa_enabled === 1; // Convert INTEGER to BOOLEAN
    this.mainCharacter = mainCharacter;
  }

  /**
   * Find a user by ID.
   * @param {Object} query - The query object.
   * @param {string} query.id - The Discord user ID.
   * @returns {Promise<User|null>} - Returns a User instance or null if not found.
   */
  static findOne({ id }) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE id = ?`;
      db.get(query, [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        if (row) {
          const user = new User(row);
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Update the user's main character.
   * @param {string} mainCharacter - The new main character.
   * @returns {Promise<void>}
   */
  updateMainCharacter(mainCharacter) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET mainCharacter = ? WHERE id = ?`;
      db.run(query, [mainCharacter, this.id], (err) => {
        if (err) {
          return reject(err);
        }
        this.mainCharacter = mainCharacter;
        resolve();
      });
    });
  }

  /**
   * Save the user to the database.
   * Inserts a new user or updates an existing one.
   * @returns {Promise<void>}
   */
  save() {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (id, username, discriminator, avatar, email, mfa_enabled, mainCharacter)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          username=excluded.username,
          discriminator=excluded.discriminator,
          avatar=excluded.avatar,
          email=excluded.email,
          mfa_enabled=excluded.mfa_enabled,
          mainCharacter=excluded.mainCharacter
      `;
      db.run(
        query,
        [
          this.id,
          this.username,
          this.discriminator,
          this.avatar,
          this.email,
          this.mfa_enabled ? 1 : 0, // Convert BOOLEAN to INTEGER
          this.mainCharacter,
        ],
        function (err) {
          if (err) {
            return reject(err);
          }
          resolve();
        },
      );
    });
  }

  /**
   * Find all users by their main character.
   * @param {string} mainCharacter - The main character to search for.
   * @returns {Promise<User[]>}
   */
  static findByMainCharacter(mainCharacter) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE mainCharacter = ?`;
      db.all(query, [mainCharacter], (err, rows) => {
        if (err) {
          return reject(err);
        }
        const users = rows.map((row) => new User(row));
        resolve(users);
      });
    });
  }
}

module.exports = User;
