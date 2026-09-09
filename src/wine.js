import { initCollectionPopup, initAccordion } from "./utils.js";

export function initWine() {
  initCollectionPopup();
  document.querySelectorAll("[wine-index]").forEach((el, i) => {
    el.textContent = i + 1;
  });
  document.querySelectorAll(".wine-list .wine-item").forEach((item) => initAccordion(item));
  initWineDescriptions();
}

const WINE_DESCRIPTION_IDLE_OPACITY = 0.1;
let wineDescriptionObserver = null;

function initWineDescriptions() {
  // Détruit l'observer d'une précédente init avant d'en recréer un (page
  // revisitée, transition Swup...) pour ne jamais en avoir deux actifs.
  wineDescriptionObserver?.disconnect();
  wineDescriptionObserver = null;

  const items = [...document.querySelectorAll(".wine-list .wine-item")];
  if (!items.length) return;

  function descriptionOf(item) {
    return item.querySelector("[data-description]");
  }

  function setActive(activeItem) {
    items.forEach((item) => {
      const desc = descriptionOf(item);
      if (desc) desc.style.opacity = item === activeItem ? "1" : String(WINE_DESCRIPTION_IDLE_OPACITY);
    });
  }

  // En haut de page, avant tout scroll : le premier wine-item est actif.
  setActive(items[0]);

  // "Atteint 50% du viewport" : on réduit la zone d'intersection à une ligne
  // fine au centre vertical de l'écran (rootMargin -50%/-50%) — un wine-item
  // devient actif exactement quand il croise cette ligne.
  wineDescriptionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target);
      });
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
  );
  items.forEach((item) => wineDescriptionObserver.observe(item));
}
