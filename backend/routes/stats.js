const express = require("express");
const router = express.Router();
const { lobbies } = require("../routes/lobbies");

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(`[AUTHENTICATED] User: ${req.user.username}`);
    return next();
  }
  console.log(`[UNAUTHORIZED] Attempted access by unauthenticated user`);
  res.status(401).json({ error: "Unauthorized" });
}

router.get("/amount", isAuthenticated, (req, res) => {
  const lobbyList = Object.values(lobbies).map((lobby) => {
    const isFull = lobby.users.length >= lobby.maxUsers;
    return {
      ...lobby,
      full: isFull,
    };
  });
  res.json({ amount: lobbyList.length });
});

module.exports = {
  router,
};
