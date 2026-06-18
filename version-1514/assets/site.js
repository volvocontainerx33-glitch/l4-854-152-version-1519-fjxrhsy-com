(function () {
    var menuButton = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.main-nav');

    if (menuButton && nav) {
        menuButton.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var current = 0;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }

        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle('is-active', slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('is-active', dotIndex === current);
        });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            showSlide(index);
        });
    });

    if (slides.length > 1) {
        setInterval(function () {
            showSlide(current + 1);
        }, 5600);
    }

    function normalize(value) {
        return (value || '').toString().toLowerCase().trim();
    }

    function applyFilters(scope) {
        var root = scope || document;
        var keyword = normalize((root.querySelector('[data-filter="keyword"]') || {}).value);
        var year = normalize((root.querySelector('[data-filter="year"]') || {}).value);
        var type = normalize((root.querySelector('[data-filter="type"]') || {}).value);
        var cards = Array.prototype.slice.call(root.querySelectorAll('.movie-card'));
        var empty = root.querySelector('.empty-message');
        var visibleCount = 0;

        cards.forEach(function (card) {
            var haystack = normalize([
                card.getAttribute('data-title'),
                card.getAttribute('data-year'),
                card.getAttribute('data-region'),
                card.getAttribute('data-type'),
                card.getAttribute('data-genre')
            ].join(' '));
            var yearOk = !year || normalize(card.getAttribute('data-year')).indexOf(year) !== -1;
            var typeOk = !type || normalize(card.getAttribute('data-type')).indexOf(type) !== -1;
            var keywordOk = !keyword || haystack.indexOf(keyword) !== -1;
            var shouldShow = yearOk && typeOk && keywordOk;

            card.style.display = shouldShow ? '' : 'none';
            if (shouldShow) {
                visibleCount += 1;
            }
        });

        if (empty) {
            empty.style.display = visibleCount ? 'none' : 'block';
        }
    }

    Array.prototype.slice.call(document.querySelectorAll('[data-filter]')).forEach(function (input) {
        input.addEventListener('input', function () {
            applyFilters(document);
        });
        input.addEventListener('change', function () {
            applyFilters(document);
        });
    });

    window.initPlayer = function (videoId, buttonId, sourceUrl) {
        var video = document.getElementById(videoId);
        var button = document.getElementById(buttonId);
        var hlsInstance = null;
        var ready = false;

        function load() {
            if (!video || ready) {
                return;
            }

            ready = true;
            video.setAttribute('playsinline', 'playsinline');
            video.setAttribute('webkit-playsinline', 'webkit-playsinline');

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = sourceUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false
                });
                hlsInstance.loadSource(sourceUrl);
                hlsInstance.attachMedia(video);
            } else {
                video.src = sourceUrl;
            }
        }

        function start() {
            load();

            if (button) {
                button.classList.add('is-hidden');
            }

            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {
                    video.controls = true;
                });
            }
        }

        if (button) {
            button.addEventListener('click', start);
        }

        if (video) {
            video.addEventListener('click', function () {
                if (video.paused) {
                    start();
                }
            });
        }

        window.addEventListener('pagehide', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };
})();
