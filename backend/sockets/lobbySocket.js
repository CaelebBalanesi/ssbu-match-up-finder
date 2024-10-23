// sockets/lobbySocket.js
const { lobbies } = require("../routes/lobbies");
const uuid = require("uuid");

module.exports = (socket, io) => {
  // Session handling
  let sessionId = socket.handshake.query.sessionId;

  if (!sessionId || sessionId === "null") {
    sessionId = uuid.v4();
    socket.emit("sessionId", sessionId);
  }

  socket.sessionId = sessionId;
  console.log(`[CONNECTION] New session ID: ${sessionId}`);

  // Event: Join Lobby
  socket.on("joinLobby", (data) => {
    const { lobbyId, username } = data;
    const lobby = lobbies[lobbyId];

    if (!lobby) {
      socket.emit("lobbyNotFound", { message: "Lobby not found." });
      return;
    }

    if (lobby.users.length >= lobby.maxUsers) {
      console.log(
        `[LOBBY FULL] ${username} rejected from lobby ID: ${lobbyId}`,
      );
      socket.emit("lobbyFull", { message: "This lobby is full." });
      return;
    }

    console.log(`[JOINED LOBBY] ${username} joined lobby ID: ${lobbyId}`);
    lobby.users.push({ userId: socket.id, username });
    socket.join(lobbyId);

    // Notify others in the lobby
    socket.to(lobbyId).emit("userJoined", { username });

    // Notify user of successful join
    socket.emit("joinedLobby", { lobbyId, users: lobby.users });
  });

  // Event: Message
  socket.on("message", (data) => {
    const { lobbyId, message, username } = data;
    console.log(`[MESSAGE] Lobby ID: ${lobbyId}\n${username}: ${message}`);
    io.to(lobbyId).emit("message", { lobbyId, content: message, username });
  });

  // Event: Disconnect from Lobby
  socket.on("disconnectFromLobby", () => {
    Object.keys(lobbies).forEach((lobbyId) => {
      const lobby = lobbies[lobbyId];
      const index = lobby.users.findIndex((user) => user.userId === socket.id);
      if (index !== -1) {
        const { username } = lobby.users[index];
        lobby.users.splice(index, 1);
        console.log(
          `[DISCONNECT] ${username} disconnected from lobby ID: ${lobbyId}`,
        );
        socket.to(lobbyId).emit("userLeft", { username });
      }
    });
  });
};
