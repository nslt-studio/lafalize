let _lenis = null;
export function setLenis(instance) { _lenis = instance; }

export function lockScroll() {
  if (_lenis) { _lenis.stop(); return; }
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

export function unlockScroll() {
  if (_lenis) { _lenis.start(); return; }
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

export function openAccordion(btn) {
  const accordion = btn.nextElementSibling;
  if (!accordion?.classList.contains("tab-info-accordion")) return;
  const inner = accordion.querySelector(".tab-info-inner");
  accordion.style.maxHeight = inner ? inner.scrollHeight + "px" : "0px";
  btn.classList.add("active");
}

export function closeAccordion(btn) {
  const accordion = btn.nextElementSibling;
  if (!accordion?.classList.contains("tab-info-accordion")) return;
  accordion.style.maxHeight = "0px";
  btn.classList.remove("active");
}

export function initAccordion(container) {
  if (container.dataset.accordionInit) return;
  container.dataset.accordionInit = "1";
  const btns = [...container.querySelectorAll("[data-info]")];
  if (!btns.length) return;
  function activateBtn(activeBtn) {
    btns.forEach((b) => (b === activeBtn ? openAccordion(b) : closeAccordion(b)));
  }
  requestAnimationFrame(() => requestAnimationFrame(() => activateBtn(btns[0])));
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!btn.classList.contains("active")) activateBtn(btn);
    });
  });
}

export function initCollectionPopup() {
  const popup = document.querySelector(".collection-popup");
  const overlay = document.querySelector(".overlay");
  if (!popup || !overlay) return;

  function showInfo(el) {
    if (!el) return;
    el.style.display = "block";
    el.classList.add("active");
    requestAnimationFrame(() => (el.style.opacity = "1"));
    initAccordion(el);
    // Recalculate max-height for active accordions now that element is visible
    el.querySelectorAll("[data-info].active").forEach((btn) => openAccordion(btn));
  }

  function switchTab(tabId) {
    const currentInfo = popup.querySelector("[data-info-tab].active");
    const nextInfo = popup.querySelector(`[data-info-tab="${tabId}"]`);

    popup.querySelectorAll("[data-tab]").forEach((t) => t.classList.remove("active"));
    popup.querySelector(`[data-tab="${tabId}"]`)?.classList.add("active");

    if (!nextInfo || currentInfo === nextInfo) return;

    if (currentInfo) {
      currentInfo.style.opacity = "0";
      setTimeout(() => {
        currentInfo.style.display = "none";
        currentInfo.classList.remove("active");
        showInfo(nextInfo);
      }, 150);
    } else {
      showInfo(nextInfo);
    }
  }

  function openPopup(tabId) {
    popup.style.transform = "translateX(0%)";
    popup.style.pointerEvents = "auto";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    lockScroll();
    switchTab(tabId);
  }

  function closePopup() {
    popup.style.transform = "translateX(100%)";
    popup.style.pointerEvents = "none";
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    unlockScroll();
    setTimeout(() => {
      popup.querySelectorAll("[data-tab]").forEach((t) => t.classList.remove("active"));
      popup.querySelectorAll("[data-info-tab]").forEach((el) => {
        el.style.opacity = "0";
        el.style.display = "none";
        el.classList.remove("active");
      });
    }, 300);
  }

  // Init all accordions upfront
  popup.querySelectorAll("[data-info-tab]").forEach((infoTab) => initAccordion(infoTab));

  document.querySelectorAll("[data-popup]").forEach((btn) => {
    btn.addEventListener("click", () => openPopup(btn.getAttribute("data-popup")));
  });

  popup.querySelectorAll("[data-tab]").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.getAttribute("data-tab")));
  });

  popup.querySelector(".close-button")?.addEventListener("click", closePopup);
  overlay.addEventListener("click", closePopup);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });
}

export function initTabs({ tabAttr = "data-tab", infoAttr = "data-tab-info", fadeDuration = 150 } = {}) {
  const tabs = [...document.querySelectorAll(`[${tabAttr}]`)];
  const infos = [...document.querySelectorAll(`[${infoAttr}]`)];

  if (!tabs.length || !infos.length) return;

  infos.forEach((i) => {
    i.style.opacity = "0";
    i.style.display = "none";
  });

  function showInfo(el) {
    if (!el) return;
    el.style.display = "block";
    el.classList.add("active");
    setTimeout(() => (el.style.opacity = "1"), 20);
  }

  function switchTab(id) {
    const current = infos.find((i) => i.classList.contains("active"));
    const next = infos.find((i) => i.getAttribute(infoAttr) === id);

    tabs.forEach((t) => t.classList.remove("active"));
    tabs.find((t) => t.getAttribute(tabAttr) === id)?.classList.add("active");

    if (!next || current === next) return;

    if (current) {
      current.style.opacity = "0";
      setTimeout(() => {
        current.style.display = "none";
        current.classList.remove("active");
        showInfo(next);
      }, fadeDuration);
    } else {
      showInfo(next);
    }
  }

  switchTab(tabs[0].getAttribute(tabAttr));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.getAttribute(tabAttr)));
  });
}

const ACCORDION_LABELS = {
  en: { more: "Read more", less: "Read less" },
  nl: { more: "Meer lezen", less: "Minder lezen" },
  fr: { more: "Lire Plus", less: "Lire moins" },
};

function getAccordionLabels() {
  const locale = location.pathname.split("/").filter(Boolean)[0];
  return ACCORDION_LABELS[locale] ?? ACCORDION_LABELS.fr;
}

export function initTableAccordion() {
  const items = [...document.querySelectorAll(".table-list .table-item")];
  if (!items.length) return;

  let current = null;
  let currentBtn = null;

  function open(accordion, btn) {
    const inner = accordion.querySelector(".table-accordion-inner");
    accordion.style.maxHeight = inner ? inner.scrollHeight + "px" : "";
    if (btn) btn.textContent = getAccordionLabels().less;
    current = accordion;
    currentBtn = btn;
  }

  function close(accordion, btn) {
    accordion.style.maxHeight = "";
    if (btn) btn.textContent = getAccordionLabels().more;
    if (current === accordion) { current = null; currentBtn = null; }
  }

  // Open first item by default
  const firstItem = items[0];
  const firstAccordion = firstItem.querySelector(".table-accordion");
  const firstBtn = firstItem.querySelector("[data-button='more']");
  if (firstAccordion) requestAnimationFrame(() => requestAnimationFrame(() => open(firstAccordion, firstBtn)));

  items.forEach((item) => {
    const accordion = item.querySelector(".table-accordion");
    const btn = item.querySelector("[data-button='more']");
    if (!accordion || !btn) return;

    btn.addEventListener("click", () => {
      if (current && current !== accordion) close(current, currentBtn);
      accordion === current ? close(accordion, btn) : open(accordion, btn);
    });
  });
}

export function initLightbox() {
  const items = [...document.querySelectorAll(".table-img-item")];
  if (!items.length) return;

  const overlay = document.querySelector(".overlay");
  if (!overlay) return;

  // Img sits above the overlay
  const img = document.createElement("img");
  img.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-height:80dvh;max-width:80vw;object-fit:contain;opacity:0;transition:opacity 300ms ease;cursor:pointer;z-index:9999;pointer-events:none;";
  document.body.appendChild(img);

  function open(src) {
    img.style.opacity = "0";
    img.src = src;
    img.style.pointerEvents = "auto";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    overlay.style.cursor = "pointer";
    img.onload = () => requestAnimationFrame(() => (img.style.opacity = "1"));
    lockScroll();
  }

  function close() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.cursor = "";
    img.style.opacity = "0";
    img.style.pointerEvents = "none";
    unlockScroll();
  }

  items.forEach((item) => {
    const tableImg = item.querySelector(".table-img");
    if (!tableImg) return;
    const src = tableImg.src || tableImg.getAttribute("src") || tableImg.style.backgroundImage?.match(/url\(["']?(.+?)["']?\)/)?.[1];
    if (!src) return;
    item.style.cursor = "pointer";
    item.addEventListener("click", () => open(src));
  });

  overlay.addEventListener("click", close);
  img.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

export function initImgFadeIn() {
  document.querySelectorAll("img:not(.video-poster)").forEach((img) => {
    if (img.dataset.fadeInit) return;
    img.dataset.fadeInit = "1";
    if (img.complete && img.naturalWidth > 0) {
      img.style.opacity = "1";
      return;
    }
    img.addEventListener("load", () => (img.style.opacity = "1"), { once: true });
    img.addEventListener("error", () => (img.style.opacity = "1"), { once: true });
  });
}

const NEXT_IMG_FOLLOW_LERP = 0.1; // 0-1 : plus petit = plus d'inertie, 1 = suivi instantané

export function initNextPage() {
  const nextPage = document.querySelector(".next-page");
  if (!nextPage) return;

  const imgItems = [...nextPage.querySelectorAll(".next-img-item")];
  const textItems = [...nextPage.querySelectorAll(".next-text-item")];

  function getSection(item) {
    return item.querySelector("[nav-section]")?.getAttribute("nav-section");
  }

  function isCurrentPage(item) {
    const href = item.querySelector("[nav-section]")?.getAttribute("href");
    if (!href) return false;
    const pathname = new URL(href, location.origin).pathname;
    return pathname === location.pathname;
  }

  [...imgItems, ...textItems].forEach((item) => {
    if (isCurrentPage(item)) item.style.display = "none";
  });

  function onEnter(activeSection) {
    imgItems.forEach((item) => {
      item.style.opacity = getSection(item) === activeSection ? "" : "0.1";
    });
    textItems.forEach((item) => {
      item.style.opacity = getSection(item) === activeSection ? "" : "0.35";
    });
  }

  function onLeave() {
    imgItems.forEach((item) => (item.style.opacity = ""));
    textItems.forEach((item) => (item.style.opacity = ""));
  }

  [...imgItems, ...textItems].forEach((item) => {
    item.addEventListener("mouseenter", () => onEnter(getSection(item)));
    item.addEventListener("mouseleave", onLeave);
  });

  // La .next-img de l'item survolé suit le curseur en son centre, agrandie à
  // 40dvh — et reprend immédiatement (sans transition) sa position/taille
  // d'origine dès qu'on quitte l'item.
  imgItems.forEach((item) => {
    // Base commune : l'item survolé repasse à 0 (cf. plus bas), donc ses
    // voisins doivent être au-dessus pour ne jamais être recouverts par
    // l'image agrandie qui déborde de son item d'origine.
    item.style.zIndex = "1";

    const img = item.querySelector(".next-img");
    if (!img) return;

    let halfWidth = 0;
    let halfHeight = 0;
    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    let rafId = null;

    function apply() {
      current.x += (target.x - current.x) * NEXT_IMG_FOLLOW_LERP;
      current.y += (target.y - current.y) * NEXT_IMG_FOLLOW_LERP;
      img.style.left = `${current.x - halfWidth}px`;
      img.style.top = `${current.y - halfHeight}px`;
      rafId = requestAnimationFrame(apply);
    }

    function targetFromEvent(e) {
      const itemRect = item.getBoundingClientRect();
      target = { x: e.clientX - itemRect.left, y: e.clientY - itemRect.top };
    }

    item.addEventListener("mouseenter", (e) => {
      const itemRect = item.getBoundingClientRect();

      // Verrouille la hauteur d'origine du container : l'image peut grandir
      // et déborder visuellement, mais l'item ne grandit pas avec elle (pas
      // de saut de mise en page, et la zone de survol reste celle d'origine).
      item.style.height = itemRect.height + "px";
      item.style.zIndex = "0";
      if (getComputedStyle(item).position === "static") item.style.position = "relative";

      // Bascule en absolute sans saut visuel : on fige d'abord sa position
      // actuelle (relative à l'item), puis seulement ensuite on l'agrandit —
      // comme ça .next-img-item et ses voisins ne bougent jamais.
      const imgRect = img.getBoundingClientRect();
      img.style.position = "absolute";
      img.style.margin = "0";
      img.style.left = `${imgRect.left - itemRect.left}px`;
      img.style.top = `${imgRect.top - itemRect.top}px`;
      img.style.pointerEvents = "none";
      img.style.height = "50dvh";
      img.style.width = "auto";

      const newRect = img.getBoundingClientRect();
      halfWidth = newRect.width / 2;
      halfHeight = newRect.height / 2;

      // Premier positionnement instantané, pile sur le curseur à l'entrée
      // (current = target) — l'inertie ne s'applique qu'aux mouvements
      // suivants, pas à cette mise en place initiale.
      target = { x: e.clientX - itemRect.left, y: e.clientY - itemRect.top };
      current = { ...target };
      img.style.left = `${current.x - halfWidth}px`;
      img.style.top = `${current.y - halfHeight}px`;

      item.addEventListener("mousemove", targetFromEvent);
      rafId = requestAnimationFrame(apply);
    });

    item.addEventListener("mouseleave", () => {
      item.removeEventListener("mousemove", targetFromEvent);
      cancelAnimationFrame(rafId);
      rafId = null;
      img.style.position = "";
      img.style.margin = "";
      img.style.left = "";
      img.style.top = "";
      img.style.height = "";
      img.style.width = "";
      img.style.pointerEvents = "";
      item.style.height = "";
      item.style.zIndex = "1";
    });
  });
}
