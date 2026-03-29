const scriptUrl = new URL(document.currentScript.src);
const clickSound = new Audio(new URL("./audio/click.mp3", scriptUrl).href);

clickSound.preload = "auto";
clickSound.volume = 0.45;

function playClickSound() {
  try {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  } catch (e) {
    console.log("click 音效播放失败", e);
  }
}

document.addEventListener("click", (e) => {
  const target = e.target.closest(
    "button, a, .btn, .clickable, [data-click-sound]"
  );

  if (target) {
    playClickSound();
  }
});