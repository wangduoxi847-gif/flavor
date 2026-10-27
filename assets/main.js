"use strict";

// Content and navigation remain usable when JavaScript is disabled.
const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

const navigation = [...document.querySelectorAll('nav a[href^="#"]')];
// Direct links to a work open its disclosure before scrolling to it.
function revealWork() {
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
  const work = target?.closest("details.work-card");
  if (work) { work.open = true; target.scrollIntoView({ block: "start" }); }
}
window.addEventListener("hashchange", revealWork);
revealWork();
if ("IntersectionObserver" in window) {
  const visibleSections = new Map();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.boundingClientRect.top);
      else visibleSections.delete(entry.target.id);
    }
    const current = [...visibleSections].sort((a, b) => a[1] - b[1])[0]?.[0];
    for (const link of navigation) {
      if (link.getAttribute("href") === `#${current}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }, { rootMargin: "-10% 0px -35% 0px", threshold: 0 });
  for (const link of navigation) {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) observer.observe(section);
  }
}
