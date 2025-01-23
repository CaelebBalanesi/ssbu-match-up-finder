// app.js
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("./config/passport");
const config = require("./config");

// Import routes
const authRoutes = require("./routes/auth");
const { router: lobbyRoutes } = require("./routes/lobbies");
const { router: statsRoutes } = require("./routes/stats");
const { router: usersRoutes } = require("./routes/users");

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);

// Session middleware
const sessionMiddleware = session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    domain: ".smashups.games",
  },
});
app.use(sessionMiddleware);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/lobbies", lobbyRoutes);
app.use("/stats", statsRoutes);
app.use("/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("Alive");
});

module.exports = { app, sessionMiddleware };
