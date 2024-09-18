const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');

// Create server and sockets
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

// Lobbies object to store lobby user count
const lobbies = {};

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Create a new Lobby
app.post('/lobbies', (req, res) => {
  // Pull data into variables from request body
  const { id, host_username, host_session_id, smash_lobby_id, smash_lobby_password, host_character, seeking_characters, created_time } = req.body;

  db.run(
    `INSERT INTO lobbies (id, host_username, host_session_id, smash_lobby_id, smash_lobby_password, host_character, seeking_characters, created_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, host_username, host_session_id, smash_lobby_id, smash_lobby_password, JSON.stringify(host_character), JSON.stringify(seeking_characters), created_time],
    function (err) {
      if (err) {  
        console.log(`[NEW LOBBY](ERROR) ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[NEW LOBBY](${id})
      Created at: ${created_time}
      Creator Name: ${host_username}
      Creator Character: ${host_character}
      Seeking: ${seeking_characters}
      `);

      // Create lobby entry
      lobbies[id] = { users: [], maxUsers: 2 };
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Get all lobbies
app.get('/lobbies', (req, res) => {
  console.log(`[LOBBY] Requested all lobbies`);
  // Query database for all lobbies
  db.all(`SELECT * FROM lobbies`, [], (err, rows) => {
    if (err) {
      console.log(`[LOBBY](ERROR) ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.map(row => {
      const lobbyId = row.id;
      // Create lobby entry if it doesn't exist
      if (!lobbies[lobbyId]) {
        lobbies[lobbyId] = { users: [], maxUsers: 2 };
      }
      console.log(`Lobby amount: ${lobbies[lobbyId].users.length}`);
      const isFull = lobbies[lobbyId].users.length >= 2;
      return {
        ...row,
        host_character: JSON.parse(row.host_character),
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
    const lobby = lobbies[id] || { users: [], maxUsers: 2 };
    console.log(`Lobby amount: ${lobby.users.length}`);
    const isFull = lobbies[id].users.length >= 2;
    res.json({
      ...row,
      host_character: JSON.parse(row.host_character),
      seeking_characters: JSON.parse(row.seeking_characters),
      full: isFull
    });
  });
});

// Update a lobby
app.put('/lobbies/:id', (req, res) => {
  const { id } = req.params;
  const { host_username, smash_lobby_id, smash_lobby_password, host_character, seeking_characters, created_time } = req.body;
  console.log(`[LOBBY] Updated lobby ID: ${id}`);
  console.log(req.body);
  db.run(
    `UPDATE lobbies
     SET host_username = ?, smash_lobby_id = ?, smash_lobby_password = ?, host_character = ?, seeking_characters = ?, created_time = ?
     WHERE id = ?`,
    [host_username, smash_lobby_id, smash_lobby_password, JSON.stringify(host_character), JSON.stringify(seeking_characters), created_time, id],
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

    if (lobbies[lobbyId].users.length >= lobbies[lobbyId].maxUsers) {
      console.log(`[LOBBY FULL] ${username} rejected from lobby ID: ${lobbyId}`);
      socket.emit('lobbyFull', { message: 'This lobby is full.' });
      return;
    }

    console.log(`[JOINED LOBBY] ${username} joined lobby ID: ${lobbyId}`);
    lobbies[lobbyId].users.push({ userId: socket.id, username: username });
    socket.join(lobbyId);

    // Notify others in the lobby
    socket.to(lobbyId).emit('userJoined', { username: username });

    // Notify user of successful join
    socket.emit('joinedLobby', { lobbyId: lobbyId, users: lobbies[lobbyId].users });
  });

  socket.on('message', (data) => {
    const { lobbyId, message, username } = data;
    console.log(`[MESSAGE] Lobby ID: ${lobbyId}
    ${username}: ${message}
    `);
    io.to(lobbyId).emit('message', { lobbyId: lobbyId, content: message, username: username });
  });

  socket.on('disconnectFromLobby', () => {
    Object.keys(lobbies).forEach(lobbyId => {
        const index = lobbies[lobbyId].users.findIndex(user => user.userId === socket.id);
        if (index !== -1) {
          const { username } = lobbies[lobbyId].users[index];
          lobbies[lobbyId].users.splice(index, 1);
          console.log(`[DISCONNECT] ${username} disconnected from lobby ID: ${lobbyId}`);
          socket.to(lobbyId).emit('userLeft', { username: username });
        }
    });
  });
});

port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
