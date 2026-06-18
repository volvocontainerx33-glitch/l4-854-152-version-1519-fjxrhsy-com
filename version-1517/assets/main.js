(function() {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initNavigation() {
        var header = document.querySelector(".site-header");
        var toggle = document.querySelector(".nav-toggle");
        if (!header || !toggle) {
            return;
        }
        toggle.addEventListener("click", function() {
            header.classList.toggle("nav-open");
        });
    }

    function initHero() {
        var hero = document.querySelector(".hero");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function setActive(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function(slide, position) {
                slide.classList.toggle("active", position === index);
            });
            dots.forEach(function(dot, position) {
                dot.classList.toggle("active", position === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function() {
                setActive(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener("click", function() {
                setActive(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function() {
                setActive(index + 1);
                start();
            });
        }
        dots.forEach(function(dot, position) {
            dot.addEventListener("click", function() {
                setActive(position);
                start();
            });
        });
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        start();
    }

    function initFilters() {
        var collections = Array.prototype.slice.call(document.querySelectorAll(".movie-collection"));
        collections.forEach(function(collection) {
            var input = collection.querySelector(".filter-input");
            var selects = Array.prototype.slice.call(collection.querySelectorAll(".filter-select"));
            var cards = Array.prototype.slice.call(collection.querySelectorAll(".movie-card"));
            if (!input && selects.length === 0) {
                return;
            }

            function applyFilters() {
                var keyword = input ? input.value.trim().toLowerCase() : "";
                var visible = 0;
                var filters = {};
                selects.forEach(function(select) {
                    filters[select.getAttribute("data-filter")] = select.value;
                });
                cards.forEach(function(card) {
                    var search = (card.getAttribute("data-search") || "").toLowerCase();
                    var matched = !keyword || search.indexOf(keyword) !== -1;
                    Object.keys(filters).forEach(function(name) {
                        if (filters[name] && card.getAttribute("data-" + name) !== filters[name]) {
                            matched = false;
                        }
                    });
                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        visible += 1;
                    }
                });
                collection.classList.toggle("is-empty", visible === 0);
            }

            if (input) {
                input.addEventListener("input", applyFilters);
            }
            selects.forEach(function(select) {
                select.addEventListener("change", applyFilters);
            });
            applyFilters();
        });
    }

    function initSearchQuery() {
        var page = document.querySelector("[data-search-page]");
        if (!page) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q");
        var input = page.querySelector(".filter-input");
        if (query && input) {
            input.value = query;
            input.dispatchEvent(new Event("input", {
                bubbles: true
            }));
        }
    }

    ready(function() {
        initNavigation();
        initHero();
        initFilters();
        initSearchQuery();
    });
})();
