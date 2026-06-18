(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function closeSearchPanels() {
    qsa('[data-search-results]').forEach(function (panel) {
      panel.classList.remove('open');
      panel.innerHTML = '';
    });
  }

  function renderSearch(input) {
    var form = input.closest('[data-search-form]');
    var panel = qs('[data-search-results]', form);
    var query = normalize(input.value);
    var source = window.SITE_SEARCH || [];

    if (!panel || query.length < 1) {
      if (panel) {
        panel.classList.remove('open');
        panel.innerHTML = '';
      }
      return [];
    }

    var results = source.filter(function (item) {
      return normalize(item.title + ' ' + item.category + ' ' + item.region + ' ' + item.type + ' ' + item.tags).indexOf(query) !== -1;
    }).slice(0, 10);

    panel.innerHTML = results.map(function (item) {
      return '<a class="search-result" href="' + item.link + '">' +
        '<img src="' + item.cover + '" alt="' + item.title.replace(/"/g, '&quot;') + '">' +
        '<span><strong>' + item.title + '</strong><span>' + item.category + ' · ' + item.year + ' · ' + item.region + '</span></span>' +
        '</a>';
    }).join('');

    if (results.length === 0) {
      panel.innerHTML = '<div class="search-result"><span><strong>暂无匹配内容</strong><span>请尝试输入其他关键词</span></span></div>';
    }

    panel.classList.add('open');
    return results;
  }

  function initHeader() {
    var toggle = qs('[data-mobile-toggle]');
    var panel = qs('[data-mobile-panel]');

    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        panel.classList.toggle('open');
      });
    }

    qsa('[data-site-search]').forEach(function (input) {
      input.addEventListener('input', function () {
        renderSearch(input);
      });

      input.addEventListener('focus', function () {
        renderSearch(input);
      });
    });

    qsa('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = qs('[data-site-search]', form);
        var results = input ? renderSearch(input) : [];
        if (results.length > 0) {
          window.location.href = results[0].link;
        }
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('[data-search-form]')) {
        closeSearchPanels();
      }
    });
  }

  function initHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
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

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initCardFilters() {
    qsa('[data-grid-filter]').forEach(function (filter) {
      var input = qs('[data-card-search]', filter);
      var buttons = qsa('[data-filter-value]', filter);
      var grid = filter.nextElementSibling;
      var cards = grid ? qsa('[data-movie-card]', grid) : [];
      var current = 'all';

      function apply() {
        var query = normalize(input ? input.value : '');
        cards.forEach(function (card) {
          var text = normalize(card.getAttribute('data-search'));
          var matchesQuery = !query || text.indexOf(query) !== -1;
          var matchesFilter = current === 'all' || text.indexOf(normalize(current)) !== -1;
          card.classList.toggle('hidden-card', !(matchesQuery && matchesFilter));
        });
      }

      if (input) {
        input.addEventListener('input', apply);
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          current = button.getAttribute('data-filter-value') || 'all';
          buttons.forEach(function (item) {
            item.classList.toggle('active', item === button);
          });
          apply();
        });
      });
    });
  }

  function initPlayer() {
    var shell = qs('[data-player]');
    if (!shell) {
      return;
    }

    var video = qs('video', shell);
    var button = qs('[data-play-button]', shell);
    var stream = shell.getAttribute('data-stream');
    var attached = false;
    var hls = null;

    function attach() {
      if (attached || !video || !stream) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else {
        video.src = stream;
      }

      attached = true;
    }

    function play() {
      attach();
      shell.classList.add('is-playing');
      var action = video.play();
      if (action && typeof action.catch === 'function') {
        action.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener('click', play);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (!attached) {
          play();
        }
      });
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initHero();
    initCardFilters();
    initPlayer();
  });
})();
