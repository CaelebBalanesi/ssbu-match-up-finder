// sockets/index.js
const jwt = require("jsonwebtoken");
const lobbySocket = require("./lobbySocket");
const config = require("../config");

module.exports = (io) => {
  // Middleware for authenticating sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
      if (err) return next(new Error("Authentication error"));
      socket.user = user; // Attach user info to the socket
      next();
    });
  });

  // Handle new socket connections
  io.on("connection", (socket) => {
    console.log(`[CONNECTION] User connected: ${socket.user.username}`);
    lobbySocket(socket, io); // Pass socket to lobby event handlers
  });
};
