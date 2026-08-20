const toggle = document.getElementById("toggle");
const modeSegmented = document.getElementById("mode");
const modeButtons = modeSegmented.querySelectorAll("button[data-mode]");
const optionsLink = document.getElementById("options");
const historyLink = document.getElementById("history");

function setMode(mode) {
  for (const btn of modeButtons) {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  }
}

chrome.storage.sync.get({ enabled: true, mode: "timer" }, (stored) => {
  toggle.checked = stored.enabled;
  setMode(stored.mode);
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

for (const btn of modeButtons) {
  btn.addEventListener("click", () => {
    setMode(btn.dataset.mode);
    chrome.storage.sync.set({ mode: btn.dataset.mode });
  });
}

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

historyLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});