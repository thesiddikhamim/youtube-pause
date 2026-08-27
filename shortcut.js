// Home shortcut override. This runs before document-level handlers so plain J
// remains available for YouTube's own keyboard controls, while Ctrl+Option+J
// (Ctrl+Alt+J in browser events) returns to the YouTube homepage.
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

    // Prevent the old plain-J handler in content.js from firing, without
    // blocking YouTube's own normal J shortcut.
    if (!event.ctrlKey && !event.altKey && !event.metaKey) {
      event.stopImmediatePropagation();
    }
  },
  true
);
