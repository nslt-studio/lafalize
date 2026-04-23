import Swup from "swup";
import { initNextPage, lockScroll, unlockScroll } from "./utils.js";
import { initHome } from "./home.js";
import { initWine } from "./wine.js";
import { initAbout } from "./about.js";
import { initNews } from "./news.js";
import { initArchivesPage } from "./archives.js";
import { initMap } from "./map.js";

const swup = new Swup();

function initMainLinks() {
  // All internal links with a real pathname (excludes anchors-only and external)
  const allLinks = [...document.querySelectorAll("a[href]")].filter((l) => {
    try {
      if (l.target === "_blank" || (l.target && l.target !== "_self")) return false;
      const url = new URL(l.getAttribute("href"), location.origin);
      return url.origin === location.origin;
    } catch { return false; }
  });

  function setCurrentMainLink(pathname) {
    allLinks.forEach((l) => {
      try {
        const url = new URL(l.getAttribute("href"), location.origin);
        l.classList.toggle("w--current", url.pathname === pathname);
      } catch { /* skip */ }
    });
  }

  // Set on load
  setCurrentMainLink(location.pathname);

  // On any internal link click
  allLinks.forEach((link) => {
    link.addEventListener("click", () => {
      try {
        const url = new URL(link.getAttribute("href"), location.origin);
        setCurrentMainLink(url.pathname);
      } catch { /* skip */ }
    });
  });

  // Expose for nav-link clicks
  return setCurrentMainLink;
}

let cleanupNavAnchors = null;
let pendingSection = null;
let closeMobileNav = null;

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
    el.textContent = `1.${i + 1}`;
  });
}

function initInquiry() {
  const inquiry = document.querySelector(".inquiry");
  const overlay = document.querySelector(".overlay");
  if (!inquiry) return;

  function isCollectionPopupOpen() {
    const popup = document.querySelector(".collection-popup");
    return popup ? popup.style.transform === "translateX(0%)" : false;
  }

  function open() {
    inquiry.style.transform = "translateX(0%)";
    inquiry.style.pointerEvents = "auto";
    if (overlay && !isCollectionPopupOpen()) {
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "auto";
    }
    lockScroll();
  }

  function close() {
    inquiry.style.transform = "translateX(100%)";
    inquiry.style.pointerEvents = "none";
    if (overlay && !isCollectionPopupOpen()) {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
    }
    unlockScroll();
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


function initFindUs() {
  const findUs = document.querySelector(".find-us");
  if (!findUs) return;

  function open() {
    findUs.style.transform = "translateY(0%)";
    findUs.style.pointerEvents = "auto";
    lockScroll();
  }

  function close() {
    findUs.style.transform = "translateY(100%)";
    findUs.style.pointerEvents = "none";
    unlockScroll();
  }

  document.getElementById("findUs")?.addEventListener("click", open);
  findUs.querySelector(".close-button")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

function initMobileNav() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const isMobile = () => window.innerWidth <= 992;

  function open() {
    if (!isMobile()) return;
    nav.style.transform = "translateX(0%)";
    nav.style.pointerEvents = "auto";
    lockScroll();
  }

  function close() {
    if (!isMobile()) return;
    nav.style.transform = "translateX(-100%)";
    nav.style.pointerEvents = "none";
    unlockScroll();
  }

  closeMobileNav = close;

  const menuBtn = document.getElementById("menuButton");
  menuBtn?.addEventListener("click", open);
  nav.querySelector(".close-button")?.addEventListener("click", close);
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && e.target !== menuBtn) close();
  });
}

function initPage() {
  const swupEl = document.getElementById("swup");
  const page = swupEl?.dataset.swup;

  if (page === "home") initHome();
  else if (page === "wine") initWine();
  else if (page === "about") initAbout();
  else if (page === "news") initNews();
  else if (page === "archives") initArchivesPage();
}

// Initial load
const setCurrentMainLink = initMainLinks();
initNavAnchors(setCurrentMainLink);
initNavIndexes();
initNextPage();
initInquiry();
initFindUs();
initMobileNav();
initMap();
initPage();

// Clear active nav-link on page leave
swup.hooks.on("visit:start", () => {
  if (cleanupNavAnchors) { cleanupNavAnchors(); cleanupNavAnchors = null; }
  document.querySelectorAll("[nav-section].active").forEach((l) => l.classList.remove("active"));
  if (closeMobileNav) closeMobileNav();
});

// After each swup page transition
swup.hooks.on("visit:end", () => {
  initMainLinks();
  initNavAnchors(setCurrentMainLink);
  initNavIndexes();
  initNextPage();
  initInquiry();
  initFindUs();
  initMobileNav();
  initMap();
  initPage();
  if (pendingSection) {
    document.querySelectorAll("[nav-section].active").forEach((l) => l.classList.remove("active"));
    document.querySelector(`[nav-section="${pendingSection}"]`)?.classList.add("active");
    pendingSection = null;
  }
});
