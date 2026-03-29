const allCards = document.querySelectorAll(".memory-card");
const namePanel = document.getElementById("namePanel");
const nameInput = document.getElementById("nameInput");
const nameTitle = document.getElementById("nameTitle");
const nameSubtitle = document.getElementById("nameSubtitle");

/* ===== 打字音效 ===== */
const typingSound = new Audio("./sound/virtualzero-keyboard-typing-fast-371229.mp3");
typingSound.loop = true;
typingSound.preload = "auto";
typingSound.volume = 0.35;

/* ===== 成功 / 错误音效 ===== */
const correctSound = new Audio("./sound/correct.mp3");
const wrongSound = new Audio("./sound/wrong.mp3");

/* ===== BGM ===== */
const bgmAmbient = document.getElementById("bgmAmbient");
const bgmGlitch = document.getElementById("bgmGlitch");

function getSavedBGMState() {
  return {
    shouldResume: sessionStorage.getItem("scene2BgmShouldResume") === "true",
    ambientTime: parseFloat(sessionStorage.getItem("scene2AmbientTime")) || 0,
    glitchTime: parseFloat(sessionStorage.getItem("scene2GlitchTime")) || 0,
    ambientVolume: parseFloat(sessionStorage.getItem("scene2AmbientVolume")),
    glitchVolume: parseFloat(sessionStorage.getItem("scene2GlitchVolume"))
  };
}

function clearSavedBGMState() {
  sessionStorage.removeItem("scene2BgmShouldResume");
  sessionStorage.removeItem("scene2AmbientTime");
  sessionStorage.removeItem("scene2GlitchTime");
  sessionStorage.removeItem("scene2AmbientVolume");
  sessionStorage.removeItem("scene2GlitchVolume");
}

function startBGMFromState() {
  const state = getSavedBGMState();

  const ambientVolume = Number.isNaN(state.ambientVolume) ? 0.4 : state.ambientVolume;
  const glitchVolume = Number.isNaN(state.glitchVolume) ? 0.2 : state.glitchVolume;

  bgmAmbient.volume = ambientVolume;
  bgmGlitch.volume = glitchVolume;

  if (state.shouldResume) {
    bgmAmbient.currentTime = state.ambientTime;
    bgmGlitch.currentTime = state.glitchTime;
  } else {
    bgmAmbient.currentTime = 0;
    bgmGlitch.currentTime = 0;
  }

  bgmAmbient.play().catch((err) => {
    console.log("ambient play failed:", err);
  });

  bgmGlitch.play().catch((err) => {
    console.log("glitch play failed:", err);
  });

  if (state.shouldResume) {
    clearSavedBGMState();
  }
}

// ✅ 页面加载后直接尝试播放
startBGMFromState();

correctSound.preload = "auto";
wrongSound.preload = "auto";

correctSound.loop = false;
wrongSound.loop = false;

/* ===== 记录完成状态 ===== */
let completedCards = 0;
const totalCards = allCards.length;

allCards.forEach((card) => {
  const input = card.querySelector(".date-input");
  const questionState = card.querySelector(".question-state");
  const diaryState = card.querySelector(".diary-state");
  const diaryText = card.querySelector(".diary-text");
  const template = diaryText.dataset.template;

  let typingTimer = null;
  let hasSubmitted = false;
  let hasFinishedTyping = false;

  // 自动格式化为 DD/MM
  input.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^\d]/g, "");

    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    if (value.length >= 3) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }

    e.target.value = value;
  });

  // 聚焦时隐藏 placeholder
  input.addEventListener("focus", () => {
    input.setAttribute("data-placeholder", input.placeholder);
    input.placeholder = "";
  });

  // 失焦时如果没输入就恢复 placeholder
  input.addEventListener("blur", () => {
    if (input.value.trim() === "") {
      input.placeholder = input.getAttribute("data-placeholder") || "xx/xx";
    } else {
      submitCard();
    }
  });

  // 回车提交
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitCard();
    }
  });

  function submitCard() {
    if (hasSubmitted) return;

    const value = input.value.trim();
    const isValid = /^\d{2}\/\d{2}$/.test(value);

    if (!isValid) return;

    hasSubmitted = true;

    const finalText = template.replace("xx/xx", value);

    questionState.classList.add("hidden");
    diaryState.classList.remove("hidden");

    startTypewriter(diaryText, finalText, 28, () => {
      if (!hasFinishedTyping) {
        hasFinishedTyping = true;
        completedCards++;
        checkAllDiariesFinished();
      }
    });
  }

  function startTypewriter(element, text, speed = 30, onComplete) {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }

    element.textContent = "";
    playTypingSound();

    let index = 0;

    typingTimer = setInterval(() => {
      element.textContent += text.charAt(index);
      index++;

      if (index >= text.length) {
        clearInterval(typingTimer);
        typingTimer = null;
        stopTypingSound();

        if (typeof onComplete === "function") {
          onComplete();
        }
      }
    }, speed);
  }
});

/* ===== 全部日记完成后显示姓名输入框 ===== */
function checkAllDiariesFinished() {
  if (completedCards === totalCards) {
    namePanel.classList.remove("hidden");
  }
}

/* ===== 姓名输入逻辑 ===== */

// 点击整个方框都可以开始输入
namePanel.addEventListener("click", () => {
  activateNameInput();
});

nameInput.addEventListener("focus", () => {
  activateNameInput();
});

nameInput.addEventListener("input", () => {
  let value = nameInput.value;

  // 只允许字母、数字、空格
  value = value.replace(/[^a-zA-Z0-9 ]/g, "");

  // 自动转大写
  value = value.toUpperCase();

  nameInput.value = value;

  // 输入内容显示在原 YOUR NAME 的位置
  nameTitle.textContent = value;
});

nameInput.addEventListener("blur", () => {
  // 如果什么都没输入，恢复默认文案
  if (nameInput.value.trim() === "") {
    nameTitle.textContent = "YOUR NAME";
    nameSubtitle.classList.remove("hidden");
  }
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    submitName();
  }
});

nameInput.addEventListener("input", () => {
  let value = nameInput.value;

  value = value.replace(/[^a-zA-Z0-9 ]/g, "");
  value = value.toUpperCase();

  nameInput.value = value;
  nameTitle.textContent = value;
});

function activateNameInput() {
  nameTitle.textContent = "";
  nameSubtitle.classList.add("hidden");
  nameInput.focus();
}

function playCorrectSound() {
  correctSound.currentTime = 0;
  correctSound.play().catch(() => {});
}

function playWrongSound() {
  wrongSound.currentTime = 0;
  wrongSound.play().catch(() => {});
}

function submitName() {
  const value = nameInput.value.trim().toUpperCase();

  if (!value) return;

  if (value !== "CITY 04") {
    showNameError();
    return;
  }

  // ✅ 正确音效
  playCorrectSound();

  nameTitle.textContent = value;
  localStorage.setItem("playerName", value);

  nameInput.blur();
  nameInput.disabled = true;

  namePanel.classList.add("confirmed");

  setTimeout(() => {
    window.location.href = "../Camera/camera.html";
  }, 1400);
}

function showNameError() {
  playWrongSound(); // ✅ 错误音效

  nameInput.value = "";

  namePanel.classList.add("error");

  nameTitle.textContent = "身份错误";
  nameSubtitle.textContent = "ACCESS DENIED";

  setTimeout(() => {
    namePanel.classList.remove("error");

    nameTitle.textContent = "你的名字";
    nameSubtitle.textContent = "点击输入";
  }, 1200);
}

/* ===== 音效控制 ===== */
function playTypingSound() {
  typingSound.pause();
  typingSound.currentTime = 0;
  typingSound.play().catch((err) => {
    console.log("Typing sound playback failed:", err);
  });
}

function stopTypingSound() {
  typingSound.pause();
  typingSound.currentTime = 0;
}

/* ===== 固定舞台尺寸，只整体缩放 ===== */
const stage = document.getElementById("stage");
const STAGE_WIDTH = 1440;
const STAGE_HEIGHT = 1024;

function scaleStage() {
  const ww = window.innerWidth;
  const wh = window.innerHeight;
  const scale = Math.min(ww / STAGE_WIDTH, wh / STAGE_HEIGHT);

  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

scaleStage();
window.addEventListener("resize", scaleStage);