const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const lobbies = {};

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

port = 3000;

// Create a new lobby
app.post('/lobbies', (req, res) => {
  const { id, username, lobby_id, lobby_password, user_character, seeking_characters, created_time, sessionId } = req.body;

  console.log(`[NEW LOBBY](${id})
  Created at: ${created_time}
  Creator Name: ${username}
  Creator Character: ${user_character}
  Seeking: ${seeking_characters}
  `);

  db.run(
    `INSERT INTO lobbies (id, username, lobby_id, lobby_password, user_character, seeking_characters, created_time, sessionId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, username, lobby_id, lobby_password, user_character, JSON.stringify(seeking_characters), created_time, sessionId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      lobbies[lobby_id] = { users: [], maxUsers: 2 };
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Get all lobbies
app.get('/lobbies', (req, res) => {
  console.log(`[LOBBY] Requested all lobbies`);
  db.all(`SELECT * FROM lobbies`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.map(row => {
      const lobbyId = row.lobby_id;
      const lobby = lobbies[lobbyId] || { users: [], maxUsers: 2 };
      const isFull = lobby.users.length >= lobby.maxUsers;
      return {
        ...row,
        seeking_characters: JSON.parse(row.seeking_characters),
        full: isFull
      };
    }));
  });
});

// Get a single lobby by ID
app.get('/lobbies/:id', (req, res) => {
  const { id } = req.params;
  console.log(`[LOBBY] Requested Lobby ID: ${id}`);
  db.get(`SELECT * FROM lobbies WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    const lobbyId = row.lobby_id;
    const lobby = lobbies[lobbyId] || { users: [], maxUsers: 2 };
    const isFull = lobby.users.length >= lobby.maxUsers;
    res.json({
      ...row,
      seeking_characters: JSON.parse(row.seeking_characters),
      full: isFull
    });
  });
});

// Update a lobby
app.put('/lobbies/:id', (req, res) => {
  const { id } = req.params;
  const { username, lobby_id, lobby_password, user_character, seeking_characters, created_time } = req.body;
  console.log(`[LOBBY] Updated lobby ID: ${id}`);
  console.log(req.body);
  db.run(
    `UPDATE lobbies
     SET username = ?, lobby_id = ?, lobby_password = ?, user_character = ?, seeking_characters = ?, created_time = ?
     WHERE id = ?`,
    [username, lobby_id, lobby_password, user_character, JSON.stringify(seeking_characters), created_time, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Lobby not found' });
      }
      res.json({ message: 'Lobby updated' });
    }
  );
});

// Delete a lobby
app.delete('/lobbies/:id', (req, res) => {
  const { id } = req.params;
  console.log(`[LOBBY] Deleted lobby ID: ${id}`);
  db.run(`DELETE FROM lobbies WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    const lobby = Object.keys(lobbies).find(lobbyId => lobbies[lobbyId].id === id);
    if (lobby) delete lobbies[lobby];
    res.json({ message: 'Lobby deleted' });
  });
});

io.on('connection', (socket) => {
  let sessionId = socket.handshake.query.sessionId;
  if (sessionId == 'null') {
    sessionId = uuid.v4();
    socket.emit('sessionId', sessionId);
  }
  socket.sessionId = sessionId;
  console.log(`[CONNECTION] New session ID: ${sessionId}`);

  socket.on('joinLobby', (data) => {
    const { lobbyId, username } = data;
    const lobby = lobbies[lobbyId] || (lobbies[lobbyId] = { users: [], maxUsers: 2 });

    if (lobby.users.length >= lobby.maxUsers) {
      console.log(`[LOBBY FULL] ${username} rejected from lobby ID: ${lobbyId}`);
      socket.emit('lobbyFull', { message: 'This lobby is full.' });
      return;
    }

    console.log(`[JOINED LOBBY] ${username} joined lobby ID: ${lobbyId}`);
    lobby.users.push({ userId: socket.id, username: username });
    socket.join(lobbyId);

    // Notify others in the lobby
    socket.to(lobbyId).emit('userJoined', { username: username });

    // Notify user of successful join
    socket.emit('joinedLobby', { lobbyId: lobbyId, users: lobby.users });
  });

  socket.on('message', (data) => {
    const { lobbyId, message, username } = data;
    console.log(`[MESSAGE] Lobby ID: ${lobbyId}
    ${username}: ${message}
    `);
    io.to(lobbyId).emit('message', { lobbyId: lobbyId, content: message, username: username });
  });

  socket.on('disconnect', () => {
    Object.keys(lobbies).forEach(lobbyId => {
        const lobby = lobbies[lobbyId];
        const index = lobby.users.findIndex(user => user.userId === socket.id);
        if (index !== -1) {
            const [user] = lobby.users.splice(index, 1);
            console.log(`[DISCONNECT] ${user.username} left Lobby ID: ${lobby.id}`);
            socket.to(lobbyId).emit('userLeft', { userId: socket.id, username: user.username });
        }
    });
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});