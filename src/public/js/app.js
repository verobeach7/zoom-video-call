const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;

async function getCameras() {
  try {
    // 모든 미디어장치
    const devices = await navigator.mediaDevices.enumerateDevices();
    // videoinput만 filter
    const cameras = devices.filter((device) => device.kind === "videoinput");
    console.log("cameras", cameras);
    // 현재 사용하고 있는 카메라 정보
    const currentCamera = myStream.getVideoTracks();
    console.log("currentCamera", currentCamera);
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      console.log("camera", camera);
      // 초기 사용되는 카메라가 선택되어있게 함.
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
  // 사용자가 지정한 장비가 없을 때 constraints
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  // 사용자가 카메라 장비를 선택했을 때 constraints
  const cameraConstraints = {
    audio: true,
    video: {
      deviceId: {
        exact: deviceId,
      },
    },
  };
  // promise 구문은 try{}catch(err){} 사용
  try {
    // MediaStream 객체를 반환. 사용 가능한 미디어 장치 정보 가져옴. 미디어 접근을 요청함.
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    // 사용자가 지정한 카메라가 없을 때. 즉, 처음 시작할 때만 카메라 정보를 가져옴.
    if (!deviceId) {
      getCameras();
    }
  } catch (err) {
    console.log(err);
  }
}

getMedia();

function handleMuteClick() {
  // myStream.getAudioTracks()는 장치정보 배열을 가져옴. 배열 내의 정보를 활용.
  // console.log(myStream.getAudioTracks());
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
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
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
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

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
