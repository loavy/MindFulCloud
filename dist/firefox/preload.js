(() => {
  const root = document.documentElement;

  // prevent flash BEFORE content.js loads
  root.style.setProperty("--mf-ready", "1");

  // optional: early theme hint
  if (location.hostname.includes("youtube.com")) {
    root.classList.add("mf-pre-youtube");
  }

  if (location.hostname.includes("pinterest.com")) {
    root.classList.add("mf-pre-pinterest");
  }
})();
