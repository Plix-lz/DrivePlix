(function () {
  "use strict";

  var INFO_TEXT = "Estas Mirando:";
  var LOGO_SRC = "assets/logo.png";
  var LOGO_LINK = "https://www.facebook.com/share/1JBmFuJ78J/";
  var UI_HIDE_MS = 3000;
  var SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function decodeBase64Utf8(value) {
    if (!value) return "";
    try {
      var binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
      try {
        return decodeURIComponent(
          Array.prototype.map
            .call(binary, function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
      } catch (e) {
        return binary;
      }
    } catch (e) {
      /* Compat: si viene sin Base64, usar el valor tal cual */
      return value;
    }
  }

  function parseJsonParam(name) {
    var raw = getParam(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      try {
        return JSON.parse(decodeURIComponent(raw));
      } catch (e2) {
        return null;
      }
    }
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    sec = Math.floor(sec);
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var mm = h > 0 ? String(m).padStart(2, "0") : String(m);
    var ss = String(s).padStart(2, "0");
    return h > 0 ? h + ":" + mm + ":" + ss : mm + ":" + ss;
  }

  function srtToVtt(srt) {
    var body = String(srt)
      .replace(/\r+/g, "")
      .replace(/^\uFEFF/, "")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    return "WEBVTT\n\n" + body.trim() + "\n";
  }

  var icons = {
    play:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
    rewind:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9l-3 -3l3 -3" /><path d="M15.997 17.918a6.002 6.002 0 0 0 -.997 -11.918h-11" /><path d="M6 14v6" /><path d="M9 15.5v3a1.5 1.5 0 0 0 3 0v-3a1.5 1.5 0 0 0 -3 0" /></svg>',
    forward:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 9l3 -3l-3 -3" /><path d="M8 17.918a5.997 5.997 0 0 1 -5 -5.918a6 6 0 0 1 6 -6h11" /><path d="M12 14v6" /><path d="M15 15.5v3a1.5 1.5 0 0 0 3 0v-3a1.5 1.5 0 0 0 -3 0" /></svg>',
    volume:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    mute:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v4h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>',
    fullscreen:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    exitFs:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
    chevron:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>',
    chevronLeft:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>',
    warn:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
  };

  var root = document.getElementById("player");
  if (!root) return;

  var videoUrl = decodeBase64Utf8(getParam("video"));
  var posterUrl = decodeBase64Utf8(getParam("poster"));
  var videoTitle = decodeBase64Utf8(getParam("title")) || "Sin título";
  var qualities = parseJsonParam("qualities");
  var subsParam = parseJsonParam("subs");

  if (!Array.isArray(qualities) || !qualities.length) {
    qualities = [{ label: "Auto", file: videoUrl }];
  }

  if (!videoUrl && qualities[0] && qualities[0].file) {
    videoUrl = qualities[0].file;
  }

  if (!videoUrl) {
    root.outerHTML =
      '<div class="player-error">' +
      icons.warn +
      "<div>Falta el parámetro <strong>video</strong> en la URL.<br/>Usa el generador (<code>index.html</code>).</div></div>";
    return;
  }

  root.outerHTML =
    '<div class="p1 is-idle show-ui" id="p1" role="region" aria-label="Reproductor de video">' +
    '  <video class="p1__video" id="p1Video" playsinline webkit-playsinline preload="metadata" crossorigin="anonymous"></video>' +
    '  <div class="p1__poster" id="p1Poster"></div>' +
    '  <div class="p1__top">' +
    '    <div class="p1__meta">' +
    '      <div class="p1__info">' +
    INFO_TEXT +
    "</div>" +
    '      <div class="p1__title" id="p1Title"></div>' +
    "    </div>" +
    '    <a class="p1__logo" id="p1Logo" href="' +
    LOGO_LINK +
    '" target="_blank" rel="noopener noreferrer" title="lzplay en Facebook">' +
    '      <img src="' +
    LOGO_SRC +
    '" alt="lzplay" />' +
    "    </a>" +
    "  </div>" +
    '  <div class="p1__spinner" aria-hidden="true"><div class="p1__spinner-ring"></div></div>' +
    '  <div class="p1__seek-toast" id="p1SeekToast" aria-hidden="true"></div>' +
    '  <div class="p1__resume" id="p1Resume" hidden>' +
    '    <div class="p1__resume-card" role="dialog" aria-labelledby="p1ResumeTitle">' +
    '      <h3 id="p1ResumeTitle">¿Continuar viendo?</h3>' +
    '      <p id="p1ResumeText">Te quedaste en <strong>0:00</strong>.</p>' +
    '      <div class="p1__resume-actions">' +
    '        <button type="button" class="p1__resume-btn p1__resume-btn--ghost" id="p1ResumeStart">Desde el inicio</button>' +
    '        <button type="button" class="p1__resume-btn p1__resume-btn--primary" id="p1ResumeContinue">Continuar</button>' +
    "      </div>" +
    "    </div>" +
    "  </div>" +
    '  <div class="p1__center">' +
    '    <button type="button" class="p1__center-btn p1__center-btn--rewind" id="p1CenterRewind" aria-label="Retroceder 10 segundos">' +
    icons.rewind +
    "</button>" +
    '    <button type="button" class="p1__center-btn p1__center-btn--play" id="p1CenterPlay" aria-label="Reproducir">' +
    icons.play +
    "</button>" +
    '    <button type="button" class="p1__center-btn p1__center-btn--forward" id="p1CenterForward" aria-label="Adelantar 10 segundos">' +
    icons.forward +
    "</button>" +
    "  </div>" +
    '  <div class="p1__controls" id="p1Controls">' +
    '    <div class="p1__progress-wrap">' +
    '      <div class="p1__progress-tip" id="p1Tip" aria-hidden="true">0:00</div>' +
    '      <div class="p1__progress" id="p1Progress" role="slider" tabindex="0" aria-label="Progreso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
    '        <div class="p1__progress-rail"></div>' +
    '        <div class="p1__progress-buffer" id="p1Buffer"></div>' +
    '        <div class="p1__progress-played" id="p1Played"></div>' +
    '        <div class="p1__progress-knob" id="p1Knob"></div>' +
    "      </div>" +
    "    </div>" +
    '    <div class="p1__bar">' +
    '      <div class="p1__group">' +
    '        <button type="button" class="p1__btn" id="p1Play" aria-label="Reproducir" title="Reproducir">' +
    icons.play +
    "</button>" +
    '        <button type="button" class="p1__btn" id="p1Rewind" aria-label="Retroceder 10 segundos" title="Retroceder 10s">' +
    icons.rewind +
    "</button>" +
    '        <button type="button" class="p1__btn" id="p1Forward" aria-label="Adelantar 10 segundos" title="Adelantar 10s">' +
    icons.forward +
    "</button>" +
    "      </div>" +
    '      <div class="p1__volume" id="p1Volume">' +
    '        <button type="button" class="p1__btn" id="p1Mute" aria-label="Silenciar" title="Volumen">' +
    icons.volume +
    "</button>" +
    '        <div class="p1__volume-slider"><input class="p1__volume-range" id="p1VolRange" type="range" min="0" max="1" step="0.05" value="1" aria-label="Nivel de volumen" /></div>' +
    "      </div>" +
    '      <div class="p1__time"><span id="p1Current">0:00</span> / <span id="p1Duration">0:00</span></div>' +
    '      <div class="p1__spacer"></div>' +
    '      <div class="p1__menu-anchor">' +
    '        <button type="button" class="p1__btn" id="p1Settings" aria-label="Ajustes" title="Ajustes" aria-haspopup="menu" aria-expanded="false">' +
    icons.settings +
    "</button>" +
    '        <div class="p1__menu p1__menu--settings" id="p1SettingsMenu" role="menu" hidden></div>' +
    "      </div>" +
    '      <button type="button" class="p1__btn" id="p1Fs" aria-label="Pantalla completa" title="Pantalla completa">' +
    icons.fullscreen +
    "</button>" +
    "    </div>" +
    "  </div>" +
    "</div>";

  var shell = document.getElementById("p1");
  var video = document.getElementById("p1Video");
  var posterEl = document.getElementById("p1Poster");
  var titleEl = document.getElementById("p1Title");
  var btnPlay = document.getElementById("p1Play");
  var btnCenterPlay = document.getElementById("p1CenterPlay");
  var btnRewind = document.getElementById("p1Rewind");
  var btnForward = document.getElementById("p1Forward");
  var btnCenterRewind = document.getElementById("p1CenterRewind");
  var btnCenterForward = document.getElementById("p1CenterForward");
  var btnMute = document.getElementById("p1Mute");
  var btnFs = document.getElementById("p1Fs");
  var btnSettings = document.getElementById("p1Settings");
  var settingsMenu = document.getElementById("p1SettingsMenu");
  var volRange = document.getElementById("p1VolRange");
  var volumeBox = document.getElementById("p1Volume");
  var progress = document.getElementById("p1Progress");
  var played = document.getElementById("p1Played");
  var buffer = document.getElementById("p1Buffer");
  var knob = document.getElementById("p1Knob");
  var tip = document.getElementById("p1Tip");
  var currentEl = document.getElementById("p1Current");
  var durationEl = document.getElementById("p1Duration");
  var logo = document.getElementById("p1Logo");
  var seekToast = document.getElementById("p1SeekToast");
  var resumeBox = document.getElementById("p1Resume");
  var resumeText = document.getElementById("p1ResumeText");
  var btnResumeStart = document.getElementById("p1ResumeStart");
  var btnResumeContinue = document.getElementById("p1ResumeContinue");

  titleEl.textContent = videoTitle;
  document.title = "LzPlay";

  function extractYearFromTitle(title) {
    var m = String(title || "").match(/\((\d{4})\)\s*$/);
    return m ? m[1] : "";
  }

  function trackContentView() {
    if (typeof gtag !== "function") return;
    var year = extractYearFromTitle(videoTitle);
    var titleOnly = String(videoTitle || "")
      .replace(/\s*\(\d{4}\)\s*$/, "")
      .trim();

    gtag("event", "content_view", {
      content_title: titleOnly || videoTitle,
      content_year: year || "desconocido",
      content_full_title: videoTitle,
      page_title: "LzPlay",
      event_category: "contenido",
      event_label: videoTitle
    });

    gtag("event", "page_view", {
      page_title: videoTitle,
      content_title: titleOnly || videoTitle,
      content_year: year || "desconocido"
    });
  }

  trackContentView();

  function setShareMeta() {
    function setAttr(id, attr, value) {
      var el = document.getElementById(id);
      if (!el || !value) return;
      el.setAttribute(attr, value);
    }
    var pageUrl = window.location.href.split("#")[0];
    var desc = "Estas Mirando: " + videoTitle;
    var image = posterUrl || "";
    setAttr("metaOgTitle", "content", videoTitle);
    setAttr("metaOgDesc", "content", desc);
    setAttr("metaOgUrl", "content", pageUrl);
    setAttr("metaOgImageAlt", "content", videoTitle);
    setAttr("metaTwTitle", "content", videoTitle);
    setAttr("metaTwDesc", "content", desc);
    setAttr("metaCanonical", "href", pageUrl);
    if (image) {
      setAttr("metaOgImage", "content", image);
      setAttr("metaTwImage", "content", image);
      setAttr("metaImageSrc", "href", image);
    }
  }
  setShareMeta();

  if (posterUrl) {
    posterEl.style.backgroundImage = 'url("' + posterUrl.replace(/"/g, '\\"') + '")';
    video.setAttribute("poster", posterUrl);
  }

  var currentQualityIdx = 0;
  video.src = qualities[0].file || videoUrl;

  var hideTimer = null;
  var toastTimer = null;
  var saveTimer = null;
  var dragging = false;
  var lastVolume = 1;
  var menuOpen = false;
  var settingsView = "root";
  var externalSubs = [];
  var resumeHandled = false;
  var pendingResumeTime = 0;

  function hashKey(str) {
    var h = 0;
    var s = String(str || "");
    for (var i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }

  var PROGRESS_KEY = "lzplay_progress_" + hashKey(videoUrl);

  if (window.matchMedia("(pointer: coarse)").matches) {
    shell.classList.add("is-touch");
  }

  function readSavedProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.time !== "number") return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveProgress(force) {
    var t = video.currentTime || 0;
    var d = video.duration || 0;
    if (!isFinite(t) || t < 5) return;
    if (d > 0 && t > d - 8) {
      clearProgress();
      return;
    }
    var doSave = function () {
      try {
        localStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify({
            time: t,
            duration: d,
            title: videoTitle,
            updated: Date.now()
          })
        );
      } catch (e) {}
    };
    if (force) {
      doSave();
      return;
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 800);
  }

  function clearProgress() {
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch (e) {}
  }

  function hideResume() {
    resumeBox.hidden = true;
    shell.classList.remove("resume-open");
  }

  function showResumeDialog(savedTime) {
    pendingResumeTime = savedTime;
    resumeText.innerHTML =
      "Te quedaste en <strong>" + formatTime(savedTime) + "</strong>.";
    resumeBox.hidden = false;
    shell.classList.add("resume-open");
    shell.classList.add("show-ui");
  }

  function offerResumeIfNeeded() {
    if (resumeHandled) return;
    resumeHandled = true;
    var saved = readSavedProgress();
    if (!saved || saved.time < 10) return;
    var d = video.duration || saved.duration || 0;
    if (d > 0 && saved.time >= d - 10) {
      clearProgress();
      return;
    }
    showResumeDialog(saved.time);
  }

  function hasMultipleQualities() {
    return qualities.length > 1;
  }

  function getAudioTracks() {
    var tracks = video.audioTracks;
    if (!tracks || !tracks.length) return [];
    var list = [];
    for (var i = 0; i < tracks.length; i++) list.push(tracks[i]);
    return list;
  }

  function hasAudioOptions() {
    return getAudioTracks().length > 1;
  }

  function getTextTracks() {
    var list = [];
    if (!video.textTracks) return list;
    for (var i = 0; i < video.textTracks.length; i++) {
      var tr = video.textTracks[i];
      if (tr.kind === "subtitles" || tr.kind === "captions") list.push(tr);
    }
    return list;
  }

  function hasSubtitleOptions() {
    return getTextTracks().length > 0 || externalSubs.length > 0;
  }

  function syncMenuState() {
    menuOpen = settingsMenu.classList.contains("is-open");
    shell.classList.toggle("menu-open", menuOpen);
    btnSettings.setAttribute("aria-expanded", String(menuOpen));
    settingsMenu.hidden = !menuOpen;
  }

  function closeMenus() {
    settingsMenu.classList.remove("is-open");
    settingsView = "root";
    syncMenuState();
  }

  function showUi(forceKeep) {
    shell.classList.add("show-ui");
    clearTimeout(hideTimer);
    if (forceKeep || video.paused || menuOpen || dragging || !resumeBox.hidden) return;
    hideTimer = setTimeout(function () {
      if (!video.paused && !menuOpen && !dragging && resumeBox.hidden) {
        shell.classList.remove("show-ui");
        closeMenus();
      }
    }, UI_HIDE_MS);
  }

  function setPlayingUi(playing) {
    shell.classList.toggle("is-playing", playing);
    shell.classList.toggle("is-paused", !playing && !shell.classList.contains("is-idle"));
    if (playing) shell.classList.remove("is-idle");
    var icon = playing ? icons.pause : icons.play;
    var label = playing ? "Pausar" : "Reproducir";
    btnPlay.innerHTML = icon;
    btnPlay.setAttribute("aria-label", label);
    btnPlay.title = label;
    btnCenterPlay.innerHTML = icon;
    btnCenterPlay.setAttribute("aria-label", label);
  }

  function flashBtn(el) {
    if (!el) return;
    el.classList.remove("is-flash");
    void el.offsetWidth;
    el.classList.add("is-flash");
  }

  function showSeekToast(text, side) {
    seekToast.textContent = text;
    seekToast.classList.remove("is-left", "is-right");
    if (side === "left") seekToast.classList.add("is-left");
    if (side === "right") seekToast.classList.add("is-right");
    seekToast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      seekToast.classList.remove("is-visible", "is-left", "is-right");
    }, 700);
  }

  function togglePlay() {
    if (video.paused) {
      var p = video.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } else {
      video.pause();
    }
  }

  function seekBy(delta, side) {
    if (!isFinite(video.duration)) return;
    video.currentTime = Math.min(
      Math.max(0, video.currentTime + delta),
      video.duration
    );
    var sideHint = side || (delta < 0 ? "left" : "right");
    showSeekToast((delta > 0 ? "+" : "") + delta + " s", sideHint);
    flashBtn(delta < 0 ? btnCenterRewind : btnCenterForward);
    showUi();
    updateProgress();
    saveProgress(true);
  }

  var DOUBLE_TAP_MS = 320;
  var lastTapAt = 0;
  var lastTapSide = "";
  var singleTapTimer = null;

  function tapSideFromEvent(e) {
    var rect = shell.getBoundingClientRect();
    var x = e.clientX;
    if (e.changedTouches && e.changedTouches[0]) {
      x = e.changedTouches[0].clientX;
    }
    return x - rect.left < rect.width / 2 ? "left" : "right";
  }

  function isUiChromeTarget(el) {
    return !!(
      el.closest(".p1__controls") ||
      el.closest(".p1__center-btn") ||
      el.closest(".p1__top") ||
      el.closest(".p1__menu") ||
      el.closest(".p1__resume")
    );
  }

  function handleSurfaceTap(e) {
    if (isUiChromeTarget(e.target)) return;
    if (menuOpen) {
      closeMenus();
      showUi(true);
      return;
    }

    var side = tapSideFromEvent(e);
    var now = Date.now();
    if (lastTapSide === side && now - lastTapAt <= DOUBLE_TAP_MS) {
      clearTimeout(singleTapTimer);
      lastTapAt = 0;
      lastTapSide = "";
      seekBy(side === "left" ? -10 : 10, side);
      return;
    }

    lastTapAt = now;
    lastTapSide = side;
    clearTimeout(singleTapTimer);
    singleTapTimer = setTimeout(function () {
      lastTapAt = 0;
      lastTapSide = "";
      showUi(true);
    }, DOUBLE_TAP_MS);
  }

  function updateProgress() {
    var d = video.duration || 0;
    var t = video.currentTime || 0;
    var pct = d ? (t / d) * 100 : 0;
    played.style.width = pct + "%";
    knob.style.left = pct + "%";
    progress.setAttribute("aria-valuenow", String(Math.round(pct)));
    currentEl.textContent = formatTime(t);
    durationEl.textContent = formatTime(d);
    if (video.buffered && video.buffered.length) {
      try {
        var end = video.buffered.end(video.buffered.length - 1);
        buffer.style.width = d ? (end / d) * 100 + "%" : "0%";
      } catch (e) {}
    }
  }

  function ratioFromClientX(clientX) {
    var rect = progress.getBoundingClientRect();
    if (!rect.width) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  function seekFromClientX(clientX) {
    if (!isFinite(video.duration)) return;
    video.currentTime = ratioFromClientX(clientX) * video.duration;
    updateProgress();
  }

  function updateTip(clientX) {
    if (!isFinite(video.duration) || !video.duration) {
      tip.classList.remove("is-visible");
      return;
    }
    var ratio = ratioFromClientX(clientX);
    var wrap = progress.parentElement.getBoundingClientRect();
    tip.textContent = formatTime(ratio * video.duration);
    tip.style.left = clientX - wrap.left + "px";
    tip.classList.add("is-visible");
  }

  function updateMuteIcon() {
    var muted = video.muted || video.volume === 0;
    btnMute.innerHTML = muted ? icons.mute : icons.volume;
    btnMute.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar");
  }

  function updateVolumeFill() {
    var v = video.muted ? 0 : video.volume;
    volRange.value = String(v);
    volRange.style.backgroundSize = v * 100 + "% 100%";
  }

  function isPortrait() {
    return (
      window.matchMedia("(orientation: portrait)").matches ||
      window.innerHeight > window.innerWidth
    );
  }

  function isMobileLike() {
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod|Mobile|FBAN|FBAV|Instagram|Line\//i.test(
        navigator.userAgent || ""
      )
    );
  }

  function isFsActive() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      shell.classList.contains("p1--fake-fs")
    );
  }

  function applyForceLandscape() {
    if (!isMobileLike()) return;
    shell.classList.add("p1--force-landscape");
    document.documentElement.classList.add("p1-html-fs");
    document.body.classList.add("p1-body-fs");
  }

  function clearForceLandscape() {
    shell.classList.remove("p1--force-landscape", "p1--fake-fs");
    document.documentElement.classList.remove("p1-html-fs");
    document.body.classList.remove("p1-body-fs");
  }

  function lockLandscape() {
    try {
      if (screen.orientation && typeof screen.orientation.lock === "function") {
        var p = screen.orientation.lock("landscape");
        if (p && typeof p.then === "function") {
          return p.catch(function () {
            return false;
          });
        }
        return Promise.resolve(true);
      }
    } catch (e) {}
    return Promise.resolve(false);
  }

  function unlockOrientation() {
    try {
      if (screen.orientation && typeof screen.orientation.unlock === "function") {
        screen.orientation.unlock();
      }
    } catch (e) {}
  }

  function enforceLandscapeView() {
    return lockLandscape().then(function () {
      /* Facebook / iOS suelen ignorar el lock: forzar landscape por CSS */
      if (isPortrait() || isMobileLike()) {
        applyForceLandscape();
      }
      updateFsIcon();
    });
  }

  function updateFsIcon() {
    var fs = isFsActive();
    btnFs.innerHTML = fs ? icons.exitFs : icons.fullscreen;
    btnFs.setAttribute("aria-label", fs ? "Salir de pantalla completa" : "Pantalla completa");
  }

  function enterFakeLandscapeFs() {
    shell.classList.add("p1--fake-fs");
    applyForceLandscape();
    lockLandscape();
    updateFsIcon();
    showUi(true);
  }

  function requestFs() {
    var el = shell;
    var req = el.requestFullscreen || el.webkitRequestFullscreen;

    function afterEnter() {
      enforceLandscapeView();
    }

    if (req) {
      try {
        var r = req.call(el);
        if (r && typeof r.then === "function") {
          r.then(afterEnter).catch(function () {
            enterFakeLandscapeFs();
          });
        } else {
          afterEnter();
        }
        return;
      } catch (e) {}
    }

    if (video.webkitEnterFullscreen) {
      try {
        video.webkitEnterFullscreen();
        afterEnter();
        return;
      } catch (e2) {}
    }

    /* Facebook in-app browser: a menudo no hay Fullscreen API */
    enterFakeLandscapeFs();
  }

  function exitFs() {
    unlockOrientation();
    clearForceLandscape();

    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (exit) {
        try {
          var r = exit.call(document);
          if (r && r.catch) r.catch(function () {});
        } catch (e) {}
      }
    }
    updateFsIcon();
    showUi(true);
  }

  function switchQuality(idx) {
    if (idx === currentQualityIdx || !qualities[idx]) return;
    var t = video.currentTime;
    var wasPaused = video.paused;
    var rate = video.playbackRate;
    currentQualityIdx = idx;
    video.src = qualities[idx].file;
    video.addEventListener(
      "loadedmetadata",
      function onMeta() {
        video.removeEventListener("loadedmetadata", onMeta);
        video.currentTime = t;
        video.playbackRate = rate;
        if (!wasPaused) {
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        }
      }
    );
    video.load();
    renderSettings();
  }

  function menuRow(label, value, view) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "p1__menu-item p1__menu-row";
    btn.innerHTML =
      '<span class="p1__menu-row-label">' +
      label +
      '</span><span class="p1__menu-row-value">' +
      (value || "") +
      "</span>" +
      icons.chevron;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      settingsView = view;
      renderSettings();
      showUi(true);
    });
    return btn;
  }

  function menuBack(title) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "p1__menu-item p1__menu-back";
    btn.innerHTML = icons.chevronLeft + "<span>" + title + "</span>";
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      settingsView = "root";
      renderSettings();
      showUi(true);
    });
    return btn;
  }

  function menuChoice(text, active, onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "p1__menu-item" + (active ? " is-active" : "");
    btn.setAttribute("role", "menuitemradio");
    btn.textContent = text;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function renderSettings() {
    settingsMenu.innerHTML = "";

    if (settingsView === "root") {
      var title = document.createElement("div");
      title.className = "p1__menu-title";
      title.textContent = "Ajustes";
      settingsMenu.appendChild(title);

      if (hasMultipleQualities()) {
        settingsMenu.appendChild(
          menuRow("Calidad", qualities[currentQualityIdx].label || "Auto", "quality")
        );
      }
      settingsMenu.appendChild(
        menuRow(
          "Velocidad",
          video.playbackRate === 1 ? "Normal" : video.playbackRate + "x",
          "speed"
        )
      );
      if (hasSubtitleOptions()) {
        var tracks = getTextTracks();
        var active = tracks.find(function (t) {
          return t.mode === "showing";
        });
        settingsMenu.appendChild(
          menuRow("Subtítulos", active ? active.label || active.language || "On" : "Off", "subs")
        );
      }
      if (hasAudioOptions()) {
        var audios = getAudioTracks();
        var aActive = audios.find(function (a) {
          return a.enabled;
        });
        settingsMenu.appendChild(
          menuRow("Audio", (aActive && (aActive.label || aActive.language)) || "Principal", "audio")
        );
      }
      return;
    }

    if (settingsView === "quality") {
      settingsMenu.appendChild(menuBack("Calidad"));
      qualities.forEach(function (q, idx) {
        settingsMenu.appendChild(
          menuChoice(q.label || "Fuente " + (idx + 1), idx === currentQualityIdx, function () {
            switchQuality(idx);
            settingsView = "root";
            renderSettings();
            showUi(true);
          })
        );
      });
      return;
    }

    if (settingsView === "speed") {
      settingsMenu.appendChild(menuBack("Velocidad"));
      SPEED_OPTIONS.forEach(function (rate) {
        settingsMenu.appendChild(
          menuChoice(rate === 1 ? "Normal" : rate + "x", video.playbackRate === rate, function () {
            video.playbackRate = rate;
            settingsView = "root";
            renderSettings();
            showUi(true);
          })
        );
      });
      return;
    }

    if (settingsView === "subs") {
      settingsMenu.appendChild(menuBack("Subtítulos"));
      var tracks = getTextTracks();
      var anyOn = tracks.some(function (t) {
        return t.mode === "showing";
      });
      settingsMenu.appendChild(
        menuChoice("Desactivados", !anyOn, function () {
          tracks.forEach(function (t) {
            t.mode = "disabled";
          });
          settingsView = "root";
          renderSettings();
          showUi(true);
        })
      );
      tracks.forEach(function (track, idx) {
        settingsMenu.appendChild(
          menuChoice(
            track.label || track.language || "Pista " + (idx + 1),
            track.mode === "showing",
            function () {
              tracks.forEach(function (t) {
                t.mode = "disabled";
              });
              track.mode = "showing";
              settingsView = "root";
              renderSettings();
              showUi(true);
            }
          )
        );
      });
      return;
    }

    if (settingsView === "audio") {
      settingsMenu.appendChild(menuBack("Audio"));
      getAudioTracks().forEach(function (track, idx) {
        settingsMenu.appendChild(
          menuChoice(track.label || track.language || "Audio " + (idx + 1), !!track.enabled, function () {
            getAudioTracks().forEach(function (t) {
              t.enabled = false;
            });
            track.enabled = true;
            settingsView = "root";
            renderSettings();
            showUi(true);
          })
        );
      });
    }
  }

  function openSettings() {
    settingsView = "root";
    renderSettings();
    settingsMenu.classList.add("is-open");
    syncMenuState();
    showUi(true);
  }

  async function addSubtitleTrack(item) {
    if (!item || !item.url) return;
    try {
      var res = await fetch(item.url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      var text = await res.text();
      var lower = item.url.toLowerCase();
      var vtt = lower.indexOf(".vtt") !== -1 || text.trim().indexOf("WEBVTT") === 0
        ? text
        : srtToVtt(text);
      var blob = new Blob([vtt], { type: "text/vtt" });
      var blobUrl = URL.createObjectURL(blob);
      var track = document.createElement("track");
      track.kind = "subtitles";
      track.label = item.label || item.lang || "Subtítulos";
      track.srclang = (item.lang || "es").toLowerCase().slice(0, 2);
      track.src = blobUrl;
      track.default = !!item.default;
      video.appendChild(track);
      externalSubs.push(item);
      if (item.default && video.textTracks) {
        setTimeout(function () {
          var tracks = getTextTracks();
          tracks.forEach(function (t, i) {
            t.mode = i === tracks.length - 1 ? "showing" : "disabled";
          });
        }, 100);
      }
    } catch (e) {
      console.warn("No se pudo cargar subtítulo:", item.url, e);
    }
  }

  async function loadExternalSubs() {
    if (!Array.isArray(subsParam) || !subsParam.length) return;
    for (var i = 0; i < subsParam.length; i++) {
      await addSubtitleTrack(subsParam[i]);
    }
    renderSettings();
  }

  /* Events */
  btnPlay.addEventListener("click", function (e) {
    e.stopPropagation();
    togglePlay();
  });
  btnCenterPlay.addEventListener("click", function (e) {
    e.stopPropagation();
    togglePlay();
  });
  btnRewind.addEventListener("click", function (e) {
    e.stopPropagation();
    seekBy(-10);
  });
  btnForward.addEventListener("click", function (e) {
    e.stopPropagation();
    seekBy(10);
  });
  btnCenterRewind.addEventListener("click", function (e) {
    e.stopPropagation();
    seekBy(-10);
  });
  btnCenterForward.addEventListener("click", function (e) {
    e.stopPropagation();
    seekBy(10);
  });

  btnMute.addEventListener("click", function (e) {
    e.stopPropagation();
    if (video.muted || video.volume === 0) {
      video.muted = false;
      video.volume = lastVolume || 1;
    } else {
      lastVolume = video.volume || 1;
      video.muted = true;
    }
    updateMuteIcon();
    updateVolumeFill();
    showUi();
  });

  volRange.addEventListener("input", function () {
    video.volume = Number(volRange.value);
    video.muted = video.volume === 0;
    if (video.volume > 0) lastVolume = video.volume;
    updateMuteIcon();
    updateVolumeFill();
    showUi(true);
  });
  volRange.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  if (shell.classList.contains("is-touch")) {
    btnMute.addEventListener("click", function () {
      volumeBox.classList.toggle("is-open");
    });
  }

  btnFs.addEventListener("click", function (e) {
    e.stopPropagation();
    if (isFsActive()) exitFs();
    else requestFs();
  });

  btnSettings.addEventListener("click", function (e) {
    e.stopPropagation();
    if (settingsMenu.classList.contains("is-open")) closeMenus();
    else openSettings();
  });

  document.addEventListener("fullscreenchange", function () {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      enforceLandscapeView();
    } else {
      unlockOrientation();
      clearForceLandscape();
    }
    updateFsIcon();
  });
  document.addEventListener("webkitfullscreenchange", function () {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      enforceLandscapeView();
    } else {
      unlockOrientation();
      clearForceLandscape();
    }
    updateFsIcon();
  });

  window.addEventListener("orientationchange", function () {
    if (!isFsActive()) return;
    setTimeout(function () {
      if (isPortrait()) applyForceLandscape();
      else if (!shell.classList.contains("p1--fake-fs")) {
        shell.classList.remove("p1--force-landscape");
      }
      updateFsIcon();
    }, 250);
  });

  progress.addEventListener("mousedown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    progress.classList.add("is-dragging");
    seekFromClientX(e.clientX);
    showUi(true);
  });
  progress.addEventListener("mousemove", function (e) {
    if (!shell.classList.contains("is-touch")) updateTip(e.clientX);
  });
  progress.addEventListener("mouseleave", function () {
    if (!dragging) tip.classList.remove("is-visible");
  });
  window.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    seekFromClientX(e.clientX);
    updateTip(e.clientX);
  });
  window.addEventListener("mouseup", function () {
    if (!dragging) return;
    dragging = false;
    progress.classList.remove("is-dragging");
    tip.classList.remove("is-visible");
    showUi();
  });
  progress.addEventListener(
    "touchstart",
    function (e) {
      if (!e.touches[0]) return;
      e.stopPropagation();
      dragging = true;
      progress.classList.add("is-dragging");
      seekFromClientX(e.touches[0].clientX);
      showUi(true);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    function (e) {
      if (dragging && e.touches[0]) seekFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  window.addEventListener("touchend", function () {
    if (!dragging) return;
    dragging = false;
    progress.classList.remove("is-dragging");
    showUi();
  });
  progress.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      seekBy(-10);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      seekBy(10);
    }
  });

  var playTracked = false;
  video.addEventListener("play", function () {
    setPlayingUi(true);
    showUi();
    if (!playTracked && typeof gtag === "function") {
      playTracked = true;
      var year = extractYearFromTitle(videoTitle);
      gtag("event", "video_play", {
        content_title: String(videoTitle || "").replace(/\s*\(\d{4}\)\s*$/, "").trim() || videoTitle,
        content_year: year || "desconocido",
        content_full_title: videoTitle
      });
    }
  });
  video.addEventListener("pause", function () {
    setPlayingUi(false);
    shell.classList.add("show-ui");
    clearTimeout(hideTimer);
    saveProgress(true);
  });
  video.addEventListener("timeupdate", function () {
    updateProgress();
    saveProgress(false);
  });
  video.addEventListener("progress", updateProgress);
  video.addEventListener("loadedmetadata", function () {
    updateProgress();
    renderSettings();
    offerResumeIfNeeded();
  });
  video.addEventListener("durationchange", updateProgress);
  video.addEventListener("waiting", function () {
    shell.classList.add("is-buffering");
  });
  video.addEventListener("playing", function () {
    shell.classList.remove("is-buffering");
  });
  video.addEventListener("canplay", function () {
    shell.classList.remove("is-buffering");
  });
  video.addEventListener("ended", function () {
    shell.classList.add("is-idle");
    setPlayingUi(false);
    shell.classList.add("show-ui");
    clearTimeout(hideTimer);
    clearProgress();
  });
  video.addEventListener("error", function () {
    shell.classList.add("show-ui");
  });

  window.addEventListener("beforeunload", function () {
    saveProgress(true);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) saveProgress(true);
  });

  btnResumeContinue.addEventListener("click", function (e) {
    e.stopPropagation();
    hideResume();
    if (isFinite(pendingResumeTime) && pendingResumeTime > 0) {
      video.currentTime = pendingResumeTime;
      updateProgress();
    }
    showUi(true);
  });

  btnResumeStart.addEventListener("click", function (e) {
    e.stopPropagation();
    hideResume();
    clearProgress();
    video.currentTime = 0;
    updateProgress();
    showUi(true);
  });

  shell.addEventListener("mousemove", function () {
    showUi();
  });
  shell.addEventListener("touchstart", function () {
    showUi();
  }, { passive: true });

  /* 1 toque = controles; 2 toques izq/der = ±10s */
  shell.addEventListener("click", handleSurfaceTap);

  document.addEventListener("click", function (e) {
    if (!shell.contains(e.target)) return;
    if (!e.target.closest(".p1__menu-anchor") && menuOpen) {
      closeMenus();
      showUi();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    switch (e.key) {
      case " ":
      case "k":
      case "K":
      case "Enter":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
      case "j":
      case "J":
        e.preventDefault();
        seekBy(-10);
        break;
      case "ArrowRight":
      case "l":
      case "L":
        e.preventDefault();
        seekBy(10);
        break;
      case "ArrowUp":
        e.preventDefault();
        video.muted = false;
        video.volume = Math.min(1, (video.volume || 0) + 0.05);
        lastVolume = video.volume;
        updateMuteIcon();
        updateVolumeFill();
        showUi();
        break;
      case "ArrowDown":
        e.preventDefault();
        video.volume = Math.max(0, (video.volume || 0) - 0.05);
        if (video.volume === 0) video.muted = true;
        updateMuteIcon();
        updateVolumeFill();
        showUi();
        break;
      case "m":
      case "M":
        btnMute.click();
        break;
      case "f":
      case "F":
        btnFs.click();
        break;
      case "Escape":
        if (menuOpen) {
          if (settingsView !== "root") {
            settingsView = "root";
            renderSettings();
          } else closeMenus();
          showUi(true);
        } else if (isFsActive()) {
          exitFs();
        }
        break;
      default:
        break;
    }
  });

  logo.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  var logoImg = logo.querySelector("img");
  if (logoImg) {
    logoImg.addEventListener("error", function () {
      logo.style.display = "none";
    });
  }

  renderSettings();
  setPlayingUi(false);
  updateMuteIcon();
  updateVolumeFill();
  updateFsIcon();
  showUi(true);
  loadExternalSubs();
})();
