const acceptBtn = document.querySelector(".accept-btn");
const rejectBtn = document.querySelector(".reject-btn");
const btnGroup = document.getElementById("btnGroup");
const playerNameSlot = document.getElementById("playerNameSlot");
const flash = document.getElementById("flashOverlay");
const blackOverlay = document.getElementById("blackOverlay");
const stage = document.getElementById("stage");
const emailPanel = document.getElementById("emailPanel");

const bgmAmbient = document.getElementById("bgmAmbient");
const bgmGlitch = document.getElementById("bgmGlitch");

/* ===== 音频淡入淡出 ===== */
function fadeInAudio(audio, duration = 4000, targetVolume = 0.18) {
  if (!audio) return;

  const stepTime = 50;
  const steps = Math.max(1, Math.floor(duration / stepTime));
  const volumeStep = (targetVolume - audio.volume) / steps;

  const fade = setInterval(() => {
    const next = audio.volume + volumeStep;

    if (
      (volumeStep >= 0 && next >= targetVolume) ||
      (volumeStep < 0 && next <= targetVolume)
    ) {
      audio.volume = targetVolume;
      clearInterval(fade);
    } else {
      audio.volume = Math.max(0, Math.min(1, next));
    }
  }, stepTime);
}

function fadeOutAudio(audio, duration = 500, callback) {
  if (!audio) {
    if (callback) callback();
    return;
  }

  const stepTime = 50;
  const steps = Math.max(1, Math.floor(duration / stepTime));
  const volumeStep = audio.volume / steps;

  const fade = setInterval(() => {
    const next = audio.volume - volumeStep;

    if (next <= 0.01) {
      audio.volume = 0;
      clearInterval(fade);
      if (callback) callback();
    } else {
      audio.volume = Math.max(0, next);
    }
  }, stepTime);
}

/* ===== 读取 Scene3 传来的 ambient 状态 ===== */
function getSavedEmailBgmState() {
  return {
    shouldResume: sessionStorage.getItem("emailAmbientShouldResume") === "true",
    ambientTime: parseFloat(sessionStorage.getItem("emailAmbientTime") || "0"),
    ambientVolume: parseFloat(sessionStorage.getItem("emailAmbientVolume") || "0.16")
  };
}

function clearSavedEmailBgmState() {
  sessionStorage.removeItem("emailAmbientShouldResume");
  sessionStorage.removeItem("emailAmbientTime");
  sessionStorage.removeItem("emailAmbientVolume");
}

/* ===== 给 microphone 页面保存 ambient 状态 ===== */
function saveMicrophoneBgmState() {
  if (!bgmAmbient) return;

  sessionStorage.setItem("microphoneAmbientShouldResume", "true");
  sessionStorage.setItem("microphoneAmbientTime", String(bgmAmbient.currentTime || 0));
  sessionStorage.setItem("microphoneAmbientVolume", String(bgmAmbient.volume || 0.5));
}

/* ===== 启动 Email 页面双音轨 ===== */
function startEmailBgm() {
  const saved = getSavedEmailBgmState();

  if (bgmAmbient) {
    bgmAmbient.volume = 0;

    if (saved.shouldResume && !Number.isNaN(saved.ambientTime)) {
      try {
        bgmAmbient.currentTime = saved.ambientTime;
      } catch (err) {
        console.log("设置 ambient 播放进度失败", err);
      }
    }

    bgmAmbient.play().then(() => {
      fadeInAudio(bgmAmbient, 1200, saved.ambientVolume || 0.5);
    }).catch(() => {
      console.log("Email ambient autoplay 被拦截，等待用户交互");
    });
  }

  if (bgmGlitch) {
    bgmGlitch.volume = 0;
    bgmGlitch.play().then(() => {
      fadeInAudio(bgmGlitch, 1600, 0.38);
    }).catch(() => {
      console.log("Email glitch autoplay 被拦截，等待用户交互");
    });
  }

  clearSavedEmailBgmState();
}

let emailBgmStarted = false;

function ensureEmailBgmStarts() {
  if (emailBgmStarted) return;
  emailBgmStarted = true;
  startEmailBgm();
}

/* ===== 页面载入时启动 ===== */
window.addEventListener("load", ensureEmailBgmStarts);
window.addEventListener("pointerdown", ensureEmailBgmStarts, { once: true });
window.addEventListener("keydown", ensureEmailBgmStarts, { once: true });

/* ===== 玩家姓名 ===== */
const savedName = localStorage.getItem("playerName") || "XXX";

if (playerNameSlot) {
  playerNameSlot.textContent = savedName;
}

/* ===== ACCEPT 按钮 ===== */
if (acceptBtn) {
  acceptBtn.addEventListener("click", () => {
    acceptBtn.style.pointerEvents = "none";
    if (rejectBtn) rejectBtn.style.pointerEvents = "none";

    // 先把 ambient 状态存给下一页
    saveMicrophoneBgmState();

    // 1. 邮件内容先淡出
    if (emailPanel) {
      emailPanel.classList.add("fade-out");
    }

    // 2. 稍后黑屏出现
    setTimeout(() => {
      if (blackOverlay) {
        blackOverlay.classList.add("active");
      }
    }, 650);

    // 3. 黑屏上做一次白闪
    setTimeout(() => {
      if (flash) {
        flash.classList.remove("active");
        void flash.offsetWidth;
        flash.classList.add("active");
      }
    }, 760);

    // 4. 黑屏轻微闪动 / glitch
    setTimeout(() => {
      if (blackOverlay) {
        blackOverlay.classList.add("glitch");
      }
    }, 850);

    // 5. 跳转前把 Email 的 glitch 淡出
    setTimeout(() => {
      fadeOutAudio(bgmGlitch, 450);
    }, 1050);

    // 6. 跳转
    setTimeout(() => {
      window.location.href = "../microphone/microphone.html";
    }, 1700);
  });
}

/* ===== REJECT 按钮 ===== */
if (rejectBtn) {
  rejectBtn.addEventListener("click", () => {
    console.log("REJECT clicked");
  });
}

/* ===== 按钮组出现后 2 秒让 REJECT 消失 ===== */
if (btnGroup && rejectBtn) {
  btnGroup.addEventListener("animationend", (e) => {
    if (e.animationName === "btnFadeIn") {
      setTimeout(() => {
        rejectBtn.classList.add("fade-out");
      }, 2000);
    }
  });
}