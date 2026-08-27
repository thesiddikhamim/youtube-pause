const DEFAULT_MESSAGE =
  "Please Hamim Don't Lie to Yourself. Is it really important to watch or you are just procrastinating. You can get more values if you read books or any courses";

const messageEl = document.getElementById("message");
const delayEl = document.getElementById("delay");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");
const delayRow = document.getElementById("delayRow");
const journalNote = document.getElementById("journalNote");
const historyLink = document.getElementById("history");
const modeCards = { timer: document.getElementById("mode-timer"), journal: document.getElementById("mode-journal") };
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

chrome.storage.sync.get(
  { message: DEFAULT_MESSAGE, delaySeconds: 10, mode: "timer", hideRecommendations: false, hideShorts: false, hideHome: false },
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
  currentMode = mode;
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

function wordCount(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function updateProtectionWordCount() {
  const count = wordCount(protectionReason.value);
  protectionWordCount.textContent = `${count} / 30 words`;
  protectionWordCount.classList.toggle("ready", count >= 30);
  protectionConfirm.disabled = count < 30;
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

for (const input of protectionToggles) {
  input.addEventListener("change", () => {
    if (input.checked || currentMode !== "journal") return;
    openProtectionJournal(input);
  });
}

protectionReason.addEventListener("input", updateProtectionWordCount);
protectionCancel.addEventListener("click", closeProtectionJournal);
protectionConfirm.addEventListener("click", () => {
  if (!pendingProtection || wordCount(protectionReason.value) < 30) return;
  const input = pendingProtection;
  const reason = protectionReason.value.trim();
  input.checked = false;
  chrome.storage.sync.set({
    [input.id]: false,
    lastProtectionRemovalReason: reason,
    lastProtectionRemovalAt: Date.now(),
    lastProtectionRemoved: input.id,
  });
  protectionModal.hidden = true;
  pendingProtection = null;
  statusEl.textContent = "Protection removed after journal";
  statusEl.classList.add("show");
  setTimeout(() => statusEl.classList.remove("show"), 1800);
});
protectionModal.addEventListener("click", (event) => { if (event.target === protectionModal) closeProtectionJournal(); });

saveBtn.addEventListener("click", () => {
  const message = messageEl.value.trim() || DEFAULT_MESSAGE;
  const delaySeconds = Math.min(60, Math.max(1, parseInt(delayEl.value, 10) || 10));
  const mode = document.querySelector('input[name="mode"]:checked').value;
  chrome.storage.sync.set(
    { message, delaySeconds, mode, hideRecommendations: hideRecsEl.checked, hideShorts: hideShortsEl.checked, hideHome: hideHomeEl.checked },
    () => {
      statusEl.textContent = "Saved";
      statusEl.classList.add("show");
      setTimeout(() => statusEl.classList.remove("show"), 1800);
    }
  );
});

historyLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});