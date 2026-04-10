import { initNextPage, initTabs } from "./utils.js";

export function initAbout() {
  initNextPage();
  document.querySelectorAll("[wine-index]").forEach((el, i) => {
    el.textContent = i + 1;
  });
  initSliders();
  initTabs({ infoAttr: "data-info-tab" });
}

function initSliders() {
  document.querySelectorAll(".section").forEach((section) => {
    const sliderItems = [...section.querySelectorAll(".slider-img .slider-img-inner")];
    const thumbItems = [...section.querySelectorAll(".thumb-img .thumb-img-inner")];
    if (!thumbItems.length || !sliderItems.length) return;

    let current = 0;
    let isUserInteracting = false;
    let interactionTimeout;

    function goTo(index) {
      thumbItems.forEach((t) => t.classList.remove("active"));
      sliderItems.forEach((s) => s.classList.remove("active"));
      thumbItems[index].classList.add("active");
      sliderItems[index]?.classList.add("active");
      current = index;
    }

    thumbItems.forEach((thumb, index) => {
      thumb.addEventListener("click", () => {
        isUserInteracting = true;
        clearTimeout(interactionTimeout);
        goTo(index);
        interactionTimeout = setTimeout(() => (isUserInteracting = false), 3000);
      });
    });

    setInterval(() => {
      if (!isUserInteracting) goTo((current + 1) % sliderItems.length);
    }, 3000);
  });
}
