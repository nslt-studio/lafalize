import Swup from "swup";
import Lenis from "lenis";
import { initNextPage, initImgFadeIn, lockScroll, unlockScroll, setLenis } from "./utils.js";
import { initHome } from "./home.js";
import { initWine } from "./wine.js";
import { initAbout } from "./about.js";
import { initNews } from "./news.js";
import { initArchivesPage } from "./archives.js";
import { initMap } from "./map.js";

const swup = new Swup();

const lenis = new Lenis();
setLenis(lenis);
function lenisRaf(time) {
  lenis.raf(time);
  requestAnimationFrame(lenisRaf);
}
requestAnimationFrame(lenisRaf);

const ANCHOR_SCROLL_OFFSET = 150; // px de marge par rapport au top du viewport

// Le contenu (et donc la hauteur scrollable) change à chaque transition Swup :
// on force Lenis à recalculer la hauteur de la nouvelle page.
swup.hooks.on("content:replace", () => {
  lenis.resize();

  // Filet de sécurité : du contenu peut encore changer de hauteur après ce
  // premier calcul (images, vidéos, accordéons qui s'ouvrent...) — Lenis a
  // bien un ResizeObserver interne, mais on recalcule aussi explicitement à
  // quelques instants clés pour ne jamais rester bloqué avec une hauteur trop
  // courte (scroll qui ne va pas jusqu'au vrai bas de la page).
  requestAnimationFrame(() => lenis.resize());
  setTimeout(() => lenis.resize(), 500);
  setTimeout(() => lenis.resize(), 1500);
});

// Swup a son propre mécanisme natif de scroll après transition (scroll:anchor
// pour un lien avec #hash, scroll:top sinon) — mais il utilise l'API native
// scrollIntoView/scrollTo, pas Lenis, et sans la marge de 150px. On le
// remplace entièrement pour que TOUT lien avec une ancre vers une autre page
// (pas seulement ceux du menu) respecte la marge, via Lenis.
swup.hooks.replace("scroll:anchor", (visit, { hash }) => {
  const target = hash && document.getElementById(hash.replace(/^#/, ""));
  if (!target) return false;
  lenis.scrollTo(target, { offset: -ANCHOR_SCROLL_OFFSET, immediate: true });
  return true;
});

swup.hooks.replace("scroll:top", () => {
  lenis.scrollTo(0, { immediate: true });
  return true;
});

// Footer plein écran (.footer, 100dvh) : révélé une fois arrivé (à une marge
// près) en bas de la page, masqué dès qu'on remonte ou qu'on quitte la page.
// Certaines pages (home, et toute future page) n'ont pas de .footer : on ne
// fait alors rien.
//
// Basé sur la position réelle du bas de .footer (getBoundingClientRect),
// recalculée à chaque frame de scroll Lenis — pas sur un ratio
// d'IntersectionObserver (jamais fiable à exactement 1 sur un élément en
// 100dvh, à cause des arrondis sous-pixel/barre d'adresse mobile) ni sur la
// hauteur totale du document (peut être temporairement fausse juste après
// une transition Swup). Le plus robuste : une vérification géométrique
// directe, à jour à chaque instant, peu importe ce qui se passe ailleurs.
const FOOTER_REVEAL_MARGIN = 150; // px avant le vrai bas de page
let footerRevealed = false;

function setFooterRevealed(revealed) {
  if (revealed === footerRevealed) return;
  footerRevealed = revealed;
  const footer = document.querySelector(".footer");
  const nav = document.querySelector(".nav");
  if (footer) footer.style.opacity = revealed ? "1" : "0";
  if (nav) {
    nav.style.opacity = revealed ? "0" : "1";
    nav.style.pointerEvents = revealed ? "none" : "auto";
  }
}

lenis.on("scroll", () => {
  const footer = document.querySelector(".footer");
  if (!footer) { setFooterRevealed(false); return; }
  const reachedBottom = footer.getBoundingClientRect().bottom <= window.innerHeight + FOOTER_REVEAL_MARGIN;
  setFooterRevealed(reachedBottom);
});

function initMainLinks() {
  // All internal links with a real pathname (excludes anchors-only and external)
  const allLinks = [...document.querySelectorAll("a[href]")].filter((l) => {
    if (l.classList.contains("locale")) return false;
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
        if (window.innerWidth <= 992 && closeMobileNav) closeMobileNav();
        lenis.scrollTo(target, { offset: -ANCHOR_SCROLL_OFFSET });
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
    el.textContent = `2.${i + 1}`;
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

function initNavAccordions() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const links = [...nav.querySelectorAll("[data-link]")];
  const accordions = [...nav.querySelectorAll("[data-accordion]")];

  function buttonFor(value) {
    return nav.querySelector(`[data-button="${value}"]`);
  }

  function setOpen(acc, open) {
    acc.style.maxHeight = open ? acc.scrollHeight + "px" : "0px";
    const btn = buttonFor(acc.getAttribute("data-accordion"));
    if (btn) btn.textContent = open ? "-" : "+";
  }

  // data-link : ouverture exclusive (ferme les autres) au clic sur un lien de page
  function openExclusive(value) {
    accordions.forEach((acc) => setOpen(acc, acc.getAttribute("data-accordion") === value));
  }

  // data-button : ouverture/fermeture indépendante, sans toucher aux autres
  function toggle(value) {
    const acc = accordions.find((a) => a.getAttribute("data-accordion") === value);
    if (!acc) return;
    const isOpen = acc.style.maxHeight && acc.style.maxHeight !== "0px";
    setOpen(acc, !isOpen);
  }

  // Écouteurs posés une seule fois par élément (au cas où .nav ne serait pas
  // recréé à chaque transition Swup) — sinon ils s'accumulent et un clic finit
  // par déclencher le toggle plusieurs fois d'un coup (annulation silencieuse).
  if (!nav.dataset.accordionsBound) {
    nav.dataset.accordionsBound = "1";

    links.forEach((link) => {
      link.addEventListener("click", () => openExclusive(link.getAttribute("data-link")));
    });

    nav.querySelectorAll("[data-button]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Empêche une navigation/ouverture exclusive accidentelle si le bouton
        // est un <a> (Webflow) ou imbriqué dans un [data-link]
        e.preventDefault();
        e.stopPropagation();
        toggle(btn.getAttribute("data-button"));
      });
    });
  }

  // Fermés par défaut (ex. page sans accordéon correspondant) — reste toujours
  // ouvrable/fermable ensuite via data-link ou data-button
  accordions.forEach((acc) => setOpen(acc, false));

  // Ouvre l'accordéon de la page courante au chargement / après transition
  const current = links.find((link) => link.classList.contains("w--current"));
  if (current) {
    requestAnimationFrame(() => requestAnimationFrame(() => openExclusive(current.getAttribute("data-link"))));
  }
}

function syncNavLocaleLinks() {
  const page = swup.cache.get(location.href) ?? swup.cache.get(location.pathname);
  if (!page?.html) return;
  const doc = new DOMParser().parseFromString(page.html, "text/html");
  const incoming = [...doc.querySelectorAll("a.locale")];
  document.querySelectorAll("a.locale").forEach((link, i) => {
    if (!incoming[i]) return;
    link.setAttribute("href", incoming[i].getAttribute("href"));
    try {
      const url = new URL(link.getAttribute("href"), location.origin);
      link.classList.toggle("w--current", url.pathname === location.pathname);
    } catch {}
  });
}

function detectLocalePrefix(localeLinks) {
  const current = localeLinks.find(l => {
    try { return new URL(l.getAttribute("href"), location.origin).pathname === location.pathname; }
    catch { return false; }
  });
  if (!current) return sessionStorage.getItem("lafalize-locale") ?? "";

  const sibling = localeLinks.find(l => l !== current);
  if (!sibling) return "";

  const cParts = new URL(current.getAttribute("href"), location.origin).pathname.split("/").filter(Boolean);
  const sParts = new URL(sibling.getAttribute("href"), location.origin).pathname.split("/").filter(Boolean);

  let n = 0;
  while (n < cParts.length && n < sParts.length && cParts.at(-1 - n) === sParts.at(-1 - n)) n++;

  const prefixParts = cParts.slice(0, cParts.length - n);
  return prefixParts.length ? "/" + prefixParts.join("/") : "";
}

function initLocale() {
  const localeLinks = [...document.querySelectorAll("a.locale")];
  if (!localeLinks.length) return;

  localeLinks.forEach(link => {
    try {
      const url = new URL(link.getAttribute("href"), location.origin);
      link.classList.toggle("w--current", url.pathname === location.pathname);
    } catch {}
  });

  const prefix = detectLocalePrefix(localeLinks);
  sessionStorage.setItem("lafalize-locale", prefix);

  document.querySelectorAll("a[href]").forEach(link => {
    if (link.classList.contains("locale")) return;
    try {
      const orig = link.dataset.originalHref ?? link.getAttribute("href");
      const url = new URL(orig, location.origin);
      if (url.origin !== location.origin) return;
      if (!link.dataset.originalHref) link.dataset.originalHref = orig;
      const needsPrefix = prefix && !url.pathname.startsWith(prefix + "/") && url.pathname !== prefix;
      link.setAttribute("href", (needsPrefix ? prefix : "") + url.pathname + url.search + url.hash);
    } catch {}
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
initNavAccordions();
initMap();
initPage();
initLocale();
initImgFadeIn();

// Clear active nav-link on page leave
swup.hooks.on("visit:start", () => {
  if (cleanupNavAnchors) { cleanupNavAnchors(); cleanupNavAnchors = null; }
  document.querySelectorAll("[nav-section].active").forEach((l) => l.classList.remove("active"));
  if (closeMobileNav) closeMobileNav();
  setFooterRevealed(false);
});

// After each swup page transition
swup.hooks.on("visit:end", () => {
  syncNavLocaleLinks();
  initMainLinks();
  initNavAnchors(setCurrentMainLink);
  initNavIndexes();
  initNextPage();
  initInquiry();
  initFindUs();
  initMobileNav();
  initNavAccordions();
  initMap();
  initPage();
  initLocale();
  initImgFadeIn();
  if (pendingSection) {
    document.querySelectorAll("[nav-section].active").forEach((l) => l.classList.remove("active"));
    document.querySelector(`[nav-section="${pendingSection}"]`)?.classList.add("active");
    pendingSection = null;
  }
});
