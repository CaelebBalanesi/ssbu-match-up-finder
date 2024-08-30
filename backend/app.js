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

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

port = 3000;

// Create a new lobby
app.post('/lobbies', (req, res) => {
  const { id, username, lobby_id, lobby_password, user_character, seeking_characters, created_time, sessionId } = req.body;
  db.run(
    `INSERT INTO lobbies (id, username, lobby_id, lobby_password, user_character, seeking_characters, created_time, sessionId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, username, lobby_id, lobby_password, user_character, JSON.stringify(seeking_characters), created_time, sessionId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Get all lobbies
app.get('/lobbies', (req, res) => {
  db.all(`SELECT * FROM lobbies`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.map(row => ({
      ...row,
      seeking_characters: JSON.parse(row.seeking_characters)
    })));
  });
});

// Get a single lobby by ID
app.get('/lobbies/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM lobbies WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    res.json({
      ...row,
      seeking_characters: JSON.parse(row.seeking_characters)
    });
  });
});

// Update a lobby
app.put('/lobbies/:id', (req, res) => {
  const { id } = req.params;
  const { username, lobby_id, lobby_password, user_character, seeking_characters, created_time } = req.body;
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
  db.run(`DELETE FROM lobbies WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    res.json({ message: 'Lobby deleted' });
  });
});

io.on('connection', (socket) => {
  let sessionId = socket.handshake.query.sessionId;
  if (!sessionId) {
    sessionId = uuid.v4();
    socket.emit('sessionId', sessionId);
  }
  socket.sessionId = sessionId;

  socket.on('joinLobby', (lobbyId) => {
    console.log(`User ${socket.id} with session id: ${socket.sessionId} joined lobby: ${lobbyId}`);
    socket.join(lobbyId);
  });

  socket.on('message', (data) => {
    const { lobbyId, message } = data;
    io.to(lobbyId).emit('message', message);
    console.log(`Message sent to lobby ${lobbyId}: ${message}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
