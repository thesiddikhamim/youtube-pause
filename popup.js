const toggle = document.getElementById("toggle");
const modeSegmented = document.getElementById("mode");
const modeButtons = modeSegmented.querySelectorAll("button[data-mode]");
const optionsLink = document.getElementById("options");
const historyLink = document.getElementById("history");
const hideRecsEl = document.getElementById("hideRecommendations");
const hideShortsEl = document.getElementById("hideShorts");
const hideHomeEl = document.getElementById("hideHome");

function setMode(mode) {
  for (const btn of modeButtons) {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  }
}

chrome.storage.sync.get(
  { enabled: true, mode: "timer", hideRecommendations: false, hideShorts: false, hideHome: false },
  (stored) => {
    toggle.checked = stored.enabled;
    setMode(stored.mode);
    hideRecsEl.checked = stored.hideRecommendations;
    hideShortsEl.checked = stored.hideShorts;
    hideHomeEl.checked = stored.hideHome;
  }
);

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

for (const btn of modeButtons) {
  btn.addEventListener("click", () => {
    setMode(btn.dataset.mode);
    chrome.storage.sync.set({ mode: btn.dataset.mode });
  });
}

hideRecsEl.addEventListener("change", () => {
  chrome.storage.sync.set({ hideRecommendations: hideRecsEl.checked });
});

hideShortsEl.addEventListener("change", () => {
  chrome.storage.sync.set({ hideShorts: hideShortsEl.checked });
});

hideHomeEl.addEventListener("change", () => {
  chrome.storage.sync.set({ hideHome: hideHomeEl.checked });
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

historyLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});