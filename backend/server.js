// server.js
const http = require("http");
const socketIO = require("socket.io");
const { app, sessionMiddleware } = require("./app");
const socketHandler = require("./sockets/lobbySocket");
const config = require("./config");

const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Attach session middleware for Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

socketHandler(io);

const port = config.PORT;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
