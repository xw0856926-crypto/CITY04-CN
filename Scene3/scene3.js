const stage = document.getElementById("stage");
const coreGlow = document.getElementById("coreGlow");
const mapFill = document.getElementById("mapFill");
const mapOutline = document.getElementById("mapOutline");
const mapText = document.getElementById("mapText");
const memoryPanel = document.getElementById("memoryPanel");

const mapHotspot = document.getElementById("mapHotspot");
const memoryOverlay = document.getElementById("memoryOverlay");
const memoryLine1 = document.getElementById("memoryLine1");
const memoryLine2 = document.getElementById("memoryLine2");
const memoryLine3 = document.getElementById("memoryLine3");

const glitchOverlay = document.getElementById("glitchOverlay");

/* ===== BGM：双音轨 ===== */
const bgmAmbient = document.getElementById("bgmAmbient");
const bgmGlitch = document.getElementById("bgmGlitch");

/* 初始音量为 0，后面淡入 */
if (bgmAmbient) bgmAmbient.volume = 0;
if (bgmGlitch) bgmGlitch.volume = 0;

function saveScene3BgmState() {
  if (!bgmAmbient) return;

  sessionStorage.setItem("emailAmbientShouldResume", "true");
  sessionStorage.setItem("emailAmbientTime", String(bgmAmbient.currentTime || 0));
  sessionStorage.setItem("emailAmbientVolume", String(bgmAmbient.volume || 0.16));
}

function clearScene3BgmState() {
  sessionStorage.removeItem("emailAmbientShouldResume");
  sessionStorage.removeItem("emailAmbientTime");
  sessionStorage.removeItem("emailAmbientVolume");
}

/* 淡入函数 */
function fadeInAudio(audio, duration = 3000, targetVolume = 0.2) {
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

/* 淡出函数 */
function fadeOutAudio(audio, duration = 400, callback) {
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

/* 播放双音轨 */
function startScene3Bgm() {
  if (bgmAmbient) {
    bgmAmbient.play().catch(() => {
      console.log("Ambient autoplay 被拦截，等待用户交互");
    });
  }

  if (bgmGlitch) {
    bgmGlitch.play().catch(() => {
      console.log("Glitch autoplay 被拦截，等待用户交互");
    });
  }

  fadeInAudio(bgmAmbient, 5000, 0.5);
  fadeInAudio(bgmGlitch, 5000, 0.18);
}

/* 如果浏览器拦截自动播放，首次点击时补播 */
let bgmStarted = false;

function ensureBgmStarts() {
  if (bgmStarted) return;
  bgmStarted = true;
  startScene3Bgm();
}

const STAGE_WIDTH = 1440;
const STAGE_HEIGHT = 1024;

function fitStage() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const scaleX = windowWidth / STAGE_WIDTH;
  const scaleY = windowHeight / STAGE_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  stage.style.transform = `scale(${scale})`;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function animateProgressAsync(fillEl, numEl, duration = 1000) {
  return new Promise(resolve => {
    const start = performance.now();

    const trackEl = fillEl.parentElement;
    const trackWidth = trackEl.offsetWidth;

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const percent = Math.floor(progress * 100);

      fillEl.style.width = percent + "%";
      numEl.textContent = percent + "%";

      const endOffset = 1;
      const gap = 1;
      const x = progress * trackWidth + gap;
      const clampedX = Math.max(0, Math.min(x, trackWidth + endOffset));

      numEl.style.transform = `translateX(${clampedX}px)`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        fillEl.style.width = "100%";
        numEl.textContent = "100%";
        numEl.style.transform = `translateX(${trackWidth + endOffset}px)`;
        resolve();
      }
    }

    requestAnimationFrame(update);
  });
}

async function playMemoryBlock(blockId, progressFillId, progressNumId) {
  const block = document.getElementById(blockId);
  if (!block) return;

  const checks = block.querySelectorAll(".check");
  const progressFill = document.getElementById(progressFillId);
  const progressNum = document.getElementById(progressNumId);

  if (!progressFill || !progressNum) return;

  checks.forEach(check => check.classList.remove("active"));
  progressFill.style.width = "0%";
  progressNum.textContent = "0%";

  for (let i = 0; i < checks.length; i++) {
    checks[i].classList.add("active");
    await wait(320);
  }

  await wait(120);
  await animateProgressAsync(progressFill, progressNum, 1000);
}

async function playAllMemoryBlocks() {
  await playMemoryBlock("voiceBlock", "voiceProgressFill", "voiceProgressNum");
  await wait(250);

  await playMemoryBlock("imageBlock", "imageProgressFill", "imageProgressNum");
  await wait(250);

  await playMemoryBlock("totalBlock", "totalProgressFill", "totalProgressNum");
  await wait(250);

  enableMapInteraction();
}

window.addEventListener("load", () => {
  fitStage();
  ensureBgmStarts();

  setTimeout(() => {
    if (mapText) {
      mapText.classList.add("show");
    }
  }, 2350);

  setTimeout(() => {
    coreGlow.style.opacity = "1";
    coreGlow.style.transform = "scale(1)";
    coreGlow.style.filter = "blur(18px)";
  }, 300);

  setTimeout(() => {
    coreGlow.style.transform = "scale(2.6)";
    coreGlow.style.filter = "blur(36px)";
    coreGlow.style.opacity = "0.85";

    mapFill.style.opacity = "0.72";
    mapFill.style.transform = "scale(1.03)";
    mapFill.style.filter = "blur(8px)";
  }, 1000);

  setTimeout(() => {
    mapFill.style.opacity = "1";
    mapFill.style.transform = "scale(1)";
    mapFill.style.filter = "blur(0px)";

    coreGlow.style.opacity = "0";
  }, 1800);

  setTimeout(() => {
    mapOutline.style.opacity = "1";
    mapOutline.style.filter = "blur(0px)";
  }, 2200);

  setTimeout(() => {
    playAllMemoryBlocks();
  }, 2700);

  if (mapHotspot) {
    mapHotspot.addEventListener("click", () => {
      ensureBgmStarts();
      mapHotspot.classList.remove("active");
      mapFill.classList.remove("clickable");
      showMemoryOverlay();
    });
  }
});

window.addEventListener("resize", fitStage);
window.addEventListener("pointerdown", ensureBgmStarts, { once: true });
window.addEventListener("keydown", ensureBgmStarts, { once: true });

function enableMapInteraction() {
  if (mapFill) {
    mapFill.classList.add("clickable");
  }

  if (mapHotspot) {
    mapHotspot.classList.add("active");
  }
}

function showMemoryOverlay() {
  memoryOverlay.classList.add("show");

  setTimeout(() => {
    memoryLine1?.classList.add("show");
  }, 250);

  setTimeout(() => {
    memoryLine2?.classList.add("show");
  }, 700);

  setTimeout(() => {
    memoryLine3?.classList.add("show");
  }, 1150);

  setTimeout(() => {
    triggerGlitchAndJump();
  }, 2000);
}

function triggerGlitchAndJump() {
  if (!glitchOverlay) return;

  glitchOverlay.classList.add("active");

  saveScene3BgmState();

  fadeOutAudio(bgmGlitch, 500);

  setTimeout(() => {
    window.location.href = "./email/email.html";
  }, 600);
}