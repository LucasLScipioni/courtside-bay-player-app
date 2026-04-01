module.exports = {
  apps: [
    {
      name: "web-app",
      cwd: "./web-app",
      script: "npm",
      args: "run preview",
      env: { PORT: 3000 },
    },
    {
      name: "game-controller",
      cwd: "./game-controller",
      script: "node",
      args: "src/index.js",
      env: { PORT: 3001 },
    },
  ],
};
