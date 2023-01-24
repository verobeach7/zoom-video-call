const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  // socket.emit():
  // first argument-event(custom event 얼마든지 만들 수 있음)
  // second third ... argument-object, number, boolean, string 등 어떤 것이든 보낼 수 있음.(자동으로 json.stringify.parse 다 해줌)
  // last argument-callback function(서버로 보낸 후 서버에서 조작한 후 프론트엔드에서 실행되게 할 수 있음)
  socket.emit("enter_room", { payload: input.value }, () => {
    console.log("server is done!");
  });
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
