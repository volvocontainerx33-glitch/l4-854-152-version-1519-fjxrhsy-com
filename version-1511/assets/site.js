(function () {
  const menuButton = document.querySelector("[data-menu-button]");
  const siteNav = document.querySelector("[data-site-nav]");

  if (menuButton && siteNav) {
    menuButton.addEventListener("click", function () {
      siteNav.classList.toggle("is-open");
    });
  }

  const hero = document.querySelector("[data-hero]");

  if (hero) {
    const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    let current = 0;

    const activate = function (index) {
      current = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    };

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        activate(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        activate((current + 1) % slides.length);
      }, 5200);
    }
  }

  const filterable = document.querySelector("[data-filterable]");

  if (filterable) {
    const searchInput = document.querySelector(".local-search");
    const tagFilter = document.querySelector(".tag-filter");
    const sortSelect = document.querySelector(".sort-select");
    const cards = Array.from(filterable.querySelectorAll(".movie-card"));

    const applyFilters = function () {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      const tag = tagFilter ? tagFilter.value.trim().toLowerCase() : "";

      cards.forEach(function (card) {
        const text = (card.dataset.title + " " + card.dataset.keywords).toLowerCase();
        const matchQuery = !query || text.indexOf(query) !== -1;
        const matchTag = !tag || text.indexOf(tag) !== -1;
        card.classList.toggle("hidden-card", !(matchQuery && matchTag));
      });
    };

    const applySort = function () {
      const mode = sortSelect ? sortSelect.value : "default";
      const sorted = cards.slice().sort(function (a, b) {
        if (mode === "views") {
          return Number(b.dataset.views) - Number(a.dataset.views);
        }
        if (mode === "likes") {
          return Number(b.dataset.likes) - Number(a.dataset.likes);
        }
        if (mode === "year") {
          return Number(b.dataset.year) - Number(a.dataset.year);
        }
        return 0;
      });
      sorted.forEach(function (card) {
        filterable.appendChild(card);
      });
      applyFilters();
    };

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }
    if (tagFilter) {
      tagFilter.addEventListener("change", applyFilters);
    }
    if (sortSelect) {
      sortSelect.addEventListener("change", applySort);
    }
  }
})();
