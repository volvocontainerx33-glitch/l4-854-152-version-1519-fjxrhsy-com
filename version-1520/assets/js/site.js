(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(function () {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.querySelector("[data-nav-menu]");

    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        menu.classList.toggle("open");
      });
    }

    var hero = document.querySelector("[data-hero]");

    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var prev = hero.querySelector("[data-hero-prev]");
      var next = hero.querySelector("[data-hero-next]");
      var index = 0;
      var timer = null;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }

        index = (nextIndex + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("active", slideIndex === index);
        });

        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("active", dotIndex === index);
        });
      }

      function start() {
        stop();
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5200);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          show(Number(dot.getAttribute("data-hero-dot") || 0));
          start();
        });
      });

      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          start();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          start();
        });
      }

      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
      show(0);
      start();
    }

    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));

    inputs.forEach(function (input) {
      var params = new URLSearchParams(window.location.search);
      var initial = params.get("q") || "";

      if (initial && input.value === "") {
        input.value = initial;
      }

      function applyFilter() {
        var value = input.value.trim().toLowerCase();
        var cards = Array.prototype.slice.call(document.querySelectorAll(".searchable-card"));
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = (card.getAttribute("data-search") || card.textContent || "").toLowerCase();
          var matched = !value || haystack.indexOf(value) !== -1;
          card.style.display = matched ? "" : "none";

          if (matched) {
            visible += 1;
          }
        });

        var empty = document.querySelector("[data-empty-state]");

        if (empty) {
          empty.classList.toggle("show", cards.length > 0 && visible === 0);
        }
      }

      input.addEventListener("input", applyFilter);

      if (initial) {
        applyFilter();
      }
    });

    document.querySelectorAll("[data-player]").forEach(function (wrap) {
      var video = wrap.querySelector("video");
      var button = wrap.querySelector("[data-play]");
      var stream = video ? video.getAttribute("data-stream") : "";
      var prepared = false;
      var hls = null;

      function prepare() {
        if (!video || !stream || prepared) {
          return Promise.resolve();
        }

        prepared = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(stream);
          hls.attachMedia(video);

          return new Promise(function (resolve) {
            var resolved = false;

            function done() {
              if (!resolved) {
                resolved = true;
                resolve();
              }
            }

            hls.on(window.Hls.Events.MANIFEST_PARSED, done);
            window.setTimeout(done, 900);
          });
        }

        video.src = stream;
        return Promise.resolve();
      }

      function play() {
        prepare().then(function () {
          if (button) {
            button.classList.add("is-hidden");
          }

          var attempt = video.play();

          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(function () {
              if (button) {
                button.classList.remove("is-hidden");
              }
            });
          }
        });
      }

      if (button) {
        button.addEventListener("click", play);
      }

      if (video) {
        video.addEventListener("click", function () {
          if (video.paused) {
            play();
          }
        });

        video.addEventListener("play", function () {
          if (button) {
            button.classList.add("is-hidden");
          }
        });
      }

      window.addEventListener("beforeunload", function () {
        if (hls && typeof hls.destroy === "function") {
          hls.destroy();
        }
      });
    });
  });
})();
