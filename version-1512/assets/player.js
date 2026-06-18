import { H as Hls } from "./hls-dru42stk.js";

const activePlayers = new WeakMap();

export function initMoviePlayer(config) {
  const video = document.getElementById(config.videoId);
  const cover = document.getElementById(config.coverId);
  const trigger = document.getElementById(config.triggerId);
  const source = config.source;

  if (!video || !source) {
    return;
  }

  const attach = function () {
    if (activePlayers.has(video)) {
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      activePlayers.set(video, null);
      return;
    }

    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      activePlayers.set(video, hls);
      return;
    }

    video.src = source;
    activePlayers.set(video, null);
  };

  const play = function () {
    attach();
    video.setAttribute("controls", "controls");
    if (cover) {
      cover.classList.add("is-hidden");
    }
    var promise = video.play();
    if (promise && promise.catch) {
      promise.catch(function () {});
    }
  };

  if (cover) {
    cover.addEventListener("click", play);
  }

  if (trigger) {
    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      play();
    });
  }

  document.querySelectorAll("[data-player-start]").forEach(function (button) {
    button.addEventListener("click", play);
  });

  video.addEventListener("click", function () {
    if (video.paused) {
      play();
    }
  });
}
