import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  // 아직 nickname을 설정하지 않은 사람에 대한 대처
  socket["nickname"] = "Anonymous";
  console.log("Connected to Browser ✅");
  socket.on("close", () => {
    console.log("Disconnected from the Browser ❌");
  });
  socket.on("message", (msg) => {
    // WebSocket을 통해 전달받은 string을 다시 객체로 바꿔주는 것
    const message = JSON.parse(msg);
    // break를 걸지 않으면 뒤에 case도 다 실행됨.
    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload}`)
        );
        break;
      case "nickname":
        // socket은 객체이기 때문에 원하는 것을 추가 가능!!!
        socket["nickname"] = message.payload;
        break;
    }
    /* if (message.type === "new_message") {
      sockets.forEach((aSocket) => aSocket.send(message.payload));
    } else if (message.type === "nickname") {
      console.log(message.payload);
    } */
  });
});

server.listen(3000, handleListen);
