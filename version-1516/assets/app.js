(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    if (toggle && header) {
      toggle.addEventListener('click', function () {
        header.classList.toggle('menu-open');
      });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
      var next = hero.querySelector('[data-hero-next]');
      var prev = hero.querySelector('[data-hero-prev]');
      var index = 0;
      var timer;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('active', i === index);
        });
      }

      function start() {
        stop();
        timer = setInterval(function () {
          show(index + 1);
        }, 5000);
      }

      function stop() {
        if (timer) {
          clearInterval(timer);
        }
      }

      if (next) {
        next.addEventListener('click', function () {
          show(index + 1);
          start();
        });
      }
      if (prev) {
        prev.addEventListener('click', function () {
          show(index - 1);
          start();
        });
      }
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          show(i);
          start();
        });
      });
      hero.addEventListener('mouseenter', stop);
      hero.addEventListener('mouseleave', start);
      show(0);
      start();
    }

    document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
      var parent = scope.parentElement || document;
      var input = scope.querySelector('[data-search-input]');
      var typeSelect = scope.querySelector('[data-type-filter]');
      var regionSelect = scope.querySelector('[data-region-filter]');
      var cards = Array.prototype.slice.call(parent.querySelectorAll('[data-card]'));

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var type = typeSelect ? typeSelect.value : '';
        var region = regionSelect ? regionSelect.value : '';
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title'),
            card.getAttribute('data-category'),
            card.getAttribute('data-year'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-tags')
          ].join(' ').toLowerCase();
          var okQuery = !query || haystack.indexOf(query) !== -1;
          var okType = !type || card.getAttribute('data-type') === type;
          var okRegion = !region || card.getAttribute('data-region') === region;
          card.classList.toggle('hidden-card', !(okQuery && okType && okRegion));
        });
      }

      [input, typeSelect, regionSelect].forEach(function (el) {
        if (el) {
          el.addEventListener('input', apply);
          el.addEventListener('change', apply);
        }
      });
    });

    document.querySelectorAll('[data-player]').forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('.play-button');
      var stream = box.getAttribute('data-stream');
      var hlsInstance = null;
      var loaded = false;

      function loadStream() {
        if (!video || !stream || loaded) {
          return;
        }
        loaded = true;
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else {
          video.src = stream;
        }
      }

      function play() {
        loadStream();
        if (!video) {
          return;
        }
        var attempt = video.play();
        if (attempt && typeof attempt.then === 'function') {
          attempt.then(function () {
            box.classList.add('is-playing');
          }).catch(function () {
            box.classList.remove('is-playing');
          });
        } else {
          box.classList.add('is-playing');
        }
      }

      if (button) {
        button.addEventListener('click', play);
      }
      if (video) {
        video.addEventListener('click', function () {
          if (video.paused) {
            play();
          } else {
            video.pause();
          }
        });
        video.addEventListener('play', function () {
          box.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
          box.classList.remove('is-playing');
        });
        video.addEventListener('ended', function () {
          box.classList.remove('is-playing');
        });
      }
    });

    var searchRoot = document.querySelector('[data-search-page]');
    if (searchRoot && typeof SearchIndex !== 'undefined') {
      var input = searchRoot.querySelector('[data-global-search]');
      var results = searchRoot.querySelector('[data-search-results]');
      var empty = searchRoot.querySelector('[data-search-empty]');

      function render(items) {
        if (!results) {
          return;
        }
        results.innerHTML = items.slice(0, 80).map(function (item) {
          return '<article class="movie-card" data-card>' +
            '<a class="poster" href="' + item.url + '">' +
            '<img src="' + item.cover + '" alt="' + item.title.replace(/"/g, '&quot;') + '" loading="lazy">' +
            '<span class="poster-type">' + item.type + '</span>' +
            '</a>' +
            '<div class="card-body">' +
            '<h3><a href="' + item.url + '">' + item.title + '</a></h3>' +
            '<p>' + item.line + '</p>' +
            '<div class="meta-line"><span>' + item.region + '</span><span>' + item.year + '</span><span>' + item.category + '</span></div>' +
            '</div>' +
            '</article>';
        }).join('');
        if (empty) {
          empty.style.display = items.length ? 'none' : 'block';
        }
      }

      function search() {
        var q = input ? input.value.trim().toLowerCase() : '';
        var found = SearchIndex.filter(function (item) {
          return !q || item.words.indexOf(q) !== -1;
        });
        render(found);
      }

      if (input) {
        input.addEventListener('input', search);
      }
      render(SearchIndex.slice(0, 36));
    }
  });
})();
