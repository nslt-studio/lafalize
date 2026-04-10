export function initTabs({ tabAttr = "data-tab", infoAttr = "data-tab-info", fadeDuration = 150 } = {}) {
  const tabs = [...document.querySelectorAll(`[${tabAttr}]`)];
  const infos = [...document.querySelectorAll(`[${infoAttr}]`)];

  if (!tabs.length || !infos.length) return;

  // Hide all initially
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

  // Activate first tab
  switchTab(tabs[0].getAttribute(tabAttr));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.getAttribute(tabAttr)));
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
