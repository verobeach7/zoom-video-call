const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;
let nickname;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  // #msg 안에 있는 첫번째 input을 반환함.
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  // #name 안에 있는 첫번째 input을 반환함.
  const input = room.querySelector("#name input");
  socket.emit("nickname", input.value);
  nickname = input.value;
  const presentName = room.querySelector("#presentName");
  presentName.innerText = `Nickname: ${nickname}`;
  input.value = "";
}

function showRoom(newCount) {
  welcome.hidden = true;
  room.hidden = false;
  const presentRoom = room.querySelector("#presentRoom");
  presentRoom.innerText = `Room: ${roomName} (${newCount})`;
  const presentName = room.querySelector("#presentName");
  presentName.innerText = `Nickname: ${nickname}`;
  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const roomInput = form.querySelector("#roomname");
  const nameInput = form.querySelector("#nickname");
  socket.emit("enter_room", roomInput.value, nameInput.value, showRoom);
  roomName = roomInput.value;
  nickname = nameInput.value;
  roomInput.value = "";
  nameInput.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  const presentRoom = room.querySelector("#presentRoom");
  presentRoom.innerText = `Room: ${roomName} (${newCount})`;
  addMessage(`${user} Joined.`);
});

socket.on("bye", (user, newCount) => {
  const presentRoom = room.querySelector("#presentRoom");
  presentRoom.innerText = `Room: ${roomName} (${newCount})`;
  addMessage(`${user} Left ㅠㅠ`);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerText = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
// socket.on("room_change", console.log);
// socket.on("room_change", (msg) => console.log(msg));
