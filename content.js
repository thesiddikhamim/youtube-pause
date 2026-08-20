const MIN_WORDS = 15;

const DEFAULT_SETTINGS = {
  enabled: true,
  mode: "timer",
  message:
    "Please Hamim Don't Lie to Yourself. Is it really important to watch or you are just procrastinating. You can get more values if you read books or any courses",
  delaySeconds: 10,
};

const VERSION = "1.2.0";

let settings = { ...DEFAULT_SETTINGS };
let overlayActive = false;
let processedVideoId = null;
let lastNavUrl = null;

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    settings = { ...DEFAULT_SETTINGS, ...stored };
  });
}

function injectOverlayFonts() {
  const url = (file) => chrome.runtime.getURL(`fonts/${file}`);
  const faces = [
    `@font-face{font-family:"Fraunces";font-style:normal;font-weight:100 900;src:url("${url("fraunces-variable.woff2")}") format("woff2")}`,
    `@font-face{font-family:"Fraunces";font-style:italic;font-weight:100 900;src:url("${url("fraunces-variable-italic.woff2")}") format("woff2")}`,
    `@font-face{font-family:"Instrument Sans";font-style:normal;font-weight:400 700;src:url("${url("instrument-variable.woff2")}") format("woff2")}`,
    `@font-face{font-family:"Instrument Sans";font-style:italic;font-weight:400 700;src:url("${url("instrument-variable-italic.woff2")}") format("woff2")}`,
    `@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;src:url("${url("plexmono-400.woff2")}") format("woff2")}`,
    `@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:500;src:url("${url("plexmono-500.woff2")}") format("woff2")}`,
    `@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:600;src:url("${url("plexmono-600.woff2")}") format("woff2")}`,
  ].join("");
  const style = document.createElement("style");
  style.textContent = faces;
  document.documentElement.appendChild(style);
}

injectOverlayFonts();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (changes[key]) settings[key] = changes[key].newValue;
  }
});

function getVideoId() {
  try {
    const url = new URL(window.location.href);
    if (url.hostname !== "www.youtube.com" || url.pathname !== "/watch") {
      return null;
    }
    return url.searchParams.get("v");
  } catch {
    return null;
  }
}

function getVideoMeta() {
  const titleEl = document.querySelector(
    "ytd-watch-metadata h1 yt-formatted-string, ytd-watch-metadata h1"
  );
  const channelEl = document.querySelector(
    "ytd-watch-metadata #channel-name a, #upload-info #channel-name a"
  );
  const title =
    titleEl?.textContent?.trim() ||
    document.title.replace(/ - YouTube$/, "").trim() ||
    "Untitled video";
  const channel = channelEl?.textContent?.trim() || "";
  return { title, channel };
}

function freezeVideo(video) {
  video.autoplay = false;
  video.removeAttribute("autoplay");
  video.setAttribute("autoplay", "false");

  if (!video.dataset.ytmpFrozen) {
    video.dataset.ytmpFrozen = "1";
    const keepPaused = () => {
      if (!overlayActive) {
        video.removeEventListener("play", keepPaused);
        return;
      }
      video.pause();
    };
    video.addEventListener("play", keepPaused);
  }

  if (overlayActive && !video.paused) {
    video.pause();
  }
}

function freezeAllVideos() {
  document.querySelectorAll("video").forEach(freezeVideo);
}

function saveHistory(entry, videoId, meta) {
  const vid = videoId || getVideoId() || `unknown-${Date.now()}`;
  const { title, channel } = meta || getVideoMeta();
  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    videoId: vid,
    title,
    channel,
    thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
    timestamp: Date.now(),
    ...entry,
  };
  chrome.storage.local.get({ history: [] }, (data) => {
    const history = data.history || [];
    history.push(record);
    chrome.storage.local.set({ history }, () => {
      console.log("[MindfulPause] Saved history entry:", record);
    });
  });
}

function buildOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "ytmp-overlay";
  overlay.classList.add(settings.mode === "journal" ? "ytmp-journal-mode" : "ytmp-timer-mode");

  const modeBadge = `<div class="ytmp-mode-badge">${
    settings.mode === "journal" ? "JOURNAL MODE" : "TIMER MODE"
  }</div>`;
  const closeBtn = `<button class="ytmp-close" title="Skip the wait (Esc)" aria-label="Skip the wait">✕</button>`;

  if (settings.mode === "journal") {
    overlay.innerHTML = `
      ${modeBadge}
      <p class="ytmp-message"></p>
      <div class="ytmp-journal-wrap">
        <textarea class="ytmp-journal" rows="5"
          placeholder="In at least ${MIN_WORDS} words, explain why this video truly helps you right now, how you'll use it, or be honest that you're just procrastinating..."></textarea>
        <div class="ytmp-words"><span class="ytmp-wordcount">0</span>/${MIN_WORDS} words</div>
      </div>
      <label class="ytmp-flag">
        <input type="checkbox" class="ytmp-flag-check" />
        <span>This is unimportant / I'm just wasting time</span>
      </label>
      <div class="ytmp-saved">Saved to history ✓</div>
      <div class="ytmp-actions">
        <button class="ytmp-continue" disabled>Continue</button>
        <button class="ytmp-cancel">Actually, I don't need to watch this right now</button>
      </div>
    `;
  } else {
    overlay.innerHTML = `
      ${modeBadge}
      ${closeBtn}
      <div class="ytmp-circle" aria-hidden="true">
        <div class="ytmp-core"></div>
        <div class="ytmp-ring"></div>
        <div class="ytmp-ring"></div>
        <div class="ytmp-ring"></div>
        <span class="ytmp-count">${settings.delaySeconds}</span>
      </div>
      <p class="ytmp-message"></p>
      <label class="ytmp-flag">
        <input type="checkbox" class="ytmp-flag-check" />
        <span>This is unimportant / I'm just wasting time</span>
      </label>
      <div class="ytmp-saved">Saved to history ✓</div>
      <button class="ytmp-cancel">Actually, I don't need to watch this right now</button>
    `;
  }

  overlay.querySelector(".ytmp-message").textContent = settings.message;
  return overlay;
}

function getMetaWithRetry(cb, attempts = 30) {
  const meta = getVideoMeta();
  if (meta.title !== "Untitled video" && meta.channel) {
    cb(meta);
    return;
  }
  if (attempts <= 0) {
    cb(meta);
    return;
  }
  setTimeout(() => getMetaWithRetry(cb, attempts - 1), 100);
}

function startPause() {
  if (!settings.enabled || overlayActive) return;

  const videoId = getVideoId();
  if (!videoId || videoId === processedVideoId) return;
  processedVideoId = videoId;

  overlayActive = true;

  const overlay = buildOverlay();

  const observer = new MutationObserver(() => freezeAllVideos());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const flagCheck = overlay.querySelector(".ytmp-flag-check");
  const savedEl = overlay.querySelector(".ytmp-saved");

  const dismiss = (shouldSave) => {
    clearInterval(timer);
    observer.disconnect();
    overlay.classList.add("ytmp-done");
    if (shouldSave) {
      const reason = overlay.querySelector(".ytmp-journal")?.value?.trim() || null;
      const flagged = flagCheck?.checked || false;
      getMetaWithRetry((meta) =>
        saveHistory({ mode: settings.mode, reason, flagged }, videoId, meta)
      );
      if (savedEl) {
        savedEl.classList.add("show");
        setTimeout(() => savedEl.classList.remove("show"), 1600);
      }
    }
    setTimeout(() => {
      overlay.remove();
      overlayActive = false;
      document.removeEventListener("keydown", onKey);
    }, 350);
  };

  const onKey = (e) => {
    if (e.key === "Escape" && settings.mode !== "journal") {
      e.preventDefault();
      dismiss(true);
    }
  };

  let timer = null;

  if (settings.mode === "journal") {
    const textarea = overlay.querySelector(".ytmp-journal");
    const wordEl = overlay.querySelector(".ytmp-wordcount");
    const continueBtn = overlay.querySelector(".ytmp-continue");

    const updateCounter = () => {
      const count = (textarea.value.trim().match(/\S+/g) || []).length;
      wordEl.textContent = count;
      wordEl.parentElement.classList.toggle("ytmp-met", count >= MIN_WORDS);
      textarea.classList.toggle("ytmp-met", count >= MIN_WORDS);
      continueBtn.disabled = count < MIN_WORDS;
    };
    textarea.addEventListener("input", updateCounter);

    continueBtn.addEventListener("click", () => dismiss(true));
  } else {
    let remaining = settings.delaySeconds;
    const countEl = overlay.querySelector(".ytmp-count");

    timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        dismiss(true);
        return;
      }
      countEl.textContent = remaining;
    }, 1000);
  }

  overlay.querySelector(".ytmp-close")?.addEventListener("click", () => dismiss(true));
  overlay.querySelector(".ytmp-cancel").addEventListener("click", () => {
    dismiss(false);
    window.location.href = "https://www.youtube.com/";
  });
  document.addEventListener("keydown", onKey, true);

  document.documentElement.appendChild(overlay);

  freezeAllVideos();
}

function onNavigate() {
  const url = window.location.href;
  if (url === lastNavUrl) return;
  lastNavUrl = url;
  setTimeout(startPause, 100);
}

const origPush = history.pushState;
history.pushState = function (...args) {
  const result = origPush.apply(this, args);
  onNavigate();
  return result;
};

const origReplace = history.replaceState;
history.replaceState = function (...args) {
  const result = origReplace.apply(this, args);
  onNavigate();
  return result;
};

window.addEventListener("popstate", onNavigate);
window.addEventListener("yt-navigate-finish", onNavigate);
window.addEventListener("load", onNavigate);

loadSettings();
onNavigate();
console.log(`[MindfulPause] v${VERSION} loaded, mode: ${settings.mode}`);