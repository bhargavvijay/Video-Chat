const APP_ID = "10d85b82db6c44dbbf57205d19cd463c";

let uid = sessionStorage.getItem("uid");
if (!uid) {
    uid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem("uid", uid);
}

let token = null;
let client;
let rtmClient;
let channel;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

if (!roomId) {
    roomId = "main";
}

let displayName = sessionStorage.getItem("display_name");
if (!displayName) {
    window.location = "lobby.html";
}

let localTracks = [];
let remoteUsers = {};
let localScreenTracks;
let sharingScreen = false;

// Object to store MediaRecorders for each user
let userRecorders = {};

let joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID);
    await rtmClient.login({ uid, token });

    await rtmClient.addOrUpdateLocalUserAttributes({ name: displayName });

    channel = await rtmClient.createChannel(roomId);
    await channel.join();

    channel.on("MemberJoined", handleMemberJoined);
    channel.on("MemberLeft", handleMemberLeft);
    channel.on("ChannelMessage", handleChannelMessage);

    getMembers();
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`);

    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    await client.join(APP_ID, roomId, token, uid);

    client.on("user-published", handleUserPublished);
    client.on("user-left", handleUserLeft);
};

let joinStream = async () => {
    document.getElementById("join-btn").style.display = "none";
    document.getElementsByClassName("stream__actions")[0].style.display = "flex";

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, { encoderConfig: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
    }});

    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`;

    document.getElementById("streams__container").insertAdjacentHTML("beforeend", player);
    document.getElementById(`user-container-${uid}`).addEventListener("click", expandVideoFrame);

    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[0], localTracks[1]]);

    // Start recording local audio
    startRecordingAudio(uid, localTracks[0].getMediaStreamTrack());
};

let startRecordingAudio = (userId, track) => {
    const stream = new MediaStream([track]);
    const recorder = new MediaRecorder(stream);
    let audioChunks = [];

    recorder.ondataavailable = (e) => audioChunks.push(e.data);

    recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, `${userId}_${Date.now()}.webm`);
        formData.append("userId", userId);
        formData.append("roomId", roomId);

        // Upload to backend
        await fetch("http://localhost:5000/upload-audio", { method: "POST", body: formData });
    };

    recorder.start();
    userRecorders[userId] = recorder;
};

let handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    let player = document.getElementById(`user-container-${user.uid}`);
    if (!player) {
        player = `<div class="video__container" id="user-container-${user.uid}">
                    <div class="video-player" id="user-${user.uid}"></div>
                  </div>`;

        document.getElementById("streams__container").insertAdjacentHTML("beforeend", player);
        document.getElementById(`user-container-${user.uid}`).addEventListener("click", expandVideoFrame);
    }

    if (mediaType === "video") {
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === "audio") {
        user.audioTrack.play();

        // Start recording remote audio
        startRecordingAudio(user.uid, user.audioTrack.getMediaStreamTrack());
    }
};

let handleUserLeft = async (user) => {
    if (userRecorders[user.uid]) {
        userRecorders[user.uid].stop();
        delete userRecorders[user.uid];
    }

    delete remoteUsers[user.uid];
    const item = document.getElementById(`user-container-${user.uid}`);
    if (item) item.remove();
};

let toggleMic = async (e) => {
    let button = e.currentTarget;

    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        button.classList.add("active");
    } else {
        await localTracks[0].setMuted(true);
        button.classList.remove("active");
    }
};

let toggleCamera = async (e) => {
    let button = e.currentTarget;

    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        button.classList.add("active");
    } else {
        await localTracks[1].setMuted(true);
        button.classList.remove("active");
    }
};

let toggleScreen = async (e) => {
    let screenButton = e.currentTarget;
    let cameraButton = document.getElementById("camera-btn");

    if (!sharingScreen) {
        sharingScreen = true;

        screenButton.classList.add("active");
        cameraButton.classList.remove("active");
        cameraButton.style.display = "none";

        localScreenTracks = await AgoraRTC.createScreenVideoTrack();

        document.getElementById(`user-container-${uid}`).remove();
        displayFrame.style.display = "block";

        let player = `<div class="video__container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                      </div>`;

        displayFrame.insertAdjacentHTML("beforeend", player);
        document.getElementById(`user-container-${uid}`).addEventListener("click", expandVideoFrame);

        userIdInDisplayFrame = `user-container-${uid}`;
        localScreenTracks.play(`user-${uid}`);

        await client.unpublish([localTracks[1]]);
        await client.publish([localScreenTracks]);

        let videoFrames = document.getElementsByClassName("video__container");
        for (let i = 0; i < videoFrames.length; i++) {
            if (videoFrames[i].id !== userIdInDisplayFrame) {
                videoFrames[i].style.height = "100px";
                videoFrames[i].style.width = "100px";
            }
        }
    } else {
        sharingScreen = false;
        cameraButton.style.display = "block";
        document.getElementById(`user-container-${uid}`).remove();
        await client.unpublish([localScreenTracks]);

        switchToCamera();
    }
};

let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                  </div>`;

    let displayFrame = document.getElementById("display-frame");
    if (!displayFrame) {
        console.error("displayFrame not found!");
        return;
    }

    displayFrame.insertAdjacentHTML("beforeend", player);

    await localTracks[0].setMuted(true); // Mute audio
    await localTracks[1].setMuted(false); // Unmute video

    document.getElementById("mic-btn").classList.remove("active");

    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[1]]);
};

let leaveStream = async (e) => {
    e.preventDefault();

    document.getElementById("join-btn").style.display = "block";
    document.getElementsByClassName("stream__actions")[0].style.display = "none";

    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].stop();
        localTracks[i].close();
    }

    if (localScreenTracks) {
        await client.unpublish([localScreenTracks]);
    }

    document.getElementById(`user-container-${uid}`).remove();

    if (userRecorders[uid]) {
        userRecorders[uid].stop();
        delete userRecorders[uid];
    }

    channel.sendMessage({ text: JSON.stringify({ type: "user_left", uid }) });
};

// Event listeners
document.getElementById("camera-btn").addEventListener("click", toggleCamera);
document.getElementById("mic-btn").addEventListener("click", toggleMic);
document.getElementById("screen-btn").addEventListener("click", toggleScreen);
document.getElementById("join-btn").addEventListener("click", joinStream);
document.getElementById("leave-btn").addEventListener("click", leaveStream);

joinRoomInit();
