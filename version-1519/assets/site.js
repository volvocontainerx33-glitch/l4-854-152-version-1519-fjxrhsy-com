import { H as Hls } from "./video-vendor-DrU42sTK.js";

const rootPath = document.body.dataset.root || "";

function bySelector(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

function initMobileNavigation() {
    const toggle = document.querySelector("[data-menu-toggle]");
    if (!toggle) {
        return;
    }
    toggle.addEventListener("click", () => {
        document.body.classList.toggle("nav-open");
    });
}

function initSearchForms() {
    bySelector("[data-search-form]").forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const input = form.querySelector("input[name='q']");
            const query = input ? input.value.trim() : "";
            const target = `${rootPath}search.html${query ? `?q=${encodeURIComponent(query)}` : ""}`;
            window.location.href = target;
        });
    });
}

function initHeroCarousel() {
    const hero = document.querySelector("[data-hero]");
    if (!hero) {
        return;
    }

    const slides = bySelector("[data-hero-slide]", hero);
    const dots = bySelector("[data-hero-dot]", hero);
    if (slides.length <= 1) {
        return;
    }

    let current = 0;
    let timer = null;

    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle("is-active", slideIndex === current);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("is-active", dotIndex === current);
        });
    };

    const start = () => {
        timer = window.setInterval(() => show(current + 1), 5600);
    };

    const stop = () => {
        if (timer) {
            window.clearInterval(timer);
        }
    };

    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            stop();
            show(Number(dot.dataset.heroDot || 0));
            start();
        });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
}

function initPageFilters() {
    bySelector("[data-page-filter]").forEach((panel) => {
        const input = panel.querySelector("[data-filter-input]");
        const year = panel.querySelector("[data-filter-year]");
        const reset = panel.querySelector("[data-filter-reset]");
        const section = panel.closest("section");
        const items = bySelector("[data-filter-item]", section || document);
        const empty = section ? section.querySelector("[data-filter-empty]") : null;

        const apply = () => {
            const query = (input?.value || "").trim().toLowerCase();
            const selectedYear = year?.value || "";
            let visible = 0;

            items.forEach((item) => {
                const haystack = [
                    item.dataset.title,
                    item.dataset.region,
                    item.dataset.type,
                    item.dataset.year,
                    item.dataset.tags,
                ].join(" ").toLowerCase();
                const matchedQuery = !query || haystack.includes(query);
                const matchedYear = !selectedYear || item.dataset.year === selectedYear;
                const shouldShow = matchedQuery && matchedYear;
                item.hidden = !shouldShow;
                if (shouldShow) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.hidden = visible !== 0;
            }
        };

        input?.addEventListener("input", apply);
        year?.addEventListener("change", apply);
        reset?.addEventListener("click", () => {
            if (input) {
                input.value = "";
            }
            if (year) {
                year.value = "";
            }
            apply();
        });
    });
}

function initPlayers() {
    bySelector("[data-player]").forEach((player) => {
        const video = player.querySelector("video[data-hls-src]");
        const button = player.querySelector("[data-player-toggle]");
        const status = player.querySelector("[data-player-status]");
        if (!video) {
            return;
        }

        const source = video.dataset.hlsSrc;
        let hls = null;

        const setStatus = (message) => {
            if (status) {
                status.textContent = message;
            }
        };

        const markReady = () => {
            setStatus("播放源已就绪，点击画面即可播放");
        };

        if (Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, markReady);
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data && data.fatal) {
                    setStatus("视频加载失败，请刷新页面重试");
                }
            });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
            video.addEventListener("loadedmetadata", markReady, { once: true });
        } else {
            setStatus("当前浏览器不支持 HLS 播放，请更换现代浏览器");
        }

        const playOrPause = async () => {
            try {
                if (video.paused) {
                    await video.play();
                    player.classList.add("is-playing");
                    video.setAttribute("controls", "controls");
                } else {
                    video.pause();
                    player.classList.remove("is-playing");
                }
            } catch (error) {
                setStatus("浏览器阻止了自动播放，请再次点击播放按钮");
            }
        };

        button?.addEventListener("click", playOrPause);
        video.addEventListener("click", playOrPause);
        video.addEventListener("pause", () => player.classList.remove("is-playing"));
        video.addEventListener("play", () => player.classList.add("is-playing"));
        window.addEventListener("beforeunload", () => {
            if (hls) {
                hls.destroy();
            }
        });
    });
}

function renderMovieCard(movie) {
    const tags = (movie.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    return `
        <article class="movie-card">
            <a class="movie-card__poster" href="${movie.detail}">
                <img src="./${movie.cover}" alt="${escapeHtml(movie.title)}" loading="lazy">
                <span class="movie-card__duration">${escapeHtml(movie.duration)}</span>
            </a>
            <div class="movie-card__body">
                <a class="movie-card__title" href="${movie.detail}">${escapeHtml(movie.title)}</a>
                <p class="movie-card__desc">${escapeHtml(movie.oneLine)}</p>
                <div class="movie-card__tags">${tags}</div>
                <div class="movie-card__meta">
                    <span>${escapeHtml(movie.region)}</span>
                    <span>${escapeHtml(movie.year)}</span>
                    <span>${escapeHtml(movie.category)}</span>
                </div>
            </div>
        </article>
    `;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function initSearchPage() {
    const page = document.querySelector("[data-search-page]");
    if (!page || !window.MOVIE_INDEX) {
        return;
    }

    const input = page.querySelector("[data-search-input]");
    const category = page.querySelector("[data-search-category]");
    const type = page.querySelector("[data-search-type]");
    const button = page.querySelector("[data-search-button]");
    const summary = page.querySelector("[data-search-summary]");
    const results = page.querySelector("[data-search-results]");
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || "";

    const types = [...new Set(window.MOVIE_INDEX.map((movie) => movie.type).filter(Boolean))].sort();
    types.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        type.appendChild(option);
    });

    input.value = initialQuery;

    const apply = () => {
        const query = (input.value || "").trim().toLowerCase();
        const selectedCategory = category.value;
        const selectedType = type.value;
        const matches = window.MOVIE_INDEX.filter((movie) => {
            const haystack = [
                movie.title,
                movie.oneLine,
                movie.summary,
                movie.region,
                movie.type,
                movie.year,
                movie.genre,
                movie.category,
                ...(movie.tags || []),
            ].join(" ").toLowerCase();
            return (!query || haystack.includes(query))
                && (!selectedCategory || movie.category === selectedCategory)
                && (!selectedType || movie.type === selectedType);
        }).slice(0, 200);

        results.innerHTML = matches.map(renderMovieCard).join("");
        summary.textContent = `找到 ${matches.length} 条匹配结果${matches.length === 200 ? "（已显示前 200 条）" : ""}。`;
    };

    input.addEventListener("input", apply);
    category.addEventListener("change", apply);
    type.addEventListener("change", apply);
    button.addEventListener("click", apply);
    apply();
}

initMobileNavigation();
initSearchForms();
initHeroCarousel();
initPageFilters();
initPlayers();
initSearchPage();
