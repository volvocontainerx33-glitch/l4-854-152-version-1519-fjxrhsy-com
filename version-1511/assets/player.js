(function () {
  const shell = document.querySelector("[data-player]");

  if (!shell) {
    return;
  }

  const video = shell.querySelector("video");
  const overlay = shell.querySelector("[data-player-overlay]");
  const button = shell.querySelector("[data-play-button]");
  const streamUrl = button ? button.getAttribute("data-play") : "";
  let hls = null;
  let ready = false;

  const prepare = function () {
    if (ready || !streamUrl || !video) {
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else {
      video.src = streamUrl;
    }

    ready = true;
  };

  const start = function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    prepare();
    video.controls = true;

    if (overlay) {
      overlay.classList.add("is-hidden");
    }

    const playTask = video.play();

    if (playTask && typeof playTask.catch === "function") {
      playTask.catch(function () {});
    }
  };

  if (button) {
    button.addEventListener("click", start);
  }

  document.querySelectorAll("[data-start-player]").forEach(function (control) {
    control.addEventListener("click", start);
  });

  if (overlay) {
    overlay.addEventListener("click", start);
  }

  video.addEventListener("click", function () {
    if (!ready) {
      start();
    }
  });

  video.addEventListener("play", function () {
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
  });

  window.addEventListener("beforeunload", function () {
    if (hls) {
      hls.destroy();
    }
  });
})();
