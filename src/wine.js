import { initNextPage } from "./utils.js";

export function initWine() {
  initNextPage();
  document.querySelectorAll("[wine-index]").forEach((el, i) => {
    el.textContent = i + 1;
  });
  const overlay = document.querySelector(".overlay");
  const popup = document.querySelector(".wine-popup");
  if (!popup || !overlay) return;

  function switchTab(tabId) {
    const currentInfo = popup.querySelector("[data-info-tab].active");
    const nextInfo = popup.querySelector(`[data-info-tab="${tabId}"]`);

    // Toggle .active on tabs
    popup.querySelectorAll("[data-tab]").forEach((t) => t.classList.remove("active"));
    popup.querySelector(`[data-tab="${tabId}"]`)?.classList.add("active");

    if (currentInfo === nextInfo) return;

    // Fade out current, then swap
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

  function showInfo(el) {
    if (!el) return;
    el.style.display = "block";
    el.classList.add("active");
    requestAnimationFrame(() => {
      el.style.opacity = "1";
    });
    initAccordion(el);
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

    // Reset tabs state
    setTimeout(() => {
      popup.querySelectorAll("[data-tab]").forEach((t) => t.classList.remove("active"));
      popup.querySelectorAll("[data-info-tab]").forEach((el) => {
        el.style.opacity = "0";
        el.style.display = "none";
        el.classList.remove("active");
      });
    }, 300);
  }

  // Open on wine-button click
  document.querySelectorAll(".wine-button").forEach((btn) => {
    btn.addEventListener("click", () => openPopup(btn.id));
  });

  // Tab clicks inside popup
  popup.querySelectorAll("[data-tab]").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.getAttribute("data-tab")));
  });

  // Close on close-button
  popup.querySelector(".close-button")?.addEventListener("click", closePopup);

  // Close on overlay click
  overlay.addEventListener("click", closePopup);

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });
}
