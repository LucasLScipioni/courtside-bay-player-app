# Courtside Bay — Full Project Context

This file is the complete knowledge base for the Courtside Bay Player App project.
Use it to onboard a new AI assistant with full context of what was built, why, and where it's going.

---

## What Is Courtside Bay?

A self-contained basketball bay experience. Players walk into a physical room ("bay"), scan a QR code with their phone, join the game through the web app, and watch the action unfold on large displays powered by Unreal Engine. A camera above the hoop detects every shot and drives the game.

The full ecosystem runs on **local WiFi** — no cloud, no internet required during gameplay.

---

## The 4-App Ecosystem

| App | Stack | Machine | Responsibility |
|-----|-------|---------|---------------|
| **Web App** (this repo) | Vite + React + TypeScript + Tailwind | Linux laptop | Player-facing mobile web app — onboarding, lobby, results |
| **Game Controller** (this repo) | Node.js + Express + ws | Linux laptop | Central hub — owns GameSession state, relays all messages |
| **Python Tracking** | Python + ResNet18 + Allied Vision SDK | Linux laptop | Camera AI — detects MAKE/MISS shots from the hoop camera |
| **Unreal Engine** | Unreal Engine 5 | Windows laptop | Cinematic game visuals, knockout rules, display output |

**This repository contains only the Web App and Game Controller.**

All four apps communicate through **2 message types only**:
1. `GAME_SESSION` — live state object, broadcast via WebSocket on every mutation
2. `SHOT_EVENT` — `{ gameId, shotResult: "MAKE" | "MISS" }` from tracking → Game Controller → Unreal

---

## Architecture: The Game Controller as Central Hub

```
Players' phones ──HTTP/WS──► Game Controller (port 3001)
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
           Web App (port 3000)   Unreal (Windows)   Python Tracking
```

The Game Controller:
- Owns the **GameSession** as live in-memory state
- Broadcasts the full GameSession object to all WebSocket clients on every mutation
- Relays Shot Events from Python Tracking to Unreal
- Exposes an HTTP REST API consumed by the Web App
- Serves an Admin override page at `/admin` route (within the React app)

**Critical rule:** The Game Controller contains zero game logic. It's a relay. Unreal owns all knockout rules.

---

## GameSession — The Single Source of Truth

```json
{
  "gameId": "uuid-generated",
  "gameType": "",
  "gameState": "lobby",
  "bayId": "bay_001",
  "gameWinner": null,
  "noContest": false,
  "results": [],
  "players": [
    {
      "playerId": "p1_abc123",
      "name": "",
      "characterId": "",
      "order": 0,
      "isHost": true,
      "ready": false,
      "wins": 0,
      "winStreak": 0
    }
  ]
}
```

### gameState lifecycle

```
"lobby" (gameType: "")          → players joining, host hasn't chosen a game yet
"lobby" (gameType: "knockout")  → host selected a game, ready to start
"running"                       → game is active
"finished"                      → game ended, results available
     ↓ reset
"lobby" (gameType: "")          → players kept with their stats, clean game state
```

### gameType

- Empty string `""` = no game selected yet (on lobby screen)
- `"knockout"` = currently the only implemented game
- Future games will add new values here. The architecture supports any gameType dynamically.

### Player object

| Field | Type | Description |
|-------|------|-------------|
| `playerId` | string | Unique ID (e.g. `p1_abc123`), saved in browser localStorage |
| `name` | string | Player's display name |
| `characterId` | string | e.g. `"char_01"` through `"char_06"` |
| `order` | number | Join order (0 = first = host) |
| `isHost` | boolean | Only the first player to join |
| `ready` | boolean | True when name + character are both set |
| `wins` | number | Total wins accumulated across games in this session |
| `winStreak` | number | Current consecutive wins (resets to 0 on loss) |

### End Game payload (sent to POST /api/game/end)

Normal result:
```json
{
  "noContest": false,
  "results": [
    { "playerId": "p1_abc123", "position": 1, "makes": 5, "misses": 1 },
    { "playerId": "p2_def456", "position": 2, "makes": 3, "misses": 2 }
  ]
}
```

No Contest (game cancelled, no stats impact):
```json
{
  "noContest": true,
  "results": []
}
```

---

## Game Controller API Reference

All endpoints are on `http://[LINUX-IP]:3001`. CORS is open.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/game-session` | — | Returns current GameSession |
| `POST` | `/api/players` | — | Registers a placeholder player, returns `{ playerId }` |
| `PUT` | `/api/players/:playerId` | `{ name, characterId }` | Updates player info, sets `ready: true` |
| `PUT` | `/api/game/select` | `{ gameType }` | Host selects a game mode |
| `POST` | `/api/game/start` | — | Starts the game (requires gameType + ≥2 ready players) |
| `POST` | `/api/game/end` | `{ noContest, results }` | Ends game with results or no contest |
| `POST` | `/api/game/reset` | — | Resets to lobby, keeps players + stats |
| `POST` | `/api/game/full-reset` | — | Wipes everything, clean slate |

### WebSocket

Connect to `ws://[LINUX-IP]:3001`.

On connect: server immediately sends the current GameSession.

Incoming messages (from client):
```json
{ "type": "SHOT_EVENT", "data": { "gameId": "...", "shotResult": "MAKE" } }
```

Outgoing broadcasts (to all clients):
```json
{ "type": "GAME_SESSION", "data": { ...fullGameSessionObject } }
{ "type": "SHOT_EVENT", "data": { "gameId": "...", "shotResult": "MAKE" } }
```

---

## Web App — Screens & Routing

| Route | Component | Who sees it |
|-------|-----------|-------------|
| `/` | `PlayerInfo` | All players — registration screen |
| `/lobby` | `Lobby` | All players — waiting room |
| `/game` | `Game` | All players — static "in progress" screen |
| `/results` | `Results` | All players — leaderboard / no contest |
| `/admin` | `Admin` | Staff only — game control panel |

### Navigation / Redirect Logic

The app uses `gameState` + localStorage `playerId` to redirect users to the correct screen on any page load or refresh:

```
No playerId in localStorage          → /
playerId exists, player not ready    → /
gameState = "lobby"                  → /lobby (if player ready)
gameState = "running"                → /game
gameState = "finished"               → /results
```

### Key behaviors

- **First player to join** = host (`isHost: true`, `order: 0`)
- **Reconnection**: localStorage stores only `playerId`. On any page load, GET /api/game-session recovers full state.
- **Real-time updates**: `useGameSession` hook maintains live state via WebSocket. Every page observes `gameState` and redirects automatically when it changes.
- **Host vs Players**: Host sees 2 tabs in Lobby (Players + Games). Players see only the player list.
- **Start Game**: Only host can trigger. Requires `gameType !== ""` and ≥2 ready players.
- **Return to Lobby**: Only host can reset after a finished game.

### Characters (current — Phase 1 placeholders)

Characters are placeholder emoji + name combos. Real assets (matching Unreal characters) to be provided by the Unreal dev and swapped in for Phase 2.

| ID | Name | Emoji |
|----|------|-------|
| `char_01` | Blaze | 🔥 |
| `char_02` | Frost | ❄️ |
| `char_03` | Thunder | ⚡ |
| `char_04` | Shadow | 🌑 |
| `char_05` | Viper | 🐍 |
| `char_06` | Nova | ✨ |

Characters are defined in `web-app/src/lib/characters.ts`.

---

## Repository Structure

```
courtside-bay-player-app/
├── web-app/
│   ├── src/
│   │   ├── main.tsx                    # Entry — BrowserRouter wraps App
│   │   ├── App.tsx                     # React Router — 5 routes
│   │   ├── pages/
│   │   │   ├── PlayerInfo.tsx          # / — register + name + character
│   │   │   ├── Lobby.tsx               # /lobby — player list, host tabs, start
│   │   │   ├── Game.tsx                # /game — static "in progress" screen
│   │   │   ├── Results.tsx             # /results — leaderboard or no contest
│   │   │   └── Admin.tsx               # /admin — staff control panel
│   │   ├── components/
│   │   │   ├── CharacterGrid.tsx       # 6 character cards, selectable
│   │   │   ├── PlayerList.tsx          # Player list with status/wins/streak
│   │   │   └── GameSelector.tsx        # Game mode cards (knockout + coming soon)
│   │   ├── hooks/
│   │   │   └── useGameSession.ts       # WebSocket hook — live GameSession state
│   │   └── lib/
│   │       ├── types.ts                # TypeScript interfaces for all contracts
│   │       ├── api.ts                  # HTTP client functions to Game Controller
│   │       └── characters.ts           # Character definitions (id, name, emoji)
│   ├── vite.config.ts                  # Port 3000, Tailwind plugin
│   └── package.json
├── game-controller/
│   └── src/
│       ├── index.js                    # Express server + WebSocket server
│       └── game-session.js             # In-memory state + mutation functions
├── ecosystem.config.js                 # PM2 — auto-start both services on boot
├── .gitignore
└── README.md                           # Setup guide (beginner-friendly)
```

---

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Frontend framework | Vite + React (SPA) | No SSR needed, everything is client-side real-time |
| Styling | Tailwind CSS v4 | Utility-first, fast to build, easy to maintain |
| Routing | react-router-dom v7 | Standard SPA routing |
| Game Controller | Node.js + Express + ws | Lightweight, ~100 lines, no framework overhead |
| WebSocket | `ws` library (raw) | No overhead of Socket.IO, sufficient for this use case |
| Admin page | Route `/admin` in same React app | No separate project to maintain |
| State persistence | In-memory on server | No database needed for demo; localStorage on client for reconnection |
| Player ID format | `p{n}_{uuid6}` | Human-readable for debugging + unique |
| Game logic location | Unreal Engine only | Game Controller is a pure relay — zero game logic |

---

## Environment Variables

### web-app
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_CONTROLLER_URL` | `http://{same-hostname}:3001` | URL of the Game Controller |

If not set, the web app auto-derives the URL from the current hostname (port 3001). This means on local dev (`localhost:3000`), it connects to `localhost:3001`. On the venue WiFi, players' phones automatically connect to the right IP.

### game-controller
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `BAY_ID` | `"bay_001"` | Bay identifier sent in GameSession |

---

## Phase 1 — What's Built (Current State)

Everything functional, minimal styling (dark background, Tailwind utility classes).

- ✅ Game Controller with full API, WebSocket, broadcast, admin override
- ✅ PlayerInfo screen — register, name input, character selection, reconnection
- ✅ Lobby screen — real-time player list, host tabs (Players + Games), Start button
- ✅ Game screen — static "in progress" display
- ✅ Results screen — leaderboard with positions/makes/misses, No Contest mode, winner highlight
- ✅ Admin panel — Shot Override (MAKE/MISS), End Game Builder with position reordering, No Contest checkbox, Reset controls, live JSON debug
- ✅ Auto-redirect based on gameState from any screen
- ✅ Reconnection via localStorage playerId
- ✅ Wins and winStreak accumulate across games in a session
- ✅ PM2 config for production boot
- ✅ README for non-developer setup

---

## Phase 2 — What Needs to Be Built (Polish & Vision)

**The phone is not a form. It's a game controller.**

Phase 2 transforms Phase 1's raw functionality into a premium game experience that matches the Unreal Engine energy on the big screen.

### Visual Identity
- Dark mode as default (arena environment)
- Bold, impact typography — no serifs, no body text
- Orange as primary accent color (Courtside Bay brand)
- Character cards with real assets supplied by the Unreal dev (must match exactly)
- Every screen should feel like a menu from a AAA mobile game

### Animations & Motion
- Entry animation on PlayerInfo — something bold when the QR is scanned
- Character selection — animated cards, selected state with visual impact
- Lobby — each new player joining animates in (slide up, fade, etc.)
- Game start transition — cinematic, not a page redirect
- Results — podium reveal, number counters, winner celebration
- Recommended library: **Framer Motion**

### Screen-by-Screen Phase 2 Goals

**PlayerInfo (`/`)**
- Animated hero / brand intro on open
- Gamertag-style name input (custom styled, not a browser input)
- Character cards with real character art, hover/selection animations

**Lobby (`/lobby`)**
- Each player entry animates in as they join
- Win streak indicator — 🔥 flame/aura effect around players with streak ≥ 2
- Host's Start button pulses when ready to start
- Game mode cards with thumbnail art
- Status badges: "Ready" in green, "Setting up..." with shimmer

**Game (`/game`)**
- Not just static text — show the player's own character art
- Future ideas: live notifications when someone is eliminated, emoji reactions that appear on the big screen, player camera integration

**Results (`/results`)**
- Podium layout (1st on top, 2nd/3rd below)
- Animated position reveal (countdown style)
- Makes/misses shown with animated counters
- Personalized message: "You finished Xnd!" with character art
- Winner gets a celebration animation
- Share result button (screenshot / story) — future

### Future Features (Backlog)

**Multiple Game Modes**
Infrastructure is ready — `gameType` field accommodates any game. Games to add:
- `free-throw` — most makes in X shots
- `horse` — classic HORSE letter game
- `3point` — NBA-style 3-point contest

**Player Accounts (Cloud)**
Current state: in-memory per session.
Future: persistent player accounts with cloud storage.
- Login via QR on phone
- Stats persist across visits and bays
- Global leaderboard
- Social integration (share to Instagram stories, etc.)

**In-Game Screen Enhancements**
- Live status of all players (who's vulnerable, who's eliminated)
- Emoji reactions from phone that trigger on the Unreal display
- Player selfie → appears on their in-game character

**Bay Management**
- Multiple bays in the same venue
- `bayId` is already in GameSession — just needs routing logic
- Staff dashboard across all bays

### Tech Stack Additions for Phase 2
- **Framer Motion** — animations
- **Haptic feedback** — `navigator.vibrate()` on key moments (join, elimination, win)
- **UI sound effects** — subtle tap/join/start sounds
- **Skeleton screens** — replace "Loading..." with animated placeholders
- **Asset preloading** — preload all character images on mount to avoid flicker

---

## Networking (Production Setup)

On demo day, both laptops run on the same venue WiFi:

```
Players' phones ──WiFi──► Linux :3000 (web app)
                                 │ localhost
                          Linux :3001 (game controller)
                                 │ WiFi
                          Windows (Unreal Engine)
                                 │ HDMI
                          Display screen
```

### One-time venue setup
1. **Linux machine gets a static local IP** — set in router DHCP once
2. **QR code** encodes `http://[LINUX-IP]:3000` — regenerate only if IP changes
3. **Unreal** connects to `ws://[LINUX-IP]:3001` — only cross-machine WebSocket
4. **Venue WiFi** must allow device-to-device traffic (some venues block this — have a travel router as fallback)
5. **VITE_CONTROLLER_URL** env var is NOT needed — the web app auto-derives the IP from the browser's current hostname

---

## Known Issues & Notes

- **React StrictMode double-mount**: Fixed with `useRef` guard in `PlayerInfo.tsx`. The init function only runs once even though StrictMode mounts twice in dev.
- **Port conflict**: If port 3001 is taken, Game Controller won't start. Kill the conflicting process first.
- **Character assets**: Currently emoji placeholders. Real assets pending from Unreal dev.
- **startGame validation**: Requires `gameType !== ""` AND `readyCount >= 2`. The Admin panel has a "Quick Start" button that auto-selects knockout to bypass the game selection step for testing.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Bay** | The physical room/installation with the basketball hoop |
| **Host** | First player to scan the QR — controls game start, lobby reset |
| **GameSession** | The live state object that drives everything |
| **Game Controller** | Node.js server in this repo — the hub, not to be confused with a physical controller |
| **Tracking** | Python script that reads the camera and emits MAKE/MISS |
| **No Contest** | Game ended without results — no stats impact, all players see "No Contest" |
| **winStreak** | Consecutive wins for a player; resets to 0 on any loss |
| **ready** | A player with both `name` and `characterId` set |
