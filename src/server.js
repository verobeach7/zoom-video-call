import http from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  // rooms와 sids(socket ids)를 비교하여 rooms에는 있으나 sids에는 없으면 public room인 것!!!
  // rooms에는 private room과 public room이 모두 있고, sids에는 private room만 있음
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  // wsServer.sockets.adapter.rooms.get(roomName) <- set 자료구조
  // roomName이 없을 수도 있으므로 ? 붙여주기
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  wsServer.sockets.emit("room_change", publicRooms());
  socket["nickname"] = "Anonymous";
  socket.onAny((event) => {
    // console.log(wsServer.sockets.adapter);
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, nickname, done) => {
    socket["nickname"] = nickname;
    socket.join(roomName);
    done(countRoom(roomName));
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
  // disconnecting은 socket.io 고유의 Event
  // disconnecting은 연결이 끊기기 직전에 실행됨
  socket.on("disconnecting", () => {
    // socket.rooms는 자바스크립트 Set 자료구조로 forEach 순회 가능
    socket.rooms.forEach((room) =>
      // 방을 떠나기 직전이지 아직 떠난 것은 아니기 때문에 떠났다 생각하고 1 빼줘야함
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  // disconnect는 연결이 끊긴 후 실행
  // 방에서 다 나가고 아무도 없으면 실행됨
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  // socket은 array여서 얼마든지 원하는 것을 추가 가능
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

httpServer.listen(3000, handleListen);
