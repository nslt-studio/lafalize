import EmblaCarousel from "embla-carousel";
import AutoScroll from "embla-carousel-auto-scroll";
import { initTabs, initCollectionPopup } from "./utils.js";

const EMBLA_AUTOSCROLL_SPEED = 1; // px par tick — vitesse de base du défilement continu

export function initAbout() {
  initCollectionPopup();
  document.querySelectorAll("[wine-index]").forEach((el, i) => {
    el.textContent = i + 1;
  });
  initSliders();
  initTabs({ infoAttr: "data-info-tab" });
  initThumbSlider();
  initEmblaCarousel();
}

let emblaApi = null;

function initEmblaCarousel() {
  // Détruit toute instance précédente avant d'en recréer une (page revisitée,
  // transition Swup...) pour ne jamais avoir deux carrousels actifs en même
  // temps sur le même élément.
  emblaApi?.destroy();
  emblaApi = null;

  // Embla s'initialise sur le viewport (overflow hidden), dont l'enfant
  // direct doit être le container — pas le wrapper .embla englobant.
  const viewport = document.querySelector(".embla .embla__viewport");
  if (!viewport) return;

  const container = viewport.querySelector(".embla__container");
  if (!container) return;

  // Retire d'éventuels clones ajoutés lors d'une précédente init (au cas où
  // ce DOM ne serait pas recréé à chaque transition Swup).
  container.querySelectorAll("[data-embla-clone]").forEach((el) => el.remove());

  // Le loop natif d'Embla ne reste parfaitement infini (y compris pendant un
  // grab rapide/répété) que s'il y a assez de largeur totale de slides —
  // avec seulement 5 slides ça peut ne pas suffire. On duplique le contenu
  // jusqu'à couvrir au moins 3x la largeur du viewport, pour ne jamais
  // "tomber à court" de clones pendant le drag.
  const originalSlides = [...container.children];
  let guard = 0;
  while (originalSlides.length && container.scrollWidth < viewport.clientWidth * 3 && guard < 10) {
    originalSlides.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute("data-embla-clone", "");
      container.appendChild(clone);
    });
    guard++;
  }

  viewport.style.cursor = "grab";

  emblaApi = EmblaCarousel(
    viewport,
    {
      loop: true,
      align: "start",
      watchDrag: true,
      dragFree: true, // pas de snap sur une slide : le relâchement garde l'inertie/la vitesse du geste, avec décélération naturelle
    },
    [
      AutoScroll({
        speed: EMBLA_AUTOSCROLL_SPEED,
        startDelay: 0, // démarre tout de suite, sans pause
        stopOnInteraction: false, // reprend le défilement continu après un grab
      }),
    ]
  );

  emblaApi.on("pointerDown", () => { viewport.style.cursor = "grabbing"; });
  emblaApi.on("pointerUp", () => { viewport.style.cursor = "grab"; });
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
