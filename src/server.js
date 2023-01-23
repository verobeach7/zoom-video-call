import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
// catchall url
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

// 백엔드 socket에 서버와 클라이언트 사이의 연결 정보가 있음
// frontend와 real-time 소통 가능
function handleConnection(socket) {
  console.log(socket);
}

// on method를 이용하여 이벤트를 기다리고 이벤트가 발생하면 callback fn을 실행
wss.on("connection", handleConnection);

server.listen(3000, handleListen);
