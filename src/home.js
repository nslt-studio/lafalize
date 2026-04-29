export function initHome() {
  const imgs = [...document.querySelectorAll(".hero-item .hero-img")];
  if (!imgs.length) return;

  let current = 0;

  function showImg(index) {
    imgs.forEach((img, i) => (img.style.opacity = i === index ? "1" : "0"));
    current = index;
  }

  showImg(0);

  if (window.innerWidth > 992) {
    document.querySelectorAll(".main-link").forEach((link) => {
      link.addEventListener("mouseenter", () => {
        showImg((current + 1) % imgs.length);
      });
    });
  } else {
    document.addEventListener("click", () => {
      showImg((current + 1) % imgs.length);
    });
  }
}
