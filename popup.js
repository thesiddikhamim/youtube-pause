const toggle = document.getElementById("toggle");
const modeSelect = document.getElementById("mode");
const optionsLink = document.getElementById("options");
const historyLink = document.getElementById("history");

chrome.storage.sync.get({ enabled: true, mode: "timer" }, (stored) => {
  toggle.checked = stored.enabled;
  modeSelect.value = stored.mode;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

modeSelect.addEventListener("change", () => {
  chrome.storage.sync.set({ mode: modeSelect.value });
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

historyLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});