const STAGE_WIDTH = 1440;
const STAGE_HEIGHT = 1024;

const stageScale = document.getElementById("stage-scale");
const micButton = document.getElementById("micButton");
const speakHint = document.getElementById("speakHint");
const questionAudio = document.getElementById("questionAudio");
const question = document.getElementById("question");
const stage = document.getElementById("stage");
const glitchFlash = document.getElementById("glitchFlash");
const endingText = document.getElementById("endingText");
const reportContent = document.getElementById("reportContent");
const reportRoll = document.getElementById("reportRoll");

const bgmAmbient = document.getElementById("bgmAmbient");
const bgmGlitch = document.getElementById("bgmGlitch");

const AMBIENT_NORMAL_VOLUME = 0.5;
const GLITCH_NORMAL_VOLUME = 0.32;
const AMBIENT_DUCK_VOLUME = 0.16;
const GLITCH_DUCK_VOLUME = 0.08;

function fadeAudioTo(audio, targetVolume, duration = 300) {
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

function duckBgmForQuestion() {
  fadeAudioTo(bgmAmbient, AMBIENT_DUCK_VOLUME, 220);
  fadeAudioTo(bgmGlitch, GLITCH_DUCK_VOLUME, 220);
}

function restoreBgmAfterQuestion() {
  fadeAudioTo(bgmAmbient, AMBIENT_NORMAL_VOLUME, 420);
  fadeAudioTo(bgmGlitch, GLITCH_NORMAL_VOLUME, 420);
}

/*
  roundIndex:
  0 -> 等待第1次 no
  1 -> 等待第2次 no
  2 -> 等待第3次 no
  3 -> 等待 yes please
*/
let roundIndex = 0;

let speakUIShown = false;
let recognition = null;
let warmupStream = null;

let isListening = false;
let isBusy = false;
let isRetrying = false;
let currentSessionId = 0;
let micReady = false;

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

/* ===== 读取 Email 传来的 ambient 状态 ===== */
function getSavedMicrophoneBgmState() {
  return {
    shouldResume: sessionStorage.getItem("microphoneAmbientShouldResume") === "true",
    ambientTime: parseFloat(sessionStorage.getItem("microphoneAmbientTime") || "0"),
    ambientVolume: parseFloat(sessionStorage.getItem("microphoneAmbientVolume") || "0.5")
  };
}

function clearSavedMicrophoneBgmState() {
  sessionStorage.removeItem("microphoneAmbientShouldResume");
  sessionStorage.removeItem("microphoneAmbientTime");
  sessionStorage.removeItem("microphoneAmbientVolume");
}

/* ===== 启动 microphone 页面双音轨 ===== */
function startMicrophoneBgm() {
  const saved = getSavedMicrophoneBgmState();

  if (bgmAmbient) {
    bgmAmbient.volume = 0;

    if (saved.shouldResume && !Number.isNaN(saved.ambientTime)) {
      try {
        bgmAmbient.currentTime = saved.ambientTime;
      } catch (err) {
        console.log("设置 microphone ambient 播放进度失败", err);
      }
    }

    bgmAmbient.play().then(() => {
      fadeInAudio(bgmAmbient, 1200, saved.ambientVolume || AMBIENT_NORMAL_VOLUME);
    }).catch(() => {
      console.log("Microphone ambient autoplay 被拦截，等待用户交互");
    });
  }

  if (bgmGlitch) {
    bgmGlitch.volume = 0;
    bgmGlitch.play().then(() => {
      fadeInAudio(bgmGlitch, 1600, GLITCH_NORMAL_VOLUME);
    }).catch(() => {
      console.log("Microphone glitch autoplay 被拦截，等待用户交互");
    });
  }

  clearSavedMicrophoneBgmState();
}

let microphoneBgmStarted = false;

function ensureMicrophoneBgmStarts() {
  if (microphoneBgmStarted) return;
  microphoneBgmStarted = true;
  startMicrophoneBgm();
}

function fitStage() {
  const winW = window.innerWidth;
  const winH = window.innerHeight;

  const scale = Math.min(winW / STAGE_WIDTH, winH / STAGE_HEIGHT);
  const scaledW = STAGE_WIDTH * scale;
  const scaledH = STAGE_HEIGHT * scale;

  const left = (winW - scaledW) / 2;
  const top = (winH - scaledH) / 2;

  stageScale.style.left = `${left}px`;
  stageScale.style.top = `${top}px`;
  stageScale.style.transform = `scale(${scale})`;
}

function getCurrentPromptText() {
  return roundIndex >= 3 ? "请朗读 'yes please'" : "请朗读 'no'";
}

function showSpeakUI() {
  if (speakUIShown) return;
  speakUIShown = true;

  speakHint.classList.remove("hint-fade-out", "hint-fade-in");
  speakHint.classList.add("show-speak-ui");
  micButton.classList.add("show-speak-ui");
}

function setHintTextWithFade(newText) {
  speakHint.classList.remove("hint-fade-in", "hint-fade-out");
  speakHint.classList.add("hint-fade-out");

  setTimeout(() => {
    speakHint.textContent = newText;
    speakHint.classList.remove("hint-fade-out");
    speakHint.classList.add("hint-fade-in");
  }, 280);
}

function hideHintText() {
  speakHint.classList.remove("hint-fade-in");
  speakHint.classList.add("hint-fade-out");
}

async function warmupMicrophoneOnce() {
  if (micReady) return true;

  try {
    warmupStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micReady = true;
    console.log("Microphone warmed up.");
    return true;
  } catch (err) {
    console.log("Microphone warmup failed:", err);
    setHintTextWithFade("Microphone access denied");
    return false;
  }
}

function updateQuestionIntensity() {
  question.classList.remove(
    "question-level-1",
    "question-level-2",
    "question-level-3"
  );

  if (roundIndex === 0) {
    question.classList.add("question-level-1");
  } else if (roundIndex === 1) {
    question.classList.add("question-level-2");
  } else {
    question.classList.add("question-level-3");
  }
}

function hideQuestionCompletely() {
  question.classList.remove(
    "question-level-1",
    "question-level-2",
    "question-level-3",
    "question-start"
  );
  question.classList.add("hide-question");
}

function cleanupRecognition() {
  if (recognition) {
    try {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    } catch (e) {
      console.log("Recognition cleanup error:", e);
    }
  }

  recognition = null;
  isListening = false;
  micButton.classList.remove("listening");
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsNo(text) {
  const words = normalizeText(text).split(" ").filter(Boolean);
  return words.includes("no") || words.includes("know") || words.includes("now");
}

function containsYesPlease(text) {
  const normalized = normalizeText(text);

  return (
    normalized === "yes please" ||
    normalized.includes("yes please") ||
    normalized.includes("yes, please") ||
    normalized.includes("yes  please") ||
    (normalized.startsWith("yes") && normalized.includes("please"))
  );
}

function getPlaybackForRound(indexAfterSuccess) {
  if (indexAfterSuccess === 1) {
    return { volume: 1.0, rate: 1.08 };
  }
  if (indexAfterSuccess === 2) {
    return { volume: 1.0, rate: 1.18 };
  }
  if (indexAfterSuccess === 3) {
    return { volume: 1.0, rate: 1.3 };
  }
  return { volume: 1.0, rate: 1.0 };
}

function playQuestionAudio(volume = 1, rate = 1) {
  return new Promise((resolve) => {
    if (!questionAudio) {
      resolve();
      return;
    }

    duckBgmForQuestion();

    questionAudio.pause();
    questionAudio.currentTime = 0;
    questionAudio.loop = false;
    questionAudio.volume = volume;
    questionAudio.playbackRate = rate;

    const onEnded = () => {
      questionAudio.removeEventListener("ended", onEnded);
      questionAudio.playbackRate = 1;
      restoreBgmAfterQuestion();
      resolve();
    };

    questionAudio.addEventListener("ended", onEnded);

    const playPromise = questionAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log("Question audio play failed:", err);
        questionAudio.removeEventListener("ended", onEnded);
        questionAudio.playbackRate = 1;
        restoreBgmAfterQuestion();
        resolve();
      });
    }
  });
}

function playGlitchBurst() {
  glitchFlash.classList.remove("play-glitch");
  stage.classList.remove("stage-glitch");

  void glitchFlash.offsetWidth;
  void stage.offsetWidth;

  glitchFlash.classList.add("play-glitch");
  stage.classList.add("stage-glitch");

  setTimeout(() => {
    stage.classList.remove("stage-glitch");
  }, 950);
}

async function handleWrongAttempt() {
  if (isBusy || isRetrying) return;

  isRetrying = true;
  cleanupRecognition();

  setHintTextWithFade("请重试");

  setTimeout(() => {
    setHintTextWithFade(getCurrentPromptText());
    setTimeout(() => {
      isRetrying = false;
    }, 650);
  }, 900);
}

async function handleNoSuccess() {
  if (isBusy) return;
  isBusy = true;

  cleanupRecognition();
  micButton.classList.add("disabled");

  /* 识别成功后，先让 Say 'no' 消失 */
  hideHintText();

  roundIndex += 1;
  updateQuestionIntensity();
  console.log("NO success -> roundIndex:", roundIndex);

  const { volume, rate } = getPlaybackForRound(roundIndex);
  await playQuestionAudio(volume, rate);

  micButton.classList.remove("disabled");

  if (roundIndex < 3) {
    setHintTextWithFade("点击来回答");
  } else {
    setHintTextWithFade("请朗读 'yes please'");
  }

  isBusy = false;
}

async function handleYesPleaseSuccess() {
  if (isBusy) return;
  isBusy = true;

  cleanupRecognition();

  micButton.classList.add("disabled");

  /* 先彻底隐藏 question */
  hideQuestionCompletely();

  /* 再淡出其余旧元素 */
  stage.classList.add("stage-fade-out");

  setTimeout(() => {
    playGlitchBurst();
  }, 700);

  setTimeout(() => {
    endingText.classList.remove("hide-ending");
    endingText.classList.add("show-ending");
  }, 1650);

  setTimeout(() => {
    endingText.classList.remove("show-ending");
    endingText.classList.add("hide-ending");
    playGlitchBurst();
  }, 4300);

  setTimeout(() => {
    startReportRollSequence();
  }, 5350);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTranslateYToCenter() {
  if (!reportContent) return -900;

  const stageRect = stage.getBoundingClientRect();
  const contentRect = reportContent.getBoundingClientRect();

  const stageCenterY = stageRect.top + stageRect.height / 2;
  const contentCenterY = contentRect.top + contentRect.height / 2;

  return stageCenterY - contentCenterY;
}

async function startReportRollSequence() {
  if (!reportRoll || !reportContent) return;

  reportRoll.classList.add("show-report");
  reportRoll.classList.remove("roll-up", "roll-up-continue");

  // 先回到初始位置，确保每次计算都一致
  reportContent.style.transform = "translateX(-50%) translateY(0)";
  void reportContent.offsetWidth;

  // 先显示，再测量真正的内容位置
  const toCenterY = getTranslateYToCenter();
  reportRoll.style.setProperty("--report-stop-y", `${toCenterY}px`);

  // 第一段：滚到中心
  reportRoll.classList.add("roll-up");

  // 等第一段动画结束
  await wait(2200);

  // 停 3 秒
  await wait(3000);

  // 固定在第一段结束位置，避免切换动画时跳一下
  reportRoll.classList.remove("roll-up");
  reportContent.style.transform = `translateX(-50%) translateY(${toCenterY}px)`;
  void reportContent.offsetWidth;

  // 第二段：继续上滚
  reportRoll.classList.add("roll-up-continue");
}

async function startSingleRecognitionSession() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.log("This browser does not support SpeechRecognition.");
    setHintTextWithFade("Speech recognition unsupported");
    return;
  }

  const sessionId = ++currentSessionId;

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 5;

  let handled = false;
  let gotAnySpeech = false;

  recognition.onstart = () => {
    if (sessionId !== currentSessionId) return;
    isListening = true;
    micButton.classList.add("listening");
    console.log("Recognition started. session:", sessionId);
  };

  recognition.onresult = async (event) => {
    if (sessionId !== currentSessionId) return;
    if (handled) return;

    let transcript = "";
    let finalTranscript = "";
    let hasFinal = false;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript.trim();

      if (chunk) {
        transcript += chunk + " ";
      }

      if (event.results[i].isFinal) {
        hasFinal = true;
        finalTranscript += chunk + " ";
      }
    }

    transcript = transcript.trim().toLowerCase();
    finalTranscript = finalTranscript.trim().toLowerCase();

    console.log(
      "Recognized:",
      transcript,
      "| finalTranscript:",
      finalTranscript,
      "| hasFinal:",
      hasFinal,
      "| session:",
      sessionId,
      "| round:",
      roundIndex
    );

    if (!transcript) return;

    // no 阶段：短词，允许尽快触发
    if (roundIndex < 3) {
      if (containsNo(transcript)) {
        handled = true;
        cleanupRecognition();
        await handleNoSuccess();
        return;
      }

      // no 阶段只有在拿到 final 结果且仍然不是 no 时，才算失败
      if (hasFinal) {
        handled = true;
        cleanupRecognition();
        await handleWrongAttempt();
      }

      return;
    }

    // yes please 阶段：必须等 final result 再判断
    if (!hasFinal) return;

    handled = true;
    cleanupRecognition();

    if (containsYesPlease(finalTranscript)) {
      await handleYesPleaseSuccess();
    } else {
      await handleWrongAttempt();
    }
  };

  recognition.onerror = async (event) => {
    if (sessionId !== currentSessionId) return;
    if (handled) return;

    console.log("Speech recognition error:", event.error);
    handled = true;
    cleanupRecognition();

    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      setHintTextWithFade("Microphone access denied");
    } else if (event.error === "network") {
      setHintTextWithFade("Speech service unavailable");
    } else if (event.error === "audio-capture") {
      setHintTextWithFade("Microphone not found");
    } else if (event.error === "no-speech") {
      await handleWrongAttempt();
    } else {
      setHintTextWithFade("请重试");
    }
  };

  recognition.onend = () => {
    if (sessionId !== currentSessionId) return;

    isListening = false;
    micButton.classList.remove("listening");

    // 这里不再把 onend 当成失败，避免第一次开口被误杀
    console.log("Recognition ended. session:", sessionId, "| gotAnySpeech:", gotAnySpeech);
  };

  try {
    recognition.start();
  } catch (err) {
    console.log("Recognition start failed:", err);
    cleanupRecognition();
    setHintTextWithFade("请重试");
  }
}

window.addEventListener("load", () => {
  fitStage();
  ensureMicrophoneBgmStarts();

  question.classList.add("question-start");
  updateQuestionIntensity();

  if (questionAudio) {
    questionAudio.volume = 1;
    questionAudio.playbackRate = 1;

    duckBgmForQuestion();
    const playPromise = questionAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log("Question audio autoplay was blocked:", err);
      });
    }

    questionAudio.addEventListener(
     "ended",
     () => {
       questionAudio.playbackRate = 1;
       restoreBgmAfterQuestion();
       showSpeakUI();
     },
     { once: true }
   );
  } else {
    setTimeout(showSpeakUI, 5000);
  }
});

window.addEventListener("resize", fitStage);
window.addEventListener("pointerdown", ensureMicrophoneBgmStarts, { once: true });
window.addEventListener("keydown", ensureMicrophoneBgmStarts, { once: true });

micButton.addEventListener("click", async () => {
  if (!speakUIShown) return;
  if (isListening) return;
  if (isBusy) return;
  if (isRetrying) return;
  if (micButton.classList.contains("disabled")) return;

  const ok = await warmupMicrophoneOnce();
  if (!ok) return;

  setHintTextWithFade(getCurrentPromptText());

  // 给文字变化和识别器一点准备时间
  await new Promise((resolve) => setTimeout(resolve, 700));

  startSingleRecognitionSession();
});