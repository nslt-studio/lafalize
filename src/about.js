import { initTabs, initCollectionPopup } from "./utils.js";

export function initAbout() {
  initCollectionPopup();
  document.querySelectorAll("[wine-index]").forEach((el, i) => {
    el.textContent = i + 1;
  });
  initSliders();
  initTabs({ infoAttr: "data-info-tab" });
  initThumbSlider();
}

function initThumbSlider() {
  const sliderItems = [...document.querySelectorAll(".slider-img-item")];
  const popupBtns = [...document.querySelectorAll(".thumb-txt-item [data-popup]")];
  if (!sliderItems.length || !popupBtns.length) return;

  // Activate first by default
  sliderItems[0]?.querySelector(".slider-img-inner")?.classList.add("active");
  popupBtns[0]?.classList.add("active");

  popupBtns.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      const id = btn.getAttribute("data-popup");
      sliderItems.forEach((item) => item.querySelector(".slider-img-inner")?.classList.remove("active"));
      popupBtns.forEach((b) => b.classList.remove("active"));
      document.querySelector(`.slider-img-item[data-slider="${id}"] .slider-img-inner`)?.classList.add("active");
      btn.classList.add("active");
    });
  });
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
