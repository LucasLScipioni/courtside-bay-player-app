const { v4: uuidv4 } = require("uuid");

let session = createFreshSession();

function createFreshSession() {
  return {
    gameId: uuidv4(),
    gameType: "",
    gameState: "lobby",
    bayId: process.env.BAY_ID || "bay_001",
    gameWinner: null,
    noContest: false,
    hotSeat: false,
    results: [],
    players: [],
  };
}

function getSession() {
  return { ...session, players: session.players.map((p) => ({ ...p })) };
}

function getPlayer(playerId) {
  return session.players.find((p) => p.playerId === playerId) || null;
}

function addPlayer() {
  if (session.gameState !== "lobby") {
    throw new Error("Cannot add players outside of lobby");
  }

  const isHost = session.players.length === 0;
  const order = session.players.length;
  const playerId = `p${order + 1}_${uuidv4().slice(0, 6)}`;

  const player = {
    playerId,
    name: "",
    characterId: "",
    order,
    isHost,
    ready: false,
    wins: 0,
    winStreak: 0,
  };

  session.players.push(player);
  return player;
}

function updatePlayer(playerId, { name, characterId }) {
  const player = session.players.find((p) => p.playerId === playerId);
  if (!player) throw new Error("Player not found");
  if (session.gameState !== "lobby") {
    throw new Error("Cannot update players outside of lobby");
  }

  if (name !== undefined) player.name = name;
  if (characterId !== undefined) player.characterId = characterId;

  player.ready = player.name.trim() !== "" && player.characterId !== "";
  return player;
}

function removePlayer(playerId) {
  if (session.gameState !== "lobby") {
    throw new Error("Cannot remove players outside of lobby");
  }

  const index = session.players.findIndex((p) => p.playerId === playerId);
  if (index === -1) throw new Error("Player not found");

  const wasHost = session.players[index].isHost;
  session.players.splice(index, 1);

  // Re-assign orders sequentially
  session.players.forEach((p, i) => {
    p.order = i;
  });

  // Reassign host to first remaining player if needed
  if (wasHost && session.players.length > 0) {
    session.players[0].isHost = true;
  }
}

function transferHost(playerId) {
  const target = session.players.find((p) => p.playerId === playerId);
  if (!target) throw new Error("Player not found");

  session.players.forEach((p) => {
    p.isHost = false;
  });
  target.isHost = true;
}

function setHotSeat(value) {
  if (session.gameState !== "lobby") {
    throw new Error("Cannot change settings outside of lobby");
  }
  session.hotSeat = !!value;
}

function selectGame(gameType) {
  if (session.gameState !== "lobby") {
    throw new Error("Cannot select game outside of lobby");
  }
  session.gameType = gameType;
}

function startGame() {
  if (session.gameState !== "lobby") {
    throw new Error("Game is not in lobby state");
  }
  if (!session.gameType) {
    throw new Error("No game type selected");
  }

  const readyCount = session.players.filter((p) => p.ready).length;
  if (readyCount < 2) {
    throw new Error("Need at least 2 ready players to start");
  }

  session.gameState = "running";
}

function endGame({ noContest = false, results = [] } = {}) {
  if (session.gameState !== "running") {
    throw new Error("Game is not running");
  }

  session.gameState = "finished";

  if (noContest) {
    session.noContest = true;
    session.gameWinner = null;
    session.results = [];
    return;
  }

  session.noContest = false;
  session.results = results;

  const winner = results.find((r) => r.position === 1);
  if (winner) {
    session.gameWinner = winner.playerId;

    const winnerPlayer = session.players.find(
      (p) => p.playerId === winner.playerId,
    );
    if (winnerPlayer) {
      winnerPlayer.wins += 1;
      winnerPlayer.winStreak += 1;
    }

    session.players.forEach((p) => {
      if (p.playerId !== winner.playerId) {
        p.winStreak = 0;
      }
    });

    // King of the Court: winner becomes new host
    if (session.hotSeat) {
      transferHost(winner.playerId);
    }
  }
}

function resetGame() {
  const keptPlayers = session.players.map((p) => ({
    ...p,
    ready: p.name.trim() !== "" && p.characterId !== "",
  }));

  session.gameId = uuidv4();
  session.gameType = "";
  session.gameState = "lobby";
  session.gameWinner = null;
  session.noContest = false;
  session.results = [];
  session.players = keptPlayers;
}

function fullReset() {
  session = createFreshSession();
}

module.exports = {
  getSession,
  getPlayer,
  addPlayer,
  updatePlayer,
  removePlayer,
  transferHost,
  setHotSeat,
  selectGame,
  startGame,
  endGame,
  resetGame,
  fullReset,
};
