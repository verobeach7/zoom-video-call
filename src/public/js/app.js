const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");

let myStream;
let muted = false;
let cameraOff = false;

async function getMedia() {
  try {
    // MediaStream 객체를 반환. 사용 가능한 미디어 장치 정보 가져옴. 미디어 접근을 요청함.
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    myFace.srcObject = myStream;
  } catch (err) {
    console.log(err);
  }
}

getMedia();

function handleMuteClick() {
  if (!muted) {
    // 음소거 되어있지 않으면...음소거하고 버튼은 음소거 풀어라
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    // 음소거 되어있으면...음소거 풀고 버튼은 음소거 해라
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  if (cameraOff) {
    // 카메라 꺼져 있으면...켜주고 버튼은 꺼라로 설정
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    // 카메라 켜져 있으면...꺼주고 버튼은 켜라로 설정
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
