const express = require("express");
const router = express.Router();
const User = require("../models/User");

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(`[AUTHENTICATED] User: ${req.user.username}`);
    return next();
  }
  console.log(`[UNAUTHORIZED] Attempted access by unauthenticated user`);
  res.status(401).json({ error: "Unauthorized" });
}

// Endpoint to get all users with a specific main character
router.get("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const users = await User.findOne(id);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Endpoint to update a user's main character
router.post("/:id/main", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { mainCharacter } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.updateMainCharacter(mainCharacter);
    res.json({
      success: true,
      message: `Main character updated to ${mainCharacter}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update main character" });
  }
});

// Endpoint to get all users with a specific main character
router.get("/main/:character", isAuthenticated, async (req, res) => {
  const { character } = req.params;

  try {
    const users = await User.findByMainCharacter(character);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = {
  router,
};
