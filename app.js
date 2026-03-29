let currentStage = "task";
// task → result → outcome1

const screenEl = document.getElementById("screen");
const timerEl = document.getElementById("timer");
const warningEl = document.getElementById("warning");
const optA = document.getElementById("optA");
const optB = document.getElementById("optB");
const task2Btn = document.getElementById("task2Btn");
const task3Btn = document.getElementById("task3Btn");
const analyseBtn = document.getElementById("analyseBtn");

// ✅ 新增：固定舞台缩放
const viewportEl = document.getElementById("viewport");
const stageEl = document.getElementById("stage");
const STAGE_WIDTH = 1440;
const STAGE_HEIGHT = 1024;

// 原有 audio
const taskAudio = document.getElementById("taskAudio");
const resultAudio = document.getElementById("resultAudio");
const result2Audio = document.getElementById("result2Audio");
const result3Audio = document.getElementById("result3Audio");
const audioUnlock = document.getElementById("audioUnlock");

// ✅ 新增：第一幕 BGM
const bgmAmbient = document.getElementById("bgmAmbient");
const bgmGlitch = document.getElementById("bgmGlitch");

let remaining = 30;
let timerId = null;
let taskTickTimeoutId = null;
let activeTaskTicks = [];

// ✅ 防止重复启动 BGM
let taskBgmStarted = false;
let ambientFadeInterval = null;

// ✅ 新增：让舞台始终按 1440 × 1024 等比缩放并居中
function fitStage() {
  if (!stageEl) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / STAGE_WIDTH, vh / STAGE_HEIGHT);

  stageEl.style.width = `${STAGE_WIDTH}px`;
  stageEl.style.height = `${STAGE_HEIGHT}px`;
  stageEl.style.transform = `scale(${scale})`;
  stageEl.style.transformOrigin = "center center";
}

// ✅ 新增：更稳一点，处理某些移动端/检查元素变化
function requestFitStage() {
  window.requestAnimationFrame(() => {
    fitStage();
  });
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m} : ${s}`;
}

// 控制红色状态（10秒触发）
function setDanger(on) {
  if (on) {
    timerEl.classList.add("is-danger");
  } else {
    timerEl.classList.remove("is-danger");
  }
}

// 控制警告标识（5秒触发）
function setWarning(on) {
  if (!warningEl) return;

  if (on) {
    warningEl.style.display = "block";
    warningEl.classList.add("is-on");
  } else {
    warningEl.classList.remove("is-on");
    warningEl.style.display = "none";
  }
}

function hideWarningImmediately() {
  if (!warningEl) return;
  warningEl.classList.remove("is-on");
  warningEl.style.display = "none";
}

// ✅ ambient 淡入
function fadeInAudio(audio, targetVolume = 0.5, duration = 4000) {
  if (!audio) return;

  if (ambientFadeInterval) {
    clearInterval(ambientFadeInterval);
    ambientFadeInterval = null;
  }

  audio.volume = 0;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.log("Audio play failed:", err);
    });
  }

  const stepTime = 100;
  const steps = Math.max(1, Math.floor(duration / stepTime));
  const stepVolume = targetVolume / steps;

  ambientFadeInterval = setInterval(() => {
    if (audio.volume < targetVolume) {
      audio.volume = Math.min(audio.volume + stepVolume, targetVolume);
    } else {
      clearInterval(ambientFadeInterval);
      ambientFadeInterval = null;
    }
  }, stepTime);
}

// 原有任务音效
function getTaskTickInterval() {
  if (remaining > 10) return 1000;
  if (remaining > 5) return 700;
  return 220;
}

function playTaskTick() {
  if (!taskAudio) return Promise.resolve();

  const tick = taskAudio.cloneNode();

  let volume = 0.6;
  if (remaining <= 10) volume = 0.7;
  if (remaining <= 5) volume = 0.88;

  tick.volume = volume;
  tick.currentTime = 0;

  // 记录当前正在播放的 tick
  activeTaskTicks.push(tick);

  const cleanup = () => {
    activeTaskTicks = activeTaskTicks.filter(audio => audio !== tick);
  };

  tick.addEventListener("ended", cleanup);
  tick.addEventListener("pause", cleanup);

  const playPromise = tick.play();

  if (playPromise && typeof playPromise.then === "function") {
    playPromise.catch(() => {
      console.log("Task tick autoplay blocked.");
      cleanup();
    });
  }

  return playPromise || Promise.resolve();
}

function scheduleNextTaskTick() {
  if (taskTickTimeoutId) {
    clearTimeout(taskTickTimeoutId);
    taskTickTimeoutId = null;
  }

  if (!["task", "task2", "task3"].includes(currentStage)) return;
  if (remaining <= 0) return;

  const interval = getTaskTickInterval();

  taskTickTimeoutId = setTimeout(() => {
    playTaskTick();
    scheduleNextTaskTick();
  }, interval);
}

function startTaskAudio() {
  if (taskTickTimeoutId) {
    clearTimeout(taskTickTimeoutId);
    taskTickTimeoutId = null;
  }

  return playTaskTick().then(() => {
    scheduleNextTaskTick();
  });
}

function stopTaskAudio() {
  if (taskTickTimeoutId) {
    clearTimeout(taskTickTimeoutId);
    taskTickTimeoutId = null;
  }

  // 停掉所有已经触发、还在播放的 tick
  activeTaskTicks.forEach(tick => {
    try {
      tick.pause();
      tick.currentTime = 0;
    } catch (e) {}
  });

  activeTaskTicks = [];
}

function smoothVolume(audio, target, duration = 300) {
  if (!audio) return;

  const step = 0.01;
  const interval = duration / Math.abs(audio.volume - target) / (1 / step);

  const fade = setInterval(() => {
    if (Math.abs(audio.volume - target) > 0.01) {
      audio.volume += (audio.volume < target ? step : -step);
    } else {
      audio.volume = target;
      clearInterval(fade);
    }
  }, interval);
}

function lowerBgm() {
  if (bgmAmbient) bgmAmbient.volume = 0.2;
  if (bgmGlitch) bgmGlitch.volume = 0.15;
}

function restoreBgm() {
  if (bgmAmbient) bgmAmbient.volume = 0.45;
  if (bgmGlitch) bgmGlitch.volume = 0.2;
}

function saveBgmState() {
  if (bgmAmbient) {
    sessionStorage.setItem("bgmAmbientTime", String(bgmAmbient.currentTime || 0));
    sessionStorage.setItem("bgmAmbientVolume", String(bgmAmbient.volume || 0.45));
    sessionStorage.setItem("bgmAmbientPlaying", String(!bgmAmbient.paused));
  }

  if (bgmGlitch) {
    sessionStorage.setItem("bgmGlitchTime", String(bgmGlitch.currentTime || 0));
    sessionStorage.setItem("bgmGlitchVolume", String(bgmGlitch.volume || 0.2));
    sessionStorage.setItem("bgmGlitchPlaying", String(!bgmGlitch.paused));
  }
}

// ✅ 第一幕 BGM 启动
async function startTaskBgm() {
  if (taskBgmStarted) return;

  let ambientStarted = false;
  let glitchStarted = false;

  if (bgmAmbient) {
    bgmAmbient.loop = true;
    bgmAmbient.currentTime = 3;
    bgmAmbient.volume = 0;
    try {
      await bgmAmbient.play();
      ambientStarted = true;
    } catch (e) {
      ambientStarted = false;
    }
  }

  if (bgmGlitch) {
    bgmGlitch.loop = true;
    bgmGlitch.currentTime = 0;
    bgmGlitch.volume = 0.15;
    try {
      await bgmGlitch.play();
      glitchStarted = true;
    } catch (e) {
      glitchStarted = false;
    }
  }

  if (!ambientStarted || !glitchStarted) {
    throw new Error("BGM autoplay blocked");
  }

  // ambient 淡入到主层音量
  if (bgmAmbient) {
    fadeInAudio(bgmAmbient, 0.45, 1200);
  }

  taskBgmStarted = true;
}

function playResultAudio() {
  if (!resultAudio) return;

  resultAudio.loop = false;
  resultAudio.currentTime = 0;
  resultAudio.volume = 0.6;

  resultAudio.play().catch(() => {
    console.log("Result audio autoplay blocked.");
  });
}

function playResult2Audio() {
  if (!result2Audio) return Promise.resolve();

  try {
    result2Audio.pause();
  } catch (e) {}

  result2Audio.loop = false;
  result2Audio.volume = 0.6;
  result2Audio.currentTime = 0;

  return result2Audio.play().catch((e) => {
    console.warn("Result2 audio play() failed:", e);
    throw e;
  });
}

function playResult3Audio() {
  if (!result3Audio) return Promise.resolve();

  try {
    result3Audio.pause();
  } catch (e) {}

  result3Audio.loop = false;
  result3Audio.volume = 0.6;
  result3Audio.currentTime = 0;

  return result3Audio.play().catch((e) => {
    console.warn("Result3 audio play() failed:", e);
    throw e;
  });
}

function goToResult() {
  console.log("goToResult called, currentStage =", currentStage);

  hideWarningImmediately();
  setDanger(false);

  // ====== Task 1 → result.png ======
  if (currentStage === "task") {
    currentStage = "result";

    // ✅ 关键：立刻停止这一轮倒计时
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    setDanger(false);
    setWarning(false);

    stopTaskAudio();
    lowerBgm();

    screenEl.src = "assets/image/result.png";
    timerEl.style.display = "none";

    if (optA) optA.style.display = "none";
    if (optB) optB.style.display = "none";

    playResultAudio();
    return;
  }

  // ====== Task 2 → result2.png ======
  if (currentStage === "task2") {
    currentStage = "result2";

    setDanger(false);
    setWarning(false);

    stopTaskAudio();
    lowerBgm();

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    screenEl.src = "assets/image/result2.png";
    timerEl.style.display = "none";

    if (optA) optA.style.display = "none";
    if (optB) optB.style.display = "none";

    playResult2Audio().catch((e) => {
      console.log("Result2 audio blocked or failed:", e);
    });

    return;
  }

  // ====== Task 3 → result3.png ======
  if (analyseBtn) analyseBtn.style.display = "none";

  if (currentStage === "task3") {
    currentStage = "result3";

    setDanger(false);
    setWarning(false);

    stopTaskAudio();
    lowerBgm();

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    screenEl.src = "assets/image/result3.png";
    timerEl.style.display = "none";

    if (optA) optA.style.display = "none";
    if (optB) optB.style.display = "none";

    playResult3Audio().catch((e) => {
      console.log("Result3 audio blocked or failed:", e);
    });

    return;
  }
}

function startCountdown(seconds) {
  remaining = seconds;
  timerEl.textContent = formatTime(remaining);
  setDanger(false);
  setWarning(false);

  // ✅ 同时启动原任务音效 + 第一幕 BGM
  Promise.all([
    startTaskAudio(),
    startTaskBgm()
  ]).catch(() => {
    console.log("Audio autoplay blocked; waiting for user gesture to enable audio.");

    if (audioUnlock) {
      audioUnlock.classList.remove("hidden");
    }
  });

  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    remaining -= 1;
    timerEl.textContent = formatTime(remaining);

    // 10秒开始变红
    if (remaining <= 10 && remaining > 5) {
      setDanger(true);
      setWarning(false);
    }

    // 5秒开始出现警告
    if (remaining <= 5 && remaining > 0) {
      setDanger(true);
      setWarning(true);

      // ✅ 最后5秒让 glitch 稍微抬一点点，但仍然很轻
      if (bgmGlitch) {
        bgmGlitch.volume = 0.2;
      }
    }

    // 时间到
    if (remaining <= 0) {
      clearInterval(timerId);
      timerId = null;
      stopTaskAudio();
      goToResult();
    }
  }, 1000);
}

function goToTask2() {
  if (currentStage !== "outcome1") return;

  currentStage = "task2";

  screenEl.src = "assets/image/task2.png";

  if (task2Btn) task2Btn.style.display = "none";

  if (optA) optA.style.display = "block";
  if (optB) optB.style.display = "block";

  timerEl.style.display = "block";

  startCountdown(30);
}

function goToTask3() {
  if (currentStage !== "outcome2") return;

  currentStage = "task3";

  screenEl.src = "assets/image/task3.png";

  if (task3Btn) task3Btn.style.display = "none";

  if (optA) optA.style.display = "block";
  if (optB) optB.style.display = "block";
  timerEl.style.display = "block";

  startCountdown(30);
}

// 自动播放被拦截时：点击解锁
if (audioUnlock) {
  audioUnlock.addEventListener("click", async () => {
    try {
      await Promise.all([
        startTaskAudio(),
        startTaskBgm()
      ]);

      audioUnlock.classList.add("hidden");
    } catch (e) {
      console.warn("Audio still blocked after user click:", e);

      const sub = audioUnlock.querySelector(".unlock-sub");
      if (sub) {
        sub.textContent = "Please allow audio in your browser settings";
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  // ✅ 先适配舞台
  fitStage();
  requestFitStage();
  setTimeout(requestFitStage, 60);
  setTimeout(requestFitStage, 180);

  setWarning(false);

  // ✅ Option A/B：点击进入 goToResult
  if (optA) {
    optA.addEventListener("click", () => {
      hideWarningImmediately();
      goToResult();
    });
  }

  if (optB) {
    optB.addEventListener("click", () => {
      hideWarningImmediately();
      goToResult();
    });
  }

  // ✅ Task2 / Task3
  if (task2Btn) {
    task2Btn.onclick = null;
    task2Btn.addEventListener("click", goToTask2);
  }

  if (task3Btn) {
    task3Btn.onclick = null;
    task3Btn.addEventListener("click", goToTask3);
  }

  if (analyseBtn) {
    analyseBtn.onclick = null;
    analyseBtn.addEventListener("click", () => {
      if (currentStage !== "outcome3") return;

      saveBgmState();
      window.location.href = "analyse.html";
    });
  }

  // ✅ 只在 task 阶段启动倒计时
  if (currentStage === "task") startCountdown(30);

  // ✅ result 音频播完 → outcome1
  if (resultAudio) {
    resultAudio.onended = null;
    resultAudio.addEventListener("ended", () => {
      if (currentStage !== "result") return;
      restoreBgm();

      currentStage = "outcome1";
      screenEl.src = "assets/image/outcome1.png";

      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }

      if (task2Btn) task2Btn.style.display = "block";
    });
  }

  // ✅ result2 音频播完 → outcome2
  if (result2Audio) {
    result2Audio.onended = () => {
      if (currentStage !== "result2") return;
      restoreBgm();

      currentStage = "outcome2";
      screenEl.src = "assets/image/outcome2.png";

      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }

      if (task3Btn) task3Btn.style.display = "block";
    };
  }

  // ✅ result3 音频播完 → outcome3
  if (result3Audio) {
    result3Audio.onended = () => {
      if (currentStage !== "result3") return;
      restoreBgm();

      currentStage = "outcome3";
      screenEl.src = "assets/image/outcome3.png";

      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }

      if (analyseBtn) analyseBtn.style.display = "block";
    };
  }
});

// ✅ 新增：窗口尺寸变化时重新适配舞台
window.addEventListener("resize", requestFitStage);
window.addEventListener("orientationchange", requestFitStage);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", requestFitStage);
  window.visualViewport.addEventListener("scroll", requestFitStage);
}