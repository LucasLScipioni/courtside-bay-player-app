# Courtside Bay — Player App

Web app + server for the Courtside Bay system.
This repository contains **2 projects** that run together:

| Project | What it is | Port |
|---------|-----------|------|
| **game-controller** | Node.js server that manages the game state | `3001` |
| **web-app** | React app that runs on players' phones | `3000` |

---

## Prerequisites

Before anything, you need the following installed on your computer:

### 1. Node.js (version 20 or higher)

Download and install: https://nodejs.org/

To check if it's already installed, open a terminal and type:

```
node --version
```

If you see something like `v20.x.x` or `v22.x.x`, you're good to go.

### 2. A terminal (command line)

- **Windows**: use PowerShell (comes pre-installed) or the VS Code terminal
- **Mac**: use Terminal (comes pre-installed)
- **Linux**: use your distribution's terminal

---

## Step-by-Step Setup

### Step 1 — Download the project

If you received the project as a `.zip`, extract it to a folder.

If you're using Git:

```
git clone <repository-url>
cd courtside-bay-player-app
```

### Step 2 — Install Game Controller dependencies

Open a terminal in the project root folder and run:

```
cd game-controller
npm install
```

This will download all the libraries the server needs. It may take a few seconds.

> **What to expect:** You should see something like "added XX packages" with no red errors.

### Step 3 — Install Web App dependencies

Still in the terminal, go back to the root folder and into the web-app:

```
cd ..
cd web-app
npm install
```

Same thing — it will download the React app libraries.

> **What to expect:** "added XX packages" with no errors.

### Step 4 — Run the Game Controller

Now let's start the server. Open **one terminal** (or a terminal tab), go to the game-controller folder, and run:

```
cd game-controller
npm run dev
```

> **What to expect on screen:**
> ```
> [Game Controller] Running on port 3001
> [Game Controller] HTTP: http://localhost:3001/api/game-session
> [Game Controller] WS:   ws://localhost:3001
> ```

**Keep this terminal open!** The server needs to stay running.

### Step 5 — Run the Web App

Open **another terminal** (a new tab or window), go to the web-app folder, and run:

```
cd web-app
npm run dev
```

> **What to expect on screen:**
> ```
> VITE ready in XXXms
>
> ➜  Local:   http://localhost:3000/
> ```

**Keep this terminal open too!**

### Step 6 — Open in the browser

Now open your browser and go to:

| URL | What it is |
|-----|-----------|
| http://localhost:3000 | **Player App** — registration, lobby, game screens |
| http://localhost:3000/admin | **Admin Panel** — control the game, send MAKE/MISS, end matches |

To simulate multiple players, open **several tabs** at http://localhost:3000.
Each tab will be a different player.

---

## How to Test a Full Game

1. Open **3 tabs** at `http://localhost:3000` (one per player)
2. In each tab: enter a name, pick a character, click **Join Game**
3. The **first player** is the Host — they'll see the "Players" and "Games" tabs
4. In the Host's tab: go to the **Games** tab, click **Knockout**
5. Click **Start Game**
6. All players will go to the "Game In Progress" screen
7. Open `http://localhost:3000/admin` in another tab
8. In the Admin panel, use the **End Game Builder** to set positions and makes/misses for each player
9. Click **End Game with Results**
10. All players will see the results screen with the leaderboard
11. The Host can click **Return to Lobby** to start another game

---

## Useful Commands

| Command | Where to run | What it does |
|---------|-------------|-------------|
| `npm run dev` | `game-controller/` | Starts the server in dev mode (auto-restarts on save) |
| `npm run dev` | `web-app/` | Starts the React app in dev mode (auto-refreshes on save) |
| `npm run build` | `web-app/` | Generates the production build of the app |
| `npm start` | `game-controller/` | Starts the server in production mode |

---

## Folder Structure

```
courtside-bay-player-app/
├── game-controller/         ← Node.js server
│   ├── src/
│   │   ├── index.js         ← Express + WebSocket server
│   │   └── game-session.js  ← In-memory game state
│   └── package.json
├── web-app/                 ← React app (players' phones)
│   ├── src/
│   │   ├── pages/           ← App screens
│   │   ├── components/      ← Reusable components
│   │   ├── hooks/           ← WebSocket hook
│   │   └── lib/             ← Types, API client, utilities
│   └── package.json
├── ecosystem.config.js      ← PM2 config (production)
└── README.md                ← This file
```

---

## Troubleshooting

### "The app won't connect" or infinite "Connecting..."
The Game Controller is probably not running. Check that the terminal from Step 4 is still open and showing it's running on port 3001.

### "Port 3001 is already in use"
Another process is using port 3001. Close all terminals and try again, or kill the process.

On Windows:
```
netstat -ano | findstr :3001
taskkill /PID <pid-number> /F
```

### "npm install" failed
Make sure Node.js is installed correctly (`node --version`). If you're on a very old version, update to v20+.

### The app opened on port 5173 instead of 3000
Vite sometimes uses its default port if 3000 is already taken. It works the same — just use the URL shown in the terminal.
