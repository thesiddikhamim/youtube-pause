const toggle = document.getElementById("toggle");
const modeSegmented = document.getElementById("mode");
const modeButtons = modeSegmented.querySelectorAll("button[data-mode]");
const optionsLink = document.getElementById("options");
const historyLink = document.getElementById("history");
const hideRecsEl = document.getElementById("hideRecommendations");
const hideShortsEl = document.getElementById("hideShorts");
const hideHomeEl = document.getElementById("hideHome");
const protectionModal = document.getElementById("protectionModal");
const protectionReason = document.getElementById("protectionReason");
const protectionWordCount = document.getElementById("protectionWordCount");
const protectionConfirm = document.getElementById("protectionConfirm");
const protectionCancel = document.getElementById("protectionCancel");

const protectionToggles = [hideRecsEl, hideShortsEl, hideHomeEl];
let currentMode = "timer";
let pendingProtection = null;

function setMode(mode) {
  currentMode = mode;
  for (const btn of modeButtons) {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  }
}

function wordCount(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function openProtectionJournal(input) {
  pendingProtection = input;
  protectionReason.value = "";
  updateProtectionWordCount();
  protectionModal.hidden = false;
  setTimeout(() => protectionReason.focus(), 0);
}

function closeProtectionJournal() {
  protectionModal.hidden = true;
  if (pendingProtection) pendingProtection.checked = true;
  pendingProtection = null;
}

function updateProtectionWordCount() {
  const count = wordCount(protectionReason.value);
  protectionWordCount.textContent = `${count} / 30 words`;
  protectionWordCount.classList.toggle("ready", count >= 30);
  protectionConfirm.disabled = count < 30;
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

for (const input of protectionToggles) {
  input.addEventListener("change", () => {
    // Turning a protection on is always immediate.
    if (input.checked) {
      chrome.storage.sync.set({ [input.id]: true });
      return;
    }

    // Timer mode keeps the existing instant behavior. Journal mode asks for
    // deliberate reflection before a distraction blocker can be removed.
    if (currentMode !== "journal") {
      chrome.storage.sync.set({ [input.id]: false });
      return;
    }

    openProtectionJournal(input);
  });
}

protectionReason.addEventListener("input", updateProtectionWordCount);

protectionCancel.addEventListener("click", closeProtectionJournal);

protectionConfirm.addEventListener("click", () => {
  if (!pendingProtection || wordCount(protectionReason.value) < 30) return;

  const input = pendingProtection;
  const reason = protectionReason.value.trim();
  chrome.storage.sync.set(
    {
      [input.id]: false,
      lastProtectionRemovalReason: reason,
      lastProtectionRemovalAt: Date.now(),
      lastProtectionRemoved: input.id,
    },
    () => {
      input.checked = false;
      protectionModal.hidden = true;
      pendingProtection = null;
    }
  );
});

protectionModal.addEventListener("click", (event) => {
  if (event.target === protectionModal) closeProtectionJournal();
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

historyLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});