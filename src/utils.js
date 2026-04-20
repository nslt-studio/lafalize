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

  function openAccordion(btn) {
    const accordion = btn.nextElementSibling;
    if (!accordion?.classList.contains("tab-info-accordion")) return;
    const inner = accordion.querySelector(".tab-info-inner");
    accordion.style.maxHeight = inner ? inner.scrollHeight + "px" : "0px";
    btn.classList.add("active");
  }

  function closeAccordion(btn) {
    const accordion = btn.nextElementSibling;
    if (!accordion?.classList.contains("tab-info-accordion")) return;
    accordion.style.maxHeight = "0px";
    btn.classList.remove("active");
  }

  function initAccordion(infoTab) {
    if (infoTab.dataset.accordionInit) return;
    infoTab.dataset.accordionInit = "1";
    const btns = [...infoTab.querySelectorAll("[data-info]")];
    if (!btns.length) return;
    function activateBtn(activeBtn) {
      btns.forEach((b) => (b === activeBtn ? openAccordion(b) : closeAccordion(b)));
    }
    activateBtn(btns[0]);
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!btn.classList.contains("active")) activateBtn(btn);
      });
    });
  }

  function openPopup(tabId) {
    popup.style.transform = "translateX(0%)";
    popup.style.pointerEvents = "auto";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    document.body.style.overflow = "hidden";
    switchTab(tabId);
  }

  function closePopup() {
    popup.style.transform = "translateX(100%)";
    popup.style.pointerEvents = "none";
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    document.body.style.overflow = "";
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

export function initTableAccordion() {
  const items = [...document.querySelectorAll(".table-list .table-item")];
  if (!items.length) return;

  let current = null;
  let currentBtn = null;

  function open(accordion, btn) {
    const inner = accordion.querySelector(".table-accordion-inner");
    accordion.style.maxHeight = inner ? inner.scrollHeight + "px" : "";
    if (btn) btn.textContent = "Lire moins";
    current = accordion;
    currentBtn = btn;
  }

  function close(accordion, btn) {
    accordion.style.maxHeight = "";
    if (btn) btn.textContent = "Lire Plus";
    if (current === accordion) { current = null; currentBtn = null; }
  }

  // Open first item by default
  const firstItem = items[0];
  const firstAccordion = firstItem.querySelector(".table-accordion");
  const firstBtn = firstItem.querySelector("[data-button='more']");
  if (firstAccordion) open(firstAccordion, firstBtn);

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
      item.style.filter = getSection(item) === activeSection ? "" : "grayscale(100%)";
    });
    textItems.forEach((item) => {
      item.style.opacity = getSection(item) === activeSection ? "" : "0.35";
    });
  }

  function onLeave() {
    imgItems.forEach((item) => (item.style.filter = ""));
    textItems.forEach((item) => (item.style.opacity = ""));
  }

  [...imgItems, ...textItems].forEach((item) => {
    item.addEventListener("mouseenter", () => onEnter(getSection(item)));
    item.addEventListener("mouseleave", onLeave);
  });
}
