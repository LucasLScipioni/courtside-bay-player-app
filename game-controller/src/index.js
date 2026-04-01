const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const session = require("./game-session");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- WebSocket ---

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected (total: ${clients.size})`);

  ws.send(JSON.stringify({ type: "GAME_SESSION", data: session.getSession() }));

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === "SHOT_EVENT") {
        console.log(`[WS] Shot event: ${msg.data.shotResult}`);
        broadcast({ type: "SHOT_EVENT", data: msg.data });
      }
    } catch (err) {
      console.error("[WS] Invalid message:", err.message);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected (total: ${clients.size})`);
  });
});

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

function broadcastSession() {
  broadcast({ type: "GAME_SESSION", data: session.getSession() });
}

// --- HTTP API ---

app.get("/api/game-session", (req, res) => {
  res.json(session.getSession());
});

app.post("/api/players", (req, res) => {
  try {
    const player = session.addPlayer();
    broadcastSession();
    console.log(`[API] Player added: ${player.playerId}`);
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/players/:playerId", (req, res) => {
  try {
    const { name, characterId } = req.body;
    const player = session.updatePlayer(req.params.playerId, {
      name,
      characterId,
    });
    broadcastSession();
    console.log(`[API] Player updated: ${player.playerId} → ${player.name}`);
    res.json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/game/select", (req, res) => {
  try {
    const { gameType } = req.body;
    session.selectGame(gameType);
    broadcastSession();
    console.log(`[API] Game selected: ${gameType}`);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/game/start", (req, res) => {
  try {
    session.startGame();
    broadcastSession();
    console.log("[API] Game started");
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/game/end", (req, res) => {
  try {
    const { noContest, results } = req.body;
    session.endGame({ noContest, results });
    broadcastSession();
    console.log(`[API] Game ended (noContest: ${!!noContest})`);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/game/reset", (req, res) => {
  try {
    session.resetGame();
    broadcastSession();
    console.log("[API] Game reset → lobby");
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/game/full-reset", (req, res) => {
  try {
    session.fullReset();
    broadcastSession();
    console.log("[API] Full reset → clean slate");
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Start ---

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Game Controller] Running on port ${PORT}`);
  console.log(
    `[Game Controller] HTTP: http://localhost:${PORT}/api/game-session`,
  );
  console.log(`[Game Controller] WS:   ws://localhost:${PORT}`);
});
