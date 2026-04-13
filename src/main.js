import Swup from "swup";
import { initHome } from "./home.js";
import { initWine } from "./wine.js";
import { initAbout } from "./about.js";

const swup = new Swup();

function initMainLinks() {
  const mainLinks = document.querySelectorAll(".main-link");

  function setCurrentMainLink(pathname) {
    mainLinks.forEach((l) => l.classList.remove("w--current"));
    const match = [...mainLinks].find((l) => {
      const url = new URL(l.getAttribute("href"), location.origin);
      return url.pathname === pathname;
    });
    match?.classList.add("w--current");
  }

  // Set on load
  setCurrentMainLink(location.pathname);

  // On main-link click
  mainLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const url = new URL(link.getAttribute("href"), location.origin);
      setCurrentMainLink(url.pathname);
    });
  });

  // Expose for nav-link clicks
  return setCurrentMainLink;
}

let cleanupNavAnchors = null;
let pendingSection = null;

function initNavAnchors(setCurrentMainLink) {
  if (cleanupNavAnchors) cleanupNavAnchors();
  cleanupNavAnchors = _initNavAnchors(setCurrentMainLink);
}

function _initNavAnchors(setCurrentMainLink) {
  const links = document.querySelectorAll("[nav-section]");

  function setActiveLink(section) {
    links.forEach((l) => l.classList.remove("active"));
    const active = document.querySelector(`[nav-section="${section}"]`);
    active?.classList.add("active");
  }

  links.forEach((link) => {
    const section = link.getAttribute("nav-section");
    const href = link.getAttribute("href");
    if (section && href && !href.includes("#")) {
      link.setAttribute("href", `${href}#${section}`);
    }

    link.addEventListener("click", (e) => {
      const target = document.getElementById(section);
      if (target) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setActiveLink(section);
        setCurrentMainLink(location.pathname);
        target.scrollIntoView({ behavior: "smooth" });
      } else {
        setActiveLink(section);
        pendingSection = section;
        const url = new URL(link.getAttribute("href"), location.origin);
        setCurrentMainLink(url.pathname);
      }
    });
  });

  // Observer: active nav-link based on visible section
  const sections = [...links]
    .map((l) => document.getElementById(l.getAttribute("nav-section")))
    .filter(Boolean);

  const nextPage = document.querySelector(".next-page");
  let lastActive = null;
  let nextPageVisible = false;

  function updateActive() {
    if (nextPageVisible) {
      links.forEach((l) => l.classList.remove("active"));
    } else if (lastActive) {
      setActiveLink(lastActive);
    }
  }

  let sectionObserver = null;
  let nextPageObserver = null;

  if (sections.length) {
    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) lastActive = entry.target.id;
        });
        updateActive();
      },
      { threshold: 0.3 }
    );
    sections.forEach((s) => sectionObserver.observe(s));
  }

  if (nextPage) {
    nextPageObserver = new IntersectionObserver(
      ([entry]) => {
        nextPageVisible = entry.isIntersecting;
        updateActive();
      },
      { threshold: 0.2 }
    );
    nextPageObserver.observe(nextPage);
  }

  return () => {
    sectionObserver?.disconnect();
    nextPageObserver?.disconnect();
  };
}

function initNavIndexes() {
  document.querySelectorAll("[nav-index]").forEach((el, i) => {
    el.textContent = i + 1;
  });
}

function initInquiry() {
  const inquiry = document.querySelector(".inquiry");
  const overlay = document.querySelector(".overlay");
  if (!inquiry) return;

  function isWinePopupOpen() {
    const popup = document.querySelector(".wine-popup");
    return popup ? popup.style.transform === "translateX(0%)" : false;
  }

  function open() {
    inquiry.style.transform = "translateX(0%)";
    inquiry.style.pointerEvents = "auto";
    if (overlay && !isWinePopupOpen()) {
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "auto";
    }
    document.body.style.overflow = "hidden";
  }

  function close() {
    inquiry.style.transform = "translateX(100%)";
    inquiry.style.pointerEvents = "none";
    if (overlay && !isWinePopupOpen()) {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
    }
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-button='inquiry']").forEach((btn) => {
    btn.addEventListener("click", open);
  });

  inquiry.querySelector(".close-button")?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  if (overlay) {
    overlay.addEventListener("click", close);
  }
}

function initArchives() {
  const btn = document.getElementById("archivesButton");
  const archives = document.querySelector(".archives");
  if (!btn || !archives) return;

  function open() {
    archives.style.transform = "translateY(0%)";
    document.body.style.overflow = "hidden";
  }

  function close() {
    archives.style.transform = "translateY(100%)";
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", open);
  archives.querySelector(".close-button")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function initPage() {
  const swupEl = document.getElementById("swup");
  const page = swupEl?.dataset.swup;

  if (page === "home") initHome();
  else if (page === "wine") initWine();
  else if (page === "about") initAbout();
}

// Initial load
const setCurrentMainLink = initMainLinks();
initNavAnchors(setCurrentMainLink);
initNavIndexes();
initArchives();
initInquiry();
initPage();

// Clear active nav-link on page leave
swup.hooks.on("visit:start", () => {
  if (cleanupNavAnchors) { cleanupNavAnchors(); cleanupNavAnchors = null; }
  document.querySelectorAll("[nav-section].active").forEach((l) => l.classList.remove("active"));
});

// After each swup page transition
swup.hooks.on("visit:end", () => {
  initMainLinks();
  initNavAnchors(setCurrentMainLink);
  initNavIndexes();
  initArchives();
  initInquiry();
  initPage();
  if (pendingSection) {
    document.querySelectorAll("[nav-section].active").forEach((l) => l.classList.remove("active"));
    document.querySelector(`[nav-section="${pendingSection}"]`)?.classList.add("active");
    pendingSection = null;
  }
});
