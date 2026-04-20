import { initCollectionPopup } from "./utils.js";

export function initWine() {
  initCollectionPopup();
  document.querySelectorAll("[wine-index]").forEach((el, i) => {
    el.textContent = i + 1;
  });
}
