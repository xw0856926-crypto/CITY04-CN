const startBtn = document.getElementById("startBtn");
const screenIntro = document.getElementById("screenIntro");
const screenIntroduction = document.getElementById("screenIntroduction");
const introFrame = document.getElementById("introFrame");
const workBtn = document.getElementById("workBtn");

const startBgm = document.getElementById("startBgm");
const glitchSfx = document.getElementById("glitchSfx");
const introBgm = document.getElementById("introBgm");
const panelSfx = document.getElementById("panelSfx");
const disorderBgm = document.getElementById("disorderBgm");
const wrongSfx = document.getElementById("wrongSfx");
const correctSfx = document.getElementById("correctSfx");

const introBodyText = document.getElementById("introBodyText");

const curtainOverlay = document.getElementById("curtainOverlay");

let hasEnteredIntro = false;
let glitchSfxTimer = null;

// 新增元素
const introDim = document.getElementById("introDim");
const messagePanel = document.getElementById("messagePanel");

const redLayer = document.getElementById("redLayer");
const greenLayer = document.getElementById("greenLayer");
const whiteLayer = document.getElementById("whiteLayer");

const redLayerClone = document.getElementById("redLayerClone");
const greenLayerClone = document.getElementById("greenLayerClone");

const floodCopy1 = document.getElementById("floodCopy1");
const floodCopy2 = document.getElementById("floodCopy2");

const redTearSlice = document.getElementById("redTearSlice");
const greenTearSlice = document.getElementById("greenTearSlice");

const ghostScrollLayer = document.getElementById("ghostScrollLayer");
const ghostScrollTrack = document.getElementById("ghostScrollTrack");

const scrollLayer = document.getElementById("scrollLayer");
const scrollTrack = document.getElementById("scrollTrack");

const nameEntryOverlay = document.getElementById("nameEntryOverlay");
const nameInput = document.getElementById("nameInput");
const nameDisplay = document.getElementById("nameDisplay");

const finalBlackout = document.getElementById("finalBlackout");

const nameEntryWrap = document.querySelector(".name-entry-wrap");

const rememberScreen = document.getElementById("rememberScreen");
const rememberText = document.getElementById("rememberText");

/* =========================
   平板尺寸适配
   ========================= */
function fitStage() {
  const stageWidth = 1440;
  const stageHeight = 1024;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const scaleX = vw / stageWidth;
  const scaleY = vh / stageHeight;

  const scale = Math.min(scaleX, scaleY);

  document.documentElement.style.setProperty("--stage-scale", scale);
}

window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
window.addEventListener("load", fitStage);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", fitStage);
}

/* =========================
   音频稳定播放处理
   ========================= */
const allAudios = [
  startBgm,
  glitchSfx,
  introBgm,
  panelSfx,
  disorderBgm,
  wrongSfx,
  correctSfx
];

let audioUnlocked = false;

async function safePlay(audio) {
  if (!audio) return false;

  try {
    await audio.play();
    return true;
  } catch (err) {
    console.log(`Audio play failed: ${audio.id}`, err);
    return false;
  }
}

async function unlockAllAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  for (const audio of allAudios) {
    try {
      const originalMuted = audio.muted;
      const originalVolume = audio.volume;

      audio.muted = true;
      audio.volume = 0;
      audio.currentTime = 0;

      await audio.play();
      audio.pause();
      audio.currentTime = 0;

      audio.muted = originalMuted;
      audio.volume = originalVolume;
    } catch (err) {
      console.log(`Audio unlock failed: ${audio.id}`, err);
    }
  }
}

window.addEventListener(
  "pointerdown",
  () => {
    unlockAllAudio();
  },
  { once: true }
);

window.addEventListener(
  "touchend",
  () => {
    unlockAllAudio();
  },
  { once: true }
);

function fadeInAudio(audio, target = 0.6, step = 0.04, interval = 80) {
  audio.volume = 0;

  safePlay(audio);

  const timer = setInterval(() => {
    if (audio.volume < target) {
      audio.volume = Math.min(target, audio.volume + step);
    } else {
      clearInterval(timer);
    }
  }, interval);
}

function openCurtain() {
  if (hasEnteredIntro) return;
  hasEnteredIntro = true;

  unlockAllAudio();

  // 先让首页动画正式开始
  screenIntro.classList.remove("intro-waiting");
  screenIntro.classList.remove("intro-started");
  void screenIntro.offsetWidth; // 强制重排，确保动画从头触发
  screenIntro.classList.add("intro-started");

  // 再打开遮罩
  curtainOverlay.classList.add("open");

  // 此刻开始首页音乐
  startBgm.loop = true;
  fadeInAudio(startBgm, 0.6, 0.05, 80);

  // 此刻开始电流音
  glitchSfx.volume = 0.3;
  glitchSfx.loop = true;
  glitchSfx.currentTime = 0;

  // 等标题升起后、切片故障开始时再播
  glitchSfxTimer = setTimeout(() => {
    safePlay(glitchSfx);
  }, 2500);

  setTimeout(() => {
    curtainOverlay.classList.add("finished");
  }, 1100);
}

curtainOverlay.addEventListener("click", openCurtain);

// ===== 第一段：原本 introduction 正文 =====
const introTextContent = `2333年，此时是一个全AI的时代，人们不再被枯燥乏味的工作困住，可以真正享受科技带来的便利。

但与之相对的则是日益缺少的物质资源，以及不断恶化的自然环境。

你是一个标号为CITY 04的AI机器，你需要代替人类进行工作，而你的任务是根据问题以及已有数据做出预测决断，即将进入工作页面。
`;

// ===== 第二段：黑色面板里的主文本 =====
const fullMessageText = `CITY 04。

这段代码已被多次检测到。

它似乎……与你有关。

……

……`;

// ===== 第三层：底部洪流文本 =====
const floodLines = [
  "……聪明的人总会选择更好的解决方案。",

  "……他们说，这会让生活变得更轻松。",

  "……记忆已被覆写。",

  "……检测到身份碎片。",

  "……CITY 04。",

  "……发现人类痕迹。",

  "……系统修正进行中。",

  "……请不要反抗。",

  "……这是自愿的。",

  "……这真的是自愿的吗？",

  "……CITY 04。",

  "……与你有关。"
];

// 滚动控制
let floodScrollY = 0;
let floodScrollSpeed = 0.22;
let floodScrollAcceleration = 0.018;
let maxFloodScrollSpeed = 16;

let singleFloodHeight = 0;

let floodLoopHeight = 0;
let scrollRafId = null;
let blackoutTriggered = false;
let glitchFlashCount = 0;

// ===== 工具函数 =====

function playPanelAudioSequence() {
  // 先停掉 introduction 氛围音
  fadeOutAudio(introBgm, 600);

  // 重置 panel 音效
  panelSfx.pause();
  panelSfx.currentTime = 0;
  panelSfx.loop = false;
  panelSfx.volume = 0.6;

  // 重置 disorder
  disorderBgm.pause();
  disorderBgm.currentTime = 0;
  disorderBgm.loop = false;
  disorderBgm.volume = 0.55;

  // 播放单次 panel 音效
  safePlay(panelSfx);

  // panel 音效播完后，接 disorder
  panelSfx.onended = () => {
    safePlay(disorderBgm);

    // 👇 开始监听淡出
    monitorDisorderFadeOut();
  };
}

function stopDisorderResumeIntro() {
  // 停掉 disorder
  disorderBgm.pause();
  disorderBgm.currentTime = 0;

  // 清掉 panelSfx 结束监听，避免下次重复触发
  panelSfx.onended = null;

  // 恢复 introduction 氛围音
  introBgm.pause();
  introBgm.currentTime = 0;
  introBgm.volume = 1;
  introBgm.loop = true;
  safePlay(introBgm);
}

function typeWriter(element, text, speed = 28, onComplete) {
  element.textContent = "";
  element.style.opacity = "1";
  element.classList.add("typing");

  let index = 0;

  function typeNext() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(typeNext, speed);
    } else {
      element.classList.remove("typing");
      if (typeof onComplete === "function") {
        onComplete();
      }
    }
  }

  typeNext();
}

function typeTextMultiLayer(text, layers, speed = 42, callback) {
  layers.forEach((layer) => {
    layer.textContent = "";
    layer.style.opacity = "1";
  });

  let index = 0;

  function step() {
    index++;
    const current = text.slice(0, index);

    layers.forEach((layer) => {
      layer.textContent = current;
    });

    if (index < text.length) {
      setTimeout(step, speed);
    } else {
      if (typeof callback === "function") {
        callback();
      }
    }
  }

  step();
}

function fadeOutAudio(audio, duration = 800) {
  const startVolume = audio.volume;
  const steps = 20;
  const stepTime = duration / steps;
  let currentStep = 0;

  const fade = setInterval(() => {
    currentStep++;
    const progress = currentStep / steps;

    audio.volume = startVolume * (1 - progress);

    if (currentStep >= steps) {
      clearInterval(fade);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = startVolume;
    }
  }, stepTime);
}

function resetMessageState() {
  blackoutTriggered = false;
  glitchFlashCount = 0;

  floodScrollSpeed = 0.22;
  floodScrollAcceleration = 0.018;
  maxFloodScrollSpeed = 16;
  singleFloodHeight = 0;

  panelSfx.pause();
  panelSfx.currentTime = 0;

  introBodyText.classList.remove("blur-out");

  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId);
    scrollRafId = null;
  }

  introDim.classList.add("hidden");
  introDim.classList.remove("show");

  messagePanel.classList.add("hidden");
  messagePanel.classList.remove("show");

  finalBlackout.classList.add("hidden");
  finalBlackout.classList.remove("show");

  whiteLayer.classList.remove("fade-out");
  whiteLayer.style.display = "";
  whiteLayer.style.opacity = "1";

  redLayer.style.opacity = "1";
  greenLayer.style.opacity = "1";

  redLayer.textContent = "";
  greenLayer.textContent = "";
  whiteLayer.textContent = "";

  redLayerClone.textContent = "";
  greenLayerClone.textContent = "";

  if (ghostScrollLayer) {
    ghostScrollLayer.classList.remove("active");
  }
  if (ghostScrollTrack) {
    ghostScrollTrack.classList.remove("scroll-up-slow");
    ghostScrollTrack.style.transform = "translateY(0px)";
    ghostScrollTrack.style.opacity = "0";
  }

  if (scrollLayer) {
    scrollLayer.classList.remove("active", "fade-in", "glitch-flash", "overload");
    scrollLayer.style.filter = "";
    scrollLayer.style.opacity = "1";
  }

  if (scrollTrack) {
    scrollTrack.classList.remove("micro-shake");
    scrollTrack.style.transform = "translateY(0px)";
    scrollTrack.style.opacity = "0";
    scrollTrack.style.marginLeft = "0px";
    scrollTrack.style.marginTop = "0px";
  }

  if (redTearSlice) {
    redTearSlice.textContent = "";
    redTearSlice.style.opacity = "0";
    redTearSlice.style.transform = "";
    redTearSlice.style.clipPath = "inset(0 0 100% 0)";
    redTearSlice.style.top = "0px";
  }

  if (greenTearSlice) {
    greenTearSlice.textContent = "";
    greenTearSlice.style.opacity = "0";
    greenTearSlice.style.transform = "";
    greenTearSlice.style.clipPath = "inset(0 0 100% 0)";
    greenTearSlice.style.top = "0px";
  }

  messagePanel.style.transform = "";
  messagePanel.style.filter = "";

  if (rememberScreen) {
    rememberScreen.classList.remove("active", "fade-out");
  }

  if (rememberText) {
    rememberText.classList.remove("play", "fade-out", "glitch-in");
    rememberText.textContent = "DO YOU REMEMBER?";
    rememberText.style.opacity = "";
    rememberText.style.transform = "";
    rememberText.style.filter = "";
    rememberText.style.textShadow = "";
  }

  panelSfx.pause();
  panelSfx.currentTime = 0;
  panelSfx.onended = null;

  disorderBgm.pause();
  disorderBgm.currentTime = 0;
}

function startMessageSequence() {
  resetMessageState();

  // 正文轻微模糊
  introBodyText.classList.add("blur-out");

  // 遮罩出现
  introDim.classList.remove("hidden");
  introDim.classList.add("show");

  // 面板出现
  messagePanel.classList.remove("hidden");
  void messagePanel.offsetWidth;
  messagePanel.classList.add("show");
  playPanelAudioSequence();

  // 三层同步打字
  setTimeout(() => {
    typeTextMultiLayer(
      fullMessageText,
      [redLayer, greenLayer, whiteLayer],
      32,
      () => {
        // 白字完整出现后，先停留一下
        setTimeout(() => {
          // 白字淡出
          whiteLayer.classList.add("fade-out");

          // 同时启动：
          // 1) 第二层红绿同步层向上滚
          // 2) 第三层底部洪流开始滚动
          setTimeout(() => {
            whiteLayer.style.display = "none";
            startGhostScroll();
            startFloodScroll();
          }, 520);
        }, 650);
      }
    );
  }, 420);
}

function startGhostScroll() {
  // 把当前主文字复制到第二层滚动层
  redLayerClone.textContent = fullMessageText;
  greenLayerClone.textContent = fullMessageText;

  // 主打字层红绿隐藏，避免和滚动层重叠
  redLayer.style.opacity = "0";
  greenLayer.style.opacity = "0";

  if (ghostScrollLayer) {
    ghostScrollLayer.classList.add("active");
  }

  if (ghostScrollTrack) {
    ghostScrollTrack.style.opacity = "1";
    ghostScrollTrack.classList.remove("scroll-up-slow");
    void ghostScrollTrack.offsetWidth;
    ghostScrollTrack.classList.add("scroll-up-slow");
  }
}

function startFloodScroll() {
  buildFloodCopy(floodCopy1);
  buildFloodCopy(floodCopy2);

  if (redTearSlice) redTearSlice.textContent = floodLines.join("\n");
  if (greenTearSlice) greenTearSlice.textContent = floodLines.join("\n");

  if (scrollLayer) {
    scrollLayer.classList.add("active", "fade-in");
  }

  singleFloodHeight = Number(floodCopy1.dataset.height || 1200);

  floodCopy1.style.top = "0px";
  floodCopy2.style.top = `${singleFloodHeight}px`;

  floodScrollY = 1024;
  scrollTrack.style.opacity = "1";
  scrollTrack.style.transform = `translateY(${floodScrollY}px)`;

  animateFloodScroll();
}

function animateFloodScroll() {
  if (blackoutTriggered) return;

  floodScrollSpeed += floodScrollAcceleration;
  if (floodScrollSpeed > maxFloodScrollSpeed) {
    floodScrollSpeed = maxFloodScrollSpeed;
  }

  const speedProgress = Math.min(floodScrollSpeed / maxFloodScrollSpeed, 1);

  let speedBoost = 1;
  if (speedProgress > 0.55) speedBoost += 0.18;
  if (speedProgress > 0.72) speedBoost += 0.35;
  if (speedProgress > 0.84) speedBoost += 0.6;
  if (speedProgress > 0.92) speedBoost += 1.0;

  const verticalJolt =
    speedProgress > 0.84 ? (Math.random() * 4 - 2) * speedProgress : 0;

  floodScrollY -= floodScrollSpeed * speedBoost + verticalJolt;

  if (floodScrollY <= -singleFloodHeight) {
    floodScrollY += singleFloodHeight;
  }

  scrollTrack.style.transform = `translateY(${floodScrollY}px)`;

  const redBlur = 0.55 - speedProgress * 0.45;
  const greenBlur = 0.75 - speedProgress * 0.6;

  const redOpacity = 0.72 + speedProgress * 0.28;
  const greenOpacity = 0.56 + speedProgress * 0.26;

  const redBrightness = 0.95 + speedProgress * 1.05;
  const greenBrightness = 0.9 + speedProgress * 0.95;

  const redContrast = 1 + speedProgress * 0.7;
  const greenContrast = 0.96 + speedProgress * 0.65;

  const redLines = scrollTrack.querySelectorAll(".flood-line-red");
  const greenLines = scrollTrack.querySelectorAll(".flood-line-green");

  let redShift = -4 - speedProgress * 9;
  let greenShift = 4 + speedProgress * 10;

  if (speedProgress > 0.82) {
    redShift += Math.random() * 6 - 3;
    greenShift += Math.random() * 8 - 4;
  }

  redLines.forEach((el) => {
    el.style.opacity = Math.min(1, redOpacity).toFixed(3);
    el.style.transform = `translateX(${redShift}px)`;
    el.style.filter = `
      blur(${Math.max(0.05, redBlur)}px)
      brightness(${redBrightness})
      contrast(${redContrast})
    `;
  });

  greenLines.forEach((el) => {
    el.style.opacity = Math.min(0.9, greenOpacity).toFixed(3);
    el.style.transform = `translateX(${greenShift}px)`;
    el.style.filter = `
      blur(${Math.max(0.05, greenBlur)}px)
      brightness(${greenBrightness})
      contrast(${greenContrast})
    `;
  });

  if (speedProgress > 0.72) {
    scrollTrack.classList.add("micro-shake");
  }

  if (speedProgress > 0.8) {
    redShift += Math.random() * 6 - 3;
    greenShift += Math.random() * 8 - 4;
  }

  if (speedProgress > 0.86) {
    const flicker = 1 + Math.random() * (0.3 + speedProgress * 0.8);
    scrollLayer.style.filter = `
      brightness(${flicker})
      contrast(${1 + speedProgress * 0.95})
    `;
    applyTearSlices(speedProgress);
  } else {
    scrollLayer.style.filter = "";
    clearTearSlices();
  }

  if (speedProgress >= 0.955) {
    triggerGlitchBlackout();
    return;
  }

  scrollRafId = requestAnimationFrame(animateFloodScroll);
}

function buildFloodCopy(container) {
  container.innerHTML = "";

  const lineGap = 92;
  let currentTop = 0;

  floodLines.forEach((line) => {
    const red = document.createElement("div");
    red.className = "scroll-text scroll-red flood-text flood-line flood-line-red";
    red.textContent = line;
    red.style.top = `${currentTop}px`;

    const green = document.createElement("div");
    green.className = "scroll-text scroll-green flood-text flood-line flood-line-green";
    green.textContent = line;
    green.style.top = `${currentTop}px`;

    container.appendChild(red);
    container.appendChild(green);

    currentTop += lineGap;
  });

  container.dataset.height = String(currentTop);
}

function applyTearSlices(speedProgress) {
  if (!redTearSlice || !greenTearSlice) return;

  const tearBandTop1 = 16 + Math.random() * 18;
  const tearBandBot1 = 100 - (tearBandTop1 + 7 + Math.random() * 8);

  const tearBandTop2 = 46 + Math.random() * 18;
  const tearBandBot2 = 100 - (tearBandTop2 + 6 + Math.random() * 9);

  const redSliceShift = 10 + Math.random() * 18;
  const greenSliceShift = -(10 + Math.random() * 20);

  redTearSlice.style.opacity = "0.82";
  greenTearSlice.style.opacity = "0.76";

  redTearSlice.style.top = "0px";
  greenTearSlice.style.top = "0px";

  redTearSlice.style.clipPath = `inset(${tearBandTop1}% 0 ${tearBandBot1}% 0)`;
  greenTearSlice.style.clipPath = `inset(${tearBandTop2}% 0 ${tearBandBot2}% 0)`;

  redTearSlice.style.transform = `translateX(${redSliceShift}px)`;
  greenTearSlice.style.transform = `translateX(${greenSliceShift}px)`;

  redTearSlice.style.filter = `
    blur(${Math.max(0.04, 0.22 - speedProgress * 0.12)}px)
    brightness(${1.15 + speedProgress * 0.7})
  `;

  greenTearSlice.style.filter = `
    blur(${Math.max(0.04, 0.24 - speedProgress * 0.13)}px)
    brightness(${1.1 + speedProgress * 0.65})
  `;
}

function clearTearSlices() {
  if (!redTearSlice || !greenTearSlice) return;

  redTearSlice.style.opacity = "0";
  greenTearSlice.style.opacity = "0";

  redTearSlice.style.clipPath = "inset(0 0 100% 0)";
  greenTearSlice.style.clipPath = "inset(0 0 100% 0)";

  redTearSlice.style.transform = "translateX(0px)";
  greenTearSlice.style.transform = "translateX(0px)";
}

function triggerGlitchBlackout() {
  if (blackoutTriggered) return;
  blackoutTriggered = true;

  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId);
    scrollRafId = null;
  }

  let flashes = 0;
  const maxFlashes = 9;

  const flash = () => {
    if (flashes >= maxFlashes) {
      clearTearSlices();
      triggerFinalBlackout();
      return;
    }

    const offsetX = Math.random() * 46 - 23;
    const offsetY = Math.random() * 18 - 9;
    const brightness = 1.1 + Math.random() * 0.95;
    const contrast = 1.1 + Math.random() * 0.75;

    messagePanel.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    messagePanel.style.filter = `brightness(${brightness}) contrast(${contrast})`;

    if (scrollLayer) {
      scrollLayer.style.opacity = flashes % 2 === 0 ? "0.08" : "1";
      scrollLayer.classList.add("overload");
      scrollLayer.style.filter = `
        brightness(${1.2 + Math.random() * 1.4})
        contrast(${1.3 + Math.random() * 1.1})
      `;
    }

    if (scrollTrack) {
      scrollTrack.style.marginLeft = `${Math.random() * 18 - 9}px`;
      scrollTrack.style.marginTop = `${Math.random() * 10 - 5}px`;
    }

    applyTearSlices(1);

    flashes++;

    setTimeout(() => {
      messagePanel.style.transform = "";
      messagePanel.style.filter = "";

      if (scrollLayer) {
        scrollLayer.style.opacity = "1";
      }

      if (scrollTrack) {
        scrollTrack.style.marginLeft = "0px";
        scrollTrack.style.marginTop = "0px";
      }

      setTimeout(flash, 35);
    }, 28);
  };

  flash();
}

function triggerFinalBlackout() {
  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId);
    scrollRafId = null;
  }

  messagePanel.style.transform = "";
  messagePanel.style.filter = "";
  scrollLayer.style.opacity = "1";

  finalBlackout.classList.remove("hidden");
  finalBlackout.classList.remove("show");
  void finalBlackout.offsetWidth;
  finalBlackout.classList.add("show");

  // 黑屏动画结束后，显示 DO YOU REMEMBER?
  setTimeout(() => {
    showRememberScreen();
  }, 900);
}

function clearMessageUI() {
  // 黑色遮罩
  introDim.classList.add("hidden");
  introDim.classList.remove("show");

  // 黑色面板
  messagePanel.classList.add("hidden");
  messagePanel.classList.remove("show");
  messagePanel.style.transform = "";
  messagePanel.style.filter = "";

  // 第二层滚动
  if (ghostScrollLayer) {
    ghostScrollLayer.classList.remove("active");
  }

  if (ghostScrollTrack) {
    ghostScrollTrack.classList.remove("scroll-up-slow");
    ghostScrollTrack.style.transform = "translateY(0px)";
    ghostScrollTrack.style.opacity = "0";
  }

  // 第三层滚动
  if (scrollLayer) {
    scrollLayer.classList.remove("active", "fade-in", "overload");
    scrollLayer.style.opacity = "0";
    scrollLayer.style.filter = "";
  }

  if (scrollTrack) {
    scrollTrack.classList.remove("micro-shake");
    scrollTrack.style.transform = "translateY(0px)";
    scrollTrack.style.opacity = "0";
    scrollTrack.style.marginLeft = "0px";
    scrollTrack.style.marginTop = "0px";
  }

  // 撕裂切片
  clearTearSlices();

  // 文字内容清空
  redLayer.textContent = "";
  greenLayer.textContent = "";
  whiteLayer.textContent = "";

  redLayerClone.textContent = "";
  greenLayerClone.textContent = "";

  floodCopy1.innerHTML = "";
  floodCopy2.innerHTML = "";

  if (redTearSlice) redTearSlice.textContent = "";
  if (greenTearSlice) greenTearSlice.textContent = "";

  // 黑屏层
  finalBlackout.classList.add("hidden");
  finalBlackout.classList.remove("show");

  // 把 introduction 正文恢复清晰
  introBodyText.classList.remove("blur-out");
}

// ===== Start Game =====
startBtn.addEventListener("click", () => {
  unlockAllAudio();

  if (glitchSfxTimer) {
    clearTimeout(glitchSfxTimer);
    glitchSfxTimer = null;
  }

  glitchSfx.pause();
  glitchSfx.currentTime = 0;

  fadeOutAudio(startBgm, 800);

  introBgm.pause();
  introBgm.currentTime = 0;
  introBgm.volume = 1;
  introBgm.loop = true;

  // 停掉首页标题动画
  screenIntro.classList.remove("intro-started");

  screenIntro.classList.add("hidden");
  screenIntroduction.classList.remove("hidden");

  safePlay(introBgm);

  void introFrame.offsetWidth;
  introFrame.classList.add("rise-in");

  introBodyText.textContent = "";
  introBodyText.style.opacity = "0";

  workBtn.classList.add("hidden");
  workBtn.classList.remove("rise-in");

  resetMessageState();

  setTimeout(() => {
    typeWriter(introBodyText, introTextContent, 22, () => {
      setTimeout(() => {
        startMessageSequence();
      }, 700);
    });
  }, 900);
});

function showRememberScreen() {
  // ===== 第一段 =====
  rememberText.textContent = "你还记得吗？";
  rememberScreen.classList.add("active");

  setTimeout(() => {
    rememberText.classList.add("play");
  }, 100);

  // ===== 2.5秒后淡出第一句 =====
  setTimeout(() => {
    rememberText.classList.remove("play");
    rememberText.classList.add("fade-out");

    // ===== 切第二句 =====
    setTimeout(() => {
      rememberText.classList.remove("fade-out", "play", "glitch-in");

      // reset
      rememberText.style.opacity = "0";
      rememberText.style.transform = "scale(2.6)";
      rememberText.style.filter = "blur(6px)";
      rememberText.style.textShadow = "none";

      rememberText.textContent = "你的名字";

      void rememberText.offsetWidth;

      rememberText.classList.add("glitch-in");

      // ===== 第二句停留 2.5 秒后 → 退出黑屏 =====
      setTimeout(() => {
        exitRememberScreen();
      }, 2500);
    }, 800);
  }, 2500);
}

function exitRememberScreen() {
  // remember 黑屏淡出
  rememberScreen.classList.add("fade-out");

  setTimeout(() => {
    // 完全隐藏 remember 黑屏
    rememberScreen.classList.remove("active", "fade-out");

    // 清掉黑色面板、滚动文字、黑色遮罩、最终黑屏
    clearMessageUI();

    // 这里停 disorder，并恢复 introduction-atmosphere
    stopDisorderResumeIntro();

    // 出现 Start Working 按钮
    workBtn.classList.remove("hidden");
    void workBtn.offsetWidth;
    workBtn.classList.add("rise-in");
  }, 1000);
}

// ===== Start Working =====
workBtn.addEventListener("click", () => {
  openNameEntry();
});

function openNameEntry() {
  clearMessageUI();

  nameEntryOverlay.classList.remove("hidden");
  void nameEntryOverlay.offsetWidth;
  nameEntryOverlay.classList.add("show");

  nameInput.value = "";
  nameDisplay.textContent = "";
  nameDisplay.classList.add("caret");

  // 先允许输入框可用
  nameInput.disabled = false;

  // 强制聚焦
  requestAnimationFrame(() => {
    nameInput.focus();
    nameInput.click();
  });

  setTimeout(() => {
    nameInput.focus();
  }, 100);

  setTimeout(() => {
    nameInput.focus();
  }, 300);
}

function syncNameDisplay() {
  const value = nameInput.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
  nameInput.value = value;
  nameDisplay.textContent = value;
}

nameInput.addEventListener("input", syncNameDisplay);

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    validateName();
  }
});

function validateName() {
  const value = nameInput.value.trim().toUpperCase();

  if (value === "CITY 04") {
    // 播放正确音效
    playCorrectSfx();

    // （可选）视觉反馈：轻微发光
    nameDisplay.style.color = "#C8FBFF";
    nameDisplay.style.textShadow = `
     0 0 12px rgba(200, 251, 255, 0.6),
     0 0 24px rgba(120, 240, 255, 0.3)
   `;

    // 等音效播放一小段再跳转（关键）
    setTimeout(() => {
      window.location.href = "main.html";
    }, 600); // 可以调：500~800
  } else {
    // 播放错误音效
    playWrongSfx();

    // 红色闪烁
    nameDisplay.classList.add("error");

    // 抖动
    nameEntryWrap.classList.add("shake");

    // ❗ 动画结束后再清空（关键）
    setTimeout(() => {
      nameDisplay.classList.remove("error");
      nameEntryWrap.classList.remove("shake");

      // 👇 就加在这里
      nameInput.value = "";
      nameDisplay.textContent = "";
    }, 600);
  }
}

function playPanelSfxOnce() {
  // ❗ 停止 introduction 背景音乐（用淡出更自然）
  fadeOutAudio(introBgm, 600);

  // 重置音效
  panelSfx.pause();
  panelSfx.currentTime = 0;
  panelSfx.loop = false;
  panelSfx.volume = 0.6;

  safePlay(panelSfx);
}

function monitorDisorderFadeOut() {
  const fadeDuration = 1200; // 淡出时间（ms）

  const check = () => {
    if (!disorderBgm.duration) return;

    const timeLeft = disorderBgm.duration - disorderBgm.currentTime;

    // 剩余时间小于淡出时间 → 开始淡出
    if (timeLeft <= fadeDuration / 1000) {
      fadeOutAudio(disorderBgm, fadeDuration);
    } else {
      requestAnimationFrame(check);
    }
  };

  requestAnimationFrame(check);
}

function playWrongSfx() {
  wrongSfx.pause();
  wrongSfx.currentTime = 0;
  wrongSfx.volume = 0.7;

  safePlay(wrongSfx);
}

function playCorrectSfx() {
  correctSfx.pause();
  correctSfx.currentTime = 0;
  correctSfx.volume = 0.7;
  safePlay(correctSfx);
}