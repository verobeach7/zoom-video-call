const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;
let nickname;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (err) {
    console.log(err);
  }
}

async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: {
      deviceId: {
        exact: deviceId,
      },
    },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      getCameras();
    }
  } catch (err) {
    console.log(err);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
  if (muted) {
    myStream.getAudioTracks().forEach((track) => (track.enabled = false));
  } else {
    myStream.getAudioTracks().forEach((track) => (track.enabled = true));
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

/* Welcome Form(Join a room) */

const welcome = document.getElementById("welcome");

const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  /* socket.emit("check_count", roomName, async (newCount) => {
    if (newCount > 1) {
      return console.log("full", newCount);
    } else { */
  await getMedia();
  // 인원수 초과 에러 발생2
  makeConnection();
}

function hideRoom(newCount) {
  welcome.hidden = false;
  call.hidden = true;
}

function handleLeaveBtn(event) {
  event.preventDefault();
  socket.emit("leave_room", roomName, hideRoom);
}

function showRoom(newCount) {
  const presentRoom = call.querySelector("#presentRoom");
  const presentName = call.querySelector("#presentName");
  presentRoom.innerText = `Room: ${roomName} (${newCount}명)`;
  presentName.innerText = `Nickname: ${nickname}`;
  const leaveBtn = call.querySelector("#leaveBtn");
  leaveBtn.addEventListener("click", handleLeaveBtn);
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const roomInput = welcomeForm.querySelector("#roomInput");
  const nickInput = welcomeForm.querySelector("#nickInput");
  // 인원수 초과 에러 발생1
  await initCall();
  // 여기서부터 어디가 잘못됐는지 콘솔 찍어보면서 확인!!
  socket.emit("join_room", roomInput.value, nickInput.value, showRoom);
  roomName = roomInput.value;
  nickname = nickInput.value;
  roomInput.value = "";
  nickInput.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

/* Chat Form */

const chat = document.getElementById("chat");
const chatForm = chat.querySelector("form");
const ul = chat.querySelector("ul");

function handleChatSubmit(event) {
  event.preventDefault();
  const input = chatForm.querySelector("input");
  myDataChannel.send(input.value);
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.innerText = input.value;
  li.id = "myMsg";
  li.append(span);
  ul.appendChild(li);
  console.log(li);
  input.value = "";
  input.focus();
}

chatForm.addEventListener("submit", handleChatSubmit);

/* Socket Code */

function addMessage(msg) {
  const li = document.createElement("li");
  li.innerText = msg;
  li.id = "notice";
  ul.appendChild(li);
}

function handleMessage(event) {
  const li = document.createElement("li");
  const span = document.createElement("span");
  li.id = "msg";
  span.innerText = event.data;
  li.append(span);
  ul.appendChild(li);
  console.log(li);
}

function handleRoomClick(event) {
  event.preventDefault();
  const roomInput = welcomeForm.querySelector("#roomInput");
  roomInput.value = event.target.value;
}

socket.on("welcome", async (user, newCount) => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  // myDataChannel.addEventListener("message", event.data);
  myDataChannel.addEventListener("message", handleMessage);
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
  const presentRoom = call.querySelector("#presentRoom");
  presentRoom.innerText = `Room: ${roomName} (${newCount})`;
  addMessage(`${user} Joined.`);
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", handleMessage);
  });
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

socket.on("new_count", (nickname, newCount) => {
  const presentRoom = call.querySelector("#presentRoom");
  presentRoom.innerText = `Room: ${roomName} (${newCount})`;
  addMessage(`${nickname} Left ㅠㅠ`);
});

socket.on("bye", (user, newCount) => {
  const presentRoom = call.querySelector("#presentRoom");
  presentRoom.innerText = `Room: ${roomName} (${newCount})`;
  addMessage(`${user} Left ㅠㅠ`);
});

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerText = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.innerText = room.roomName;
    button.value = room.roomName;
    li.appendChild(button);
    if (room.countUsers > 1) {
      button.disabled = true;
    } else {
      button.disabled = false;
    }
    roomList.append(li);
    button.addEventListener("click", handleRoomClick);
  });
});

/* RTC Code */

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

// data는 이벤트에서 발생한 data
function handleIce(data) {
  socket.emit("ice", data.candidate, roomName);
}

// data는 mediastream
function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.streams[0];
}
