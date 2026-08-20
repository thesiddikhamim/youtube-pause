const DEFAULT_MESSAGE =
  "Please Hamim Don't Lie to Yourself. Is it really important to watch or you are just procrastinating. You can get more values if you read books or any courses";

const messageEl = document.getElementById("message");
const delayEl = document.getElementById("delay");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");
const delayRow = document.getElementById("delayRow");
const journalNote = document.getElementById("journalNote");
const historyLink = document.getElementById("history");
const modeCards = {
  timer: document.getElementById("mode-timer"),
  journal: document.getElementById("mode-journal"),
};
const hideRecsEl = document.getElementById("hideRecommendations");
const hideShortsEl = document.getElementById("hideShorts");
const hideHomeEl = document.getElementById("hideHome");

chrome.storage.sync.get(
  {
    message: DEFAULT_MESSAGE,
    delaySeconds: 10,
    mode: "timer",
    hideRecommendations: false,
    hideShorts: false,
    hideHome: false,
  },
  (stored) => {
    messageEl.value = stored.message;
    delayEl.value = stored.delaySeconds;
    setMode(stored.mode);
    hideRecsEl.checked = stored.hideRecommendations;
    hideShortsEl.checked = stored.hideShorts;
    hideHomeEl.checked = stored.hideHome;
  }
);

function setMode(mode) {
  for (const key of Object.keys(modeCards)) {
    const card = modeCards[key];
    const radio = card.querySelector("input");
    const active = key === mode;
    card.classList.toggle("active", active);
    radio.checked = active;
  }
  const isJournal = mode === "journal";
  delayRow.classList.toggle("hidden", isJournal);
  journalNote.classList.toggle("hidden", !isJournal);
}

for (const key of Object.keys(modeCards)) {
  modeCards[key].addEventListener("click", () => {
    setMode(key);
    chrome.storage.sync.set({ mode: key }, () => {
      statusEl.textContent = "Mode saved — applies to YouTube immediately";
      statusEl.classList.add("show");
      setTimeout(() => statusEl.classList.remove("show"), 2000);
    });
  });
}

saveBtn.addEventListener("click", () => {
  const message = messageEl.value.trim() || DEFAULT_MESSAGE;
  const delaySeconds = Math.min(
    60,
    Math.max(1, parseInt(delayEl.value, 10) || 10)
  );
  const mode = document.querySelector('input[name="mode"]:checked').value;

  chrome.storage.sync.set(
    {
      message,
      delaySeconds,
      mode,
      hideRecommendations: hideRecsEl.checked,
      hideShorts: hideShortsEl.checked,
      hideHome: hideHomeEl.checked,
    },
    () => {
      statusEl.classList.add("show");
      setTimeout(() => statusEl.classList.remove("show"), 1800);
    }
  );
});

historyLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});