// /sockets/socketHandler.js
const User = require("../models/User");
const { lobbies } = require("../routes/lobbies");
const uuid = require("uuid");

module.exports = (io) => {
  io.on("connection", async (socket) => {
    try {
      const session = socket.request.session;
      const userId = session?.passport?.user;

      // Authenticate user
      if (userId) {
        const user = await User.findOne({ id: userId });
        if (user) {
          console.log(`User connected: ${user.username}`);

          // Emit user data to the frontend
          socket.emit("userData", user);

          // Initialize socket properties
          socket.lobbyId = null;

          // Event: Join Lobby
          socket.on("joinLobby", ({ lobbyId }) => {
            const username = user.username;
            const lobby = lobbies[lobbyId];

            if (!lobby) {
              console.log(`[ERROR] Lobby not found: Lobby ID: ${lobbyId}`);
              socket.emit("lobbyNotFound", { message: "Lobby not found." });
              return;
            }

            if (lobby.users.length >= lobby.maxUsers) {
              console.log(
                `[LOBBY FULL] User: ${username} rejected from Lobby ID: ${lobbyId}`,
              );
              socket.emit("lobbyFull", { message: "This lobby is full." });
              return;
            }

            console.log(
              `[LOBBY JOINED] User: ${username} joined Lobby ID: ${lobbyId}`,
            );
            lobby.users.push({ userId: socket.id, username });
            socket.join(lobbyId);
            socket.lobbyId = lobbyId;

            socket.to(lobbyId).emit("userJoined", { username });
            socket.emit("joinedLobby", { lobbyId, users: lobby.users });
          });

          // Event: Message
          socket.on("message", ({ lobbyId, message, avatarURL }) => {
            console.log(
              `Message event received on server for Socket ID: ${socket.id}`,
            );
            console.log(`LobbyID: ${lobbyId}, Message: ${message}`);
            const username = user.username;
            console.log(`Profile Pic: ${avatarURL}`);
            if (!lobbyId || !message || !avatarURL) return;

            console.log(
              `[MESSAGE RECEIVED] User: ${username}, Lobby ID: ${lobbyId}, Message: ${message}`,
            );
            console.log(`Profile Pic: ${avatarURL}`);
            io.to(lobbyId).emit("message", {
              lobbyId,
              content: message,
              username,
              avatarURL: avatarURL,
            });
          });

          socket.on("updateLobby", ({ lobbyId, lobby }) => {
            console.log(`Lobby ${lobbyId} Updating`);

            if (!lobby) return;

            lobbies[lobbyId] = lobby;
            console.log(`Lobby ${lobbyId} Updated`);

            io.to(lobbyId).emit("updateLobby", { lobbyId, lobby: lobby });
          });

          // Event: Leave Lobby
          socket.on("leaveLobby", () => {
            const lobbyId = socket.lobbyId;
            const username = user.username;

            if (lobbyId && lobbies[lobbyId]) {
              const lobby = lobbies[lobbyId];
              const userIndex = lobby.users.findIndex(
                (u) => u.userId === socket.id,
              );

              if (userIndex !== -1) {
                lobby.users.splice(userIndex, 1);
                socket.leave(lobbyId);
                socket.to(lobbyId).emit("userLeft", { username });

                if (username === lobby.host_username) {
                  delete lobbies[lobbyId];
                  io.to(lobbyId).emit("lobbyClosed", {
                    message: "The host has left. This lobby is now closed.",
                  });
                }
              }
            }
            socket.lobbyId = null;
          });

          // Event: Disconnect
          socket.on("disconnect", (reason) => {
            const lobbyId = socket.lobbyId;
            const username = user.username;

            if (lobbyId && lobbies[lobbyId]) {
              const lobby = lobbies[lobbyId];
              const userIndex = lobby.users.findIndex(
                (u) => u.userId === socket.id,
              );

              if (userIndex !== -1) {
                lobby.users.splice(userIndex, 1);
                socket.to(lobbyId).emit("userLeft", { username });

                if (username === lobby.host_username) {
                  delete lobbies[lobbyId];
                  io.to(lobbyId).emit("lobbyClosed", {
                    message: "The host has left. This lobby is now closed.",
                  });
                }
              }
            }
            socket.lobbyId = null;
            console.log(
              `[DISCONNECT] User: ${username}, Socket ID: ${socket.id}, Reason: ${reason}`,
            );
          });
        } else {
          console.log(`User not found in database: ${userId}`);
          socket.emit("unauthorized");
          socket.disconnect();
        }
      } else {
        console.log("Unauthenticated user tried to connect");
        socket.emit("unauthorized");
        socket.disconnect();
      }

      // Error handling
      socket.on("error", (error) => {
        console.error("Socket.IO error:", error);
        socket.emit("error", "Internal server error");
        socket.disconnect();
      });
    } catch (err) {
      console.error("Error in Socket.IO connection:", err);
      socket.emit("error", "Internal server error");
      socket.disconnect();
    }
  });
};
