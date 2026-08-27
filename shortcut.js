// Ctrl+Option+J (Ctrl+Alt+J in browser events) returns to the YouTube homepage.
// Plain J is only suppressed while Mindful Pause is open, preventing the old
// overlay handler from treating it as a shortcut while leaving normal YouTube
// keyboard controls untouched the rest of the time.
window.addEventListener(
  "keydown",
  (event) => {
    if (event.key.toLowerCase() !== "j") return;

    if (event.ctrlKey && event.altKey && !event.metaKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = "https://www.youtube.com/";
      return;
    }

    if (
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      document.querySelector(".ytmp-overlay")
    ) {
      event.stopImmediatePropagation();
    }
  },
  true
);
