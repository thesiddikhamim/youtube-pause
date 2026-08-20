const toggle = document.getElementById("toggle");
const optionsLink = document.getElementById("options");
const historyLink = document.getElementById("history");

chrome.storage.sync.get({ enabled: true }, (stored) => {
  toggle.checked = stored.enabled;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

historyLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});