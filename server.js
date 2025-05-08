const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("join-room", ({ name, room }) => {
    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length >= 4) {
      socket.emit("room-full");
      return;
    }

    const player = { id: socket.id, name };
    rooms[room].push(player);
    socket.join(room);
    io.to(room).emit("joined", rooms[room]);

    socket.on("dice-roll", ({ room, name, value }) => {
      socket.to(room).emit("dice-rolled", { name, value });
    });

    socket.on("disconnect", () => {
      if (rooms[room]) {
        rooms[room] = rooms[room].filter(p => p.id !== socket.id);
        io.to(room).emit("update-players", rooms[room]);
        if (rooms[room].length === 0) delete rooms[room];
      }
    });
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
