// routes/lobbies.js
const express = require("express");
const router = express.Router();
const Lobby = require("../models/Lobby");

// In-memory lobbies object
const lobbies = {};

// Simple Middleware to check for Authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(`[AUTHENTICATED] User: ${req.user.username}`);
    return next();
  }
  console.log(`[UNAUTHORIZED] Attempted access by unauthenticated user`);
  res.status(401).json({ error: "Unauthorized" });
}

// Create a new Lobby
router.post("/", isAuthenticated, (req, res) => {
  const {
    smash_lobby_id,
    smash_lobby_password,
    host_character,
    seeking_characters,
  } = req.body || {};

  // Validate required fields
  if (!smash_lobby_id || !smash_lobby_password || !host_character) {
    console.log(`[ERROR] Missing required lobby fields`);
    return res.status(400).json({ error: "Missing required lobby fields" });
  }

  const host_username = req.user.username;

  // Create lobby instance
  const lobby = new Lobby({
    host_username,
    smash_lobby_id,
    smash_lobby_password,
    host_character,
    seeking_characters,
  });

  lobbies[lobby.id] = lobby;

  console.log(`[NEW LOBBY](${lobby.id}) Host: ${lobby.host_username}`);

  res.status(201).json({ id: lobby.id });
});

// Get all lobbies
router.get("/", isAuthenticated, (req, res) => {
  console.log(`[LIST LOBBIES] User: ${req.user.username}`);
  const lobbyList = Object.values(lobbies).map((lobby) => {
    const isFull = lobby.users.length >= lobby.maxUsers;
    return {
      ...lobby,
      full: isFull,
    };
  });
  console.log(`[LOBBY LIST RESPONSE] Total Lobbies: ${lobbyList.length}`);
  res.json(lobbyList);
});

// Get a single lobby by ID
router.get("/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  console.log(`[REQUEST LOBBY] Lobby ID: ${id}`);

  const lobby = lobbies[id];
  if (!lobby) {
    console.log(`[ERROR] Lobby not found: Lobby ID: ${id}`);
    return res.status(404).json({ error: "Lobby not found" });
  }
  const isFull = lobby.users.length >= lobby.maxUsers;
  const response = {
    ...lobby,
    full: isFull,
  };
  console.log(
    `[LOBBY DETAILS RESPONSE] Lobby ID: ${id}, Data: ${JSON.stringify(response)}`,
  );
  res.json(response);
});

// Update a lobby
router.put("/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  const {
    smash_lobby_id,
    smash_lobby_password,
    host_character,
    seeking_characters,
  } = req.body || {}; // Default to empty object

  const lobby = lobbies[id];
  console.log(
    `[LOBBY UPDATE REQUEST] Lobby ID: ${id}, User: ${req.user.username}`,
  );

  if (!lobby) {
    console.log(`[ERROR] Lobby not found: Lobby ID: ${id}`);
    return res.status(404).json({ error: "Lobby not found" });
  }
  if (lobby.host_username !== req.user.username) {
    console.log(
      `[UNAUTHORIZED] User: ${req.user.username} is not the host of Lobby ID: ${id}`,
    );
    return res
      .status(403)
      .json({ error: "You are not the host of this lobby" });
  }

  // Validate required fields
  if (!smash_lobby_id || !smash_lobby_password || !host_character) {
    console.log(`[ERROR] Missing required lobby fields for update`);
    return res.status(400).json({ error: "Missing required lobby fields" });
  }

  lobby.smash_lobby_id = smash_lobby_id;
  lobby.smash_lobby_password = smash_lobby_password;
  lobby.host_character = host_character;
  lobby.seeking_characters = seeking_characters;
  lobby.created_time = new Date().toISOString();

  console.log(
    `[LOBBY UPDATED] Lobby ID: ${id}, New Data: ${JSON.stringify(lobby)}`,
  );
  res.json({ message: "Lobby updated" });
});

// Delete a lobby
router.delete("/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  const lobby = lobbies[id];
  console.log(
    `[LOBBY DELETE REQUEST] Lobby ID: ${id}, User: ${req.user.username}`,
  );

  if (!lobby) {
    console.log(`[ERROR] Lobby not found: Lobby ID: ${id}`);
    return res.status(404).json({ error: "Lobby not found" });
  }

  if (lobby.host_username !== req.user.username) {
    console.log(
      `[UNAUTHORIZED] User: ${req.user.username} is not the host of Lobby ID: ${id}`,
    );
    return res
      .status(403)
      .json({ error: "You are not the host of this lobby" });
  }
  delete lobbies[id];
  console.log(
    `[LOBBY DELETED] Lobby ID: ${id} has been deleted by User: ${req.user.username}`,
  );
  res.json({ message: "Lobby deleted" });
});

module.exports = {
  router,
  lobbies,
};
