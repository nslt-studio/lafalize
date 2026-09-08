const VIMEO_TOKEN = "c9496452bd623b32565ddf7e6973d68c";
const VIMEO_RENDITION = "1080p"; // '1080p' | '540p' | '360p'
const VIMEO_TARGET_WIDTH = 640; // 295 | 640 | 960 | 1280

async function loadHeroVideos(items) {
  const ids = [...new Set(items.map((el) => el.getAttribute("vimeo-id")).filter(Boolean))];
  if (!ids.length) return;

  const results = await Promise.allSettled(
    ids.map((id) =>
      fetch(`https://api.vimeo.com/videos/${id}?fields=pictures,files`, {
        headers: { Authorization: `Bearer ${VIMEO_TOKEN}` },
      })
        .then((r) => {
          if (!r.ok) {
            console.warn(`Vimeo API error ${r.status} pour la vidéo ${id}`);
            return { id, data: {} };
          }
          return r.json().then((data) => ({ id, data }));
        })
        .catch((err) => {
          console.warn(`Fetch échoué pour ${id}:`, err);
          return { id, data: {} };
        })
    )
  );

  const cache = {};
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    const { id, data } = result.value;

    // Poster — taille optimale
    const sizes = data.pictures?.sizes ?? [];
    const bestSize = sizes.find((s) => s.width >= VIMEO_TARGET_WIDTH) ?? sizes[sizes.length - 1];
    const poster = bestSize?.link ?? "";
    const width = bestSize?.width ?? 16;
    const height = bestSize?.height ?? 9;

    // Progressive link
    const files = data.files ?? [];
    const file = files.find((f) => f.rendition === VIMEO_RENDITION) ?? files.find((f) => f.quality === "hd") ?? files[0];
    const mp4 = file?.link ?? "";

    cache[id] = { poster, mp4, width, height };
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const wrapper = entry.target;
        const id = wrapper.getAttribute("vimeo-id");
        const assets = cache[id];
        if (!assets) return;

        // Poster — fade in une fois chargée (transition déjà définie sur .img dans Webflow)
        const img = wrapper.querySelector(".video-poster");
        if (img && assets.poster) {
          img.onload = () => (img.style.opacity = "1");
          img.src = assets.poster;
        }

        // Vidéo
        const video = wrapper.querySelector("video");
        const source = video?.querySelector("source[data-src]");
        if (source && assets.mp4 && !source.src) {
          source.src = assets.mp4;
          video.load();
          video.play()
            .then(() => { video.style.opacity = 1; })
            .catch(() => { video.style.opacity = 1; });
        }

        obs.unobserve(wrapper);
      });
    },
    { rootMargin: "300px" }
  );

  items.forEach((el) => observer.observe(el));
}

export function initHome() {
  const items = [...document.querySelectorAll(".hero .hero-video[vimeo-id]")];
  if (!items.length) return;

  loadHeroVideos(items);

  let current = 0;

  function showItem(index) {
    items.forEach((item, i) => {
      const isActive = i === index;
      item.style.opacity = isActive ? "1" : "0";
      const video = item.querySelector("video");
      if (!video) return;
      if (isActive) video.play().catch(() => {});
      else video.pause();
    });
    current = index;
  }

  showItem(0);

  if (window.innerWidth > 992) {
    document.querySelectorAll(".main-link").forEach((link) => {
      link.addEventListener("mouseenter", () => {
        showItem((current + 1) % items.length);
      });
    });
  } else {
    document.addEventListener("click", () => {
      showItem((current + 1) % items.length);
    });
  }
}
