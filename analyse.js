const slots = document.querySelectorAll(".voice-slot");
const dropZone = document.getElementById("dropZone");
const dropDisplay = document.getElementById("dropDisplay");
const scanLine = document.getElementById("scanLine");
const analyseStatus = document.getElementById("analyseStatus");
const outcomeBox = document.getElementById("outcomeBox");
const outcomeText = document.getElementById("outcomeText");

// ✅ 新增：BGM
const bgmAmbient = document.getElementById("bgmAmbient");
const bgmGlitch = document.getElementById("bgmGlitch");

// ✅ 新增：结果出现时播放的人声
const humanVoiceMap = {
  1: document.getElementById("humanVoice1"),
  2: document.getElementById("humanVoice2"),
  3: document.getElementById("humanVoice3")
};

// ✅ 每段人声音量（你可以随便调）
const humanVoiceVolume = {
  1: 1,
  2: 1,
  3: 1
};

const voiceAudio = {
  1: new Audio("assets/audio/voice_clue_1.wav"),
  2: new Audio("assets/audio/voice_clue_2.wav"),
  3: new Audio("assets/audio/voice_clue_3.wav")
};

const outcomeMap = {
  1: "“现在的用工成本对于公司来说利润太低，希望你能理解这个决定。”",
  2: "“这是你曾经的公司吗，现在都做到上市了。”",
  3: "“如果你们都被裁员了，那么现在在办公的是哪些人？”"
};

const finishedVoices = new Set();
let hasRedirected = false;

// ✅ 正确路径：因为 truth.html 在 truth_page 文件夹里
const NEXT_PAGE = "truth_page/truth.html";

let currentVoice = null;

// ===========================
// ✅ Human voice helpers
// ===========================
function stopAllHumanVoices() {
  Object.values(humanVoiceMap).forEach((audio) => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
  });
}

function playHumanVoice(voiceId) {
  const audio = humanVoiceMap[voiceId];
  if (!audio) return null;

  stopAllHumanVoices();

  audio.onended = null;
  audio.currentTime = 0;
  audio.loop = false;
  audio.volume = humanVoiceVolume[voiceId] ?? 0.8;

  lowerBgmForHumanVoice();

  audio.play().catch((e) => {
    console.warn("human voice play failed:", e);
  });

  audio.addEventListener(
    "ended",
    () => {
      restoreBgm();
    },
    { once: true }
  );

  return audio;
}

// ===========================
// ✅ BGM helpers
// ===========================
function lowerBgmForAnalysis() {
  if (bgmAmbient) bgmAmbient.volume = 0.2;
  if (bgmGlitch) bgmGlitch.volume = 0.15;
}

function lowerBgmForHumanVoice() {
  if (bgmAmbient) bgmAmbient.volume = 0.08;
  if (bgmGlitch) bgmGlitch.volume = 0.05;
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

async function restoreBgmState() {
  const ambientTime = parseFloat(sessionStorage.getItem("bgmAmbientTime") || "3");
  const ambientVolume = parseFloat(sessionStorage.getItem("bgmAmbientVolume") || "0.45");
  const ambientPlaying = sessionStorage.getItem("bgmAmbientPlaying") === "true";

  const glitchTime = parseFloat(sessionStorage.getItem("bgmGlitchTime") || "0");
  const glitchVolume = parseFloat(sessionStorage.getItem("bgmGlitchVolume") || "0.2");
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
    console.warn("BGM autoplay blocked on analyse page:", e);
  }
}

slots.forEach(slot => {
  const img = slot.querySelector("img");
  const voiceId = slot.dataset.voice;

  img.addEventListener("dragstart", (e) => {
    // ✅ 统一：都用 text/plain
    e.dataTransfer.setData("text/plain", voiceId);
    e.dataTransfer.effectAllowed = "move";

    // 拖拽开始：变 active
    img.src = `assets/image/analyse/voice${voiceId}_active.png`;
  });
});

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();

  // ✅ 统一：都用 text/plain
  const voiceId = e.dataTransfer.getData("text/plain");
  if (!voiceId) return;

  // ✅ 左侧立刻变凹槽
  const slotImg = document.querySelector(`.voice-slot[data-voice='${voiceId}'] img`);
  if (slotImg) slotImg.src = "assets/image/analyse/voice_slot.png";

  // ✅ 开始分析（放大、波浪线、音效都在这里触发）
  startAnalysis(Number(voiceId));
});

const dropHint = document.getElementById("dropHint");
const rightSlot = document.getElementById("rightSlot");

function showDropCard(src) {
  dropDisplay.src = src;
  dropDisplay.classList.add("is-on");

  // ✅ 分析开始：右侧凹槽 + 文字隐藏
  if (rightSlot) rightSlot.style.display = "none";
  if (dropHint) dropHint.style.display = "none";
}

function clearDropCard() {
  dropDisplay.src = "";
  dropDisplay.classList.remove("is-on");

  // ✅ 分析结束：右侧凹槽 + 文字出现
  if (rightSlot) rightSlot.style.display = "block";
  if (dropHint) dropHint.style.display = "block";
}

function startAnalysis(voiceId) {
  const audio = voiceAudio[voiceId];
  audio.currentTime = 0;
  audio.volume = 0.5;

  // ✅ 新增：开始新的分析前，先停掉之前可能还在播的人声
  stopAllHumanVoices();

  // ✅ 新增：播放语音前压低 BGM
  lowerBgmForAnalysis();

  if (outcomeBox) outcomeBox.classList.remove("is-on");
  if (outcomeText) outcomeText.textContent = "";

  // 右侧显示 drop 图（开始分析）
  showDropCard(`assets/image/analyse/voice${voiceId}_drop.png`);

  if (analyseStatus) {
    analyseStatus.textContent = "分析中";
    analyseStatus.classList.add("active");
  }

  if (scanLine) scanLine.classList.add("active");
  waveSvg.classList.add("active");
  startWave();

  audio.play().catch((e) => console.warn("audio play failed:", e));

  audio.onended = () => {
    // 停止波浪线
    if (analyseStatus) {
      analyseStatus.textContent = "结果";
      analyseStatus.classList.add("active"); // 保持显示
    }

    // ✅ 显示 outcome 文本（不同 voice 不同结果）
    if (outcomeText) outcomeText.textContent = outcomeMap[voiceId] || "";
    if (outcomeBox) outcomeBox.classList.add("is-on");

    // ✅ 新增：outcome 出现时自动播放对应 human voice（单次）
    playHumanVoice(voiceId);

    if (scanLine) scanLine.classList.remove("active");
    waveSvg.classList.remove("active");
    stopWave();

    // ✅ 左侧立刻变成 finished（归位）
    const slotImg = document.querySelector(`.voice-slot[data-voice='${voiceId}'] img`);
    if (slotImg) {
      slotImg.src = `assets/image/analyse/voice${voiceId}_finished.png`;
      slotImg.draggable = false;
      slotImg.style.cursor = "default";
    }

    // ✅ 记录完成的 voice
    finishedVoices.add(Number(voiceId));

    // ✅ 三个都完成后自动跳转（只触发一次）
    if (!hasRedirected && finishedVoices.size === 3) {
     hasRedirected = true;

     const finalHumanVoice = humanVoiceMap[voiceId];

     if (finalHumanVoice) {
       let triggered = false;

       finalHumanVoice.onended = () => {
         restoreBgm();

         if (triggered) return;
         triggered = true;
         startAnalyseToTruthTransition();
       };

       // 保险，防止极端情况下 onended 没触发
       setTimeout(() => {
         if (!triggered) {
           triggered = true;
           startAnalyseToTruthTransition();
         }
       }, Math.ceil((finalHumanVoice.duration || 0) * 1000) + 300);
     } else {
       setTimeout(() => {
         startAnalyseToTruthTransition();
       }, 800);
     }
   }

    // ✅ 右侧立刻清空（不展示 finished 停留）
    clearDropCard();
  };
}

// ===========================
// ✅ Dynamic Wave (Figma SVG) - single RAF
// ===========================
const waveSvg = document.getElementById("wave");
const wave1 = document.getElementById("wave1");
const wave2 = document.getElementById("wave2");
const wave3 = document.getElementById("wave3");
console.log("waveSvg:", waveSvg, "wave1:", wave1, "wave2:", wave2, "wave3:", wave3);

let waveRAF = null;
let t = 0;

const baseAmp = 15;
const samples = 600;
const waveStore = new Map();

function sampleBase(pathEl) {
  const len = pathEl.getTotalLength();
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const p = pathEl.getPointAtLength((len * i) / samples);
    pts.push({ x: p.x, y: p.y });
  }
  return pts;
}

function buildLineD(pts) {
  let d = `M ${pts[0].x.toFixed(3)} ${pts[0].y.toFixed(3)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(3)} ${pts[i].y.toFixed(3)}`;
  }
  return d;
}

function peakEnvelope(nx, time, phase) {
  const p1 = Math.exp(-Math.pow((nx - (0.28 + 0.10 * Math.sin(time * 0.8 + phase))) / 0.12, 2));
  const p2 = Math.exp(-Math.pow((nx - (0.68 + 0.08 * Math.sin(time * 0.9 + phase * 1.7))) / 0.13, 2));
  return 0.30 + 1.25 * (p1 + 0.9 * p2);
}

function deform(pathEl, amp, phase, speed, f1, f2) {
  const base = waveStore.get(pathEl);
  if (!base) return;

  const clamp = amp * 1.2;

  const out = base.map((p, i) => {
    const nx = i / samples;
    const env = peakEnvelope(nx, t, phase);

    const raw =
      (amp * env) *
      (Math.sin(nx * Math.PI * 2 * f1 + t * speed + phase) +
        0.55 * Math.sin(nx * Math.PI * 2 * f2 + t * (speed * 0.73) + phase * 1.4));

    const off = Math.max(-clamp, Math.min(clamp, raw));

    return { x: p.x, y: p.y + off };
  });

  pathEl.setAttribute("d", buildLineD(out));
}

function waveLoop() {
  t += 0.016;

  deform(wave1, baseAmp * 0.70, 0.6, 3.4, 1.7, 3.0);
  deform(wave2, baseAmp * 1.00, 1.9, 4.0, 2.2, 4.2);
  deform(wave3, baseAmp * 0.85, 3.2, 3.7, 2.0, 3.6);

  waveRAF = requestAnimationFrame(waveLoop);
}

function startWave() {
  if (waveRAF) return;

  if (!waveStore.size) {
    waveStore.set(wave1, sampleBase(wave1));
    waveStore.set(wave2, sampleBase(wave2));
    waveStore.set(wave3, sampleBase(wave3));
  }

  waveRAF = requestAnimationFrame(waveLoop);
}

function stopWave() {
  if (waveRAF) cancelAnimationFrame(waveRAF);
  waveRAF = null;
}

function startAnalyseToTruthTransition() {
  document.body.classList.add("scene-tear-transition");

  const tearOverlay = document.createElement("div");
  tearOverlay.className = "tear-overlay";

  let currentTop = 0;

  while (currentTop < 100) {
    const slice = document.createElement("div");
    slice.className = "tear-slice";

    let height;
    const rand = Math.random();

    if (rand < 0.5) {
      height = 2 + Math.random() * 3;
    } else if (rand < 0.8) {
      height = 4 + Math.random() * 6;
    } else {
      height = 8 + Math.random() * 10;
    }

    const gap = Math.random() < 0.7
      ? Math.random() * 2
      : Math.random() * 6;

    const top = currentTop + Math.random() * 1.5;

    const shift = -80 + Math.random() * 160;

    const delay = Math.random() * 0.2;
    const duration = 0.06 + Math.random() * 0.18;

    slice.style.top = `${top}%`;
    slice.style.height = `${height}%`;

    let finalShift = shift;

    if (Math.random() < 0.35) {
      finalShift = -shift;
    }

    if (Math.random() < 0.12) {
      finalShift *= 1.3;
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

  // ✅ 黑闪 + 白噪点
  setTimeout(() => {
    const blackout = document.createElement("div");
    blackout.className = "scene-blackout-flash";

    const noise = document.createElement("div");
    noise.className = "scene-noise-flash";

    blackout.appendChild(noise);
    document.body.appendChild(blackout);
  }, 700);

  // ✅ 跳转前保存 BGM 状态
  setTimeout(() => {
    saveBgmState();
    window.location.href = NEXT_PAGE;
  }, 900);
}

// ✅ 页面加载时恢复上一页 BGM 状态
window.addEventListener("DOMContentLoaded", () => {
  restoreBgmState();
});