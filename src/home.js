export function initHome() {
  const heroes = [...document.querySelectorAll("[data-hero]")];
  if (!heroes.length) return;

  let current = heroes.findIndex((h) => h.classList.contains("active"));
  if (current === -1) current = 0;

  function showHero(index) {
    heroes.forEach((h) => h.classList.remove("active"));
    heroes[index].classList.add("active");
    current = index;
  }

  setInterval(() => {
    showHero((current + 1) % heroes.length);
  }, 3000);
}
