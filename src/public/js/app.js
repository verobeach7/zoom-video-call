const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("input");
  // value에 따로 넣어주지 않으면 input.value가 비워져서 나한테는 공백으로 보이게 됨.
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    // input.value = "";를 여기에 넣어줄 수도 있지만 서버와 통신이 늦어지는 경우 input에서 늦게 지워지게 됨.
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  const form = room.querySelector("form");
  form.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

// welcome 이벤트 발생 시 작동
socket.on("welcome", () => {
  addMessage("Someone Joined.");
});

socket.on("bye", () => {
  addMessage("Someone Left ㅠㅠ");
});

// 아래 2개는 똑같음.
socket.on("new_message", addMessage);
// socket.on("new_message", (msg) => {addMessage(msg);});
