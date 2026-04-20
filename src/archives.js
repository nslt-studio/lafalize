import { initTableAccordion } from "./utils.js";

export function initArchivesPage() {
  initTableAccordion();
  initLightbox();
}

function initLightbox() {
  const items = [...document.querySelectorAll(".table-img-item")];
  if (!items.length) return;

  const overlay = document.querySelector(".overlay");
  if (!overlay) return;

  // Img sits above the overlay
  const img = document.createElement("img");
  img.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-height:80dvh;max-width:80vw;object-fit:contain;opacity:0;transition:opacity 300ms ease;cursor:zoom-out;z-index:9999;pointer-events:none;";
  document.body.appendChild(img);

  function open(src) {
    img.style.opacity = "0";
    img.src = src;
    img.style.pointerEvents = "auto";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    overlay.style.cursor = "zoom-out";
    img.onload = () => requestAnimationFrame(() => (img.style.opacity = "1"));
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.cursor = "";
    img.style.opacity = "0";
    img.style.pointerEvents = "none";
    document.body.style.overflow = "";
  }

  items.forEach((item) => {
    const tableImg = item.querySelector(".table-img");
    if (!tableImg) return;
    const src = tableImg.src || tableImg.getAttribute("src") || tableImg.style.backgroundImage?.match(/url\(["']?(.+?)["']?\)/)?.[1];
    if (!src) return;
    item.style.cursor = "zoom-in";
    item.addEventListener("click", () => open(src));
  });

  overlay.addEventListener("click", close);
  img.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}
