(function () {
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  const title = document.getElementById("searchTitle");
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";

  if (!input || !results || !window.SEARCH_INDEX) {
    return;
  }

  input.value = initialQuery;

  const normalize = function (value) {
    return String(value || "").toLowerCase();
  };

  const card = function (item) {
    const tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + tag + "</span>";
    }).join("");

    return [
      "<article class=\"movie-card\">",
      "<a class=\"movie-cover\" href=\"" + item.url + "\">",
      "<img src=\"" + item.cover + "\" alt=\"" + item.title + "\" loading=\"lazy\">",
      "<span class=\"movie-badge\">" + item.type + "</span>",
      "</a>",
      "<div class=\"movie-info\">",
      "<a href=\"" + item.url + "\" class=\"movie-title\">" + item.title + "</a>",
      "<p>" + item.description + "</p>",
      "<div class=\"movie-meta\"><span>" + item.year + "</span><span>" + item.region + "</span><span>" + item.views.toLocaleString() + "次观看</span></div>",
      "<div class=\"tag-list\">" + tags + "</div>",
      "</div>",
      "</article>"
    ].join("");
  };

  const render = function () {
    const query = input.value.trim();
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    let items = window.SEARCH_INDEX;

    if (terms.length) {
      items = items.filter(function (item) {
        const haystack = normalize([
          item.title,
          item.region,
          item.type,
          item.genre,
          (item.tags || []).join(" "),
          item.description,
          item.year
        ].join(" "));
        return terms.every(function (term) {
          return haystack.indexOf(term) !== -1;
        });
      });
    } else {
      items = items.slice().sort(function (a, b) {
        return b.views - a.views;
      }).slice(0, 36);
    }

    if (title) {
      title.textContent = query ? "与“" + query + "”相关的影片" : "精选影片";
    }

    results.innerHTML = items.slice(0, 96).map(card).join("");
  };

  input.addEventListener("input", render);
  render();
})();
