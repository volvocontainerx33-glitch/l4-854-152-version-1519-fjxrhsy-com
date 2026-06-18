(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var toggle = document.querySelector("[data-menu-toggle]");
        var mobileNav = document.querySelector("[data-mobile-nav]");
        if (toggle && mobileNav) {
            toggle.addEventListener("click", function () {
                mobileNav.classList.toggle("is-open");
            });
        }

        var hero = document.querySelector("[data-hero]");
        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
            var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
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
                    slide.classList.toggle("is-active", slideIndex === index);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle("is-active", dotIndex === index);
                });
            }

            function play() {
                if (timer) {
                    clearInterval(timer);
                }
                timer = setInterval(function () {
                    show(index + 1);
                }, 5000);
            }

            dots.forEach(function (dot, dotIndex) {
                dot.addEventListener("click", function () {
                    show(dotIndex);
                    play();
                });
            });
            if (prev) {
                prev.addEventListener("click", function () {
                    show(index - 1);
                    play();
                });
            }
            if (next) {
                next.addEventListener("click", function () {
                    show(index + 1);
                    play();
                });
            }
            show(0);
            play();
        }

        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
        panels.forEach(function (panel) {
            var scope = panel.parentElement || document;
            var input = panel.querySelector(".movie-search-input");
            var year = panel.querySelector(".movie-year-filter");
            var type = panel.querySelector(".movie-type-filter");
            var category = panel.querySelector(".movie-category-filter");
            var items = Array.prototype.slice.call(scope.querySelectorAll(".filter-item"));
            var params = new URLSearchParams(window.location.search);
            var initialQuery = params.get("q") || "";

            if (input && initialQuery) {
                input.value = initialQuery;
            }

            function normalize(value) {
                return String(value || "").trim().toLowerCase();
            }

            function apply() {
                var q = normalize(input ? input.value : "");
                var y = normalize(year ? year.value : "");
                var t = normalize(type ? type.value : "");
                var c = normalize(category ? category.value : "");

                items.forEach(function (item) {
                    var haystack = normalize([
                        item.getAttribute("data-title"),
                        item.getAttribute("data-tags"),
                        item.getAttribute("data-type"),
                        item.getAttribute("data-year"),
                        item.getAttribute("data-category")
                    ].join(" "));
                    var matchQuery = !q || haystack.indexOf(q) !== -1;
                    var matchYear = !y || normalize(item.getAttribute("data-year")).indexOf(y) !== -1;
                    var matchType = !t || normalize(item.getAttribute("data-type")).indexOf(t) !== -1;
                    var matchCategory = !c || normalize(item.getAttribute("data-category")) === c;
                    item.style.display = matchQuery && matchYear && matchType && matchCategory ? "" : "none";
                });
            }

            [input, year, type, category].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
            apply();
        });

        var video = document.querySelector("#movie-player");
        var overlay = document.querySelector("[data-player-trigger]");
        if (video) {
            var started = false;
            var hlsInstance = null;

            function attachStream() {
                if (started) {
                    return;
                }
                started = true;
                var src = video.getAttribute("data-hls");
                if (!src) {
                    return;
                }
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = src;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(src);
                    hlsInstance.attachMedia(video);
                } else {
                    video.src = src;
                }
            }

            function startPlayback() {
                attachStream();
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
                var result = video.play();
                if (result && typeof result.catch === "function") {
                    result.catch(function () {});
                }
            }

            if (overlay) {
                overlay.addEventListener("click", startPlayback);
            }
            video.addEventListener("click", function () {
                if (!started) {
                    startPlayback();
                }
            });
            window.addEventListener("pagehide", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        }
    });
})();
