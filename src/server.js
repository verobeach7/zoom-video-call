// http는 node.js에 이미 설치되어 있어 따로 설치가 필요하지 않음
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

// express.js를 이용하여 http 서버를 생성
const server = http.createServer(app);

// http와 ws을 둘 다 사용할 수 있도록 하기 위하여 이렇게 하는 것
// http 서버 위에 ws 서버를 만든 것
// http protocol이 필요하지 않으면 ws만 만들어주면 됨
const wss = new WebSocket.Server({ server });

server.listen(3000, handleListen);
// app.listen(3000, handleListen);
