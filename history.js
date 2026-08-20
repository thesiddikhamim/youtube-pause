let history = [];
let filter = "all";
let query = "";

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const clearBtn = document.getElementById("clearAll");

function load() {
  chrome.storage.local.get({ history: [] }, (data) => {
    history = (data.history || []).sort((a, b) => b.timestamp - a.timestamp);
    renderStats();
    render();
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.history) load();
});

function renderStats() {
  document.getElementById("statTotal").textContent = history.length;
  document.getElementById("statJournal").textContent = history.filter(
    (h) => h.reason
  ).length;
  document.getElementById("statFlagged").textContent = history.filter(
    (h) => h.flagged
  ).length;
}

function render() {
  const items = history.filter((h) => {
    if (filter === "flagged" && !h.flagged) return false;
    if (filter === "important" && h.flagged) return false;
    if (query) {
      const hay = `${h.title} ${h.channel} ${h.reason || ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  if (items.length === 0) {
    listEl.innerHTML = `<div class="empty">${
      history.length === 0
        ? "No videos yet. Go click a video on YouTube and your pause will be recorded here."
        : "Nothing matches this filter."
    }</div>`;
    return;
  }

  listEl.innerHTML = items.map(cardHtml).join("");
}

function cardHtml(h) {
  const watchUrl = `https://www.youtube.com/watch?v=${h.videoId}`;
  const date = new Date(h.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const reason =
    h.reason && h.reason.length > 0
      ? `<div class="reason">${escapeHtml(h.reason)}</div>`
      : "";
  return `
    <div class="card">
      <img class="thumb" src="${h.thumbnail}" alt="" loading="lazy" onclick="window.open('${watchUrl}')" />
      <div class="body">
        <div class="title" onclick="window.open('${watchUrl}')">${escapeHtml(h.title)}</div>
        <div class="channel">${escapeHtml(h.channel || "Unknown channel")}</div>
        ${reason}
        <div class="meta">
          <span class="badge ${h.mode === "journal" ? "journal" : "timer"}">${
    h.mode === "journal" ? "Journal" : "Timer"
  }</span>
          ${h.flagged ? '<span class="badge flagged">Unimportant</span>' : ""}
          <span class="time">${date}</span>
        </div>
      </div>
      <button class="del" title="Delete entry" data-id="${h.id}">✕</button>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function deleteEntry(id) {
  history = history.filter((h) => h.id !== id);
  chrome.storage.local.set({ history });
  renderStats();
  render();
}

function clearAll() {
  if (!confirm("Delete all watch history?")) return;
  history = [];
  chrome.storage.local.set({ history });
  renderStats();
  render();
}

listEl.addEventListener("click", (e) => {
  const delBtn = e.target.closest(".del");
  if (delBtn) deleteEntry(delBtn.dataset.id);
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

searchEl.addEventListener("input", () => {
  query = searchEl.value.trim().toLowerCase();
  render();
});

clearBtn.addEventListener("click", clearAll);

load();