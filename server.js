"use strict";

var _http = _interopRequireDefault(require("http"));
var _express = _interopRequireDefault(require("express"));
var _socket = require("socket.io");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var app = (0, _express["default"])();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", _express["default"]["static"](__dirname + "/public"));
app.get("/", function (_, res) {
  return res.render("home");
});
app.get("/*", function (_, res) {
  return res.redirect("/");
});
var httpServer = _http["default"].createServer(app);
var wsServer = new _socket.Server(httpServer);
function publicRooms() {
  var _wsServer$sockets$ada = wsServer.sockets.adapter,
    sids = _wsServer$sockets$ada.sids,
    rooms = _wsServer$sockets$ada.rooms;
  //   console.log(sids, rooms);
  var publicRooms = [];
  rooms.forEach(function (_, key) {
    if (sids.get(key) === undefined) {
      var _wsServer$sockets$ada2;
      var roomName = key;
      var _countUsers = (_wsServer$sockets$ada2 = wsServer.sockets.adapter.rooms.get(key)) === null || _wsServer$sockets$ada2 === void 0 ? void 0 : _wsServer$sockets$ada2.size;
      var room = {
        roomName: roomName,
        countUsers: _countUsers
      };
      publicRooms.push(room);
    }
  });
  return publicRooms;
}
function countUsers(roomName) {
  var _wsServer$sockets$ada3;
  return (_wsServer$sockets$ada3 = wsServer.sockets.adapter.rooms.get(roomName)) === null || _wsServer$sockets$ada3 === void 0 ? void 0 : _wsServer$sockets$ada3.size;
}
wsServer.on("connection", function (socket) {
  wsServer.sockets.emit("room_change", publicRooms());
  socket["nickname"] = "Anonymous";
  socket.on("check_count", function (roomName, done) {
    done(publicRooms());
  });
  socket.on("join_room", function (roomName, nickname, done) {
    var _currentRoom$;
    var a = publicRooms();
    var currentRoom = a.filter(function (room) {
      return room.roomName === roomName;
    });
    if (((_currentRoom$ = currentRoom[0]) === null || _currentRoom$ === void 0 ? void 0 : _currentRoom$.countUsers) > 1) {
      return;
    } else {
      socket["nickname"] = nickname;
      socket.join(roomName);
      socket.to(roomName).emit("welcome", socket.nickname, countUsers(roomName));
      done(countUsers(roomName));
      wsServer.sockets.emit("room_change", publicRooms());
    }
  });
  socket.on("offer", function (offer, roomName) {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", function (answer, roomName) {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", function (ice, roomName) {
    socket.to(roomName).emit("ice", ice);
  });
  socket.on("disconnecting", function () {
    socket.rooms.forEach(function (room) {
      return socket.to(room).emit("bye", socket.nickname, countUsers(room) - 1);
    });
  });
  socket.on("disconnect", function () {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("leave_room", function (roomName, done) {
    socket.leave(roomName);
    done();
    socket.to(roomName).emit("new_count", socket.nickname, countUsers(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
});
var handleListen = function handleListen() {
  return console.log("Listening on http://localhost:3000");
};
httpServer.listen(3000, handleListen);