// app.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// Import routes
const authRoutes = require("./routes/auth");
const { router: lobbyRoutes } = require("./routes/lobbies");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/lobbies", lobbyRoutes);

app.get("/", (req, res) => {
  res.send("Alive");
});

module.exports = app;
