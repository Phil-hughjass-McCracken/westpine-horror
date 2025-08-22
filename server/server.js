const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {}; // { roomCode: { players: {}, keys: [], ... } }

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase(); // ex: "A7F2"
}

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // Create a new room
  socket.on("createRoom", (callback) => {
    const code = generateCode();
    rooms[code] = { players: {}, keys: [] };
    socket.join(code);
    rooms[code].players[socket.id] = { x: 100, y: 100, name: "Player" };
    callback(code); // send code back to client
  });

  // Join existing room
  socket.on("joinRoom", (code, callback) => {
    if (!rooms[code]) {
      callback({ success: false, message: "Room not found" });
      return;
    }
    socket.join(code);
    rooms[code].players[socket.id] = { x: 200, y: 200, name: "Player" };
    callback({ success: true, code });
  });

  // Player movement update
  socket.on("move", ({ code, x, y }) => {
    if (rooms[code] && rooms[code].players[socket.id]) {
      rooms[code].players[socket.id].x = x;
      rooms[code].players[socket.id].y = y;
      io.to(code).emit("stateUpdate", rooms[code].players);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (let code in rooms) {
      delete rooms[code].players[socket.id];
      io.to(code).emit("stateUpdate", rooms[code].players);
    }
    console.log("A player disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Multiplayer server running on port 3000");
});
