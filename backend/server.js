// server.js
const http = require("http");
const socketIO = require("socket.io");
const app = require("./app");
const socketHandler = require("./sockets");
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

// Initialize Socket.IO handlers
socketHandler(io);

const port = config.PORT;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
