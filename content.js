const MIN_WORDS = 15;

const DEFAULT_SETTINGS = {
  enabled: true,
  mode: "timer",
  message:
    "Please Hamim Don't Lie to Yourself. Is it really important to watch or you are just procrastinating. You can get more values if you read books or any courses",
  delaySeconds: 10,
};

let settings = { ...DEFAULT_SETTINGS };
let overlayActive = false;
let processedVideoId = null;
let lastNavUrl = null;

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    settings = { ...DEFAULT_SETTINGS, ...stored };
  });
}

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

function saveHistory(entry) {
  const { title, channel } = getVideoMeta();
  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    videoId: getVideoId(),
    title,
    channel,
    thumbnail: `https://i.ytimg.com/vi/${getVideoId()}/hqdefault.jpg`,
    timestamp: Date.now(),
    ...entry,
  };
  chrome.storage.local.get({ history: [] }, (data) => {
    const history = data.history || [];
    history.push(record);
    chrome.storage.local.set({ history });
  });
}

function buildOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "ytmp-overlay";

  const closeBtn = `<button class="ytmp-close" title="Skip the wait (Esc)" aria-label="Skip the wait">✕</button>`;

  if (settings.mode === "journal") {
    overlay.innerHTML = `
      ${closeBtn}
      <div class="ytmp-circle" aria-hidden="true">
        <div class="ytmp-core"></div>
        <div class="ytmp-ring"></div>
        <div class="ytmp-ring"></div>
        <div class="ytmp-ring"></div>
        <span class="ytmp-count ytmp-count-goal">${MIN_WORDS}</span>
      </div>
      <p class="ytmp-message"></p>
      <textarea class="ytmp-journal" rows="5"
        placeholder="In at least ${MIN_WORDS} words, explain why this video truly helps you right now, how you'll use it, or be honest that you're just procrastinating..."></textarea>
      <div class="ytmp-words"><span class="ytmp-wordcount">0</span>/${MIN_WORDS} words</div>
      <label class="ytmp-flag">
        <input type="checkbox" class="ytmp-flag-check" />
        <span>This is unimportant / I'm just wasting time</span>
      </label>
      <div class="ytmp-actions">
        <button class="ytmp-continue" disabled>Continue</button>
        <button class="ytmp-cancel">Actually, I don't need to watch this right now</button>
      </div>
    `;
  } else {
    overlay.innerHTML = `
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
      <button class="ytmp-cancel">Actually, I don't need to watch this right now</button>
    `;
  }

  overlay.querySelector(".ytmp-message").textContent = settings.message;
  return overlay;
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

  const dismiss = (shouldSave) => {
    clearInterval(timer);
    observer.disconnect();
    overlay.classList.add("ytmp-done");
    if (shouldSave) {
      saveHistory({
        mode: settings.mode,
        reason: overlay.querySelector(".ytmp-journal")?.value?.trim() || null,
        flagged: flagCheck?.checked || false,
      });
    }
    setTimeout(() => {
      overlay.remove();
      overlayActive = false;
      document.removeEventListener("keydown", onKey);
    }, 350);
  };

  const onKey = (e) => {
    if (e.key === "Escape") {
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

  overlay.querySelector(".ytmp-close").addEventListener("click", () => dismiss(true));
  overlay.querySelector(".ytmp-cancel").addEventListener("click", () => dismiss(false));
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