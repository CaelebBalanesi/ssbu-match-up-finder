// routes/auth.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const config = require("../config"); // Ensure config is imported

// Discord Authentication Route
router.get("/discord", passport.authenticate("discord"));

// Discord Callback Route
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/auth/failed",
  }),
  (req, res, next) => {
    console.log(`[AUTHENTICATED] User: ${req.user.username}`);
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return next(err);
      }
      res.redirect(`${config.CORS_ORIGIN}/auth/success`);
    });
  },
);

// Authentication Failure Route
router.get("/auth/failed", (req, res) => {
  res.status(401).send("Authentication Failed");
});

// Authentication Status Route
router.get("/status", (req, res) => {
  console.log("Session ID:", req.sessionID);
  console.log("Session Data:", req.session);
  console.log("User:", req.user);
  console.log("Authenticated:", req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout Route
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(`${config.CORS_ORIGIN}/`);
  });
});

module.exports = router;
