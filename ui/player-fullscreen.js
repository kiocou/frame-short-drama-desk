const HIDE_DELAY = 2200;
let hideTimer = 0;

function playerFrame() {
  return document.querySelector(".video-frame");
}

function playerVideo() {
  return document.querySelector("#player-video");
}

function isPlayerFullscreen() {
  return document.body.classList.contains("player-fullscreen") || Boolean(document.fullscreenElement);
}

function clearHideTimer() {
  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = 0;
}

function keepUiVisible() {
  clearHideTimer();
  playerFrame()?.classList.remove("player-ui-hidden");
}

function scheduleUiHide() {
  keepUiVisible();
  const frame = playerFrame();
  const video = playerVideo();
  if (!frame || !video || !isPlayerFullscreen() || video.paused || video.ended) return;
  hideTimer = window.setTimeout(() => {
    if (isPlayerFullscreen() && !video.paused && !video.ended) {
      frame.classList.add("player-ui-hidden");
    }
  }, HIDE_DELAY);
}

function updateFullscreenFit(video) {
  const frame = video.closest(".video-frame");
  if (!frame || !video.videoWidth || !video.videoHeight) return;
  frame.classList.toggle("player-fill-screen", video.videoWidth / video.videoHeight >= 1.3);
}

let indicatorTimer = 0;
function flashCenterIndicator(isPlaying) {
  const el = document.querySelector("#center-indicator");
  if (!el) return;
  el.innerHTML = isPlaying
    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>';
  el.classList.add("show");
  if (indicatorTimer) window.clearTimeout(indicatorTimer);
  indicatorTimer = window.setTimeout(() => el.classList.remove("show"), 550);
}

function bindVideo() {
  const video = playerVideo();
  if (!video || video.dataset.fullscreenUiBound) return;
  video.dataset.fullscreenUiBound = "true";
  video.addEventListener("loadedmetadata", () => updateFullscreenFit(video));
  video.addEventListener("playing", () => { scheduleUiHide(); flashCenterIndicator(true); });
  video.addEventListener("pause", () => { keepUiVisible(); flashCenterIndicator(false); });
  video.addEventListener("ended", keepUiVisible);
  updateFullscreenFit(video);
}

function revealFromInteraction() {
  if (isPlayerFullscreen()) scheduleUiHide();
}

document.addEventListener("pointermove", revealFromInteraction, { passive: true });
document.addEventListener("pointerdown", revealFromInteraction, { passive: true });
document.addEventListener("touchstart", revealFromInteraction, { passive: true });
document.addEventListener("keydown", revealFromInteraction);
document.addEventListener("pointerover", (event) => {
  if (event.target.closest?.(".player-controls")) keepUiVisible();
});
document.addEventListener("pointerout", (event) => {
  if (event.target.closest?.(".player-controls")) scheduleUiHide();
});

const observer = new MutationObserver((mutations) => {
  bindVideo();
  if (!mutations.some((mutation) => mutation.target === document.body && mutation.type === "attributes")) return;
  if (isPlayerFullscreen()) scheduleUiHide();
  else keepUiVisible();
});
observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
const app = document.querySelector("#app");
if (app) observer.observe(app, { childList: true, subtree: true });

bindVideo();
