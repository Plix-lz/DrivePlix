(function () {
  "use strict";

  var TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
  var TMDB_IMG = "https://image.tmdb.org/t/p/";
  var SUBDL_API_KEY = "subdl_0fRYzFwGszvuv_2reqJYMrThiKEN3-3QbOdAVVRtpAc";
  var SUBDL_API = "https://api.subdl.com/api/v1/subtitles";
  var SUBDL_DL = "https://dl.subdl.com";
  var INFO_TEXT = "Estas Mirando:";

  var I = {
    check:
      '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    warn:
      '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
  };

  var selectedMeta = null;
  var selectedSub = null;

  function encodeBase64Utf8(str) {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  }

  function defaultPlayerBase() {
    var path = location.pathname.replace(/index\.html?$/i, "");
    if (!path.endsWith("/")) path += "/";
    return location.origin + path + "player.html";
  }

  function yearFromDate(dateStr) {
    if (!dateStr) return "";
    return String(dateStr).slice(0, 4);
  }

  function formatTmdbTitle(item) {
    var name = item.title || item.name || "Sin título";
    var year = yearFromDate(item.release_date || item.first_air_date);
    return year ? name + " (" + year + ")" : name;
  }

  function thumbFromTmdb(item) {
    if (item.poster_path) return TMDB_IMG + "w185" + item.poster_path;
    if (item.backdrop_path) return TMDB_IMG + "w300" + item.backdrop_path;
    return "";
  }

  function absoluteSubUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return SUBDL_DL + (path.charAt(0) === "/" ? path : "/" + path);
  }

  var videoInput = document.getElementById("video");
  var posterInput = document.getElementById("poster");
  var titleInput = document.getElementById("title");
  var tmdbQuery = document.getElementById("tmdbQuery");
  var tmdbResults = document.getElementById("tmdbResults");
  var subLang = document.getElementById("subLang");
  var subResults = document.getElementById("subResults");
  var subSelected = document.getElementById("subSelected");
  var subSelectedLabel = document.getElementById("subSelectedLabel");
  var subManual = document.getElementById("subManual");
  var baseUrlInput = document.getElementById("baseUrl");
  var output = document.getElementById("output");
  var iframeCode = document.getElementById("iframeCode");
  var statusEl = document.getElementById("status");
  var preview = document.getElementById("preview");
  var previewEmpty = document.getElementById("previewEmpty");
  var posterPreview = document.getElementById("posterPreview");
  var posterThumb = document.getElementById("posterThumb");
  var posterTitle = document.getElementById("posterTitle");
  var searchTimer = null;

  baseUrlInput.value = defaultPlayerBase();

  function setStatus(msg, isWarn) {
    statusEl.className = "status" + (isWarn ? " warn" : "");
    if (!msg) {
      statusEl.textContent = "";
      return;
    }
    statusEl.innerHTML = (isWarn ? I.warn : I.check) + " " + msg;
  }

  function updatePosterPreview() {
    var poster = posterInput.value.trim();
    var title = titleInput.value.trim();
    if (poster) {
      posterThumb.src = poster;
      posterTitle.textContent = title || "Sin título";
      posterPreview.classList.add("visible");
    } else {
      posterPreview.classList.remove("visible");
      posterThumb.removeAttribute("src");
    }
  }

  function clearSelectedSub() {
    selectedSub = null;
    subSelected.hidden = true;
    subSelectedLabel.textContent = "—";
  }

  function applySelectedSub(sub) {
    selectedSub = sub;
    subSelected.hidden = false;
    subSelectedLabel.textContent =
      (sub.lang ? "[" + sub.lang + "] " : "") + (sub.label || sub.url);
    subResults.classList.remove("open");
    subResults.innerHTML = "";
    setStatus("Subtítulo seleccionado: " + (sub.label || "OK"));
  }

  function applyTmdbItem(item) {
    var title = formatTmdbTitle(item);
    var image = item.backdrop_path
      ? TMDB_IMG + "original" + item.backdrop_path
      : item.poster_path
        ? TMDB_IMG + "original" + item.poster_path
        : "";

    titleInput.value = title;
    if (image) posterInput.value = image;
    updatePosterPreview();
    tmdbResults.classList.remove("open");
    tmdbResults.innerHTML = "";

    selectedMeta = {
      tmdb_id: item.id,
      type: item.media_type === "tv" ? "tv" : "movie",
      year: yearFromDate(item.release_date || item.first_air_date),
      name: item.title || item.name || ""
    };
    clearSelectedSub();
    setStatus("Datos de TMDB aplicados: " + title + ". Ya puedes buscar subtítulos.");
  }

  function renderTmdbResults(results) {
    tmdbResults.innerHTML = "";
    if (!results.length) {
      tmdbResults.innerHTML = '<div class="tmdb-empty">Sin resultados.</div>';
      tmdbResults.classList.add("open");
      return;
    }

    results.slice(0, 10).forEach(function (item) {
      if (item.media_type !== "movie" && item.media_type !== "tv") return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tmdb-item";

      var thumb = thumbFromTmdb(item);
      var typeLabel = item.media_type === "tv" ? "Serie" : "Película";
      var year = yearFromDate(item.release_date || item.first_air_date);

      btn.innerHTML =
        (thumb
          ? '<img src="' + thumb + '" alt="" />'
          : '<img alt="" style="opacity:.3" />') +
        '<div class="tmdb-meta"><strong>' +
        formatTmdbTitle(item) +
        "</strong><span>" +
        typeLabel +
        (year ? " · " + year : "") +
        "</span></div>";

      btn.addEventListener("click", function () {
        applyTmdbItem(item);
      });

      tmdbResults.appendChild(btn);
    });

    if (!tmdbResults.children.length) {
      tmdbResults.innerHTML =
        '<div class="tmdb-empty">Sin películas o series en los resultados.</div>';
    }

    tmdbResults.classList.add("open");
  }

  async function searchTmdb(query) {
    query = (query || "").trim();
    if (query.length < 2) {
      tmdbResults.classList.remove("open");
      tmdbResults.innerHTML = "";
      return;
    }

    tmdbResults.innerHTML = '<div class="tmdb-loading">Buscando en TMDB...</div>';
    tmdbResults.classList.add("open");

    try {
      var url =
        "https://api.themoviedb.org/3/search/multi?api_key=" +
        encodeURIComponent(TMDB_API_KEY) +
        "&language=es-ES&include_adult=false&query=" +
        encodeURIComponent(query);

      var res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      renderTmdbResults(data.results || []);
    } catch (e) {
      tmdbResults.innerHTML =
        '<div class="tmdb-empty">Error al consultar TMDB.</div>';
      setStatus("No se pudo conectar con TMDB.", true);
    }
  }

  function renderSubResults(subtitles) {
    subResults.innerHTML = "";
    if (!subtitles || !subtitles.length) {
      subResults.innerHTML = '<div class="tmdb-empty">Sin subtítulos en SubDL.</div>';
      subResults.classList.add("open");
      return;
    }

    subtitles.slice(0, 20).forEach(function (sub) {
      var files = Array.isArray(sub.unpack_files) ? sub.unpack_files : [];
      if (files.length) {
        files.slice(0, 5).forEach(function (file) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "tmdb-item";
          var lang = file.language || "";
          var name = file.name || file.release_name || "Subtítulo";
          btn.innerHTML =
            '<div class="tmdb-meta"><strong>' +
            name +
            "</strong><span>" +
            (lang ? lang + " · " : "") +
            (file.format || "srt") +
            (file.hi ? " · HI" : "") +
            "</span></div>";
          btn.addEventListener("click", function () {
            applySelectedSub({
              label: name,
              lang: lang || "ES",
              url: absoluteSubUrl(file.url),
              default: true
            });
          });
          subResults.appendChild(btn);
        });
        return;
      }

      if (!sub.url) return;
      var zipBtn = document.createElement("button");
      zipBtn.type = "button";
      zipBtn.className = "tmdb-item";
      var zipName = sub.name || sub.release_name || "Pack ZIP";
      zipBtn.innerHTML =
        '<div class="tmdb-meta"><strong>' +
        zipName +
        "</strong><span>ZIP · puede fallar en navegador (preferir archivos unpack)</span></div>";
      zipBtn.addEventListener("click", function () {
        applySelectedSub({
          label: zipName,
          lang: "ES",
          url: absoluteSubUrl(sub.url),
          default: true
        });
      });
      subResults.appendChild(zipBtn);
    });

    if (!subResults.children.length) {
      subResults.innerHTML =
        '<div class="tmdb-empty">Sin archivos de subtítulo utilizables.</div>';
    }
    subResults.classList.add("open");
  }

  async function searchSubdl() {
    if (!selectedMeta || !selectedMeta.tmdb_id) {
      setStatus("Primero selecciona un título en TMDB.", true);
      return;
    }

    subResults.innerHTML = '<div class="tmdb-loading">Buscando subtítulos en SubDL...</div>';
    subResults.classList.add("open");

    var params = new URLSearchParams({
      api_key: SUBDL_API_KEY,
      tmdb_id: String(selectedMeta.tmdb_id),
      type: selectedMeta.type || "movie",
      languages: subLang.value || "ES",
      subs_per_page: "20",
      unpack: "1",
      client: "custom_integration"
    });
    if (selectedMeta.year) params.set("year", String(selectedMeta.year));

    try {
      var res = await fetch(SUBDL_API + "?" + params.toString(), {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      if (!data.status) {
        throw new Error(data.error || "Respuesta SubDL inválida");
      }
      renderSubResults(data.subtitles || []);
      setStatus("Resultados SubDL cargados.");
    } catch (e) {
      subResults.innerHTML =
        '<div class="tmdb-empty">Error SubDL (posible CORS o cuota). Usa URL manual .srt/.vtt.</div>';
      setStatus("No se pudo consultar SubDL desde el navegador.", true);
      console.warn(e);
    }
  }

  function buildSubsPayload() {
    var list = [];
    if (selectedSub && selectedSub.url) {
      list.push({
        label: selectedSub.label || "Subtítulos",
        lang: selectedSub.lang || "ES",
        url: selectedSub.url,
        default: true
      });
    }
    var manual = subManual.value.trim();
    if (manual) {
      try {
        new URL(manual);
        list.push({
          label: "Manual",
          lang: (subLang.value || "ES").split(",")[0],
          url: manual,
          default: !list.length
        });
      } catch (e) {
        setStatus("La URL manual de subtítulo no es válida.", true);
        return null;
      }
    }
    return list;
  }

  function buildUrl() {
    var video = videoInput.value.trim();
    if (!video) {
      setStatus("Ingresa la URL del video.", true);
      return null;
    }

    try {
      new URL(video);
    } catch (e) {
      setStatus("La URL del video no es válida.", true);
      return null;
    }

    var subs = buildSubsPayload();
    if (subs === null) return null;

    var base = (baseUrlInput.value.trim() || defaultPlayerBase()).replace(/\?.*$/, "");
    var params = new URLSearchParams();
    params.set("video", encodeBase64Utf8(video));

    var poster = posterInput.value.trim();
    if (poster) params.set("poster", encodeBase64Utf8(poster));

    var title = titleInput.value.trim();
    if (title) params.set("title", encodeBase64Utf8(title));

    params.set("description", INFO_TEXT);
    params.set("secure_uri", "true");

    if (subs.length) {
      params.set("subs", JSON.stringify(subs));
    }

    return base + "?" + params.toString();
  }

  function generate() {
    var url = buildUrl();
    if (!url) {
      output.value = "";
      iframeCode.value = "";
      preview.hidden = true;
      previewEmpty.hidden = false;
      preview.removeAttribute("src");
      return;
    }

    output.value = url;
    iframeCode.value =
      '<iframe src="' +
      url +
      '" width="100%" height="100%" frameborder="0" allowfullscreen allow="fullscreen; picture-in-picture" style="border:0;aspect-ratio:16/9;"></iframe>';

    previewEmpty.hidden = true;
    preview.hidden = false;
    preview.src = url;
    setStatus("URL generada correctamente.");
  }

  async function copyText(text, okMsg) {
    if (!text) {
      setStatus("Primero genera la URL.", true);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus(okMsg);
    } catch (e) {
      setStatus("No se pudo copiar. Selecciona y copia manualmente.", true);
    }
  }

  document.getElementById("btnTmdb").addEventListener("click", function () {
    searchTmdb(tmdbQuery.value);
  });
  document.getElementById("btnSubs").addEventListener("click", searchSubdl);
  document.getElementById("btnClearSub").addEventListener("click", function () {
    clearSelectedSub();
    setStatus("Subtítulo quitado.");
  });

  tmdbQuery.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      searchTmdb(tmdbQuery.value);
    }, 450);
  });

  tmdbQuery.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(searchTimer);
      searchTmdb(tmdbQuery.value);
    }
  });

  titleInput.addEventListener("input", updatePosterPreview);
  posterInput.addEventListener("input", updatePosterPreview);

  document.getElementById("btnGenerate").addEventListener("click", generate);
  document.getElementById("btnCopy").addEventListener("click", function () {
    copyText(output.value, "URL copiada al portapapeles.");
  });
  document.getElementById("btnCopyIframe").addEventListener("click", function () {
    copyText(iframeCode.value, "Código iframe copiado.");
  });
  document.getElementById("btnOpen").addEventListener("click", function () {
    var url = output.value || buildUrl();
    if (!url) return;
    output.value = url;
    window.open(url, "_blank");
  });
  document.getElementById("btnClear").addEventListener("click", function () {
    videoInput.value = "";
    posterInput.value = "";
    titleInput.value = "";
    tmdbQuery.value = "";
    subManual.value = "";
    selectedMeta = null;
    clearSelectedSub();
    tmdbResults.classList.remove("open");
    tmdbResults.innerHTML = "";
    subResults.classList.remove("open");
    subResults.innerHTML = "";
    output.value = "";
    iframeCode.value = "";
    preview.hidden = true;
    previewEmpty.hidden = false;
    preview.removeAttribute("src");
    posterPreview.classList.remove("visible");
    setStatus("");
    videoInput.focus();
  });

  ["video", "poster", "title", "baseUrl", "subManual"].forEach(function (id) {
    document.getElementById(id).addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        generate();
      }
    });
  });
})();
