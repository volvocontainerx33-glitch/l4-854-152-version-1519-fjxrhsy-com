// Static movie site interactions: navigation, carousel, filtering, search, image fallback and HLS playback.
(function () {
    "use strict";

    function $(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function $all(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function textContains(haystack, needle) {
        return String(haystack || "").toLowerCase().indexOf(String(needle || "").toLowerCase()) !== -1;
    }

    function initMobileMenu() {
        var button = $("[data-mobile-menu-button]");
        var menu = $("[data-mobile-menu]");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initHeroSlider() {
        var slider = $("[data-hero-slider]");
        if (!slider) {
            return;
        }
        var slides = $all(".hero-slide", slider);
        var dots = $all("[data-hero-dot]", slider);
        var previous = $("[data-hero-prev]", slider);
        var next = $("[data-hero-next]", slider);
        var index = 0;
        var timer;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                var isActive = slideIndex === index;
                slide.classList.toggle("is-active", isActive);
                slide.setAttribute("aria-hidden", isActive ? "false" : "true");
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        if (previous) {
            previous.addEventListener("click", function () {
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
        slider.addEventListener("mouseenter", stop);
        slider.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initImageFallbacks() {
        $all(".js-cover-image").forEach(function (image) {
            image.addEventListener("error", function () {
                var parent = image.closest(".poster, .hero-slide");
                if (parent) {
                    parent.classList.add("is-missing");
                }
            }, { once: true });
        });
    }

    function initCardFilter() {
        var input = $(".js-card-filter");
        var grid = $(".js-card-grid");
        if (!input || !grid) {
            return;
        }
        var cards = $all(".movie-card", grid);
        input.addEventListener("input", function () {
            var keyword = input.value.trim().toLowerCase();
            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute("data-title"),
                    card.getAttribute("data-category"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-region"),
                    card.textContent
                ].join(" ").toLowerCase();
                card.hidden = keyword && haystack.indexOf(keyword) === -1;
            });
        });
    }

    function initPlayer() {
        var video = $(".js-player-video");
        if (!video) {
            return;
        }
        var src = video.getAttribute("data-src");
        var toggle = $("[data-player-toggle]");
        var status = $("[data-player-status]");
        var hlsInstance = null;
        var isReady = false;

        function setStatus(message) {
            if (status) {
                status.textContent = message || "";
            }
        }

        function prepare() {
            if (isReady || !src) {
                return Promise.resolve();
            }
            isReady = true;
            setStatus("正在初始化播放源…");
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = src;
                setStatus("");
                return Promise.resolve();
            }
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(src);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    setStatus("");
                });
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        setStatus("视频加载失败，请刷新页面或稍后重试。");
                    }
                });
                return Promise.resolve();
            }
            setStatus("当前浏览器暂不支持 HLS 播放，请更换支持的浏览器访问。");
            return Promise.reject(new Error("HLS is not supported"));
        }

        function play() {
            prepare().then(function () {
                return video.play();
            }).then(function () {
                if (toggle) {
                    toggle.classList.add("is-hidden");
                }
            }).catch(function () {
                setStatus("点击播放器控件可再次尝试播放。");
            });
        }

        if (toggle) {
            toggle.addEventListener("click", play);
        }
        video.addEventListener("play", function () {
            if (toggle) {
                toggle.classList.add("is-hidden");
            }
        });
        video.addEventListener("pause", function () {
            if (toggle) {
                toggle.classList.remove("is-hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
        prepare().catch(function () {});
    }

    function cardMarkup(movie) {
        var meta = [movie.year, movie.region, movie.type].filter(Boolean).join(" / ");
        var tags = (movie.genres || []).slice(0, 2).map(function (tag) {
            return "<span>" + escapeHTML(tag) + "</span>";
        }).join("");
        return [
            "<article class="movie-card" data-title="" + escapeHTML(movie.title) + "">",
            "    <a href="" + escapeHTML(movie.url) + "">",
            "        <figure class="poster" data-fallback="" + escapeHTML(movie.title) + "">",
            "            <img class="js-cover-image" src="" + escapeHTML(movie.cover) + "" alt="" + escapeHTML(movie.title) + "" loading="lazy">",
            "            <span class="play-chip">▶</span>",
            "            <span class="corner-pill">" + escapeHTML(movie.category) + "</span>",
            "        </figure>",
            "        <div class="movie-card-body">",
            "            <h3>" + escapeHTML(movie.title) + "</h3>",
            "            <p>" + escapeHTML(movie.oneLine || movie.summary || "") + "</p>",
            "            <div class="movie-meta">" + escapeHTML(meta) + "</div>",
            "            <div class="tag-row">" + tags + "</div>",
            "        </div>",
            "    </a>",
            "</article>"
        ].join("
");
    }

    function initSearchPage() {
        var app = $("#searchApp");
        if (!app) {
            return;
        }
        var jsonPath = app.getAttribute("data-movies-json") || "assets/movies.json";
        var form = $("[data-search-form]", app);
        var keywordInput = $("#searchKeyword", app);
        var categorySelect = $("#searchCategory", app);
        var regionSelect = $("#searchRegion", app);
        var yearSelect = $("#searchYear", app);
        var genreSelect = $("#searchGenre", app);
        var resultBox = $("[data-search-results]", app);
        var countBox = $("[data-search-count]", app);
        var movies = [];

        function paramsToControls() {
            var params = new URLSearchParams(window.location.search);
            keywordInput.value = params.get("q") || "";
            categorySelect.value = params.get("category") || "";
            regionSelect.value = params.get("region") || "";
            yearSelect.value = params.get("year") || "";
            genreSelect.value = params.get("genre") || "";
        }

        function updateUrl() {
            var params = new URLSearchParams();
            if (keywordInput.value.trim()) {
                params.set("q", keywordInput.value.trim());
            }
            if (categorySelect.value) {
                params.set("category", categorySelect.value);
            }
            if (regionSelect.value) {
                params.set("region", regionSelect.value);
            }
            if (yearSelect.value) {
                params.set("year", yearSelect.value);
            }
            if (genreSelect.value) {
                params.set("genre", genreSelect.value);
            }
            var query = params.toString();
            var url = window.location.pathname + (query ? "?" + query : "");
            window.history.replaceState(null, "", url);
        }

        function runSearch() {
            var keyword = keywordInput.value.trim();
            var category = categorySelect.value;
            var region = regionSelect.value;
            var year = yearSelect.value;
            var genre = genreSelect.value;
            var filtered = movies.filter(function (movie) {
                var haystack = [
                    movie.title,
                    movie.oneLine,
                    movie.summary,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    (movie.tags || []).join(" "),
                    (movie.genres || []).join(" ")
                ].join(" ");
                if (keyword && !textContains(haystack, keyword)) {
                    return false;
                }
                if (category && movie.category !== category) {
                    return false;
                }
                if (region && movie.region !== region) {
                    return false;
                }
                if (year && movie.year !== year) {
                    return false;
                }
                if (genre && (movie.genres || []).indexOf(genre) === -1) {
                    return false;
                }
                return true;
            });
            var limited = filtered.slice(0, 120);
            resultBox.innerHTML = limited.map(cardMarkup).join("
");
            if (countBox) {
                countBox.textContent = "找到 " + filtered.length + " 部影片，当前显示前 " + limited.length + " 部。";
            }
            initImageFallbacks();
            updateUrl();
        }

        paramsToControls();
        fetch(jsonPath)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                movies = data;
                runSearch();
            })
            .catch(function () {
                if (countBox) {
                    countBox.textContent = "搜索数据暂时无法载入，页面下方仍保留了部分静态推荐入口。";
                }
            });
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            runSearch();
        });
        [keywordInput, categorySelect, regionSelect, yearSelect, genreSelect].forEach(function (control) {
            control.addEventListener("input", runSearch);
            control.addEventListener("change", runSearch);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initMobileMenu();
        initHeroSlider();
        initImageFallbacks();
        initCardFilter();
        initPlayer();
        initSearchPage();
    });
})();
