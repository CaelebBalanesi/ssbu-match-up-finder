// routes/lobbies.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const Lobby = require("../models/Lobby");

// In-memory lobbies object
const lobbies = {};

// Create a new Lobby
router.post("/", authenticateToken, (req, res) => {
  const {
    smash_lobby_id,
    smash_lobby_password,
    host_character,
    seeking_characters,
  } = req.body;
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

  console.log(`[NEW LOBBY](${lobby.id})
Created at: ${lobby.created_time}
Creator Name: ${host_username}
Creator Character: ${host_character}
Seeking: ${JSON.stringify(seeking_characters)}
`);

  res.status(201).json({ id: lobby.id });
});

// Get all lobbies
router.get("/", authenticateToken, (req, res) => {
  console.log(`[LOBBY] Requested all lobbies`);
  const lobbyList = Object.values(lobbies).map((lobby) => {
    const isFull = lobby.users.length >= lobby.maxUsers;
    return {
      ...lobby,
      full: isFull,
    };
  });
  res.json(lobbyList);
});

// Get a single lobby by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  console.log(`[LOBBY] Requested Lobby ID: ${id}`);
  const lobby = lobbies[id];
  if (!lobby) {
    return res.status(404).json({ error: "Lobby not found" });
  }
  const isFull = lobby.users.length >= lobby.maxUsers;
  res.json({
    ...lobby,
    full: isFull,
  });
});

// Update a lobby
router.put("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    smash_lobby_id,
    smash_lobby_password,
    host_character,
    seeking_characters,
  } = req.body;
  const lobby = lobbies[id];
  if (!lobby) {
    return res.status(404).json({ error: "Lobby not found" });
  }
  if (lobby.host_username !== req.user.username) {
    return res
      .status(403)
      .json({ error: "You are not the host of this lobby" });
  }
  lobby.smash_lobby_id = smash_lobby_id;
  lobby.smash_lobby_password = smash_lobby_password;
  lobby.host_character = host_character;
  lobby.seeking_characters = seeking_characters;
  lobby.created_time = new Date().toISOString();

  console.log(`[LOBBY] Updated lobby ID: ${id}`);
  res.json({ message: "Lobby updated" });
});

// Delete a lobby
router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const lobby = lobbies[id];
  if (!lobby) {
    return res.status(404).json({ error: "Lobby not found" });
  }
  if (lobby.host_username !== req.user.username) {
    return res
      .status(403)
      .json({ error: "You are not the host of this lobby" });
  }
  delete lobbies[id];
  console.log(`[LOBBY] Deleted lobby ID: ${id}`);
  res.json({ message: "Lobby deleted" });
});

module.exports = {
  router,
  lobbies,
};
