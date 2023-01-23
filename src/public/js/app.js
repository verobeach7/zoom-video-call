const socket = new WebSocket(`ws://${window.location.host}`);

// 서버와 연결되었을 때 실행
socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
});

// 서버에서 메시지를 받았을 때 실행
socket.addEventListener("message", (message) => {
  console.log("New message: ", message.data);
});

// 서버와 연결이 끊겼을 때 실행
socket.addEventListener("close", () => {
  console.log("Disconnected from server ❌");
});

setTimeout(() => {
  socket.send("Hello from the browser!");
}, 10000);
