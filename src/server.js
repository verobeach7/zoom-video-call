import http from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  //   console.log(sids, rooms);
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      const roomName = key;
      const countUsers = wsServer.sockets.adapter.rooms.get(key)?.size;
      const room = { roomName, countUsers };
      publicRooms.push(room);
    }
  });
  return publicRooms;
}

function countUsers(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  wsServer.sockets.emit("room_change", publicRooms());
  socket["nickname"] = "Anonymous";
  socket.on("check_count", (roomName, done) => {
    done(publicRooms());
  });
  socket.on("join_room", (roomName, nickname, done) => {
    const a = publicRooms();
    const currentRoom = a.filter((room) => room.roomName === roomName);
    if (currentRoom[0]?.countUsers > 1) {
      return;
    } else {
      socket["nickname"] = nickname;
      socket.join(roomName);
      socket
        .to(roomName)
        .emit("welcome", socket.nickname, countUsers(roomName));
      done(countUsers(roomName));
      wsServer.sockets.emit("room_change", publicRooms());
    }
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countUsers(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("leave_room", (roomName, done) => {
    socket.leave(roomName);
    done();
    socket
      .to(roomName)
      .emit("new_count", socket.nickname, countUsers(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);
