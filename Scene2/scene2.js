const stage = document.getElementById("stage");
const taskScene = document.getElementById("task1");
const outcomeScene = document.getElementById("outcome1");
const timerPanelImg = document.getElementById("timerPanelImg");
const alarmSound = document.getElementById("alarmSound");
alarmSound.volume = 0.6; // 0 ~ 1
const timerPanel = document.getElementById("timerPanel");
const popupSound = document.getElementById("popupSound");

const task2Trigger = document.getElementById("task2Trigger");

const popupOverlay = document.getElementById("popupOverlay");
const glitchPopup = document.getElementById("glitchPopup");

const task2Scene = document.getElementById("task2");
const outcome2Scene = document.getElementById("outcome2");
const task3Scene = document.getElementById("task3");

const task3Trigger = document.getElementById("task3Trigger");

const popupMain = document.getElementById("popupMain");
const popupGhostA = document.getElementById("popupGhostA");
const popupGhostB = document.getElementById("popupGhostB");
const popupSliceImgs = document.querySelectorAll(".popupSliceImg");

const outcome3Scene = document.getElementById("outcome3");
const reminiscenceTrigger = document.getElementById("reminiscenceTrigger");

const outcome1Bg = document.getElementById("outcome1Bg");
const outcome2Bg = document.getElementById("outcome2Bg");
const outcome3Bg = document.getElementById("outcome3Bg");

let flickerTimer = null;
let shakeFrame = null;

let task2PopupSeen = false;
let task3Timer = null;
let task3PopupSeen = false;
let reminiscencePopupSeen = false;

let pendingBackgroundSwap = null;
let popupContext = "";

/* 让 1440x1024 舞台始终完整显示，不出现滚动 */
function fitStage() {
  const baseWidth = 1440;
  const baseHeight = 1024;

  const scaleX = window.innerWidth / baseWidth;
  const scaleY = window.innerHeight / baseHeight;
  const scale = Math.min(scaleX, scaleY);

  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

window.addEventListener("resize", fitStage);
fitStage();

// ✅ BGM
const bgmAmbient = document.getElementById("bgmAmbient");
const bgmGlitch = document.getElementById("bgmGlitch");

// 初始音量（很关键）
bgmAmbient.volume = 0;
bgmGlitch.volume = 0;

// 播放（需要用户交互触发）
function startBGM() {
  bgmAmbient.play().catch(() => {});
  bgmGlitch.play().catch(() => {});

  fadeInAudio(bgmAmbient, 4000, 0.4); // 环境音目标音量
  fadeInAudio(bgmGlitch, 4000, 0.2);  // glitch轻一点
}

startBGM();

// 淡入函数
function fadeInAudio(audio, duration = 800, targetVolume = 1) {
  const step = 0.02;
  const interval = duration / (targetVolume / step);

  const fade = setInterval(() => {
    if (audio.volume < targetVolume) {
      audio.volume = Math.min(audio.volume + step, targetVolume);
    } else {
      clearInterval(fade);
    }
  }, interval);
}

function boostGlitch() {
  bgmGlitch.volume = 0.5;

  setTimeout(() => {
    bgmGlitch.volume = 0.2;
  }, 1000);
}

/* TIME LEFT 闪烁 */
function flicker() {
  const r = Math.random();

  if (r < 0.15) {
    timerPanelImg.style.opacity = "0.35";
    timerPanelImg.style.filter =
      "brightness(0.6) drop-shadow(0 0 6px rgba(160,255,255,.35)) drop-shadow(0 0 12px rgba(160,255,255,.18))";
  } else if (r < 0.3) {
    timerPanelImg.style.opacity = "0.6";
    timerPanelImg.style.filter =
      "brightness(0.8) drop-shadow(0 0 6px rgba(160,255,255,.35)) drop-shadow(0 0 12px rgba(160,255,255,.18))";
  } else {
    timerPanelImg.style.opacity = "1";
    timerPanelImg.style.filter =
      "brightness(1) drop-shadow(0 0 6px rgba(160,255,255,.35)) drop-shadow(0 0 12px rgba(160,255,255,.18))";
  }

  flickerTimer = setTimeout(flicker, Math.random() * 180 + 80);
}

/* TIME LEFT 轻微震动 */
function shake() {
  const x = (Math.random() - 0.5) * 1.2;
  const y = (Math.random() - 0.5) * 1.2;

  timerPanelImg.style.transform = `translate(${x}px, ${y}px)`;
  shakeFrame = requestAnimationFrame(shake);
}

function startTimerEffects() {
  stopTimerEffects();
  flicker();
  shake();
}

function stopTimerEffects() {
  if (flickerTimer) {
    clearTimeout(flickerTimer);
    flickerTimer = null;
  }

  if (shakeFrame) {
    cancelAnimationFrame(shakeFrame);
    shakeFrame = null;
  }

  timerPanelImg.style.opacity = "1";
  timerPanelImg.style.transform = "translate(0, 0)";
  timerPanelImg.style.filter =
    "brightness(1) drop-shadow(0 0 6px rgba(160,255,255,.35)) drop-shadow(0 0 12px rgba(160,255,255,.18))";
}

startTimerEffects();

/* 10秒后切到 outcome1 */
setTimeout(() => {

taskScene.classList.remove("active");
outcomeScene.classList.add("active");

stopTimerEffects();

alarmSound.currentTime = 0;
alarmSound.play();

},10000);

let popupTimer = null;
let closingTimer = null;
let popupSeen = false;

function openPopup(context) {
  clearTimeout(popupTimer);
  clearTimeout(closingTimer);

  popupContext = context;
  popupOverlay.classList.add("show");

  // ✅ 播放弹窗音效
  popupSound.currentTime = 0;
  popupSound.volume = 0.6;
  popupSound.play().catch(() => {});

  glitchPopup.classList.remove("is-closing");
  glitchPopup.classList.remove("is-glitching");
  void glitchPopup.offsetWidth;
  glitchPopup.classList.add("is-glitching");

  popupTimer = setTimeout(() => {
    closePopup();
  }, 2000);
}

function closePopup() {
  clearTimeout(popupTimer);
  clearTimeout(closingTimer);

  if (!popupOverlay.classList.contains("show")) return;

  glitchPopup.classList.remove("is-glitching");
  glitchPopup.classList.remove("is-closing");
  void glitchPopup.offsetWidth;
  glitchPopup.classList.add("is-closing");

  closingTimer = setTimeout(() => {
    popupOverlay.classList.remove("show");
    glitchPopup.classList.remove("is-closing");

    if (popupContext) {
      swapOutcomeBackground(popupContext);
      popupContext = "";
    }
  }, 320);
}

task2Trigger.addEventListener("click", () => {
  if (!task2PopupSeen) {
    setPopupImage("./image/image1.png");
    openPopup("outcome1");
    task2PopupSeen = true;
  } else {
    enterTask2();
  }
});

popupOverlay.addEventListener("click", (e) => {
  if (e.target === popupOverlay) {
    closePopup();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePopup();
  }
});

function showScene(sceneToShow) {
  document.querySelectorAll(".scene").forEach((scene) => {
    scene.classList.remove("active");
  });

  sceneToShow.classList.add("active");

  // ✅ 用 sceneToShow.id
  if (sceneToShow.id.includes("outcome")) {
    boostGlitch();
  }
}

function setPopupImage(src) {
  popupMain.src = src;
  popupGhostA.src = src;
  popupGhostB.src = src;

  popupSliceImgs.forEach((img) => {
    img.src = src;
  });
}

let task2Timer = null;

function enterTask2() {
  alarmSound.pause();
  alarmSound.currentTime = 0;

  showScene(task2Scene);

  task2Scene.appendChild(timerPanel);
  timerPanel.style.display = "block";

  startTimerEffects();

  clearTimeout(task2Timer);
  task2Timer = setTimeout(() => {
    enterOutcome2();
  }, 15000);
}

function enterOutcome2() {
  stopTimerEffects();
  timerPanel.style.display = "none";

  showScene(outcome2Scene);

  alarmSound.currentTime = 0;
  alarmSound.play();
}

task3Trigger.addEventListener("click", () => {
  if (!task3PopupSeen) {
    setPopupImage("./image/image2.png");
    openPopup("outcome2");
    task3PopupSeen = true;
  } else {
    enterTask3();
  }
});

/* 进入 task3 */
function enterTask3() {
  alarmSound.pause();
  alarmSound.currentTime = 0;

  showScene(task3Scene);

  task3Scene.appendChild(timerPanel);
  timerPanel.style.display = "block";
  startTimerEffects();

  clearTimeout(task3Timer);
  task3Timer = setTimeout(() => {
    enterOutcome3();
  }, 15000);
}

/* 进入 outcome3 */
function enterOutcome3() {
  stopTimerEffects();
  timerPanel.style.display = "none";

  showScene(outcome3Scene);

  alarmSound.currentTime = 0;
  alarmSound.play().catch(() => {});
}

reminiscenceTrigger.addEventListener("click", () => {
  if (!reminiscencePopupSeen) {
    setPopupImage("./image/image3.png");
    openPopup("outcome3");
    reminiscencePopupSeen = true;
    return;
  }

  alarmSound.pause();
  alarmSound.currentTime = 0;

  sessionStorage.setItem("scene2BgmShouldResume", "true");
  sessionStorage.setItem("scene2AmbientTime", String(bgmAmbient.currentTime));
  sessionStorage.setItem("scene2GlitchTime", String(bgmGlitch.currentTime));
  sessionStorage.setItem("scene2AmbientVolume", String(bgmAmbient.volume));
  sessionStorage.setItem("scene2GlitchVolume", String(bgmGlitch.volume));

  console.log("saved BGM state before redirect", {
    shouldResume: sessionStorage.getItem("scene2BgmShouldResume"),
    ambientTime: sessionStorage.getItem("scene2AmbientTime"),
    glitchTime: sessionStorage.getItem("scene2GlitchTime"),
    ambientVolume: sessionStorage.getItem("scene2AmbientVolume"),
    glitchVolume: sessionStorage.getItem("scene2GlitchVolume")
  });

  window.location.href = "./Reminiscence/reminiscence.html";
});

function swapOutcomeBackground(context) {
  if (context === "outcome1") {
    outcome1Bg.src = "./image/newoutcome1.png";
  }

  if (context === "outcome2") {
    outcome2Bg.src = "./image/newoutcome2.png";
  }

  if (context === "outcome3") {
    outcome3Bg.src = "./image/newoutcome3.png";
  }
}