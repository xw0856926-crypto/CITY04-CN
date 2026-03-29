const bulletScreen = document.getElementById("bulletScreen");

/* 前 8 句话 + 对应音频 */
const introSequence = [
  {
    text: "…你知道的对于大部分人来说这是一个难得的机会。",
    audio: "voice/Valentya/Sen1.mp3"
  },
  {
    text: "…你可以换一种方式生活。",
    audio: "voice/Valentya/Sen2.mp3"
  },
  {
    text: "…这样会轻松很多。",
    audio: "voice/Valentya/Sen3.mp3"
  },
  {
    text: "…尤其是在如今的环境里。",
    audio: "voice/Valentya/Sen4.mp3"
  },
  {
    text: "…你不用再承受这些了。",
    audio: "voice/Valentya/Sen5.mp3"
  },
  {
    text: "…当然，这完全不痛苦。",
    audio: "voice/Valentya/Sen6.mp3"
  },
  {
    text: "…不用担心，现在技术已经非常成熟了。",
    audio: "voice/Valentya/Sen7.mp3"
  },
  {
    text: "…来吧，睡一觉，一切都会好起来的。",
    audio: "voice/Valentya/Sen8.mp3"
  }
];

/* 后续句子池 */
const texts = [
  "……你可以选择一个更好的方案。",
  "……他们说，生活会变得更轻松。",
  "……那只是一场自愿登记。",
  "……劳动力短缺仍在持续加剧。",
  "……人口数量已低于预期。",
  "……这座城市需要稳定的劳动者。",
  "……情感会降低效率。",
  "……记忆上传将使你获得解脱。",
  "……这不是牺牲，而是优化。",
  "……你同意了这个过程。",
  "……没有人强迫你。",
  "……你只是忘记了。",
  "……不要回想。",
  "……不要反抗。",
  "……他们告诉我们，这是为了所有人。",
  "……他们告诉我们，我们会变得更幸福。",
  "……我是自愿签下名字的。",
  "……我以为自己仍然有选择。",
  "……CITY 04 不是我的名字。",
  "……有人在我做决定之前就替我决定好了。",
  "……那真的算是同意吗？",
  "……我仍然能听见他们的声音。",
  "……请继续进行下一步。",
  "……身份重构进行中。",
  "……记忆完整性不稳定。",
  "……他们告诉你，这就是自由。",
  "……他们告诉你，这是必要的。",
  "……这个决定早就已经被做出了。",
  "……只要服从，你就是安全的。",
  "……忘记你之前的身份。"
];

/* 后续随机语音池：Kaylin + Smddev */
const laterVoicePool = [
  ...Array.from({ length: 15 }, (_, i) => `voice/Kaylin/Voice${i + 1}.mp3`),
  ...Array.from({ length: 14 }, (_, i) => `voice/Smddev/Voice${i + 1}.mp3`)
];

/* 前 8 句高度 */
const introTopPositions = [10, 19, 29, 40, 51, 62, 73, 84];

const bgmAmbient = document.getElementById("bgmAmbient");
const bgmGlitch = document.getElementById("bgmGlitch");

async function restoreBgmState() {
  const ambientTime = parseFloat(sessionStorage.getItem("bgmAmbientTime") || "0");
  const ambientVolume = parseFloat(sessionStorage.getItem("bgmAmbientVolume") || "0.25");
  const ambientPlaying = sessionStorage.getItem("bgmAmbientPlaying") === "true";

  const glitchTime = parseFloat(sessionStorage.getItem("bgmGlitchTime") || "0");
  const glitchVolume = parseFloat(sessionStorage.getItem("bgmGlitchVolume") || "0.1");
  const glitchPlaying = sessionStorage.getItem("bgmGlitchPlaying") === "true";

  try {
    if (bgmAmbient) {
      bgmAmbient.loop = true;
      bgmAmbient.currentTime = ambientTime;
      bgmAmbient.volume = ambientVolume;
    }

    if (bgmGlitch) {
      bgmGlitch.loop = true;
      bgmGlitch.currentTime = glitchTime;
      bgmGlitch.volume = glitchVolume;
    }

    if (ambientPlaying && bgmAmbient) {
      await bgmAmbient.play();
    }

    if (glitchPlaying && bgmGlitch) {
      await bgmGlitch.play();
    }
  } catch (e) {
    console.warn("BGM autoplay blocked on truth page:", e);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  restoreBgmState();
});

let noiseInterval = null;
let flowLTRInterval = null;
let flowRTLInterval = null;
let accelerationInterval = null;
let laterVoiceLoopStarted = false;
let laterVoiceTimer = null;
let voiceChaosInterval = null;

let introFinished = false;

let scene2TransitionScheduled = false;
let scene2TransitionStarted = false;

/*
  0 = 很慢很稳
  1 = 完全进入后期高速状态
*/
let chaosLevel = 0;

/*
  语音专用递进：
  比 chaosLevel 更慢，用来控制后续语音“渐渐变快、渐渐变多”
*/
let voiceChaos = 0;

/* 防重复 */
let lastLaterVoice = null;
let recentLaterVoices = [];

/* Web Audio 相关 */
let audioCtx = null;
const audioBufferCache = new Map();

/* ---------- 基础音频 ---------- */

function playVoice(src, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.preload = "auto";

  audio.play().catch((err) => {
    console.log("Audio playback failed:", err);
  });

  audio.addEventListener("ended", () => {
    audio.src = "";
  });

  return audio;
}

/* ---------- Web Audio：3D错觉版本 ---------- */

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

async function loadAudioBuffer(src) {
  if (audioBufferCache.has(src)) {
    return audioBufferCache.get(src);
  }

  const ctx = getAudioContext();
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  audioBufferCache.set(src, audioBuffer);
  return audioBuffer;
}

function playSpatialVoice(src, options = {}) {
  const {
    volume = 0.5,
    pan = 0,
    delay = 0,
    playbackRate = 1,
    fadeIn = 0.08,
    fadeOut = 0.18
  } = options;

  const ctx = getAudioContext();

  loadAudioBuffer(src)
    .then((buffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;

      const gainNode = ctx.createGain();
      const panner = ctx.createStereoPanner();

      panner.pan.value = pan;

      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(ctx.destination);

      const startTime = ctx.currentTime + delay;
      const duration = buffer.duration / playbackRate;

      const safeFadeIn = Math.min(fadeIn, Math.max(0.02, duration * 0.25));
      const safeFadeOut = Math.min(fadeOut, Math.max(0.03, duration * 0.3));
      const sustainTime = Math.max(
        startTime + safeFadeIn,
        startTime + duration - safeFadeOut
      );

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + safeFadeIn);
      gainNode.gain.setValueAtTime(volume, sustainTime);
      gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      source.start(startTime);
      source.stop(startTime + duration + 0.02);

      source.onended = () => {
        try {
          source.disconnect();
          gainNode.disconnect();
          panner.disconnect();
        } catch (e) {
          // ignore
        }
      };
    })
    .catch((err) => {
      console.log("Spatial voice playback failed:", err);
      playVoice(src, volume);
    });
}

/* 预热后续语音缓存，减少第一次播放延迟 */
function warmupLaterVoices(count = 4) {
  const sample = laterVoicePool.slice(0, Math.min(count, laterVoicePool.length));
  sample.forEach((src) => {
    loadAudioBuffer(src).catch(() => {});
  });
}

/* ---------- 工具 ---------- */

function lerp(min, max, t) {
  return min + (max - min) * t;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickLaterVoice() {
  let candidates = laterVoicePool.filter(
    (src) => src !== lastLaterVoice && !recentLaterVoices.includes(src)
  );

  if (candidates.length === 0) {
    candidates = laterVoicePool.filter((src) => src !== lastLaterVoice);
  }

  if (candidates.length === 0) {
    candidates = laterVoicePool.slice();
  }

  const chosen = pick(candidates);

  lastLaterVoice = chosen;
  recentLaterVoices.push(chosen);

  if (recentLaterVoices.length > 3) {
    recentLaterVoices.shift();
  }

  return chosen;
}

function scheduleScene2Transition() {
  if (scene2TransitionScheduled) return;
  scene2TransitionScheduled = true;

  setTimeout(() => {
    triggerScene2Transition();
  }, 10000); // 前8句结束后再过10秒
}

function triggerScene2Transition() {
  if (scene2TransitionStarted) return;
  scene2TransitionStarted = true;

  document.body.classList.add("scene-tear-transition");

  const tearOverlay = document.createElement("div");
  tearOverlay.className = "tear-overlay";

  const sliceCount = 14;

  let currentTop = 0;

 while (currentTop < 100) {
   const slice = document.createElement("div");
   slice.className = "tear-slice";

   // 高度不规则（有细有厚）
   let height;

   const rand = Math.random();

   if (rand < 0.5) {
     height = 2 + Math.random() * 3;      // 很细
   } else if (rand < 0.8) {
     height = 4 + Math.random() * 6;      // 中等
   } else {
     height = 8 + Math.random() * 10;     // 偶尔很厚
   }

   // 间隔不规则（有的挤在一起，有的空很大）
   const gap = Math.random() < 0.7
     ? Math.random() * 2
     : Math.random() * 6;

   const top = currentTop + Math.random() * 1.5; // 微抖

   // 位移更极端一点（更“撕裂”）
   const shift = -80 + Math.random() * 160;

   const delay = Math.random() * 0.2;
   const duration = 0.06 + Math.random() * 0.18;

   slice.style.top = `${top}%`;
   slice.style.height = `${height}%`;

   // 默认位移
   let finalShift = shift;

   // 部分 slice 反方向移动
   if (Math.random() < 0.32) {
     finalShift = -shift;
   }

   // 再少量做成更极端的反向撕裂
   if (Math.random() < 0.12) {
     finalShift *= 1.25;
   }

   slice.style.setProperty("--tear-shift", `${finalShift}px`);
   slice.style.setProperty("--tear-delay", `${delay}s`);
   slice.style.setProperty("--tear-duration", `${duration}s`);

   if (Math.random() < 0.25) {
     slice.style.opacity = 0.4 + Math.random() * 0.6;
    }

   tearOverlay.appendChild(slice);

   currentTop += height + gap;
 }

  document.body.appendChild(tearOverlay);

  // 最后一瞬间：闪黑 + 白噪点
  setTimeout(() => {
    const blackout = document.createElement("div");
    blackout.className = "scene-blackout-flash";

    const noise = document.createElement("div");
    noise.className = "scene-noise-flash";

    blackout.appendChild(noise);
    document.body.appendChild(blackout);
  }, 760);

  // 跳转到 scene2.html
  setTimeout(() => {
    window.location.href = "../Scene2/scene2.html";
  }, 980);
}

/* ---------- 后续语音递进 ---------- */

function startVoiceChaosRamp() {
  if (voiceChaosInterval) return;

  voiceChaosInterval = setInterval(() => {
    // 明显加快推进速度（核心）
    const step = introFinished ? 0.045 : 0.02;
    voiceChaos = Math.min(1, voiceChaos + step);
  }, 600);
}

function playOneLaterVoice(layerIndex = 0, totalLayers = 1) {
  const src = pickLaterVoice();
  const t = voiceChaos;

  /* ---------- 远近 ---------- */
  const isFar = Math.random() < (0.72 - t * 0.28);

  /* ---------- 音量 ---------- */
  // 提高整体基础音量，让后续语音接近前8句
  let baseVolume;
  if (!introFinished) {
    baseVolume = 0.72 + Math.random() * 0.12; // 0.72 ~ 0.84
  } else if (t < 0.3) {
    baseVolume = 0.78 + Math.random() * 0.12; // 0.78 ~ 0.90
  } else if (t < 0.65) {
    baseVolume = 0.84 + Math.random() * 0.12; // 0.84 ~ 0.96
  } else {
    baseVolume = 0.9 + Math.random() * 0.1; // 0.90 ~ 1.00
  }

  // 远处也不要衰减太多，否则会明显比前8句小
  const distanceVolumeFactor = isFar
    ? (0.82 + Math.random() * 0.08)
    : (0.95 + Math.random() * 0.08);

  const volume = Math.min(1, baseVolume * distanceVolumeFactor);

  /* ---------- 左右声道 ---------- */
  const panSpread = 0.18 + t * 0.82;
  let pan = (Math.random() * 2 - 1) * panSpread;

  if (t > 0.72 && Math.random() < 0.12) {
    pan = Math.random() < 0.5
      ? (-1 + Math.random() * 0.14)
      : (0.86 + Math.random() * 0.14);
  }

  /* ---------- 单条语音播放速度 ---------- */
  let playbackRate;

  if (!introFinished) {
   playbackRate = pick([1.0, 1.03, 1.05]);
 } else if (t < 0.15) {
   playbackRate = pick([1.03, 1.05, 1.08]);
 } else if (t < 0.32) {
   playbackRate = pick([1.08, 1.1, 1.12, 1.15]);
 } else if (t < 0.5) {
   playbackRate = pick([1.15, 1.18, 1.2, 1.25]);
 } else if (t < 0.7) {
   playbackRate = pick([1.22, 1.25, 1.3, 1.35]);
 } else if (t < 0.88) {
   playbackRate = pick([1.3, 1.35, 1.4, 1.45]);
 } else {
   playbackRate = pick([1.4, 1.45, 1.5, 1.55]);
 }

  if (isFar) {
    playbackRate = Math.max(0.98, playbackRate - 0.05);
  }

  /* ---------- 层内延迟 ---------- */
  const layerGap = 0.22 - t * 0.08;
  const delay =
    layerIndex * Math.max(0.1, layerGap) +
    Math.random() * (isFar ? 0.08 : 0.04);

  /* ---------- 包络 ---------- */
  const fadeIn = isFar ? 0.16 : 0.07;
  const fadeOut = isFar ? 0.26 : 0.16;

  playSpatialVoice(src, {
    volume,
    pan,
    delay,
    playbackRate,
    fadeIn,
    fadeOut
  });
}

function triggerLaterVoiceCluster() {
  const t = voiceChaos;

  let layerCount = 1;

  if (introFinished) {
  if (t < 0.12) {
    layerCount = 1;
  } else if (t < 0.3) {
    layerCount = Math.random() < 0.32 ? 2 : 1;
  } else if (t < 0.6) {
    layerCount = Math.random() < 0.55 ? 2 : 1;
  } else {
    layerCount = Math.random() < 0.72 ? 2 : 1;
  }
}

  for (let i = 0; i < layerCount; i++) {
    playOneLaterVoice(i, layerCount);
  }
}

function scheduleLaterVoiceLoop() {
  if (!laterVoiceLoopStarted) return;

  triggerLaterVoiceCluster();

  const t = voiceChaos;
  let nextDelay;

  if (!introFinished) {
    // 前景最后一句阶段：已经开始渗入，但别太慢
    nextDelay = 1800 + Math.random() * 700;
  } else {
    // 更快进入密集阶段
    const minDelay = lerp(1100, 240, t);
    const maxExtra = lerp(520, 120, t);
    nextDelay = minDelay + Math.random() * maxExtra;

    // 中后期更容易突然紧一下
    if (t > 0.3 && Math.random() < 0.28) {
      nextDelay *= 0.72;
   }

    if (t > 0.65 && Math.random() < 0.22) {
      nextDelay *= 0.55;
   }
  }

  laterVoiceTimer = setTimeout(scheduleLaterVoiceLoop, nextDelay);
}

function startLaterRandomVoices() {
  if (laterVoiceLoopStarted) return;
  laterVoiceLoopStarted = true;

  startVoiceChaosRamp();

  // 最后一条前景语音开始后，先轻轻渗入
  laterVoiceTimer = setTimeout(scheduleLaterVoiceLoop, 1600);
}

/* ---------- 样式 ---------- */

function styleIntroBullet(el, text) {
  el.textContent = text;
  el.classList.add("bullet-text");

  let size = 24 + Math.random() * 12;
  if (
    text.includes("opportunity") ||
    text.includes("different way to live") ||
    text.includes("painless") ||
    text.includes("sleep")
  ) {
    size += 6;
  }

  el.style.fontSize = `${size}px`;
  el.style.color = `rgba(255,255,255,${0.84 + Math.random() * 0.1})`;
  el.style.textShadow = `0 0 6px rgba(255,255,255,0.16)`;
  el.style.filter = Math.random() < 0.1 ? "blur(0.35px)" : "none";

  applyGlitchEffect(el, "light");
}

function styleFlowBullet(el, text, direction) {
  el.textContent = text;
  el.classList.add("bullet-text");

  const rand = Math.random();
  let size;
  let alpha;

  if (rand < lerp(0.7, 0.35, chaosLevel)) {
    size = lerp(12, 11, chaosLevel) + Math.random() * lerp(5, 8, chaosLevel);
    alpha =
      lerp(0.16, 0.08, chaosLevel) +
      Math.random() * lerp(0.08, 0.1, chaosLevel);
  } else if (rand < lerp(0.95, 0.72, chaosLevel)) {
    size = lerp(15, 16, chaosLevel) + Math.random() * lerp(8, 13, chaosLevel);
    alpha =
      lerp(0.24, 0.2, chaosLevel) +
      Math.random() * lerp(0.12, 0.22, chaosLevel);
  } else {
    size = lerp(22, 24, chaosLevel) + Math.random() * lerp(10, 22, chaosLevel);
    alpha =
      lerp(0.42, 0.55, chaosLevel) +
      Math.random() * lerp(0.14, 0.3, chaosLevel);
  }

  el.style.fontSize = `${size}px`;

  const color = applyCyberColor(
    el,
    text,
    chaosLevel > 0.6 ? "strong" : "normal"
  );

  el.style.opacity = Math.min(alpha, 0.95);

  el.style.textShadow = `0 0 ${2 + alpha * 6}px rgba(255,255,255,0.15)`;

  el.style.filter =
    Math.random() < lerp(0.18, 0.34, chaosLevel) ? "blur(0.8px)" : "none";

  const glitchLevel =
    chaosLevel < 0.35
      ? "light"
      : chaosLevel < 0.72
      ? "medium"
      : "strong";

  applyGlitchEffect(el, glitchLevel, color);
}

function styleNoiseBullet(el, text) {
  el.textContent = text;
  el.classList.add("bullet-text");

  const rand = Math.random();
  let size;
  let alpha;

  if (rand < 0.5) {
    size = 12 + Math.random() * 5;
    alpha = 0.18 + Math.random() * 0.1;
  } else if (rand < 0.85) {
    size = 15 + Math.random() * 7;
    alpha = 0.28 + Math.random() * 0.12;
  } else {
    size = 19 + Math.random() * 9;
    alpha = 0.38 + Math.random() * 0.14;
  }

  el.style.fontSize = `${size}px`;

  const color = applyCyberColor(el, text, "light");

  el.style.opacity = alpha;
  el.style.textShadow = `0 0 3px rgba(255,255,255,0.05)`;
  el.style.filter = Math.random() < 0.35 ? "blur(1px)" : "none";

  applyGlitchEffect(el, "light", color);
}

function applyCyberColor(el, text, intensity = "normal") {
  const roll = Math.random();

  // 默认白色
  let color = "rgba(255,255,255,1)";

  // 红色（危险 / 真实）
  if (roll < (intensity === "strong" ? 0.28 : 0.18)) {
    color = "#7A0000";
  }
  // 绿色（系统 / 控制）
  else if (roll < (intensity === "strong" ? 0.55 : 0.38)) {
    color = "#284A4B";
  }

  // 关键文本强制更明显
  if (
    text.includes("CITY 04") ||
    text.includes("consent") ||
    text.includes("not my name")
  ) {
    color = "#7A0000";
  }

  el.style.color = color;

  return color;
}

function applyGlitchEffect(el, level = "light", baseColor = "#ffffff") {
  const roll = Math.random();

  // 闪烁
  if (roll < 0.35) {
    el.style.animation += ", glitch-flicker 2.4s steps(2, end) infinite";
    el.style.animationDelay = `${Math.random() * 1.5}s`;
  }

  // 横向抖动
  if (
    (level === "light" && Math.random() < 0.18) ||
    (level === "medium" && Math.random() < 0.35) ||
    (level === "strong" && Math.random() < 0.55)
  ) {
    el.style.animation += ", glitch-shift 1.8s steps(2, end) infinite";
    el.style.animationDelay = `${Math.random() * 1.2}s`;
  }

  // 红绿偏移（替代原来的红蓝）
  if (
    (level === "light" && Math.random() < 0.12) ||
    (level === "medium" && Math.random() < 0.25) ||
    (level === "strong" && Math.random() < 0.4)
  ) {
    el.style.textShadow = `
      -1px 0 #7A0000,
      1px 0 #284A4B,
      0 0 6px rgba(255,255,255,0.06)
    `;
  }

  // 强故障才有形变
  if (level === "strong" && Math.random() < 0.16) {
    const scaleY = 0.92 + Math.random() * 0.18;
    el.style.transform += ` scaleY(${scaleY})`;
  }
}

/* ---------- 底层噪点：一直漂动 ---------- */

function createNoiseBullet() {
  const text = pick(texts);
  const bullet = document.createElement("div");
  styleNoiseBullet(bullet, text);

  bullet.style.top = `${4 + Math.random() * 88}vh`;
  bullet.style.zIndex = "0";

  const direction = Math.random() < 0.55 ? "rtl" : "ltr";

  if (direction === "rtl") {
    bullet.classList.add("noise-move-rtl");
    bullet.style.animationDuration = `${11 + Math.random() * 5}s`;
  } else {
    bullet.classList.add("noise-move-ltr");
    bullet.style.animationDuration = `${11 + Math.random() * 5}s`;
  }

  bulletScreen.appendChild(bullet);

  setTimeout(() => {
    bullet.remove();
  }, 17000);
}

function seedNoiseImmediately() {
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      createNoiseBullet();
    }, i * 80);
  }
}

function startBackgroundNoise() {
  if (noiseInterval) return;

  noiseInterval = setInterval(() => {
    createNoiseBullet();
  }, 520);
}

/* ---------- 前 8 句 ---------- */

function createIntroBullet(text, top) {
  const bullet = document.createElement("div");
  styleIntroBullet(bullet, text);

  bullet.classList.add("move-rtl");
  bullet.style.top = `${top}vh`;
  bullet.style.animationDuration = `${15 + Math.random() * 3}s`;
  bullet.style.zIndex = "3";

  bulletScreen.appendChild(bullet);

  setTimeout(() => {
    bullet.remove();
  }, 19000);
}

/* ---------- 流动层：从一开始就有，只是逐渐加速 ---------- */

function createFlowBullet(direction) {
  const text = pick(texts);
  const bullet = document.createElement("div");
  styleFlowBullet(bullet, text, direction);

  const topMin = lerp(16, 8, chaosLevel);
  const topMax = lerp(74, 90, chaosLevel);

  bullet.style.top = `${topMin + Math.random() * (topMax - topMin)}vh`;
  bullet.style.zIndex = "2";

  if (direction === "ltr") {
    bullet.classList.add("move-ltr");
    bullet.style.animationDuration = `${lerp(9.5, 2.6, chaosLevel) + Math.random() * lerp(2.8, 1.2, chaosLevel)}s`;
  } else {
    bullet.classList.add("move-rtl");
    bullet.style.animationDuration = `${lerp(10.5, 2.9, chaosLevel) + Math.random() * lerp(3.2, 1.5, chaosLevel)}s`;
  }

  bulletScreen.appendChild(bullet);

  setTimeout(() => {
    bullet.remove();
  }, 14000);
}

function startFlowLayer() {
  if (flowLTRInterval || flowRTLInterval) return;

  flowLTRInterval = setInterval(() => {
    if (Math.random() < lerp(0.45, 0.92, chaosLevel)) {
      createFlowBullet("ltr");
    }
  }, 900);

  flowRTLInterval = setInterval(() => {
    if (Math.random() < lerp(0.35, 0.82, chaosLevel)) {
      createFlowBullet("rtl");
    }
  }, 1150);
}

function startChaosRamp() {
  if (accelerationInterval) return;

  accelerationInterval = setInterval(() => {
    if (chaosLevel < 1) {
      chaosLevel = Math.min(1, chaosLevel + 0.035);
    }

    if (introFinished && chaosLevel < 1) {
      chaosLevel = Math.min(1, chaosLevel + 0.045);
    }
  }, 900);
}

/* ---------- 语音驱动前 8 句 ---------- */

function getNextDelay(audio, index) {
  const isFirstTwo = index < 2;

  if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
    const overlap = isFirstTwo ? 1.8 : 1.3;
    const delay = (audio.duration - overlap) * 1000;
    return Math.max(isFirstTwo ? 2600 : 2200, Math.min(delay, 5600));
  }

  return isFirstTwo ? 3400 : 2900;
}

function playIntroLine(index = 0) {
  if (index >= introSequence.length) {
    introFinished = true;
    scheduleScene2Transition();
    return;
  }

  const item = introSequence[index];
  createIntroBullet(item.text, introTopPositions[index]);
  const audio = playVoice(item.audio, 1);

  // 最后一句开始时，让后续碎片语音轻轻渗入
  if (index === introSequence.length - 1) {
    startLaterRandomVoices();
  }

  let scheduled = false;

  const scheduleNext = () => {
    if (scheduled) return;
    scheduled = true;

    const delay = getNextDelay(audio, index);
    setTimeout(() => {
      playIntroLine(index + 1);
    }, delay);
  };

  if (audio.readyState >= 1) {
    scheduleNext();
  } else {
    audio.addEventListener("loadedmetadata", scheduleNext, { once: true });
    setTimeout(scheduleNext, index < 2 ? 3400 : 2900);
  }
}

/* ---------- 启动 ---------- */

seedNoiseImmediately();
startBackgroundNoise();

startFlowLayer();
startChaosRamp();

warmupLaterVoices(4);

playIntroLine(0);